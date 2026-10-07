<?php

declare(strict_types=1);

/**
 * 사이트오류-28 · 공부방 지역 검색·카운트는 홍보 칸(study_room_regions)만.
 * 사업장 study_rooms.region_id 가 맞아도 홍보 칸에 없으면 빠진다.
 * 가짜 PDO. 사용: php scripts/verify-room-promo-region-match.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Search\SearchService;

final class PromoStmt
{
    private array $rows = [];

    /** @var list<mixed> */
    private array $colRows = [];

    private mixed $column = false;

    private int $cursor = 0;

    private bool $columnFetched = false;

    /** @var array<string|int, mixed> */
    private array $bound = [];

    public function __construct(private PromoPdo $pdo, private string $sql) {}

    public function bindValue(string|int $k, mixed $v, int $t = PDO::PARAM_STR): bool
    {
        $this->bound[is_int($k) ? $k : ltrim((string) $k, ':')] = $v;

        return true;
    }

    public function execute(?array $params = null): bool
    {
        $p = [];
        foreach (($params ?? $this->bound) as $k => $v) {
            $p[is_int($k) ? $k : ltrim((string) $k, ':')] = $v;
        }
        $sql = preg_replace('/\s+/', ' ', trim($this->sql)) ?? '';
        $this->pdo->log[] = $sql;
        $a = $this->pdo->answer($sql, $p);
        $this->rows = $a['rows'] ?? [];
        $this->colRows = $a['col_rows'] ?? [];
        $this->column = array_key_exists('column', $a) ? $a['column'] : false;
        $this->cursor = 0;
        $this->columnFetched = false;

        return true;
    }

    public function fetch(mixed ...$a): mixed
    {
        return $this->rows[$this->cursor++] ?? false;
    }

    public function fetchColumn(mixed ...$a): mixed
    {
        if ($this->colRows !== []) {
            return $this->colRows[$this->cursor++] ?? false;
        }
        if ($this->columnFetched) {
            return false;
        }
        $this->columnFetched = true;

        return $this->column;
    }

    public function fetchAll(mixed ...$a): array
    {
        return $this->rows;
    }
}

final class PromoPdo extends PDO
{
    /** @var list<string> */
    public array $log = [];

    /**
     * 1 사업장만 대치(100). 홍보1은 신곡(300).
     * 2 홍보2만 대치. 홍보1·사업장은 신곡.
     * 3 홍보1 없음. 홍보2·사업장은 대치.
     * 4 홍보1이 대치. 사업장은 신곡.
     * 5 홍보3만 대치. 홍보1은 신곡. 사업장은 창동(999).
     *
     * @var list<array{id: int, name: string, region_id: int}>
     */
    public array $rooms = [
        ['id' => 1, 'name' => '사업장만대치', 'region_id' => 100],
        ['id' => 2, 'name' => '홍보2만대치', 'region_id' => 300],
        ['id' => 3, 'name' => '홍보1없음', 'region_id' => 100],
        ['id' => 4, 'name' => '홍보1대치', 'region_id' => 300],
        ['id' => 5, 'name' => '홍보3만대치', 'region_id' => 999],
    ];

    /** @var list<array{study_room_id: int, slot: int, region_id: int}> */
    public array $promo = [
        ['study_room_id' => 1, 'slot' => 1, 'region_id' => 300],
        ['study_room_id' => 2, 'slot' => 1, 'region_id' => 300],
        ['study_room_id' => 2, 'slot' => 2, 'region_id' => 100],
        ['study_room_id' => 3, 'slot' => 2, 'region_id' => 100],
        ['study_room_id' => 4, 'slot' => 1, 'region_id' => 100],
        ['study_room_id' => 5, 'slot' => 1, 'region_id' => 300],
        ['study_room_id' => 5, 'slot' => 3, 'region_id' => 100],
    ];

    /** @var array<int, array{dong_name: string, sigungu_name: string, sido_name: string}> */
    public array $names = [
        100 => ['dong_name' => '대치동', 'sigungu_name' => '강남구', 'sido_name' => '서울'],
        300 => ['dong_name' => '신곡동', 'sigungu_name' => '의정부시', 'sido_name' => '경기'],
        999 => ['dong_name' => '창동', 'sigungu_name' => '도봉구', 'sido_name' => '서울'],
    ];

    public function __construct() {}

    #[\ReturnTypeWillChange]
    public function prepare(string $q, array $o = []): PromoStmt
    {
        return new PromoStmt($this, $q);
    }

    /** @param array<string|int, mixed> $p @return array{rows?: list<array<string, mixed>>, col_rows?: list<mixed>, column?: mixed} */
    public function answer(string $sql, array $p): array
    {
        if (str_contains($sql, 'information_schema')) {
            return ['column' => false];
        }
        if (str_contains($sql, 'dong_name = :dong_name')) {
            return ['column' => 100];
        }
        if (str_contains($sql, 'official_code = ?')) {
            return ['column' => false];
        }
        if (str_contains($sql, 'SELECT d.id FROM regions d')) {
            $gu = (int) ($p[0] ?? 0);
            $map = [500 => [100], 424 => [300], 118 => []];

            return ['col_rows' => $map[$gu] ?? []];
        }
        if (str_contains($sql, 'is_selectable = 1')) {
            $id = (int) ($p[0] ?? 0);

            return ['column' => in_array($id, [500, 424, 118], true) ? 1 : false];
        }
        if (preg_match('/SELECT (dong_name|sigungu_name) FROM regions WHERE id = \?/', $sql, $m)) {
            $id = (int) ($p[0] ?? 0);

            return ['column' => $this->names[$id][$m[1]] ?? ''];
        }
        if (str_contains($sql, 'COUNT(DISTINCT sr.id)') || (str_contains($sql, 'FROM study_rooms sr') && str_contains($sql, 'study_room_name'))) {
            $rows = [];
            foreach ($this->rooms as $room) {
                if ($this->roomMatches($room, $sql, $p)) {
                    $rows[] = $this->roomRow($room);
                }
            }
            if (str_contains($sql, 'COUNT(DISTINCT sr.id)')) {
                return ['column' => count($rows)];
            }

            return ['rows' => $rows];
        }
        if (str_contains($sql, 'COUNT(DISTINCT')) {
            return ['column' => 0];
        }

        return ['column' => false, 'rows' => []];
    }

    /** @param array{id: int, name: string, region_id: int} $room @param array<string|int, mixed> $p */
    private function roomMatches(array $room, string $sql, array $p): bool
    {
        if (str_contains($sql, 'srr_gate.slot = 1') && !$this->hasSlot1($room['id'])) {
            return false;
        }
        if (str_contains($sql, '1 = 0')) {
            return false;
        }
        if (!$this->passesRegionId($room, $sql, $p)) {
            return false;
        }
        if (!$this->passesLabel($room, $sql, $p)) {
            return false;
        }
        if (!$this->passesSigungu($room, $sql, $p)) {
            return false;
        }

        return true;
    }

    /** @param array{id: int, name: string, region_id: int} $room @param array<string|int, mixed> $p */
    private function passesRegionId(array $room, string $sql, array $p): bool
    {
        $promo = null;
        $biz = null;
        if (preg_match('/srr\.region_id\s*=\s*:(\w+)/', $sql, $m)) {
            $promo = (int) ($p[$m[1]] ?? 0);
        }
        if (preg_match('/sr\.region_id\s*=\s*:(\w+)/', $sql, $m)) {
            $biz = (int) ($p[$m[1]] ?? 0);
        }
        if ($promo === null && $biz === null) {
            return true;
        }
        if ($biz !== null && (int) $room['region_id'] === $biz) {
            return true;
        }
        if ($promo !== null && $this->promoHas($room['id'], $promo)) {
            return true;
        }

        return false;
    }

    /** @param array{id: int, name: string, region_id: int} $room @param array<string|int, mixed> $p */
    private function passesLabel(array $room, string $sql, array $p): bool
    {
        if (!str_contains($sql, 'srr_lbl')) {
            return true;
        }
        $likes = [];
        foreach ($p as $k => $v) {
            if (is_string($k) && str_starts_with($k, 'room_region_like')) {
                $likes[] = (string) $v;
            }
        }
        if ($likes === []) {
            return true;
        }
        if (str_contains($sql, 'sr.region_id IN') && $this->nameLike((int) $room['region_id'], $likes)) {
            return true;
        }
        foreach ($this->promoRegionIds($room['id']) as $regionId) {
            if ($this->nameLike($regionId, $likes)) {
                return true;
            }
        }

        return false;
    }

    /** @param array{id: int, name: string, region_id: int} $room @param array<string|int, mixed> $p */
    private function passesSigungu(array $room, string $sql, array $p): bool
    {
        $hasPromo = str_contains($sql, 'srr_sg.region_id IN');
        $hasBiz = str_contains($sql, 'sr.region_id IN');
        if (!$hasPromo && !$hasBiz) {
            return true;
        }
        $promoIds = [];
        $bizIds = [];
        foreach ($p as $k => $v) {
            if (!is_string($k)) {
                continue;
            }
            if (str_starts_with($k, 'sg_promo_')) {
                $promoIds[] = (int) $v;
            }
            if (str_starts_with($k, 'sg_dong_')) {
                $bizIds[] = (int) $v;
            }
        }
        if ($hasBiz && in_array((int) $room['region_id'], $bizIds, true)) {
            return true;
        }
        if ($hasPromo) {
            foreach ($this->promoRegionIds($room['id']) as $regionId) {
                if (in_array($regionId, $promoIds, true)) {
                    return true;
                }
            }
        }

        return false;
    }

    private function hasSlot1(int $roomId): bool
    {
        foreach ($this->promo as $row) {
            if ((int) $row['study_room_id'] === $roomId && (int) $row['slot'] === 1 && (int) $row['region_id'] > 0) {
                return true;
            }
        }

        return false;
    }

    private function promoHas(int $roomId, int $regionId): bool
    {
        return in_array($regionId, $this->promoRegionIds($roomId), true);
    }

    /** @return list<int> */
    private function promoRegionIds(int $roomId): array
    {
        $ids = [];
        foreach ($this->promo as $row) {
            if ((int) $row['study_room_id'] === $roomId && (int) $row['region_id'] > 0) {
                $ids[] = (int) $row['region_id'];
            }
        }

        return $ids;
    }

    /** @param list<string> $likes */
    private function nameLike(int $regionId, array $likes): bool
    {
        $name = $this->names[$regionId] ?? null;
        if ($name === null) {
            return false;
        }
        foreach ($name as $value) {
            foreach ($likes as $like) {
                if ($this->sqlLike($value, $like)) {
                    return true;
                }
            }
        }

        return false;
    }

    private function sqlLike(string $value, string $pattern): bool
    {
        $quoted = preg_quote($pattern, '/');
        $quoted = str_replace(['%', '_'], ['.*', '.'], $quoted);

        return (bool) preg_match('/^' . $quoted . '$/u', $value);
    }

    /** @param array{id: int, name: string, region_id: int} $room @return array<string, mixed> */
    private function roomRow(array $room): array
    {
        $promoId = 0;
        foreach ($this->promo as $row) {
            if ((int) $row['study_room_id'] === $room['id'] && (int) $row['slot'] === 1) {
                $promoId = (int) $row['region_id'];
                break;
            }
        }
        $promo = $this->names[$promoId] ?? ['dong_name' => '', 'sigungu_name' => '', 'sido_name' => ''];

        return [
            'id' => $room['id'],
            'study_room_name' => $room['name'],
            'price_amount' => null,
            'intro_short' => '',
            'intro_long' => '',
            'main_subject_note' => '',
            'teaching_style' => '',
            'grade_band' => null,
            'audience_label' => null,
            'feature_1' => '',
            'feature_2' => '',
            'feature_3' => '',
            'slogan' => '',
            'lesson_place_type' => null,
            'capacity_per_time' => null,
            'lesson_operation_type' => null,
            'facility_note' => '',
            'inquiry_status' => 'open',
            'profile_status' => 'published',
            'education_office_registered' => 0,
            'detail_completion_status' => '',
            'career_years' => null,
            'business_registration_available' => 0,
            'latitude' => null,
            'longitude' => null,
            'published_at' => null,
            'created_at' => null,
            'recommend_count' => 0,
            'review_count' => 0,
            'dong_name' => '',
            'sigungu_name' => '',
            'complex_name' => null,
            'promo_dong_name' => $promo['dong_name'],
            'promo_sigungu_name' => $promo['sigungu_name'],
            'promo_complex_name' => null,
            'promo_basis' => 'dong',
            'image_path_prime' => '',
            'image_path_basic' => '',
        ];
    }
}

$pass = 0;
$fail = 0;

function ok(string $name, bool $cond, string $detail = ''): void
{
    global $pass, $fail;
    if ($cond) {
        $pass++;
        echo 'PASS  ' . $name . "\n";

        return;
    }
    $fail++;
    echo 'FAIL  ' . $name . ($detail === '' ? '' : ' — ' . $detail) . "\n";
}

/** @param array{items?: list<array<string, mixed>>, total?: int} $result @return list<int> */
function ids(array $result): array
{
    $out = array_map(static fn (array $it): int => (int) $it['id'], $result['items'] ?? []);
    sort($out);

    return $out;
}

function countSql(PromoPdo $pdo): string
{
    $sql = '';
    foreach ($pdo->log as $line) {
        if (str_contains($line, 'COUNT(DISTINCT sr.id)')) {
            $sql = $line;
        }
    }

    return $sql;
}

function assertPromoOnly(string $sql, string $tag): void
{
    ok($tag . ' 카운트 SQL 있음', $sql !== '');
    ok($tag . ' 사업장 region_id 등호 없음', !preg_match('/sr\.region_id\s*=/', $sql));
    ok($tag . ' 사업장 region_id IN 없음', !str_contains($sql, 'sr.region_id IN'));
    ok($tag . ' 매칭은 슬롯으로 좁히지 않음', !preg_match('/srr\.slot|srr_sg\.slot|srr_lbl\.slot/', $sql));
    ok($tag . ' 홍보1 게이트 유지', str_contains($sql, 'srr_gate.slot = 1'));
}

$pdo = new PromoPdo();
(new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);
$search = new SearchService();
$expect = [2, 4, 5];

$pdo->log = [];
$byId = $search->search('room', ['region_id' => 100], 1, 20);
ok('region_id 대치: 홍보2·홍보3·홍보1만, 사업장만·홍보1없음 제외', ids($byId) === $expect && (int) $byId['total'] === 3, json_encode(ids($byId)) . ' total=' . $byId['total']);
assertPromoOnly(countSql($pdo), 'region_id');
ok('region_id 홍보 EXISTS', str_contains(countSql($pdo), 'srr.region_id = :region_id'));

$pdo->log = [];
$withComplex = $search->search('room', ['region_id' => 100, 'complex_id' => 9], 1, 20);
ok(
    '{region_id:100, complex_id:X} id 집합 = {region_id:100}',
    ids($withComplex) === ids($byId) && (int) $withComplex['total'] === (int) $byId['total'],
    json_encode(ids($withComplex)) . ' total=' . $withComplex['total']
);
assertPromoOnly(countSql($pdo), 'region+complex');
ok(
    'region+complex 는 단지 티어 조건을 넣지 않음',
    !str_contains(countSql($pdo), 'srr_cx') && !str_contains(countSql($pdo), "region_basis_type = 'complex'")
);

$pdo->log = [];
$labelThrew = false;
$labelMessage = '';
try {
    $search->search('room', ['region_label' => '대치동'], 1, 20);
} catch (InvalidArgumentException $e) {
    $labelThrew = true;
    $labelMessage = $e->getMessage();
}
ok('region_label → InvalidArgumentException(검증 422)', $labelThrew && $labelMessage === '지역은 구(시·군)까지 선택해 주세요.', $labelMessage);
ok('region_label 는 조회 SQL 없음', countSql($pdo) === '');

$pdo->log = [];
$byGu = $search->search('room', ['sigungu_region_id' => 500], 1, 20);
ok('sigungu 강남구: 같은 세 방', ids($byGu) === $expect && (int) $byGu['total'] === 3, json_encode(ids($byGu)) . ' total=' . $byGu['total']);
assertPromoOnly(countSql($pdo), 'sigungu');
ok('sigungu 홍보 IN', str_contains(countSql($pdo), 'srr_sg.region_id IN (:sg_promo_0)'));

$pdo->log = [];
$other = $search->search('room', ['region_id' => 300], 1, 20);
ok('region_id 신곡: 홍보에 신곡 있는 방만 (사업장만 신곡인 4 제외)', ids($other) === [1, 2, 5] && (int) $other['total'] === 3, json_encode(ids($other)));

$pdo->log = [];
$emptyGu = $search->search('room', ['sigungu_region_id' => 118], 1, 20);
ok('소속 동 없는 구는 0건', (int) $emptyGu['total'] === 0 && ids($emptyGu) === [], (string) $emptyGu['total']);
ok('소속 동 없는 구 SQL은 1 = 0', str_contains(countSql($pdo), '1 = 0'));

$pdo->log = [];
$guest = $search->guestAxisCounts();
ok('게스트 카운트 기준 동은 대치 100', (int) ($guest['regionIds']['room'] ?? 0) === 100, json_encode($guest['regionIds']));
ok('게스트 카운트는 홍보 매칭 3 (사업장만 제외)', (int) $guest['studyRooms'] === 3, (string) $guest['studyRooms']);
assertPromoOnly(countSql($pdo), 'guest');

$pdo->log = [];
$scoped = $search->guestScopedFilters('room', ['region_id' => 300, 'region_label' => '신곡동', 'sigungu_region_id' => 424]);
ok(
    'guestScopedFilters 는 기준 동 region_id 만',
    is_array($scoped) && (int) ($scoped['region_id'] ?? 0) === 100 && !isset($scoped['region_label']) && !isset($scoped['sigungu_region_id']),
    json_encode($scoped, JSON_UNESCAPED_UNICODE)
);
$guestSearch = $search->search('room', is_array($scoped) ? $scoped : [], 1, 20);
ok('게스트 찾기 검색도 같은 세 방', ids($guestSearch) === $expect && (int) $guestSearch['total'] === 3, json_encode(ids($guestSearch)));

$src = (string) file_get_contents(dirname(__DIR__) . '/src/Search/SearchService.php');
$stats = (string) file_get_contents(dirname(__DIR__) . '/public/api/search/region-stats.php');
ok('소스에 사업장 region_id 바인딩 없음', !str_contains($src, 'sr.region_id = :') && !str_contains($src, 'sr.region_id IN'));
ok('라벨 매칭 주석은 홍보 칸', str_contains($src, '홍보 칸 study_room_regions.region_id 만') && !str_contains($src, '본인 region_id'));
ok('region-stats 주석은 홍보 매칭', str_contains($stats, '매칭은 홍보 study_room_regions.region_id') && !str_contains($stats, 'study_rooms.region_id 또는'));

echo "\n{$pass} PASS / {$fail} FAIL\n";
exit($fail > 0 ? 1 : 0);
