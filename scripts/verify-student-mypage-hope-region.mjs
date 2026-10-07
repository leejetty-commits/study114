/**
 * 사이트오류-14 · 마이페이지 학생 공부방 희망지역 = 가입과 같은 카카오 주소검색
 * 실행: cd preview/home-ui && npx vite-node ../../scripts/verify-student-mypage-hope-region.mjs
 *
 * 1부(PHP, 가짜 PDO): StudentHubService::applyAction('update')
 *   단지 이름만 있으면 ComplexEnsure 로 id 를 만들어 학생 행에 저장한다.
 *   분기 변경 시 반대 지역은 비우고, 과외 분기에서는 단지 이름을 받아도 단지를 만들지 않는다.
 *   빈 값은 샘플 단지 id 로 채우지 않는다.
 * 2부: 화면 소스가 공용 컴포넌트를 쓰고, 샘플 단지 선택 상자를 그리지 않는다.
 * DB·PHP 서버에 접속하지 않는다.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderStudentHopeRegion } from '../preview/shared/study-room-basic-form.js';

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
require_once getcwd() . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Registration\StudentHubRepository;
use Study114\Registration\StudentHubService;

final class HopeStmt
{
    private array $rows = [];
    private mixed $column = false;
    private int $count = 0;
    private int $cursor = 0;
    public function __construct(private HopePdo $pdo, private string $sql) {}
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

final class HopePdo extends PDO
{
    public array $log = [];
    public bool $inTx = false;
    public int $txId = 0;
    public int $lastId = 0;
    public int $inserts = 0;
    public function __construct(public array $student, private array $regions, public array $complexes) {}
    #[\ReturnTypeWillChange] public function prepare(string $q, array $o = []): HopeStmt { return new HopeStmt($this, $q); }
    #[\ReturnTypeWillChange] public function query(string $q, ?int $m = null, mixed ...$a): HopeStmt { $s = new HopeStmt($this, $q); $s->execute([]); return $s; }
    public function inTransaction(): bool { return $this->inTx; }
    public function beginTransaction(): bool { $this->inTx = true; $this->txId++; return true; }
    public function commit(): bool { $this->inTx = false; return true; }
    public function rollBack(): bool { $this->inTx = false; return true; }
    public function lastInsertId(?string $name = null): string { return (string) $this->lastId; }

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
        if (str_contains($sql, 'FROM student_subject_targets')) {
            return ['rows' => [['subject_name' => '수학', 'school_level' => 'middle']]];
        }
        if (str_contains($sql, 'FROM regions WHERE id = ? LIMIT 1') && str_contains($sql, 'unit_level')) {
            $r = $byId[(int) ($p[0] ?? 0)] ?? null;
            return ['rows' => $r ? [$r] : []];
        }
        if (str_contains($sql, 'is_selectable = 1') && str_contains($sql, 'FROM regions')) {
            $r = $byId[(int) ($p[0] ?? 0)] ?? null;
            $ok = $r && (int) $r['is_active'] === 1 && (int) $r['is_selectable'] === 1;
            return ['column' => $ok ? 1 : false, 'rows' => $ok ? [$r] : []];
        }
        if (str_contains($sql, 'SELECT 1 FROM regions WHERE id = ? AND is_active = 1')) {
            $r = $byId[(int) ($p[0] ?? 0)] ?? null;
            return ['column' => $r && (int) $r['is_active'] === 1 ? 1 : false];
        }
        if (str_contains($sql, 'SELECT id, address FROM complexes WHERE region_id = ? AND name = ?')) {
            foreach ($this->complexes as $c) {
                if ((int) $c['region_id'] === (int) ($p[0] ?? 0) && (string) $c['name'] === (string) ($p[1] ?? '') && (int) $c['is_active'] === 1) {
                    return ['rows' => [['id' => $c['id'], 'address' => $c['address']]]];
                }
            }
            return ['rows' => []];
        }
        if (str_starts_with($sql, 'INSERT INTO complexes ')) {
            $id = 900 + count($this->complexes) + 1;
            $this->lastId = $id;
            $this->inserts++;
            $this->complexes[] = [
                'id' => $id, 'region_id' => (int) $p[0], 'name' => (string) $p[1], 'address' => $p[2], 'is_active' => 1,
            ];
            return ['count' => 1];
        }
        if (str_contains($sql, 'SELECT name FROM complexes WHERE id = ?')) {
            foreach ($this->complexes as $c) {
                if ((int) $c['id'] === (int) ($p[0] ?? 0) && (int) $c['is_active'] === 1) {
                    return ['column' => $c['name']];
                }
            }
            return ['column' => false];
        }
        if (str_contains($sql, 'SELECT region_id FROM complexes WHERE id = ?')) {
            foreach ($this->complexes as $c) {
                if ((int) $c['id'] === (int) ($p[0] ?? 0)) return ['column' => $c['region_id']];
            }
            return ['column' => false];
        }
        if (str_contains($sql, 'SELECT 1 FROM complexes WHERE id = ? AND is_active = 1')) {
            foreach ($this->complexes as $c) {
                if ((int) $c['id'] === (int) ($p[0] ?? 0) && (int) $c['is_active'] === 1) return ['column' => 1];
            }
            return ['column' => false];
        }
        return [];
    }
}

function gu(int $id, string $sido, string $name, string $code): array
{
    return ['id' => $id, 'sido_name' => $sido, 'sigungu_name' => $name, 'sigungu_code' => substr($code, 0, 5), 'dong_name' => '', 'unit_level' => 'sigungu', 'official_code' => $code, 'is_selectable' => 1, 'is_active' => 1];
}
function dong(int $id, string $sido, string $gu, string $sgCode, string $name): array
{
    return ['id' => $id, 'sido_name' => $sido, 'sigungu_name' => $gu, 'sigungu_code' => $sgCode, 'dong_name' => $name, 'unit_level' => 'dong', 'official_code' => null, 'is_selectable' => 0, 'is_active' => 1];
}
$REGIONS = [
    gu(117, '서울특별시', '도봉구', '1132000000'),
    dong(9101, '경기', '의정부시', '41150', '신곡동'),
];
function seedComplexes(): array
{
    return [
        ['id' => 55, 'region_id' => 9101, 'name' => '은마아파트', 'address' => '샘플', 'is_active' => 1],
        ['id' => 56, 'region_id' => 9101, 'name' => '대치래미안', 'address' => '샘플', 'is_active' => 1],
    ];
}
function row(string $type, ?int $tutor, ?int $room, ?int $complex = null, ?string $basis = null): array
{
    return [
        'id' => 31, 'guardian_user_id' => 21, 'student_name' => '학생31', 'public_display_name' => '민지',
        'grade_level' => '중2', 'gender' => null, 'birth_year' => null, 'exposure_status' => 'published', 'memo_status' => 'open',
        'preferred_lesson_type' => $type, 'preferred_tutor_region_id' => $tutor, 'preferred_studyroom_region_id' => $room,
        'preferred_studyroom_complex_id' => $complex, 'preferred_studyroom_region_basis' => $basis, 'preferred_region_note' => null,
        'lesson_format' => 'one_on_one', 'student_gender_group' => null, 'preferred_student_count_group' => 'solo',
        'lessons_per_week' => 2, 'minutes_per_lesson' => 60, 'preferred_fee_amount' => 300000, 'preferred_studyroom_fee_amount' => 250000,
        'preferred_tutor_gender' => null, 'request_summary' => null, 'special_request_note' => null,
        'updated_at' => '2026-10-01 09:00:00', 'published_at' => '2026-10-01 09:00:00', 'deleted_at' => null,
    ];
}
function boot(array $student): HopePdo
{
    global $REGIONS;
    $pdo = new HopePdo($student, $REGIONS, seedComplexes());
    (new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);
    return $pdo;
}
function patchVia(HopePdo $pdo, array $patch): array
{
    $service = new StudentHubService(new StudentHubRepository($pdo));
    return $service->applyAction(21, 31, 'update', ['patch' => $patch]);
}
function ok(string $name, bool $cond, string $detail = ''): void
{
    echo ($cond ? 'PASS ' : 'FAIL ') . $name . ($cond || $detail === '' ? '' : ' — ' . $detail) . "\n";
}
function attempt(string $name, callable $fn): void
{
    try { $fn(); } catch (Throwable $e) { ok($name, false, get_class($e) . ': ' . $e->getMessage()); }
}
function inserts(HopePdo $pdo): array
{
    $out = [];
    foreach ($pdo->log as $e) {
        if (str_starts_with($e['sql'], 'INSERT INTO complexes ')) $out[] = $e;
    }
    return $out;
}
function profileUpdate(HopePdo $pdo): ?array
{
    foreach ($pdo->log as $e) {
        if (str_starts_with($e['sql'], 'UPDATE students SET ') && !str_starts_with($e['sql'], 'UPDATE students SET exposure_status')) return $e;
    }
    return null;
}

attempt('S1 단지 이름만 → ComplexEnsure INSERT → 학생 행에 동·단지 저장', static function (): void {
    $pdo = boot(row('study_room', null, null));
    $out = patchVia($pdo, [
        'preferred_studyroom_region_basis' => 'complex',
        'preferred_studyroom_region_id' => '9101',
        'complex_name' => '한신아파트',
    ]);
    $s = $pdo->student;
    $ins = inserts($pdo);
    $upd = profileUpdate($pdo);
    ok('S1 단지 1건 생성', count($ins) === 1 && $pdo->inserts === 1, (string) count($ins));
    ok('S1 INSERT 는 학생 UPDATE 와 같은 트랜잭션', $ins !== [] && $upd !== null && $ins[0]['in_tx'] === true && $upd['in_tx'] === true && $ins[0]['tx'] === $upd['tx']);
    ok('S1 INSERT 파라미터 = 동 9101 · 한신아파트', ($ins[0]['params'][0] ?? null) === 9101 && ($ins[0]['params'][1] ?? null) === '한신아파트');
    ok('S1 학생 동 = 9101', $s['preferred_studyroom_region_id'] === 9101, var_export($s['preferred_studyroom_region_id'], true));
    ok('S1 학생 단지 = 새 id (샘플 55·56 아님)', is_int($s['preferred_studyroom_complex_id']) && $s['preferred_studyroom_complex_id'] > 56, var_export($s['preferred_studyroom_complex_id'], true));
    ok('S1 기준 = complex', $s['preferred_studyroom_region_basis'] === 'complex');
    ok('S1 응답 단지 이름 = 한신아파트', ($out['student']['preferred_studyroom_complex_label'] ?? null) === '한신아파트', var_export($out['student']['preferred_studyroom_complex_label'] ?? null, true));
    $before = $pdo->inserts;
    $again = patchVia($pdo, [
        'preferred_studyroom_region_basis' => 'complex',
        'preferred_studyroom_region_id' => 9101,
        'complex_name' => '한신아파트',
    ]);
    ok('S1 같은 이름은 다시 만들지 않음', $pdo->inserts === $before);
    ok('S1 다시 저장해도 같은 단지 id', $pdo->student['preferred_studyroom_complex_id'] === $s['preferred_studyroom_complex_id'] && ($again['student']['preferred_studyroom_complex_id'] ?? null) === $s['preferred_studyroom_complex_id']);
});

attempt('S2 공부방→과외 분기에 단지 이름을 실어도 단지를 만들지 않고 공부방 지역을 비움', static function (): void {
    $pdo = boot(row('study_room', null, 9101, 55, 'complex'));
    patchVia($pdo, [
        'preferred_lesson_type' => 'tutor',
        'preferred_tutor_region_id' => 117,
        'preferred_studyroom_region_basis' => 'complex',
        'preferred_studyroom_region_id' => 9101,
        'complex_name' => '한신아파트',
    ]);
    $s = $pdo->student;
    ok('S2 INSERT 없음', $pdo->inserts === 0);
    ok('S2 과외 지역 = 117', $s['preferred_tutor_region_id'] === 117, var_export($s['preferred_tutor_region_id'], true));
    ok('S2 공부방 동·단지·기준 NULL', $s['preferred_studyroom_region_id'] === null && $s['preferred_studyroom_complex_id'] === null && $s['preferred_studyroom_region_basis'] === null, json_encode([$s['preferred_studyroom_region_id'], $s['preferred_studyroom_complex_id'], $s['preferred_studyroom_region_basis']]));
});

attempt('S3 과외→공부방 + 단지 이름 저장, 과외 지역은 비움', static function (): void {
    $pdo = boot(row('tutor', 117, null));
    patchVia($pdo, [
        'preferred_lesson_type' => 'study_room',
        'preferred_tutor_region_id' => 117,
        'preferred_studyroom_region_basis' => 'complex',
        'preferred_studyroom_region_id' => 9101,
        'complex_name' => '한신아파트',
    ]);
    $s = $pdo->student;
    ok('S3 과외 지역 NULL', $s['preferred_tutor_region_id'] === null, var_export($s['preferred_tutor_region_id'], true));
    ok('S3 공부방 동 9101 · 새 단지', $s['preferred_studyroom_region_id'] === 9101 && is_int($s['preferred_studyroom_complex_id']) && $s['preferred_studyroom_complex_id'] > 56);
    ok('S3 샘플 단지 55·56 을 고르지 않음', $s['preferred_studyroom_complex_id'] !== 55 && $s['preferred_studyroom_complex_id'] !== 56);
});

attempt('S4 행정동 기준 저장은 이전 단지를 비우고 단지를 만들지 않음', static function (): void {
    $pdo = boot(row('study_room', null, 9101, 55, 'complex'));
    patchVia($pdo, [
        'preferred_studyroom_region_basis' => 'dong',
        'preferred_studyroom_region_id' => 9101,
        'preferred_studyroom_complex_id' => '',
    ]);
    $s = $pdo->student;
    ok('S4 INSERT 없음', $pdo->inserts === 0);
    ok('S4 동 9101 · 단지 NULL · 기준 dong', $s['preferred_studyroom_region_id'] === 9101 && $s['preferred_studyroom_complex_id'] === null && $s['preferred_studyroom_region_basis'] === 'dong');
});

attempt('S5 빈 단지 기준은 샘플 id 로 채우지 않고 지역을 비움', static function (): void {
    $pdo = boot(row('study_room', null, 9101, 55, 'complex'));
    patchVia($pdo, [
        'preferred_studyroom_region_basis' => 'complex',
        'preferred_studyroom_region_id' => '',
        'preferred_studyroom_complex_id' => '',
    ]);
    $s = $pdo->student;
    ok('S5 INSERT 없음', $pdo->inserts === 0);
    ok('S5 동 NULL · 단지 NULL (55·56 아님)', $s['preferred_studyroom_region_id'] === null && $s['preferred_studyroom_complex_id'] === null, json_encode([$s['preferred_studyroom_region_id'], $s['preferred_studyroom_complex_id']]));
});

attempt('S6 기존 단지 id 만 있으면 이름 생성 없이 그 id 와 소속 동을 유지', static function (): void {
    $pdo = boot(row('study_room', 117, null));
    patchVia($pdo, [
        'preferred_studyroom_region_basis' => 'complex',
        'preferred_studyroom_complex_id' => 55,
    ]);
    $s = $pdo->student;
    ok('S6 INSERT 없음', $pdo->inserts === 0);
    ok('S6 단지 55 · 동은 단지 소속 9101', $s['preferred_studyroom_complex_id'] === 55 && $s['preferred_studyroom_region_id'] === 9101);
});
`;

function phpBin() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  if (existsSync('D:\\php8.2\\php.exe')) return 'D:\\php8.2\\php.exe';
  return 'php';
}

console.log('##### 1부 서버 (가짜 PDO · 단지 이름 → ComplexEnsure) #####');
const php = spawnSync(phpBin(), [], { cwd: ROOT, input: PHP_CODE, encoding: 'utf8' });
for (const line of `${php.stdout || ''}`.split(/\r?\n/)) {
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
if (php.status !== 0 || php.stderr) console.error(php.stderr || `php exit ${php.status}`);
ok('php 실행', php.status === 0 && !php.stderr, `exit ${php.status} ${php.stderr || ''}`);

console.log('##### 2부 화면 #####');
const screens = read('preview/home-ui/src/student-reg/screens.js');
const copySrc = read('preview/home-ui/src/student-reg/student-reg-copy.js');
const hub = read('src/Registration/StudentHubRepository.php');
const form = read('preview/shared/study-room-basic-form.js');

ok(
  '화면: 공용 render/bind/readStudentHopeRegion 을 가져온다',
  /import \{\s*bindStudentHopeRegion,\s*readStudentHopeRegion,\s*renderStudentHopeRegion,\s*\} from '\.\.\/\.\.\/\.\.\/shared\/study-room-basic-form\.js'/.test(screens),
);
ok('화면: 공부방 칸이 renderStudentHopeRegion', /data-p19-hope-region-slot>\$\{renderStudentHopeRegion\(hopeRegionValues\(student\)\)\}/.test(screens));
ok('화면: 저장이 readStudentHopeRegion 후 complex_name 을 싣는다', /const hopeRegion = readStudentHopeRegion\(form\)/.test(screens) && /patch\.complex_name = place/.test(screens));
ok('화면: 샘플 목록 함수를 쓰지 않는다', !/listAllComplexes|ensureHopeRegionMasters|hope-region-masters/.test(screens));
ok(
  '화면: 공부방 희망지역 선택 상자 없음',
  !/renderSelect\('preferred_studyroom_region_id'/.test(screens) && !/renderSelect\('preferred_studyroom_complex_id'/.test(screens),
);
ok('화면: 샘플 단지 이름 없음', !/은마|대치래미안/.test(screens));
ok(
  '분기: 확인창 · 새 칸 비우기 · 저장값 복원 · 새로고침 안내',
  /next !== savedHope && !window\.confirm\(STUDENT_BRANCH_COPY\.mypage\.changeConfirm\)/.test(screens) &&
    /fillBranchRegion\(next, next === savedHope\)/.test(screens) &&
    /restore \? savedTutorRegion : ''/.test(screens) &&
    /mountStudentHopeRegion\(slot, restore \? savedHopeRegion : \{\}\)/.test(screens) &&
    /branchChanged \? copy\.branchSavedRefresh : copy\.savedRefresh/.test(screens) &&
    /새로고침해 주세요/.test(copySrc),
);
ok(
  '문구: 검색 실패·빈칸은 student-reg-copy 한곳',
  /hopeRegionDongMissing: '행정동을 찾지 못했습니다/.test(copySrc) &&
    /hopeRegionComplexMissing: '주소 검색으로 아파트·단지를 다시 선택해 주세요\.'/.test(copySrc) &&
    /hopeRegionComplexNameMissing: '아파트·단지 이름이 있는 주소로 다시 검색해 주세요\.'/.test(copySrc) &&
    /return copy\.hopeRegionDongMissing/.test(screens) &&
    /return copy\.hopeRegionComplexMissing/.test(screens) &&
    /return copy\.hopeRegionComplexNameMissing/.test(screens) &&
    /missing\.includes\('희망지역'\)\) lines\.push\(copy\.regionEmptyHint\)/.test(screens),
);
const fillCss = read('preview/shared/input-fill.css');
const formTags = [...screens.matchAll(/<form class="p19-form[^"]*"[^>]*>/g)].map((m) => m[0]);
const formLoopStart = screens.indexOf("root.querySelectorAll('[data-p19-form]').forEach((form) => {");
const formLoopEnd = screens.indexOf("form.addEventListener('submit'", formLoopStart);
const formLoop = screens.slice(formLoopStart, formLoopEnd);
const hopeBindStart = form.indexOf('export function bindStudentHopeRegion');
const hopeBind = form.slice(hopeBindStart, form.indexOf('\nexport function', hopeBindStart + 1));
ok(
  '칸 색: 공용 input-fill 로 칠하고, 희망지역 주소검색 적용도 공용 refresh',
  /import \{ bindInputFill, refreshInputFill \} from '\.\.\/\.\.\/\.\.\/shared\/input-fill\.js'/.test(screens) &&
    !existsSync(join(ROOT, 'preview/home-ui/src/student-reg/student-basic-fill.css')) &&
    !/student-basic-fill\.css|paintBasicFillChrome|bindBasicFillChrome/.test(screens) &&
    /import \{ refreshInputFill \} from '\.\/input-fill\.js'/.test(form) &&
    (hopeBind.match(/refreshInputFill\(slotEl\);\s*opts\.onApplied\?\.\(slotEl\);/g) || []).length === 2 &&
    /function mountStudentHopeRegion\(slot, values\) \{[\s\S]*?bindStudentHopeRegion\(slot\);\s*refreshInputFill\(slot\);\s*\}/.test(screens) &&
    !/paintHopeRegionChrome/.test(screens) &&
    !/el\.style\.background/.test(screens) &&
    !/#f3f4f6|#fff\b/.test(screens),
);
ok(
  '칸 색: 색 값은 공용 CSS 변수 한곳, data-input-fill 폼만, disabled 제외',
  (fillCss.match(/#f3f4f6/g) || []).length === 1 &&
    (fillCss.match(/#fff\b/g) || []).length === 1 &&
    /--input-fill-filled:\s*#f3f4f6/.test(fillCss) &&
    /--input-fill-empty:\s*#fff/.test(fillCss) &&
    /\[data-input-fill\] :is\(input, select, textarea\)\[data-fill='filled'\]:not\(:disabled\):not\(:focus\)/.test(fillCss) &&
    /background-color:\s*var\(--input-fill-filled\)/.test(fillCss) &&
    /background-color:\s*var\(--input-fill-empty\)/.test(fillCss) &&
    /\[data-fill\]:focus:not\(:disabled\)/.test(fillCss) &&
    !/background\s*:/.test(fillCss) &&
    !/\bborder\b|\boutline\b|box-shadow/.test(fillCss) &&
    !/!important/.test(fillCss) &&
    formTags.length >= 3 &&
    formTags.every((tag) => !/data-p19-basic|data-input-fill/.test(tag)) &&
    formLoop.includes('bindInputFill(form);') &&
    screens.split('bindInputFill(form)').length === 2,
);
ok(
  '서버: complex_name 은 관계 키이고 ComplexEnsure::ensure 를 호출',
  /'complex_name', 'complex_address'/.test(hub) && /ComplexEnsure::ensure\(/.test(hub),
);
ok(
  '검색 경로: regions complex-by-name 은 SELECT 이고 SearchService 는 ComplexEnsure 를 부르지 않음',
  /action === 'complex-by-name'/.test(read('public/api/auth/regions.php')) &&
    /SELECT id FROM complexes WHERE region_id = \? AND name = \? AND is_active = 1 LIMIT 1/.test(read('public/api/auth/regions.php')) &&
    !/ComplexEnsure::ensure/.test(read('src/Search/SearchService.php')) &&
    !/INSERT INTO complexes/.test(read('public/api/auth/regions.php')),
);
ok(
  '서버: 과외 분기에서는 단지 이름을 단지로 만들지 않음',
  /if \(\$branch !== 'study_room'\) \{\s*return;\s*\}/.test(hub),
);
ok('공용 컴포넌트: 학생 희망지역 함수가 그대로 있다', /export function renderStudentHopeRegion/.test(form) && /export function bindStudentHopeRegion/.test(form) && /export function readStudentHopeRegion/.test(form));

const filled = renderStudentHopeRegion({
  region_id: '9101',
  region_basis: 'complex',
  region_label: '의정부시 신곡동',
  complex_name: '한신아파트',
});
const empty = renderStudentHopeRegion({});
ok('렌더: 저장된 단지 이름이 입력값', /value="한신아파트"/.test(filled) && /value="의정부시 신곡동"/.test(filled));
ok('렌더: 주소 검색 버튼', /data-address-search=/.test(filled) && /data-address-search=/.test(empty));
ok('렌더: 샘플 단지 선택지 없음', !/은마|대치래미안|<select/.test(filled) && !/은마|대치래미안|<select/.test(empty));
ok('렌더: 빈 칸은 값을 지어내지 않음', !/value="9101"/.test(empty) && !/value="한신아파트"/.test(empty));

console.log('##### 3부 기본정보 칸 색 (스타일시트 계산) #####');
const GRAY = 'rgb(243, 244, 246)';
const WHITE = 'rgb(255, 255, 255)';
const RED = 'rgb(220, 38, 38)';
const fillModule = await import('../preview/shared/input-fill.js');
ok(
  '칸 색: 공용 모듈이 bind·paint·refresh 를 내보낸다',
  fillModule.INPUT_FILL_ATTR === 'data-input-fill' &&
    ['bindInputFill', 'paintInputFill', 'refreshInputFill', 'isInputFillControl'].every((key) => typeof fillModule[key] === 'function'),
);

/** 선택자 엔진. shared/input-fill.css 와 기존 배경 규칙을 특이도로 겨룬다. */
function splitTopComma(source) {
  const parts = [];
  let buf = '';
  let depth = 0;
  for (const ch of source) {
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      if (buf.trim()) parts.push(buf.trim());
      buf = '';
    } else buf += ch;
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

function splitDescendant(selector) {
  const parts = [];
  let buf = '';
  let depth = 0;
  for (const ch of selector.trim()) {
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    if (ch === ' ' && depth === 0) {
      if (buf) parts.push(buf);
      buf = '';
    } else buf += ch;
  }
  if (buf) parts.push(buf);
  return parts;
}

function takeParen(source, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    if (source[i] === '(') depth += 1;
    else if (source[i] === ')') {
      depth -= 1;
      if (depth === 0) return { inner: source.slice(openIndex + 1, i), end: i + 1 };
    }
  }
  throw new Error(`괄호가 안 닫힘: ${source}`);
}

function matchCompound(node, compound, focused) {
  let i = 0;
  const source = compound;
  while (i < source.length) {
    if (source[i] === ':') {
      if (source.startsWith(':is(', i)) {
        const taken = takeParen(source, i + 3);
        if (!splitTopComma(taken.inner).some((alt) => matchCompound(node, alt.trim(), focused))) return false;
        i = taken.end;
      } else if (source.startsWith(':not(', i)) {
        const taken = takeParen(source, i + 4);
        if (matchCompound(node, taken.inner.trim(), focused)) return false;
        i = taken.end;
      } else if (source.startsWith(':focus', i)) {
        if (node !== focused) return false;
        i += 6;
      } else if (source.startsWith(':disabled', i)) {
        if (!node.disabled) return false;
        i += 9;
      } else {
        throw new Error(`지원하지 않는 가상 선택자: ${source.slice(i)}`);
      }
    } else if (source[i] === '[') {
      const end = source.indexOf(']', i);
      const body = source.slice(i + 1, end);
      const matched = body.match(/^([^\s=~|^$*]+)(?:([~|^$*]?=)(['"]?)(.*)\3)?$/);
      if (!matched) throw new Error(`속성 선택자 해석 실패: ${body}`);
      const [, name, op, , value] = matched;
      const actual = node.getAttribute(name);
      if (actual == null) return false;
      if (op === '=' && actual !== value) return false;
      if (op && op !== '=') throw new Error(`지원하지 않는 속성 연산: ${op}`);
      i = end + 1;
    } else if (source[i] === '.') {
      const name = source.slice(i + 1).match(/^[\w-]+/);
      if (!name || !node.className.split(/\s+/).includes(name[0])) return false;
      i += 1 + name[0].length;
    } else if (source[i] === '#') {
      const name = source.slice(i + 1).match(/^[\w-]+/);
      if (!name || node.id !== name[0]) return false;
      i += 1 + name[0].length;
    } else if (/[a-z]/i.test(source[i])) {
      const name = source.slice(i).match(/^[a-zA-Z]+/);
      if (node.tagName !== name[0].toUpperCase()) return false;
      i += name[0].length;
    } else {
      throw new Error(`지원하지 않는 선택자: ${source.slice(i)}`);
    }
  }
  return true;
}

function matchesSelector(node, selector, focused) {
  const compounds = splitDescendant(selector);
  if (!matchCompound(node, compounds[compounds.length - 1], focused)) return false;
  let cursor = node.parent;
  for (let i = compounds.length - 2; i >= 0; i -= 1) {
    let found = false;
    while (cursor) {
      if (matchCompound(cursor, compounds[i], focused)) {
        found = true;
        cursor = cursor.parent;
        break;
      }
      cursor = cursor.parent;
    }
    if (!found) return false;
  }
  return true;
}

function specCompound(compound) {
  let b = 0;
  let c = 0;
  let i = 0;
  while (i < compound.length) {
    if (compound.startsWith(':is(', i) || compound.startsWith(':not(', i)) {
      const open = compound.indexOf('(', i);
      const taken = takeParen(compound, open);
      const best = splitTopComma(taken.inner).reduce((acc, alt) => {
        const next = specCompound(alt.trim());
        return next[0] > acc[0] || (next[0] === acc[0] && next[1] > acc[1]) ? next : acc;
      }, [0, 0]);
      b += best[0];
      c += best[1];
      i = taken.end;
    } else if (compound.startsWith(':focus', i) || compound.startsWith(':disabled', i)) {
      b += 1;
      i += compound.startsWith(':focus', i) ? 6 : 9;
    } else if (compound[i] === '[') {
      b += 1;
      i = compound.indexOf(']', i) + 1;
    } else if (compound[i] === '.' || compound[i] === '#') {
      b += 1;
      i += 1 + compound.slice(i + 1).match(/^[\w-]+/)[0].length;
    } else if (/[a-z]/i.test(compound[i])) {
      c += 1;
      i += compound.slice(i).match(/^[a-zA-Z]+/)[0].length;
    } else {
      throw new Error(`특이도 계산 실패: ${compound.slice(i)}`);
    }
  }
  return [b, c];
}

function specOf(selector) {
  return splitDescendant(selector).reduce((acc, compound) => {
    const part = specCompound(compound);
    return [acc[0] + part[0], acc[1] + part[1]];
  }, [0, 0]);
}

function cmpSpec(left, right) {
  return left[0] - right[0] || left[1] - right[1];
}

function parseCss(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];
  const re = /([^{]+)\{([^}]+)\}/g;
  let matched;
  while ((matched = re.exec(clean))) {
    const decls = {};
    for (const part of matched[2].split(';')) {
      const colon = part.indexOf(':');
      if (colon < 0) continue;
      decls[part.slice(0, colon).trim()] = part.slice(colon + 1).trim();
    }
    for (const selector of splitTopComma(matched[1])) rules.push({ selector, decls });
  }
  return rules;
}

function toRgb(color) {
  const hex = color.trim().toLowerCase();
  const body = hex.startsWith('#') ? hex.slice(1) : '';
  const full = body.length === 3 ? body.split('').map((ch) => ch + ch).join('') : body;
  if (!/^[0-9a-f]{6}$/.test(full)) throw new Error(`색 해석 실패: ${color}`);
  const num = Number.parseInt(full, 16);
  return `rgb(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255})`;
}

function backgroundColor(node, rules, focused) {
  const chain = [];
  let cursor = node;
  while (cursor) {
    chain.push(cursor);
    cursor = cursor.parent;
  }
  chain.reverse();
  const props = {};
  for (const current of chain) {
    for (const rule of rules) {
      if (!matchesSelector(current, rule.selector, focused)) continue;
      for (const [key, value] of Object.entries(rule.decls)) {
        if (key.startsWith('--')) props[key] = value;
      }
    }
  }
  let best = null;
  rules.forEach((rule, order) => {
    const raw = rule.decls['background-color'] || rule.decls.background;
    if (!raw) return;
    if (!matchesSelector(node, rule.selector, focused)) return;
    const spec = specOf(rule.selector);
    if (!best || cmpSpec(spec, best.spec) > 0 || (cmpSpec(spec, best.spec) === 0 && order >= best.order)) {
      best = { spec, order, value: raw };
    }
  });
  if (!best) return 'rgba(0, 0, 0, 0)';
  const resolved = best.value.replace(/var\((--[\w-]+)\)/g, (_, name) => {
    if (!props[name]) throw new Error(`변수 없음: ${name}`);
    return props[name];
  });
  return toRgb(resolved);
}

class FillNode {
  constructor(tag, opts = {}) {
    this.tagName = tag.toUpperCase();
    this.id = opts.id || '';
    this.className = opts.className || '';
    this.type = opts.type || (tag === 'input' ? 'text' : '');
    this.disabled = !!opts.disabled;
    this.value = opts.value ?? '';
    this.attrs = { ...(opts.attrs || {}) };
    if (this.id) this.attrs.id = this.id;
    this.borderTopColor = opts.borderTopColor || '';
    this.children = [];
    this.parent = null;
    this.listeners = {};
  }

  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
  }

  setAttribute(name, value) {
    this.attrs[name] = String(value);
  }

  removeAttribute(name) {
    delete this.attrs[name];
  }

  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attrs, name);
  }

  append(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  addEventListener(type, fn) {
    (this.listeners[type] ||= []).push(fn);
  }

  dispatchEvent(event) {
    const chain = [];
    let cursor = this;
    while (cursor) {
      chain.push(cursor);
      cursor = cursor.parent;
    }
    for (const current of chain) {
      for (const fn of current.listeners[event.type] || []) fn(event);
    }
  }

  querySelectorAll(selector) {
    const sels = splitTopComma(selector);
    const out = [];
    const walk = (node) => {
      for (const child of node.children) {
        if (sels.some((sel) => matchesSelector(child, sel, null))) out.push(child);
        walk(child);
      }
    };
    walk(this);
    return out;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  closest(selector) {
    for (let cursor = this; cursor; cursor = cursor.parent) {
      if (matchesSelector(cursor, selector, null)) return cursor;
    }
    return null;
  }

  set innerHTML(html) {
    this.children = [];
    const re = /<(input|select|textarea)\b([^>]*)>/gi;
    let matched;
    while ((matched = re.exec(html))) {
      const attrs = {};
      const attrRe = /([\w:-]+)(?:\s*=\s*"([^"]*)")?/g;
      let attr;
      while ((attr = attrRe.exec(matched[2]))) attrs[attr[1]] = attr[2] ?? '';
      this.append(new FillNode(matched[1], {
        id: attrs.id || '',
        className: attrs.class || '',
        type: attrs.type || '',
        disabled: Object.prototype.hasOwnProperty.call(attrs, 'disabled'),
        value: attrs.value || '',
        attrs,
      }));
    }
  }
}

const memberCss = read('preview/home-ui/src/styles/home-member-flows.css');
const stageCss = read('preview/home-ui/src/styles/student-mypage-stage5b.css');
const p19InputRule = memberCss.slice(memberCss.indexOf('.p19-input {'), memberCss.indexOf('}', memberCss.indexOf('.p19-input {')) + 1);
const surfaceRule = stageCss.slice(stageCss.indexOf('.home-app--role-parent .mypage-layout {'), stageCss.indexOf('}', stageCss.indexOf('.home-app--role-parent .mypage-layout {')) + 1);
const parentFieldRule = stageCss.slice(stageCss.indexOf('.home-app--role-parent .mp-room .p19-input,'), stageCss.indexOf('}', stageCss.indexOf('.home-app--role-parent .mp-room .p19-input,')) + 1);
const colorRules = parseCss(`
  input, select, textarea { background-color: #fff; }
  ${p19InputRule}
  ${surfaceRule}
  ${parentFieldRule}
  ${fillCss}
`);
ok(
  '칸 색: 채움 규칙 특이도가 부모 마이페이지 배경보다 높다',
  cmpSpec(
    specOf("[data-input-fill] :is(input, select, textarea)[data-fill='filled']:not(:disabled):not(:focus)"),
    specOf('.home-app--role-parent .mp-room .p19-input'),
  ) > 0,
);

try {
  const { bindInputFill, refreshInputFill } = fillModule;
  const doc = new FillNode('div');
  const app = doc.append(new FillNode('div', { className: 'home-app home-app--role-parent' }));
  const layout = app.append(new FillNode('div', { className: 'mypage-layout' }));
  const room = layout.append(new FillNode('div', { className: 'mp-room' }));
  const basic = room.append(new FillNode('form', { id: 'basic', attrs: { 'data-p19-form': 'basic' } }));
  const field = (tag, opts) => basic.append(new FillNode(tag, opts));
  field('input', { id: 'name', className: 'p19-input', attrs: { name: 'public_display_name' }, value: '맑은하늘' });
  field('input', { id: 'request', className: 'p19-input', attrs: { name: 'request_summary' }, value: '' });
  field('input', { id: 'fee', className: 'p19-input', type: 'number', attrs: { name: 'preferred_fee_amount' }, value: '550' });
  field('input', { id: 'fee-empty', className: 'p19-input', type: 'number', attrs: { name: 'preferred_studyroom_fee_amount' }, value: '' });
  field('select', { id: 'school', className: 'p19-input p19-select', attrs: { name: 'school_level' }, value: 'middle' });
  field('select', { id: 'subject', className: 'p19-input p19-select', attrs: { name: 'subject_label' }, value: '' });
  field('select', { id: 'grade', className: 'p19-input p19-select', attrs: { name: 'grade_level' }, value: '중2', disabled: true });
  const lesson = field('select', { id: 'lesson', attrs: { name: 'preferred_lesson_type' }, value: 'tutor' });
  const region = basic.append(new FillNode('div', { attrs: { 'data-p19-tutor-region-slot': '' } }));
  const sido = region.append(new FillNode('select', { id: 'sido', className: 'p19-input p19-select', attrs: { 'data-field': 'region_sido' }, value: '경기도' }));
  const city = region.append(new FillNode('select', { id: 'city', className: 'p19-input p19-select', attrs: { 'data-field': 'region_city' }, value: '' }));
  region.append(new FillNode('input', { id: 'hid', type: 'hidden', attrs: { name: 'preferred_tutor_region_id' }, value: '117' }));
  const hope = basic.append(new FillNode('div', { attrs: { 'data-p19-hope-region-slot': '' } }));
  hope.innerHTML = filled;
  field('textarea', { id: 'note', className: 'p19-input', attrs: { name: 'note_filled' }, value: '더 알릴 내용' });
  field('textarea', { id: 'note-empty', className: 'p19-input', attrs: { name: 'note_empty' }, value: '' });
  field('input', { id: 'err', className: 'p19-input', attrs: { name: 'err_field' }, value: '오류칸', borderTopColor: RED });
  field('input', { id: 'memo', type: 'radio', attrs: { name: 'slot_basis_x' }, value: 'dong' });
  field('input', { id: 'box', type: 'checkbox', attrs: { name: 'lesson_places' }, value: 'student_home' });
  const saved = room.append(new FillNode('form', { id: 'saved', attrs: { 'data-p19-form': 'basic' } }));
  saved.append(new FillNode('input', { id: 'saved-name', className: 'p19-input', value: '맑은하늘' }));
  saved.append(new FillNode('input', { id: 'saved-empty', className: 'p19-input', value: '' }));
  const detail = room.append(new FillNode('form', { id: 'detail', attrs: { 'data-p19-form': 'detail' } }));
  detail.append(new FillNode('input', { id: 'detail-school', className: 'p19-input', value: '신곡중' }));
  const other = doc.append(new FillNode('form', { id: 'other', className: 'search-filter' }));
  other.append(new FillNode('input', { id: 'out', attrs: { 'data-fill': 'filled' }, value: '다른화면' }));

  let focused = null;
  for (const node of doc.querySelectorAll('input, select, textarea')) {
    node.focus = () => { focused = node; };
    node.blur = () => { if (focused === node) focused = null; };
  }
  lesson.addEventListener('change', () => {
    hope.innerHTML = lesson.value === 'study_room' ? empty : filled;
    sido.value = lesson.value === 'study_room' ? '' : '경기도';
  });
  sido.addEventListener('change', () => { city.value = ''; });
  bindInputFill(basic);

  const snap = (sel) => {
    const node = doc.querySelector(sel);
    return {
      bg: backgroundColor(node, colorRules, focused),
      fill: node.getAttribute('data-fill'),
      border: node.borderTopColor,
    };
  };
  const initial = {
    name: snap('#name'),
    request: snap('#request'),
    fee: snap('#fee'),
    feeEmpty: snap('#fee-empty'),
    school: snap('#school'),
    subject: snap('#subject'),
    grade: snap('#grade'),
    display: snap('[data-p19-hope-region-slot] [data-field="address_display"]'),
    zip: snap('[data-p19-hope-region-slot] [data-field="address_zip"]'),
    note: snap('#note'),
    noteEmpty: snap('#note-empty'),
    err: snap('#err'),
    out: snap('#out'),
  };
  const skipped = ['#memo', '#box', '#hid'].map((sel) => doc.querySelector(sel).hasAttribute('data-fill'));
  const name = doc.querySelector('#name');
  name.focus();
  const nameFocus = snap('#name');
  name.blur();
  const nameBlur = snap('#name');
  const request = doc.querySelector('#request');
  request.focus();
  request.value = '주 2회';
  request.dispatchEvent({ type: 'input', target: request, bubbles: true });
  const typing = snap('#request');
  request.blur();
  const typed = snap('#request');
  request.value = '';
  request.dispatchEvent({ type: 'input', target: request, bubbles: true });
  const cleared = snap('#request');
  request.value = '   ';
  request.dispatchEvent({ type: 'input', target: request, bubbles: true });
  request.blur();
  const spaces = snap('#request');
  const subject = doc.querySelector('#subject');
  subject.value = '수학';
  subject.dispatchEvent({ type: 'change', target: subject, bubbles: true });
  const subjectPicked = snap('#subject');
  city.value = '의정부시';
  refreshInputFill(city);
  const cityFilled = snap('#city');
  sido.dispatchEvent({ type: 'change', target: sido, bubbles: true });
  const cityCleared = snap('#city');
  const dong = () => doc.querySelector('[data-p19-hope-region-slot] [data-field="dong_query"]');
  dong().value = '';
  refreshInputFill(hope);
  const hopeCleared = snap('[data-p19-hope-region-slot] [data-field="dong_query"]');
  dong().value = '신곡동';
  refreshInputFill(hope);
  const hopeApplied = snap('[data-p19-hope-region-slot] [data-field="dong_query"]');
  lesson.value = 'study_room';
  lesson.dispatchEvent({ type: 'change', target: lesson, bubbles: true });
  const afterBranch = snap('[data-p19-hope-region-slot] [data-field="dong_query"]');
  const sidoAfter = snap('#sido');
  lesson.value = 'tutor';
  lesson.dispatchEvent({ type: 'change', target: lesson, bubbles: true });
  const restored = snap('[data-p19-hope-region-slot] [data-field="dong_query"]');
  bindInputFill(saved);
  bindInputFill(detail);
  const result = {
    ...initial,
    skipped,
    nameFocus,
    nameBlur,
    typing,
    typed,
    cleared,
    spaces,
    subjectPicked,
    cityFilled,
    cityCleared,
    hopeCleared,
    hopeApplied,
    afterBranch,
    sidoAfter,
    restored,
    savedName: snap('#saved-name'),
    savedEmpty: snap('#saved-empty'),
    detailSchool: snap('#detail-school'),
    out: snap('#out'),
  };

  const isGray = (row) => row.bg === GRAY && row.fill === 'filled';
  const isWhite = (row) => row.bg === WHITE && row.fill === 'empty';
  ok('색: 표시명 값 있음 → 회색', isGray(result.name));
  ok('색: 빈 텍스트 → 흰색', isWhite(result.request));
  ok('색: 예산 숫자 있음 → 회색', isGray(result.fee));
  ok('색: 예산 숫자 없음 → 흰색', isWhite(result.feeEmpty));
  ok('색: 학교급 선택됨 → 회색', isGray(result.school));
  ok('색: 희망과목 빈 선택 → 흰색', isWhite(result.subject));
  ok('색: 희망지역 단지명 있음 → 회색', isGray(result.display));
  ok('색: 희망지역 우편번호 없음 → 흰색', isWhite(result.zip));
  ok('색: textarea 값 있음 → 회색', isGray(result.note));
  ok('색: textarea 없음 → 흰색', isWhite(result.noteEmpty));
  ok('색: 포커스 중 채워진 칸 → 흰색', result.nameFocus.fill === 'filled' && result.nameFocus.bg === WHITE);
  ok('색: 포커스 해제 → 다시 회색', isGray(result.nameBlur));
  ok('색: 입력 중(포커스)은 값이 있어도 흰색', result.typing.fill === 'filled' && result.typing.bg === WHITE);
  ok('색: 입력 후 포커스 해제 → 회색', isGray(result.typed));
  ok('색: 값을 지우면 흰색', isWhite(result.cleared));
  ok('색: 공백만 있으면 빈칸(흰색)', isWhite(result.spaces));
  ok('색: 선택을 바꾸면 회색', isGray(result.subjectPicked));
  ok('색: 하위 지역을 고르면 회색', isGray(result.cityFilled));
  ok('색: 시·도 변경으로 비워진 하위 칸 → 흰색', isWhite(result.cityCleared));
  ok('색: 주소값을 비우면 흰색', isWhite(result.hopeCleared));
  ok('색: 주소검색 적용(값 대입 후 paint) → 회색', isGray(result.hopeApplied));
  ok('색: 분기 변경으로 갈아 끼운 빈 희망지역 → 흰색', isWhite(result.afterBranch) && isWhite(result.sidoAfter));
  ok('색: 저장 분기로 돌아오면 채워진 희망지역 → 회색', isGray(result.restored));
  ok('색: 다시 그린 폼은 값 있으면 회색, 없으면 흰색', isGray(result.savedName) && isWhite(result.savedEmpty));
  ok('색: 라디오·체크·숨김은 data-fill 없음', result.skipped.every((has) => has === false));
  ok('색: disabled 학년은 값이 있어도 회색으로 덮지 않음', result.grade.fill === 'filled' && result.grade.bg === WHITE);
  ok('색: 오류 테두리는 유지', result.err.border === RED && isGray(result.err));
  ok('색: 적용 폼(상세정보)은 채우면 회색', isGray(result.detailSchool));
  ok(
    '색: 제외 폼은 채워져도 회색 아님',
    result.out.fill === 'filled' && result.out.bg !== GRAY && !doc.querySelector('#other').hasAttribute('data-input-fill'),
  );
} catch (err) {
  ok('칸 색', false, err instanceof Error ? err.stack?.split('\n').slice(0, 4).join(' | ') : String(err));
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
