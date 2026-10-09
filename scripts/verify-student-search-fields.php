<?php

declare(strict_types=1);

/**
 * 학생 검색 응답 = 학생 카드 칸 (2026-10-09 student-card-fields)
 * 가짜 PDO 만 쓴다. DB·운영 서버에 접속하지 않는다. 견본 데이터를 만들지 않는다(가짜 PDO 안의 행뿐).
 * 사용: php scripts/verify-student-search-fields.php
 *       SSF_ROOT=<폴더> 이면 그 폴더의 src 로 돈다(수정 전 비교용).
 */

$root = getenv('SSF_ROOT') ?: dirname(__DIR__);
require_once $root . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Search\SearchService;

final class SsfStmt
{
    /** @var array<string|int, mixed> */
    private array $bound = [];
    private array $rows = [];
    private mixed $column = false;
    private int $cursor = 0;

    public function __construct(private SsfPdo $pdo, private string $sql) {}

    public function bindValue(mixed $k, mixed $v, int $t = 2): bool
    {
        $this->bound[ltrim((string) $k, ':')] = $v;

        return true;
    }

    public function execute(?array $params = null): bool
    {
        $sql = preg_replace('/\s+/', ' ', trim($this->sql)) ?? '';
        $all = $this->bound;
        foreach ($params ?? [] as $k => $v) {
            $all[is_int($k) ? $k : ltrim((string) $k, ':')] = $v;
        }
        $this->pdo->log[] = $sql;
        $a = $this->pdo->answer($sql, $all);
        $this->rows = $a['rows'] ?? [];
        $this->column = array_key_exists('column', $a) ? $a['column'] : false;
        $this->cursor = 0;

        return true;
    }

    public function fetch(mixed ...$a): mixed
    {
        return $this->rows[$this->cursor++] ?? false;
    }

    public function fetchColumn(mixed ...$a): mixed
    {
        return $this->column;
    }

    public function fetchAll(mixed ...$a): array
    {
        return $this->rows;
    }
}

final class SsfPdo extends PDO
{
    /** @var list<string> */
    public array $log = [];

    /** @var list<array<string, mixed>> */
    public array $students = [];

    /** @var list<array{student_id: int, place_type: string, id: int}> */
    public array $places = [];

    /** @var list<array{student_id: int, badge_name: string, display_order: int, id: int}> */
    public array $badges = [];

    public function __construct() {}

    #[\ReturnTypeWillChange]
    public function prepare(string $q, array $o = []): SsfStmt
    {
        return new SsfStmt($this, $q);
    }

    #[\ReturnTypeWillChange]
    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): SsfStmt|false
    {
        $stmt = new SsfStmt($this, $query);
        $stmt->execute([]);

        return $stmt;
    }

    /** @param array<string|int, mixed> $p */
    public function answer(string $sql, array $p): array
    {
        if (str_contains($sql, 'FROM student_preferred_lesson_places')) {
            return ['rows' => $this->listRows($p, $this->places, 'place_type')];
        }
        if (str_contains($sql, 'FROM student_preferred_teaching_style_badges')) {
            $rows = $this->badges;
            usort($rows, static fn (array $a, array $b): int => [$a['student_id'], $a['display_order'], $a['id']] <=> [$b['student_id'], $b['display_order'], $b['id']]);

            return ['rows' => $this->listRows($p, $rows, 'badge_name')];
        }
        if (str_contains($sql, 'FROM students s')) {
            if (str_contains($sql, 'COUNT(DISTINCT s.id)')) {
                return ['column' => count($this->students)];
            }

            return ['rows' => array_map(fn (array $row): array => $this->selected($sql, $row), $this->students)];
        }

        return ['column' => false, 'rows' => []];
    }

    /**
     * SELECT 에 실제로 있는 칸만 돌려준다(SELECT 에서 빠지면 응답도 빈다).
     *
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function selected(string $sql, array $row): array
    {
        $select = substr($sql, 0, (int) strpos($sql, ' FROM students s'));
        $out = [];
        foreach ($row as $k => $v) {
            $col = match ($k) {
                'complex_name' => 'c.name AS complex_name',
                'subject_name' => 'sst.subject_name',
                'budget_amount' => 'AS budget_amount',
                default => null,
            };
            $inSelect = $col !== null
                ? str_contains($select, $col)
                : (bool) preg_match('/\b(s|r)\.' . preg_quote($k, '/') . '\b/', $select);
            $out[$k] = $inSelect ? $v : null;
        }

        return $out;
    }

    /**
     * @param array<string|int, mixed> $p
     * @param list<array<string, mixed>> $table
     * @return list<array{student_id: int, code: string}>
     */
    private function listRows(array $p, array $table, string $col): array
    {
        $ids = array_map('intval', array_values(array_filter($p, 'is_int', ARRAY_FILTER_USE_KEY)));
        $out = [];
        foreach ($table as $row) {
            if (in_array((int) $row['student_id'], $ids, true)) {
                $out[] = ['student_id' => $row['student_id'], 'code' => $row[$col]];
            }
        }

        return $out;
    }
}

/** @param array<string, mixed> $over */
function studentRow(int $id, array $over = []): array
{
    return array_merge([
        'id' => $id, 'public_display_name' => '학생' . $id, 'grade_level' => '중2', 'gender' => 'male',
        'lesson_format' => 'group', 'student_gender_group' => 'male', 'preferred_student_count_group' => 'two',
        'preferred_fee_amount' => 300000, 'preferred_studyroom_fee_amount' => null, 'preferred_lesson_type' => 'tutor',
        'lessons_per_week' => 2, 'minutes_per_lesson' => 60,
        'request_summary' => '요청문 원문', 'special_request_note' => '특이 원문',
        'published_at' => '2026-10-01 00:00:00', 'created_at' => '2026-10-01 00:00:00', 'budget_amount' => 300000,
        'dong_name' => '', 'sigungu_name' => '강남구', 'sido_name' => '서울특별시', 'complex_name' => null,
        'sido_code' => '11', 'sigungu_code' => '11680', 'unit_level' => 'sigungu', 'official_code' => '1168000000', 'is_active' => 1,
        'subject_name' => '수학',
    ], $over);
}

$passed = 0;
$failed = 0;

function check(string $name, bool $cond, string $detail = ''): void
{
    global $passed, $failed;
    if ($cond) {
        $passed++;
        echo "PASS  {$name}\n";

        return;
    }
    $failed++;
    echo 'FAIL  ' . $name . ($detail !== '' ? ' — ' . $detail : '') . "\n";
}

/** @param list<array<string, mixed>> $items */
function itemOf(array $items, int $id): ?array
{
    foreach ($items as $item) {
        if ((int) ($item['id'] ?? 0) === $id) {
            return $item;
        }
    }

    return null;
}

$pdo = new SsfPdo();
(new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);
$pdo->students = [
    studentRow(31),
    studentRow(32, ['lessons_per_week' => null, 'minutes_per_lesson' => null, 'subject_name' => null]),
];
$pdo->places = [
    ['student_id' => 31, 'place_type' => 'student_home', 'id' => 1],
    ['student_id' => 31, 'place_type' => 'public_place', 'id' => 2],
];
$pdo->badges = [
    ['student_id' => 31, 'badge_name' => 'kind', 'display_order' => 2, 'id' => 5],
    ['student_id' => 31, 'badge_name' => 'from_basics', 'display_order' => 1, 'id' => 6],
];

$search = new SearchService();
$items = $search->search('student', [], 1, 20)['items'];
$s31 = itemOf($items, 31) ?? [];
$s32 = itemOf($items, 32) ?? [];

echo "── 학생 카드 칸 (서버 응답) ──\n";
check('주회 = 2', ($s31['lessons_per_week'] ?? null) === 2, var_export($s31['lessons_per_week'] ?? '(없음)', true));
check('분 = 60', ($s31['minutes_per_lesson'] ?? null) === 60, var_export($s31['minutes_per_lesson'] ?? '(없음)', true));
check('희망 수업장소 = [student_home, public_place]', ($s31['lesson_places'] ?? null) === ['student_home', 'public_place'], json_encode($s31['lesson_places'] ?? '(없음)'));
check('희망 강의스타일 = 표시 순서대로 [from_basics, kind]', ($s31['teaching_style_badges'] ?? null) === ['from_basics', 'kind'], json_encode($s31['teaching_style_badges'] ?? '(없음)'));
check('과목·학년·수업형태·인원 그대로', ($s31['subject_name'] ?? null) === '수학' && ($s31['grade_level'] ?? null) === '중2'
    && ($s31['lesson_format'] ?? null) === 'group' && ($s31['preferred_student_count_group'] ?? null) === 'two');

echo "── 빈 값은 비어 있음(지어내지 않음) ──\n";
check('주회·분 없음 → null', array_key_exists('lessons_per_week', $s32) && $s32['lessons_per_week'] === null && $s32['minutes_per_lesson'] === null);
check('장소·스타일 없음 → []', ($s32['lesson_places'] ?? null) === [] && ($s32['teaching_style_badges'] ?? null) === []);

echo "── 요청문 게이트(기존 그대로) ──\n";
check('기본(권한 없음): 요청문·특이요청 빈 문자열', ($s31['request_summary'] ?? null) === '' && ($s31['special_request_note'] ?? null) === '');
$paid = itemOf($search->search('student', [], 1, 20, 'latest', true)['items'], 31) ?? [];
check('권한 있음: 요청문·특이요청 원문', ($paid['request_summary'] ?? null) === '요청문 원문' && ($paid['special_request_note'] ?? null) === '특이 원문');

echo "\n학생 검색 응답 {$passed} PASS / {$failed} FAIL\n";
exit($failed > 0 ? 1 : 0);
