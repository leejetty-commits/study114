<?php

declare(strict_types=1);

namespace Study114\Admin;

use DateTimeImmutable;
use PDO;
use Study114\Auth\TestAccountAllowlist;
use Study114\Region\TutorRegionUnit;
use Study114\Report\ReportPeriod;

/** 관리자 통계 최소판. SELECT만 사용한다. */
final class AdminStatsRepository
{
    private const REGION_GU = '/^(\S+시) (\S+구)$/u';

    private const REGION_L2_UNSPECIFIED = '시·군·구 미지정';

    private const REGION_L3_UNSPECIFIED = '구 미지정';

    private ReportPeriod $period;

    private string $testIn = '';

    private int $dbOffset = 0;

    private string $phpTz = 'UTC';

    public function __construct(private readonly PDO $pdo)
    {
        $this->period = new ReportPeriod();
    }

    /**
     * @return array<string, mixed>
     */
    public function summary(int $days, DateTimeImmutable $now): array
    {
        $ids = [];
        foreach (TestAccountAllowlist::userIds($this->pdo) as $id) {
            $id = (int) $id;
            if ($id > 0) {
                $ids[] = $id;
            }
        }
        $this->testIn = implode(',', $ids);
        $measured = $this->period->measuredTz();
        $this->dbOffset = (int) $measured['db_offset_min'];
        $this->phpTz = (string) $measured['php_tz'];

        $nowKst = $now->setTimezone($this->period->tz());
        $todayStart = $nowKst->setTime(0, 0, 0);
        $tomorrow = $todayStart->modify('+1 day');
        $rangeStart = $todayStart->modify('-' . ($days - 1) . ' days');
        $startStored = $this->period->toStorage($rangeStart, 'db');
        $endStored = $this->period->toStorage($tomorrow, 'db');
        $todayStored = $this->period->toStorage($todayStart, 'db');

        $signups = $this->signups($startStored, $endStored, $rangeStart, $todayStart);
        $free = $this->freeCards();
        $expiring = $this->expiring();
        $noCard = $this->noCardCounts();
        $payments = $this->paymentTotals();

        return [
            'generated_at' => $nowKst->format('Y-m-d H:i'),
            'days' => $days,
            'top' => [
                'members_total' => $this->scalar('SELECT COUNT(*) FROM users u WHERE ' . $this->livingSql()),
                'signups_today' => $this->scalar(
                    'SELECT COUNT(*) FROM users u WHERE ' . $this->livingSql() . ' AND u.created_at >= ? AND u.created_at < ?',
                    [$todayStored, $endStored],
                ),
                'cards' => [
                    'study_room' => $this->scalar(
                        'SELECT COUNT(*) FROM study_rooms sr INNER JOIN users u ON u.id = sr.user_id AND ' . $this->livingSql()
                        . ' WHERE ' . $this->studyRoomRegisteredSql('sr'),
                    ),
                    'tutor' => $this->scalar(
                        'SELECT COUNT(*) FROM tutors t INNER JOIN users u ON u.id = t.user_id AND ' . $this->livingSql()
                        . ' WHERE ' . $this->tutorRegisteredSql('t'),
                    ),
                    'student' => $this->scalar(
                        'SELECT COUNT(*) FROM students s INNER JOIN users u ON u.id = s.guardian_user_id AND ' . $this->livingSql()
                        . ' WHERE ' . $this->studentRegisteredSql('s'),
                    ),
                ],
                'paid_in_use' => $this->paidInUse(),
                'candidates' => [
                    'free_cards' => $free['total'],
                    'expiring_cards' => $expiring['total'],
                    'no_card_members' => $noCard['study_room_owner'] + $noCard['tutor'] + $noCard['guardian_student'],
                ],
                'payments' => $payments,
            ],
            'signups' => $signups,
            'regions' => $this->regions(),
            'payments' => $this->paymentGroups(),
            'candidates' => [
                'free_cards' => $free,
                'expiring' => $expiring,
                'no_card' => $noCard,
            ],
        ];
    }

    private function livingSql(): string
    {
        $sql = "u.status <> 'withdrawn' AND u.deleted_at IS NULL AND u.admin_level IS NULL"
            . " AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = u.id AND ra.role_type = 'admin')";
        if ($this->testIn !== '') {
            $sql .= " AND u.id NOT IN ({$this->testIn})";
        }

        return $sql;
    }

    private function paymentFilterSql(): string
    {
        $sql = '';
        if ($this->testIn !== '') {
            $sql .= " AND (o.user_id IS NULL OR o.user_id NOT IN ({$this->testIn}))";
        }

        return $sql . " AND NOT EXISTS (
            SELECT 1 FROM users pu
            WHERE pu.id = o.user_id
              AND (
                pu.admin_level IS NOT NULL
                OR EXISTS (SELECT 1 FROM user_roles pra WHERE pra.user_id = pu.id AND pra.role_type = 'admin')
              )
        )";
    }

    private function studyRoomRegisteredSql(string $alias): string
    {
        return "{$alias}.deleted_at IS NULL AND EXISTS (
            SELECT 1 FROM study_room_regions r
            WHERE r.study_room_id = {$alias}.id AND r.slot = 1
              AND r.region_id IS NOT NULL AND r.region_id <> 0
        )";
    }

    private function tutorRegisteredSql(string $alias): string
    {
        return "EXISTS (
            SELECT 1 FROM tutor_regions r
            WHERE r.tutor_id = {$alias}.id AND r.priority_order = 0
              AND r.region_id IS NOT NULL AND r.region_id <> 0
        )";
    }

    private function studentRegisteredSql(string $alias): string
    {
        return "{$alias}.published_at IS NOT NULL AND {$alias}.deleted_at IS NULL";
    }

    private function studyRoomRegionSql(string $alias): string
    {
        return "(SELECT srr_rep.region_id FROM study_room_regions srr_rep
            WHERE srr_rep.study_room_id = {$alias}.id AND srr_rep.slot = 1
              AND srr_rep.region_id IS NOT NULL AND srr_rep.region_id <> 0
            LIMIT 1)";
    }

    private function tutorRegionSql(string $alias): string
    {
        return "(SELECT tr_rep.region_id FROM tutor_regions tr_rep
            WHERE tr_rep.tutor_id = {$alias}.id AND tr_rep.priority_order = 0
              AND tr_rep.region_id IS NOT NULL AND tr_rep.region_id <> 0
            LIMIT 1)";
    }

    private function studentRegionSql(string $alias): string
    {
        return "(CASE WHEN {$alias}.preferred_lesson_type = 'tutor' THEN {$alias}.preferred_tutor_region_id"
            . " WHEN {$alias}.preferred_lesson_type = 'study_room' THEN {$alias}.preferred_studyroom_region_id"
            . " ELSE NULL END)";
    }

    private function activePaidSql(string $alias): string
    {
        return "{$alias}.sku_code IN ('prime', 'pick') AND CURDATE() < {$alias}.end_exclusive_on";
    }

    /**
     * @param list<mixed> $params
     */
    private function scalar(string $sql, array $params = []): int
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    /**
     * @param list<mixed> $params
     * @return list<array<string, mixed>>
     */
    private function rows(string $sql, array $params = []): array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        return is_array($rows) ? $rows : [];
    }

    /**
     * @return list<array{date: string, study_room: int, tutor: int, student: int, none: int, total: int}>
     */
    private function signups(string $startStored, string $endStored, DateTimeImmutable $rangeStart, DateTimeImmutable $todayStart): array
    {
        $found = $this->rows(
            'SELECT u.created_at AS created_at,
                    (SELECT r.role_type FROM user_roles r
                     WHERE r.user_id = u.id AND r.is_primary = 1 AND r.status = \'active\'
                     ORDER BY r.id LIMIT 1) AS role_type
             FROM users u
             WHERE ' . $this->livingSql() . ' AND u.created_at >= ? AND u.created_at < ?',
            [$startStored, $endStored],
        );
        /** @var array<string, array{date: string, study_room: int, tutor: int, student: int, none: int, total: int}> $byDay */
        $byDay = [];
        foreach ($found as $row) {
            $day = $this->kstDate((string) ($row['created_at'] ?? ''));
            if ($day === '') {
                continue;
            }
            if (!isset($byDay[$day])) {
                $byDay[$day] = $this->blankSignup($day);
            }
            $key = match ((string) ($row['role_type'] ?? '')) {
                'study_room_owner' => 'study_room',
                'tutor' => 'tutor',
                'guardian_student' => 'student',
                default => 'none',
            };
            $byDay[$day][$key] += 1;
            $byDay[$day]['total'] += 1;
        }

        $out = [];
        $cursor = $rangeStart;
        while ($cursor <= $todayStart) {
            $day = $cursor->format('Y-m-d');
            $out[] = $byDay[$day] ?? $this->blankSignup($day);
            $cursor = $cursor->modify('+1 day');
        }

        return $out;
    }

    /**
     * @return array{date: string, study_room: int, tutor: int, student: int, none: int, total: int}
     */
    private function blankSignup(string $day): array
    {
        return [
            'date' => $day,
            'study_room' => 0,
            'tutor' => 0,
            'student' => 0,
            'none' => 0,
            'total' => 0,
        ];
    }

    /**
     * @return array{cards: int, prime: int, pick: int, unlinked_rows: int}
     */
    private function paidInUse(): array
    {
        $base = 'FROM provider_position_subscriptions sub
            INNER JOIN users u ON u.id = sub.user_id AND ' . $this->livingSql() . '
            WHERE sub.provider_id IS NOT NULL AND ' . $this->activePaidSql('sub');

        return [
            'cards' => $this->scalar('SELECT COUNT(*) FROM (SELECT DISTINCT sub.provider_type, sub.provider_id ' . $base . ') paid_cards'),
            'prime' => $this->scalar('SELECT COUNT(*) FROM (SELECT DISTINCT sub.provider_type, sub.provider_id ' . $base . " AND sub.sku_code = 'prime') paid_prime"),
            'pick' => $this->scalar('SELECT COUNT(*) FROM (SELECT DISTINCT sub.provider_type, sub.provider_id ' . $base . " AND sub.sku_code = 'pick') paid_pick"),
            'unlinked_rows' => $this->scalar(
                'SELECT COUNT(*) FROM provider_position_subscriptions sub
                 INNER JOIN users u ON u.id = sub.user_id AND ' . $this->livingSql() . '
                 WHERE sub.provider_id IS NULL AND ' . $this->activePaidSql('sub'),
            ),
        ];
    }

    /**
     * @return array{rows: list<array<string, mixed>>, unclassified: array<string, int>, total: array<string, int>}
     */
    private function regions(): array
    {
        $cities = $this->citiesWithGu();
        /** @var array<string, array<string, array{own: array<string, int>, kids: array<string, array<string, int>>}>> $map */
        $map = [];
        $unclassified = $this->blankRegionCounts();
        $add = function (?string $sido, ?string $sigungu, ?string $code, string $field, int $n) use (&$map, &$unclassified, $cities): void {
            if ($n === 0) {
                return;
            }
            $sidoName = trim((string) $sido);
            if ($sido === null || $sidoName === '') {
                $unclassified[$field] += $n;

                return;
            }
            [$level2, $level3] = $this->classifyRegion($sidoName, $sigungu, $code, $cities);
            if (!isset($map[$sidoName][$level2])) {
                $map[$sidoName][$level2] = [
                    'own' => $this->blankRegionCounts(),
                    'kids' => [],
                ];
            }
            if ($level3 === null) {
                $map[$sidoName][$level2]['own'][$field] += $n;

                return;
            }
            if (!isset($map[$sidoName][$level2]['kids'][$level3])) {
                $map[$sidoName][$level2]['kids'][$level3] = $this->blankRegionCounts();
            }
            $map[$sidoName][$level2]['kids'][$level3][$field] += $n;
        };
        $absorb = function (array $rows, string $field) use ($add): void {
            foreach ($rows as $row) {
                $add(
                    isset($row['sido']) && is_string($row['sido']) ? $row['sido'] : null,
                    isset($row['sg']) && is_string($row['sg']) ? $row['sg'] : null,
                    $this->regionCode($row['code'] ?? null),
                    $field,
                    (int) ($row['n'] ?? 0),
                );
            }
        };

        $living = $this->livingSql();
        $group = 'GROUP BY reg.sido_name, reg.sigungu_name, reg.sigungu_code';
        $absorb($this->rows(
            'SELECT reg.sido_name AS sido, reg.sigungu_name AS sg, reg.sigungu_code AS code, COUNT(*) AS n
             FROM study_rooms sr
             INNER JOIN users u ON u.id = sr.user_id AND ' . $living . '
             LEFT JOIN regions reg ON reg.id = ' . $this->studyRoomRegionSql('sr') . '
             WHERE ' . $this->studyRoomRegisteredSql('sr') . '
             ' . $group,
        ), 'study_room');
        $absorb($this->rows(
            'SELECT reg.sido_name AS sido, reg.sigungu_name AS sg, reg.sigungu_code AS code, COUNT(*) AS n
             FROM tutors t
             INNER JOIN users u ON u.id = t.user_id AND ' . $living . '
             LEFT JOIN regions reg ON reg.id = ' . $this->tutorRegionSql('t') . '
             WHERE ' . $this->tutorRegisteredSql('t') . '
             ' . $group,
        ), 'tutor');
        $absorb($this->rows(
            'SELECT reg.sido_name AS sido, reg.sigungu_name AS sg, reg.sigungu_code AS code, COUNT(*) AS n
             FROM students s
             INNER JOIN users u ON u.id = s.guardian_user_id AND ' . $living . '
             LEFT JOIN regions reg ON reg.id = ' . $this->studentRegionSql('s') . '
             WHERE ' . $this->studentRegisteredSql('s') . '
             ' . $group,
        ), 'student');

        $paidSelect = 'SELECT reg.sido_name AS sido, reg.sigungu_name AS sg, reg.sigungu_code AS code, sub.sku_code AS sku, COUNT(DISTINCT sub.provider_id) AS n
            FROM provider_position_subscriptions sub
            INNER JOIN users u ON u.id = sub.user_id AND ' . $living;
        $paidWhere = ' WHERE sub.provider_id IS NOT NULL AND ' . $this->activePaidSql('sub');
        foreach ($this->rows(
            $paidSelect . '
             LEFT JOIN study_rooms sr ON sr.id = sub.provider_id
             LEFT JOIN regions reg ON reg.id = ' . $this->studyRoomRegionSql('sr')
            . $paidWhere . " AND sub.provider_type = 'study_room'
             {$group}, sub.sku_code",
        ) as $row) {
            $sku = (string) ($row['sku'] ?? '');
            if ($sku === 'prime' || $sku === 'pick') {
                $add(
                    isset($row['sido']) && is_string($row['sido']) ? $row['sido'] : null,
                    isset($row['sg']) && is_string($row['sg']) ? $row['sg'] : null,
                    $this->regionCode($row['code'] ?? null),
                    $sku,
                    (int) ($row['n'] ?? 0),
                );
            }
        }
        foreach ($this->rows(
            $paidSelect . '
             LEFT JOIN tutors t ON t.id = sub.provider_id
             LEFT JOIN regions reg ON reg.id = ' . $this->tutorRegionSql('t')
            . $paidWhere . " AND sub.provider_type = 'tutor'
             {$group}, sub.sku_code",
        ) as $row) {
            $sku = (string) ($row['sku'] ?? '');
            if ($sku === 'prime' || $sku === 'pick') {
                $add(
                    isset($row['sido']) && is_string($row['sido']) ? $row['sido'] : null,
                    isset($row['sg']) && is_string($row['sg']) ? $row['sg'] : null,
                    $this->regionCode($row['code'] ?? null),
                    $sku,
                    (int) ($row['n'] ?? 0),
                );
            }
        }
        foreach ($this->rows(
            'SELECT sub.sku_code AS sku, COUNT(*) AS n
             FROM provider_position_subscriptions sub
             INNER JOIN users u ON u.id = sub.user_id AND ' . $living . '
             WHERE sub.provider_id IS NULL AND ' . $this->activePaidSql('sub') . '
             GROUP BY sub.sku_code',
        ) as $row) {
            $sku = (string) ($row['sku'] ?? '');
            if ($sku === 'prime' || $sku === 'pick') {
                $add(null, null, null, $sku, (int) ($row['n'] ?? 0));
            }
        }

        $ordered = [];
        $names = array_keys($map);
        if ($names !== []) {
            $placeholders = implode(',', array_fill(0, count($names), '?'));
            $sorted = [];
            foreach ($this->rows(
                "SELECT DISTINCT sido_name FROM regions WHERE sido_name IN ({$placeholders}) ORDER BY sido_name",
                $names,
            ) as $row) {
                $name = (string) ($row['sido_name'] ?? '');
                if ($name !== '' && isset($map[$name]) && !isset($sorted[$name])) {
                    $sorted[$name] = true;
                    $ordered[] = $this->sidoRegionRow($name, $map[$name]);
                }
            }
            foreach ($map as $name => $levels) {
                if (!isset($sorted[$name])) {
                    $ordered[] = $this->sidoRegionRow($name, $levels);
                }
            }
        }

        $total = $this->blankRegionCounts();
        foreach ($ordered as $row) {
            foreach ($total as $field => $value) {
                $total[$field] = $value + (int) $row[$field];
            }
        }
        foreach ($total as $field => $value) {
            $total[$field] = $value + $unclassified[$field];
        }

        return [
            'rows' => $ordered,
            'unclassified' => $unclassified,
            'total' => $total,
        ];
    }

    /**
     * R2. 구가 있는 시. 요청마다 regions에서 한 번 뽑는다.
     *
     * @return array<string, array<string, true>>
     */
    private function citiesWithGu(): array
    {
        $cities = [];
        foreach ($this->rows(
            "SELECT DISTINCT sido_name, TRIM(sigungu_name) AS sg FROM regions WHERE sigungu_name LIKE '% %'",
        ) as $row) {
            $sido = trim((string) ($row['sido_name'] ?? ''));
            $sg = $this->collapseRegionName(isset($row['sg']) ? (string) $row['sg'] : '');
            if ($sido === '' || preg_match(self::REGION_GU, $sg, $match) !== 1) {
                continue;
            }
            $cities[$sido][$match[1]] = true;
        }

        return $cities;
    }

    /**
     * R1, R3~R6. 2단계 이름과, 있으면 3단계 이름.
     *
     * @param array<string, array<string, true>> $cities
     * @return array{0: string, 1: ?string}
     */
    private function classifyRegion(string $sido, ?string $sigungu, ?string $code, array $cities): array
    {
        $sg = $this->collapseRegionName($sigungu);
        if ($sg === '' || $sg === $sido) {
            return [self::REGION_L2_UNSPECIFIED, null];
        }
        if (preg_match(self::REGION_GU, $sg, $match) === 1) {
            return [$match[1], $match[2]];
        }
        if ($sido === '전남광주통합특별시') {
            $unitCode = trim((string) $code);
            if (in_array($unitCode, TutorRegionUnit::GWANGJU_GU_CODES, true)) {
                return [TutorRegionUnit::GWANGJU_UNIT_NAME, $sg];
            }
            if ($unitCode === TutorRegionUnit::GWANGJU_SIGUNGU_CODE) {
                return [TutorRegionUnit::GWANGJU_UNIT_NAME, self::REGION_L3_UNSPECIFIED];
            }
        }
        if (isset($cities[$sido][$sg])) {
            return [$sg, self::REGION_L3_UNSPECIFIED];
        }

        return [$sg, null];
    }

    private function collapseRegionName(?string $name): string
    {
        $text = trim((string) $name);
        $collapsed = preg_replace('/\s+/u', ' ', $text);

        return is_string($collapsed) ? $collapsed : '';
    }

    private function regionCode(mixed $code): ?string
    {
        if (is_string($code) || is_int($code)) {
            return (string) $code;
        }

        return null;
    }

    /**
     * @param array<string, array{own: array<string, int>, kids: array<string, array<string, int>>}> $levels
     * @return array<string, mixed>
     */
    private function sidoRegionRow(string $sido, array $levels): array
    {
        $children = $this->level2RegionRows($levels);
        $counts = $this->blankRegionCounts();
        foreach ($children as $child) {
            foreach ($counts as $field => $value) {
                $counts[$field] = $value + (int) $child[$field];
            }
        }

        return ['sido' => $sido] + $counts + ['children' => $children];
    }

    /**
     * @param array<string, array{own: array<string, int>, kids: array<string, array<string, int>>}> $levels
     * @return list<array<string, mixed>>
     */
    private function level2RegionRows(array $levels): array
    {
        $rows = [];
        foreach ($this->sortRegionNames(array_keys($levels)) as $name) {
            $own = $levels[$name]['own'];
            $kids = $levels[$name]['kids'];
            if ($kids !== []) {
                $hasOwn = false;
                foreach ($own as $value) {
                    if ($value !== 0) {
                        $hasOwn = true;
                        break;
                    }
                }
                if ($hasOwn) {
                    if (!isset($kids[self::REGION_L3_UNSPECIFIED])) {
                        $kids[self::REGION_L3_UNSPECIFIED] = $this->blankRegionCounts();
                    }
                    foreach ($own as $field => $value) {
                        $kids[self::REGION_L3_UNSPECIFIED][$field] += $value;
                    }
                }
                $children = $this->level3RegionRows($kids);
                $counts = $this->blankRegionCounts();
                foreach ($children as $child) {
                    foreach ($counts as $field => $value) {
                        $counts[$field] = $value + (int) $child[$field];
                    }
                }
            } else {
                $children = [];
                $counts = $own;
            }
            $rows[] = ['name' => $name] + $counts + ['children' => $children];
        }

        return $rows;
    }

    /**
     * @param array<string, array<string, int>> $kids
     * @return list<array<string, mixed>>
     */
    private function level3RegionRows(array $kids): array
    {
        $rows = [];
        foreach ($this->sortRegionNames(array_keys($kids)) as $name) {
            $rows[] = ['name' => $name] + $kids[$name];
        }

        return $rows;
    }

    /**
     * @param list<string> $names
     * @return list<string>
     */
    private function sortRegionNames(array $names): array
    {
        usort($names, function (string $left, string $right): int {
            $tail = static function (string $name): int {
                return ($name === self::REGION_L2_UNSPECIFIED || $name === self::REGION_L3_UNSPECIFIED) ? 1 : 0;
            };
            $rank = $tail($left) <=> $tail($right);
            if ($rank !== 0) {
                return $rank;
            }

            return strcmp($left, $right);
        });

        return $names;
    }

    /**
     * @return array{study_room: int, tutor: int, student: int, prime: int, pick: int}
     */
    private function blankRegionCounts(): array
    {
        return [
            'study_room' => 0,
            'tutor' => 0,
            'student' => 0,
            'prime' => 0,
            'pick' => 0,
        ];
    }

    /**
     * @return array{count: int, amount_won: int}
     */
    private function paymentTotals(): array
    {
        $rows = $this->rows(
            'SELECT COUNT(*) AS cnt, COALESCE(SUM(o.amount_won), 0) AS won
             FROM provider_payment_orders o
             WHERE o.status IN (\'paid\', \'refund_requested\', \'refunded\')' . $this->paymentFilterSql(),
        );
        $row = $rows[0] ?? [];

        return [
            'count' => (int) ($row['cnt'] ?? 0),
            'amount_won' => (int) ($row['won'] ?? 0),
        ];
    }

    /**
     * @return list<array<string, int|string|null>>
     */
    private function paymentGroups(): array
    {
        $out = [];
        foreach ($this->rows(
            'SELECT o.pg_provider AS pg_provider, o.product_kind AS product_kind, o.provider_type AS provider_type,
                    SUM(CASE WHEN o.status = \'paid\' THEN 1 ELSE 0 END) AS paid_count,
                    SUM(CASE WHEN o.status = \'paid\' THEN o.amount_won ELSE 0 END) AS paid_won,
                    SUM(CASE WHEN o.status = \'refund_requested\' THEN 1 ELSE 0 END) AS refund_requested_count,
                    SUM(CASE WHEN o.status = \'refund_requested\' THEN o.amount_won ELSE 0 END) AS refund_requested_won,
                    SUM(CASE WHEN o.status = \'refunded\' THEN 1 ELSE 0 END) AS refunded_count,
                    SUM(CASE WHEN o.status = \'refunded\' THEN o.amount_won ELSE 0 END) AS refunded_won,
                    COALESCE(SUM(rr.refund_won), 0) AS refund_won
             FROM provider_payment_orders o
             LEFT JOIN provider_refund_requests rr ON rr.order_ref = o.order_ref AND rr.status = \'refunded\'
             WHERE o.status IN (\'paid\', \'refund_requested\', \'refunded\')' . $this->paymentFilterSql() . '
             GROUP BY o.pg_provider, o.product_kind, o.provider_type
             ORDER BY o.pg_provider, o.product_kind, o.provider_type',
        ) as $row) {
            $providerType = $row['provider_type'] ?? null;
            $out[] = [
                'pg_provider' => (string) ($row['pg_provider'] ?? ''),
                'product_kind' => (string) ($row['product_kind'] ?? ''),
                'provider_type' => $providerType === null ? null : (string) $providerType,
                'paid_count' => (int) ($row['paid_count'] ?? 0),
                'paid_won' => (int) ($row['paid_won'] ?? 0),
                'refund_requested_count' => (int) ($row['refund_requested_count'] ?? 0),
                'refund_requested_won' => (int) ($row['refund_requested_won'] ?? 0),
                'refunded_count' => (int) ($row['refunded_count'] ?? 0),
                'refunded_won' => (int) ($row['refunded_won'] ?? 0),
                'refund_won' => (int) ($row['refund_won'] ?? 0),
            ];
        }

        return $out;
    }

    /**
     * @return array{total: int, items: list<array{role: string, name: string, region: string, signed_up_on: string}>}
     */
    private function freeCards(): array
    {
        $living = $this->livingSql();
        $notPaid = "NOT EXISTS (
            SELECT 1 FROM provider_position_subscriptions sub
            WHERE sub.provider_type = '%s' AND sub.provider_id = %s.id
              AND sub.sku_code IN ('prime', 'pick') AND CURDATE() < sub.end_exclusive_on
        )";
        $room = "SELECT 'study_room' AS role, sr.study_room_name AS name, reg.sido_name AS sido, reg.sigungu_name AS sigungu, u.created_at AS created_at
            FROM study_rooms sr
            INNER JOIN users u ON u.id = sr.user_id AND {$living}
            LEFT JOIN regions reg ON reg.id = " . $this->studyRoomRegionSql('sr') . '
            WHERE ' . $this->studyRoomRegisteredSql('sr') . ' AND ' . sprintf($notPaid, 'study_room', 'sr');
        $tutor = "SELECT 'tutor' AS role, t.tutor_display_name AS name, reg.sido_name AS sido, reg.sigungu_name AS sigungu, u.created_at AS created_at
            FROM tutors t
            INNER JOIN users u ON u.id = t.user_id AND {$living}
            LEFT JOIN regions reg ON reg.id = " . $this->tutorRegionSql('t') . '
            WHERE ' . $this->tutorRegisteredSql('t') . ' AND ' . sprintf($notPaid, 'tutor', 't');
        $total = $this->scalar(
            'SELECT COUNT(*) FROM study_rooms sr INNER JOIN users u ON u.id = sr.user_id AND ' . $living
            . ' WHERE ' . $this->studyRoomRegisteredSql('sr') . ' AND ' . sprintf($notPaid, 'study_room', 'sr'),
        ) + $this->scalar(
            'SELECT COUNT(*) FROM tutors t INNER JOIN users u ON u.id = t.user_id AND ' . $living
            . ' WHERE ' . $this->tutorRegisteredSql('t') . ' AND ' . sprintf($notPaid, 'tutor', 't'),
        );
        $items = [];
        foreach ($this->rows(
            "SELECT role, name, sido, sigungu, created_at FROM ({$room} UNION ALL {$tutor}) free_cards ORDER BY created_at DESC LIMIT 50",
        ) as $row) {
            $items[] = [
                'role' => (string) ($row['role'] ?? ''),
                'name' => (string) ($row['name'] ?? ''),
                'region' => $this->regionText(
                    isset($row['sido']) && is_string($row['sido']) ? $row['sido'] : null,
                    isset($row['sigungu']) && is_string($row['sigungu']) ? $row['sigungu'] : null,
                ),
                'signed_up_on' => $this->kstDate((string) ($row['created_at'] ?? '')),
            ];
        }

        return ['total' => $total, 'items' => $items];
    }

    /**
     * @return array{total: int, items: list<array{role: string, name: string, region: string, sku: string, days_left: int, signed_up_on: string}>}
     */
    private function expiring(): array
    {
        $living = $this->livingSql();
        $rows = $this->rows(
            "SELECT sub.provider_type AS role,
                    CASE
                      WHEN sub.provider_type = 'study_room' THEN sr.study_room_name
                      WHEN sub.provider_type = 'tutor' THEN t.tutor_display_name
                      ELSE ''
                    END AS name,
                    reg.sido_name AS sido,
                    reg.sigungu_name AS sigungu,
                    sub.sku_code AS sku,
                    DATEDIFF(sub.end_exclusive_on, CURDATE()) AS days_left,
                    u.created_at AS created_at
             FROM provider_position_subscriptions sub
             INNER JOIN users u ON u.id = sub.user_id AND {$living}
             LEFT JOIN study_rooms sr ON sub.provider_type = 'study_room' AND sr.id = sub.provider_id
             LEFT JOIN tutors t ON sub.provider_type = 'tutor' AND t.id = sub.provider_id
             LEFT JOIN regions reg ON reg.id = (
                CASE
                  WHEN sub.provider_type = 'study_room' THEN " . $this->studyRoomRegionSql('sr') . "
                  WHEN sub.provider_type = 'tutor' THEN " . $this->tutorRegionSql('t') . "
                  ELSE NULL
                END
             )
             WHERE sub.provider_id IS NOT NULL
               AND sub.provider_type IN ('study_room', 'tutor')
               AND " . $this->activePaidSql('sub') . '
               AND DATEDIFF(sub.end_exclusive_on, CURDATE()) BETWEEN 1 AND 7
               AND NOT EXISTS (
                 SELECT 1 FROM provider_position_subscriptions s2
                 WHERE s2.provider_type = sub.provider_type
                   AND s2.provider_id = sub.provider_id
                   AND s2.sku_code IN (\'prime\', \'pick\')
                   AND CURDATE() < s2.end_exclusive_on
                   AND DATEDIFF(s2.end_exclusive_on, CURDATE()) BETWEEN 1 AND 7
                   AND (
                     DATEDIFF(s2.end_exclusive_on, CURDATE()) < DATEDIFF(sub.end_exclusive_on, CURDATE())
                     OR (
                       DATEDIFF(s2.end_exclusive_on, CURDATE()) = DATEDIFF(sub.end_exclusive_on, CURDATE())
                       AND s2.id < sub.id
                     )
                   )
               )
             ORDER BY days_left ASC, sub.id ASC',
        );
        $items = [];
        foreach (array_slice($rows, 0, 50) as $row) {
            $items[] = [
                'role' => (string) ($row['role'] ?? ''),
                'name' => (string) ($row['name'] ?? ''),
                'region' => $this->regionText(
                    isset($row['sido']) && is_string($row['sido']) ? $row['sido'] : null,
                    isset($row['sigungu']) && is_string($row['sigungu']) ? $row['sigungu'] : null,
                ),
                'sku' => (string) ($row['sku'] ?? ''),
                'days_left' => (int) ($row['days_left'] ?? 0),
                'signed_up_on' => $this->kstDate((string) ($row['created_at'] ?? '')),
            ];
        }

        return ['total' => count($rows), 'items' => $items];
    }

    /**
     * @return array{study_room_owner: int, tutor: int, guardian_student: int}
     */
    private function noCardCounts(): array
    {
        $living = $this->livingSql();

        return [
            'study_room_owner' => $this->noCardCount('study_room_owner', 'SELECT 1 FROM study_rooms sr WHERE sr.user_id = u.id AND ' . $this->studyRoomRegisteredSql('sr'), $living),
            'tutor' => $this->noCardCount('tutor', 'SELECT 1 FROM tutors t WHERE t.user_id = u.id AND ' . $this->tutorRegisteredSql('t'), $living),
            'guardian_student' => $this->noCardCount('guardian_student', 'SELECT 1 FROM students s WHERE s.guardian_user_id = u.id AND ' . $this->studentRegisteredSql('s'), $living),
        ];
    }

    private function noCardCount(string $role, string $cardSql, string $living): int
    {
        return $this->scalar(
            'SELECT COUNT(*) FROM users u
             WHERE ' . $living . "
               AND EXISTS (
                 SELECT 1 FROM user_roles r
                 WHERE r.user_id = u.id AND r.role_type = ? AND r.status = 'active'
               )
               AND NOT EXISTS ({$cardSql})",
            [$role],
        );
    }

    private function regionText(?string $sido, ?string $sigungu): string
    {
        $text = trim(trim((string) $sido) . ' ' . trim((string) $sigungu));

        return $text === '' ? '미분류' : $text;
    }

    private function kstDate(string $stored): string
    {
        $shown = $this->period->storageToKst($stored, 'db', $this->dbOffset, $this->phpTz);

        return $shown === '' ? '' : substr($shown, 0, 10);
    }
}
