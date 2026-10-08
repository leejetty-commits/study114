<?php

declare(strict_types=1);

/**
 * 찜 목록 = 카드 (2026-10-09) · 서버 저장소/서비스 수준.
 * 가짜 PDO 만 쓴다. DB·운영 서버에 접속하지 않는다. 견본 데이터를 만들지 않는다(가짜 PDO 안의 행뿐).
 * 사용: php scripts/verify-wishlist-card-zoom.php
 *       WISHLIST_VERIFY_ROOT=<옛 커밋 압축 폴더> 이면 그 폴더의 src 로 돈다(scripts/verify-wishlist-card-zoom.mjs --ref).
 */

$root = getenv('WISHLIST_VERIFY_ROOT') ?: dirname(__DIR__);
require_once $root . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Handoff\HandoffService;
use Study114\Search\SearchService;

final class WishStmt
{
    /** @var array<string, mixed> */
    private array $bound = [];
    private array $rows = [];
    private mixed $column = false;
    private int $cursor = 0;

    public function __construct(private WishPdo $pdo, private string $sql) {}

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

final class WishPdo extends PDO
{
    /** @var list<array{sql: string, params: array<string|int, mixed>}> */
    public array $log = [];

    public bool $failCards = false;

    /** @var list<array<string, mixed>> */
    public array $favorites = [];

    /** @var array<int, array<string, mixed>> */
    public array $rooms = [];

    /** @var array<int, array<string, mixed>> */
    public array $tutors = [];

    /** @var array<int, string> */
    public array $userStatus = [];

    public function __construct() {}

    #[\ReturnTypeWillChange]
    public function prepare(string $q, array $o = []): WishStmt
    {
        return new WishStmt($this, $q);
    }

    #[\ReturnTypeWillChange]
    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): WishStmt|false
    {
        $stmt = new WishStmt($this, $query);
        $stmt->execute([]);

        return $stmt;
    }

    /** @param array<string|int, mixed> $p */
    public function answer(string $sql, array $p): array
    {
        if (str_contains($sql, 'information_schema')) {
            return ['column' => false];
        }
        if (str_contains($sql, 'FROM user_favorites WHERE user_id = ?')) {
            $uid = (int) ($p[0] ?? 0);
            $type = isset($p[1]) ? (string) $p[1] : null;
            $rows = array_values(array_filter(
                $this->favorites,
                static fn (array $r): bool => (int) $r['user_id'] === $uid && ($type === null || $r['target_type'] === $type),
            ));

            return ['rows' => array_map(static fn (array $r): array => [
                'id' => $r['id'],
                'target_type' => $r['target_type'],
                'target_id' => $r['target_id'],
                'created_at' => $r['created_at'],
            ], $rows)];
        }
        if (str_contains($sql, 'FROM study_rooms sr')) {
            if ($this->failCards) {
                throw new RuntimeException('fake study_rooms failure');
            }
            $rows = $this->gate($sql, $p, $this->rooms, 'sr', true);

            return str_contains($sql, 'COUNT(DISTINCT sr.id)') ? ['column' => count($rows)] : ['rows' => $rows];
        }
        if (str_contains($sql, 'FROM tutors t')) {
            $rows = $this->gate($sql, $p, $this->tutors, 't', false);

            return str_contains($sql, 'COUNT(DISTINCT t.id)') ? ['column' => count($rows)] : ['rows' => $rows];
        }

        return ['column' => false, 'rows' => []];
    }

    /**
     * SQL 에 실제로 있는 공개 조건만 흉내 낸다(조건이 빠지면 숨김 행이 새어 나온다).
     *
     * @param array<string|int, mixed> $p
     * @param array<int, array<string, mixed>> $table
     * @return list<array<string, mixed>>
     */
    private function gate(string $sql, array $p, array $table, string $a, bool $hasDeleted): array
    {
        $ids = [];
        foreach ($p as $k => $v) {
            if (is_string($k) && str_starts_with($k, 'card_id_')) {
                $ids[] = (int) $v;
            }
        }
        $idGate = str_contains($sql, "{$a}.id IN (");
        $out = [];
        foreach ($table as $id => $row) {
            if ($idGate && !in_array($id, $ids, true)) {
                continue;
            }
            if (str_contains($sql, "{$a}.profile_status <> 'hidden'") && $row['profile_status'] === 'hidden') {
                continue;
            }
            if ($hasDeleted && str_contains($sql, "{$a}.deleted_at IS NULL") && $row['deleted_at'] !== null) {
                continue;
            }
            if (str_contains($sql, "owner_user.status <> 'withdrawn'")
                && ($this->userStatus[(int) $row['user_id']] ?? 'active') === 'withdrawn') {
                continue;
            }
            if (!$row['_slot1']) {
                continue;
            }
            $out[] = $row;
        }

        return $out;
    }
}

function roomRow(int $id, int $ownerId, string $name, string $status = 'published', ?string $deleted = null): array
{
    return [
        'id' => $id, 'user_id' => $ownerId, 'study_room_name' => $name, 'price_amount' => 250000,
        'intro_short' => '짧은 소개', 'intro_long' => '', 'main_subject_note' => '수학', 'teaching_style' => '',
        'grade_band' => '', 'audience_label' => '중등', 'feature_1' => '소수정예', 'feature_2' => '', 'feature_3' => '',
        'slogan' => '', 'lesson_place_type' => null, 'capacity_per_time' => null, 'lesson_operation_type' => null,
        'facility_note' => '', 'inquiry_status' => 'open', 'profile_status' => $status,
        'education_office_registered' => 1, 'detail_completion_status' => 'basic_complete', 'career_years' => 5,
        'business_registration_available' => 0, 'latitude' => 37.5, 'longitude' => 127.06,
        'published_at' => '2026-01-01 00:00:00', 'created_at' => '2026-01-01 00:00:00',
        'recommend_count' => 2, 'review_count' => 1, 'dong_name' => '역삼동', 'sigungu_name' => '강남구',
        'complex_name' => '', 'promo_dong_name' => '대치동', 'promo_sigungu_name' => '강남구',
        'promo_complex_name' => '', 'promo_basis' => 'dong',
        'image_path_prime' => '', 'image_path_basic' => "/uploads/study-rooms/{$id}/basic_720.jpg",
        // 비공개(검색 SELECT 에 없는 칸). 가짜 행에 있어도 카드에 나오면 안 된다.
        'phone' => '010-0000-0000', 'email' => 'owner@private.invalid', 'road_address' => '비공개로 1',
        'address_detail' => '101동 1001호', 'deleted_at' => $deleted, '_slot1' => true,
    ];
}

function tutorRow(int $id, int $ownerId, string $name, string $status = 'published'): array
{
    return [
        'id' => $id, 'user_id' => $ownerId, 'tutor_display_name' => $name, 'preferred_fee_amount' => 400000,
        'university_name' => '한국대학교', 'major_name' => '수학과', 'career_year_band' => '3_5',
        'university_status' => 'graduated', 'proof_document_available' => 1, 'lessons_per_week' => 2,
        'minutes_per_lesson' => 90, 'detail_completion_status' => 'basic_complete', 'profile_status' => $status,
        'published_at' => '2026-01-01 00:00:00', 'created_at' => '2026-01-01 00:00:00',
        'recommend_count' => 0, 'review_count' => 0, 'subject_name' => '수학',
        'sigungu_name' => '', 'sido_name' => '서울특별시', 'sido_code' => '11', 'sigungu_code' => '',
        'unit_level' => 'sido', 'official_code' => '1100000000', 'is_active' => 1,
        'phone' => '010-1111-1111', 'email' => 'tutor@private.invalid', 'birth_date' => '2000-01-01',
        'deleted_at' => null, '_slot1' => true,
    ];
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

/** @param list<array<string, mixed>> $rows */
function rowOf(array $rows, string $type, int $id): ?array
{
    foreach ($rows as $row) {
        if ((string) ($row['target_type'] ?? '') === $type && (int) ($row['target_id'] ?? 0) === $id) {
            return $row;
        }
    }

    return null;
}

$pdo = new WishPdo();
(new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);

$me = 10;
$other = 20;
$pdo->userStatus = [101 => 'active', 102 => 'active', 103 => 'withdrawn', 104 => 'active', 201 => 'active', 202 => 'active'];
$pdo->rooms = [
    3 => roomRow(3, 101, '찜한 공개 공부방'),
    4 => roomRow(4, 102, '지금 숨긴 공부방', 'hidden'),
    5 => roomRow(5, 103, '탈퇴 주인 공부방'),
    6 => roomRow(6, 104, '남의 찜 공부방'),
    9 => roomRow(9, 104, '삭제된 공부방', 'published', '2026-09-01 00:00:00'),
];
$pdo->tutors = [
    7 => tutorRow(7, 201, '찜한 과외쌤'),
    8 => tutorRow(8, 202, '숨긴 과외쌤', 'hidden'),
];
$pdo->favorites = [
    ['id' => 1, 'user_id' => $me, 'target_type' => 'study_room', 'target_id' => 3, 'created_at' => '2026-10-01 10:00:00'],
    ['id' => 2, 'user_id' => $me, 'target_type' => 'study_room', 'target_id' => 4, 'created_at' => '2026-10-01 09:00:00'],
    ['id' => 3, 'user_id' => $me, 'target_type' => 'study_room', 'target_id' => 5, 'created_at' => '2026-10-01 08:00:00'],
    ['id' => 4, 'user_id' => $me, 'target_type' => 'tutor', 'target_id' => 7, 'created_at' => '2026-10-01 07:00:00'],
    ['id' => 5, 'user_id' => $me, 'target_type' => 'tutor', 'target_id' => 8, 'created_at' => '2026-10-01 06:00:00'],
    ['id' => 6, 'user_id' => $me, 'target_type' => 'study_room', 'target_id' => 9, 'created_at' => '2026-10-01 05:00:00'],
    ['id' => 7, 'user_id' => $other, 'target_type' => 'study_room', 'target_id' => 6, 'created_at' => '2026-10-01 04:00:00'],
];

$service = new HandoffService();
$rows = $service->listFavorites($me);

$favSql = array_values(array_filter($pdo->log, static fn (array $l): bool => str_contains($l['sql'], 'FROM user_favorites')));
check('찜 목록 SQL 은 user_id = ? 로 본인만', $favSql !== [] && (int) ($favSql[0]['params'][0] ?? 0) === $me);
check(
    '남의 찜(6번 공부방)은 안 보이고 본인 6건만',
    count($rows) === 6 && rowOf($rows, 'study_room', 6) === null,
    'count=' . count($rows),
);

$room3 = rowOf($rows, 'study_room', 3);
$card3 = is_array($room3['card'] ?? null) ? $room3['card'] : null;
check('공개 공부방 찜은 card_status=visible', ($room3['card_status'] ?? '') === 'visible', (string) json_encode($room3, JSON_UNESCAPED_UNICODE));
check(
    '공부방 카드에 카드 렌더 필드(이름·지역·사진·노출등급)',
    $card3 !== null
        && ($card3['title'] ?? '') === '찜한 공개 공부방'
        && ($card3['region_label'] ?? '') === '강남구 대치동'
        && ($card3['image_path'] ?? '') === '/uploads/study-rooms/3/basic_720.jpg'
        && ($card3['exposure_tier'] ?? '') === 'basic'
        && (int) ($card3['id'] ?? 0) === 3,
);
check(
    '찜 행 기존 칸(id·target_type·target_id·created_at) 유지',
    $room3 !== null && (int) $room3['id'] === 1 && $room3['created_at'] === '2026-10-01 10:00:00',
);

$private = ['phone', 'email', 'road_address', 'address_detail', 'user_id', 'birth_date', 'deleted_at', '_slot1'];
$leaks = [];
foreach ($rows as $row) {
    if (!is_array($row['card'] ?? null)) {
        continue;
    }
    foreach ($private as $key) {
        if (array_key_exists($key, $row['card'])) {
            $leaks[] = $row['target_type'] . ':' . $row['target_id'] . '.' . $key;
        }
    }
}
check('카드에 비공개 칸(전화·이메일·상세주소·주인 id 등) 없음', $leaks === [] && $card3 !== null, implode(',', $leaks));

$hiddenRows = [
    'study_room:4 숨김' => rowOf($rows, 'study_room', 4),
    'study_room:5 탈퇴' => rowOf($rows, 'study_room', 5),
    'study_room:9 삭제' => rowOf($rows, 'study_room', 9),
    'tutor:8 숨김' => rowOf($rows, 'tutor', 8),
];
foreach ($hiddenRows as $label => $row) {
    check(
        "{$label} 은 상태만(unavailable, card=null)",
        $row !== null && ($row['card_status'] ?? '') === 'unavailable' && array_key_exists('card', $row) && $row['card'] === null,
        (string) json_encode($row, JSON_UNESCAPED_UNICODE),
    );
}

$tutor7 = rowOf($rows, 'tutor', 7);
$tcard = is_array($tutor7['card'] ?? null) ? $tutor7['card'] : null;
check(
    '과외쌤 카드: visible · 표시명 · 과외 단위 지역',
    ($tutor7['card_status'] ?? '') === 'visible' && $tcard !== null
        && ($tcard['title'] ?? '') === '찜한 과외쌤' && ($tcard['region_label'] ?? '') === '서울특별시',
);

$search = new SearchService();
$open = $search->search('room', [], 1, 20);
$same = null;
foreach ($open['items'] as $item) {
    if ((int) $item['id'] === 3) {
        $same = $item;
    }
}
check(
    '찜 카드 = 검색 목록 카드(같은 매퍼·같은 필드)',
    $card3 !== null && $same !== null && array_keys($card3) === array_keys($same)
        && $card3['title'] === $same['title'] && $card3['region_label'] === $same['region_label'],
);

$pdo->log = [];
$search->search('room', ['card_ids' => [4]], 1, 20);
$idLeak = false;
foreach ($pdo->log as $l) {
    if (str_contains($l['sql'], 'sr.id IN (')) {
        $idLeak = true;
    }
}
check('search() filters 의 card_ids 는 무시(손님 지역 제한 우회 불가)', !$idLeak);

$tutorOnly = $service->listFavorites($me, 'tutor');
check(
    'target_type=tutor 이면 과외쌤 찜만 + 카드',
    count($tutorOnly) === 2 && rowOf($tutorOnly, 'tutor', 7) !== null
        && (rowOf($tutorOnly, 'tutor', 7)['card_status'] ?? '') === 'visible',
);

$pdo->failCards = true;
ini_set('error_log', PHP_OS_FAMILY === 'Windows' ? 'NUL' : '/dev/null');
$failedRows = (new HandoffService())->listFavorites($me, 'study_room');
$allUnknown = $failedRows !== [];
foreach ($failedRows as $row) {
    if (($row['card_status'] ?? '') !== 'unknown' || !array_key_exists('card', $row) || $row['card'] !== null) {
        $allUnknown = false;
    }
}
check('카드 조회 실패여도 찜 번호는 내려가고 상태는 unknown', count($failedRows) === 4 && $allUnknown);

echo "\nphp {$passed} PASS / {$failed} FAIL\n";
exit($failed > 0 ? 1 : 0);
