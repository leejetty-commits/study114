<?php

declare(strict_types=1);

namespace Study114\Paid;

use DateTimeImmutable;
use InvalidArgumentException;
use PDO;
use RuntimeException;
use Study114\Database\Connection;

/**
 * 326+326b — 쪽지권 환불 신청 · 자동승인(PG HOLD) · 철회(본인확인) · 관리자 차단
 *
 * 정본: docs/ssot/18c-memo-ticket-refund-lock.md
 * MemoTicketRefundCalculator(324)는 순수 계산만 — 이 클래스가 DB 트랜잭션·동결을 담당.
 */
final class RefundService
{
    /** 철회 시 본인확인 문구 — 기존 탈퇴 패턴(AccountWithdrawService) 재사용 */
    public const WITHDRAW_CONFIRM_TEXT = '환불철회';

    private PDO $pdo;
    private RefundRepository $refunds;
    private ProviderCheckoutRepository $orders;
    private ProviderTicketRepository $tickets;

    public function __construct(
        ?PDO $pdo = null,
        ?RefundRepository $refunds = null,
        ?ProviderCheckoutRepository $orders = null,
        ?ProviderTicketRepository $tickets = null,
    ) {
        $this->pdo = $pdo ?? Connection::get();
        $this->refunds = $refunds ?? new RefundRepository($this->pdo);
        $this->orders = $orders ?? new ProviderCheckoutRepository($this->pdo);
        $this->tickets = $tickets ?? new ProviderTicketRepository($this->pdo);
    }

    /* ================================================================
     *  A. 자격 확인 (GET) — 읽기 전용
     * ================================================================ */

    /**
     * @return array{
     *   eligible: bool,
     *   order_ref: string,
     *   variant: string,
     *   amount_won: int,
     *   refund_won: int,
     *   table_won: int,
     *   used_count: int,
     *   reason_code: string,
     *   already_requested: bool,
     *   message: string
     * }
     */
    public function checkEligibility(int $userId, string $orderRef): array
    {
        $order = $this->orders->getByRef($orderRef);
        if ($order === null || (int) ($order['user_id'] ?? 0) !== $userId) {
            return self::eligResult($orderRef, '', 0, false, 'not_found', '주문을 찾을 수 없습니다.');
        }

        $variant = (string) ($order['variant_label'] ?? '');
        $amountWon = (int) ($order['amount_won'] ?? 0);
        $status = (string) ($order['status'] ?? '');
        $kind = (string) ($order['product_kind'] ?? '');

        if ($kind !== 'count') {
            return self::eligResult($orderRef, $variant, $amountWon, false, 'not_count', '쪽지권(횟수권) 주문만 환불 가능합니다.');
        }

        if ($this->refunds->hasActiveRefund($orderRef)) {
            return self::eligResult($orderRef, $variant, $amountWon, false, 'already_requested', '이미 환불 신청이 진행 중입니다.', true);
        }

        /* 326b: 철회 이력이 있으면 재환불 차단 */
        if ($this->refunds->hasWithdrawnRefund($orderRef)) {
            return self::eligResult($orderRef, $variant, $amountWon, false, 'withdrawn_no_rerefund', self::denyMessage('withdrawn_no_rerefund'));
        }

        if ($status === 'refunded') {
            return self::eligResult($orderRef, $variant, $amountWon, false, 'already_refunded', '이미 환불된 주문입니다.');
        }

        if ($status !== 'paid') {
            return self::eligResult($orderRef, $variant, $amountWon, false, 'not_paid', '결제 완료 상태가 아닙니다.');
        }

        $pack = $this->findPackForOrder($order);
        $calc = MemoTicketRefundCalculator::calculate(
            $this->buildCalcInput($order, $pack),
            $this->now(),
        );

        $message = $calc['refundable']
            ? sprintf('환불 가능: %s원', number_format($calc['refund_won']))
            : self::denyMessage($calc['reason_code']);

        return [
            'eligible' => $calc['refundable'],
            'order_ref' => $orderRef,
            'variant' => $variant,
            'amount_won' => $amountWon,
            'refund_won' => $calc['refund_won'],
            'table_won' => $calc['table_won'],
            'used_count' => $calc['used_count'],
            'reason_code' => $calc['reason_code'],
            'already_requested' => false,
            'message' => $message,
        ];
    }

    /* ================================================================
     *  B. 환불 신청 (POST) — 트랜잭션 + 동결 + 자동승인
     * ================================================================ */

    /**
     * @param array{reason_choice?: string, detail?: string} $reason
     * @return array{ok: bool, refund_id: int, refund_won: int, status: string, message: string}
     */
    public function submit(int $userId, string $orderRef, array $reason = []): array
    {
        $this->pdo->beginTransaction();
        try {
            $order = $this->orders->getByRefForUpdate($orderRef);
            if ($order === null || (int) ($order['user_id'] ?? 0) !== $userId) {
                throw new InvalidArgumentException('주문을 찾을 수 없습니다.');
            }

            $status = (string) ($order['status'] ?? '');
            $kind = (string) ($order['product_kind'] ?? '');

            if ($kind !== 'count') {
                throw new InvalidArgumentException('쪽지권(횟수권) 주문만 환불 가능합니다.');
            }
            if ($status !== 'paid') {
                throw new InvalidArgumentException('결제 완료 상태인 주문만 신청할 수 있습니다.');
            }

            $existing = $this->refunds->findByOrderRefForUpdate($orderRef);
            if ($existing !== null && in_array($existing['status'], ['requested', 'approved'], true)) {
                throw new PaidConflictException('이미 환불 신청이 진행 중입니다.');
            }

            /* 326b: 철회 이력 재환불 차단 — UNIQUE 충돌에 의존하지 않고 명시 조회 */
            if ($this->refunds->hasWithdrawnRefund($orderRef)) {
                throw new InvalidArgumentException(self::denyMessage('withdrawn_no_rerefund'));
            }

            $pack = $this->findPackForOrder($order);
            $calc = MemoTicketRefundCalculator::calculate(
                $this->buildCalcInput($order, $pack),
                $this->now(),
            );

            if (!$calc['refundable']) {
                throw new InvalidArgumentException(self::denyMessage($calc['reason_code']));
            }

            $frozenRemaining = 0;
            if ($pack !== null) {
                $frozenRemaining = (int) ($pack['remaining'] ?? 0);
                $this->freezePack((int) $pack['id']);
            }

            $reasonText = json_encode([
                'frozen_remaining' => $frozenRemaining,
                'used_count' => $calc['used_count'],
                'reason_choice' => trim($reason['reason_choice'] ?? ''),
                'detail' => trim($reason['detail'] ?? ''),
            ], JSON_UNESCAPED_UNICODE);

            $variant = (string) ($order['variant_label'] ?? '');
            $amountWon = (int) ($order['amount_won'] ?? 0);

            try {
                $refundId = $this->refunds->insert([
                    'order_ref' => $orderRef,
                    'user_id' => $userId,
                    'product_kind' => 'count',
                    'variant' => $variant,
                    'amount_won' => $amountWon,
                    'table_won' => $calc['table_won'],
                    'refund_won' => $calc['refund_won'],
                    'reason_code' => $calc['reason_code'],
                    'reason_text' => $reasonText,
                    'status' => 'requested',
                ]);
            } catch (\PDOException $e) {
                /* 326b: UNIQUE(uk_refund_order_ref) 충돌 → 사용자 문구 */
                if (str_contains($e->getMessage(), 'uk_refund_order_ref') || str_contains($e->getMessage(), 'Duplicate entry')) {
                    throw new PaidConflictException('이 주문에 대한 환불 요청이 이미 존재합니다.');
                }
                throw $e;
            }

            $this->updateOrderStatus($orderRef, 'refund_requested');

            $this->refunds->markApproved($orderRef);

            $this->pdo->commit();

            return [
                'ok' => true,
                'refund_id' => $refundId,
                'refund_won' => $calc['refund_won'],
                'status' => 'approved',
                'message' => sprintf('환불 신청 완료 (자동승인). 환불 예정액 %s원', number_format($calc['refund_won'])),
            ];
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    /* ================================================================
     *  C. 철회 (POST) — 본인확인 + 동결 해제 + 상태 복원
     * ================================================================ */

    /**
     * 326b: 철회 시 본인확인 필수 (기존 탈퇴 패턴: 확인 문구 입력)
     * @return array{ok: bool, message: string}
     */
    public function withdraw(int $userId, string $orderRef, string $confirmText = ''): array
    {
        /* 326b: 본인확인 — 확인 문구 검증 (AccountWithdrawService 패턴) */
        if (trim($confirmText) !== self::WITHDRAW_CONFIRM_TEXT) {
            throw new InvalidArgumentException(
                '본인확인이 필요합니다. 「' . self::WITHDRAW_CONFIRM_TEXT . '」을(를) 정확히 입력해 주세요.'
            );
        }

        $this->pdo->beginTransaction();
        try {
            $order = $this->orders->getByRefForUpdate($orderRef);
            if ($order === null || (int) ($order['user_id'] ?? 0) !== $userId) {
                throw new InvalidArgumentException('주문을 찾을 수 없습니다.');
            }

            $refund = $this->refunds->findByOrderRefForUpdate($orderRef);
            if ($refund === null) {
                throw new InvalidArgumentException('환불 신청 내역이 없습니다.');
            }

            $refundStatus = (string) ($refund['status'] ?? '');
            if (!in_array($refundStatus, ['requested', 'approved'], true)) {
                throw new InvalidArgumentException('철회할 수 없는 상태입니다 (' . $refundStatus . ').');
            }

            /* 326b: frozen_remaining 가드 — 파싱 실패 시 명시적 오류 (0 조용한 복원 금지) */
            $frozenRemaining = self::parseFrozenRemainingStrict($refund['reason_text'] ?? '');

            $pack = $this->findPackForOrder($order);
            if ($pack !== null && $frozenRemaining > 0) {
                $this->restorePack((int) $pack['id'], $frozenRemaining);
            }

            /* 326b: 본인확인 기록 + withdraw_linked */
            $this->refunds->markCancelledWithIdentity($orderRef, 'confirm_text');
            $this->updateOrderStatus($orderRef, 'paid');

            $this->pdo->commit();

            return [
                'ok' => true,
                'message' => '환불 신청이 철회되었습니다. 쪽지권이 복원됩니다.',
            ];
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    /* ================================================================
     *  D. 관리자 차단 확인
     * ================================================================ */

    /**
     * 326b: source_order_ref 컬럼 없어도 깨지지 않는 fallback
     */
    public function isPackBlockedByRefund(int $packId): bool
    {
        $orderRef = $this->resolveOrderRefForPack($packId);
        if ($orderRef === null) {
            return false;
        }

        return $this->refunds->hasActiveRefund($orderRef);
    }

    /* ================================================================
     *  공용 헬퍼: pack ↔ order 연결
     * ================================================================ */

    /**
     * pack ID → order_ref 찾기 (source_order_ref 우선, 없으면 user_id+variant fallback)
     */
    private function resolveOrderRefForPack(int $packId): ?string
    {
        if ($this->columnExists('provider_ticket_packs', 'source_order_ref')) {
            $stmt = $this->pdo->prepare(
                "SELECT source_order_ref FROM provider_ticket_packs WHERE id = ? AND source_order_ref IS NOT NULL AND source_order_ref != '' LIMIT 1"
            );
            $stmt->execute([$packId]);
            $ref = $stmt->fetchColumn();
            if ($ref !== false && $ref !== '' && $ref !== null) {
                return (string) $ref;
            }
        }

        /* fallback: pack → (user_id, pack_size) → variant → 주문 매칭 */
        $stmt = $this->pdo->prepare(
            'SELECT user_id, pack_size FROM provider_ticket_packs WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$packId]);
        $pack = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($pack)) {
            return null;
        }

        $userId = (int) ($pack['user_id'] ?? 0);
        $packSize = (int) ($pack['pack_size'] ?? 0);
        $variant = self::packSizeToVariant($packSize);
        if ($variant === '' || $userId <= 0) {
            return null;
        }

        $stmt = $this->pdo->prepare(
            "SELECT order_ref FROM provider_payment_orders
             WHERE user_id = ? AND variant_label = ? AND product_kind = 'count' AND status IN ('paid', 'refund_requested')
             ORDER BY paid_at DESC, id DESC
             LIMIT 1"
        );
        $stmt->execute([$userId, $variant]);
        $ref = $stmt->fetchColumn();

        return ($ref !== false && $ref !== null) ? (string) $ref : null;
    }

    /**
     * 주문에 연결된 팩 찾기 (source_order_ref 또는 user_id + variant 매칭)
     * @return array<string, mixed>|null
     */
    private function findPackForOrder(array $order): ?array
    {
        $orderRef = (string) ($order['order_ref'] ?? '');
        $userId = (int) ($order['user_id'] ?? 0);
        $variant = (string) ($order['variant_label'] ?? '');

        if ($this->columnExists('provider_ticket_packs', 'source_order_ref')) {
            $stmt = $this->pdo->prepare(
                "SELECT id, remaining, pack_size, expires_at FROM provider_ticket_packs
                 WHERE source_order_ref = ? AND ticket_type = 'memo'
                 LIMIT 1 FOR UPDATE"
            );
            $stmt->execute([$orderRef]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (is_array($row)) {
                return $row;
            }
        }

        $packSize = self::variantToPackSize($variant);
        if ($packSize > 0) {
            $stmt = $this->pdo->prepare(
                "SELECT id, remaining, pack_size, expires_at FROM provider_ticket_packs
                 WHERE user_id = ? AND ticket_type = 'memo' AND pack_size = ?
                 ORDER BY expires_at ASC, id ASC
                 LIMIT 1 FOR UPDATE"
            );
            $stmt->execute([$userId, $packSize]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (is_array($row)) {
                return $row;
            }
        }

        return null;
    }

    /* ================================================================
     *  내부 헬퍼
     * ================================================================ */

    /** @return array<string, mixed> */
    private function buildCalcInput(array $order, ?array $pack): array
    {
        $input = [
            'variant' => (string) ($order['variant_label'] ?? ''),
            'order_status' => (string) ($order['status'] ?? ''),
            'amount_won' => (int) ($order['amount_won'] ?? 0),
            'paid_at' => (string) ($order['paid_at'] ?? ''),
        ];
        if ($pack !== null) {
            $input['pack_size'] = (int) ($pack['pack_size'] ?? 0);
            $input['remaining'] = (int) ($pack['remaining'] ?? 0);
            $input['expires_at'] = (string) ($pack['expires_at'] ?? '');
        }

        return $input;
    }

    private function freezePack(int $packId): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE provider_ticket_packs SET remaining = 0 WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$packId]);
    }

    private function restorePack(int $packId, int $remaining): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE provider_ticket_packs SET remaining = ? WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$remaining, $packId]);
    }

    private function updateOrderStatus(string $orderRef, string $status): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE provider_payment_orders SET status = ? WHERE order_ref = ? LIMIT 1'
        );
        $stmt->execute([$status, $orderRef]);
    }

    /**
     * 326b: frozen_remaining 파싱 — 실패 시 명시적 오류 (0 조용한 복원 금지)
     * @throws RuntimeException JSON 파싱 실패·필드 누락
     */
    private static function parseFrozenRemainingStrict(string $reasonText): int
    {
        if ($reasonText === '') {
            throw new RuntimeException('환불 요청의 reason_text가 비어 있습니다. 쪽지권 복원을 중단합니다.');
        }
        $data = json_decode($reasonText, true);
        if (!is_array($data)) {
            throw new RuntimeException('환불 요청의 reason_text JSON 파싱에 실패했습니다. 쪽지권 복원을 중단합니다.');
        }
        if (!array_key_exists('frozen_remaining', $data)) {
            throw new RuntimeException('환불 요청의 reason_text에 frozen_remaining 필드가 없습니다. 쪽지권 복원을 중단합니다.');
        }
        $value = (int) $data['frozen_remaining'];
        if ($value < 0) {
            throw new RuntimeException('frozen_remaining 값이 음수입니다 (' . $value . '). 쪽지권 복원을 중단합니다.');
        }

        return $value;
    }

    private static function variantToPackSize(string $variant): int
    {
        return match ($variant) {
            '5회권', '5회' => 5,
            '10회권', '10회' => 10,
            default => 0,
        };
    }

    private static function packSizeToVariant(int $packSize): string
    {
        return match ($packSize) {
            5 => '5회권',
            10 => '10회권',
            default => '',
        };
    }

    private static function denyMessage(string $reasonCode): string
    {
        return match ($reasonCode) {
            'over_7days' => '결제 후 7일이 경과하여 환불할 수 없습니다.',
            'expired' => '사용기한이 만료되어 환불할 수 없습니다.',
            'used_over' => '사용 구간 초과로 환불할 수 없습니다.',
            'sent' => '이미 발송된 1회 즉시권은 환불할 수 없습니다.',
            'not_paid' => '결제 완료 상태가 아닙니다.',
            'unknown_variant' => '환불 대상 상품이 아닙니다.',
            'invalid_paid_at' => '결제일 정보가 올바르지 않습니다.',
            'not_count' => '쪽지권(횟수권) 주문만 환불 가능합니다.',
            'withdrawn_no_rerefund' => '철회 처리된 결제는 다시 환불을 신청할 수 없습니다.',
            default => '환불 조건에 해당하지 않습니다.',
        };
    }

    /** @return array<string, mixed> */
    private static function eligResult(string $orderRef, string $variant, int $amountWon, bool $eligible, string $reasonCode, string $message, bool $alreadyRequested = false): array
    {
        return [
            'eligible' => $eligible,
            'order_ref' => $orderRef,
            'variant' => $variant,
            'amount_won' => $amountWon,
            'refund_won' => 0,
            'table_won' => 0,
            'used_count' => 0,
            'reason_code' => $reasonCode,
            'already_requested' => $alreadyRequested,
            'message' => $message,
        ];
    }

    private function columnExists(string $table, string $column): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
        );
        $stmt->execute([$table, $column]);

        return (bool) $stmt->fetchColumn();
    }

    private function now(): DateTimeImmutable
    {
        return new DateTimeImmutable('now', new \DateTimeZone('Asia/Seoul'));
    }
}
