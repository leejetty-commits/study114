<?php

declare(strict_types=1);

namespace Study114\Paid;

use InvalidArgumentException;
use PDO;
use Study114\Database\Connection;

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
    private PDO $pdo;

    public function __construct(
        ?ProviderCheckoutRepository $orders = null,
        ?ProviderTicketRepository $tickets = null,
        ?PaidBadgeRepository $badges = null,
        ?PDO $pdo = null,
    ) {
        $this->pdo = $pdo ?? Connection::get();
        $this->orders = $orders ?? new ProviderCheckoutRepository($this->pdo);
        $this->tickets = $tickets ?? new ProviderTicketRepository($this->pdo);
        $this->badges = $badges ?? new PaidBadgeRepository($this->pdo);
    }

    /**
     * @param 'study_room'|'tutor'|null $providerType
     * @return array<string, mixed>
     */
    public function createOrder(
        int $userId,
        string $productId,
        string $variant,
        ?string $providerType = null,
        ?int $providerId = null,
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
        } else {
            // 횟수권은 user 단위 — provider 선택 시 소유 검증만
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
        $this->pdo->beginTransaction();
        try {
            $order = $this->orders->getByRefForUpdate($orderRef);
            if ($order === null || (int) $order['user_id'] !== $userId) {
                throw new InvalidArgumentException('주문을 찾을 수 없습니다.');
            }
            if ((string) $order['status'] === 'paid') {
                $this->pdo->commit();

                return $this->buildCompletePayload($order, false);
            }
            if ((string) $order['status'] !== 'pending') {
                throw new InvalidArgumentException('완료할 수 없는 주문 상태입니다.');
            }

            $this->orders->markPaid($orderRef);
            $grant = $this->fulfill($userId, $order);

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

            $this->pdo->commit();

            return $payload;
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
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
            if ($count <= 0) {
                throw new InvalidArgumentException('쪽지권 수량이 올바르지 않습니다.');
            }
            // PR-B: immediate는 잔액 미보관·즉시발송. PR-A는 기존 팩 지급 골격 유지.
            $this->tickets->addTicketPack($userId, 'memo', $count, 'payment');

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
                $this->tickets->addTicketPack($userId, 'memo', $bundle, 'position_bundle');
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
    private function buildCompletePayload(array $order, bool $fulfilled): array
    {
        return [
            'order_ref' => (string) $order['order_ref'],
            'status' => (string) $order['status'],
            'product_id' => (string) $order['product_id'],
            'variant_label' => (string) $order['variant_label'],
            'provider_type' => isset($order['provider_type']) && $order['provider_type'] !== null && $order['provider_type'] !== ''
                ? (string) $order['provider_type']
                : null,
            'provider_id' => isset($order['provider_id']) ? (int) $order['provider_id'] : null,
            'amount_won' => (int) $order['amount_won'],
            'catalog_version' => isset($order['catalog_version']) ? (string) $order['catalog_version'] : null,
            'fulfilled' => $fulfilled,
            'paid_at' => $order['paid_at'] !== null ? (string) $order['paid_at'] : null,
        ];
    }
}
