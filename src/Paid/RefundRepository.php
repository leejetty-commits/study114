<?php

declare(strict_types=1);

namespace Study114\Paid;

use PDO;

/**
 * 326+326b — provider_refund_requests DB 조작
 *
 * 정본: docs/ssot/18c-memo-ticket-refund-lock.md
 */
final class RefundRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /* ── 조회 ─────────────────────────────────────────── */

    /** @return array<string, mixed>|null */
    public function findByOrderRef(string $orderRef): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM provider_refund_requests WHERE order_ref = ? LIMIT 1'
        );
        $stmt->execute([$orderRef]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    /** @return array<string, mixed>|null */
    public function findByOrderRefForUpdate(string $orderRef): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM provider_refund_requests WHERE order_ref = ? LIMIT 1 FOR UPDATE'
        );
        $stmt->execute([$orderRef]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    /**
     * 사용자별 환불 요청 목록 (최신순)
     * @return list<array<string, mixed>>
     */
    public function listByUser(int $userId, int $limit = 50): array
    {
        $limit = max(1, min(200, $limit));
        $stmt = $this->pdo->prepare(
            'SELECT * FROM provider_refund_requests
             WHERE user_id = ?
             ORDER BY requested_at DESC, id DESC
             LIMIT ' . $limit
        );
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return is_array($rows) ? $rows : [];
    }

    /**
     * 해당 주문에 활성(requested 또는 approved) 환불 요청이 있는지
     */
    public function hasActiveRefund(string $orderRef): bool
    {
        $stmt = $this->pdo->prepare(
            "SELECT 1 FROM provider_refund_requests
             WHERE order_ref = ? AND status IN ('requested', 'approved')
             LIMIT 1"
        );
        $stmt->execute([$orderRef]);

        return (bool) $stmt->fetchColumn();
    }

    /**
     * 326b: 해당 주문에 철회(withdraw_linked) 이력이 있는지 → 재환불 차단
     */
    public function hasWithdrawnRefund(string $orderRef): bool
    {
        $stmt = $this->pdo->prepare(
            "SELECT 1 FROM provider_refund_requests
             WHERE order_ref = ? AND status = 'cancelled' AND withdraw_linked = 1
             LIMIT 1"
        );
        $stmt->execute([$orderRef]);

        return (bool) $stmt->fetchColumn();
    }

    /**
     * user_id + status 기준으로 활성 환불이 있는 pack 의 order_ref 목록
     * @return list<string>
     */
    public function activeRefundOrderRefs(int $userId): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT order_ref FROM provider_refund_requests
             WHERE user_id = ? AND status IN ('requested', 'approved')
             ORDER BY requested_at DESC"
        );
        $stmt->execute([$userId]);
        $refs = $stmt->fetchAll(PDO::FETCH_COLUMN);

        return is_array($refs) ? $refs : [];
    }

    /* ── 삽입 ─────────────────────────────────────────── */

    /**
     * @param array{
     *   order_ref: string,
     *   user_id: int,
     *   product_kind: string,
     *   variant: string,
     *   amount_won: int,
     *   table_won: int,
     *   refund_won: int,
     *   reason_code: string,
     *   reason_text: string|null,
     *   status: string
     * } $data
     */
    public function insert(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO provider_refund_requests
             (order_ref, user_id, product_kind, variant, amount_won, table_won, refund_won,
              reason_code, reason_text, status, requested_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())'
        );
        $stmt->execute([
            $data['order_ref'],
            $data['user_id'],
            $data['product_kind'],
            $data['variant'],
            $data['amount_won'],
            $data['table_won'],
            $data['refund_won'],
            $data['reason_code'],
            $data['reason_text'],
            $data['status'],
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    /* ── 상태 변경 ────────────────────────────────────── */

    /**
     * requested → approved (자동승인 · dev_mock)
     */
    public function markApproved(string $orderRef): bool
    {
        $stmt = $this->pdo->prepare(
            "UPDATE provider_refund_requests
             SET status = 'approved', decided_at = NOW(), updated_at = NOW()
             WHERE order_ref = ? AND status = 'requested'
             LIMIT 1"
        );

        return $stmt->execute([$orderRef]) && $stmt->rowCount() > 0;
    }

    /**
     * 339 — portone_test 취소 성공 후 refunded 마감
     */
    public function markRefunded(string $orderRef): bool
    {
        $stmt = $this->pdo->prepare(
            "UPDATE provider_refund_requests
             SET status = 'refunded',
                 decided_at = COALESCE(decided_at, NOW()),
                 refunded_at = NOW(),
                 updated_at = NOW()
             WHERE order_ref = ? AND status IN ('requested', 'approved')
             LIMIT 1"
        );

        return $stmt->execute([$orderRef]) && $stmt->rowCount() > 0;
    }

    /**
     * requested|approved → cancelled (철회)
     */
    public function markCancelled(string $orderRef): bool
    {
        $stmt = $this->pdo->prepare(
            "UPDATE provider_refund_requests
             SET status = 'cancelled', decided_at = NOW(), updated_at = NOW()
             WHERE order_ref = ? AND status IN ('requested', 'approved')
             LIMIT 1"
        );

        return $stmt->execute([$orderRef]) && $stmt->rowCount() > 0;
    }

    /**
     * 326b: 철회 + 본인확인 기록 (identity_checked_at, identity_method, withdraw_linked)
     */
    public function markCancelledWithIdentity(string $orderRef, string $identityMethod): bool
    {
        $stmt = $this->pdo->prepare(
            "UPDATE provider_refund_requests
             SET status = 'cancelled',
                 decided_at = NOW(),
                 identity_checked_at = NOW(),
                 identity_method = ?,
                 withdraw_linked = 1,
                 updated_at = NOW()
             WHERE order_ref = ? AND status IN ('requested', 'approved')
             LIMIT 1"
        );

        return $stmt->execute([$identityMethod, $orderRef]) && $stmt->rowCount() > 0;
    }

    /**
     * 339 — 포트원 취소 메타 저장.
     * pg_cancel_id는 비어 있을 때만 첫 ID를 넣고, 이후 ID는 reason_text JSON pg_cancels[]에 누적.
     */
    public function savePgCancelMeta(
        string $orderRef,
        string $cancelId,
        ?string $cancelledAt,
        int $cancelAmountWon,
        int $remainingWon,
    ): bool {
        if (!$this->hasColumn('pg_cancel_id')) {
            return false;
        }
        $prev = $this->findByOrderRef($orderRef);
        if (!is_array($prev)) {
            return false;
        }
        $prevCancel = (int) ($prev['pg_cancel_amount_won'] ?? 0);
        $totalCancel = $prevCancel + $cancelAmountWon;
        $at = $cancelledAt;
        if (is_string($at) && $at !== '') {
            $ts = strtotime($at);
            $at = $ts !== false ? date('Y-m-d H:i:s', $ts) : null;
        } else {
            $at = null;
        }

        $reasonRaw = (string) ($prev['reason_text'] ?? '');
        $reasonData = [];
        if ($reasonRaw !== '') {
            $decoded = json_decode($reasonRaw, true);
            if (is_array($decoded)) {
                $reasonData = $decoded;
            }
        }
        $cancels = isset($reasonData['pg_cancels']) && is_array($reasonData['pg_cancels'])
            ? $reasonData['pg_cancels']
            : [];
        $cancels[] = [
            'cancel_id' => $cancelId,
            'amount_won' => $cancelAmountWon,
            'cancelled_at' => $at,
            'remaining_won' => max(0, $remainingWon),
        ];
        $reasonData['pg_cancels'] = $cancels;
        $reasonJson = json_encode($reasonData, JSON_UNESCAPED_UNICODE);

        $existingCancelId = trim((string) ($prev['pg_cancel_id'] ?? ''));
        $keepCancelId = $existingCancelId !== '' ? $existingCancelId : $cancelId;

        $stmt = $this->pdo->prepare(
            'UPDATE provider_refund_requests
             SET pg_cancel_id = ?,
                 pg_cancelled_at = COALESCE(pg_cancelled_at, ?),
                 pg_cancel_amount_won = ?,
                 pg_remaining_won = ?,
                 reason_text = ?,
                 updated_at = NOW()
             WHERE order_ref = ?
             LIMIT 1'
        );

        return $stmt->execute([
            $keepCancelId,
            $at,
            $totalCancel,
            max(0, $remainingWon),
            $reasonJson,
            $orderRef,
        ]) && $stmt->rowCount() > 0;
    }

    public function pgRemainingWon(string $orderRef, int $orderAmountWon): int
    {
        $row = $this->findByOrderRef($orderRef);
        if (is_array($row) && array_key_exists('pg_remaining_won', $row) && $row['pg_remaining_won'] !== null) {
            return max(0, (int) $row['pg_remaining_won']);
        }
        if (is_array($row) && isset($row['pg_cancel_amount_won'])) {
            return max(0, $orderAmountWon - (int) $row['pg_cancel_amount_won']);
        }

        return max(0, $orderAmountWon);
    }

    private function hasColumn(string $column): bool
    {
        static $cache = [];
        if (array_key_exists($column, $cache)) {
            return $cache[$column];
        }
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND COLUMN_NAME = ?
             LIMIT 1'
        );
        $stmt->execute(['provider_refund_requests', $column]);
        $cache[$column] = (bool) $stmt->fetchColumn();

        return $cache[$column];
    }

    /* ── 테이블 존재 확인 ─────────────────────────────── */

    public function tableExists(): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?'
        );
        $stmt->execute(['provider_refund_requests']);

        return (bool) $stmt->fetchColumn();
    }
}
