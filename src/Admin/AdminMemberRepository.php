<?php

declare(strict_types=1);

namespace Study114\Admin;

use PDO;
use Study114\Auth\TestAccountAllowlist;

final class AdminMemberRepository
{
    private const PROVIDER_IDENT_COLUMNS = "
        (SELECT sr.study_room_name FROM study_rooms sr
         WHERE sr.user_id = u.id AND sr.deleted_at IS NULL
         ORDER BY sr.id ASC LIMIT 1) AS study_room_name,
        (SELECT t.tutor_display_name FROM tutors t
         WHERE t.user_id = u.id
         ORDER BY t.id ASC LIMIT 1) AS tutor_display_name,
        (SELECT CASE
           WHEN rg.sido_code IN ('11','26','27','28','30','31','36') THEN rg.sido_name
           ELSE CONCAT(rg.sido_name, ' ', rg.sigungu_name)
         END
         FROM tutor_regions tr
         INNER JOIN regions rg ON rg.id = tr.region_id
         WHERE tr.tutor_id = (SELECT t2.id FROM tutors t2 WHERE t2.user_id = u.id ORDER BY t2.id ASC LIMIT 1)
         ORDER BY tr.is_primary DESC, tr.priority_order ASC
         LIMIT 1) AS tutor_region_label,
        (SELECT CONCAT_WS(' ', rg.sido_name, rg.sigungu_name, rg.dong_name)
         FROM study_room_regions srr
         INNER JOIN regions rg ON rg.id = srr.region_id
         WHERE srr.study_room_id = (SELECT sr2.id FROM study_rooms sr2 WHERE sr2.user_id = u.id AND sr2.deleted_at IS NULL ORDER BY sr2.id ASC LIMIT 1)
           AND srr.is_primary = 1
         LIMIT 1) AS room_region_label";

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

        $sql = 'SELECT u.id, u.email, u.status, u.admin_level, u.email_verified_at, u.oauth_role_pending,
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
                         WHERE pps.user_id = u.id AND CURDATE() < pps.end_exclusive_on
                       ) AS active_positions,
                       (
                         CASE WHEN u.status = \'withdrawn\' THEN 0 ELSE (
                           SELECT COUNT(*) FROM study_rooms sr
                           WHERE sr.user_id = u.id AND (sr.deleted_at IS NULL)
                         ) END
                       ) AS study_room_count,
                       (
                         CASE WHEN u.status = \'withdrawn\' THEN 0 ELSE (
                           SELECT COUNT(*) FROM tutors t WHERE t.user_id = u.id
                         ) END
                       ) AS tutor_count,
                       (
                         CASE WHEN u.status = \'withdrawn\' THEN 0 ELSE (
                           SELECT COUNT(*) FROM students s WHERE s.guardian_user_id = u.id
                         ) END
                       ) AS student_count,
                       ' . self::PROVIDER_IDENT_COLUMNS . '
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
     * 상태별 집계 칩용. 고른 status 는 무시하고 q·역할·지역만 반영한다.
     * all 은 탈퇴를 빼며 테스트 계정을 포함한다.
     * active 는 active 이면서 테스트 목록에 없는 회원이다.
     * pending·blocked·withdrawn 은 그 users.status 그대로다. 테스트 계정도 그 상태면 센다.
     * test 는 테스트 목록이면서 탈퇴가 아닌 회원이다. 목록이 비면 0.
     *
     * @param array{q?: string, role_type?: string, sido?: string, region?: int} $filters
     * @return array{all: int, active: int, pending: int, blocked: int, withdrawn: int, test: int}
     */
    public function countByStatus(array $filters = []): array
    {
        unset($filters['status']);
        $out = [
            'all' => 0,
            'active' => 0,
            'pending' => 0,
            'blocked' => 0,
            'withdrawn' => 0,
            'test' => 0,
        ];
        foreach (array_keys($out) as $status) {
            $one = $filters;
            $one['status'] = $status;
            $out[$status] = $this->countMembers($one);
        }

        return $out;
    }

    /**
     * status 가 없거나 all 이면 탈퇴만 뺀다. 테스트 계정은 남긴다.
     * active 는 active 이면서 테스트 id 를 NOT IN 한다. 테스트 목록이 비면 NOT IN 을 붙이지 않는다.
     * test 는 테스트 id 이면서 탈퇴가 아닌 회원이다. 목록이 비면 0건(0=1).
     * pending·blocked·withdrawn 은 users.status 만 비교한다.
     *
     * @param array{q?: string, status?: string, role_type?: string, sido?: string, region?: int} $filters
     * @return array{0: list<string>, 1: list<mixed>}
     */
    private function buildListWhere(array $filters, bool $includeStatus): array
    {
        $where = ['1=1'];
        $params = [];

        $q = trim((string) ($filters['q'] ?? ''));
        if ($q !== '') {
            $like = '%' . $q . '%';
            $parts = [
                'p.real_name LIKE ?',
                'u.email LIKE ?',
                'EXISTS (SELECT 1 FROM study_rooms _sr WHERE _sr.user_id = u.id AND _sr.deleted_at IS NULL AND _sr.study_room_name LIKE ?)',
                'EXISTS (SELECT 1 FROM tutors _t WHERE _t.user_id = u.id AND _t.tutor_display_name LIKE ?)',
            ];
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
            $digits = preg_replace('/\D+/', '', $q);
            if (is_string($digits) && strlen($digits) >= 3) {
                $parts[] = "REPLACE(REPLACE(REPLACE(COALESCE(p.phone,''),'-',''),' ',''),'.','') LIKE ?";
                $params[] = '%' . $digits . '%';
            }
            $where[] = '(' . implode(' OR ', $parts) . ')';
        }

        if ($includeStatus) {
            $status = trim((string) ($filters['status'] ?? ''));
            if ($status === '' || $status === 'all') {
                $where[] = "u.status <> 'withdrawn'";
            } elseif ($status === 'active' || $status === 'test') {
                $testIds = TestAccountAllowlist::userIds($this->pdo);
                if ($status === 'active') {
                    $where[] = "u.status = 'active'";
                    if ($testIds !== []) {
                        $where[] = 'u.id NOT IN (' . implode(',', array_fill(0, count($testIds), '?')) . ')';
                        foreach ($testIds as $testId) {
                            $params[] = $testId;
                        }
                    }
                } else {
                    $where[] = "u.status <> 'withdrawn'";
                    if ($testIds === []) {
                        $where[] = '0=1';
                    } else {
                        $where[] = 'u.id IN (' . implode(',', array_fill(0, count($testIds), '?')) . ')';
                        foreach ($testIds as $testId) {
                            $params[] = $testId;
                        }
                    }
                }
            } else {
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

        $regionId = (int) ($filters['region'] ?? 0);
        $sido = trim((string) ($filters['sido'] ?? ''));
        if ($regionId > 0) {
            $sido = '';
        }
        if ($regionId > 0 || $sido !== '') {
            $regionArg = $regionId > 0 ? $regionId : null;
            $sidoArg = $sido !== '' ? $sido : null;
            [$roomSql, $roomParams] = AdminRegionFilter::positionalExists('srr_f.region_id', $regionArg, $sidoArg);
            [$tutorSql, $tutorParams] = AdminRegionFilter::positionalExists('tr_f.region_id', $regionArg, $sidoArg);
            $where[] = '(EXISTS (
                SELECT 1 FROM study_rooms sr_f
                INNER JOIN study_room_regions srr_f
                  ON srr_f.study_room_id = sr_f.id AND srr_f.slot = 1
                 AND srr_f.region_id IS NOT NULL AND srr_f.region_id <> 0
                WHERE sr_f.user_id = u.id AND sr_f.deleted_at IS NULL
                  AND ' . $roomSql . '
            ) OR EXISTS (
                SELECT 1 FROM tutors t_f
                INNER JOIN tutor_regions tr_f
                  ON tr_f.tutor_id = t_f.id AND tr_f.priority_order = 0
                 AND tr_f.region_id IS NOT NULL AND tr_f.region_id <> 0
                WHERE t_f.user_id = u.id
                  AND ' . $tutorSql . '
            ))';
            foreach ($roomParams as $param) {
                $params[] = $param;
            }
            foreach ($tutorParams as $param) {
                $params[] = $param;
            }
        }

        return [$where, $params];
    }

    /** @return array<string, mixed>|null */
    public function findById(int $userId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT u.id, u.email, u.status, u.admin_level, u.email_verified_at, u.oauth_role_pending,
                    u.last_login_at, u.created_at, u.updated_at, u.deleted_at,
                    p.real_name, p.phone, p.gender, p.birth_date,
                    p.address_line1, p.sms_opt_in, p.email_opt_in,
                    ' . self::PROVIDER_IDENT_COLUMNS . '
             FROM users u
             LEFT JOIN user_profiles p ON p.user_id = u.id
             WHERE u.id = ?
             LIMIT 1'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    /**
     * 회원 번호로만 카드 수를 센다. 탈퇴 회원이면 0.
     *
     * @return array{studyRooms: int, tutors: int, students: int}
     */
    public function profileCounts(int $userId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT u.status,
                    (
                      SELECT COUNT(*) FROM study_rooms sr
                      WHERE sr.user_id = u.id AND sr.deleted_at IS NULL
                    ) AS study_room_count,
                    (
                      SELECT COUNT(*) FROM tutors t WHERE t.user_id = u.id
                    ) AS tutor_count,
                    (
                      SELECT COUNT(*) FROM students s WHERE s.guardian_user_id = u.id
                    ) AS student_count
             FROM users u
             WHERE u.id = ?
             LIMIT 1'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row) || (string) ($row['status'] ?? '') === 'withdrawn') {
            return ['studyRooms' => 0, 'tutors' => 0, 'students' => 0];
        }

        return [
            'studyRooms' => (int) ($row['study_room_count'] ?? 0),
            'tutors' => (int) ($row['tutor_count'] ?? 0),
            'students' => (int) ($row['student_count'] ?? 0),
        ];
    }

    /** @return list<array<string, mixed>> */
    public function listRoles(int $userId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, role_type, is_primary, status, created_at AS granted_at
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
            'SELECT sku_code, duration_type, duration_value, period_days,
                    started_on, end_exclusive_on,
                    DATE_SUB(end_exclusive_on, INTERVAL 1 DAY) AS ends_on,
                    starts_at, ends_at,
                    GREATEST(0, DATEDIFF(end_exclusive_on, CURDATE())) AS days_left
             FROM provider_position_subscriptions
             WHERE user_id = ? AND CURDATE() < end_exclusive_on
             ORDER BY end_exclusive_on ASC'
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

    /** 결제 유무. 목록 LIMIT와 무관하게 paid·refund_requested·refunded 주문이 있으면 true. */
    public function hasPayment(int $userId): bool
    {
        $stmt = $this->pdo->prepare(
            "SELECT EXISTS(
                SELECT 1 FROM provider_payment_orders
                WHERE user_id = ? AND status IN ('paid', 'refund_requested', 'refunded')
            )"
        );
        $stmt->execute([$userId]);

        return (int) $stmt->fetchColumn() === 1;
    }

    public function updateStatus(int $userId, string $status, ?string $deletedAt = null): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE users SET status = ?, deleted_at = ?, updated_at = NOW() WHERE id = ? LIMIT 1'
        );

        return $stmt->execute([$status, $deletedAt, $userId]) && $stmt->rowCount() > 0;
    }
}
