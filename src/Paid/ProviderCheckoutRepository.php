<?php



declare(strict_types=1);



namespace Study114\Paid;



use PDO;



/** 18d — PG 더미 주문 */

final class ProviderCheckoutRepository

{

    public function __construct(private readonly PDO $pdo)

    {

    }



    public function insertPending(

        int $userId,

        string $orderRef,

        string $productId,

        string $variant,

        string $kind,

        int $amountWon,

    ): void {

        $stmt = $this->pdo->prepare(

            'INSERT INTO provider_payment_orders

             (user_id, order_ref, product_id, variant_label, product_kind, amount_won, status, pg_provider)

             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'

        );

        $stmt->execute([$userId, $orderRef, $productId, $variant, $kind, $amountWon, 'pending', 'dev_mock']);

    }



    /** @return array<string, mixed>|null */

    public function getByRef(string $orderRef): ?array

    {

        $stmt = $this->pdo->prepare(

            'SELECT * FROM provider_payment_orders WHERE order_ref = ? LIMIT 1'

        );

        $stmt->execute([$orderRef]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);



        return is_array($row) ? $row : null;

    }



    public function markPaid(string $orderRef): void

    {

        $stmt = $this->pdo->prepare(

            'UPDATE provider_payment_orders SET status = ?, paid_at = NOW() WHERE order_ref = ? AND status = ?'

        );

        $stmt->execute(['paid', $orderRef, 'pending']);

    }



    /**
     * @return list<array<string, mixed>>
     */
    public function listByUser(int $userId, int $limit = 50): array
    {
        $limit = max(1, min(100, $limit));
        $stmt = $this->pdo->prepare(
            'SELECT order_ref, product_id, variant_label, product_kind, amount_won, status, pg_provider, created_at, paid_at
             FROM provider_payment_orders
             WHERE user_id = ?
             ORDER BY COALESCE(paid_at, created_at) DESC, id DESC
             LIMIT ' . $limit
        );
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return is_array($rows) ? $rows : [];
    }

}

