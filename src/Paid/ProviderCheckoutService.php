<?php

declare(strict_types=1);

namespace Study114\Paid;

use InvalidArgumentException;
use PDO;
use Study114\Database\Connection;
use Study114\Messages\MessagesRepository;

/**
 * 18d — dev mock PG · 주문 → 티켓/포지션/유료배지 지급
 *
 * PR-A: 금액·SKU·기간은 PaidCatalog 서버 재계산. 클라이언트 금액 무시.
 * PG는 계속 dev_mock.
 *
 * @see docs/internal/59-account-context-separation-lock.md
 */
final class ProviderCheckoutService
{
    private ProviderCheckoutRepository $orders;
    private ProviderTicketRepository $tickets;
    private PaidBadgeRepository $badges;
    private ImmediateMemoRepository $immediate;
    private PDO $pdo;

    public function __construct(
        ?ProviderCheckoutRepository $orders = null,
        ?ProviderTicketRepository $tickets = null,
        ?PaidBadgeRepository $badges = null,
        ?PDO $pdo = null,
        ?ImmediateMemoRepository $immediate = null,
    ) {
        $this->pdo = $pdo ?? Connection::get();
        $this->orders = $orders ?? new ProviderCheckoutRepository($this->pdo);
        $this->tickets = $tickets ?? new ProviderTicketRepository($this->pdo);
        $this->badges = $badges ?? new PaidBadgeRepository($this->pdo);
        $this->immediate = $immediate ?? new ImmediateMemoRepository($this->pdo);
    }

    /**
     * @param 'study_room'|'tutor'|null $providerType
     * @param array<string, mixed> $memoIntent 1회 즉시권: student_id, body, context_label, peer_display_name
     * @return array<string, mixed>
     */
    public function createOrder(
        int $userId,
        string $productId,
        string $variant,
        ?string $providerType = null,
        ?int $providerId = null,
        array $memoIntent = [],
    ): array {
        $productId = trim($productId);
        $variant = trim($variant);
        if ($productId === 'picked') {
            $productId = 'jjokjipge';
        }

        // 배지: 기간은 활성 포지션에서 상속 (클라이언트 별도 기간 선택 없음)
        $kindHint = $this->kindHint($productId);
        if ($kindHint === 'badge_addon') {
            $this->requireProviderContext($userId, $providerType, $providerId);
            /** @var 'study_room'|'tutor' $providerType */
            $this->assertBadgePurchaseAllowed($userId, $productId, $providerType, $providerId);
            $variant = $this->resolveBadgePeriodFromActivePosition(
                $userId,
                $providerType,
                $providerId,
                $variant,
            );
        }

        // 클라이언트 amount/discount/memo 는 받지 않음 — 서버 quote만 사용
        $quote = PaidCatalog::quote($productId, $variant, $providerType);
        $kind = (string) $quote['product_kind'];
        $productId = (string) $quote['product_id'];
        $variant = (string) $quote['variant_label'];

        if ($kind === 'position' || $kind === 'badge_addon') {
            $this->requireProviderContext($userId, $providerType, $providerId);
            /** @var 'study_room'|'tutor' $providerType */
            if ($kind === 'badge_addon') {
                // 위에서 이미 검증·기간 상속
            }
        } elseif ($kind === 'count') {
            $this->requireProviderContext($userId, $providerType, $providerId);
            /** @var 'study_room'|'tutor' $providerType */
            $this->assertMemoPurchaseAllowed($userId, $variant, $providerType, $providerId, $memoIntent);
        } else {
            if ($providerType !== null && $providerId !== null && $providerId > 0) {
                $this->badges->assertOwnedProvider($userId, $providerType, $providerId);
            } else {
                $providerType = null;
                $providerId = null;
            }
        }

        $orderRef = 'dev-' . bin2hex(random_bytes(8));
        $this->orders->insertPending(
            $userId,
            $orderRef,
            $productId,
            $variant,
            $kind,
            (int) $quote['amount_won'],
            $providerType,
            $providerId,
            (string) $quote['catalog_version'],
            (int) $quote['list_price_krw'],
            (int) $quote['discount_krw'],
            $quote['price_snapshot'],
        );

        if ($kind === 'count' && MemoTicketPolicy::isImmediateVariant($variant) && $providerType !== null && $providerId !== null) {
            $this->immediate->insertPending([
                'order_ref' => $orderRef,
                'user_id' => $userId,
                'provider_type' => $providerType,
                'provider_id' => $providerId,
                'student_id' => (int) $memoIntent['student_id'],
                'body' => (string) $memoIntent['body'],
                'context_label' => (string) ($memoIntent['context_label'] ?? ''),
                'peer_display_name' => (string) ($memoIntent['peer_display_name'] ?? ''),
            ]);
        }

        return [
            'order_ref' => $orderRef,
            'amount_won' => (int) $quote['amount_won'],
            'list_price_krw' => (int) $quote['list_price_krw'],
            'discount_krw' => (int) $quote['discount_krw'],
            'discount_rate' => (float) $quote['discount_rate'],
            'sale_price_krw' => (int) $quote['sale_price_krw'],
            'catalog_version' => (string) $quote['catalog_version'],
            'memo_bundle' => (int) $quote['memo_bundle'],
            'ticket_kind' => $quote['ticket_kind'],
            'status' => 'pending',
            'product_id' => $productId,
            'variant_label' => $variant,
            'product_kind' => $kind,
            'provider_type' => $providerType,
            'provider_id' => $providerId,
            'pg_provider' => 'dev_mock',
            'price_snapshot' => $quote['price_snapshot'],
        ];
    }

    private function kindHint(string $productId): string
    {
        return match ($productId) {
            'prime', 'pick' => 'position',
            'memo_ticket' => 'count',
            'hot', 'subject_track', 'jjokjipge', 'sky', 'picked' => 'badge_addon',
            default => 'unknown',
        };
    }

    /**
     * @param 'study_room'|'tutor' $providerType
     */
    private function resolveBadgePeriodFromActivePosition(
        int $userId,
        string $providerType,
        int $providerId,
        string $variant,
    ): string {
        if (PaidCatalog::isPeriod($variant)) {
            $this->assertBadgePeriodMatchesActivePosition($userId, $providerType, $providerId, $variant);

            return $variant;
        }

        $positions = $this->tickets->listActivePositions($userId, $providerType, $providerId);
        if ($positions === []) {
            throw new InvalidArgumentException('활성 프라임/픽이 없어 배지를 구매할 수 없습니다.');
        }
        usort(
            $positions,
            static fn (array $a, array $b): int => strcmp(
                (string) ($b['end_exclusive_on'] ?? ''),
                (string) ($a['end_exclusive_on'] ?? ''),
            ),
        );
        $pos = $positions[0];
        $label = PaidCatalog::periodFromDuration(
            (string) ($pos['duration_type'] ?? 'day'),
            (int) ($pos['duration_value'] ?? 0),
        );
        if ($label === null) {
            throw new InvalidArgumentException(
                '이용 중인 노출상품 기간을 카탈로그 기간으로 매핑할 수 없습니다.',
            );
        }

        return $label;
    }

    /**
     * @return array{orders: list<array<string, mixed>>}
     */
    public function listOrders(int $userId, int $limit = 50): array
    {
        $rows = $this->orders->listByUser($userId, $limit);
        $orders = [];
        foreach ($rows as $row) {
            $orders[] = [
                'order_ref' => (string) ($row['order_ref'] ?? ''),
                'product_id' => (string) ($row['product_id'] ?? ''),
                'variant_label' => (string) ($row['variant_label'] ?? ''),
                'product_kind' => (string) ($row['product_kind'] ?? ''),
                'provider_type' => isset($row['provider_type']) ? (string) $row['provider_type'] : null,
                'provider_id' => isset($row['provider_id']) ? (int) $row['provider_id'] : null,
                'amount_won' => (int) ($row['amount_won'] ?? 0),
                'catalog_version' => isset($row['catalog_version']) ? (string) $row['catalog_version'] : null,
                'list_price_won' => isset($row['list_price_won']) ? (int) $row['list_price_won'] : null,
                'discount_won' => isset($row['discount_won']) ? (int) $row['discount_won'] : null,
                'status' => (string) ($row['status'] ?? ''),
                'pg_provider' => (string) ($row['pg_provider'] ?? ''),
                'created_at' => (string) ($row['created_at'] ?? ''),
                'paid_at' => isset($row['paid_at']) ? (string) $row['paid_at'] : null,
            ];
        }

        return ['orders' => $orders];
    }

    /** @return array<string, mixed> */
    public function completeOrder(int $userId, string $orderRef): array
    {
        $lockKey = null;
        $paymentCommitted = false;
        try {
            $this->pdo->beginTransaction();
            $order = $this->orders->getByRefForUpdate($orderRef);
            if ($order === null || (int) $order['user_id'] !== $userId) {
                throw new InvalidArgumentException('주문을 찾을 수 없습니다.');
            }

            $status = (string) $order['status'];
            if (!in_array($status, ['pending', 'paid'], true)) {
                throw new InvalidArgumentException('완료할 수 없는 주문 상태입니다.');
            }

            $isPack = (string) $order['product_kind'] === 'count'
                && MemoTicketPolicy::isPaidPackVariant((string) $order['variant_label']);
            $isImmediate = (string) $order['product_kind'] === 'count'
                && MemoTicketPolicy::isImmediateVariant((string) $order['variant_label']);

            if ($status === 'paid' && $this->isFulfillmentSucceeded($order, $orderRef, $isPack, $isImmediate)) {
                $this->pdo->commit();

                return $this->buildCompletePayload($order, true);
            }

            if ($isPack) {
                $ptype = (string) ($order['provider_type'] ?? '');
                $pid = (int) ($order['provider_id'] ?? 0);
                if ($ptype === '' || $pid <= 0) {
                    throw new InvalidArgumentException('묶음권 주문에 프로필 문맥이 없습니다.');
                }
                $lockKey = MemoTicketPolicy::packLockKey($ptype, $pid);
                $this->acquireMemoLock($lockKey);
                $active = $this->tickets->lockActivePaidMemoPacks($ptype, $pid);
                if ($status === 'pending' && $active !== []) {
                    throw new PaidConflictException('이미 사용 중인 유료 묶음권이 있어 새로 구매할 수 없습니다.');
                }
                if ($status === 'paid'
                    && $active !== []
                    && !$this->tickets->packExistsForOrderRef($orderRef)) {
                    $this->pdo->commit();
                    $this->orders->markFulfillment(
                        $orderRef,
                        'failed',
                        '다른 유료 묶음권이 먼저 활성화되어 이 주문은 지급하지 않습니다.',
                    );
                    $paid = $this->orders->getByRef($orderRef) ?? $order;
                    $this->releaseMemoLock($lockKey);
                    $lockKey = null;

                    return $this->buildCompletePayload(
                        $paid,
                        false,
                        '다른 유료 묶음권이 먼저 활성화되어 이 주문은 지급하지 않습니다.',
                    );
                }
            }

            if ($status === 'pending') {
                $this->orders->markPaid($orderRef);
            }
            $this->pdo->commit();
            $paymentCommitted = true;

            if ($isImmediate) {
                $immLock = MemoTicketPolicy::immediateLockKey($orderRef);
                $this->acquireMemoLock($immLock);
                try {
                    $sent = $this->fulfillImmediateMemo(
                        $userId,
                        $orderRef,
                        (string) $order['provider_type'],
                        (int) $order['provider_id'],
                    );
                    $this->orders->markFulfillment($orderRef, 'succeeded', null);
                    $paid = $this->orders->getByRef($orderRef) ?? $order;

                    return $this->buildCompletePayload($paid, $sent || $this->immediateAlreadySent($orderRef));
                } catch (\Throwable $e) {
                    $this->recordImmediateFailure($orderRef, $e);
                    $paid = $this->orders->getByRef($orderRef) ?? $order;

                    return $this->buildCompletePayload($paid, false, $e->getMessage());
                } finally {
                    $this->releaseMemoLock($immLock);
                }
            }

            try {
                $grant = $this->fulfill($userId, $order);
                $this->orders->markFulfillment($orderRef, 'succeeded', null);
            } catch (\Throwable $e) {
                $this->orders->markFulfillment($orderRef, 'failed', $e->getMessage());
                $paid = $this->orders->getByRef($orderRef) ?? $order;
                if ($lockKey !== null) {
                    $this->releaseMemoLock($lockKey);
                    $lockKey = null;
                }

                return $this->buildCompletePayload($paid, false, $e->getMessage());
            }

            $paid = $this->orders->getByRef($orderRef);
            if ($paid === null) {
                throw new InvalidArgumentException('주문 갱신에 실패했습니다.');
            }
            $payload = $this->buildCompletePayload($paid, true);
            if (is_array($grant)) {
                if (isset($grant['paid_badge_grant'])) {
                    $payload['paid_badge_grant'] = $grant['paid_badge_grant'];
                } elseif (isset($grant['badge_code'])) {
                    $payload['paid_badge_grant'] = $grant;
                }
                if (isset($grant['memo_bundle_granted'])) {
                    $payload['memo_bundle_granted'] = (int) $grant['memo_bundle_granted'];
                }
            }

            return $payload;
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            if ($paymentCommitted && $this->immediate->tableReady()) {
                $failed = $this->orders->getByRef($orderRef);
                if (is_array($failed) && MemoTicketPolicy::isImmediateVariant((string) ($failed['variant_label'] ?? ''))) {
                    $this->recordImmediateFailure($orderRef, $e);
                }
            }
            throw $e;
        } finally {
            if (isset($lockKey) && is_string($lockKey) && $lockKey !== '') {
                $this->releaseMemoLock($lockKey);
            }
        }
    }

    public function revokeBadgeForOrder(string $orderRef): int
    {
        return $this->badges->revokeByOrderRef($orderRef);
    }

    /**
     * @param 'study_room'|'tutor' $providerType
     */
    private function requireProviderContext(int $userId, ?string &$providerType, ?int &$providerId): void
    {
        if ($providerType === null || $providerType === '' || $providerId === null || $providerId <= 0) {
            throw new InvalidArgumentException(
                'provider_type·provider_id가 필요합니다. (공부방|과외쌤 계정 문맥 — 추론/fallback 금지)',
            );
        }
        if ($providerType !== 'study_room' && $providerType !== 'tutor') {
            throw new InvalidArgumentException('provider_type은 study_room | tutor 만 허용합니다.');
        }
        $this->badges->assertOwnedProvider($userId, $providerType, $providerId);
    }

    /**
     * @param 'study_room'|'tutor' $providerType
     */
    private function assertBadgePurchaseAllowed(
        int $userId,
        string $productId,
        string $providerType,
        int $providerId,
    ): void {
        $this->badges->assertBadgeAllowedForProvider($providerType, $productId);
        if (!$this->badges->tableReady()) {
            throw new InvalidArgumentException('provider_paid_badges 미적용 — schema 055를 먼저 적용하세요.');
        }
        $positions = $this->tickets->listActivePositions($userId, $providerType, $providerId);
        if ($positions === []) {
            throw new InvalidArgumentException(
                '광고배지는 해당 계정 문맥의 프라임/픽 이용 후 구매할 수 있습니다.',
            );
        }
    }

    /**
     * 배지 기간은 활성 포지션 기간과 일치해야 한다 (상속 계약).
     *
     * @param 'study_room'|'tutor' $providerType
     */
    private function assertBadgePeriodMatchesActivePosition(
        int $userId,
        string $providerType,
        int $providerId,
        string $period,
    ): void {
        $positions = $this->tickets->listActivePositions($userId, $providerType, $providerId);
        if ($positions === []) {
            throw new InvalidArgumentException('활성 프라임/픽이 없어 배지를 구매할 수 없습니다.');
        }
        foreach ($positions as $pos) {
            $label = PaidCatalog::periodFromDuration(
                (string) ($pos['duration_type'] ?? 'day'),
                (int) ($pos['duration_value'] ?? $pos['period_days'] ?? 0),
            );
            if ($label === $period) {
                return;
            }
        }
        throw new InvalidArgumentException(
            '배지 기간은 이용 중인 노출상품 기간과 같아야 합니다.',
        );
    }

    /**
     * @param array<string, mixed> $order
     * @return array<string, mixed>|null
     */
    private function fulfill(int $userId, array $order): ?array
    {
        $productId = (string) $order['product_id'];
        $variant = (string) $order['variant_label'];
        $kind = (string) $order['product_kind'];
        $orderRef = (string) ($order['order_ref'] ?? '');
        $providerType = isset($order['provider_type']) && $order['provider_type'] !== null && $order['provider_type'] !== ''
            ? (string) $order['provider_type']
            : null;
        $providerId = isset($order['provider_id']) ? (int) $order['provider_id'] : null;

        if ($kind === 'count') {
            $quote = PaidCatalog::quote($productId, $variant, null);
            $count = (int) ($quote['credit_count'] ?? 0);
            $ptype = $providerType;
            $pid = $providerId;
            if ($ptype === null || $pid === null || $pid <= 0) {
                throw new InvalidArgumentException('쪽지권 지급에 프로필 문맥이 없습니다.');
            }
            if (MemoTicketPolicy::isImmediateVariant($variant)) {
                $this->fulfillImmediateMemo($userId, $orderRef, $ptype, $pid);

                return ['immediate_sent' => true];
            }
            if ($count <= 0) {
                throw new InvalidArgumentException('쪽지권 수량이 올바르지 않습니다.');
            }
            if ($this->tickets->packExistsForOrderRef($orderRef)) {
                return null;
            }
            $expires = MemoTicketPolicy::expireAtFromFulfill()->format('Y-m-d H:i:s');
            $this->tickets->addTicketPack(
                $userId,
                'memo',
                $count,
                MemoTicketPolicy::SOURCE_PAYMENT,
                $expires,
                $ptype,
                $pid,
                $orderRef,
                MemoTicketPolicy::GRANT_PAYMENT_PACK,
            );

            return null;
        }

        if ($kind === 'position') {
            if ($providerType === null || $providerId === null || $providerId <= 0) {
                throw new InvalidArgumentException('포지션 주문에 provider_type·provider_id가 없습니다.');
            }
            $this->badges->assertOwnedProvider($userId, $providerType, $providerId);
            $period = PositionPeriodCalculator::fromVariant($variant);
            $this->tickets->addPositionSubscription(
                $userId,
                $productId,
                $period,
                'payment',
                $providerType,
                $providerId,
            );
            $bundle = TutorPositionMemoBundle::memoCount($productId, $variant, $providerType);
            if ($bundle > 0) {
                $expires = (string) $period['end_exclusive_on'] . ' 00:00:00';
                $this->tickets->addTicketPack(
                    $userId,
                    'memo',
                    $bundle,
                    MemoTicketPolicy::SOURCE_BUNDLE,
                    $expires,
                    $providerType,
                    $providerId,
                    $orderRef,
                    MemoTicketPolicy::GRANT_POSITION_BUNDLE,
                );
            }

            return ['memo_bundle_granted' => $bundle];
        }

        if ($kind === 'badge_addon') {
            $badgeGrant = $this->fulfillBadgeAddon($userId, $productId, $orderRef, $providerType, $providerId);

            return ['paid_badge_grant' => $badgeGrant];
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function fulfillBadgeAddon(
        int $userId,
        string $productId,
        string $orderRef,
        ?string $providerType,
        ?int $providerId,
    ): array {
        if ($providerType === null || $providerId === null || $providerId <= 0) {
            throw new InvalidArgumentException('배지 주문에 provider_type·provider_id가 없습니다.');
        }
        $this->badges->assertOwnedProvider($userId, $providerType, $providerId);
        $this->badges->assertBadgeAllowedForProvider($providerType, $productId);

        $positions = $this->tickets->listActivePositions($userId, $providerType, $providerId);
        if ($positions === []) {
            throw new InvalidArgumentException('해당 계정 문맥의 활성 프라임/픽이 없어 배지를 부여할 수 없습니다.');
        }
        usort(
            $positions,
            static fn (array $a, array $b): int => strcmp(
                (string) ($b['end_exclusive_on'] ?? ''),
                (string) ($a['end_exclusive_on'] ?? ''),
            ),
        );
        $period = $positions[0];
        $startsOn = (string) ($period['started_on'] ?? date('Y-m-d'));
        $endExclusive = (string) ($period['end_exclusive_on'] ?? '');
        if ($endExclusive === '') {
            throw new InvalidArgumentException('포지션 종료일이 없습니다.');
        }

        $code = $productId === 'picked' ? 'jjokjipge' : $productId;
        $grant = $this->badges->grantFromOrder(
            $providerType,
            $providerId,
            $code,
            $startsOn,
            $endExclusive,
            $orderRef,
        );

        return array_merge($grant, [
            'provider_type' => $providerType,
            'provider_id' => $providerId,
            'position_end_exclusive_on' => $endExclusive,
        ]);
    }

    /** @param array<string, mixed> $order */
    private function buildCompletePayload(array $order, bool $fulfilled, ?string $fulfillmentError = null): array
    {
        $payStatus = (string) $order['status'];
        $fulfillment = (string) ($order['fulfillment_status'] ?? ($fulfilled ? 'succeeded' : ($payStatus === 'paid' ? 'pending' : 'none')));
        if ($fulfilled) {
            $fulfillment = 'succeeded';
        } elseif ($fulfillmentError !== null) {
            $fulfillment = 'failed';
        }

        return [
            'order_ref' => (string) $order['order_ref'],
            'status' => $payStatus,
            'product_id' => (string) $order['product_id'],
            'variant_label' => (string) $order['variant_label'],
            'provider_type' => isset($order['provider_type']) && $order['provider_type'] !== null && $order['provider_type'] !== ''
                ? (string) $order['provider_type']
                : null,
            'provider_id' => isset($order['provider_id']) ? (int) $order['provider_id'] : null,
            'amount_won' => (int) $order['amount_won'],
            'catalog_version' => isset($order['catalog_version']) ? (string) $order['catalog_version'] : null,
            'fulfilled' => $fulfilled,
            'fulfillment_status' => $fulfillment,
            'fulfillment_error' => $fulfillmentError ?? (isset($order['fulfillment_error']) ? (string) $order['fulfillment_error'] : null),
            'paid_at' => $order['paid_at'] !== null ? (string) $order['paid_at'] : null,
        ];
    }

    /**
     * @param array<string, mixed> $order
     */
    private function isFulfillmentSucceeded(array $order, string $orderRef, bool $isPack, bool $isImmediate): bool
    {
        if ((string) ($order['fulfillment_status'] ?? '') === 'succeeded') {
            return true;
        }
        if ($isPack && $this->tickets->packExistsForOrderRef($orderRef)) {
            return true;
        }
        if ($isImmediate && $this->immediateAlreadySent($orderRef)) {
            return true;
        }

        return false;
    }

    private function immediateAlreadySent(string $orderRef): bool
    {
        if (!$this->immediate->tableReady()) {
            return false;
        }
        $intent = $this->immediate->getByOrderRef($orderRef);

        return is_array($intent) && (string) ($intent['dispatch_status'] ?? '') === 'sent';
    }

    private function recordImmediateFailure(string $orderRef, \Throwable $e): void
    {
        $retryable = !str_contains($e->getMessage(), '쪽지를 받지')
            && !str_contains($e->getMessage(), '공개 중이 아닌');
        try {
            $this->immediate->markFailed($orderRef, $e->getMessage(), $retryable);
        } catch (\Throwable) {
        }
        $this->orders->markFulfillment($orderRef, 'failed', $e->getMessage());
    }

    /**
     * @param 'study_room'|'tutor' $providerType
     * @param array<string, mixed> $memoIntent
     */
    private function assertMemoPurchaseAllowed(
        int $userId,
        string $variant,
        string $providerType,
        int $providerId,
        array $memoIntent,
    ): void {
        if (!$this->tickets->packHasProfileColumns()) {
            throw new InvalidArgumentException('쪽지권 프로필 스키마(062)가 필요합니다.');
        }
        if (MemoTicketPolicy::isPaidPackVariant($variant)) {
            $lockKey = MemoTicketPolicy::packLockKey($providerType, $providerId);
            $this->acquireMemoLock($lockKey);
            try {
                if ($this->tickets->hasActivePaidMemoPack($providerType, $providerId)) {
                    throw new PaidConflictException('이미 사용 중인 유료 묶음권이 있어 새로 구매할 수 없습니다.');
                }
            } finally {
                $this->releaseMemoLock($lockKey);
            }

            return;
        }
        if (!MemoTicketPolicy::isImmediateVariant($variant)) {
            return;
        }
        if (!$this->immediate->tableReady()) {
            throw new InvalidArgumentException('즉시권 문맥 테이블(062)이 필요합니다.');
        }
        $studentId = (int) ($memoIntent['student_id'] ?? 0);
        $body = trim((string) ($memoIntent['body'] ?? ''));
        if ($studentId <= 0 || $body === '') {
            throw new InvalidArgumentException('1회 즉시권은 수신 학생과 발송할 첫 쪽지 본문이 필요합니다.');
        }
        $this->assertStudentContactable($studentId);
        $msgRepo = new MessagesRepository($this->pdo);
        $guardianId = $msgRepo->getStudentGuardianUserId($studentId);
        if ($guardianId === null || $guardianId <= 0) {
            throw new InvalidArgumentException('수신 학생을 찾을 수 없습니다.');
        }
        $low = min($userId, $guardianId);
        $high = max($userId, $guardianId);
        if ($msgRepo->findThreadByContext('student', $studentId, $low, $high) !== null) {
            throw new InvalidArgumentException('이미 대화가 있어 1회 즉시권이 필요하지 않습니다.');
        }
    }

    /**
     * @param 'study_room'|'tutor' $providerType
     */
    private function fulfillImmediateMemo(int $userId, string $orderRef, string $providerType, int $providerId): bool
    {
        $intent = $this->immediate->getByOrderRef($orderRef);
        if ($intent === null) {
            throw new InvalidArgumentException('즉시권 발송 문맥이 없습니다.');
        }
        if ((string) $intent['dispatch_status'] === 'sent') {
            return true;
        }
        $studentId = (int) $intent['student_id'];
        $this->assertStudentContactable($studentId);
        $thread = (new \Study114\Messages\MessagesService())->composeMessage($userId, [
            'context_kind' => 'student',
            'context_id' => $studentId,
            'body' => (string) $intent['body'],
            'context_label' => (string) ($intent['context_label'] ?? ''),
            'peer_display_name' => (string) ($intent['peer_display_name'] ?? ''),
            'skip_ticket_consume' => true,
            'provider_type' => $providerType,
            'provider_id' => $providerId,
        ]);
        $threadId = (int) ($thread['id'] ?? $thread['thread_id'] ?? 0);
        $this->immediate->markSent($orderRef, $threadId);

        return true;
    }

    private function assertStudentContactable(int $studentId): void
    {
        (new StudentMemoGate($this->pdo))->assertCanContact($studentId);
    }

    private function acquireMemoLock(string $key): void
    {
        $stmt = $this->pdo->prepare('SELECT GET_LOCK(?, 5)');
        $stmt->execute([$key]);
        $got = $stmt->fetchColumn();
        if ($got === false || $got === null || (int) $got !== 1) {
            throw new PaidConflictException('쪽지권 구매가 진행 중입니다. 잠시 후 다시 시도해 주세요.');
        }
    }

    private function releaseMemoLock(string $key): void
    {
        $stmt = $this->pdo->prepare('SELECT RELEASE_LOCK(?)');
        $stmt->execute([$key]);
    }
}
