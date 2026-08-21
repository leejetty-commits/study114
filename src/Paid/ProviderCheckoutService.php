<?php

declare(strict_types=1);

namespace Study114\Paid;

use InvalidArgumentException;
use PDO;
use Study114\Database\Connection;

/** 18d — dev mock PG · 주문 → 티켓/포지션/유료배지 지급 */
final class ProviderCheckoutService
{
    private const DUMMY_AMOUNT = 10;

    /** @var array<string, string> */
    private const COUNT_VARIANTS = [
        '1회' => '1',
        '5회권' => '5',
        '10회권' => '10',
        '20회권' => '20',
    ];

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

    /** @return array{order_ref: string, amount_won: int, status: string, product_id: string, variant_label: string} */
    public function createOrder(int $userId, string $productId, string $variant): array
    {
        $kind = $this->resolveKind($productId);
        if ($kind === 'badge_addon') {
            $this->assertBadgePurchaseAllowed($userId, $productId);
            // 배지 기간은 활성 Prime/Pick에 종속 — variant는 position과 동일 표기 허용(무시) 또는 '종속'
            if ($variant === '' || $variant === '-') {
                $variant = '포지션종속';
            }
        } else {
            $this->assertVariant($productId, $kind, $variant);
        }

        $orderRef = 'dev-' . bin2hex(random_bytes(8));
        $this->orders->insertPending($userId, $orderRef, $productId, $variant, $kind, self::DUMMY_AMOUNT);

        return [
            'order_ref' => $orderRef,
            'amount_won' => self::DUMMY_AMOUNT,
            'status' => 'pending',
            'product_id' => $productId,
            'variant_label' => $variant,
            'pg_provider' => 'dev_mock',
        ];
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
                'amount_won' => (int) ($row['amount_won'] ?? 0),
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
        $order = $this->orders->getByRef($orderRef);
        if ($order === null || (int) $order['user_id'] !== $userId) {
            throw new InvalidArgumentException('주문을 찾을 수 없습니다.');
        }
        if ((string) $order['status'] === 'paid') {
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
        if ($grant !== null) {
            $payload['paid_badge_grant'] = $grant;
        }

        return $payload;
    }

    /**
     * 환불·취소 시 배지 회수 (주문 ref 기준)
     */
    public function revokeBadgeForOrder(string $orderRef): int
    {
        return $this->badges->revokeByOrderRef($orderRef);
    }

    private function resolveKind(string $productId): string
    {
        return match ($productId) {
            'prime', 'pick' => 'position',
            'memo_ticket', 'request_view' => 'count',
            'hot', 'subject_track', 'jjokjipge', 'sky', 'picked' => 'badge_addon',
            'new', 'recommend' => throw new InvalidArgumentException(
                'New·추천은 유료 배지 상품이 아닙니다. (카드 자동부여/통계축)',
            ),
            default => throw new InvalidArgumentException('알 수 없는 상품입니다.'),
        };
    }

    private function assertVariant(string $productId, string $kind, string $variant): void
    {
        if ($kind === 'count' && !isset(self::COUNT_VARIANTS[$variant])) {
            throw new InvalidArgumentException('variant: 1회 · 5회권 · 10회권 · 20회권');
        }
        if ($kind === 'position' && !isset(PositionPeriodCalculator::VARIANT_MAP[$variant])) {
            throw new InvalidArgumentException('variant: 2주 · 3주 · 1·2·3개월');
        }
        unset($productId);
    }

    private function assertBadgePurchaseAllowed(int $userId, string $productId): void
    {
        $positions = $this->tickets->listActivePositions($userId);
        if ($positions === []) {
            throw new InvalidArgumentException('광고배지는 프라임/픽(대표·추천 노출) 이용 후 구매할 수 있습니다.');
        }
        $target = $this->badges->resolveProviderForUser($userId, $productId);
        if ($target === null) {
            throw new InvalidArgumentException('배지를 붙일 공부방/과외쌤 프로필이 없습니다.');
        }
        if (!$this->badges->tableReady()) {
            throw new InvalidArgumentException('provider_paid_badges 미적용 — schema 055를 먼저 적용하세요.');
        }
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

        if ($kind === 'count') {
            $count = (int) self::COUNT_VARIANTS[$variant];
            $ticketType = $productId === 'memo_ticket' ? 'memo' : 'request_view';
            $this->tickets->addTicketPack($userId, $ticketType, $count, 'payment');

            return null;
        }

        if ($kind === 'position') {
            $period = PositionPeriodCalculator::fromVariant($variant);
            $this->tickets->addPositionSubscription($userId, $productId, $period, 'payment');

            return null;
        }

        if ($kind === 'badge_addon') {
            return $this->fulfillBadgeAddon($userId, $productId, $orderRef);
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function fulfillBadgeAddon(int $userId, string $productId, string $orderRef): array
    {
        $positions = $this->tickets->listActivePositions($userId);
        if ($positions === []) {
            throw new InvalidArgumentException('활성 프라임/픽이 없어 배지를 부여할 수 없습니다.');
        }
        // 가장 늦게 끝나는 포지션 기간에 종속
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

        $target = $this->badges->resolveProviderForUser($userId, $productId);
        if ($target === null) {
            throw new InvalidArgumentException('배지를 붙일 공부방/과외쌤 프로필이 없습니다.');
        }

        $code = $productId === 'picked' ? 'jjokjipge' : $productId;
        $grant = $this->badges->grantFromOrder(
            $target['provider_type'],
            $target['provider_id'],
            $code,
            $startsOn,
            $endExclusive,
            $orderRef,
        );

        return array_merge($grant, [
            'provider_type' => $target['provider_type'],
            'provider_id' => $target['provider_id'],
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
            'amount_won' => (int) $order['amount_won'],
            'fulfilled' => $fulfilled,
            'paid_at' => $order['paid_at'] !== null ? (string) $order['paid_at'] : null,
        ];
    }
}
