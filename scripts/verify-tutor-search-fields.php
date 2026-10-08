<?php

declare(strict_types=1);

/**
 * 과외쌤 검색 응답 = 카드 칸 (2026-10-09 · 정본 73 0-3 5번)
 * 가짜 PDO 만 쓴다. DB·운영 서버에 접속하지 않는다. 견본 데이터를 만들지 않는다(가짜 PDO 안의 행뿐).
 * 사용: php scripts/verify-tutor-search-fields.php
 *       TSF_OUT=<파일> 이면 공개 과외쌤 응답 items 를 JSON 으로 남긴다(화면 매퍼 검사 입력).
 *       TSF_ROOT=<폴더> 이면 그 폴더의 src 로 돈다(변조 검사용).
 */

$root = getenv('TSF_ROOT') ?: dirname(__DIR__);
require_once $root . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Search\SearchService;

final class TsfStmt
{
    /** @var array<string|int, mixed> */
    private array $bound = [];
    private array $rows = [];
    private mixed $column = false;
    private int $cursor = 0;

    public function __construct(private TsfPdo $pdo, private string $sql) {}

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
        $this->pdo->log[] = ['sql' => $sql, 'params' => $all];
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

final class TsfPdo extends PDO
{
    /** @var list<array{sql: string, params: array<string|int, mixed>}> */
    public array $log = [];

    /** @var array<int, array<string, mixed>> */
    public array $tutors = [];

    /** @var array<int, string> */
    public array $userStatus = [];

    /** @var array<int, string> provider_id => prime|pick */
    public array $positions = [];

    /** @var list<array{tutor_id: int, place_type: string, id: int}> */
    public array $places = [];

    /** @var list<array{tutor_id: int, badge_name: string, display_order: int, id: int}> */
    public array $badges = [];

    public function __construct() {}

    #[\ReturnTypeWillChange]
    public function prepare(string $q, array $o = []): TsfStmt
    {
        return new TsfStmt($this, $q);
    }

    #[\ReturnTypeWillChange]
    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): TsfStmt|false
    {
        $stmt = new TsfStmt($this, $query);
        $stmt->execute([]);

        return $stmt;
    }

    /** @param array<string|int, mixed> $p */
    public function answer(string $sql, array $p): array
    {
        if (str_contains($sql, 'information_schema.TABLES')) {
            return ['column' => ($p[0] ?? '') === 'provider_position_subscriptions' ? 1 : false];
        }
        if (str_contains($sql, 'information_schema.COLUMNS')) {
            $yes = ($p[0] ?? '') === 'provider_position_subscriptions'
                && in_array($p[1] ?? '', ['provider_type', 'provider_id', 'end_exclusive_on', 'sku_code'], true);

            return ['column' => $yes ? 1 : false];
        }
        if (str_contains($sql, 'FROM provider_position_subscriptions')) {
            $sku = ($p[0] ?? '') === 'tutor' ? ($this->positions[(int) ($p[1] ?? 0)] ?? false) : false;

            return ['column' => $sku];
        }
        if (str_contains($sql, 'FROM tutor_lesson_places')) {
            return ['rows' => $this->listRows($p, $this->places, 'place_type')];
        }
        if (str_contains($sql, 'FROM tutor_teaching_style_badges')) {
            $rows = $this->badges;
            usort($rows, static fn (array $a, array $b): int => [$a['tutor_id'], $a['display_order'], $a['id']] <=> [$b['tutor_id'], $b['display_order'], $b['id']]);

            return ['rows' => $this->listRows($p, $rows, 'badge_name')];
        }
        if (str_contains($sql, 'FROM tutors t')) {
            $rows = $this->gate($sql, $p);

            return str_contains($sql, 'COUNT(DISTINCT t.id)') ? ['column' => count($rows)] : ['rows' => $rows];
        }

        return ['column' => false, 'rows' => []];
    }

    /**
     * @param array<string|int, mixed> $p
     * @param list<array<string, mixed>> $table
     * @return list<array{tutor_id: int, code: string}>
     */
    private function listRows(array $p, array $table, string $col): array
    {
        $ids = array_map('intval', array_values(array_filter($p, 'is_int', ARRAY_FILTER_USE_KEY)));
        $out = [];
        foreach ($table as $row) {
            if (in_array((int) $row['tutor_id'], $ids, true)) {
                $out[] = ['tutor_id' => $row['tutor_id'], 'code' => $row[$col]];
            }
        }

        return $out;
    }

    /**
     * SQL 에 실제로 있는 공개 조건만 흉내 낸다(조건이 빠지면 숨김·탈퇴 행이 새어 나온다).
     *
     * @param array<string|int, mixed> $p
     * @return list<array<string, mixed>>
     */
    private function gate(string $sql, array $p): array
    {
        $ids = [];
        foreach ($p as $k => $v) {
            if (is_string($k) && str_starts_with($k, 'card_id_')) {
                $ids[] = (int) $v;
            }
        }
        $idGate = str_contains($sql, 't.id IN (');
        $out = [];
        foreach ($this->tutors as $id => $row) {
            if ($idGate && !in_array($id, $ids, true)) {
                continue;
            }
            if (str_contains($sql, "t.profile_status <> 'hidden'") && $row['profile_status'] === 'hidden') {
                continue;
            }
            if ((str_contains($sql, "owner_user.status <> 'withdrawn'") || str_contains($sql, "owner_user.status = 'withdrawn'"))
                && ($this->userStatus[(int) $row['user_id']] ?? 'active') === 'withdrawn') {
                continue;
            }
            if (str_contains($sql, 'tr_gate.priority_order = 0') && !$row['_slot1']) {
                continue;
            }
            $out[] = $row;
        }

        return $out;
    }
}

/**
 * 가짜 조회 결과 한 줄. MySQL 이 SELECT 별칭으로 돌려줄 칸 + SELECT 에 없어야 할 비공개 칸(새면 실패).
 *
 * @param array<string, mixed> $over
 */
function tutorRow(int $id, int $ownerId, array $over = []): array
{
    return array_merge([
        'id' => $id, 'user_id' => $ownerId, 'tutor_display_name' => '과외쌤' . $id, 'preferred_fee_amount' => 400000,
        'university_name' => '한국대학교', 'major_name' => '수학과', 'career_year_band' => 'y4_6',
        'university_status' => 'graduated', 'proof_document_available' => 1, 'lessons_per_week' => 2,
        'minutes_per_lesson' => 90, 'detail_completion_status' => 'basic_only', 'profile_status' => 'published',
        'published_at' => '2026-01-01 00:00:00', 'created_at' => '2026-01-01 00:00:00',
        'slogan' => '개념부터 꼼꼼하게', 'intro_short' => '짧은 소개 문장', 'feature_1' => '내신대비',
        'feature_2' => '수능대비', 'feature_3' => '오답노트', 'main_material_note' => '개념원리',
        'student_gender_group' => 'mixed', 'student_count_group' => 'two',
        'tutor_gender' => 'female', 'primary_school_level' => 'high',
        'image_path_basic' => "/uploads/promo/tutors/{$id}/abc_basic_720.webp",
        'recommend_count' => 0, 'review_count' => 0, 'subject_name' => '수학',
        'sigungu_name' => '', 'sido_name' => '서울특별시', 'sido_code' => '11', 'sigungu_code' => '',
        'unit_level' => 'sido', 'official_code' => '1100000000', 'is_active' => 1,
        // 비공개(검색 SELECT 에 없는 칸). 가짜 행에 있어도 응답에 나오면 안 된다.
        'name' => '실명비노출', 'real_name' => '실명비노출', 'phone' => '010-1111-2222',
        'email' => 'tutor@private.invalid', 'birth_date' => '2000-01-01', 'address_line1' => '비공개로 1',
        'home_address_detail' => '101동 1001호', 'contact_time_note' => '저녁 9시 이후 전화',
        'fee_description' => '비공개 가격 설명', 'intro_long' => '상세 소개 비노출', 'age_band' => 'late_20s',
        'youtube_url' => 'https://youtube.invalid/x', 'document_path' => '/private/docs/1.pdf',
        'deleted_at' => null, '_slot1' => true,
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

$pdo = new TsfPdo();
(new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);

$pdo->userStatus = [701 => 'active', 702 => 'active', 703 => 'withdrawn', 709 => 'active', 710 => 'active', 711 => 'active'];
$pdo->tutors = [
    7 => tutorRow(7, 701),
    8 => tutorRow(8, 702, ['profile_status' => 'hidden']),
    3 => tutorRow(3, 703),
    9 => tutorRow(9, 709, ['image_path_basic' => '/uploads/promo/tutors/9/legacy.jpg', 'tutor_gender' => 'male', 'primary_school_level' => 'middle']),
    10 => tutorRow(10, 710, [
        'slogan' => null, 'intro_short' => null, 'feature_1' => null, 'feature_2' => null, 'feature_3' => null,
        'main_material_note' => null, 'student_gender_group' => null, 'student_count_group' => null,
        'tutor_gender' => null, 'primary_school_level' => null, 'image_path_basic' => null,
        'lessons_per_week' => null, 'minutes_per_lesson' => null,
    ]),
    11 => tutorRow(11, 711, ['_slot1' => false]),
];
$pdo->positions = [7 => 'prime', 9 => 'pick'];
$pdo->places = [
    ['tutor_id' => 7, 'place_type' => 'student_home_visit', 'id' => 1],
    ['tutor_id' => 7, 'place_type' => 'public_place', 'id' => 2],
    ['tutor_id' => 9, 'place_type' => 'tutor_home', 'id' => 3],
];
$pdo->badges = [
    ['tutor_id' => 7, 'badge_name' => 'kind', 'display_order' => 2, 'id' => 5],
    ['tutor_id' => 7, 'badge_name' => 'meticulous', 'display_order' => 1, 'id' => 6],
];

$search = new SearchService();
$result = $search->search('tutor', [], 1, 20);
$items = $result['items'];
$t7 = itemOf($items, 7);
$t9 = itemOf($items, 9);
$t10 = itemOf($items, 10);

echo "── 노출 범위(기존 WHERE 그대로) ──\n";
check('숨김 과외쌤(8) 응답에 없음', itemOf($items, 8) === null);
check('탈퇴 주인 과외쌤(3) 응답에 없음', itemOf($items, 3) === null);
check('과외지역 1번 없는 과외쌤(11) 응답에 없음', itemOf($items, 11) === null);
check('공개 3명(7·9·10)만 · total 3', count($items) === 3 && (int) $result['total'] === 3, 'count=' . count($items) . ' total=' . $result['total']);

echo "── 카드 칸 값(정본 73 0-2 + 픽·프라임 칸) ──\n";
$want7 = [
    'gender' => 'female',
    'grade_band' => '고등',
    'lessons_per_week' => 2,
    'minutes_per_lesson' => 90,
    'lesson_places' => ['student_home_visit', 'public_place'],
    'student_gender_group' => 'mixed',
    'student_count_group' => 'two',
    'feature_1' => '내신대비',
    'feature_2' => '수능대비',
    'feature_3' => '오답노트',
    'slogan' => '개념부터 꼼꼼하게',
    'intro_short' => '짧은 소개 문장',
    'main_material_note' => '개념원리',
    'teaching_style_badges' => ['meticulous', 'kind'],
    'image_path_basic' => '/uploads/promo/tutors/7/abc_basic_720.webp',
    'image_path_prime' => '/uploads/promo/tutors/7/abc_prime_1280.webp',
    'image_path' => '/uploads/promo/tutors/7/abc_prime_1280.webp',
];
foreach ($want7 as $key => $value) {
    check(
        "과외쌤 7 응답 {$key}",
        $t7 !== null && array_key_exists($key, $t7) && $t7[$key] === $value,
        $t7 === null ? 'item 없음' : json_encode($t7[$key] ?? '(키 없음)', JSON_UNESCAPED_UNICODE),
    );
}
check('프라임(7) 사진 = 프라임 파생본(_prime_1280)', ($t7['exposure_tier'] ?? '') === 'prime' && ($t7['image_path'] ?? '') === $want7['image_path_prime']);
check(
    '픽(9) 사진 = 기본 파생본 · 파생본 이름이 아니면 프라임도 같은 경로',
    $t9 !== null && ($t9['exposure_tier'] ?? '') === 'pick'
        && $t9['image_path'] === '/uploads/promo/tutors/9/legacy.jpg'
        && $t9['image_path_prime'] === '/uploads/promo/tutors/9/legacy.jpg',
);
check('과외쌤 9: 성별 male · 대상 중등 · 수업장소 1개 · 강의스타일 없음', $t9 !== null
    && $t9['gender'] === 'male' && $t9['grade_band'] === '중등'
    && $t9['lesson_places'] === ['tutor_home'] && $t9['teaching_style_badges'] === []);

echo "── 값이 없으면 빈칸(가짜 값 금지) ──\n";
$empty10 = [
    'gender' => null, 'grade_band' => '', 'lessons_per_week' => null, 'minutes_per_lesson' => null,
    'lesson_places' => [], 'student_gender_group' => null, 'student_count_group' => null,
    'feature_1' => '', 'feature_2' => '', 'feature_3' => '', 'slogan' => '', 'intro_short' => '',
    'main_material_note' => '', 'teaching_style_badges' => [],
    'image_path' => '', 'image_path_basic' => '', 'image_path_prime' => '',
];
$bad10 = [];
foreach ($empty10 as $key => $value) {
    if ($t10 === null || !array_key_exists($key, $t10) || $t10[$key] !== $value) {
        $bad10[] = $key . '=' . json_encode($t10[$key] ?? '(키 없음)', JSON_UNESCAPED_UNICODE);
    }
}
check('빈 과외쌤(10): 모든 카드 칸 키가 있고 빈값', $bad10 === [], implode(', ', $bad10));
check('빈 과외쌤(10): 소개는 summary(「경력 …」) 로 채우지 않음', $t10 !== null && $t10['intro_short'] === '' && !str_contains((string) ($t10['intro_short'] ?? ''), '경력'));
$pdo->tutors[10]['tutor_gender'] = 'unknown';
$weird = itemOf($search->search('tutor', [], 1, 20)['items'], 10);
check('성별 값이 male/female 이 아니면 null', $weird !== null && $weird['gender'] === null);
$pdo->tutors[10]['tutor_gender'] = null;

echo "── 비공개 칸 없음 ──\n";
$forbiddenKeys = [
    'name', 'real_name', 'phone', 'email', 'birth_date', 'address_line1', 'home_address_detail', 'road_address',
    'address_detail', 'contact_time_note', 'fee_description', 'intro_long', 'age_band', 'youtube_url',
    'document_path', 'user_id', 'deleted_at', '_slot1', 'tutor_gender', 'primary_school_level',
];
$leakKeys = [];
$leakVals = [];
foreach ($items as $item) {
    foreach ($forbiddenKeys as $key) {
        if (array_key_exists($key, $item)) {
            $leakKeys[] = $item['id'] . '.' . $key;
        }
    }
    $json = (string) json_encode($item, JSON_UNESCAPED_UNICODE);
    foreach (['실명비노출', '010-1111-2222', 'private.invalid', '비공개로 1', '101동 1001호', '저녁 9시', '상세 소개 비노출', '/private/docs/'] as $needle) {
        if (str_contains($json, $needle)) {
            $leakVals[] = $item['id'] . ':' . $needle;
        }
    }
}
check('응답 키에 실명·연락처·주소·이메일·상세소개·주인 id 등 없음', $leakKeys === [], implode(',', $leakKeys));
check('응답 값에 비공개 값 문자열 없음', $leakVals === [], implode(',', $leakVals));

$mainSql = '';
foreach ($pdo->log as $l) {
    if (str_contains($l['sql'], 'FROM tutors t') && str_contains($l['sql'], 'tutor_display_name')) {
        $mainSql = $l['sql'];
    }
}
check('과외쌤 조회 SQL 확보', $mainSql !== '');
$badCols = [];
foreach ([
    '/\bup\.(?!gender\b|user_id\b)\w+/', '/SELECT (?!up\.gender FROM)[^()]*FROM user_profiles/', '/\breal_name\b/', '/\bphone\b/', '/\bemail\b/', '/address/i', '/\bbirth_date\b/',
    '/\bcontact_time_note\b/', '/\bintro_long\b/', '/\bfee_description\b/', '/document_path/', '/tutor_verification_documents/',
    '/youtube_url|facebook_url|instagram_url/',
] as $re) {
    if (preg_match($re, $mainSql, $m)) {
        $badCols[] = $m[0];
    }
}
check('조회 SQL 에 비공개 칸 없음(user_profiles 는 gender 만)', $mainSql !== '' && $badCols === [], implode(',', $badCols));
check(
    '사진 = tutor_images 1번(sort_order·id) · 증빙 보조 제외 · /uploads/ 공개 경로만',
    str_contains($mainSql, 'FROM tutor_images ti')
        && str_contains($mainSql, "ti.image_type <> 'proof_aux'")
        && str_contains($mainSql, "ti.image_path LIKE '/uploads/%'")
        && str_contains($mainSql, 'ORDER BY ti.sort_order ASC, ti.id ASC LIMIT 1'),
);
check(
    '대상 = 대표 과목 행(is_primary = 1)의 school_level',
    (bool) preg_match('/tst_lv\.school_level FROM tutor_subject_targets tst_lv WHERE tst_lv\.tutor_id = t\.id AND tst_lv\.is_primary = 1/', $mainSql),
);

echo "── 찜 카드 = 검색 카드(같은 매퍼) ──\n";
$cards = $search->publicCardsByIds('tutor', [7, 8]);
check('찜 카드: 공개 7 만 · 숨김 8 없음', isset($cards[7]) && !isset($cards[8]));
check('찜 카드 키 = 검색 카드 키', isset($cards[7]) && $t7 !== null && array_keys($cards[7]) === array_keys($t7));

$out = getenv('TSF_OUT');
if (is_string($out) && $out !== '') {
    file_put_contents($out, (string) json_encode($items, JSON_UNESCAPED_UNICODE));
}

echo "\nphp {$passed} PASS / {$failed} FAIL\n";
exit($failed > 0 ? 1 : 0);
