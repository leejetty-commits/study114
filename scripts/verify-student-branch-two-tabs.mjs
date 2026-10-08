/**
 * 사이트오류-11 · 학생 분기 하나 = 홈·찾기 2탭 + 분기 변경 서버 정리
 * 실행: cd preview/home-ui && npx --yes vite-node ../../scripts/verify-student-branch-two-tabs.mjs
 *
 * 1부(PHP, 상태 있는 가짜 PDO): StudentHubService::applyAction('update') 실경로.
 *   (e) 분기 변경 → 같은 트랜잭션에서 반대 지역·단지·기준 NULL, 요청의 반대 지역 무시, rejudgeExposure 로 노출 재판정.
 *   (d) 학생 행 region_label 은 분기 지역만(반대 축 폴백 없음).
 * 2부(실제 모듈, DOM 없음):
 *   (a) 홈 탭 = 과외 분기 과외쌤·학생 / 공부방 분기 공부방·학생
 *   (b) 홈에 검색 블록·지역변경 버튼 없음, 0건이면 샘플 1 + 빈칸(샘플 지역 = 내 지역), 찾기 링크배지
 *   (c) 반대 탭 GNB 숨김 + 주소 직접 진입 차단
 *   (d) 화면 지역 폴백 없음(반대 축만 있으면 지역 등록 유도)
 *   (f) 마이페이지 분기 변경 확인창·새로고침 안내 문구, 「학부모」 없음
 * DB·PHP 서버에 접속하지 않는다.
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

/* ══════════════════════ 1부: 서버 (상태 있는 가짜 PDO) ══════════════════════ */

const PHP_CODE = String.raw`<?php
declare(strict_types=1);
require_once getcwd() . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Registration\StudentHubRepository;
use Study114\Registration\StudentHubService;

final class BtStmt
{
    private array $rows = [];
    private mixed $column = false;
    private int $count = 0;
    private int $cursor = 0;
    public function __construct(private BtPdo $pdo, private string $sql) {}
    public function bindValue(string|int $k, mixed $v, int $t = PDO::PARAM_STR): bool { return true; }
    public function execute(?array $params = null): bool
    {
        $sql = preg_replace('/\s+/', ' ', trim($this->sql));
        $p = array_values($params ?? []);
        $this->pdo->log[] = ['sql' => $sql, 'params' => $p, 'tx' => $this->pdo->txId, 'in_tx' => $this->pdo->inTx];
        $a = $this->pdo->handle($sql, $p);
        $this->rows = $a['rows'] ?? [];
        $this->column = $a['column'] ?? false;
        $this->count = $a['count'] ?? count($this->rows);
        $this->cursor = 0;
        return true;
    }
    public function fetch(mixed ...$a): mixed { return $this->rows[$this->cursor++] ?? false; }
    public function fetchColumn(mixed ...$a): mixed { return $this->column; }
    public function fetchAll(mixed ...$a): array { return $this->rows; }
    public function rowCount(): int { return $this->count; }
}

final class BtPdo extends PDO
{
    public array $log = [];
    public bool $inTx = false;
    public int $txId = 0;
    public array $txEvents = [];
    public function __construct(public array $student, private array $regions) {}
    #[\ReturnTypeWillChange] public function prepare(string $q, array $o = []): BtStmt { return new BtStmt($this, $q); }
    #[\ReturnTypeWillChange] public function query(string $q, ?int $m = null, mixed ...$a): BtStmt { $s = new BtStmt($this, $q); $s->execute([]); return $s; }
    public function inTransaction(): bool { return $this->inTx; }
    public function beginTransaction(): bool { $this->inTx = true; $this->txId++; $this->txEvents[] = 'begin#' . $this->txId; return true; }
    public function commit(): bool { $this->inTx = false; $this->txEvents[] = 'commit#' . $this->txId; return true; }
    public function rollBack(): bool { $this->inTx = false; $this->txEvents[] = 'rollback#' . $this->txId; return true; }

    public function handle(string $sql, array $p): array
    {
        $byId = [];
        foreach ($this->regions as $r) { $byId[(int) $r['id']] = $r; }
        if (str_contains($sql, 'FROM students s WHERE s.id = ?')) {
            return ['rows' => (int) ($p[0] ?? 0) === (int) $this->student['id'] ? [$this->student] : []];
        }
        if (str_contains($sql, 'SELECT preferred_lesson_type FROM students WHERE id = ? LIMIT 1 FOR UPDATE')) {
            return ['column' => $this->student['preferred_lesson_type']];
        }
        if (str_starts_with($sql, 'UPDATE students SET exposure_status = ?')) {
            [$to, $publishedAt, $id, $from] = $p;
            if ((int) $id === (int) $this->student['id'] && $this->student['exposure_status'] === $from) {
                $this->student['exposure_status'] = $to;
                return ['count' => 1];
            }
            return ['count' => 0];
        }
        if (str_starts_with($sql, 'UPDATE students SET ')) {
            preg_match('/^UPDATE students SET (.+) WHERE id = \?$/', $sql, $m);
            $i = 0;
            foreach (explode(', ', $m[1] ?? '') as $set) {
                if ($set === 'updated_at = NOW()') { continue; }
                $col = trim(explode('=', $set)[0]);
                $this->student[$col] = $p[$i++];
            }
            return ['count' => 1];
        }
        if (str_contains($sql, 'FROM student_subject_targets') && str_contains($sql, 'subject_name, school_level')) {
            return ['rows' => [['subject_name' => '수학', 'school_level' => 'middle']]];
        }
        if (str_contains($sql, 'FROM regions WHERE id = ? LIMIT 1') && str_contains($sql, 'unit_level, official_code')) {
            $r = $byId[(int) ($p[0] ?? 0)] ?? null;
            return ['rows' => $r ? [$r] : []];
        }
        if (str_contains($sql, 'WHERE is_selectable = 1 AND CHAR_LENGTH(official_code) >= 5 AND LEFT(official_code, 5) = ?')) {
            foreach ($this->regions as $r) {
                if ((int) $r['is_selectable'] === 1 && substr((string) $r['official_code'], 0, 5) === ($p[0] ?? '')) {
                    return ['rows' => [['id' => $r['id'], 'sido_name' => $r['sido_name'], 'sigungu_name' => $r['sigungu_name']]]];
                }
            }
            return ['rows' => []];
        }
        if (preg_match('/SELECT 1 FROM regions WHERE id = \? AND is_selectable = 1/', $sql)) {
            return ['column' => (int) ($byId[(int) ($p[0] ?? 0)]['is_selectable'] ?? 0) === 1 ? 1 : false];
        }
        if (str_contains($sql, 'SELECT 1 FROM regions WHERE id = ? AND is_active = 1')) {
            return ['column' => isset($byId[(int) ($p[0] ?? 0)]) ? 1 : false];
        }
        if (str_contains($sql, 'SELECT 1 FROM complexes WHERE id = ? AND is_active = 1')) {
            return ['column' => (int) ($p[0] ?? 0) === 55 ? 1 : false];
        }
        if (str_contains($sql, 'SELECT region_id FROM complexes WHERE id = ?')) {
            return ['column' => (int) ($p[0] ?? 0) === 55 ? 9101 : false];
        }
        if (str_contains($sql, 'information_schema.COLUMNS')) { return ['column' => 1]; }
        return [];
    }
}

function gu(int $id, string $sido, string $name, string $code): array
{
    return ['id' => $id, 'sido_code' => substr($code, 0, 2), 'sido_name' => $sido, 'sigungu_name' => $name, 'sigungu_code' => substr($code, 0, 5), 'dong_name' => '', 'unit_level' => 'sigungu', 'official_code' => $code, 'is_selectable' => 1, 'is_active' => 1];
}
/** 과외 단위 광역시(073 시도 행). */
function metroUnit(int $id, string $sidoCode, string $sido): array
{
    return ['id' => $id, 'sido_code' => $sidoCode, 'sido_name' => $sido, 'sigungu_name' => '', 'sigungu_code' => $sidoCode . '000', 'dong_name' => '', 'unit_level' => 'sido', 'official_code' => $sidoCode . '00000000', 'is_selectable' => 0, 'is_active' => 1];
}
function dong(int $id, string $sido, string $gu, string $sgCode, string $name): array
{
    return ['id' => $id, 'sido_code' => substr($sgCode, 0, 2), 'sido_name' => $sido, 'sigungu_name' => $gu, 'sigungu_code' => $sgCode, 'dong_name' => $name, 'unit_level' => 'dong', 'official_code' => null, 'is_selectable' => 0, 'is_active' => 1];
}
// 424 경기도 의정부시는 구 단위(공부방 축)이자 과외 단위, 117 은 과외 단위 서울특별시.
$REGIONS = [
    gu(424, '경기도', '의정부시', '4115000000'),
    metroUnit(117, '11', '서울특별시'),
    dong(9101, '경기', '의정부시', '41150', '신곡동'),
    dong(9201, '서울', '도봉구', '11320', '창동'),
];

function row(string $type, ?int $tutor, ?int $room, ?int $complex = null, ?string $basis = null, string $status = 'published'): array
{
    return [
        'id' => 31, 'guardian_user_id' => 21, 'student_name' => '학생31', 'public_display_name' => '민지',
        'grade_level' => '중2', 'gender' => null, 'birth_year' => null, 'exposure_status' => $status, 'memo_status' => 'open',
        'preferred_lesson_type' => $type, 'preferred_tutor_region_id' => $tutor, 'preferred_studyroom_region_id' => $room,
        'preferred_studyroom_complex_id' => $complex, 'preferred_studyroom_region_basis' => $basis, 'preferred_region_note' => '옛 메모 지역',
        'lesson_format' => 'one_on_one', 'student_gender_group' => null, 'preferred_student_count_group' => 'solo',
        'lessons_per_week' => 2, 'minutes_per_lesson' => 60, 'preferred_fee_amount' => 300000, 'preferred_studyroom_fee_amount' => 250000,
        'preferred_tutor_gender' => null, 'request_summary' => null, 'special_request_note' => null,
        'updated_at' => '2026-10-01 09:00:00', 'published_at' => '2026-10-01 09:00:00', 'deleted_at' => null,
    ];
}

function ok(string $name, bool $cond, string $detail = ''): void
{
    echo ($cond ? 'PASS ' : 'FAIL ') . $name . ($cond || $detail === '' ? '' : ' — ' . $detail) . "\n";
}
function attempt(string $name, callable $fn): void
{
    try { $fn(); } catch (Throwable $e) { ok($name, false, get_class($e) . ': ' . $e->getMessage()); }
}
function boot(array $regions, array $student): BtPdo
{
    $pdo = new BtPdo($student, $regions);
    (new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);
    return $pdo;
}
/** @return array{sql: string, params: list<mixed>, tx: int, in_tx: bool}|null */
function profileUpdate(BtPdo $pdo): ?array
{
    foreach ($pdo->log as $e) {
        if (str_starts_with($e['sql'], 'UPDATE students SET ') && !str_starts_with($e['sql'], 'UPDATE students SET exposure_status')) { return $e; }
    }
    return null;
}
function logIndex(BtPdo $pdo, string $needle): int
{
    foreach ($pdo->log as $i => $e) { if (str_contains($e['sql'], $needle)) { return $i; } }
    return -1;
}
function patchVia(BtPdo $pdo, array $patch): array
{
    $service = new StudentHubService(new StudentHubRepository($pdo));
    return $service->applyAction(21, 31, 'update', ['patch' => $patch]);
}

$rows = [];

attempt('E1 과외→공부방 분기 변경(요청에 과외 지역 117 동봉)', static function () use ($REGIONS, &$rows): void {
    $pdo = boot($REGIONS, row('tutor', 424, null));
    $out = patchVia($pdo, ['preferred_lesson_type' => 'study_room', 'preferred_tutor_region_id' => 117]);
    $s = $pdo->student;
    $u = profileUpdate($pdo);
    ok('E1 분기 = study_room', $s['preferred_lesson_type'] === 'study_room');
    ok('E1 과외 지역 NULL(요청 117 무시)', $s['preferred_tutor_region_id'] === null, var_export($s['preferred_tutor_region_id'], true));
    ok('E1 공부방 지역·단지·기준 NULL', $s['preferred_studyroom_region_id'] === null && $s['preferred_studyroom_complex_id'] === null && $s['preferred_studyroom_region_basis'] === null);
    ok('E1 UPDATE 1건에 4개 지역 컬럼 모두 포함', $u !== null
        && str_contains($u['sql'], 'preferred_tutor_region_id = ?') && str_contains($u['sql'], 'preferred_studyroom_region_id = ?')
        && str_contains($u['sql'], 'preferred_studyroom_complex_id = ?') && str_contains($u['sql'], 'preferred_studyroom_region_basis = ?'), $u['sql'] ?? '');
    $lock = $pdo->log[logIndex($pdo, 'FOR UPDATE')] ?? null;
    ok('E1 현재 분기 FOR UPDATE 읽기 = 트랜잭션 안', $lock !== null && $lock['in_tx'] === true);
    ok('E1 UPDATE = 같은 트랜잭션', $u !== null && $u['in_tx'] === true && $u['tx'] === $lock['tx']);
    $rejudge = $pdo->log[logIndex($pdo, 'UPDATE students SET exposure_status = ?')] ?? null;
    ok('E1 rejudgeExposure 실행(published → draft) = 같은 트랜잭션', $rejudge !== null && $rejudge['in_tx'] === true && $rejudge['tx'] === $u['tx'] && $rejudge['params'][0] === 'draft');
    ok('E1 트랜잭션 1번 열고 1번 커밋', $pdo->txEvents === ['begin#1', 'commit#1'], json_encode($pdo->txEvents));
    ok('E1 카드 노출 내려감(draft)', $s['exposure_status'] === 'draft');
    $student = $out['student'] ?? [];
    ok('E1 응답 basic_missing 에 희망지역', in_array('희망지역', $student['basic_missing'] ?? [], true), json_encode($student['basic_missing'] ?? null, JSON_UNESCAPED_UNICODE));
    ok('E1 응답 region_label 빈 문자열(메모·반대 축 폴백 없음)', ($student['region_label'] ?? null) === '', var_export($student['region_label'] ?? null, true));
    $rows['branch_changed_empty'] = $student;
});

attempt('E2 공부방(단지 기준)→과외 분기 변경 + 새 과외 지역 117 · 요청에 공부방 지역 9201 동봉', static function () use ($REGIONS, &$rows): void {
    $pdo = boot($REGIONS, row('study_room', null, 9101, 55, 'complex'));
    $out = patchVia($pdo, ['preferred_lesson_type' => 'tutor', 'preferred_tutor_region_id' => 117, 'preferred_studyroom_region_id' => 9201]);
    $s = $pdo->student;
    ok('E2 과외 지역 = 117(새 분기 값은 저장)', $s['preferred_tutor_region_id'] === 117, var_export($s['preferred_tutor_region_id'], true));
    ok('E2 공부방 지역 NULL(요청 9201 무시)', $s['preferred_studyroom_region_id'] === null, var_export($s['preferred_studyroom_region_id'], true));
    ok('E2 단지·기준 NULL', $s['preferred_studyroom_complex_id'] === null && $s['preferred_studyroom_region_basis'] === null);
    ok('E2 기본정보 완료 → published 유지', $s['exposure_status'] === 'published');
    ok('E2 응답 region_label = 서울특별시(과외 단위)', ($out['student']['region_label'] ?? '') === '서울특별시', (string) ($out['student']['region_label'] ?? ''));
    $rows['tutor_dobong'] = $out['student'];
});

attempt('E3 같은 분기(과외) 저장 · 요청에 공부방 값(잘못된 단지 id 포함) 동봉', static function () use ($REGIONS): void {
    $pdo = boot($REGIONS, row('tutor', 424, 9201));
    patchVia($pdo, ['preferred_tutor_region_id' => 117, 'preferred_studyroom_region_id' => 9101, 'preferred_studyroom_complex_id' => 'abc']);
    $s = $pdo->student;
    $u = profileUpdate($pdo);
    ok('E3 반대 분기 값은 검증 전에 버림(요청 실패 없음) · 과외 지역 = 117', $s['preferred_tutor_region_id'] === 117);
    ok('E3 UPDATE 에 공부방 컬럼 없음', $u !== null && !str_contains($u['sql'], 'preferred_studyroom_'), $u['sql'] ?? '');
    ok('E3 분기 그대로면 기존 반대 축 값은 손대지 않음(일괄 보정 없음)', $s['preferred_studyroom_region_id'] === 9201);
});

attempt('E4 같은 분기(공부방) 단지 기준 저장 → 단지 행정동 파생 유지', static function () use ($REGIONS): void {
    $pdo = boot($REGIONS, row('study_room', 424, 9201));
    patchVia($pdo, ['preferred_studyroom_region_basis' => 'complex', 'preferred_studyroom_complex_id' => 55, 'preferred_tutor_region_id' => 117]);
    $s = $pdo->student;
    ok('E4 공부방 지역 = 단지 행정동 9101', $s['preferred_studyroom_region_id'] === 9101, var_export($s['preferred_studyroom_region_id'], true));
    ok('E4 단지 55 · 기준 complex', $s['preferred_studyroom_complex_id'] === 55 && $s['preferred_studyroom_region_basis'] === 'complex');
    ok('E4 과외 지역 요청 117 무시(기존 424 그대로)', $s['preferred_tutor_region_id'] === 424);
});

attempt('E5 과외→공부방 분기 변경 + 새 공부방 동 9101', static function () use ($REGIONS, &$rows): void {
    $pdo = boot($REGIONS, row('tutor', 424, null));
    $out = patchVia($pdo, ['preferred_lesson_type' => 'study_room', 'preferred_studyroom_region_basis' => 'dong', 'preferred_studyroom_region_id' => 9101]);
    $s = $pdo->student;
    ok('E5 공부방 동 = 9101 · 과외 지역 NULL', $s['preferred_studyroom_region_id'] === 9101 && $s['preferred_tutor_region_id'] === null);
    ok('E5 단지 NULL · 기준 dong', $s['preferred_studyroom_complex_id'] === null && $s['preferred_studyroom_region_basis'] === 'dong');
    ok('E5 기본정보 완료 → published 유지', $s['exposure_status'] === 'published');
    ok('E5 응답 region_label = 경기도 의정부시 신곡동', ($out['student']['region_label'] ?? '') === '경기도 의정부시 신곡동', (string) ($out['student']['region_label'] ?? ''));
    $rows['room_singok'] = $out['student'];
});

attempt('D1 학생 행 region_label 반대 축 폴백 없음', static function () use ($REGIONS, &$rows): void {
    $pdo = boot($REGIONS, row('tutor', null, 9201));
    $r = (new StudentHubRepository($pdo))->findById(31);
    ok('D1 과외 분기 + 공부방 지역만 → region_label 빈 문자열', ($r['region_label'] ?? null) === '', var_export($r['region_label'] ?? null, true));
    ok('D1 공부방 시군구 칸(과외쌤 찾기 폴백용) 없음', !array_key_exists('preferred_studyroom_sigungu_region_id', $r) && !array_key_exists('preferred_studyroom_sigungu_label', $r));
    $rows['tutor_only_room'] = $r;
    $pdo = boot($REGIONS, row('study_room', 424, null));
    $r = (new StudentHubRepository($pdo))->findById(31);
    ok('D1 공부방 분기 + 과외 지역만 → region_label 빈 문자열', ($r['region_label'] ?? null) === '', var_export($r['region_label'] ?? null, true));
    $pdo = boot($REGIONS, row('tutor', 424, null));
    $rows['tutor_uijeongbu'] = (new StudentHubRepository($pdo))->findById(31);
});

echo 'ROWS ' . json_encode($rows, JSON_UNESCAPED_UNICODE) . "\n";
`;

function phpBin() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  if (existsSync('D:\\php8.2\\php.exe')) return 'D:\\php8.2\\php.exe';
  return 'php';
}

console.log('##### 1부 서버 (가짜 PDO · StudentHubService::applyAction update) #####');
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
ok('php 실행', php.status === 0 && !php.stderr, `exit ${php.status} ${php.stderr || ''}`);
ok('서버 학생 행 준비(과외 의정부·공부방 신곡동·과외 분기+공부방만)', ['tutor_uijeongbu', 'room_singok', 'tutor_only_room'].every((k) => ROWS[k]));

const searchSrc = read('src/Search/SearchService.php');
ok('(d) 학생 카드 지역 JOIN = 분기 축만(COALESCE 반대 축 폴백 없음)', () =>
  /LEFT JOIN regions r ON r\.id = CASE WHEN s\.preferred_lesson_type = 'study_room'\s+THEN s\.preferred_studyroom_region_id ELSE s\.preferred_tutor_region_id END/.test(searchSrc) &&
  !/COALESCE\(s\.preferred_studyroom_region_id, s\.preferred_tutor_region_id\)/.test(searchSrc),
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
    hash: '#/parent',
    href: 'http://127.0.0.1:5174/#/parent',
    origin: 'http://127.0.0.1:5174',
    host: '127.0.0.1:5174',
    hostname: '127.0.0.1',
    protocol: 'http:',
    pathname: '/',
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
console.warn = () => {};

const ME = { user_id: 21, role_type: 'guardian_student', name: '학생보호자', email: 'p@x.test', email_verified: true };
const CITIES = [
  { id: 424, label: '의정부시', sido_code: '41', sido_name: '경기도', official_code: '4115000000', city_name: '의정부시', gu_name: '', kind: 'city' },
];
/** 과외 단위 목록 — regions.php action=tutor_units 응답 모양 */
const TUTOR_UNITS = [
  { id: 117, label: '서울특별시', sido_code: '11', sido_name: '서울특별시', unit_name: '', kind: 'metro', official_code: '1100000000' },
  { id: 424, label: '경기도 의정부시', sido_code: '41', sido_name: '경기도', unit_name: '의정부시', kind: 'city', official_code: '4115000000' },
];
const server = { students: [ROWS.tutor_uijeongbu], searchBodies: [] };
function firstStudentBranch(students) {
  const list = (Array.isArray(students) ? students : []).filter(
    (row) => row && typeof row === 'object' && row.exposure_status !== 'deleted' && !row.deleted_at,
  );
  list.sort((a, b) => Number(a.id) - Number(b.id));
  const type = list[0]?.preferred_lesson_type;
  return type === 'tutor' || type === 'study_room' ? type : null;
}
function json(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input), 'http://127.0.0.1:5174');
  let body = null;
  try {
    body = init.body ? JSON.parse(String(init.body)) : null;
  } catch {
    body = null;
  }
  if (url.pathname.endsWith('/api/auth/me.php')) {
    return json(200, { ok: true, authenticated: true, ...ME, student_branch: firstStudentBranch(server.students) });
  }
  if (url.pathname.endsWith('/api/registrations/students.php')) return json(200, { ok: true, students: server.students });
  if (url.pathname.endsWith('/api/auth/regions.php')) return json(200, { ok: true, cities: CITIES, tutor_units: TUTOR_UNITS });
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
const providerHome = await import('../preview/home-ui/src/provider-home.js');
const savedRegion = await import('../preview/search-ui/src/student-saved-region.js');
const navConfig = await import('../preview/shared/site-nav-config.js');
const routeAccess = await import('../preview/shared/route-access.js');
const regCopy = await import('../preview/home-ui/src/student-reg/student-reg-copy.js');
const loc = await import('../preview/shared/location-display.js');
const branchStore = await import('../preview/shared/student-branch-store.js');
const chromeSession = await import('../preview/shared/chrome-session.js');
const siteChrome = await import('../preview/shared/site-chrome.js');

const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

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

function freshFindState(state) {
  surface.resetFindSurface(state);
  state.canonicalLocation = null;
  state.activeRegionLabel = '';
  delete state.studentPicks;
  delete state._placeTab;
  delete state.studentFeedStatus;
  state.studentHopeType = null;
  state.hopeTypeResolved = false;
  state._gpsBootedTab = null;
}

async function reload() {
  await auth.initAuthSession();
  freshFindState(searchState.previewState);
  freshFindState(homeState.previewState.parentFind);
  homeState.previewState.parentTab = null;
}

/** 홈 #/parent: 그리기 → 목록 부트 → 다시 그리기. tabId 가 null 이면 첫 탭. */
async function renderHome(tabId) {
  location.hash = '#/parent';
  homeState.previewState.parentTab = tabId;
  parentScreen.renderParent();
  const active = homeState.previewState.parentTab;
  const searchTab = providerHome.getProviderHomeMode('parent', active).searchTab;
  surface.bootStudentFindFeed(searchTab, homeState.previewState.parentFind, () => {});
  await tick();
  const html = parentScreen.renderParent();
  return { html, text: visibleText(html), active };
}

function homeTabs(html) {
  return [...html.matchAll(/data-parent-tab="([^"]+)"[^>]*>([^<]+)</g)].map((m) => `${m[1]}:${m[2].trim()}`);
}

async function renderFind(tab) {
  location.hash = `#/search/${tab}`;
  searchPage.renderSearchPage({ sessionReady: true });
  surface.bootStudentFindFeed(tab, searchState.previewState, () => {});
  await tick();
  const html = searchPage.renderSearchPage({ sessionReady: true });
  return { html, text: visibleText(html) };
}

function assertRedirect(tag, tab, expectTab) {
  location.hash = `#/search/${tab}`;
  const html = searchPage.renderSearchPage({ sessionReady: true });
  const landed = String(location.hash).replace(/^#/, '');
  ok(`${tag} #/search/${tab} 직접 진입 → 그리지 않고 /search/${expectTab}`, html === '' && landed.startsWith(`/search/${expectTab}`), location.hash);
}

function findTabs(html) {
  return [...new Set([...html.matchAll(/data-action="gnb-(find_room|find_tutor|student_parent)"/g)].map((m) => m[1]))];
}

/** 분기별 홈·찾기 공통 검사. */
async function checkBranch(cfg) {
  const { tag, branch, place, ownTab, ownSearch, otherSearch, ownGnb, otherGnb, sampleKind, labels } = cfg;
  ok(`${tag} 분기 = ${branch}`, savedRegion.studentBranch() === branch, savedRegion.studentBranch());

  /* (a) 홈 탭 2개 */
  server.searchBodies = [];
  const first = await renderHome(null);
  const firstBody = server.searchBodies.find((b) => b?.tab === ownSearch);
  ok(`(a) ${tag} 홈 첫 탭 = ${ownTab}`, first.active === ownTab, String(first.active));
  ok(`(a) ${tag} 홈 탭 = ${labels.join(' · ')}`, JSON.stringify(homeTabs(first.html)) === JSON.stringify(labels), JSON.stringify(homeTabs(first.html)));
  const stale = await renderHome(branch === 'tutor' ? 'study_room' : 'tutor');
  ok(`(a) ${tag} 반대 분기 탭 상태(옛 값)는 첫 탭으로`, stale.active === ownTab, String(stale.active));

  /* (b) 분기 탭: 검색 블록·지역변경 없음, 0건 샘플+빈칸, 링크배지 */
  {
    const { html, text } = await renderHome(ownTab);
    ok(`(b) ${tag} 홈 ${ownTab} 검색 폼 없음`, !/data-find-form|data-search-form|<form[^>]*find/i.test(html));
    ok(`(b) ${tag} 홈 ${ownTab} 「지역 변경」 버튼 없음`, !/data-action="change-region"|data-find-change-region|지역 변경/.test(html));
    ok(`(b) ${tag} 홈 ${ownTab} 필터바 없음`, !/data-find-filter-bar|find-filter-bar/.test(html));
    const filters = JSON.stringify(firstBody?.filters || {});
    ok(`(b) ${tag} 홈 ${ownTab} 카드 = 서버 /search 저장 지역 조회`, Boolean(firstBody) && /region_id/.test(filters), JSON.stringify(firstBody));
    ok(`(b) ${tag} 홈 ${ownTab} 0건 → 샘플+빈칸(${sampleKind})`, html.includes(`data-student-home-vacant="${sampleKind}"`));
    ok(`(b) ${tag} 홈 ${ownTab} 샘플 도장`, /샘플/.test(text));
    ok(`(b) ${tag} 홈 ${ownTab} 빈칸 박스(프라임·픽·베이직)`, html.includes('data-prime-empty="1"') && html.includes('data-pick-empty="1"') && html.includes('data-basic-empty="1"'));
    ok(`(b) ${tag} 홈 ${ownTab} 샘플 카드 = 티어마다 1장(프라임·픽·베이직 3장)`, (html.match(/data-vacant-sample|expo-sample-stamp|샘플 공부방|샘플 과외쌤/g) || []).length >= 3);
    ok(`(b) ${tag} 홈 ${ownTab} 샘플 지역 = 내 지역`, html.includes(`>${place}<`) && !text.includes('서울 강남구') && !text.includes('가상'));
    if (ownSearch === 'tutor') {
      ok(
        `(b) ${tag} 홈 ${ownTab} 링크배지 없음`,
        !html.includes('data-parent-find-more="tutor"') && !text.includes(regCopy.STUDENT_BRANCH_COPY.home.findMore.tutor),
      );
    } else {
      ok(`(b) ${tag} 홈 ${ownTab} 링크배지 「${regCopy.STUDENT_BRANCH_COPY.home.findMore[ownSearch]}」`, html.includes(`data-parent-find-more="${ownSearch}"`) && text.includes(regCopy.STUDENT_BRANCH_COPY.home.findMore[ownSearch]));
    }
  }
  {
    server.searchBodies = [];
    const { html, text } = await renderHome('student');
    ok(`(b) ${tag} 홈 student 검색 폼·지역 변경 없음`, !/data-action="change-region"|지역 변경/.test(html));
    const body = server.searchBodies.find((b) => b?.tab === 'student');
    ok(`(b) ${tag} 홈 student 목록 = 분기 학생(preferred_lesson_type ${branch})`, body?.filters?.preferred_lesson_type === branch, JSON.stringify(body?.filters));
    ok(`(b) ${tag} 홈 student 0건 감성 문구`, html.includes('data-student-home-empty="student"') && text.includes(regCopy.STUDENT_BRANCH_COPY.home.studentEmptyTitle(place)));
    ok(`(b) ${tag} 홈 student 링크배지 「학생찾기에서 더 찾아보기」`, html.includes('data-parent-find-more="student"') && text.includes('학생찾기에서 더 찾아보기'));
    const bodyStart = html.indexOf('class="parent-home-body"');
    const bodyEnd = html.indexOf('</p>', html.indexOf('data-parent-find-more="student"'));
    const tabBody = visibleText(html.slice(bodyStart, bodyEnd));
    ok(`(b) ${tag} 홈 student 탭 본문 「학부모」 없음`, bodyStart > 0 && bodyEnd > bodyStart && !tabBody.includes('학부모'), tabBody.slice(0, 200));
  }

  /* (c) GNB 숨김 + 주소 차단 */
  ok(`(c) ${tag} GNB ${otherGnb} = hide`, navConfig.getGnbVisibility('parent', otherGnb) === 'hide');
  ok(`(c) ${tag} GNB ${ownGnb}·student_parent = show`, navConfig.isGnbItemVisible('parent', ownGnb) && navConfig.isGnbItemVisible('parent', 'student_parent'));
  {
    const { html } = await renderHome(ownTab);
    const gnb = findTabs(html);
    ok(`(c) ${tag} 홈 GNB 링크에 ${otherGnb} 없음`, !gnb.includes(otherGnb) && gnb.includes(ownGnb), JSON.stringify(gnb));
  }
  ok(`(c) ${tag} 찾기 탭 목록 = ${ownSearch}·student`, JSON.stringify(navConfig.visibleSearchTabsForRole('parent')) === JSON.stringify([ownSearch, 'student']), JSON.stringify(navConfig.visibleSearchTabsForRole('parent')));
  server.searchBodies = [];
  assertRedirect(`(c) ${tag}`, otherSearch, ownSearch);
  await tick();
  ok(`(c) ${tag} 차단된 탭 목록을 부르지 않음`, !server.searchBodies.some((b) => b?.tab === otherSearch), JSON.stringify(server.searchBodies));
  ok(`(c) ${tag} route-access 가드`, routeAccess.guardParentFindTab(otherSearch, branch).ok === false && routeAccess.guardParentFindTab(ownSearch, branch).ok && routeAccess.guardParentFindTab('student', branch).ok);
  {
    const { html, text } = await renderFind(ownSearch);
    ok(`(c) ${tag} 찾기 ${ownSearch} 열림 · 현재위치 = 내 지역`, html !== '' && text.includes(place));
    ok(`(c) ${tag} 찾기 탭 줄에 반대 탭 없음`, !html.includes(`data-search-tab="${otherSearch}"`) && !html.includes(`data-action="gnb-${otherGnb}"`));
  }
  {
    const { text } = await renderFind('student');
    ok(`(c) ${tag} 학생 찾기 = 분기 고정(희망 유형 선택칸 없음)`, !/data-hope-type-select|data-action="pick-hope-type"/.test(text) && text.includes(place));
  }
}

console.log('\n##### 2부 화면 (실제 모듈) #####');

console.log('=== 과외 분기(경기도 의정부시) ===');
server.students = [ROWS.tutor_uijeongbu];
await reload();
await checkBranch({
  tag: '과외 분기',
  branch: 'tutor',
  place: '경기도 의정부시',
  ownTab: 'tutor',
  ownSearch: 'tutor',
  otherSearch: 'room',
  ownGnb: 'find_tutor',
  otherGnb: 'find_room',
  sampleKind: 'tutor',
  labels: ['tutor:우리동네 과외쌤', 'student:우리동네 학생'],
});

console.log('=== 공부방 분기(경기도 의정부시 신곡동) ===');
server.students = [ROWS.room_singok];
await reload();
await checkBranch({
  tag: '공부방 분기',
  branch: 'study_room',
  place: '경기도 의정부시 신곡동',
  ownTab: 'study_room',
  ownSearch: 'room',
  otherSearch: 'tutor',
  ownGnb: 'find_room',
  otherGnb: 'find_tutor',
  sampleKind: 'study_room',
  labels: ['study_room:우리동네 공부방', 'student:우리동네 학생'],
});

/* (d) 화면 폴백 없음: 과외 분기인데 공부방 지역만 있는 옛 행 */
console.log('=== (d) 과외 분기 + 공부방 지역만(옛 데이터) ===');
server.students = [ROWS.tutor_only_room];
await reload();
{
  const saved = savedRegion.readStudentSavedRegion();
  ok('(d) 저장 지역 모듈: 과외 분기 지역 없음', saved?.lessonType === 'tutor' && !saved.tutor);
  ok('(d) studentPlaceFor tutor/student = null(공부방 동으로 채우지 않음)', savedRegion.studentPlaceFor(saved, 'tutor') === null && savedRegion.studentPlaceFor(saved, 'student') === null);
  ok('(d) studentPlaceFor room = null(반대 분기 탭)', savedRegion.studentPlaceFor(saved, 'room') === null);
  server.searchBodies = [];
  const home = await renderHome('tutor');
  ok('(d) 홈 과외쌤 탭 = 지역 등록 유도(창동 없음)', home.text.includes(loc.STUDENT_PLACE_PROMPT) && !home.text.includes('창동'));
  const find = await renderFind('tutor');
  ok('(d) 과외쌤 찾기 = 지역 등록 유도(창동 없음)', find.text.includes(loc.STUDENT_PLACE_PROMPT) && !find.text.includes('창동'));
  ok('(d) 다른 지역으로 목록을 부르지 않음', server.searchBodies.length === 0, JSON.stringify(server.searchBodies));
}
const savedSrc = read('preview/search-ui/src/student-saved-region.js');
ok('(d) student-saved-region: studyroomSigungu·branchSigungu 폴백 제거', !/studyroomSigungu|branchSigungu|preferred_studyroom_sigungu/.test(savedSrc));
ok('(d) 서버 행 출력에 preferred_studyroom_sigungu_* 없음', !/preferred_studyroom_sigungu_/.test(read('src/Registration/StudentHubRepository.php')));

/* (f) 마이페이지 분기 변경 */
console.log('=== (f) 마이페이지 분기 변경 안내 ===');
const copy = regCopy.STUDENT_BRANCH_COPY.mypage;
const regSrc = read('preview/home-ui/src/student-reg/screens.js');
ok('(f) 확인창 문구 = 지역설정 초기화 안내', /교습형태를 바꾸면 지역설정이 초기화돼요/.test(copy.changeConfirm) && /새 지역을 다시 입력해 주세요/.test(copy.changeConfirm));
ok('(f) 분기 변경 시 확인창(저장된 분기와 다를 때만)', /next !== savedHope && !window\.confirm\(STUDENT_BRANCH_COPY\.mypage\.changeConfirm\)/.test(regSrc));
ok('(f) 취소하면 이전 선택으로 되돌림', /select\.value = shownHope;\s*return;/.test(regSrc));
ok('(f) 동의하면 새 분기 지역칸 비움 · 저장된 분기로 돌아오면 저장값 복원', /fillBranchRegion\(next, next === savedHope\)/.test(regSrc) && /restore \? savedTutorRegion : ''/.test(regSrc));
ok('(f) 저장 후 항상 새로고침 안내(분기 변경/일반)', /새로고침해 주세요/.test(copy.savedRefresh) && /새로고침해 주세요/.test(copy.branchSavedRefresh) && /branchChanged \? copy\.branchSavedRefresh : copy\.savedRefresh/.test(regSrc));
ok('(f) 지역이 비면 「지역을 입력하면 다시 보여요」', /지역을 입력하면 다시 보여요/.test(copy.regionEmptyHint) && /missing\.includes\('희망지역'\)\) lines\.push\(copy\.regionEmptyHint\)/.test(regSrc));
ok('(f) 기본·상세 저장 모두 같은 안내', /formKind === 'settings' \? '저장되었습니다\.' : savedNotice\(branchChanged, saved\)/.test(regSrc));
ok('(f) 서버 응답(E1) = 희망지역 빈칸 → 지역 입력 안내 대상', (ROWS.branch_changed_empty?.basic_missing || []).includes('희망지역'));

/* 「학부모」 금지 · 문구 한곳 */
const touched = [
  'preview/home-ui/src/provider-home.js',
  'preview/home-ui/src/state.js',
  'preview/home-ui/src/screens/parent.js',
  'preview/search-ui/src/student-saved-region.js',
  'preview/search-ui/src/search-tier-render.js',
  'preview/shared/route-access.js',
];
for (const rel of touched) ok(`「학부모」 없음 · ${rel}`, !/학부모/.test(read(rel)));
{
  const flat = (v) => (typeof v === 'function' ? v('X') : v && typeof v === 'object' ? Object.values(v).map(flat).join(' ') : String(v));
  ok('「학부모」 없음 · STUDENT_BRANCH_COPY 문구', !/학부모/.test(flat(regCopy.STUDENT_BRANCH_COPY)));
}
ok('홈 3탭 정의·parentTab study_room 고정 제거', !/parent:\s*\[\s*\{\s*id: 'study_room'/.test(read('preview/home-ui/src/provider-home.js')) && /parentTab: null/.test(read('preview/home-ui/src/state.js')));
ok('찾기 링크배지·학생 0건 문구 = student-reg-copy 한곳', /findMore/.test(read('preview/home-ui/src/student-reg/student-reg-copy.js')) && !/더 찾아보기'/.test(read('preview/home-ui/src/provider-home.js')));

/* ══════════════════════ 3부: 세션 분기 (사이트오류-13) ══════════════════════ */

console.log('\n##### 3부 세션 분기 (공용 저장소) #####');

const PHP_BRANCH = String.raw`<?php
declare(strict_types=1);
define('STUDY114_AUTH_ME_LIBRARY', true);
require getcwd() . '/public/api/auth/me.php';

final class BranchStmt
{
    public array $params = [];
    public function __construct(private array $rows) {}
    public function execute(?array $params = null): bool { $this->params = $params ?? []; return true; }
    public function fetchAll(mixed ...$a): array
    {
        $uid = (int) ($this->params[0] ?? 0);
        $out = [];
        foreach ($this->rows as $row) {
            if ((int) ($row['guardian_user_id'] ?? 0) === $uid) $out[] = $row;
        }
        return $out;
    }
}
final class BranchPdo extends PDO
{
    public function __construct(private array $rows) {}
    #[\ReturnTypeWillChange] public function prepare(string $q, array $o = []): BranchStmt { return new BranchStmt($this->rows); }
}
function ok(string $name, bool $cond, string $detail = ''): void
{
    echo ($cond ? 'PASS ' : 'FAIL ') . $name . ($cond || $detail === '' ? '' : ' — ' . $detail) . "\n";
}
$rows = [
    ['id' => 9, 'guardian_user_id' => 21, 'preferred_lesson_type' => 'tutor', 'exposure_status' => 'published', 'deleted_at' => null],
    ['id' => 3, 'guardian_user_id' => 21, 'preferred_lesson_type' => 'study_room', 'exposure_status' => 'draft', 'deleted_at' => null],
    ['id' => 1, 'guardian_user_id' => 21, 'preferred_lesson_type' => 'tutor', 'exposure_status' => 'deleted', 'deleted_at' => null],
    ['id' => 2, 'guardian_user_id' => 21, 'preferred_lesson_type' => 'tutor', 'exposure_status' => 'published', 'deleted_at' => '2026-01-01 00:00:00'],
    ['id' => 4, 'guardian_user_id' => 99, 'preferred_lesson_type' => 'tutor', 'exposure_status' => 'published', 'deleted_at' => null],
];
$pdo = new BranchPdo($rows);
ok('(e) 여러 행 → id 오름차순 첫 살아 있는 행(3 study_room)', study114_auth_me_student_branch($pdo, 'guardian_student', 21) === 'study_room');
ok('(e) 더 작은 id 가 삭제면 다음 행', study114_auth_me_student_branch(new BranchPdo([
    ['id' => 8, 'guardian_user_id' => 21, 'preferred_lesson_type' => 'study_room', 'exposure_status' => 'published', 'deleted_at' => null],
    ['id' => 5, 'guardian_user_id' => 21, 'preferred_lesson_type' => 'tutor', 'exposure_status' => 'deleted', 'deleted_at' => null],
]), 'guardian_student', 21) === 'study_room');
ok('(e) 학생 행 없음 → null', study114_auth_me_student_branch(new BranchPdo([]), 'guardian_student', 21) === null);
ok('(e) 공급자 역할 → null', study114_auth_me_student_branch($pdo, 'tutor', 21) === null);
ok('(e) 공부방 공급자 역할 → null', study114_auth_me_student_branch($pdo, 'study_room_owner', 21) === null);
ok('(e) 유형이 없는 첫 행 → null', study114_auth_me_student_branch(new BranchPdo([
    ['id' => 1, 'guardian_user_id' => 21, 'preferred_lesson_type' => null, 'exposure_status' => 'draft', 'deleted_at' => null],
    ['id' => 2, 'guardian_user_id' => 21, 'preferred_lesson_type' => 'tutor', 'exposure_status' => 'published', 'deleted_at' => null],
]), 'guardian_student', 21) === null);
$meSrc = file_get_contents(getcwd() . '/public/api/auth/me.php');
ok('(e) 인증 응답에 student_branch 키', str_contains($meSrc, "'student_branch' => \$studentBranch"));
ok('(e) 학생 행 조회는 guardian_user_id', str_contains($meSrc, 'WHERE guardian_user_id = ?'));
`;

console.log('=== (e) me.php 학생 행 선택 ===');
const phpBranch = spawnSync(phpBin(), [], { cwd: ROOT, input: PHP_BRANCH, encoding: 'utf8' });
for (const line of `${phpBranch.stdout || ''}`.split(/\r?\n/)) {
  if (line.startsWith('PASS ')) {
    passed += 1;
    console.log(line);
  } else if (line.startsWith('FAIL ')) {
    failed += 1;
    console.error(line);
  } else if (line.trim()) {
    console.log(line);
  }
}
if (phpBranch.status !== 0 || phpBranch.stderr) console.error(phpBranch.stderr || `php exit ${phpBranch.status}`);
ok('(e) php 학생 행 선택 실행', phpBranch.status === 0 && !phpBranch.stderr, `exit ${phpBranch.status} ${phpBranch.stderr || ''}`);

function gnbPair(role) {
  return {
    room: navConfig.getGnbVisibility(role, 'find_room'),
    tutor: navConfig.getGnbVisibility(role, 'find_tutor'),
    student: navConfig.getGnbVisibility(role, 'student_parent'),
    registerRoom: navConfig.getGnbVisibility(role, 'register_room'),
    registerTutor: navConfig.getGnbVisibility(role, 'register_tutor'),
    plans: navConfig.getGnbVisibility(role, 'plans'),
  };
}

function headerFindIds(role, user) {
  const html = siteChrome.renderSiteHeader({ user, loggedIn: Boolean(user), role });
  return [...html.matchAll(/data-action="gnb-(find_room|find_tutor)"/g)].map((m) => m[1]);
}

const baseFetch = globalThis.fetch;
const savedPath = location.pathname;
const savedHash = location.hash;

console.log('=== (a) 분기 모름 · 로드 실패 ===');
branchStore.resetStudentBranchSession();
ok('(a) 세션 확인 전 parentBranch = null', navConfig.parentBranch() === null);
ok('(a) 세션 확인 전 find_room·find_tutor 둘 다 hide', navConfig.getGnbVisibility('parent', 'find_room') === 'hide' && navConfig.getGnbVisibility('parent', 'find_tutor') === 'hide');
ok('(a) 세션 확인 전 학생찾기·홈은 그대로', navConfig.isGnbItemVisible('parent', 'student_parent') && navConfig.isGnbItemVisible('parent', 'home'));
ok('(a) 세션 확인 전 공급자 메뉴는 숨기지 않음', navConfig.getGnbVisibility('tutor', 'find_tutor') === 'show' && navConfig.getGnbVisibility('study_room', 'find_room') === 'show' && navConfig.getGnbVisibility('guest', 'find_room') === 'show');

globalThis.fetch = async () => {
  throw new Error('me.php down');
};
let thrown = false;
try {
  await auth.fetchSession();
} catch {
  thrown = true;
}
ok('(a) fetchSession 로드 실패는 예외', thrown);
ok('(a) 로드 실패 후 세션 확인 완료·분기 null', branchStore.isStudentBranchSessionChecked() && branchStore.isStudentBranchAuthoritative() && branchStore.getStoredStudentBranch() === null);
ok('(a) 로드 실패 시 학생 찾기 둘 다 hide', navConfig.getGnbVisibility('parent', 'find_room') === 'hide' && navConfig.getGnbVisibility('parent', 'find_tutor') === 'hide');
ok('(a) 로드 실패여도 게스트 메뉴는 그대로', JSON.stringify(gnbPair('guest')) === JSON.stringify({ room: 'show', tutor: 'show', student: 'show', registerRoom: 'show', registerTutor: 'show', plans: 'show' }));
globalThis.fetch = baseFetch;

branchStore.noteSessionStudentBranch({ ok: true, authenticated: true, role_type: 'guardian_student', student_branch: null });
ok('(a) student_branch null 확정 → 둘 다 hide', navConfig.parentBranch() === null && navConfig.getGnbVisibility('parent', 'find_room') === 'hide' && navConfig.getGnbVisibility('parent', 'find_tutor') === 'hide');

console.log('=== (b) 번들별 공부방·과외 학생 ===');
const bundleSources = {
  'auth-ui': read('preview/auth-ui/src/main.js'),
  'study-room-ui': read('preview/study-room-ui/src/main.js'),
  'tutor-ui': read('preview/tutor-ui/src/main.js'),
  'home-ui': read('preview/home-ui/src/auth-session.js'),
  'search-ui': read('preview/search-ui/src/main.js'),
};
ok('(b) auth-ui·study-room-ui·tutor-ui 는 initChromeSession', /initChromeSession/.test(bundleSources['auth-ui']) && /initChromeSession/.test(bundleSources['study-room-ui']) && /initChromeSession/.test(bundleSources['tutor-ui']));
ok('(b) home-ui 는 fetchSession, search-ui 는 initAuthSession', /export async function fetchSession/.test(bundleSources['home-ui']) && /initAuthSession/.test(bundleSources['search-ui']));
ok('(b) 공용 저장소는 preview/shared 한 파일', existsSync(join(ROOT, 'preview/shared/student-branch-store.js')));
for (const rel of ['preview/auth-ui', 'preview/study-room-ui', 'preview/tutor-ui', 'preview/home-ui', 'preview/search-ui']) {
  ok(`(b) ${rel} 에 저장소 복제 없음`, !existsSync(join(ROOT, rel, 'src/student-branch-store.js')));
}

async function chromeAs(branch, students) {
  server.students = students;
  ME.role_type = 'guardian_student';
  ME.email_verified = true;
  location.pathname = '/';
  location.hash = '#/parent';
  await chromeSession.initChromeSession();
}
async function fetchAs(branch, students) {
  server.students = students;
  ME.role_type = 'guardian_student';
  ME.email_verified = true;
  location.pathname = '/';
  location.hash = '#/parent';
  await auth.fetchSession();
}

const roomStudents = [ROWS.room_singok];
const tutorStudents = [ROWS.tutor_uijeongbu];
const parentUser = { role_type: 'guardian_student', email_verified: true, name: '학생' };

await chromeAs('study_room', roomStudents);
ok('(b) auth-ui·study-room-ui·tutor-ui chrome 공부방 학생 저장소', branchStore.getStoredStudentBranch() === 'study_room' && branchStore.isStudentBranchAuthoritative());
{
  const ids = headerFindIds('parent', parentUser);
  ok('(b) auth-ui·study-room-ui·tutor-ui 공부방 학생: find_room 보이고 find_tutor 없음', ids.includes('find_room') && !ids.includes('find_tutor'), JSON.stringify(ids));
}
await chromeAs('tutor', tutorStudents);
{
  const ids = headerFindIds('parent', parentUser);
  ok('(b) auth-ui·study-room-ui·tutor-ui chrome 과외 학생: find_tutor 보이고 find_room 없음', ids.includes('find_tutor') && !ids.includes('find_room'), JSON.stringify(ids));
}

await fetchAs('study_room', roomStudents);
ok('(b) home-ui·search-ui fetchSession 공부방 학생 저장소', branchStore.getStoredStudentBranch() === 'study_room');
ok('(b) home-ui·search-ui 공부방 학생 GNB', navConfig.getGnbVisibility('parent', 'find_tutor') === 'hide' && navConfig.isGnbItemVisible('parent', 'find_room') && navConfig.isGnbItemVisible('parent', 'student_parent'));
await fetchAs('tutor', tutorStudents);
ok('(b) home-ui·search-ui 과외 학생 GNB', navConfig.getGnbVisibility('parent', 'find_room') === 'hide' && navConfig.isGnbItemVisible('parent', 'find_tutor') && navConfig.isGnbItemVisible('parent', 'student_parent'));

sessionStorage.setItem('study114-preview-active-role', 'parent');
const mypageSrc = read('preview/home-ui/src/main.js');
const mypageBlock = mypageSrc.slice(mypageSrc.indexOf('if (isMypageRoute())'), mypageSrc.indexOf('const key = getCurrentScreen()'));
ok('(b) 마이페이지는 sessionChecked 전에 renderMypage 를 부르지 않음', /if \(!sessionChecked\) \{\s*app\.innerHTML = '';\s*return;\s*\}/.test(mypageBlock) && mypageBlock.indexOf('if (!sessionChecked)') < mypageBlock.indexOf('renderMypage()'));
branchStore.resetStudentBranchSession();
ok('(b) 마이페이지 확인 전 저장 역할 parent 여도 분기는 null·찾기 둘 다 hide', sessionStorage.getItem('study114-preview-active-role') === 'parent' && navConfig.parentBranch() === null && navConfig.getGnbVisibility('parent', 'find_room') === 'hide' && navConfig.getGnbVisibility('parent', 'find_tutor') === 'hide');
await fetchAs('study_room', roomStudents);
ok('(b) 마이페이지 확인 후 공부방 학생은 find_tutor 만 hide', navConfig.getGnbVisibility('parent', 'find_tutor') === 'hide' && navConfig.isGnbItemVisible('parent', 'find_room'));
await fetchAs('tutor', tutorStudents);
ok('(b) 마이페이지 확인 후 과외 학생은 find_room 만 hide', navConfig.getGnbVisibility('parent', 'find_room') === 'hide' && navConfig.isGnbItemVisible('parent', 'find_tutor'));

console.log('=== (c) 공급자·게스트·관리자·이메일 인증 대기 ===');
const staticGuest = { ...navConfig.GNB_VISIBILITY.guest };
const staticAdmin = { ...navConfig.GNB_VISIBILITY.admin };
const staticRoom = { ...navConfig.GNB_VISIBILITY.study_room };
const staticTutor = { ...navConfig.GNB_VISIBILITY.tutor };
branchStore.noteSessionStudentBranch({ ok: true, authenticated: true, student_branch: 'study_room' });
function sameMap(role, expected) {
  return navConfig.GNB_MAIN.every((item) => navConfig.getGnbVisibility(role, item.id) === expected[item.id]);
}
ok('(c) 공부방 공급자 메뉴 불변', sameMap('study_room', staticRoom));
ok('(c) 과외쌤 공급자 메뉴 불변', sameMap('tutor', staticTutor));
ok('(c) 게스트 메뉴 불변', sameMap('guest', staticGuest));
ok('(c) 관리자 메뉴 불변', sameMap('admin', staticAdmin));
location.pathname = '/auth';
location.hash = '#/signup/verify-email';
const verifyFinds = [navConfig.getGnbVisibility('parent', 'find_room'), navConfig.getGnbVisibility('parent', 'find_tutor')];
ok('(c) 이메일 인증 대기 화면은 분기 숨김을 적용하지 않음', verifyFinds[0] === 'show' && verifyFinds[1] === 'show', JSON.stringify(verifyFinds));
ok('(c) 이메일 인증 대기에서도 공급자 메뉴 불변', sameMap('study_room', staticRoom) && sameMap('tutor', staticTutor));
location.pathname = savedPath;
location.hash = savedHash;

console.log('=== (d) 공용 저장소 갱신 후 메뉴 ===');
branchStore.noteSessionStudentBranch({ ok: true, authenticated: true, student_branch: 'tutor' });
ok('(d) 갱신 전 과외 학생은 find_room hide', navConfig.getGnbVisibility('parent', 'find_room') === 'hide' && navConfig.isGnbItemVisible('parent', 'find_tutor'));
branchStore.setStoredStudentBranch('study_room');
ok('(d) preferred_lesson_type 반영 후 find_tutor hide · find_room show', branchStore.getStoredStudentBranch() === 'study_room' && navConfig.getGnbVisibility('parent', 'find_tutor') === 'hide' && navConfig.isGnbItemVisible('parent', 'find_room'));
ok('(d) 저장 안내 문구는 그대로', /새로고침해 주세요/.test(regCopy.STUDENT_BRANCH_COPY.mypage.savedRefresh) && /새로고침해 주세요/.test(regCopy.STUDENT_BRANCH_COPY.mypage.branchSavedRefresh));
ok('(d) screens.js 가 저장 응답 분기로 저장소를 갱신', /setStoredStudentBranch\(saved\.preferred_lesson_type\)/.test(read('preview/home-ui/src/student-reg/screens.js')));
ok('(d) 잘못된 값으로는 저장소를 지우지 않음', () => {
  branchStore.setStoredStudentBranch('nope');
  return branchStore.getStoredStudentBranch() === 'study_room';
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
