<?php

declare(strict_types=1);

namespace Study114\Registration;

use DateTimeImmutable;
use InvalidArgumentException;
use PDO;
use Study114\Admin\AdminRegionFilter;
use Study114\Database\Connection;
use Study114\Report\ReportPeriod;

/**
 * 베이직카드 등록 사실. 162는 includeDeleted=true, 159-c는 나중에 false.
 * 공부방·과외쌤은 profile_status로 거르지 않는다.
 */
final class BasicCardRegisteredQuery
{
    private PDO $pdo;

    private ReportPeriod $period;

    public function __construct(?PDO $pdo = null, ?ReportPeriod $period = null)
    {
        $this->pdo = $pdo ?? Connection::get();
        $this->period = $period ?? new ReportPeriod();
    }

    /** @return array{study_room: int, tutor: int, student: int} */
    public function countByRole(DateTimeImmutable $start, DateTimeImmutable $end, bool $includeDeleted): array
    {
        return [
            'study_room' => $this->countRole('study_room', $start, $end, $includeDeleted),
            'tutor' => $this->countRole('tutor', $start, $end, $includeDeleted),
            'student' => $this->countRole('student', $start, $end, $includeDeleted),
        ];
    }

    /**
     * @return array{total: int, items: list<array{role: string, id: int, registered_at: string, display_name: string}>}
     */
    public function listByRole(
        string $role,
        DateTimeImmutable $start,
        DateTimeImmutable $end,
        bool $includeDeleted,
        int $page,
        int $perPage,
    ): array {
        $this->assertRole($role);
        $page = max(1, $page);
        $perPage = max(1, min(10000, $perPage));
        $offset = ($page - 1) * $perPage;
        $bounds = $this->bounds($role, $start, $end);
        $where = $this->where($role, $includeDeleted);
        $total = $this->countRole($role, $start, $end, $includeDeleted);
        $sql = 'SELECT ' . $this->selectList($role) . ' FROM ' . $this->from($role)
            . ' WHERE ' . $where
            . ' ORDER BY registered_at, id LIMIT ' . $perPage . ' OFFSET ' . $offset;
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($bounds);
        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = [
                'role' => $role,
                'id' => (int) $row['id'],
                'registered_at' => (string) $row['registered_at'],
                'display_name' => (string) ($row['display_name'] ?? ''),
            ];
        }

        return ['total' => $total, 'items' => $items];
    }

    private function countRole(string $role, DateTimeImmutable $start, DateTimeImmutable $end, bool $includeDeleted): int
    {
        $this->assertRole($role);
        $sql = 'SELECT COUNT(*) FROM ' . $this->from($role) . ' WHERE ' . $this->where($role, $includeDeleted);
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($this->bounds($role, $start, $end));

        return (int) $stmt->fetchColumn();
    }

    /** @return array{start: string, end: string} */
    private function bounds(string $role, DateTimeImmutable $start, DateTimeImmutable $end): array
    {
        $source = $role === 'student' ? 'php' : 'db';

        return [
            'start' => $this->period->toStorage($start, $source),
            'end' => $this->period->toStorage($end, $source),
        ];
    }

    private function from(string $role): string
    {
        return match ($role) {
            'student' => 'students s',
            'study_room' => 'study_rooms sr',
            'tutor' => 'tutors t',
        };
    }

    private function where(string $role, bool $includeDeleted): string
    {
        if ($role === 'student') {
            $alive = $includeDeleted ? '1 = 1' : 's.deleted_at IS NULL';

            return 's.published_at IS NOT NULL AND s.published_at >= :start AND s.published_at < :end AND ' . $alive;
        }
        if ($role === 'study_room') {
            $alive = $includeDeleted ? '1 = 1' : 'sr.deleted_at IS NULL';

            return 'sr.created_at >= :start AND sr.created_at < :end AND EXISTS (
                SELECT 1 FROM study_room_regions r
                WHERE r.study_room_id = sr.id AND r.slot = 1 AND r.region_id IS NOT NULL AND r.region_id <> 0
            ) AND ' . $alive;
        }
        return 't.created_at >= :start AND t.created_at < :end AND EXISTS (
            SELECT 1 FROM tutor_regions r
            WHERE r.tutor_id = t.id AND r.priority_order = 0 AND r.region_id IS NOT NULL AND r.region_id <> 0
        )';
    }

    private function selectList(string $role): string
    {
        return match ($role) {
            'student' => 's.id, s.published_at AS registered_at, COALESCE(s.public_display_name, \'\') AS display_name',
            'study_room' => 'sr.id, sr.created_at AS registered_at, sr.study_room_name AS display_name',
            'tutor' => 't.id, t.created_at AS registered_at, t.tutor_display_name AS display_name',
        };
    }

    private function assertRole(string $role): void
    {
        if (!in_array($role, ['study_room', 'tutor', 'student'], true)) {
            throw new InvalidArgumentException('role은 study_room, tutor, student만 가능합니다.');
        }
    }

    /**
     * 159-c 등록 목록. regionId가 없으면 where()와 같은 조건.
     * 숨김 상태는 거르지 않는다. 지역 조건은 LIMIT 앞에 붙는다.
     *
     * @return array{study_room: int, tutor: int, student: int}
     */
    public function countByRoleForAdmin(
        DateTimeImmutable $start,
        DateTimeImmutable $end,
        bool $includeDeleted,
        ?int $regionId = null,
    ): array {
        return [
            'study_room' => $this->countRoleForAdmin('study_room', $start, $end, $includeDeleted, $regionId),
            'tutor' => $this->countRoleForAdmin('tutor', $start, $end, $includeDeleted, $regionId),
            'student' => $this->countRoleForAdmin('student', $start, $end, $includeDeleted, $regionId),
        ];
    }

    /**
     * @return array{total: int, items: list<array{role: string, id: int, registered_at: string, display_name: string, exposure_status: string, region_id: ?int}>}
     */
    public function listByRoleForAdmin(
        string $role,
        DateTimeImmutable $start,
        DateTimeImmutable $end,
        bool $includeDeleted,
        int $page,
        int $perPage,
        ?int $regionId = null,
        ?string $sido = null,
        ?string $name = null,
    ): array {
        $this->assertRole($role);
        $page = max(1, $page);
        $perPage = max(1, min(100, $perPage));
        $offset = ($page - 1) * $perPage;
        $where = $this->adminWhere($role, $includeDeleted, $regionId, $sido, $name);
        $total = $this->countRoleForAdmin($role, $start, $end, $includeDeleted, $regionId, $sido, $name);
        $sql = 'SELECT ' . $this->selectAdmin($role) . ' FROM ' . $this->from($role)
            . ' WHERE ' . $where
            . ' ORDER BY registered_at, id LIMIT ' . $perPage . ' OFFSET ' . $offset;
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($this->adminBounds($role, $start, $end, $regionId, $sido, $name));
        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $region = $row['region_id'] ?? null;
            $items[] = [
                'role' => $role,
                'id' => (int) $row['id'],
                'registered_at' => (string) $row['registered_at'],
                'display_name' => (string) ($row['display_name'] ?? ''),
                'exposure_status' => (string) ($row['exposure_status'] ?? ''),
                'region_id' => $region === null || $region === '' ? null : (int) $region,
            ];
        }

        return ['total' => $total, 'items' => $items];
    }

    private function countRoleForAdmin(
        string $role,
        DateTimeImmutable $start,
        DateTimeImmutable $end,
        bool $includeDeleted,
        ?int $regionId,
        ?string $sido = null,
        ?string $name = null,
    ): int {
        $this->assertRole($role);
        $sql = 'SELECT COUNT(*) FROM ' . $this->from($role) . ' WHERE ' . $this->adminWhere($role, $includeDeleted, $regionId, $sido, $name);
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($this->adminBounds($role, $start, $end, $regionId, $sido, $name));

        return (int) $stmt->fetchColumn();
    }

    private function adminWhere(
        string $role,
        bool $includeDeleted,
        ?int $regionId,
        ?string $sido = null,
        ?string $name = null,
    ): string {
        $where = $this->where($role, $includeDeleted);
        if ($regionId !== null && $regionId > 0) {
            $where .= $this->regionFilterSql($role);
        } elseif ($sido !== null && $sido !== '') {
            $where .= $this->sidoFilterSql($role);
        }
        if (trim((string) $name) !== '') {
            $where .= $this->nameFilterSql($role);
        }

        return $where;
    }

    /** @return array<string, int|string> */
    private function adminBounds(
        string $role,
        DateTimeImmutable $start,
        DateTimeImmutable $end,
        ?int $regionId,
        ?string $sido = null,
        ?string $name = null,
    ): array {
        $bounds = $this->bounds($role, $start, $end);
        if ($regionId !== null && $regionId > 0) {
            [, $extra] = AdminRegionFilter::namedExists($this->representativeRegionExpr($role), $regionId, null);
            foreach ($extra as $key => $value) {
                $bounds[$key] = $value;
            }
        } elseif ($sido !== null && $sido !== '') {
            [, $extra] = AdminRegionFilter::namedExists($this->representativeRegionExpr($role), null, $sido);
            foreach ($extra as $key => $value) {
                $bounds[$key] = $value;
            }
        }
        $trimmed = trim((string) $name);
        if ($trimmed !== '') {
            $bounds['name_like'] = '%' . $trimmed . '%';
        }

        return $bounds;
    }

    private function regionFilterSql(string $role): string
    {
        [$sql] = AdminRegionFilter::namedExists($this->representativeRegionExpr($role), 1, null);

        return ' AND ' . $sql;
    }

    private function sidoFilterSql(string $role): string
    {
        [$sql] = AdminRegionFilter::namedExists($this->representativeRegionExpr($role), null, '00');

        return ' AND ' . $sql;
    }

    private function nameFilterSql(string $role): string
    {
        $column = match ($role) {
            'study_room' => 'sr.study_room_name',
            'tutor' => 't.tutor_display_name',
            'student' => "COALESCE(s.public_display_name,'')",
        };

        return ' AND ' . $column . ' LIKE :name_like';
    }

    private function representativeRegionExpr(string $role): string
    {
        return match ($role) {
            'student' => '(CASE WHEN s.preferred_lesson_type = \'tutor\' THEN s.preferred_tutor_region_id WHEN s.preferred_lesson_type = \'study_room\' THEN s.preferred_studyroom_region_id ELSE NULL END)',
            'study_room' => '(SELECT srr_rep.region_id FROM study_room_regions srr_rep WHERE srr_rep.study_room_id = sr.id AND srr_rep.slot = 1 AND srr_rep.region_id IS NOT NULL AND srr_rep.region_id <> 0 LIMIT 1)',
            'tutor' => '(SELECT tr_rep.region_id FROM tutor_regions tr_rep WHERE tr_rep.tutor_id = t.id AND tr_rep.priority_order = 0 AND tr_rep.region_id IS NOT NULL AND tr_rep.region_id <> 0 LIMIT 1)',
        };
    }

    private function selectAdmin(string $role): string
    {
        return match ($role) {
            'student' => 's.id, s.published_at AS registered_at, COALESCE(s.public_display_name, \'\') AS display_name, s.exposure_status AS exposure_status, '
                . $this->representativeRegionExpr('student') . ' AS region_id',
            'study_room' => 'sr.id, sr.created_at AS registered_at, sr.study_room_name AS display_name, sr.profile_status AS exposure_status, '
                . $this->representativeRegionExpr('study_room') . ' AS region_id',
            'tutor' => 't.id, t.created_at AS registered_at, t.tutor_display_name AS display_name, t.profile_status AS exposure_status, '
                . $this->representativeRegionExpr('tutor') . ' AS region_id',
        };
    }
}
