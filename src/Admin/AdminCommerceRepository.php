<?php

declare(strict_types=1);

namespace Study114\Admin;

use PDO;

final class AdminCommerceRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<array<string, mixed>> */
    public function listActivePositions(int $limit = 50): array
    {
        $limit = max(1, min(200, $limit));
        $stmt = $this->pdo->prepare(
            'SELECT p.id, p.user_id, u.email AS user_email, p.sku_code, p.period_days,
                    p.starts_at, p.ends_at, p.source, p.created_at,
                    TIMESTAMPDIFF(DAY, NOW(), p.ends_at) AS days_left
             FROM provider_position_subscriptions p
             INNER JOIN users u ON u.id = p.user_id
             WHERE p.ends_at > NOW()
             ORDER BY p.ends_at ASC, p.id DESC
             LIMIT ' . $limit
        );
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return is_array($rows) ? $rows : [];
    }

    /** @return list<array<string, mixed>> */
    public function listTicketPacks(int $limit = 50): array
    {
        $limit = max(1, min(200, $limit));
        $stmt = $this->pdo->prepare(
            'SELECT t.id, t.user_id, u.email AS user_email, t.ticket_type, t.pack_size,
                    t.remaining, t.purchased_at, t.expires_at, t.source
             FROM provider_ticket_packs t
             INNER JOIN users u ON u.id = t.user_id
             WHERE t.remaining > 0 AND t.expires_at > NOW()
             ORDER BY t.expires_at ASC, t.id DESC
             LIMIT ' . $limit
        );
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return is_array($rows) ? $rows : [];
    }

    /** @return list<array<string, mixed>> */
    public function listRecentOrders(int $limit = 50): array
    {
        $limit = max(1, min(200, $limit));
        $stmt = $this->pdo->prepare(
            'SELECT o.id, o.user_id, u.email AS user_email, o.order_ref, o.product_id,
                    o.variant_label, o.product_kind, o.amount_won, o.status, o.pg_provider,
                    o.created_at, o.paid_at
             FROM provider_payment_orders o
             INNER JOIN users u ON u.id = o.user_id
             ORDER BY COALESCE(o.paid_at, o.created_at) DESC, o.id DESC
             LIMIT ' . $limit
        );
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return is_array($rows) ? $rows : [];
    }

    public function countActivePositionsBySku(string $sku): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM provider_position_subscriptions
             WHERE sku_code = ? AND ends_at > NOW()'
        );
        $stmt->execute([$sku]);

        return (int) $stmt->fetchColumn();
    }

    public function updatePositionEndsAt(int $id, string $endsAt): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE provider_position_subscriptions SET ends_at = ? WHERE id = ? LIMIT 1'
        );

        return $stmt->execute([$endsAt, $id]) && $stmt->rowCount() > 0;
    }

    public function updateTicketRemaining(int $id, int $remaining): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE provider_ticket_packs SET remaining = ? WHERE id = ? LIMIT 1'
        );

        return $stmt->execute([max(0, $remaining), $id]) && $stmt->rowCount() > 0;
    }

    /** @return array<string, mixed>|null */
    public function getPositionById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, user_id, sku_code, period_days, starts_at, ends_at FROM provider_position_subscriptions WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    /** @return array<string, mixed>|null */
    public function getTicketPackById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, user_id, ticket_type, pack_size, remaining, expires_at FROM provider_ticket_packs WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }
}
