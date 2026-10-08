/**
 * 사이트오류-21b · 대표지역1 없는 카드 노출 차단
 * 실행: npx --prefix preview/home-ui vite-node scripts/verify-basic-exposure-gate.mjs
 *
 * 가짜 PDO 가 TutorRegisterService · StudyRoomRegisterService · BasicRegisterService
 * · SearchService · NeighborhoodGreetingService · StudyRoomHubService 실경로를 탄다.
 * (e) 회원 publish 동작은 없다(2026-10-09 remove-publish-code). 기본등록 완료 = 노출.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let passed = 0;
let failed = 0;

const PHP_CODE = String.raw`<?php
declare(strict_types=1);
if (!function_exists('mb_substr')) {
    function mb_substr(string $s, int $start, ?int $length = null, ?string $encoding = null): string
    {
        return $length === null ? substr($s, $start) : substr($s, $start, $length);
    }
}
if (!function_exists('mb_strlen')) {
    function mb_strlen(string $s, ?string $encoding = null): int
    {
        return strlen($s);
    }
}
require_once getcwd() . '/src/bootstrap.php';

use Study114\Auth\BasicRegisterService;
use Study114\Database\Connection;
use Study114\Neighborhood\NeighborhoodGreetingService;
use Study114\Registration\StudyRoomHubService;
use Study114\Search\SearchService;
use Study114\StudyRoom\StudyRoomRegisterService;
use Study114\Tutor\TutorRegisterService;

final class GateStmt
{
    private array $rows = [];
    private mixed $column = false;
    private int $cursor = 0;
    public function __construct(private GatePdo $pdo, private string $sql) {}
    public function execute(?array $params = null): bool
    {
        $sql = preg_replace('/\s+/', ' ', trim($this->sql));
        $p = array_values($params ?? []);
        $this->pdo->log[] = $sql;
        $a = $this->pdo->answer($sql, $p);
        $this->rows = $a['rows'] ?? [];
        $this->column = array_key_exists('column', $a) ? $a['column'] : false;
        $this->cursor = 0;
        return true;
    }
    public function fetch(mixed ...$a): mixed { return $this->rows[$this->cursor++] ?? false; }
    public function fetchColumn(mixed ...$a): mixed { return $this->column; }
    public function fetchAll(mixed ...$a): array { return $this->rows; }
    public function bindValue(mixed $k, mixed $v, int $t = 2): bool { return true; }
    public function rowCount(): int { return count($this->rows); }
}

final class GatePdo extends PDO
{
    public array $log = [];
    /** @var list<array<string, mixed>> */
    public array $tutors = [];
    /** @var list<array<string, mixed>> */
    public array $tutorRegions = [];
    /** @var array<int, string> tutor_id => 대표 과목 행 school_level */
    public array $tutorLevels = [];
    /** @var list<array<string, mixed>> */
    public array $rooms = [];
    /** @var list<array<string, mixed>> */
    public array $roomRegions = [];
    public int $tutorInserts = 0;
    public int $roomInserts = 0;
    public int $tutorUpdates = 0;
    public int $roomUpdates = 0;
    public int $nextId = 100;
    private bool $inTx = false;

    public function __construct() {}
    #[\ReturnTypeWillChange] public function prepare(string $q, array $o = []): GateStmt { return new GateStmt($this, $q); }
    #[\ReturnTypeWillChange] public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): GateStmt|false
    {
        $stmt = new GateStmt($this, $query);
        $stmt->execute([]);
        return $stmt;
    }
    #[\ReturnTypeWillChange] public function exec(string $statement): int|false
    {
        $this->log[] = preg_replace('/\s+/', ' ', trim($statement));
        return 0;
    }
    public function beginTransaction(): bool { $this->inTx = true; return true; }
    public function commit(): bool { $this->inTx = false; return true; }
    public function rollBack(): bool { $this->inTx = false; return true; }
    public function inTransaction(): bool { return $this->inTx; }
    public function lastInsertId(?string $name = null): string { return (string) $this->nextId; }

    /** @param list<mixed> $p @return array{rows?: list<array<string, mixed>>, column?: mixed} */
    public function answer(string $sql, array $p): array
    {
        // TutorRegionUnit::fetchRow — 11·22·33 = 광역시 과외 단위(서울·부산·대구)
        if (str_contains($sql, 'FROM regions WHERE id = ? LIMIT 1') && str_contains($sql, 'sido_code')) {
            $units = [
                11 => ['11', '서울특별시'],
                22 => ['26', '부산광역시'],
                33 => ['27', '대구광역시'],
            ];
            $id = (int) ($p[0] ?? 0);
            if (!isset($units[$id])) {
                return ['rows' => []];
            }
            [$code, $name] = $units[$id];
            return ['rows' => [[
                'id' => $id, 'sido_code' => $code, 'sido_name' => $name, 'sigungu_code' => null,
                'sigungu_name' => null, 'unit_level' => 'sido', 'official_code' => $code . '00000000', 'is_active' => 1,
            ]]];
        }
        // TutorBasicFields::missingForTutor
        if (str_contains($sql, 'SELECT * FROM tutors WHERE id = ?')) {
            $id = (int) ($p[0] ?? 0);
            foreach ($this->tutors as $row) {
                if ((int) $row['id'] === $id) {
                    return ['rows' => [$row]];
                }
            }
            return ['rows' => []];
        }
        if (str_contains($sql, 'SELECT school_level FROM tutor_subject_targets')) {
            return ['column' => $this->tutorLevels[(int) ($p[0] ?? 0)] ?? false];
        }
        // TutorBasicFields::write — 대표 과목 행 id 는 tutor_id * 1000
        if (str_contains($sql, 'SELECT id FROM tutor_subject_targets') && str_contains($sql, 'is_primary = 1')) {
            $id = (int) ($p[0] ?? 0);
            return ['column' => isset($this->tutorLevels[$id]) ? $id * 1000 : false];
        }
        if (str_contains($sql, 'UPDATE tutor_subject_targets SET subject_name')) {
            $this->tutorLevels[intdiv((int) ($p[3] ?? 0), 1000)] = (string) ($p[1] ?? '');
            return [];
        }
        if (str_contains($sql, 'INSERT INTO tutor_subject_targets')) {
            $this->tutorLevels[(int) ($p[0] ?? 0)] = (string) ($p[2] ?? '');
            return [];
        }
        // TutorBasicFields::syncProfileStatus
        if (str_contains($sql, 'UPDATE tutors SET profile_status')) {
            $id = (int) ($p[2] ?? 0);
            foreach ($this->tutors as &$row) {
                if ((int) $row['id'] === $id && ($row['profile_status'] ?? '') !== 'hidden') {
                    $row['profile_status'] = (string) ($p[0] ?? '');
                }
            }
            unset($row);
            return [];
        }
        if (str_contains($sql, 'INSERT INTO tutors (')) {
            $this->tutorInserts++;
            $id = ++$this->nextId;
            $this->tutors[] = [
                'id' => $id,
                'user_id' => (int) ($p[0] ?? 0),
                'tutor_display_name' => (string) ($p[1] ?? ''),
                'main_subject_note' => (string) ($p[2] ?? ''),
                'profile_status' => 'draft',
                'has_primary' => false,
            ];
            return [];
        }
        if (str_contains($sql, 'UPDATE tutors SET') && str_contains($sql, 'tutor_display_name')) {
            $this->tutorUpdates++;
            $id = (int) ($p[count($p) - 1] ?? 0);
            foreach ($this->tutors as &$row) {
                if ((int) $row['id'] === $id) {
                    $row['tutor_display_name'] = (string) ($p[0] ?? '');
                    $row['main_subject_note'] = (string) ($p[1] ?? '');
                    if (count($p) === 7) {
                        // TutorBasicFields::write — 이름·과목·월 과외비·주 회수·1회 시간·슬로건·id
                        $row['preferred_fee_amount'] = (int) $p[2];
                        $row['lessons_per_week'] = (int) $p[3];
                        $row['minutes_per_lesson'] = (int) $p[4];
                        $row['slogan'] = (string) $p[5];
                    }
                }
            }
            unset($row);
            return [];
        }
        if (str_contains($sql, 'DELETE FROM tutor_regions')) {
            $id = (int) ($p[0] ?? 0);
            $this->tutorRegions = array_values(array_filter(
                $this->tutorRegions,
                static fn (array $r): bool => (int) $r['tutor_id'] !== $id
            ));
            $this->syncTutorPrimary();
            return [];
        }
        if (str_contains($sql, 'INSERT INTO tutor_regions')) {
            $this->tutorRegions[] = [
                'tutor_id' => (int) $p[0],
                'region_id' => (int) $p[1],
                'scope_type' => (string) $p[2],
                'priority_order' => (int) $p[3],
                'is_primary' => (int) $p[4],
            ];
            $this->syncTutorPrimary();
            return [];
        }
        if (str_contains($sql, 'INSERT INTO study_rooms (')) {
            $this->roomInserts++;
            $id = ++$this->nextId;
            $this->rooms[] = [
                'id' => $id,
                'user_id' => (int) ($p[0] ?? 0),
                'study_room_name' => (string) ($p[1] ?? ''),
                'profile_status' => 'draft',
                'has_primary' => false,
            ];
            return [];
        }
        if (str_contains($sql, 'UPDATE study_rooms SET') && str_contains($sql, 'study_room_name')) {
            $this->roomUpdates++;
            return [];
        }
        if (str_contains($sql, 'UPDATE study_rooms SET profile_status')) {
            $id = (int) ($p[2] ?? 0);
            foreach ($this->rooms as &$row) {
                if ((int) $row['id'] === $id) {
                    $row['profile_status'] = (string) ($p[0] ?? '');
                }
            }
            unset($row);
            return [];
        }
        if (str_contains($sql, 'DELETE FROM study_room_regions')) {
            $id = (int) ($p[0] ?? 0);
            $this->roomRegions = array_values(array_filter(
                $this->roomRegions,
                static fn (array $r): bool => (int) $r['study_room_id'] !== $id
            ));
            $this->syncRoomPrimary();
            return [];
        }
        if (str_contains($sql, 'INSERT INTO study_room_regions')) {
            $this->roomRegions[] = [
                'study_room_id' => (int) $p[0],
                'slot' => (int) $p[1],
                'region_id' => (int) $p[2],
            ];
            $this->syncRoomPrimary();
            return [];
        }
        if (str_contains($sql, 'FROM user_roles')) {
            return ['column' => 1];
        }
        if (str_contains($sql, 'SELECT email_verified_at FROM users')) {
            return ['rows' => [['email_verified_at' => '2026-01-01 00:00:00']], 'column' => '2026-01-01 00:00:00'];
        }
        if (str_contains($sql, 'SELECT id FROM users WHERE id = ? FOR UPDATE')) {
            return ['column' => 1, 'rows' => [['id' => 1]]];
        }
        if (str_contains($sql, 'SELECT id FROM tutors WHERE user_id = ?')) {
            $id = $this->firstTutorIdForUser((int) ($p[0] ?? 0));
            return ['column' => $id ?? false];
        }
        if (str_contains($sql, 'SELECT id FROM study_rooms') && str_contains($sql, 'user_id')) {
            $id = $this->firstRoomIdForUser((int) ($p[0] ?? 0));
            return ['column' => $id ?? false];
        }
        if (str_contains($sql, 'SELECT 1 FROM tutors t') && str_contains($sql, 'user_id')) {
            return ['column' => $this->userHasVisibleTutor((int) ($p[0] ?? 0), str_contains($sql, 'priority_order = 0')) ? 1 : false];
        }
        if (str_contains($sql, 'SELECT 1 FROM study_rooms sr') && str_contains($sql, 'user_id')) {
            return ['column' => $this->userHasVisibleRoom((int) ($p[0] ?? 0), str_contains($sql, 'slot = 1')) ? 1 : false];
        }
        if (str_contains($sql, 'SELECT 1 FROM tutor_regions') && str_contains($sql, 'tutor_id = ?')) {
            $id = (int) ($p[0] ?? 0);
            $gated = str_contains($sql, 'priority_order = 0');
            foreach ($this->tutorRegions as $r) {
                if ((int) $r['tutor_id'] !== $id) {
                    continue;
                }
                if ($gated && (int) $r['priority_order'] !== 0) {
                    continue;
                }
                if ((int) $r['region_id'] > 0) {
                    return ['column' => 1, 'rows' => [$r]];
                }
            }
            return ['column' => false];
        }
        if (str_contains($sql, 'SELECT region_id FROM tutor_regions') || (str_contains($sql, 'FROM tutor_regions') && str_contains($sql, 'priority_order = 0') && str_contains($sql, 'tutor_id = ?'))) {
            $id = (int) ($p[0] ?? 0);
            foreach ($this->tutorRegions as $r) {
                if ((int) $r['tutor_id'] === $id && (int) $r['priority_order'] === 0 && (int) $r['region_id'] > 0) {
                    return ['column' => (int) $r['region_id'], 'rows' => [$r]];
                }
            }
            return ['column' => false];
        }
        if (str_contains($sql, 'SELECT 1 FROM study_room_regions') && str_contains($sql, 'study_room_id = ?')) {
            $id = (int) ($p[0] ?? 0);
            $gated = str_contains($sql, 'slot = 1');
            foreach ($this->roomRegions as $r) {
                if ((int) $r['study_room_id'] !== $id) {
                    continue;
                }
                if ($gated && (int) $r['slot'] !== 1) {
                    continue;
                }
                if ((int) $r['region_id'] > 0) {
                    return ['column' => 1];
                }
            }
            return ['column' => false];
        }
        if (str_contains($sql, 'FROM regions') && (str_contains($sql, 'is_selectable = 1') || str_contains($sql, 'is_active = 1'))) {
            $id = (int) ($p[0] ?? 0);
            return ['column' => in_array($id, [11, 22, 33], true) ? ($id > 0 ? $id : 1) : false];
        }
        if (str_contains($sql, 'information_schema') && str_contains($sql, 'COUNT(*)')) {
            $col = (string) ($p[1] ?? '');
            $yes = in_array($col, ['deleted_at', 'region_basis_type', 'address_line2', 'address_zip'], true);
            return ['column' => $yes ? 1 : 0];
        }
        if (str_contains($sql, 'information_schema') || str_starts_with($sql, 'SHOW ')) {
            return ['column' => str_starts_with($sql, 'SHOW ') ? 1 : false, 'rows' => str_starts_with($sql, 'SHOW ') ? [['Field' => 'x']] : []];
        }
        if (str_contains($sql, 'SELECT 1 FROM user_profiles') || str_contains($sql, 'SELECT gender FROM user_profiles')) {
            return ['column' => str_contains($sql, 'gender') ? 'male' : 1];
        }
        // 검색 목록 SQL 은 성별 하위 조회(user_profiles)를 품는다(d29fa20) — 아래 목록 응답으로 보낸다.
        if (str_contains($sql, 'FROM user_profiles') && !str_contains($sql, 'FROM tutors t')) {
            return ['rows' => [], 'column' => false];
        }
        if (str_contains($sql, 'COUNT(DISTINCT t.id)') && str_contains($sql, 'FROM tutors t')) {
            return ['column' => $this->countVisibleTutors(str_contains($sql, 'priority_order = 0'))];
        }
        if (str_contains($sql, 'FROM tutors t') && str_contains($sql, 'tutor_display_name') && str_contains($sql, 't.id = ?')) {
            return $this->tutorCard((int) ($p[0] ?? 0), str_contains($sql, 'priority_order = 0'));
        }
        if (str_contains($sql, 'FROM tutors t') && str_contains($sql, 'tutor_display_name')) {
            return ['rows' => $this->tutorListRows(str_contains($sql, 'priority_order = 0'))];
        }
        if (str_contains($sql, 'COUNT(DISTINCT sr.id)') && str_contains($sql, 'FROM study_rooms sr')) {
            return ['column' => $this->countVisibleRooms(str_contains($sql, 'srr_gate.slot = 1'))];
        }
        if (str_contains($sql, 'SELECT sr.* FROM study_rooms sr') && str_contains($sql, 'user_id')) {
            $id = (int) ($p[0] ?? 0);
            $userId = (int) ($p[1] ?? 0);
            foreach ($this->rooms as $row) {
                if ((int) $row['id'] === $id && (int) $row['user_id'] === $userId) {
                    return ['rows' => [$this->roomHydrateRow($row)]];
                }
            }
            return ['rows' => []];
        }
        if (str_contains($sql, 'FROM study_rooms sr') && str_contains($sql, 'study_room_name') && str_contains($sql, 'sr.id = ?')) {
            return $this->roomCard((int) ($p[0] ?? 0));
        }
        if (str_contains($sql, 'FROM study_rooms sr') && str_contains($sql, 'study_room_name')) {
            return ['rows' => $this->roomListRows(str_contains($sql, 'srr_gate.slot = 1'))];
        }
        return ['column' => false, 'rows' => []];
    }

    private function syncTutorPrimary(): void
    {
        foreach ($this->tutors as &$tutor) {
            $tutor['has_primary'] = false;
            foreach ($this->tutorRegions as $r) {
                if ((int) $r['tutor_id'] === (int) $tutor['id'] && (int) $r['priority_order'] === 0 && (int) $r['region_id'] > 0) {
                    $tutor['has_primary'] = true;
                }
            }
        }
        unset($tutor);
    }

    private function syncRoomPrimary(): void
    {
        foreach ($this->rooms as &$room) {
            $room['has_primary'] = false;
            foreach ($this->roomRegions as $r) {
                if ((int) $r['study_room_id'] === (int) $room['id'] && (int) $r['slot'] === 1 && (int) $r['region_id'] > 0) {
                    $room['has_primary'] = true;
                }
            }
        }
        unset($room);
    }

    private function firstTutorIdForUser(int $userId): ?int
    {
        $ids = [];
        foreach ($this->tutors as $row) {
            if ((int) $row['user_id'] === $userId) {
                $ids[] = (int) $row['id'];
            }
        }
        if ($ids === []) {
            return null;
        }
        sort($ids);
        return $ids[0];
    }

    private function firstRoomIdForUser(int $userId): ?int
    {
        $ids = [];
        foreach ($this->rooms as $row) {
            if ((int) $row['user_id'] === $userId) {
                $ids[] = (int) $row['id'];
            }
        }
        if ($ids === []) {
            return null;
        }
        sort($ids);
        return $ids[0];
    }

    private function userHasVisibleTutor(int $userId, bool $gated): bool
    {
        foreach ($this->tutors as $row) {
            if ((int) $row['user_id'] !== $userId) {
                continue;
            }
            if (!$gated || !empty($row['has_primary'])) {
                return true;
            }
        }
        return false;
    }

    private function userHasVisibleRoom(int $userId, bool $gated): bool
    {
        foreach ($this->rooms as $row) {
            if ((int) $row['user_id'] !== $userId) {
                continue;
            }
            if (!$gated || !empty($row['has_primary'])) {
                return true;
            }
        }
        return false;
    }

    private function countVisibleTutors(bool $gated): int
    {
        $n = 0;
        foreach ($this->tutors as $row) {
            if (($row['profile_status'] ?? '') === 'hidden') {
                continue;
            }
            if ($gated && empty($row['has_primary'])) {
                continue;
            }
            $n++;
        }
        return $n;
    }

    private function countVisibleRooms(bool $gated): int
    {
        $n = 0;
        foreach ($this->rooms as $row) {
            if (($row['profile_status'] ?? '') === 'hidden') {
                continue;
            }
            if ($gated && empty($row['has_primary'])) {
                continue;
            }
            $n++;
        }
        return $n;
    }

    /** @return list<array<string, mixed>> */
    private function tutorListRows(bool $gated): array
    {
        $rows = [];
        foreach ($this->tutors as $row) {
            if (($row['profile_status'] ?? '') === 'hidden') {
                continue;
            }
            if ($gated && empty($row['has_primary'])) {
                continue;
            }
            $rows[] = $this->tutorSearchRow($row);
        }
        return $rows;
    }

    /** @return list<array<string, mixed>> */
    private function roomListRows(bool $gated): array
    {
        $rows = [];
        foreach ($this->rooms as $row) {
            if (($row['profile_status'] ?? '') === 'hidden') {
                continue;
            }
            if ($gated && empty($row['has_primary'])) {
                continue;
            }
            $rows[] = $this->roomSearchRow($row);
        }
        return $rows;
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function tutorSearchRow(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'tutor_display_name' => (string) $row['tutor_display_name'],
            'preferred_fee_amount' => null,
            'university_name' => null,
            'major_name' => null,
            'career_year_band' => null,
            'university_status' => null,
            'proof_document_available' => 0,
            'lessons_per_week' => null,
            'minutes_per_lesson' => null,
            'detail_completion_status' => 'basic_only',
            'profile_status' => (string) $row['profile_status'],
            'published_at' => null,
            'created_at' => '2026-01-01 00:00:00',
            'recommend_count' => 0,
            'review_count' => 0,
            'subject_name' => (string) ($row['main_subject_note'] ?? ''),
            'sigungu_name' => '',
            'sido_name' => '',
        ];
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function roomSearchRow(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'study_room_name' => (string) $row['study_room_name'],
            'price_amount' => null,
            'intro_short' => '',
            'intro_long' => '',
            'main_subject_note' => '',
            'teaching_style' => '',
            'grade_band' => null,
            'audience_label' => '',
            'feature_1' => '',
            'feature_2' => '',
            'feature_3' => '',
            'slogan' => '',
            'lesson_place_type' => null,
            'capacity_per_time' => null,
            'lesson_operation_type' => null,
            'facility_note' => '',
            'inquiry_status' => 'open',
            'profile_status' => (string) $row['profile_status'],
            'education_office_registered' => 0,
            'detail_completion_status' => 'basic_only',
            'career_years' => null,
            'business_registration_available' => 0,
            'latitude' => null,
            'longitude' => null,
            'published_at' => null,
            'created_at' => '2026-01-01 00:00:00',
            'recommend_count' => 0,
            'review_count' => 0,
            'dong_name' => '',
            'sigungu_name' => '',
            'complex_name' => '',
            'promo_dong_name' => '',
            'promo_sigungu_name' => '',
            'promo_complex_name' => '',
            'promo_basis' => '',
            'image_path_prime' => '',
            'image_path_basic' => '',
        ];
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function roomHydrateRow(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'user_id' => (int) $row['user_id'],
            'study_room_name' => (string) $row['study_room_name'],
            'profile_status' => (string) $row['profile_status'],
            'inquiry_status' => 'open',
            'detail_completion_status' => 'basic_only',
            'region_id' => null,
            'complex_id' => null,
            'main_subject_note' => '',
            'price_amount' => null,
            'intro_short' => null,
            'intro_long' => null,
            'slogan' => null,
            'feature_1' => null,
            'career_years' => null,
            'education_office_registered' => 0,
            'weekend_available' => 0,
            'one_on_one_available' => 0,
            'lesson_place_type' => 'study_room',
            'capacity_per_time' => null,
            'created_at' => '2026-01-01 00:00:00',
            'updated_at' => '2026-01-02 00:00:00',
            'published_at' => null,
            'deleted_at' => null,
        ];
    }

    /** @return array{rows?: list<array<string, mixed>>, column?: mixed} */
    private function tutorCard(int $id, bool $gated): array
    {
        foreach ($this->tutors as $row) {
            if ((int) $row['id'] !== $id) {
                continue;
            }
            if (($row['profile_status'] ?? '') === 'hidden') {
                return ['rows' => []];
            }
            if ($gated && empty($row['has_primary'])) {
                return ['rows' => []];
            }
            return ['rows' => [[
                'id' => $id,
                'tutor_display_name' => (string) $row['tutor_display_name'],
                'main_subject_note' => (string) ($row['main_subject_note'] ?? ''),
                'profile_status' => (string) $row['profile_status'],
                'preferred_fee_amount' => null,
                'lessons_per_week' => null,
                'minutes_per_lesson' => null,
                'feature_1' => '',
                'feature_2' => '',
                'feature_3' => '',
                'university_name' => '',
                'major_name' => '',
                'career_year_band' => null,
                'intro_short' => '',
                'dong_name' => '',
                'sigungu_name' => '',
                'sido_name' => '',
            ]]];
        }
        return ['rows' => []];
    }

    /** @return array{rows?: list<array<string, mixed>>, column?: mixed} */
    private function roomCard(int $id): array
    {
        foreach ($this->rooms as $row) {
            if ((int) $row['id'] !== $id) {
                continue;
            }
            if (($row['profile_status'] ?? '') === 'hidden') {
                return ['rows' => []];
            }
            return ['rows' => [[
                'id' => $id,
                'study_room_name' => (string) $row['study_room_name'],
                'slogan' => '',
                'intro_short' => '',
                'intro_long' => '',
                'main_subject_note' => '',
                'feature_1' => '',
                'feature_2' => '',
                'feature_3' => '',
                'teaching_style' => '',
                'lesson_place_type' => 'study_room',
                'capacity_per_time' => null,
                'lesson_operation_type' => null,
                'price_amount' => null,
                'facility_note' => '',
                'inquiry_status' => 'open',
                'profile_status' => (string) $row['profile_status'],
                'price_description' => '',
                'minutes_per_lesson' => null,
                'lessons_per_week' => null,
                'career_years' => null,
                'academy_career_years' => null,
                'latitude' => null,
                'longitude' => null,
                'dong_name' => '',
                'sigungu_name' => '',
                'complex_name' => '',
            ]]];
        }
        return ['rows' => []];
    }
}

function inject(GatePdo $pdo): void
{
    (new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);
}

function ok(string $name, bool $cond, string $detail = ''): void
{
    echo ($cond ? 'PASS  ' : 'FAIL  ') . $name . ($cond || $detail === '' ? '' : ' — ' . $detail) . "\n";
}

$basic = new BasicRegisterService();

$empty = new GatePdo();
inject($empty);
ok('(b) 과외쌤 행 없음 needs=true', $basic->needsBasicRegister(1, 'tutor') === true);
ok('(b) 공부방 행 없음 needs=true', $basic->needsBasicRegister(4, 'study_room_owner') === true);

$rowOnly = new GatePdo();
inject($rowOnly);
$rowOnly->tutors[] = ['id' => 5, 'user_id' => 1, 'tutor_display_name' => '임시', 'main_subject_note' => '', 'profile_status' => 'draft', 'has_primary' => false];
$rowOnly->rooms[] = ['id' => 8, 'user_id' => 4, 'study_room_name' => '임시방', 'profile_status' => 'draft', 'has_primary' => false];
ok('(b) 과외쌤 행만 있고 대표1 없음 needs=true', $basic->needsBasicRegister(1, 'tutor') === true);
ok('(b) 공부방 행만 있고 홍보1 없음 needs=true', $basic->needsBasicRegister(4, 'study_room_owner') === true);

$done = new GatePdo();
inject($done);
// 과외쌤 기본등록 완료 = 필수 8개(정본 73 0절). 공부방 = 홍보지역 1.
$done->tutors[] = [
    'id' => 5, 'user_id' => 1, 'tutor_display_name' => '완성', 'main_subject_note' => '수학',
    'preferred_fee_amount' => 300000, 'lessons_per_week' => 2, 'minutes_per_lesson' => 60, 'slogan' => '슬로건',
    'profile_status' => 'draft', 'has_primary' => true,
];
$done->tutorLevels[5] = 'high';
$done->tutorRegions[] = ['tutor_id' => 5, 'region_id' => 11, 'scope_type' => 'city', 'priority_order' => 0, 'is_primary' => 1];
$done->rooms[] = ['id' => 8, 'user_id' => 4, 'study_room_name' => '완성방', 'profile_status' => 'draft', 'has_primary' => true];
$done->roomRegions[] = ['study_room_id' => 8, 'slot' => 1, 'region_id' => 11];
ok('(b) 과외쌤 필수 8개+대표1 needs=false', $basic->needsBasicRegister(1, 'tutor') === false);
ok('(b) 공부방 행+홍보1 needs=false', $basic->needsBasicRegister(4, 'study_room_owner') === false);
$done->tutors[0]['slogan'] = '';
ok('(b) 과외쌤 대표1 있어도 슬로건 빠지면 needs=true', $basic->needsBasicRegister(1, 'tutor') === true);

$draft = new GatePdo();
inject($draft);
$tutorSvc = new TutorRegisterService();
$tutorMsg = null;
try {
    $tutorSvc->saveStep(1, null, 'basic', ['tutor_display_name' => '지역없는쌤', 'gender' => 'male']);
} catch (InvalidArgumentException $e) {
    $tutorMsg = $e->getMessage();
}
$tutorInserted = false;
foreach ($draft->log as $sql) {
    if (str_contains($sql, 'INSERT INTO tutors (')) {
        $tutorInserted = true;
    }
}
ok('(a) 과외쌤 지역 없는 임시행 거부 문구', $tutorMsg === '과외지역 1을 선택해 주세요.', (string) $tutorMsg);
ok('(a) 과외쌤 임시행 거부 후 행 0', count($draft->tutors) === 0 && $draft->tutorInserts === 0 && !$tutorInserted, 'inserts=' . $draft->tutorInserts . ' rows=' . count($draft->tutors));

$roomSvc = new StudyRoomRegisterService();
$roomMsg = null;
try {
    $roomSvc->saveStep(4, null, 'basic', [
        'study_room_name' => '지역없는방',
        'lesson_place_type' => 'study_room',
    ]);
} catch (InvalidArgumentException $e) {
    $roomMsg = $e->getMessage();
} catch (Throwable $e) {
    $roomMsg = get_class($e) . ': ' . $e->getMessage();
}
$roomInserted = false;
foreach ($draft->log as $sql) {
    if (str_contains($sql, 'INSERT INTO study_rooms (')) {
        $roomInserted = true;
    }
}
ok('(a) 공부방 basic 단독 임시행 거부 문구', $roomMsg === '홍보지역 1(대표)을 선택해 주세요.', (string) $roomMsg);
ok('(a) 공부방 임시행 거부 후 행 0', count($draft->rooms) === 0 && $draft->roomInserts === 0 && !$roomInserted, 'inserts=' . $draft->roomInserts . ' rows=' . count($draft->rooms) . ' msg=' . (string) $roomMsg);

$fixTutor = new GatePdo();
inject($fixTutor);
$fixTutor->tutors[] = ['id' => 5, 'user_id' => 1, 'tutor_display_name' => '미완', 'main_subject_note' => '', 'profile_status' => 'draft', 'has_primary' => false];
$beforeTutors = count($fixTutor->tutors);
$beforeInserts = $fixTutor->tutorInserts;
$tutorResult = $basic->register(1, 'tutor', [
    'tutor_display_name' => '완성쌤',
    'main_subject_note' => '수학',
    'school_level' => 'high',
    'preferred_fee_amount' => '300000',
    'lessons_per_week' => '2',
    'minutes_per_lesson' => '60',
    'slogan' => '슬로건',
    'saved_regions' => [
        ['region_id' => '11', 'scope_type' => 'city'],
        ['region_id' => '22', 'scope_type' => 'city'],
    ],
]);
$slot1 = false;
foreach ($fixTutor->tutorRegions as $r) {
    if ((int) $r['tutor_id'] === 5 && (int) $r['priority_order'] === 0 && (int) $r['region_id'] === 11) {
        $slot1 = true;
    }
}
ok('(c) 불완전 과외쌤 제출은 기존 id', ($tutorResult['id'] ?? 0) === 5 && ($tutorResult['kind'] ?? '') === 'tutor', json_encode($tutorResult, JSON_UNESCAPED_UNICODE));
ok('(c) 과외쌤 행 수 불변·INSERT 없음·UPDATE 있음', count($fixTutor->tutors) === $beforeTutors && $fixTutor->tutorInserts === $beforeInserts && $fixTutor->tutorUpdates >= 1, 'rows=' . count($fixTutor->tutors) . ' ins=' . $fixTutor->tutorInserts . ' upd=' . $fixTutor->tutorUpdates);
ok('(c) 과외쌤 대표1이 UPDATE 경로로 저장', $slot1, json_encode($fixTutor->tutorRegions, JSON_UNESCAPED_UNICODE));
ok('(c) 과외쌤 기본등록 완료 → 노출중(published)', ($fixTutor->tutors[0]['profile_status'] ?? '') === 'published', (string) ($fixTutor->tutors[0]['profile_status'] ?? ''));

$fixRoom = new GatePdo();
inject($fixRoom);
$fixRoom->rooms[] = ['id' => 8, 'user_id' => 4, 'study_room_name' => '미완방', 'profile_status' => 'draft', 'has_primary' => false];
$beforeRooms = count($fixRoom->rooms);
$beforeRoomInserts = $fixRoom->roomInserts;
$roomResult = $basic->register(4, 'study_room', [
    'study_room_name' => '완성방',
    'main_subject_note' => '수학',
    'lesson_place_type' => 'study_room',
    'slogan' => '슬로건',
    'gender' => 'male',
    'home_address' => '서울시 강남구',
    'address_text' => '서울시 강남구 대치동 1',
    'region_id' => '11',
    'primary_school_levels' => ['middle'],
    'saved_regions' => [
        ['region_id' => '11'],
    ],
]);
$promo1 = false;
foreach ($fixRoom->roomRegions as $r) {
    if ((int) $r['study_room_id'] === 8 && (int) $r['slot'] === 1 && (int) $r['region_id'] === 11) {
        $promo1 = true;
    }
}
ok('(c) 불완전 공부방 제출은 기존 id', ($roomResult['id'] ?? 0) === 8 && ($roomResult['kind'] ?? '') === 'study_room', json_encode($roomResult, JSON_UNESCAPED_UNICODE));
ok('(c) 공부방 행 수 불변·INSERT 없음·UPDATE 있음', count($fixRoom->rooms) === $beforeRooms && $fixRoom->roomInserts === $beforeRoomInserts && $fixRoom->roomUpdates >= 1, 'rows=' . count($fixRoom->rooms) . ' ins=' . $fixRoom->roomInserts . ' upd=' . $fixRoom->roomUpdates);
ok('(c) 공부방 홍보1이 UPDATE 경로로 저장', $promo1, json_encode($fixRoom->roomRegions, JSON_UNESCAPED_UNICODE));

$searchPdo = new GatePdo();
inject($searchPdo);
$searchPdo->tutors = [
    ['id' => 1, 'user_id' => 1, 'tutor_display_name' => '있는쌤', 'main_subject_note' => '수학', 'profile_status' => 'draft', 'has_primary' => true],
    ['id' => 2, 'user_id' => 2, 'tutor_display_name' => '없는쌤', 'main_subject_note' => '영어', 'profile_status' => 'draft', 'has_primary' => false],
];
$searchPdo->rooms = [
    ['id' => 11, 'user_id' => 4, 'study_room_name' => '있는방', 'profile_status' => 'draft', 'has_primary' => true],
    ['id' => 12, 'user_id' => 5, 'study_room_name' => '없는방', 'profile_status' => 'draft', 'has_primary' => false],
];
$searchPdo->roomRegions[] = ['study_room_id' => 11, 'slot' => 1, 'region_id' => 11];
$search = new SearchService();
$tutorFound = $search->search('tutor', [], 1, 20);
$roomFound = $search->search('room', [], 1, 20);
$tutorIds = array_map(static fn (array $it): int => (int) $it['id'], $tutorFound['items']);
$roomIds = array_map(static fn (array $it): int => (int) $it['id'], $roomFound['items']);
$tutorCountSql = false;
$roomCountSql = false;
$tutorListSql = false;
$roomListSql = false;
foreach ($searchPdo->log as $sql) {
    if (str_contains($sql, 'COUNT(DISTINCT t.id)') && str_contains($sql, 'priority_order = 0')) {
        $tutorCountSql = true;
    }
    if (str_contains($sql, 'COUNT(DISTINCT sr.id)') && str_contains($sql, 'srr_gate.slot = 1')) {
        $roomCountSql = true;
    }
    if (str_contains($sql, 'tutor_display_name') && str_contains($sql, 'priority_order = 0') && !str_contains($sql, 'COUNT(')) {
        $tutorListSql = true;
    }
    if (str_contains($sql, 'study_room_name') && str_contains($sql, 'srr_gate.slot = 1') && !str_contains($sql, 'COUNT(') && !str_contains($sql, 'sr.id = ?')) {
        $roomListSql = true;
    }
}
ok('(d) 과외쌤 검색은 대표1 있는 행만', $tutorFound['total'] === 1 && $tutorIds === [1], 'total=' . $tutorFound['total'] . ' ids=' . json_encode($tutorIds));
ok('(d) 공부방 검색은 홍보1 있는 행만', $roomFound['total'] === 1 && $roomIds === [11], 'total=' . $roomFound['total'] . ' ids=' . json_encode($roomIds));
ok('(d) 과외쌤 카운트·목록 SQL에 대표1 EXISTS', $tutorCountSql && $tutorListSql);
ok('(d) 공부방 카운트·목록 SQL에 홍보1 EXISTS', $roomCountSql && $roomListSql);

$greet = new NeighborhoodGreetingService(sys_get_temp_dir() . '/study114-gate-greet-empty.json');
$withTutor = $greet->basicCard('tutor', 1);
$withoutTutor = $greet->basicCard('tutor', 2);
$withRoom = $greet->basicCard('study_room', 11);
$withoutRoom = $greet->basicCard('study_room', 12);
ok('(d) 인사 카드는 대표1 있는 과외쌤만', is_array($withTutor) && $withoutTutor === null, json_encode([$withTutor['id'] ?? null, $withoutTutor], JSON_UNESCAPED_UNICODE));
ok('(d) 인사 카드는 홍보1 있는 공부방만', is_array($withRoom) && (int) ($withRoom['id'] ?? 0) === 11 && $withoutRoom === null, json_encode([$withRoom['id'] ?? null, $withoutRoom], JSON_UNESCAPED_UNICODE));

$pub = new GatePdo();
inject($pub);
$pub->rooms[] = ['id' => 8, 'user_id' => 4, 'study_room_name' => '미완방', 'profile_status' => 'draft', 'has_primary' => false];
$hub = new StudyRoomHubService();
$pubMsg = null;
try {
    $hub->applyAction(4, 8, 'publish', []);
} catch (InvalidArgumentException $e) {
    $pubMsg = $e->getMessage();
} catch (Throwable $e) {
    $pubMsg = get_class($e) . ': ' . $e->getMessage();
}
ok('(e) 공부방 회원 publish 동작 없음', $pubMsg === '지원하지 않는 요청입니다.', (string) $pubMsg);
ok('(e) 거부 시 profile_status 는 draft', ($pub->rooms[0]['profile_status'] ?? '') === 'draft', (string) ($pub->rooms[0]['profile_status'] ?? ''));
`;

function phpBin() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  if (existsSync('D:\\php8.2\\php.exe')) return 'D:\\php8.2\\php.exe';
  return 'php';
}

console.log('##### 서버 (가짜 PDO) #####');
const php = spawnSync(phpBin(), [], {
  cwd: ROOT,
  input: PHP_CODE,
  encoding: 'utf8',
  maxBuffer: 8 * 1024 * 1024,
});
const phpOut = `${php.stdout || ''}`;
const phpErr = `${php.stderr || ''}`;
for (const line of phpOut.split(/\r?\n/)) {
  if (line.startsWith('PASS  ')) {
    passed += 1;
    console.log(line);
  } else if (line.startsWith('FAIL  ')) {
    failed += 1;
    console.log(line);
  } else if (line.trim()) {
    console.log(line);
  }
}
if (php.status !== 0) {
  failed += 1;
  console.error('FAIL  PHP 검사 프로세스');
  if (phpErr.trim()) console.error(phpErr.slice(0, 4000));
  if (!phpOut.trim() && php.stdout) console.error(String(php.stdout).slice(0, 2000));
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
