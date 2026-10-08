/**
 * 게스트(비로그인) 홈·찾기 기준 지역·지도·카드·샘플 — 정책 1)~11)
 * - 서버: Connection 에 메모리 가짜 PDO 를 주입한다(PHP 를 stdin 으로 실행). 실제 DB 에 접속하지 않는다.
 * - 프런트: 순수 모듈은 직접 실행하고, 화면 모듈은 소스 문자열·옵션으로 단정한다.
 * 실행: node scripts/verify-guest-baseline-map-cards.mjs
 *       PHP 경로는 PHP_BIN 환경변수, 없으면 D:\php8.2\php.exe, 그것도 없으면 php.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');

let pass = 0;
let fail = 0;
/** @param {string} name @param {boolean} cond @param {string} [detail] */
function ok(name, cond, detail = '') {
  if (cond) pass += 1;
  else fail += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${cond || !detail ? '' : ` — ${detail}`}`);
}

/** 함수 본문(다음 최상위 선언 전까지) */
function fnBody(src, name) {
  const re = new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+${name}\\s*\\(`);
  const m = re.exec(src);
  if (!m) return '';
  const rest = src.slice(m.index);
  const next = rest.slice(1).search(/\n(?:export\s+)?(?:async\s+)?function\s+\w+\s*\(|\nexport\s+(?:const|\{)/);
  return next < 0 ? rest : rest.slice(0, next + 1);
}

const SRC = {
  naverMap: read('preview/shared/naver-map.js'),
  location: read('preview/shared/location-display.js'),
  guestSections: read('preview/home-ui/src/guest-sections.js'),
  guestScreen: read('preview/home-ui/src/screens/guest.js'),
  exposure: read('preview/home-ui/src/exposure-render.js'),
  searchMap: read('preview/search-ui/src/search-map.js'),
  findSurface: read('preview/search-ui/src/search-find-surface.js'),
  tierRender: read('preview/search-ui/src/search-tier-render.js'),
  searchPage: read('preview/search-ui/src/screens/search-page.js'),
  mapper: read('preview/search-ui/src/search-exposure-mapper.js'),
  searchPhp: read('public/api/search/search.php'),
};

// ───────────────────────── 서버 (가짜 PDO) ─────────────────────────
const PHP_CODE = String.raw`<?php
declare(strict_types=1);
require_once getcwd() . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Search\SearchService;

final class GbStmt
{
    private array $rows = [];
    private array $colRows = [];
    private mixed $column = false;
    private int $cursor = 0;
    private array $bound = [];
    public function __construct(private GbPdo $pdo, private string $sql) {}
    public function bindValue(string|int $k, mixed $v, int $t = PDO::PARAM_STR): bool { $this->bound[ltrim((string) $k, ':')] = $v; return true; }
    public function execute(?array $params = null): bool
    {
        $p = [];
        foreach (($params ?? $this->bound) as $k => $v) { $p[is_int($k) ? $k : ltrim((string) $k, ':')] = $v; }
        $sql = preg_replace('/\s+/', ' ', trim($this->sql));
        $this->pdo->log[] = [$sql, $p];
        $a = ($this->pdo->resolver)($sql, $p);
        $this->rows = $a['rows'] ?? [];
        $this->colRows = $a['col_rows'] ?? [];
        $this->column = $a['column'] ?? false;
        $this->cursor = 0;
        return true;
    }
    public function fetch(mixed ...$a): mixed { return $this->rows[$this->cursor++] ?? false; }
    public function fetchColumn(mixed ...$a): mixed
    {
        if ($this->colRows !== []) { return $this->colRows[$this->cursor++] ?? false; }
        return $this->column;
    }
    public function fetchAll(mixed ...$a): array { return $this->rows; }
    public function rowCount(): int { return count($this->rows); }
}

final class GbPdo extends PDO
{
    public array $log = [];
    public $resolver;
    public function __construct(callable $r) { $this->resolver = $r; }
    #[\ReturnTypeWillChange] public function prepare(string $q, array $o = []): GbStmt { return new GbStmt($this, $q); }
}

const GU = ['id' => 500, 'sido_code' => '11', 'sido_name' => '서울특별시', 'sigungu_name' => '강남구', 'sigungu_code' => '11680', 'dong_code' => null, 'dong_name' => '', 'unit_level' => 'sigungu', 'official_code' => '1168000000', 'is_selectable' => 1, 'is_active' => 1];
/** 과외 단위 서울특별시(073 시도 행). 과외쌤 축 기준 행. */
const SEOUL = ['id' => 100, 'sido_code' => '11', 'sido_name' => '서울특별시', 'sigungu_name' => '', 'sigungu_code' => '11000', 'dong_code' => null, 'dong_name' => '', 'unit_level' => 'sido', 'official_code' => '1100000000', 'is_selectable' => 0, 'is_active' => 1];
function dongRow(int $id, string $sido, string $gu, string $sgCode, string $code, string $name): array
{
    return ['id' => $id, 'sido_code' => substr($sgCode, 0, 2), 'sido_name' => $sido, 'sigungu_name' => $gu, 'sigungu_code' => $sgCode, 'dong_code' => $code, 'dong_name' => $name, 'unit_level' => 'dong', 'official_code' => null, 'is_selectable' => 0, 'is_active' => 1];
}

/** regions 표 + 축별 실카드 수(지역 id → 수). 표에 없는 조건은 빈 결과. */
function resolver(array $regions, array $counts): callable
{
    return static function (string $sql, array $p) use ($regions, $counts): array {
        $byId = [];
        foreach ($regions as $r) { $byId[$r['id']] = $r; }
        $dongs = array_values(array_filter($regions, static fn ($r) => $r['unit_level'] === 'dong' && (int) $r['is_active'] === 1));
        if (str_contains($sql, 'FROM regions') && str_contains($sql, 'dong_name = :dong_name')) {
            $sidos = [$p['sido_a'] ?? null, $p['sido_b'] ?? null, $p['sido_c'] ?? null];
            $codes = [$p['code_dev'] ?? null, $p['code_official'] ?? null];
            $hits = array_values(array_filter($dongs, static fn ($r) =>
                ($r['dong_name'] === ($p['dong_name'] ?? null) && $r['sigungu_name'] === ($p['gu_name'] ?? null) && in_array($r['sido_name'], $sidos, true))
                || in_array($r['dong_code'], $codes, true)));
            usort($hits, static fn ($a, $b) => [($b['dong_name'] === ($p['dong_name_order'] ?? '')), -$b['id']] <=> [($a['dong_name'] === ($p['dong_name_order'] ?? '')), -$a['id']]);
            return ['column' => $hits[0]['id'] ?? false];
        }
        if (preg_match('/FROM regions WHERE dong_code = \? AND unit_level/', $sql)) {
            foreach ($dongs as $r) { if ($r['dong_code'] === ($p[0] ?? null)) { return ['column' => $r['id']]; } }
            return ['column' => false];
        }
        if (preg_match('/FROM regions WHERE official_code = \? AND is_selectable = 1/', $sql)) {
            foreach ($regions as $r) { if ($r['official_code'] === ($p[0] ?? null) && (int) $r['is_selectable'] === 1) { return ['column' => $r['id']]; } }
            return ['column' => false];
        }
        if (preg_match('/FROM regions WHERE id = \? LIMIT 1/', $sql) && str_contains($sql, 'sido_code')) {
            $r = $byId[(int) ($p[0] ?? 0)] ?? null;
            return ['rows' => $r ? [$r] : []];
        }
        if (preg_match("/FROM regions WHERE unit_level = 'sido' AND sido_code = \? ORDER BY/", $sql)) {
            return ['rows' => array_values(array_filter($regions, static fn ($r) => $r['unit_level'] === 'sido' && $r['sido_code'] === ($p[0] ?? null)))];
        }
        if (preg_match('/SELECT 1 FROM regions WHERE id = \? AND is_selectable = 1/', $sql)) {
            return ['column' => (int) ($byId[(int) ($p[0] ?? 0)]['is_selectable'] ?? 0) === 1 ? 1 : false];
        }
        if (str_contains($sql, 'SELECT d.id FROM regions d')) {
            $g = $byId[(int) ($p[0] ?? 0)] ?? null;
            $ids = [];
            foreach ($dongs as $r) { if ($g && substr((string) $r['sigungu_code'], 0, 5) === substr((string) $g['official_code'], 0, 5)) { $ids[] = $r['id']; } }
            return ['col_rows' => $ids];
        }
        if (preg_match('/SELECT (dong_name|sigungu_name) FROM regions WHERE id = \?/', $sql, $m)) {
            return ['column' => $byId[(int) ($p[0] ?? 0)][$m[1]] ?? false];
        }
        if (str_contains($sql, 'information_schema.COLUMNS')) { return ['column' => 1]; }
        if (str_contains($sql, 'information_schema.TABLES')) { return ['column' => false]; }
        if (str_contains($sql, 'COUNT(DISTINCT sr.id)')) { return ['column' => $counts['room'][(int) ($p['region_id'] ?? 0)] ?? 0]; }
        if (str_contains($sql, 'COUNT(DISTINCT t.id)')) { return ['column' => $counts['tutor'][(int) ($p['tutor_region_id'] ?? 0)] ?? 0]; }
        if (str_contains($sql, 'COUNT(DISTINCT s.id)')) { return ['column' => $counts['student'][(int) ($p['guest_tutor_unit_id'] ?? 0)] ?? 0]; }
        return [];
    };
}

function inject(array $regions, array $counts = []): GbPdo
{
    $regions[] = SEOUL;
    $pdo = new GbPdo(resolver($regions, $counts + ['room' => [], 'tutor' => [], 'student' => []]));
    (new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);
    return $pdo;
}

function ok(string $name, bool $cond, string $detail = ''): void
{
    echo ($cond ? 'PASS ' : 'FAIL ') . $name . ($cond || $detail === '' ? '' : ' — ' . $detail) . "\n";
}

function attempt(string $name, callable $fn): void
{
    try { $fn(); } catch (Throwable $e) { ok($name, false, get_class($e) . ': ' . $e->getMessage()); }
}

$logFile = tempnam(sys_get_temp_dir(), 'gbl');
ini_set('log_errors', '1');
ini_set('error_log', $logFile);
function logLines(string $file): array
{
    $text = (string) @file_get_contents($file);
    return array_values(array_filter(explode("\n", $text), static fn ($l) => str_contains($l, '[guestAxisCounts]')));
}

$opsDong = dongRow(9001, '서울', '강남구', '11680', '1168010600', '대치동');
$otherDong = dongRow(9002, '경기도', '의정부시', '41150', '4115010900', '가능동');
$daechi1 = dongRow(9003, '서울', '강남구', '11680', '11680abcde', '대치1동');
// 과외쌤 수는 서울특별시 단위(100) 기준, 학생 수는 과외 희망 서울특별시(100) + 강남구 소속 동 공부방 희망.
$counts = ['room' => [9001 => 3, 1 => 2, 9100 => 4, 9002 => 50], 'tutor' => [100 => 5, 500 => 99], 'student' => [100 => 7, 500 => 99]];

echo "=== [P1·가] 운영 마스터: 카카오 주소검색 행(시도 서울 · 법정동코드 1168010600 · 대치동) ===\n";
attempt('P1 운영 마스터 행', static function () use ($opsDong, $otherDong, $daechi1, $counts): void {
    inject([GU, $otherDong, $daechi1, $opsDong], $counts);
    $c = (new SearchService())->guestAxisCounts();
    ok('P1 운영 마스터: regionIds.room = 대치동 행 9001', $c['regionIds']['room'] === 9001, var_export($c['regionIds']['room'], true));
    ok('P1 운영 마스터: 공부방 수 = 대치동 실카드 3', $c['studyRooms'] === 3, (string) $c['studyRooms']);
    ok('P1 운영 마스터: axes.room = 대치동', $c['axes']['room'] === '대치동', $c['axes']['room']);
    ok('P4 운영 마스터: regionIds.tutor = 과외 단위 서울특별시 100', $c['regionIds']['tutor'] === 100, var_export($c['regionIds']['tutor'], true));
    ok('P4 운영 마스터: regionIds.student = 강남구 500', $c['regionIds']['student'] === 500, var_export($c['regionIds']['student'], true));
    ok('P4 운영 마스터: axes.tutor = 서울특별시', $c['axes']['tutor'] === '서울특별시', $c['axes']['tutor']);
    ok('P4 운영 마스터: 과외쌤 5 · 학생 7', $c['tutors'] === 5 && $c['studentRequests'] === 7, $c['tutors'] . '/' . $c['studentRequests']);
});

echo "=== [P1·가] 개발 시드 행(서울특별시 · 11680101 · 대치동) ===\n";
attempt('P1 개발 시드 행', static function () use ($otherDong, $counts): void {
    inject([GU, $otherDong, dongRow(1, '서울특별시', '강남구', '11680', '11680101', '대치동')], $counts);
    $c = (new SearchService())->guestAxisCounts();
    ok('P1 개발 시드: regionIds.room = 1', $c['regionIds']['room'] === 1, var_export($c['regionIds']['room'], true));
    ok('P1 개발 시드: 공부방 수 2', $c['studyRooms'] === 2, (string) $c['studyRooms']);
});

echo "=== [P1·가] 이름만 맞는 행(법정동코드 없이 만든 대체 코드) ===\n";
attempt('P1 이름만 맞는 행', static function () use ($otherDong, $counts): void {
    inject([GU, $otherDong, dongRow(9100, '서울특별시', '강남구', '11680', '11680f00d1', '대치동')], $counts);
    $c = (new SearchService())->guestAxisCounts();
    ok('P1 이름: regionIds.room = 9100', $c['regionIds']['room'] === 9100, var_export($c['regionIds']['room'], true));
    ok('P1 이름: 공부방 수 4', $c['studyRooms'] === 4, (string) $c['studyRooms']);
});

echo "=== [P1·P7] 대치동 행 없음(대치1동·가능동만): 0 + 로그 1줄, 다른 지역으로 채우지 않음 ===\n";
attempt('P1 대치동 없음', static function () use ($otherDong, $daechi1, $counts, $logFile): void {
    file_put_contents($logFile, '');
    $pdo = inject([GU, $otherDong, $daechi1], $counts);
    $c = (new SearchService())->guestAxisCounts();
    $roomCounts = array_filter($pdo->log, static fn ($e) => str_contains($e[0], 'COUNT(DISTINCT sr.id)'));
    ok('P1 없음: regionIds.room = null', $c['regionIds']['room'] === null, var_export($c['regionIds']['room'], true));
    ok('P1 없음: 공부방 수 0', $c['studyRooms'] === 0, (string) $c['studyRooms']);
    ok('P1 없음: 공부방 검색을 다른 지역으로 부르지 않음', $roomCounts === []);
    $lines = array_filter(logLines($logFile), static fn ($l) => str_contains($l, 'dong'));
    ok('P1 없음: 로그 1줄', count($lines) === 1, (string) count($lines));
    ok('P1 없음: 대치1동으로 대체하지 않음(axes.room 빈 값)', $c['axes']['room'] === '', $c['axes']['room']);
});

echo "=== [P6] 실카드 0: 박스 수치 0(샘플은 서버 수치에 없다) ===\n";
attempt('P6 실카드 0', static function () use ($opsDong): void {
    inject([GU, $opsDong], []);
    $c = (new SearchService())->guestAxisCounts();
    ok('P6 실카드 0: 공부방·과외쌤·학생 0', $c['studyRooms'] === 0 && $c['tutors'] === 0 && $c['studentRequests'] === 0);
});

echo "=== [P7] 비로그인 search.php 지역 조건 서버 고정 ===\n";
/** 메서드가 없으면 'missing' — 항목마다 따로 실패한다. */
function scoped(string $tab, array $filters): mixed
{
    $svc = new SearchService();
    return method_exists($svc, 'guestScopedFilters') ? $svc->guestScopedFilters($tab, $filters) : 'missing';
}
attempt('P7 guestScopedFilters', static function () use ($opsDong, $otherDong): void {
    inject([GU, $otherDong, $opsDong]);
    $room = scoped('room', ['region_id' => 9002, 'region_label' => '가능동', 'school_level' => 'middle']);
    ok('P7 공부방: 다른 지역 요청 → 대치동 9001', is_array($room) && (int) ($room['region_id'] ?? 0) === 9001 && !isset($room['region_label']), json_encode($room, JSON_UNESCAPED_UNICODE));
    ok('P7 공부방: 지역 외 조건은 유지', is_array($room) && ($room['school_level'] ?? '') === 'middle');
    $room0 = scoped('room', []);
    ok('P7 공부방: 지역 조건 없는 요청도 대치동', is_array($room0) && (int) ($room0['region_id'] ?? 0) === 9001);
    $tutor = scoped('tutor', ['tutor_region_id' => 777, 'tutor_region_label' => '의정부시']);
    ok('P7 과외쌤: 과외 단위 서울특별시 100 고정', is_array($tutor) && (int) ($tutor['tutor_region_id'] ?? 0) === 100 && !isset($tutor['tutor_region_label']), json_encode($tutor, JSON_UNESCAPED_UNICODE));
    $student = scoped('student', ['preferred_studyroom_region_id' => 9002, 'preferred_region' => 777]);
    ok('P7 학생: 강남구 500 고정', is_array($student) && (int) ($student['preferred_region_id'] ?? 0) === 500 && !isset($student['preferred_studyroom_region_id']) && !isset($student['preferred_region']), json_encode($student, JSON_UNESCAPED_UNICODE));
    $studentTutor = scoped('student', ['preferred_lesson_type' => 'tutor', 'preferred_region_id' => 777]);
    ok('P7 학생(과외 희망): 과외 단위 서울특별시 100 고정', is_array($studentTutor) && (int) ($studentTutor['preferred_region_id'] ?? 0) === 100, json_encode($studentTutor, JSON_UNESCAPED_UNICODE));
    inject([$otherDong]);
    ok('P7 기준 행 없음: 공부방 null(지역 없이 부르지 않음)', scoped('room', ['region_id' => 9002]) === null);
    ok('P7 기준 행 없음: 과외쌤 null', scoped('tutor', []) === null);
    ok('P7 기준 행 없음: 학생 null', scoped('student', []) === null);
});
@unlink($logFile);
`;

function phpBin() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  if (fs.existsSync('D:\\php8.2\\php.exe')) return 'D:\\php8.2\\php.exe';
  return 'php';
}

console.log('##### 서버 (가짜 PDO) #####');
const php = spawnSync(phpBin(), [], { cwd: ROOT, input: PHP_CODE, encoding: 'utf8' });
const phpOut = `${php.stdout || ''}`;
for (const line of phpOut.split(/\r?\n/)) {
  if (line.startsWith('PASS ')) {
    pass += 1;
    console.log(line);
  } else if (line.startsWith('FAIL ')) {
    fail += 1;
    console.log(line);
  } else if (line.trim()) {
    console.log(line);
  }
}
ok('PHP 검사 프로세스 정상 종료', php.status === 0 && !/Fatal error/.test(phpOut), `${php.status} ${php.error || ''} ${(php.stderr || '').slice(0, 400)}`);
ok(
  'P7 search.php: 비로그인이면 guestScopedFilters 로 지역을 덮고, 기준 행이 없으면 빈 결과',
  /guestScopedFilters\(\$tab,\s*\$filters\)/.test(SRC.searchPhp) &&
    /\$authUser\s*===\s*null/.test(SRC.searchPhp) &&
    /'total'\s*=>\s*0/.test(SRC.searchPhp),
);

// ───────────────────────── 프런트: 순수 모듈 실행 ─────────────────────────
console.log('##### 프런트 (순수 모듈) #####');
const naverMap = await import(pathToFileURL(path.join(ROOT, 'preview/shared/naver-map.js')).href);
ok('P2 GUEST_MAP_CENTER = 대치역 37.494511, 127.063369', naverMap.GUEST_MAP_CENTER.lat === 37.494511 && naverMap.GUEST_MAP_CENTER.lng === 127.063369);
ok('P3 MAP_DEFAULT_ZOOM = 17 (21 − 4)', naverMap.MAP_DEFAULT_ZOOM === 17);
{
  const pins = [
    { id: 1, latitude: 37.5, longitude: 127.05 },
    { id: 2, latitude: 37.49, longitude: 127.07 },
  ];
  const c = naverMap.resolveMapCenter(pins, '대치동', naverMap.GUEST_MAP_CENTER);
  ok('P2·P3 명시 중심이 있으면 핀 평균이 아니라 대치역 · 줌 17', c.lat === 37.494511 && c.lng === 127.063369 && c.zoom === 17 && c.source === 'canonical', JSON.stringify(c));
}

const LOC_URL = pathToFileURL(path.join(ROOT, 'preview/shared/location-display.js')).href;
/** @param {string} tag @param {(url: string) => Promise<any>} fetchImpl */
async function freshLocation(tag, fetchImpl) {
  globalThis.fetch = fetchImpl;
  const mod = await import(`${LOC_URL}?case=${tag}`);
  await mod.loadGuestBaseline();
  return mod;
}
const jsonRes = (body) => ({ ok: true, json: async () => body });
const GU_CITY = { id: 500, official_code: '1168000000', sido_name: '서울특별시', gu_name: '강남구' };

{
  const mod = await freshLocation('ok', async (url) =>
    String(url).includes('region-stats')
      ? jsonRes({ ok: true, studyRooms: 3, tutors: 5, studentRequests: 7, axes: { room: '대치동', tutor: '서울특별시', student: '강남구' }, regionIds: { room: 9001, tutor: 100, student: 500 } })
      : jsonRes({ ok: true, cities: [GU_CITY] }),
  );
  const base = mod.readGuestBaseline();
  ok('P1 표기: 공부방 대치동', base.room === '대치동', base.room);
  ok('P4 표기: 과외쌤·학생 서울시 강남구', base.tutor === '서울시 강남구' && base.student === '서울시 강남구', JSON.stringify(base));
  ok('P1·P8 공부방 목록 필터 = 기준 행 id', JSON.stringify(mod.guestScopeFilters('room')) === JSON.stringify({ region_id: '9001' }));
  ok('P4·P8 과외쌤 목록 필터 = 과외 단위 서울특별시 id', JSON.stringify(mod.guestScopeFilters('tutor')) === JSON.stringify({ tutor_region_id: '100' }));
  ok('P4·P8 학생 목록 필터 = 강남구 id', JSON.stringify(mod.guestScopeFilters('student')) === JSON.stringify({ preferred_region_id: '500' }));
  ok('P6 박스 수치 = region-stats 실수 그대로', JSON.stringify(mod.readGuestAxisCounts()) === JSON.stringify({ studyRooms: 3, tutors: 5, studentRequests: 7 }));
}
{
  const mod = await freshLocation('zero', async (url) =>
    String(url).includes('region-stats')
      ? jsonRes({ ok: true, studyRooms: 0, tutors: 0, studentRequests: 0, axes: { room: '', tutor: '', student: '' }, regionIds: { room: null, tutor: null, student: null } })
      : jsonRes({ ok: true, cities: [] }),
  );
  ok('P6 실카드 0: 박스 수치 0(샘플 미포함)', JSON.stringify(mod.readGuestAxisCounts()) === JSON.stringify({ studyRooms: 0, tutors: 0, studentRequests: 0 }));
  ok('P7 기준 행 없음: 공부방 필터 null(지역 없이 부르지 않음)', mod.guestScopeFilters('room') === null);
  ok('P7 기준 행 없음: 과외쌤 필터 null', mod.guestScopeFilters('tutor') === null);
  ok('P1·P11 기준 행 없음: 표기는 대치동 · 서울시 강남구(빈 값·안내문 아님)', mod.readGuestBaseline().room === '대치동' && mod.readGuestBaseline().tutor === '서울시 강남구');
}
{
  const mod = await freshLocation('fail', async () => {
    throw new Error('offline');
  });
  ok('P6 region-stats 실패: 수치 null(대시 유지, 더미 숫자 없음)', mod.readGuestAxisCounts() === null);
  ok('P7 region-stats 실패: 목록 필터 null', mod.guestScopeFilters('room') === null && mod.guestScopeFilters('tutor') === null);
  ok('P11 region-stats 실패: 표기는 대치동 · 서울시 강남구', mod.readGuestBaseline().room === '대치동' && mod.readGuestBaseline().tutor === '서울시 강남구');
}
{
  const mod = await freshLocation('stats-fail-cities-ok', async (url) => {
    if (String(url).includes('region-stats')) throw new Error('offline');
    return jsonRes({ ok: true, cities: [GU_CITY] });
  });
  ok('P7 region-stats 실패 · cities 성공: 과외쌤 필터는 구 id 로 보충하지 않음(null)', mod.guestScopeFilters('tutor') === null, JSON.stringify(mod.guestScopeFilters('tutor')));
  ok('P7 region-stats 실패 · cities 성공: 학생 필터는 강남구 id 보충', JSON.stringify(mod.guestScopeFilters('student')) === JSON.stringify({ preferred_region_id: '500' }));
}

// ───────────────────────── 프런트: 화면 소스 단정 ─────────────────────────
console.log('##### 프런트 (화면 소스·옵션) #####');
{
  const hero = fnBody(SRC.guestSections, 'renderGuestHero');
  ok('P2 홈 지도 data-map-lat/lng = GUEST_MAP_CENTER', hero.includes('data-map-lat="${GUEST_MAP_CENTER.lat}"') && hero.includes('data-map-lng="${GUEST_MAP_CENTER.lng}"'));
  ok('P3 홈 지도 data-fit-bounds="false"', hero.includes('data-fit-bounds="false"'));
  const bind = fnBody(SRC.guestSections, 'bindGuestSectionEvents');
  ok('P2·P3 홈 지도 바인드 lat/lng = GUEST_MAP_CENTER · fitBounds: false', /bindStudyRoomMapSection\(root,[\s\S]*?lat:\s*GUEST_MAP_CENTER\.lat,[\s\S]*?lng:\s*GUEST_MAP_CENTER\.lng,[\s\S]*?fitBounds:\s*false/.test(bind));
  ok('P1 홈 지도 지역 표기 = 기준 공부방 표기', hero.includes('data-region-label="${room}"') && /const room = readGuestBaseline\(\)\.room/.test(hero));
}
{
  const items = fnBody(SRC.guestSections, 'guestHeroMapItems');
  const guestPart = items.split(/if \(isLoggedIn\(\)\)[^\n]*\n/)[1] || '';
  ok('P7·다 홈 지도 핀(비로그인) = 기준 지역 목록 풀, 반경으로 거르지 않음', /if \(isLoggedIn\(\)\)/.test(items) && guestPart.includes("getHomeBasicPool('study_room')") === false && /return\s+pool\.filter\(hasMapCoords\)/.test(guestPart) && !/filterGuestDaechiMapItems|haversine|slice\(/.test(guestPart), items.slice(0, 300));
  ok('P7 홈 목록 = 기준 행 id 필터로만 호출', /study_room:\s*guestScopeFilters\('room'\)/.test(SRC.guestScreen) && /tutor:\s*guestScopeFilters\('tutor'\)/.test(SRC.guestScreen) && /student:\s*guestScopeFilters\('student'\)/.test(SRC.guestScreen));
}
{
  const fm = fnBody(SRC.searchMap, 'renderFloatMap');
  ok('P8·나 찾기 지도: GUEST_MAP_CENTER 를 naver-map 에서 가져온다', /import\s*\{[^}]*GUEST_MAP_CENTER[^}]*\}\s*from '\.\.\/\.\.\/shared\/naver-map\.js'/.test(SRC.searchMap));
  ok('P8·나 찾기 지도(게스트): 중심 = GUEST_MAP_CENTER', /bannerStyle === 'guest'/.test(fm) && /GUEST_MAP_CENTER\.lat/.test(fm) && /GUEST_MAP_CENTER\.lng/.test(fm));
  ok('P8·나 찾기 지도(게스트): data-fit-bounds="false" → 줌 17 유지', /data-fit-bounds="false"/.test(fm));
  ok('P8 찾기 지도(회원): fitBounds 속성을 새로 붙이지 않음', /guestMap \? ' data-fit-bounds="false"' : ''/.test(fm));
  ok('P3 naver-map: fitBounds=false 이면 setCenter(center) · setZoom(17)', /else if \(!fitBounds\)\s*\{\s*map\.setCenter\(new naver\.maps\.LatLng\(center\.lat, center\.lng\)\);\s*map\.setZoom\(clampNeighborhoodZoom\(center\.zoom\)\);/.test(SRC.naverMap));
  ok('P3 naver-map: data-fit-bounds="false" 를 fitBounds=false 로 읽음', /getAttribute\('data-fit-bounds'\) !== 'false'/.test(SRC.naverMap));
  const guestBrowse = fnBody(SRC.searchPage, 'bindGuestFindBrowse');
  ok('P8 공부방찾기(게스트): 지도를 실제로 마운트한다', /bindSearchMapPinLinks\(/.test(guestBrowse) && /import \{[^}]*bindSearchMapPinLinks[^}]*\} from '\.\.\/search-map\.js'/.test(SRC.searchPage));
  ok('P8 찾기 지도 핀 = 게스트 지역 목록과 같은 풀', /bindSearchMapPinLinks\(root, refreshActiveResultItems\('room', previewState, 'guest'\)\)/.test(guestBrowse));
}
{
  const sec = fnBody(SRC.findSurface, 'renderFindResultSection');
  const guestBlock = (sec.match(/if \(role === 'guest'\) \{[\s\S]*?\n  \}\n/) || [''])[0];
  ok('P5 찾기(게스트) 로딩 중: 샘플 대신 불러오는 중', /guestFeedStatus\(tab\)/.test(guestBlock) && /status !== 'ready'/.test(guestBlock));
  ok('P5 찾기(게스트) 실패: 샘플·다른 지역 대신 오류 안내', /GUEST_FEED_ERROR/.test(guestBlock) && /GUEST_FEED_ERROR\s*=\s*'[^']+'/.test(SRC.findSurface));
  const boot = fnBody(SRC.findSurface, 'bootGuestFeed');
  ok('P5 찾기(게스트) 0건 확정 후 다시 그림(로딩 → 샘플 1장)', !/if \(raw\.length\) rerender\(\)/.test(boot) && (boot.match(/rerender\(\)/g) || []).length >= 2);
  ok('P7 찾기(게스트) 기준 행 없으면 부르지 않음', /if \(!filters\) throw new Error\('guest base region missing'\)/.test(boot));
  const feed = fnBody(SRC.findSurface, 'renderGuestFeedList');
  ok('P9 찾기 첫 화면(실카드): 베이직 목록만(픽·프라임 블록 없음)', /renderGuestPaginatedListBlock\(/.test(feed) && !/renderPrimeSlotGrid|renderPickPaginatedBlock|renderExposureBox/.test(feed));
  const flat = fnBody(SRC.tierRender, 'renderProviderFlatResults');
  ok('P9 찾기 첫 화면(실카드 0): 베이직 샘플만', /if \(opts\.guest === true && mode === 'region'\)[\s\S]*?renderGuestVacantBasicList\(kind\)/.test(flat) && !/renderPrimeSlotGrid|renderPickPaginatedBlock/.test(flat));
  ok('P9 찾기 화면은 surfaceType search(홈 티어 문법 아님)', /renderFindResultSection\(tab, previewState, previewState\.role, \{ surfaceType: 'search' \}\)/.test(SRC.searchPage));
  ok('P10 검색 결과: 받은 결과 전부(프라임·픽 포함)를 그대로 그린다', /renderBrowseList\(kind, ordered,/.test(flat) && /position_sku: paidPositionSku\(apiItem\) \|\| null/.test(SRC.mapper));
}
{
  const lists = fnBody(SRC.guestSections, 'renderGuestBrowseLists');
  ok('P5 홈 목록: 샘플은 실목록을 받은 뒤(live)에만', (lists.match(/vacantSamples:\s*guest && live/g) || []).length === 3, lists.match(/vacantSamples:[^,}]+/g)?.join(' | '));
  const vacant = fnBody(SRC.exposure, 'renderGuestVacantBasicList');
  ok('P5 샘플 카드는 한 장', (vacant.match(/renderBasicRow\(kind, sample/g) || []).length === 1);
  const block = fnBody(SRC.exposure, 'renderGuestPaginatedListBlock');
  ok('P5 실카드가 있으면 샘플 없음(pool.length === 0 일 때만)', /guestVacant = opts\.guest === true && opts\.vacantSamples === true && pool\.length === 0/.test(block));
}
{
  const hydrate = fnBody(SRC.guestSections, 'hydrateGuestRegionStats');
  ok('P6 홈 박스 수치 = readGuestAxisCounts 만', /readGuestAxisCounts\(\)/.test(hydrate) && !/getHomeBasicPool|\.length/.test(hydrate));
  const fill = fnBody(SRC.searchPage, 'fillGuestMapStats');
  ok('P6 찾기 박스 수치 = readGuestAxisCounts 만', /readGuestAxisCounts\(\)/.test(fill) && !/activeResultItems|\.length/.test(fill));
}
{
  const fm = fnBody(SRC.searchMap, 'renderFloatMap');
  // 사이트오류-9: 회원의 빈 지역 문구는 게스트 안내문(GUEST_PLACE_PROMPT) 대신 지역 등록 유도(memberPlacePrompt). 게스트 분기는 그대로.
  ok(
    'P11 찾기 지도 제목(게스트) = 기준 표기, 안내문으로 떨어지지 않음',
    /guestMap\s*\?\s*readGuestBaseline\(\)\.room\s*:\s*parts\.dong \|\| \(student \? region : ''\) \|\| memberPlacePrompt\(ctx\.viewerRole\)/.test(fm) &&
      !/GUEST_PLACE_PROMPT/.test(SRC.searchMap),
  );
  ok(
    'P11 찾기 지역 막대(게스트) = guestServerPlace',
    /role === 'guest' \? guestServerPlace\(tab\) : memberPlacePrompt\(role\)/.test(SRC.findSurface) &&
      !/GUEST_PLACE_PROMPT/.test(SRC.findSurface),
  );
  const promptUses = [SRC.guestSections, SRC.guestScreen, SRC.searchPage].filter((s) => /GUEST_PLACE_PROMPT|위치를 선택해 주세요/.test(s));
  ok('P11 홈·찾기 게스트 화면 파일에 안내문 직접 사용 없음', promptUses.length === 0);
}
ok('라 대치역 좌표 주석: 「최종검수」로 미루지 않음', !/최종검수/.test(SRC.naverMap.split('\n').slice(0, 20).join('\n')));

console.log(`\n${pass}/${pass + fail} PASS · FAIL ${fail}`);
process.exit(fail === 0 ? 0 : 1);
