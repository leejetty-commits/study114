/**
 * 사이트오류-21 · 지역 저장 규칙
 * 실행(저장소 루트): npx --prefix preview/home-ui vite-node scripts/verify-region-save-rules.mjs
 * 실행(preview/home-ui): npx vite-node ../../scripts/verify-region-save-rules.mjs
 *
 * DB 는 다른 검사와 같이 붙지 않는다. PHP stdin 에 상태 있는 가짜 PDO 를 넣고
 * TutorRegisterService::saveStep · StudyRoomHubRepository::listForOwner 실경로를 탄다.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

let passed = 0;
let failed = 0;
function ok(name, cond, detail = '') {
  let value = cond;
  try {
    value = typeof cond === 'function' ? cond() : cond;
  } catch (e) {
    value = false;
    detail = `${detail} threw ${e?.message || e}`;
  }
  if (value) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const PHP_CODE = String.raw`<?php
declare(strict_types=1);
if (!function_exists('mb_substr')) {
    function mb_substr(string $s, int $start, ?int $length = null, ?string $encoding = null): string
    {
        return $length === null ? substr($s, $start) : substr($s, $start, $length);
    }
}
require_once getcwd() . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Paid\PrimeRegionScope;
use Study114\Paid\ProviderTicketService;
use Study114\Paid\TutorPositionAxis;
use Study114\Registration\StudyRoomHubRepository;
use Study114\Tutor\TutorRegisterService;

final class RsStmt
{
    private array $rows = [];
    private mixed $column = false;
    private int $cursor = 0;
    public function __construct(private RsPdo $pdo, private string $sql) {}
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
    public function rowCount(): int { return count($this->rows); }
}

final class RsPdo extends PDO
{
    public array $log = [];
    public array $tutorRegions = [];
    public array $roomRegions = [];
    /** @var list<array<string, mixed>> */
    public array $listRooms = [];
    /** @var list<array<string, mixed>> */
    public array $ticketRows = [];
    public int $rollbacks = 0;
    public int $commits = 0;
    private bool $inTx = false;
    /** @var list<array<string, mixed>>|null */
    private ?array $snap = null;

    public function __construct() {}
    #[\ReturnTypeWillChange] public function prepare(string $q, array $o = []): RsStmt { return new RsStmt($this, $q); }
    public function beginTransaction(): bool
    {
        $this->inTx = true;
        $this->snap = $this->tutorRegions;
        return true;
    }
    public function commit(): bool
    {
        $this->inTx = false;
        $this->snap = null;
        $this->commits++;
        return true;
    }
    public function rollBack(): bool
    {
        if ($this->snap !== null) {
            $this->tutorRegions = $this->snap;
        }
        $this->inTx = false;
        $this->snap = null;
        $this->rollbacks++;
        return true;
    }
    public function inTransaction(): bool { return $this->inTx; }

    /** @param list<mixed> $p @return array{rows?: list<array<string, mixed>>, column?: mixed} */
    public function answer(string $sql, array $p): array
    {
        if (str_contains($sql, 'DELETE FROM tutor_regions')) {
            $id = (int) ($p[0] ?? 0);
            $this->tutorRegions = array_values(array_filter(
                $this->tutorRegions,
                static fn (array $r): bool => (int) $r['tutor_id'] !== $id
            ));
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
            return [];
        }
        if (str_contains($sql, 'FROM user_roles') && str_contains($sql, 'tutor')) {
            return ['column' => 1];
        }
        if (str_contains($sql, 'SELECT 1 FROM tutors WHERE id = ? AND user_id = ?')) {
            return ['column' => 1];
        }
        if (str_contains($sql, 'FROM regions') && str_contains($sql, 'is_selectable = 1')) {
            return ['column' => in_array((int) ($p[0] ?? 0), [11, 22, 33, 99], true) ? 1 : false];
        }
        if (str_contains($sql, 'SELECT * FROM tutors WHERE id = ?')) {
            return ['rows' => [self::tutorRow()]];
        }
        if (str_contains($sql, 'detail_completion_status FROM tutors') || str_contains($sql, 'profile_status, detail_completion_status')) {
            return ['rows' => [['profile_status' => 'draft', 'detail_completion_status' => 'basic_only']], 'column' => 'basic_only'];
        }
        if (str_contains($sql, 'UPDATE tutors SET detail_completion_status')) {
            return [];
        }
        if (str_contains($sql, 'FROM tutor_subject_targets')) {
            return ['column' => false];
        }
        if (str_contains($sql, 'FROM tutor_lesson_places')) {
            return ['column' => 0];
        }
        if (str_contains($sql, 'FROM tutor_regions') && str_contains($sql, 'is_primary = 1')) {
            foreach ($this->tutorRegions as $r) {
                if ((int) $r['tutor_id'] === (int) ($p[0] ?? 0) && (int) $r['is_primary'] === 1) {
                    return ['column' => 1, 'rows' => [$r]];
                }
            }
            return ['column' => false];
        }
        if (str_contains($sql, 'FROM study_rooms sr') && str_contains($sql, 'user_id')) {
            if ($this->listRooms !== []) {
                return ['rows' => $this->listRooms];
            }
            return ['rows' => [self::roomRow(1, 77), self::roomRow(2, 77)]];
        }
        if (str_contains($sql, 'FROM user_profiles')) {
            return ['rows' => []];
        }
        if (str_contains($sql, 'CONCAT(r.dong_name') && str_contains($sql, 'FROM study_rooms')) {
            return ['column' => '사업장동'];
        }
        if (str_contains($sql, 'CONCAT(r.dong_name') && str_contains($sql, 'is_primary = 1')) {
            $id = (int) ($p[0] ?? 0);
            foreach ($this->roomRegions as $r) {
                if ((int) $r['study_room_id'] === $id && (int) ($r['is_primary'] ?? 0) === 1) {
                    $dong = trim((string) ($r['dong_name'] ?? ''));
                    $complex = trim((string) ($r['complex_name'] ?? ''));
                    if ($dong === '' && $complex === '') {
                        return ['column' => ''];
                    }
                    return ['column' => $complex !== '' ? ($dong . ' · ' . $complex) : $dong];
                }
            }
            return ['column' => false];
        }
        if (str_contains($sql, 'CONCAT(r.dong_name')) {
            return ['column' => ''];
        }
        if (str_contains($sql, 'FROM study_room_subject_targets') || str_contains($sql, 'FROM study_room_images') || str_contains($sql, 'FROM study_room_facilities')) {
            return ['column' => false, 'rows' => []];
        }
        if (str_contains($sql, 'SELECT 1 FROM study_room_regions')) {
            $id = (int) ($p[0] ?? 0);
            $n = 0;
            foreach ($this->roomRegions as $r) {
                if ((int) $r['study_room_id'] === $id) {
                    $n++;
                }
            }
            return ['column' => $n > 0 ? 1 : false];
        }
        if (str_contains($sql, 'FROM study_room_regions srr')) {
            $id = (int) ($p[0] ?? 0);
            $rows = [];
            foreach ($this->roomRegions as $r) {
                if ((int) $r['study_room_id'] === $id) {
                    $rows[] = $r;
                }
            }
            return ['rows' => $rows];
        }
        if (str_contains($sql, 'COUNT(*) FROM provider_position_subscriptions') || str_contains($sql, 'information_schema')) {
            return ['column' => str_contains($sql, 'information_schema') ? 1 : 0];
        }
        if (str_contains($sql, 'FROM regions WHERE id = ?')) {
            return ['column' => false, 'rows' => []];
        }
        return ['column' => false, 'rows' => []];
    }

    /** @return array<string, mixed> */
    public static function tutorRow(): array
    {
        return [
            'id' => 7, 'user_id' => 1, 'tutor_display_name' => '테스트쌤', 'profile_status' => 'draft',
            'detail_completion_status' => 'basic_only', 'main_subject_note' => '수학',
            'preferred_fee_amount' => null, 'fee_basis_type' => null, 'lessons_per_week' => null,
            'monthly_session_count' => null, 'minutes_per_lesson' => null, 'fee_description' => null,
            'intro_short' => null, 'intro_long' => null, 'feature_1' => null, 'university_name' => null,
            'major_name' => null, 'university_status' => null, 'career_year_band' => null,
            'proof_document_available' => 0, 'student_gender_group' => 'mixed', 'student_count_group' => 'solo',
            'age_band' => null, 'slogan' => null, 'inquiry_status' => 'open',
            'created_at' => '2026-01-01 00:00:00', 'updated_at' => '2026-01-02 00:00:00', 'published_at' => null,
        ];
    }

    /** @return array<string, mixed> */
    public static function roomRow(int $id, int $regionId): array
    {
        return [
            'id' => $id, 'user_id' => 4, 'study_room_name' => '방' . $id, 'profile_status' => 'published',
            'inquiry_status' => 'open', 'detail_completion_status' => 'basic_only',
            'region_id' => $regionId, 'complex_id' => null, 'region_basis_type' => 'dong',
            'main_subject_note' => '', 'price_amount' => null, 'intro_short' => null, 'intro_long' => null,
            'slogan' => null, 'feature_1' => null, 'career_years' => null,
            'education_office_registered' => 0, 'weekend_available' => 0, 'one_on_one_available' => 0,
            'lesson_place_type' => null, 'capacity_per_time' => null,
            'created_at' => '2026-01-01 00:00:00', 'updated_at' => '2026-01-02 00:00:00', 'published_at' => null,
            'deleted_at' => null,
        ];
    }
}

function inject(RsPdo $pdo): void
{
    (new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);
}

function ok(string $name, bool $cond, string $detail = ''): void
{
    echo ($cond ? 'PASS  ' : 'FAIL  ') . $name . ($cond || $detail === '' ? '' : ' — ' . $detail) . "\n";
}

function seedTutor(RsPdo $pdo): void
{
    $pdo->tutorRegions = [[
        'tutor_id' => 7, 'region_id' => 99, 'scope_type' => 'city', 'priority_order' => 0, 'is_primary' => 1,
    ]];
}

/** @return list<array<string, mixed>> */
function tutorRows(RsPdo $pdo): array
{
    $rows = array_values(array_filter($pdo->tutorRegions, static fn (array $r): bool => (int) $r['tutor_id'] === 7));
    usort($rows, static fn (array $a, array $b): int => (int) $a['priority_order'] <=> (int) $b['priority_order']);
    return $rows;
}

function sameRows(array $a, array $b): bool
{
    return json_encode($a) === json_encode($b);
}

$pdo = new RsPdo();
inject($pdo);
seedTutor($pdo);
$before = tutorRows($pdo);
$svc = new TutorRegisterService();

$emptyMsg = null;
try {
    $svc->saveStep(1, 7, 'regions', ['saved_regions' => []]);
} catch (InvalidArgumentException $e) {
    $emptyMsg = $e->getMessage();
}
ok('(a) 빈 목록 거부 문구', $emptyMsg === '과외지역 1을 선택해 주세요.', (string) $emptyMsg);
ok('(a)(c) 빈 목록 거부 후 기존 행 유지', sameRows(tutorRows($pdo), $before), json_encode(tutorRows($pdo)));
ok('(c) 빈 목록 거부는 롤백', $pdo->rollbacks === 1, (string) $pdo->rollbacks);

$slot2Msg = null;
try {
    $svc->saveStep(1, 7, 'regions', ['saved_regions' => [
        ['region_id' => '', 'scope_type' => 'city', 'is_primary' => false],
        ['region_id' => '22', 'scope_type' => 'city', 'is_primary' => true],
    ]]);
} catch (InvalidArgumentException $e) {
    $slot2Msg = $e->getMessage();
}
ok('(b) 2번만 저장 거부 문구', $slot2Msg === '과외지역 1을 선택해 주세요.', (string) $slot2Msg);
ok('(b)(c) 2번만 거부 후 기존 행(99) 유지', sameRows(tutorRows($pdo), $before) && (int) $before[0]['region_id'] === 99, json_encode(tutorRows($pdo)));

$slot3Msg = null;
try {
    $svc->saveStep(1, 7, 'regions', ['saved_regions' => [
        ['region_id' => ''],
        ['region_id' => ''],
        ['region_id' => '33', 'is_primary' => true],
    ]]);
} catch (InvalidArgumentException $e) {
    $slot3Msg = $e->getMessage();
}
ok('(b) 3번만 저장 거부', $slot3Msg === '과외지역 1을 선택해 주세요.' && sameRows(tutorRows($pdo), $before), (string) $slot3Msg);

$svc->saveStep(1, 7, 'regions', ['saved_regions' => [
    ['region_id' => '11', 'scope_type' => 'city', 'is_primary' => false],
    ['region_id' => '22', 'scope_type' => 'city', 'is_primary' => true],
    ['region_id' => '33', 'scope_type' => 'city', 'is_primary' => true],
]]);
$saved = tutorRows($pdo);
$primary = array_values(array_filter($saved, static fn (array $r): bool => (int) $r['is_primary'] === 1));
ok('(d) 1·2·3 저장 후 3행', count($saved) === 3, json_encode($saved));
ok('(d) 대표는 1번(region 11) 한 행', count($primary) === 1 && (int) $primary[0]['region_id'] === 11 && (int) $primary[0]['priority_order'] === 0, json_encode($primary));
ok('(d) 2·3번은 대표가 아님', (int) $saved[1]['region_id'] === 22 && (int) $saved[1]['is_primary'] === 0 && (int) $saved[2]['region_id'] === 33 && (int) $saved[2]['is_primary'] === 0, json_encode($saved));
ok('(d) 2번 승격 UPDATE 없음', !array_filter($pdo->log, static fn (string $sql): bool => str_contains($sql, 'UPDATE tutor_regions SET is_primary')));

$room = new RsPdo();
inject($room);
$room->roomRegions = [[
    'study_room_id' => 2,
    'slot' => 1,
    'region_id' => 9,
    'complex_id' => null,
    'region_basis_type' => 'dong',
    'is_primary' => 0,
    'dong_name' => '',
    'sido_name' => '',
    'sigungu_name' => '',
    'complex_name' => '',
]];
$beforeCount = count($room->roomRegions);
$mark = count($room->log);
$list = (new StudyRoomHubRepository($room))->listForOwner(4);
$afterCount = count($room->roomRegions);
$writes = array_values(array_filter(
    array_slice($room->log, $mark),
    static fn (string $sql): bool => preg_match('/\b(INSERT|UPDATE|DELETE)\b/i', $sql) === 1
));
ok('(e) 목록 읽기 전후 study_room_regions 행 수 동일', $beforeCount === $afterCount && $afterCount === 1, $beforeCount . '→' . $afterCount);
ok('(e) 읽기 중 INSERT/UPDATE/DELETE 없음', $writes === [], implode(' | ', $writes));

$byId = [];
foreach ($list as $row) {
    $byId[(int) $row['id']] = $row;
}
$emptyPromo = $byId[1]['saved_regions'] ?? null;
$blank = $byId[2]['saved_regions'][0] ?? null;
$blob = json_encode($list, JSON_UNESCAPED_UNICODE);
ok('(f) 홍보1 없는 공부방 saved_regions 는 빈 목록', $emptyPromo === [], json_encode($emptyPromo));
ok('(f) 이름 없는 홍보 행 라벨은 빈 값', is_array($blank) && ($blank['region_label'] ?? 'x') === '' && ($blank['promo_label'] ?? 'x') === '', json_encode($blank));
ok('(f) 목록 응답에 #숫자 라벨 없음', !preg_match('/#\s*\d+/', (string) $blob), (string) $blob);

$ticketPdo = new RsPdo();
inject($ticketPdo);
$ticketPdo->roomRegions = [[
    'study_room_id' => 2,
    'region_id' => 9,
    'complex_id' => 4,
    'region_basis_type' => 'complex',
    'dong_name' => '',
    'complex_name' => '',
]];
$scope = new PrimeRegionScope($ticketPdo);
$svcTicket = new ProviderTicketService();
$method = new ReflectionMethod(ProviderTicketService::class, 'primeInventoriesForStudyRoom');
$inventories = $method->invoke($svcTicket, 2, $scope);
$labels = array_map(static fn (array $row): string => (string) ($row['label'] ?? ''), $inventories);
ok('(f) 이용권 지역 이름을 못 찾으면 빈 라벨', $labels !== [] && !array_filter($labels, static fn (string $l): bool => $l !== '' || preg_match('/#\s*\d+/', $l) === 1), json_encode($labels, JSON_UNESCAPED_UNICODE));

$axis = new TutorPositionAxis($ticketPdo);
$city = (new ReflectionMethod(TutorPositionAxis::class, 'cityLabel'))->invoke($axis, 11);
ok('(f) 시 이름을 못 찾으면 빈 값', $city === '' && !str_contains((string) $city, '#'), var_export($city, true));

$hubPdo = new RsPdo();
inject($hubPdo);
$hubPdo->listRooms = [RsPdo::roomRow(1, 77), RsPdo::roomRow(3, 88)];
$hubPdo->roomRegions = [[
    'study_room_id' => 3,
    'slot' => 1,
    'region_id' => 55,
    'complex_id' => 8,
    'region_basis_type' => 'complex',
    'is_primary' => 1,
    'dong_name' => '대치동',
    'sido_name' => '서울특별시',
    'sigungu_name' => '강남구',
    'complex_name' => '래미안대치팰리스',
    'complex_address' => '서울특별시 강남구 대치동 1',
]];
$hubList = (new StudyRoomHubRepository($hubPdo))->listForOwner(4);
$hubById = [];
foreach ($hubList as $hubRow) {
    $hubById[(int) $hubRow['id']] = $hubRow;
}
$bizOnly = $hubById[1] ?? [];
$promoRoom = $hubById[3] ?? [];
$promoSlot = $promoRoom['saved_regions'][0] ?? null;
ok('(h) 사업장만 · region_label 빈 문자열', ($bizOnly['region_label'] ?? 'x') === '', json_encode($bizOnly['region_label'] ?? null, JSON_UNESCAPED_UNICODE));
ok('(h) 사업장만 · has_regions false', ($bizOnly['has_regions'] ?? true) === false, json_encode($bizOnly['has_regions'] ?? null));
ok('(h) 홍보1 · region_label 은 홍보 동·단지', ($promoRoom['region_label'] ?? '') === '대치동 · 래미안대치팰리스', json_encode($promoRoom['region_label'] ?? null, JSON_UNESCAPED_UNICODE));
ok('(h) 홍보1 · has_regions true', ($promoRoom['has_regions'] ?? false) === true);
ok('(h) 홍보1 라벨에 사업장 표기 없음', !str_contains((string) ($promoRoom['region_label'] ?? ''), '사업장'));
ok('(h) 최상위 region_id 는 사업장', ($promoRoom['region_id'] ?? '') === '88', json_encode($promoRoom['region_id'] ?? null));
ok('(h) saved_regions 홍보1 유지', is_array($promoSlot) && ($promoSlot['region_id'] ?? '') === '55' && ($promoSlot['is_primary'] ?? false) === true && ($promoSlot['promo_label'] ?? '') === '서울특별시 강남구 대치동 · 래미안대치팰리스', json_encode($promoSlot, JSON_UNESCAPED_UNICODE));
`;

function phpBin() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  if (existsSync('D:\\php8.2\\php.exe')) return 'D:\\php8.2\\php.exe';
  return 'php';
}

console.log('##### 서버 (가짜 PDO) #####');
const php = spawnSync(phpBin(), [], { cwd: ROOT, input: PHP_CODE, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
const phpOut = `${php.stdout || ''}`;
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
ok('PHP 검사 프로세스 정상 종료', php.status === 0 && !/Fatal error|Parse error/.test(`${phpOut}\n${php.stderr || ''}`), `${php.status} ${(php.stderr || '').slice(0, 500)}`);

console.log('##### 프런트·소스 #####');
const hubPhp = read('src/Registration/StudyRoomHubRepository.php');
const regionLabelFn = hubPhp.slice(hubPhp.indexOf('function regionLabel'), hubPhp.indexOf('function gradeBand'));
const hydrateFn = hubPhp.slice(hubPhp.indexOf('function hydrateRoomRow'), hubPhp.indexOf('function savedRegions'));
ok('(h) regionLabel 은 홍보1만 조회', regionLabelFn.includes('is_primary = 1') && regionLabelFn.includes('FROM study_room_regions'));
ok('(h) regionLabel 은 사업장 조인을 쓰지 않음', !regionLabelFn.includes('FROM study_rooms'));
ok(
  '(h) has_regions 는 study_room_regions 행만',
  /\$hasRegions = \$this->exists\(\s*'SELECT 1 FROM study_room_regions WHERE study_room_id = \? LIMIT 1',\s*\[\$roomId\]\s*\);/.test(hydrateFn)
    && !/\$hasRegions[\s\S]{0,220}\|\|/.test(hydrateFn),
);

const formatJs = read('preview/home-ui/src/study-room-reg/format.js');
const storeJs = read('preview/home-ui/src/study-room-reg/store.js');
const screensJs = read('preview/home-ui/src/study-room-reg/screens.js');
const summaryFn = formatJs.slice(formatJs.indexOf('export function formatRoomSummaryLine'), formatJs.indexOf('export function roomToExposureRow'));
const checkFn = storeJs.slice(storeJs.indexOf('export function getPublishChecklistItems'), storeJs.indexOf('function withDefaults'));
const hubScreenFn = screensJs.slice(screensJs.indexOf('function renderHub'), screensJs.indexOf('function renderFormSection'));
ok('(h) 요약줄은 hub region_label', summaryFn.includes('room.region_label') && !summaryFn.includes('region_id'));
ok('(h) 체크리스트 대표 홍보는 has_regions && region_label', /region:\s*!!\(room\.has_regions && room\.region_label\)/.test(checkFn) && !checkFn.includes('region_id'));
ok('(h) 허브 동네는 hub region_label', hubScreenFn.includes('neighborhood: room.region_label') && !hubScreenFn.includes('region_id'));

const mem = new Map();
const storage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() { return mem.size; },
};
globalThis.sessionStorage = storage;
globalThis.localStorage = storage;
globalThis.window = globalThis;
const { getPublishChecklistItems } = await import(
  pathToFileURL(join(ROOT, 'preview/home-ui/src/study-room-reg/store.js')).href
);
const bizChecklist = getPublishChecklistItems({
  study_room_name: '사업장만',
  has_regions: false,
  region_label: '',
  region_id: '77',
  has_subject_targets: false,
  lesson_place_set: false,
  detail_completion_status: 'basic_only',
  has_representative_image: false,
});
const promoChecklist = getPublishChecklistItems({
  study_room_name: '홍보1',
  has_regions: true,
  region_label: '대치동 · 래미안대치팰리스',
  region_id: '88',
  has_subject_targets: false,
  lesson_place_set: false,
  detail_completion_status: 'basic_only',
  has_representative_image: false,
});
ok('(h) 체크리스트 · 사업장만이면 대표 홍보 미충족', bizChecklist.find((item) => item.id === 'region')?.ok === false);
ok('(h) 체크리스트 · 홍보1 라벨이면 대표 홍보 충족', promoChecklist.find((item) => item.id === 'region')?.ok === true);

const { validateTutorActivityRegions } = await import(
  pathToFileURL(join(ROOT, 'preview/shared/tutor-region-slots.js')).href
);
const onlySecond = validateTutorActivityRegions([
  { region_id: '', scope_type: 'city', is_primary: false },
  { region_id: '22', scope_type: 'city', is_primary: true },
  { region_id: '', scope_type: 'city', is_primary: false },
]);
ok('(g) 2번만 있는 입력 거부', onlySecond.ok === false && onlySecond.message === '과외지역 1을 선택해 주세요.', JSON.stringify(onlySecond));
const onlyThird = validateTutorActivityRegions([
  { region_id: '' },
  { region_id: '' },
  { region_id: '33', is_primary: true },
]);
ok('(g) 3번만 있는 입력 거부', onlyThird.ok === false && onlyThird.message === '과외지역 1을 선택해 주세요.');
const kept = validateTutorActivityRegions([
  { region_id: '11', is_primary: false },
  { region_id: '22', is_primary: true },
  { region_id: '33' },
]);
ok('(g) 1·2·3 은 통과하고 대표는 1번', kept.ok === true && kept.slots[0].is_primary === true && kept.slots[1].is_primary === false && kept.slots[0].region_id === '11');

const screens = read('preview/home-ui/src/tutor-reg/screens.js');
const signup = read('preview/auth-ui/src/screens/signup-basic.js');
const inline = read('preview/home-ui/src/tutor-reg/inline-save.js');
ok('(g) 마이페이지 저장이 공용 검증을 씀', screens.includes('validateTutorActivityRegions') && screens.includes('saveTutorBasicInline'));
ok('(g) 가입 저장이 공용 검증을 씀', signup.includes('validateTutorActivityRegions'));
ok(
  '(g) 인페이지 저장은 검증된 슬롯만 받고 빈 1번을 앞으로 당기지 않음',
  inline.includes('filter((s) => /^\\d+$/.test(String(s.region_id || \'\')))') &&
    /validateTutorActivityRegions\(collectTutorRegionSlots\(form\)\)[\s\S]{0,800}saveTutorBasicInline\(/.test(screens),
);

function walkPhp(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) walkPhp(abs, out);
    else if (name.endsWith('.php')) out.push(abs);
  }
  return out;
}
const hashHits = [];
for (const file of walkPhp(join(ROOT, 'src'))) {
  const text = readFileSync(file, 'utf8');
  if (/행정동 #|단지 #|시 #/.test(text)) hashHits.push(file);
}
ok('(f) src 에 행정동 #·단지 #·시 # 라벨 없음', hashHits.length === 0, hashHits.join(', '));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
