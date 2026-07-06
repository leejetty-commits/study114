<?php

declare(strict_types=1);

namespace Study114\Paid;

use InvalidArgumentException;
use PDO;
use Study114\Database\Connection;

/** 18d — dev mock PG · 주문 → 티켓/포지션 지급 */
final class ProviderCheckoutService
{
    private const DUMMY_AMOUNT = 10;

    /** @var array<string, string> */
    private const COUNT_VARIANTS = [
        '1회' => '1',
        '5회권' => '5',
        '10회권' => '10',
    ];

    /** @var array<string, int> */
    private const PERIOD_VARIANTS = [
        '2주' => 14,
        '3주' => 21,
        '1개월' => 30,
        '2개월' => 60,
        '3개월' => 90,
    ];

    private ProviderCheckoutRepository $orders;
    private ProviderTicketRepository $tickets;

    public function __construct(
        ?ProviderCheckoutRepository $orders = null,
        ?ProviderTicketRepository $tickets = null,
    ) {
        $pdo = Connection::get();
        $this->orders = $orders ?? new ProviderCheckoutRepository($pdo);
        $this->tickets = $tickets ?? new ProviderTicketRepository($pdo);
    }

    /** @return array{order_ref: string, amount_won: int, status: string, product_id: string, variant_label: string} */
    public function createOrder(int $userId, string $productId, string $variant): array
    {
        $kind = $this->resolveKind($productId);
        if ($kind === 'badge_addon') {
            throw new InvalidArgumentException('광고배지는 Prime/Pick 기간 구독 후 구매할 수 있습니다.');
        }
        $this->assertVariant($productId, $kind, $variant);

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
        $this->fulfill($userId, $order);

        $paid = $this->orders->getByRef($orderRef);
        if ($paid === null) {
            throw new InvalidArgumentException('주문 갱신에 실패했습니다.');
        }

        return $this->buildCompletePayload($paid, true);
    }

    private function resolveKind(string $productId): string
    {
        return match ($productId) {
            'prime', 'pick' => 'position',
            'memo_ticket', 'request_view' => 'count',
            'hot', 'new', 'recommend', 'picked' => 'badge_addon',
            default => throw new InvalidArgumentException('알 수 없는 상품입니다.'),
        };
    }

    private function assertVariant(string $productId, string $kind, string $variant): void
    {
        if ($kind === 'count' && !isset(self::COUNT_VARIANTS[$variant])) {
            throw new InvalidArgumentException('variant: 1회 · 5회권 · 10회권');
        }
        if ($kind === 'position' && !isset(self::PERIOD_VARIANTS[$variant])) {
            throw new InvalidArgumentException('variant: 2주 · 3주 · 1·2·3개월');
        }
        unset($productId);
    }

    /** @param array<string, mixed> $order */
    private function fulfill(int $userId, array $order): void
    {
        $productId = (string) $order['product_id'];
        $variant = (string) $order['variant_label'];
        $kind = (string) $order['product_kind'];

        if ($kind === 'count') {
            $count = (int) self::COUNT_VARIANTS[$variant];
            $ticketType = $productId === 'memo_ticket' ? 'memo' : 'request_view';
            $this->tickets->addTicketPack($userId, $ticketType, $count, 'payment');
            return;
        }

        if ($kind === 'position') {
            $days = self::PERIOD_VARIANTS[$variant];
            $this->tickets->addPositionSubscription($userId, $productId, $days, 'payment');
        }
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
