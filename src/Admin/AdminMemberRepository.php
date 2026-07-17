<?php

declare(strict_types=1);

namespace Study114\Admin;

use PDO;

final class AdminMemberRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @param array{
     *   q?: string,
     *   status?: string,
     *   role_type?: string,
     *   limit?: int
     * } $filters
     * @return list<array<string, mixed>>
     */
    public function listMembers(array $filters = []): array
    {
        $limit = max(1, min(200, (int) ($filters['limit'] ?? 50)));
        [$where, $params] = $this->buildListWhere($filters, true);

        $sql = 'SELECT u.id, u.email, u.status, u.email_verified_at, u.oauth_role_pending,
                       u.last_login_at, u.created_at, u.deleted_at,
                       p.real_name, p.phone,
                       (
                         SELECT ur.role_type FROM user_roles ur
                         WHERE ur.user_id = u.id AND ur.is_primary = 1 AND ur.status = \'active\'
                         ORDER BY ur.id ASC LIMIT 1
                       ) AS primary_role,
                       (
                         SELECT COUNT(*) FROM user_oauth_accounts o WHERE o.user_id = u.id
                       ) AS oauth_count,
                       (
                         SELECT pe.subscription_tier FROM provider_entitlements pe
                         WHERE pe.user_id = u.id LIMIT 1
                       ) AS subscription_tier,
                       (
                         SELECT COUNT(*) FROM provider_position_subscriptions pps
                         WHERE pps.user_id = u.id AND pps.ends_at > NOW()
                       ) AS active_positions,
                       (
                         SELECT COUNT(*) FROM study_rooms sr
                         WHERE sr.user_id = u.id AND (sr.deleted_at IS NULL)
                       ) AS study_room_count,
                       (
                         SELECT COUNT(*) FROM tutors t WHERE t.user_id = u.id
                       ) AS tutor_count,
                       (
                         SELECT COUNT(*) FROM students s WHERE s.guardian_user_id = u.id
                       ) AS student_count
                FROM users u
                LEFT JOIN user_profiles p ON p.user_id = u.id
                WHERE ' . implode(' AND ', $where) . '
                ORDER BY u.id DESC
                LIMIT ' . $limit;

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return is_array($rows) ? $rows : [];
    }

    /**
     * 목록과 동일 조건의 총건수 (status 필터 포함).
     *
     * @param array{q?: string, status?: string, role_type?: string} $filters
     */
    public function countMembers(array $filters = []): int
    {
        [$where, $params] = $this->buildListWhere($filters, true);
        $sql = 'SELECT COUNT(*) AS cnt
                FROM users u
                LEFT JOIN user_profiles p ON p.user_id = u.id
                WHERE ' . implode(' AND ', $where);
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return (int) ($row['cnt'] ?? 0);
    }

    /**
     * 상태별 집계 칩용. q·role_type만 반영하고 status 필터는 무시 (영카트 local_ov 패턴).
     *
     * @param array{q?: string, role_type?: string} $filters
     * @return array{all: int, active: int, pending: int, blocked: int, withdrawn: int}
     */
    public function countByStatus(array $filters = []): array
    {
        [$where, $params] = $this->buildListWhere($filters, false);
        $sql = 'SELECT u.status, COUNT(*) AS cnt
                FROM users u
                LEFT JOIN user_profiles p ON p.user_id = u.id
                WHERE ' . implode(' AND ', $where) . '
                GROUP BY u.status';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $out = [
            'all' => 0,
            'active' => 0,
            'pending' => 0,
            'blocked' => 0,
            'withdrawn' => 0,
        ];
        if (!is_array($rows)) {
            return $out;
        }
        foreach ($rows as $row) {
            $status = (string) ($row['status'] ?? '');
            $cnt = (int) ($row['cnt'] ?? 0);
            $out['all'] += $cnt;
            if (array_key_exists($status, $out)) {
                $out[$status] = $cnt;
            }
        }

        return $out;
    }

    /**
     * @param array{q?: string, status?: string, role_type?: string} $filters
     * @return array{0: list<string>, 1: list<mixed>}
     */
    private function buildListWhere(array $filters, bool $includeStatus): array
    {
        $where = ['1=1'];
        $params = [];

        $q = trim((string) ($filters['q'] ?? ''));
        if ($q !== '') {
            $where[] = '(u.email LIKE ? OR p.real_name LIKE ? OR p.phone LIKE ? OR CAST(u.id AS CHAR) = ?)';
            $like = '%' . $q . '%';
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
            $params[] = $q;
        }

        if ($includeStatus) {
            $status = trim((string) ($filters['status'] ?? ''));
            if ($status !== '' && $status !== 'all') {
                $where[] = 'u.status = ?';
                $params[] = $status;
            }
        }

        $roleType = trim((string) ($filters['role_type'] ?? ''));
        if ($roleType !== '' && $roleType !== 'all') {
            $where[] = 'EXISTS (
                SELECT 1 FROM user_roles urf
                WHERE urf.user_id = u.id AND urf.role_type = ? AND urf.status = ?
            )';
            $params[] = $roleType;
            $params[] = 'active';
        }

        return [$where, $params];
    }

    /** @return array<string, mixed>|null */
    public function findById(int $userId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT u.id, u.email, u.status, u.email_verified_at, u.oauth_role_pending,
                    u.last_login_at, u.created_at, u.updated_at, u.deleted_at,
                    p.real_name, p.phone, p.gender, p.birth_date,
                    p.address_line1, p.sms_opt_in, p.email_opt_in
             FROM users u
             LEFT JOIN user_profiles p ON p.user_id = u.id
             WHERE u.id = ?
             LIMIT 1'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    /** @return list<array<string, mixed>> */
    public function listRoles(int $userId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, role_type, is_primary, status, granted_at
             FROM user_roles
             WHERE user_id = ?
             ORDER BY is_primary DESC, id ASC'
        );
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return is_array($rows) ? $rows : [];
    }

    /** @return list<array<string, mixed>> */
    public function listOauth(int $userId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT provider, provider_email, linked_at
             FROM user_oauth_accounts
             WHERE user_id = ?
             ORDER BY linked_at ASC'
        );
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return is_array($rows) ? $rows : [];
    }

    /** @return array<string, mixed> */
    public function paidSnapshot(int $userId): array
    {
        $tier = 'free';
        $stmt = $this->pdo->prepare(
            'SELECT subscription_tier, cold_memo_allowed, memo_credits
             FROM provider_entitlements WHERE user_id = ? LIMIT 1'
        );
        $stmt->execute([$userId]);
        $ent = $stmt->fetch(PDO::FETCH_ASSOC);
        if (is_array($ent)) {
            $tier = (string) ($ent['subscription_tier'] ?? 'free');
        }

        $stmt = $this->pdo->prepare(
            'SELECT sku_code, period_days, starts_at, ends_at,
                    TIMESTAMPDIFF(DAY, NOW(), ends_at) AS days_left
             FROM provider_position_subscriptions
             WHERE user_id = ? AND ends_at > NOW()
             ORDER BY ends_at ASC'
        );
        $stmt->execute([$userId]);
        $positions = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        $stmt = $this->pdo->prepare(
            'SELECT ticket_type, remaining, pack_size, expires_at
             FROM provider_ticket_packs
             WHERE user_id = ? AND remaining > 0 AND expires_at > NOW()
             ORDER BY expires_at ASC'
        );
        $stmt->execute([$userId]);
        $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        $stmt = $this->pdo->prepare(
            'SELECT order_ref, product_id, variant_label, status, amount_won, created_at, paid_at
             FROM provider_payment_orders
             WHERE user_id = ?
             ORDER BY COALESCE(paid_at, created_at) DESC
             LIMIT 10'
        );
        $stmt->execute([$userId]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        return [
            'subscription_tier' => $tier,
            'entitlement' => is_array($ent) ? $ent : null,
            'positions' => $positions,
            'tickets' => $tickets,
            'orders' => $orders,
        ];
    }

    public function updateStatus(int $userId, string $status, ?string $deletedAt = null): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE users SET status = ?, deleted_at = ?, updated_at = NOW() WHERE id = ? LIMIT 1'
        );

        return $stmt->execute([$status, $deletedAt, $userId]) && $stmt->rowCount() > 0;
    }
}
