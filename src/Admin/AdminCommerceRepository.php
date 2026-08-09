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
            'SELECT p.id, p.user_id, u.email AS user_email, p.sku_code,
                    p.duration_type, p.duration_value, p.period_days,
                    p.started_on, p.end_exclusive_on,
                    DATE_SUB(p.end_exclusive_on, INTERVAL 1 DAY) AS ends_on,
                    p.starts_at, p.ends_at, p.source, p.created_at,
                    GREATEST(0, DATEDIFF(p.end_exclusive_on, CURDATE())) AS days_left
             FROM provider_position_subscriptions p
             INNER JOIN users u ON u.id = p.user_id
             WHERE CURDATE() < p.end_exclusive_on
             ORDER BY p.end_exclusive_on ASC, p.id DESC
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
             WHERE sku_code = ? AND CURDATE() < end_exclusive_on'
        );
        $stmt->execute([$sku]);

        return (int) $stmt->fetchColumn();
    }

    public function updatePositionEndsAt(int $id, string $endsAt): bool
    {
        $normalized = $this->normalizeExclusiveBoundary($endsAt);
        $stmt = $this->pdo->prepare(
            'UPDATE provider_position_subscriptions
             SET ends_at = ?, end_exclusive_on = ?
             WHERE id = ? LIMIT 1'
        );

        return $stmt->execute([
            $normalized['ends_at'],
            $normalized['end_exclusive_on'],
            $id,
        ]) && $stmt->rowCount() > 0;
    }

    /**
     * 관리자 보정 입력 → end_exclusive 정규화.
     * 23:59:59 등 포함형 EOD면 다음날 00:00 exclusive로 변환.
     *
     * @return array{ends_at: string, end_exclusive_on: string}
     */
    private function normalizeExclusiveBoundary(string $endsAt): array
    {
        $raw = str_replace('T', ' ', trim($endsAt));
        $ts = strtotime($raw);
        if ($ts === false) {
            throw new \InvalidArgumentException('ends_at 형식이 올바르지 않습니다.');
        }
        $hour = (int) date('G', $ts);
        $minute = (int) date('i', $ts);
        $second = (int) date('s', $ts);
        $date = date('Y-m-d', $ts);
        // 자정(또는 오전)만 있으면 이미 exclusive date로 본다
        if ($hour === 0 && $minute === 0 && $second === 0) {
            return [
                'ends_at' => $date . ' 00:00:00',
                'end_exclusive_on' => $date,
            ];
        }
        // 포함형 종료 시각 → 다음날 exclusive
        $exclusive = date('Y-m-d', strtotime($date . ' +1 day'));

        return [
            'ends_at' => $exclusive . ' 00:00:00',
            'end_exclusive_on' => $exclusive,
        ];
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
            'SELECT id, user_id, sku_code, duration_type, duration_value, period_days,
                    started_on, end_exclusive_on, starts_at, ends_at,
                    DATE_SUB(end_exclusive_on, INTERVAL 1 DAY) AS ends_on
             FROM provider_position_subscriptions WHERE id = ? LIMIT 1'
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
