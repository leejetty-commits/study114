/**
 * 사이트오류-9 · 학생(parent) 현재 위치 = 서버에 저장된 희망지역
 * 실행: cd preview/home-ui && npx --yes vite-node ../../scripts/verify-student-location-flow.mjs
 *
 * 1부(PHP, 가짜 PDO): StudentHubRepository 가 가입 분기(preferred_lesson_type)로 지역을 고르고
 *   preferred_tutor_region_label · preferred_studyroom_region_label 을 「시도 시군구(+동)」 정식 라벨로 낸다.
 *   SearchService 공부방 sigungu_region_id 필터 = 그 시·군·구 소속 동 전체.
 *   여기서 나온 학생 행(JSON)을 2부의 /api/registrations/students.php 응답으로 그대로 쓴다.
 * 2부(이 프로세스, DOM 없음): 실제 모듈(auth-session · registrations-backend · search-page · home parent)을 import 해
 *   홈 분기 2탭 · 찾기 분기 2화면 문자열을 그리고, 보이는 글자에 게스트 값·id 숫자가 없는지 본다.
 *   (사이트오류-11) 학생은 분기 하나 — 반대 분기 찾기 탭은 주소로 들어와도 분기 탭으로 돌린다.
 *   (a) 의정부 저장 (b) 의정부→도봉구 변경 후 새로고침 (c) 저장 없음 (d) 임시값에 숫자 「424」
 *   (e) 공부방 분기: 공부방 주소찾기 후 학생 찾기 (f) 공부방 분기 저장 동
 * DB·PHP 서버에 접속하지 않는다. API 는 fetch 를 흉내 내고, 학생 행은 1부 PHP 출력이다.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), 'utf8') : '');

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

/* ══════════════════════ 1부: 서버 (가짜 PDO) ══════════════════════ */

const PHP_CODE = String.raw`<?php
declare(strict_types=1);
require_once getcwd() . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Registration\StudentHubRepository;
use Study114\Search\SearchService;

final class SlStmt
{
    private array $rows = [];
    private array $colRows = [];
    private mixed $column = false;
    private int $cursor = 0;
    private array $bound = [];
    public function __construct(private SlPdo $pdo, private string $sql) {}
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

final class SlPdo extends PDO
{
    public array $log = [];
    public $resolver;
    public function __construct(callable $r) { $this->resolver = $r; }
    #[\ReturnTypeWillChange] public function prepare(string $q, array $o = []): SlStmt { return new SlStmt($this, $q); }
    #[\ReturnTypeWillChange] public function query(string $q, ?int $m = null, mixed ...$a): SlStmt { $s = new SlStmt($this, $q); $s->execute([]); return $s; }
}

function gu(int $id, string $sido, string $name, string $code): array
{
    return ['id' => $id, 'sido_name' => $sido, 'sigungu_name' => $name, 'sigungu_code' => substr($code, 0, 5), 'dong_name' => '', 'unit_level' => 'sigungu', 'official_code' => $code, 'is_selectable' => 1, 'is_active' => 1];
}
function dong(int $id, string $sido, string $gu, string $sgCode, string $name): array
{
    return ['id' => $id, 'sido_name' => $sido, 'sigungu_name' => $gu, 'sigungu_code' => $sgCode, 'dong_name' => $name, 'unit_level' => 'dong', 'official_code' => null, 'is_selectable' => 0, 'is_active' => 1];
}

// 공식 시드(시도 정식 이름) + 카카오 주소찾기로 만든 동 행(시도 약칭 「경기」·「서울」)
$REGIONS = [
    gu(424, '경기도', '의정부시', '4115000000'),
    gu(117, '서울특별시', '도봉구', '1132000000'),
    gu(118, '서울특별시', '강북구', '1130500000'),
    dong(9101, '경기', '의정부시', '41150', '신곡동'),
    dong(9102, '경기', '의정부시', '41150', '가능동'),
    dong(9201, '서울', '도봉구', '11320', '창동'),
];

function studentRow(int $id, ?string $type, ?int $tutorRegion, ?int $studyroomRegion): array
{
    return [
        'id' => $id, 'guardian_user_id' => 21, 'student_name' => '학생' . $id, 'public_display_name' => '',
        'grade_level' => '중2', 'gender' => null, 'birth_year' => null, 'exposure_status' => 'published', 'memo_status' => 'open',
        'preferred_lesson_type' => $type, 'preferred_tutor_region_id' => $tutorRegion, 'preferred_studyroom_region_id' => $studyroomRegion,
        'preferred_studyroom_complex_id' => null, 'preferred_studyroom_region_basis' => null, 'preferred_region_note' => null,
        'lesson_format' => 'one_on_one', 'student_gender_group' => null, 'preferred_student_count_group' => 'solo',
        'lessons_per_week' => 2, 'minutes_per_lesson' => 60, 'preferred_fee_amount' => null, 'preferred_studyroom_fee_amount' => null,
        'preferred_tutor_gender' => null, 'request_summary' => null, 'special_request_note' => null,
        'updated_at' => '2026-10-01 09:00:00', 'published_at' => null, 'deleted_at' => null,
    ];
}

function resolver(array $regions, array $students): callable
{
    return static function (string $sql, array $p) use ($regions, $students): array {
        $byId = [];
        foreach ($regions as $r) { $byId[(int) $r['id']] = $r; }
        if (str_contains($sql, 'FROM students s WHERE s.id = ?')) {
            foreach ($students as $s) { if ((int) $s['id'] === (int) ($p[0] ?? 0)) { return ['rows' => [$s]]; } }
            return ['rows' => []];
        }
        if (str_contains($sql, 'FROM students s WHERE s.guardian_user_id = ?')) { return ['rows' => $students]; }
        if (str_contains($sql, 'FROM regions WHERE id = ? LIMIT 1') && str_contains($sql, 'unit_level, official_code')) {
            $r = $byId[(int) ($p[0] ?? 0)] ?? null;
            return ['rows' => $r ? [$r] : []];
        }
        if (str_contains($sql, 'WHERE is_selectable = 1 AND CHAR_LENGTH(official_code) >= 5 AND LEFT(official_code, 5) = ?')) {
            foreach ($regions as $r) {
                if ((int) $r['is_selectable'] === 1 && substr((string) $r['official_code'], 0, 5) === ($p[0] ?? '')) {
                    return ['rows' => [['id' => $r['id'], 'sido_name' => $r['sido_name'], 'sigungu_name' => $r['sigungu_name']]]];
                }
            }
            return ['rows' => []];
        }
        if (preg_match('/SELECT 1 FROM regions WHERE id = \? AND is_selectable = 1/', $sql)) {
            return ['column' => (int) ($byId[(int) ($p[0] ?? 0)]['is_selectable'] ?? 0) === 1 ? 1 : false];
        }
        if (str_contains($sql, 'SELECT d.id FROM regions d')) {
            $g = $byId[(int) ($p[0] ?? 0)] ?? null;
            $ids = [];
            foreach ($regions as $r) {
                if ($g && $r['unit_level'] === 'dong' && substr((string) $r['sigungu_code'], 0, 5) === substr((string) $g['official_code'], 0, 5)) { $ids[] = $r['id']; }
            }
            return ['col_rows' => $ids];
        }
        if (str_contains($sql, 'information_schema.COLUMNS')) { return ['column' => 1]; }
        if (str_contains($sql, 'information_schema.TABLES')) { return ['column' => false]; }
        return [];
    };
}

function inject(array $regions, array $students = []): SlPdo
{
    $pdo = new SlPdo(resolver($regions, $students));
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
function hydrate(array $regions, array $row): array
{
    $pdo = inject($regions, [$row]);
    $out = (new StudentHubRepository($pdo))->findById((int) $row['id']);
    if (!is_array($out)) { throw new RuntimeException('findById null'); }
    return $out;
}

$rows = [];
attempt('S1 과외 분기 · 의정부시', static function () use ($REGIONS, &$rows): void {
    $r = hydrate($REGIONS, studentRow(31, 'tutor', 424, null));
    ok('S1 과외 라벨 = 경기도 의정부시', $r['preferred_tutor_region_label'] === '경기도 의정부시', var_export($r['preferred_tutor_region_label'], true));
    ok('S1 공부방 라벨 = null', $r['preferred_studyroom_region_label'] === null);
    ok('S1 region_label = 과외 라벨', $r['region_label'] === '경기도 의정부시', $r['region_label']);
    ok('S1 id 는 숫자 칸에만', $r['preferred_tutor_region_id'] === 424);
    $rows['uijeongbu'] = $r;
});
attempt('S2 과외 분기 · 도봉구', static function () use ($REGIONS, &$rows): void {
    $r = hydrate($REGIONS, studentRow(31, 'tutor', 117, null));
    ok('S2 과외 라벨 = 서울특별시 도봉구', $r['preferred_tutor_region_label'] === '서울특별시 도봉구', var_export($r['preferred_tutor_region_label'], true));
    $rows['dobong'] = $r;
});
attempt('S3 저장 지역 없음', static function () use ($REGIONS, &$rows): void {
    $r = hydrate($REGIONS, studentRow(31, 'tutor', null, null));
    ok('S3 과외 라벨 null', $r['preferred_tutor_region_label'] === null);
    ok('S3 공부방 라벨 null', $r['preferred_studyroom_region_label'] === null);
    ok('S3 반대 축용 시군구 칸을 내지 않음', !array_key_exists('preferred_studyroom_sigungu_region_id', $r) && !array_key_exists('preferred_studyroom_sigungu_label', $r));
    ok('S3 region_label 빈 문자열', $r['region_label'] === '', var_export($r['region_label'], true));
    $rows['none'] = $r;
});
attempt('S4 공부방 분기 · 카카오 동 행(시도 약칭 경기)', static function () use ($REGIONS, &$rows): void {
    $r = hydrate($REGIONS, studentRow(31, 'study_room', 117, 9101));
    ok('S4 공부방 라벨 = 경기도 의정부시 신곡동(약칭 펴짐)', $r['preferred_studyroom_region_label'] === '경기도 의정부시 신곡동', var_export($r['preferred_studyroom_region_label'], true));
    ok('S4 공부방 시군구 칸을 내지 않음(과외쌤 찾기 폴백 제거)', !array_key_exists('preferred_studyroom_sigungu_region_id', $r) && !array_key_exists('preferred_studyroom_sigungu_label', $r));
    ok('S4 region_label = 공부방 라벨(가입 분기)', $r['region_label'] === '경기도 의정부시 신곡동', $r['region_label']);
    $rows['studyroom'] = $r;
});
attempt('S5 과외 분기 + 공부방 지역도 있음', static function () use ($REGIONS): void {
    $r = hydrate($REGIONS, studentRow(31, 'tutor', 424, 9201));
    ok('S5 region_label = 과외 라벨(희망 유형 우선, 공부방 우선 아님)', $r['region_label'] === '경기도 의정부시', $r['region_label']);
    ok('S5 공부방 라벨 = 서울특별시 도봉구 창동', $r['preferred_studyroom_region_label'] === '서울특별시 도봉구 창동', var_export($r['preferred_studyroom_region_label'], true));
});
attempt('S6 과외 분기인데 공부방 지역만 있음(옛 데이터)', static function () use ($REGIONS): void {
    $r = hydrate($REGIONS, studentRow(31, 'tutor', null, 9201));
    ok('S6 region_label 빈 문자열(반대 축 폴백 없음)', $r['region_label'] === '', var_export($r['region_label'], true));
});
attempt('S7 공부방 분기인데 과외 지역만 있음(옛 데이터)', static function () use ($REGIONS): void {
    $r = hydrate($REGIONS, studentRow(31, 'study_room', 424, null));
    ok('S7 region_label 빈 문자열(반대 축 폴백 없음)', $r['region_label'] === '', var_export($r['region_label'], true));
});

function roomSearchLog(array $regions, array $filters): array
{
    $pdo = inject($regions);
    (new SearchService())->search('room', $filters, 1, 20, 'latest');
    foreach ($pdo->log as [$sql, $p]) {
        if (str_contains($sql, 'COUNT(DISTINCT sr.id)')) { return [$sql, $p]; }
    }
    return ['', []];
}
attempt('R1 공부방 sigungu_region_id = 의정부시 소속 동 전체', static function () use ($REGIONS): void {
    [$sql, $p] = roomSearchLog($REGIONS, ['sigungu_region_id' => 424]);
    $ids = [];
    foreach ($p as $k => $v) { if (str_starts_with((string) $k, 'sg_promo_')) { $ids[] = (int) $v; } }
    sort($ids);
    ok('R1 홍보지역 IN 의정부 동(9101,9102)', $ids === [9101, 9102], json_encode($ids));
    ok('R1 홍보지역(study_room_regions)만', str_contains($sql, 'srr_sg.region_id IN (:sg_promo_0, :sg_promo_1)'));
    ok('R1 사업장 region_id 는 카운트에 없음', !str_contains($sql, 'sr.region_id'));
    ok('R1 도봉구 동(9201) 제외', !in_array(9201, $ids, true));
});
attempt('R2 소속 동이 없는 구 = 0건(다른 지역으로 넓히지 않음)', static function () use ($REGIONS): void {
    [$sql] = roomSearchLog($REGIONS, ['sigungu_region_id' => 118]);
    ok('R2 1 = 0', str_contains($sql, '1 = 0'), $sql);
});
attempt('R3 선택 단위가 아닌 id 는 거절', static function () use ($REGIONS): void {
    $threw = false;
    try { roomSearchLog($REGIONS, ['sigungu_region_id' => 9101]); } catch (InvalidArgumentException $e) { $threw = true; }
    ok('R3 동 id 9101 → InvalidArgumentException', $threw);
});

echo 'ROWS ' . json_encode($rows, JSON_UNESCAPED_UNICODE) . "\n";
`;

function phpBin() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  if (existsSync('D:\\php8.2\\php.exe')) return 'D:\\php8.2\\php.exe';
  return 'php';
}

console.log('##### 1부 서버 (가짜 PDO) #####');
const php = spawnSync(phpBin(), [], { cwd: ROOT, input: PHP_CODE, encoding: 'utf8' });
/** @type {Record<string, Record<string, unknown>>} */
let ROWS = {};
for (const line of `${php.stdout || ''}`.split(/\r?\n/)) {
  if (line.startsWith('PASS ')) {
    passed += 1;
    console.log(line);
  } else if (line.startsWith('FAIL ')) {
    failed += 1;
    console.error(line);
  } else if (line.startsWith('ROWS ')) {
    ROWS = JSON.parse(line.slice(5));
  } else if (line.trim()) {
    console.log(line);
  }
}
if (php.status !== 0 || php.stderr) console.error(php.stderr || `php exit ${php.status}`);
ok('php 실행', php.status === 0, `exit ${php.status}`);
ok('서버 학생 행 4종(의정부·도봉·없음·공부방 분기)', ['uijeongbu', 'dobong', 'none', 'studyroom'].every((k) => ROWS[k]));

ok('서버 guestScopedFilters 가 sigungu_region_id 를 지운다(게스트 범위 우회 불가)', () =>
  /'region_id', 'region_label', 'sigungu_region_id'/.test(read('src/Search/SearchService.php')),
);

/* ══════════════════════ 2부: 화면 (실제 모듈) ══════════════════════ */

function makeStorage() {
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear(),
    key: (i) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size;
    },
  };
}
globalThis.sessionStorage = makeStorage();
globalThis.localStorage = makeStorage();
globalThis.window = globalThis;
const winEvents = new EventTarget();
globalThis.addEventListener = winEvents.addEventListener.bind(winEvents);
globalThis.removeEventListener = winEvents.removeEventListener.bind(winEvents);
globalThis.dispatchEvent = winEvents.dispatchEvent.bind(winEvents);
if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class extends Event {
    constructor(type, init = {}) {
      super(type);
      this.detail = init.detail;
    }
  };
}
for (const name of ['HTMLElement', 'HTMLInputElement', 'HTMLFormElement', 'HTMLSelectElement', 'HTMLButtonElement']) {
  if (typeof globalThis[name] === 'undefined') globalThis[name] = class {};
}
Object.defineProperty(globalThis, 'location', {
  value: {
    hash: '#/search/room',
    href: 'http://127.0.0.1:5174/search/#/search/room',
    origin: 'http://127.0.0.1:5174',
    host: '127.0.0.1:5174',
    hostname: '127.0.0.1',
    protocol: 'http:',
    pathname: '/search/',
    search: '',
    assign() {},
    replace() {},
  },
  writable: true,
  configurable: true,
});
globalThis.history = {
  replaceState(_s, _t, url) {
    const text = String(url || '');
    location.hash = text.startsWith('#') ? text : location.hash;
  },
  pushState() {},
};
/** 카카오 우편번호 팝업 대역. open() 시 oncomplete 를 잡아 두고, 테스트가 카카오 결과로 부른다. */
let pendingPostcode = null;
globalThis.daum = {
  Postcode: class {
    constructor(opts) {
      this.opts = opts;
    }
    open() {
      pendingPostcode = this.opts;
    }
  },
};
console.warn = () => {};

const ME = { user_id: 21, role_type: 'guardian_student', name: '학생보호자', email: 'p@x.test', email_verified: true };
const CITIES = [
  { id: 424, label: '의정부시', sido_code: '41', sido_name: '경기도', official_code: '4115000000', city_name: '의정부시', gu_name: '', kind: 'city' },
  { id: 117, label: '도봉구', sido_code: '11', sido_name: '서울특별시', official_code: '1132000000', city_name: '도봉구', gu_name: '', kind: 'gu' },
  { id: 118, label: '강북구', sido_code: '11', sido_name: '서울특별시', official_code: '1130500000', city_name: '강북구', gu_name: '', kind: 'gu' },
];
const server = { students: [ROWS.uijeongbu], searchBodies: [] };

function json(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input), 'http://127.0.0.1:5174');
  const method = String(init.method || 'GET').toUpperCase();
  let body = null;
  try {
    body = init.body ? JSON.parse(String(init.body)) : null;
  } catch {
    body = null;
  }
  if (url.pathname.endsWith('/api/auth/me.php')) return json(200, { ok: true, authenticated: true, ...ME });
  if (url.pathname.endsWith('/api/registrations/students.php')) {
    if (method === 'PATCH') {
      server.students = [server.nextStudent];
      return json(200, { ok: true, student: server.nextStudent });
    }
    return json(200, { ok: true, students: server.students });
  }
  if (url.pathname.endsWith('/api/auth/regions.php')) return json(200, { ok: true, cities: CITIES });
  if (url.pathname.endsWith('/api/search/search.php')) {
    server.searchBodies.push(body);
    return json(200, { ok: true, items: [], total: 0 });
  }
  return json(404, { ok: false, message: 'not found' });
};

const auth = await import('../preview/home-ui/src/auth-session.js');
const searchState = await import('../preview/search-ui/src/state.js');
const searchPage = await import('../preview/search-ui/src/screens/search-page.js');
const surface = await import('../preview/search-ui/src/search-find-surface.js');
const homeState = await import('../preview/home-ui/src/state.js');
const parentScreen = await import('../preview/home-ui/src/screens/parent.js');
const studentStore = await import('../preview/home-ui/src/student-reg/store.js');
const savedRegion = await import('../preview/search-ui/src/student-saved-region.js');
const hopeRegions = await import('../preview/shared/student-hope-regions.js');
const loc = await import('../preview/shared/location-display.js');

const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const HOPE_KEY = 'study114.studentFind.lastRegionByHope';
const CANON_KEY = 'study114-find-canonical-v1';

/** 태그·속성을 빼고 화면에 보이는 글자만. */
function visibleText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const GUEST_ONLY = ['대치동', '서울시 강남구', loc.GUEST_PLACE_PROMPT];
/** @param {string} tag @param {string} text @param {{ allowDong?: boolean }} [opt] */
function assertNoGuestValues(tag, text, opt = {}) {
  for (const word of GUEST_ONLY) ok(`${tag} 「${word}」 없음`, !text.includes(word));
  ok(`${tag} region id 「424」 없음`, !/(^|[^\d])424([^\d]|$)/.test(text));
  ok(`${tag} region id 「117」 없음`, !/(^|[^\d])117([^\d]|$)/.test(text));
  if (!opt.allowDong) ok(`${tag} 저장 지역이 아닌 「신곡동」 없음`, !text.includes('신곡동'));
}

function freshFindState(state) {
  surface.resetFindSurface(state);
  state.canonicalLocation = null;
  state.activeRegionLabel = '';
  delete state.studentPicks;
  delete state._placeTab;
  delete state._parentHopeDefault;
  delete state.studentFeedStatus;
  state.studentHopeType = null;
  state.hopeTypeResolved = false;
  state._gpsBootedTab = null;
}

/** 새로고침: 세션·등록 캐시를 서버에서 다시 받고 화면 상태를 비운다. */
async function reload() {
  await auth.initAuthSession();
  freshFindState(searchState.previewState);
  freshFindState(homeState.previewState.parentFind);
}

/** 찾기 화면 1장: 그리기 → 목록 부트(bindFindSurfaceEvents 와 같은 함수) → 다시 그리기. */
async function renderFind(tab, query = '') {
  location.hash = `#/search/${tab}${query ? `?${query}` : ''}`;
  searchPage.renderSearchPage({ sessionReady: true });
  surface.bootStudentFindFeed(tab, searchState.previewState, () => {});
  await tick();
  const html = searchPage.renderSearchPage({ sessionReady: true });
  lastFindHtml = html;
  return { html, text: visibleText(html) };
}

/** 홈 #/parent 탭 1장. */
async function renderHome(tabId) {
  location.hash = '#/parent';
  homeState.previewState.parentTab = tabId;
  const searchTab = tabId === 'study_room' ? 'room' : tabId;
  parentScreen.renderParent();
  surface.bootStudentFindFeed(searchTab, homeState.previewState.parentFind, () => {});
  await tick();
  const html = parentScreen.renderParent();
  return { html, text: visibleText(html) };
}

/** 찾기 헤더 「현재위치」 칸의 글자. renderFind 가 돌려준 html 에서 읽는다. */
let lastFindHtml = '';
function currentLocation() {
  const m = lastFindHtml.match(/data-search-current-location[^>]*>현재위치 <strong>([^<]*)<\/strong>/);
  return m ? visibleText(m[1]) : '';
}

function lastSearch(tab) {
  return [...server.searchBodies].reverse().find((b) => b?.tab === tab) || null;
}

/** 반대 분기 찾기 탭 주소로 들어오면 그리지 않고 분기 탭으로 돌린다. */
function assertBranchRedirect(tag, tab, expectTab) {
  location.hash = `#/search/${tab}`;
  const html = searchPage.renderSearchPage({ sessionReady: true });
  const landed = String(location.hash).replace(/^#/, '');
  ok(`${tag} #/search/${tab} 직접 진입 → #/search/${expectTab}`, html === '' && landed.startsWith(`/search/${expectTab}`), location.hash);
}

console.log('\n##### 2부 화면 (실제 모듈) #####');

/* ── (a) 의정부 저장 ── */
console.log('=== (a) 서버 저장 = 경기도 의정부시(과외 분기) ===');
server.students = [ROWS.uijeongbu];
await reload();
ok('(a) 로그인 역할 = parent', searchState.previewState.role === 'parent' || (searchPage.renderSearchPage({ sessionReady: true }), searchState.previewState.role === 'parent'));
ok('(a) 저장 지역 모듈이 서버 라벨·id 를 읽음', () => {
  const s = savedRegion.readStudentSavedRegion();
  return s?.lessonType === 'tutor' && s.tutor?.label === '경기도 의정부시' && s.tutor?.id === '424';
});

server.searchBodies = [];
assertBranchRedirect('(a) 과외 분기', 'room', 'tutor');
await tick();
ok('(a) 과외 분기 공부방 찾기 목록을 부르지 않음', !lastSearch('room'), JSON.stringify(server.searchBodies));
for (const tab of ['tutor', 'student']) {
  server.searchBodies = [];
  const { text } = await renderFind(tab);
  const tag = `(a) 찾기 ${tab}`;
  ok(`${tag} 현재위치 = 경기도 의정부시`, currentLocation(text) === '경기도 의정부시', currentLocation(text));
  assertNoGuestValues(tag, text);
  const body = lastSearch(tab);
  if (tab === 'tutor') {
    ok(`${tag} 목록 = tutor_region_id 424`, body?.filters?.tutor_region_id === '424', JSON.stringify(body?.filters));
  } else {
    ok(`${tag} 목록 = 과외 희망 학생 · preferred_region_id 424`, body?.filters?.preferred_region_id === '424' && body.filters.preferred_lesson_type === 'tutor', JSON.stringify(body?.filters));
  }
}
ok('(a) 찾기 저장 선택(find-canonical)에 학생 위치를 쓰지 않음', !localStorage.getItem(CANON_KEY));

for (const tabId of ['tutor', 'student']) {
  const { text } = await renderHome(tabId);
  const tag = `(a) 홈 ${tabId}`;
  ok(`${tag} 저장 지역 라벨 표시`, text.includes('경기도 의정부시'));
  assertNoGuestValues(tag, text);
  if (tabId === 'tutor') ok(`${tag} 희망 지역 칸이 비지 않음`, /희망 지역 경기도 의정부시/.test(text), text.slice(0, 400));
}
ok('(a) 임시값 = 서버 라벨(숫자 없음)', () => {
  const raw = JSON.parse(localStorage.getItem(HOPE_KEY) || '{}');
  return raw.tutor === '경기도 의정부시' && !Object.values(raw).some((v) => /^\d+$/.test(String(v)));
});

/* ── (b) 의정부 → 도봉구 변경, 화면 즉시 반영, 새로고침 ── */
console.log('=== (b) 마이페이지 희망지역 변경(의정부 → 도봉구) ===');
server.nextStudent = ROWS.dobong;
const saved = await studentStore.updateStudent(31, { preferred_tutor_region_id: 117 });
savedRegion.syncStoredHopeRegionsFromStudent(saved);
ok('(b) 저장 직후 임시값 = 서울특별시 도봉구', JSON.parse(localStorage.getItem(HOPE_KEY) || '{}').tutor === '서울특별시 도봉구');
ok('(b) 마이페이지 기본·상세 저장 모두 임시값 갱신 함수를 부름', () =>
  /\(formKind === 'basic' \|\| formKind === 'detail'\) && saved\) syncStoredHopeRegionsFromStudent\(saved\)/.test(
    read('preview/home-ui/src/student-reg/screens.js'),
  ),
);
{
  const { text } = await renderFind('tutor');
  ok('(b) 새로고침 전 과외쌤 찾기 = 서울특별시 도봉구', currentLocation(text) === '서울특별시 도봉구', currentLocation(text));
  ok('(b) 새로고침 전 의정부 잔존 없음', !text.includes('의정부'));
  const home = await renderHome('tutor');
  ok('(b) 새로고침 전 홈 과외쌤 탭 = 도봉구', /희망 지역 서울특별시 도봉구/.test(home.text));
}
await reload();
for (const tab of ['tutor', 'student']) {
  const { text } = await renderFind(tab);
  ok(`(b) 새로고침 후 찾기 ${tab} = 서울특별시 도봉구`, currentLocation(text) === '서울특별시 도봉구', currentLocation(text));
  ok(`(b) 새로고침 후 찾기 ${tab} 의정부 없음`, !text.includes('의정부'));
  assertNoGuestValues(`(b) 찾기 ${tab}`, text);
}
for (const tabId of ['tutor', 'student']) {
  const { text } = await renderHome(tabId);
  ok(`(b) 새로고침 후 홈 ${tabId} = 도봉구`, text.includes('서울특별시 도봉구') && !text.includes('의정부'));
}

/* ── (c) 저장 지역 없음 ── */
console.log('=== (c) 서버 저장 지역 없음 ===');
server.students = [ROWS.none];
await reload();
server.searchBodies = [];
for (const tab of ['tutor', 'student']) {
  const { text } = await renderFind(tab);
  ok(`(c) 찾기 ${tab} 지역 등록 유도 문구`, currentLocation(text) === loc.STUDENT_PLACE_PROMPT, currentLocation(text));
  assertNoGuestValues(`(c) 찾기 ${tab}`, text);
}
ok('(c) 지역 없으면 다른 지역으로 목록을 부르지 않음', server.searchBodies.length === 0, JSON.stringify(server.searchBodies));
for (const tabId of ['tutor', 'student']) {
  const { text } = await renderHome(tabId);
  ok(`(c) 홈 ${tabId} 지역 등록 유도 문구`, text.includes(loc.STUDENT_PLACE_PROMPT));
  assertNoGuestValues(`(c) 홈 ${tabId}`, text);
}

/* ── (d) 임시값에 숫자 「424」 ── */
console.log('=== (d) 옛 임시값 숫자 「424」 ===');
server.students = [ROWS.uijeongbu];
localStorage.setItem(HOPE_KEY, JSON.stringify({ tutor: '424', study_room: '424' }));
ok('(d) 읽기: 숫자 임시값은 버림', () => {
  const r = hopeRegions.readStoredHopeRegions();
  return !r.tutor && !r.study_room && hopeRegions.resolveFindDefaultRegion('tutor', '') === '';
});
localStorage.removeItem(HOPE_KEY);
hopeRegions.writeStoredHopeRegion('tutor', '424');
ok('(d) 쓰기: 숫자는 저장하지 않음', JSON.parse(localStorage.getItem(HOPE_KEY) || '{}').tutor === undefined);
localStorage.setItem(HOPE_KEY, JSON.stringify({ tutor: '424', study_room: '424' }));
await reload();
for (const tab of ['tutor', 'student']) {
  const { text } = await renderFind(tab);
  ok(`(d) 찾기 ${tab} = 서버 지역(경기도 의정부시)`, currentLocation(text) === '경기도 의정부시', currentLocation(text));
  assertNoGuestValues(`(d) 찾기 ${tab}`, text);
}
for (const tabId of ['tutor', 'student']) {
  const { text } = await renderHome(tabId);
  assertNoGuestValues(`(d) 홈 ${tabId}`, text);
}
ok('(d) 숫자 임시값이 서버 라벨로 바뀜', () => {
  const raw = JSON.parse(localStorage.getItem(HOPE_KEY) || '{}');
  return raw.tutor === '경기도 의정부시' && raw.study_room === undefined;
});

/* ── (f) 공부방 분기 학생: 공부방 찾기 = 저장 동, 지도 지오코딩 (찾기 목록 캐시가 (e)와 겹치지 않게 먼저 돈다) ── */
console.log('=== (f) 공부방 분기 학생(저장 동 경기도 의정부시 신곡동) ===');
server.students = [ROWS.studyroom];
await reload();
{
  server.searchBodies = [];
  const { html, text } = await renderFind('room');
  ok('(f) 공부방 찾기 = 저장 동 라벨', currentLocation(text) === '경기도 의정부시 신곡동', currentLocation(text));
  ok('(f) 목록 = 저장 동 region_id 9101', lastSearch('room')?.filters?.region_id === '9101', JSON.stringify(lastSearch('room')?.filters));
  ok('(f) 지도: 대치역 고정 대신 저장 지역 지오코딩(동 줌 15)', /data-geocode-region="true" data-map-zoom="15"/.test(html) && /data-region-label="경기도 의정부시 신곡동"/.test(html));
  ok('(f) 공부방 찾기 0건 감성 문구(찾기 화면은 샘플 없이 0건 안내)', text.includes('이 동네 공부방이 아직 도착하지 않았어요'));
  ok('(f) 지도: 학생 지도에 대치역 좌표를 박지 않음', !/data-map-lat=/.test(html));
  ok('(f) 학생 찾기 희망 유형 = 공부방(가입 분기 고정)', (await renderFind('student')).text.includes('경기도 의정부시 신곡동'));
  ok('(f) 학생 찾기 목록 = 공부방 희망 학생', lastSearch('student')?.filters?.preferred_lesson_type === 'study_room', JSON.stringify(lastSearch('student')?.filters));
}
for (const tabId of ['study_room', 'student']) {
  const { text } = await renderHome(tabId);
  ok(`(f) 홈 ${tabId} 저장 동 라벨 표시`, text.includes('경기도 의정부시 신곡동'), text.slice(0, 300));
  assertNoGuestValues(`(f) 홈 ${tabId}`, text, { allowDong: true });
}
assertBranchRedirect('(f) 공부방 분기', 'tutor', 'room');

/* ── (e) 공부방 분기: 공부방 주소찾기(카카오 「경기」) 후 학생 찾기 ── */
console.log('=== (e) 공부방 분기: 공부방 찾기 주소찾기 → 학생 찾기 ===');
server.students = [ROWS.studyroom];
await reload();
await renderFind('room');
const handlers = {};
const addressBtn = {
  addEventListener: (type, fn) => {
    handlers[type] = fn;
  },
  getAttribute: (name) => (name === 'data-region-field' ? 'region_id' : null),
};
const fakeRoot = {
  querySelector: () => null,
  querySelectorAll: (sel) => (String(sel).includes('find-region-address') ? [addressBtn] : []),
  addEventListener() {},
};
surface.bindFindSurfaceEvents(fakeRoot, () => {}, {
  getTab: () => 'room',
  getState: () => searchState.previewState,
  role: 'parent',
});
await handlers.click?.();
ok('(e) 카카오 우편번호 열림', Boolean(pendingPostcode?.oncomplete));
server.searchBodies = [];
pendingPostcode?.oncomplete({
  sido: '경기',
  sigungu: '의정부시',
  bname: '가능동',
  roadAddress: '경기 의정부시 가능로 1',
  zonecode: '11650',
});
await tick();
{
  const { text } = await renderFind('room', location.hash.split('?')[1] || '');
  ok('(e) 공부방 찾기 = 고른 동(보기 전용) · 시도 정식 이름', currentLocation(text) === '경기도 의정부시 가능동', currentLocation(text));
  ok('(e) 약칭 「경기 의정부시」 표시 없음', !/(^|[^도])경기 의정부시/.test(text));
  assertNoGuestValues('(e) 공부방 찾기', text, { allowDong: true });
}
ok('(e) 주소찾기가 저장 선택(find-canonical)에 쓰지 않음', !localStorage.getItem(CANON_KEY));
ok('(e) 주소찾기가 임시값을 덮지 않음', () => {
  const raw = JSON.parse(localStorage.getItem(HOPE_KEY) || '{}');
  return raw.study_room === '경기도 의정부시 신곡동' && raw.tutor === undefined && !JSON.stringify(raw).includes('가능동');
});
ok('(e) 서버 저장 지역은 그대로', savedRegion.readStudentSavedRegion()?.studyroom?.label === '경기도 의정부시 신곡동');
searchState.navigateTab('student');
ok('(e) 탭 이동 URL 에 공부방 주소가 따라가지 않음', !decodeURIComponent(location.hash).includes('가능동'), location.hash);
{
  const { text } = await renderFind('student', location.hash.split('?')[1] || '');
  ok('(e) 학생 찾기 = 서버 저장(경기도 의정부시 신곡동)', currentLocation(text) === '경기도 의정부시 신곡동', currentLocation(text));
  ok('(e) 학생 찾기에 주소찾기 동 없음', !text.includes('가능동'));
  assertNoGuestValues('(e) 학생 찾기', text, { allowDong: true });
}
assertBranchRedirect('(e) 공부방 분기', 'tutor', 'room');

/* ── 소스 계약 ── */
console.log('=== 소스 계약 ===');
const findSrc = read('preview/search-ui/src/search-find-surface.js');
const mapSrc = read('preview/search-ui/src/search-map.js');
const naverSrc = read('preview/shared/naver-map.js');
ok('찾기: 학생은 canonical 저장 선택에 쓰지 않음', /state\.role !== 'guest' && state\.role !== 'parent'\)/.test(findSrc));
ok('찾기: 회원에게 GUEST_PLACE_PROMPT 를 쓰지 않음', !/GUEST_PLACE_PROMPT/.test(findSrc) && !/GUEST_PLACE_PROMPT/.test(mapSrc));
ok('찾기: 지역 선택 :2070 은 라벨을 임시값에 저장', /writeStoredHopeRegion\('tutor', label\)/.test(findSrc) && !/writeStoredHopeRegion\('tutor', id\)/.test(findSrc));
ok('지도: 게스트 대치역 중심·줌 17 유지', /GUEST_MAP_CENTER = \{ lat: 37\.494511, lng: 127\.063369 \}/.test(naverSrc) && /MAP_DEFAULT_ZOOM = 17/.test(naverSrc));
ok('지도: 지역 기준 지도는 대치역 기본값 대신 지오코딩', /options\.geocodeRegion && center\.source === 'default'/.test(naverSrc));
ok('새 문구에 「학부모」 없음', !/학부모/.test(read('preview/search-ui/src/student-saved-region.js')) && !/학부모/.test(String(loc.STUDENT_PLACE_PROMPT)));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
