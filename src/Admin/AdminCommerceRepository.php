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
    public function listActivePositions(int $limit = 50, ?int $userId = null): array
    {
        $limit = max(1, min(200, $limit));
        $sql = 'SELECT p.id, p.user_id, u.email AS user_email, p.sku_code,
                    p.duration_type, p.duration_value, p.period_days,
                    p.started_on, p.end_exclusive_on,
                    DATE_SUB(p.end_exclusive_on, INTERVAL 1 DAY) AS ends_on,
                    p.starts_at, p.ends_at, p.source, p.created_at,
                    GREATEST(0, DATEDIFF(p.end_exclusive_on, CURDATE())) AS days_left'
            . $this->anonColumns('provider_position_subscriptions', 'p') . '
             FROM provider_position_subscriptions p
             LEFT JOIN users u ON u.id = p.user_id
             WHERE CURDATE() < p.end_exclusive_on';
        $params = [];
        if ($userId !== null && $userId > 0) {
            $sql .= ' AND p.user_id = ?';
            $params[] = $userId;
        }
        $sql .= ' ORDER BY p.end_exclusive_on ASC, p.id DESC LIMIT ' . $limit;
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $this->withAccount(is_array($rows) ? $rows : []);
    }

    /** @return list<array<string, mixed>> */
    public function listTicketPacks(int $limit = 50, ?int $userId = null): array
    {
        $limit = max(1, min(200, $limit));
        $sql = 'SELECT t.id, t.user_id, u.email AS user_email, t.ticket_type, t.pack_size,
                    t.remaining, t.purchased_at, t.expires_at, t.source
             FROM provider_ticket_packs t
             LEFT JOIN users u ON u.id = t.user_id
             WHERE t.remaining > 0 AND t.expires_at > NOW()';
        $params = [];
        if ($userId !== null && $userId > 0) {
            $sql .= ' AND t.user_id = ?';
            $params[] = $userId;
        }
        $sql .= ' ORDER BY t.expires_at ASC, t.id DESC LIMIT ' . $limit;
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $this->withAccount(is_array($rows) ? $rows : []);
    }

    /** @return list<array<string, mixed>> */
    public function listRecentOrders(int $limit = 50, ?int $userId = null): array
    {
        $limit = max(1, min(200, $limit));
        $sql = 'SELECT o.id, o.user_id, u.email AS user_email, o.order_ref, o.product_id,
                    o.variant_label, o.product_kind, o.amount_won, o.status, o.pg_provider,
                    o.created_at, o.paid_at'
            . $this->anonColumns('provider_payment_orders', 'o') . '
             FROM provider_payment_orders o
             LEFT JOIN users u ON u.id = o.user_id';
        $params = [];
        if ($userId !== null && $userId > 0) {
            $sql .= ' WHERE o.user_id = ?';
            $params[] = $userId;
        }
        $sql .= ' ORDER BY COALESCE(o.paid_at, o.created_at) DESC, o.id DESC LIMIT ' . $limit;
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $this->withAccount(is_array($rows) ? $rows : []);
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

    private function anonColumns(string $table, string $alias): string
    {
        if (!$this->columnExists($table, 'deleted_display_name')) {
            return '';
        }

        return ', ' . $alias . '.deleted_display_name, ' . $alias . '.deleted_user_ref';
    }

    /**
     * 회원 행이 없으면 결제 줄은 오류 없이 익명 표시만 한다. 회원 상세 링크용 이메일은 비운다.
     *
     * @param list<array<string, mixed>> $rows
     * @return list<array<string, mixed>>
     */
    private function withAccount(array $rows): array
    {
        $out = [];
        foreach ($rows as $row) {
            $email = trim((string) ($row['user_email'] ?? ''));
            $userId = $row['user_id'] ?? null;
            $live = $email !== '' && $userId !== null && (int) $userId > 0;
            if ($live) {
                $row['deleted_member'] = false;
                $out[] = $row;
                continue;
            }
            $name = trim((string) ($row['deleted_display_name'] ?? ''));
            if ($name === '') {
                $name = '○○○';
            }
            $row['user_id'] = null;
            $row['user_email'] = '';
            $row['deleted_member'] = true;
            $row['deleted_display_name'] = $name;
            $row['account_label'] = '삭제된 회원(' . $name . ')';
            $out[] = $row;
        }

        return $out;
    }

    private function columnExists(string $table, string $column): bool
    {
        if (
            !in_array($table, ['provider_payment_orders', 'provider_position_subscriptions'], true)
            || $column !== 'deleted_display_name'
        ) {
            return false;
        }
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
        );
        $stmt->execute([$table, $column]);

        return $stmt->fetchColumn() !== false;
    }
}
