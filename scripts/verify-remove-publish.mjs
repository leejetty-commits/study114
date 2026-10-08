/**
 * 회원 「공개」 제거 · 기본등록 완료 = 카드 노출 (2026-10-09 remove-publish-code)
 * 실행: npm run verify:remove-publish
 *
 * (1) 서버(가짜 PDO): 기본등록 완료면 published, 미완료면 draft, 관리자 숨김(hidden)은 그대로.
 *     회원 허브에 publish 동작 없음. 회원 저장은 profile_status 를 쓰지 않음.
 * (2) 정적: 과외쌤 검색 = 필수 8개 게이트 · 등록 화면에 공개 상태 선택칸 없음 · 공개 문구 없음.
 * (3) 화면 판정(vite-node): 과외쌤 노출 판정 = 기본정보 8개만(사진·수업장소·상세 완료 무관).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

let passed = 0;
let failed = 0;
function ok(name, cond, detail = '') {
  if (cond) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function phpBin() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  if (existsSync('D:\\php8.2\\php.exe')) return 'D:\\php8.2\\php.exe';
  return 'php';
}

const PHP_CODE = String.raw`<?php
declare(strict_types=1);
require_once getcwd() . '/src/bootstrap.php';

use Study114\Registration\StudentHubService;
use Study114\Registration\StudyRoomHubService;
use Study114\Registration\TutorHubService;
use Study114\StudyRoom\StudyRoomBasicExposure;
use Study114\Tutor\TutorBasicFields;

final class RpStmt extends PDOStatement
{
    private array $rows = [];
    private mixed $column = false;
    public function __construct(private RpPdo $pdo, private string $sql) {}
    public function execute(?array $params = null): bool
    {
        $sql = preg_replace('/\s+/', ' ', trim($this->sql));
        $a = $this->pdo->answer($sql, array_values($params ?? []));
        $this->rows = $a['rows'] ?? [];
        $this->column = array_key_exists('column', $a) ? $a['column'] : false;
        return true;
    }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $o = PDO::FETCH_ORI_NEXT, int $off = 0): mixed { return array_shift($this->rows) ?? false; }
    public function fetchColumn(int $column = 0): mixed { return $this->column; }
}

final class RpPdo extends PDO
{
    /** @var array<string, mixed>|null */
    public ?array $tutor = null;
    public string $level = '';
    public int $tutorRegion = 0;
    public bool $roomSlot1 = false;
    /** @var list<array{sql: string, params: list<mixed>}> */
    public array $updates = [];
    public function __construct() {}
    #[\ReturnTypeWillChange] public function prepare(string $q, array $o = []): RpStmt { return new RpStmt($this, $q); }
    public function answer(string $sql, array $p): array
    {
        if (str_starts_with($sql, 'UPDATE ')) {
            $this->updates[] = ['sql' => $sql, 'params' => $p];
            return [];
        }
        if (str_contains($sql, 'SELECT * FROM tutors WHERE id = ?')) {
            return ['rows' => $this->tutor === null ? [] : [$this->tutor]];
        }
        if (str_contains($sql, 'SELECT school_level FROM tutor_subject_targets')) {
            return ['column' => $this->level !== '' ? $this->level : false];
        }
        if (str_contains($sql, 'SELECT region_id FROM tutor_regions')) {
            return ['column' => $this->tutorRegion > 0 ? $this->tutorRegion : false];
        }
        if (str_contains($sql, 'FROM regions WHERE id = ?')) {
            return ['rows' => [[
                'id' => 11, 'sido_code' => '11', 'sido_name' => '서울특별시', 'sigungu_code' => '',
                'sigungu_name' => '', 'official_code' => '1100000000', 'unit_level' => 'sido', 'is_active' => 1,
            ]]];
        }
        if (str_contains($sql, 'FROM study_room_regions')) {
            return ['column' => $this->roomSlot1 ? 1 : false];
        }
        return ['rows' => [], 'column' => false];
    }
}

function ok(string $name, bool $cond, string $detail = ''): void
{
    echo ($cond ? 'PASS  ' : 'FAIL  ') . $name . ($cond || $detail === '' ? '' : ' — ' . $detail) . "\n";
}

function lastUpdate(RpPdo $pdo): array
{
    return $pdo->updates[count($pdo->updates) - 1] ?? ['sql' => '', 'params' => []];
}

$full = [
    'tutor_display_name' => '김쌤', 'main_subject_note' => '수학', 'preferred_fee_amount' => 300000,
    'lessons_per_week' => 2, 'minutes_per_lesson' => 90, 'slogan' => '기초부터',
];

$pdo = new RpPdo();
$pdo->tutor = $full;
$pdo->level = 'middle';
$pdo->tutorRegion = 11;
TutorBasicFields::syncProfileStatus($pdo, 5);
$u = lastUpdate($pdo);
ok('(1) 과외쌤 필수 8개 완료 → published', ($u['params'][0] ?? '') === 'published', json_encode($u['params']));
ok('(1) 과외쌤 동기화 SQL 은 관리자 숨김(hidden) 행을 건드리지 않음', str_contains($u['sql'], "profile_status <> 'hidden'"), $u['sql']);
ok('(1) 과외쌤 published 때 published_at 채움(COALESCE)', str_contains($u['sql'], 'COALESCE(published_at, NOW())'), $u['sql']);

$pdo = new RpPdo();
$pdo->tutor = array_merge($full, ['slogan' => '']);
$pdo->level = 'middle';
$pdo->tutorRegion = 11;
TutorBasicFields::syncProfileStatus($pdo, 5);
ok('(1) 과외쌤 슬로건 비면 draft', (lastUpdate($pdo)['params'][0] ?? '') === 'draft');

$pdo = new RpPdo();
$pdo->tutor = $full;
$pdo->level = 'middle';
$pdo->tutorRegion = 0;
TutorBasicFields::syncProfileStatus($pdo, 5);
ok('(1) 과외쌤 과외지역 1 없으면 draft', (lastUpdate($pdo)['params'][0] ?? '') === 'draft');

$pdo = new RpPdo();
$pdo->roomSlot1 = true;
StudyRoomBasicExposure::syncProfileStatus($pdo, 8);
$u = lastUpdate($pdo);
ok('(1) 공부방 홍보지역 1 있음 → published', ($u['params'][0] ?? '') === 'published', json_encode($u['params']));
ok('(1) 공부방 동기화 SQL 은 관리자 숨김(hidden) 행을 건드리지 않음', str_contains($u['sql'], "profile_status <> 'hidden'"), $u['sql']);

$pdo = new RpPdo();
$pdo->roomSlot1 = false;
StudyRoomBasicExposure::syncProfileStatus($pdo, 8);
ok('(1) 공부방 홍보지역 1 없음 → draft', (lastUpdate($pdo)['params'][0] ?? '') === 'draft');

foreach ([TutorHubService::class, StudyRoomHubService::class, StudentHubService::class] as $cls) {
    ok('(1) ' . substr($cls, strrpos($cls, '\\') + 1) . ' 회원 publish 메서드 없음', !(new ReflectionClass($cls))->hasMethod('publish'));
}
`;

console.log('##### (1) 서버 (가짜 PDO) #####');
const php = spawnSync(phpBin(), [], { cwd: ROOT, input: PHP_CODE, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
for (const line of `${php.stdout || ''}`.split(/\r?\n/)) {
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
  console.log('FAIL  PHP 검사 프로세스');
  if (php.stderr) console.log(String(php.stderr).slice(0, 3000));
}

console.log('\n##### (2) 정적 #####');
{
  const search = read('src/Search/SearchService.php');
  const tutorsAt = search.indexOf('function searchTutors(');
  const tutorsBody = search.slice(tutorsAt, search.indexOf('$total = (int) $stmt->fetchColumn();', tutorsAt));
  ok('(2) 과외쌤 검색 WHERE 에 기본등록 완료 조건', tutorsBody.includes("TutorBasicFields::completeSql('t')"));

  const basic = read('src/Tutor/TutorBasicFields.php');
  const sqlAt = basic.indexOf('public static function completeSql(');
  const sqlBody = basic.slice(sqlAt, basic.indexOf('\n    }\n', sqlAt));
  for (const col of ['tutor_display_name', 'main_subject_note', 'preferred_fee_amount', 'lessons_per_week', 'minutes_per_lesson', 'slogan', 'school_level']) {
    ok(`(2) completeSql 이 ${col} 을 본다`, sqlBody.includes(col));
  }
  ok('(2) completeSql 학교급 목록 = SCHOOL_LEVELS', sqlBody.includes('self::SCHOOL_LEVELS'));

  const tutorReg = read('src/Tutor/TutorRegisterService.php');
  const roomReg = read('src/StudyRoom/StudyRoomRegisterService.php');
  const signup = read('src/Auth/BasicRegisterService.php');
  ok('(2) 과외쌤 단계 저장 뒤 노출 상태 동기화', tutorReg.includes('TutorBasicFields::syncProfileStatus($pdo, $tutorId);'));
  ok('(2) 공부방 단계 저장 뒤 노출 상태 동기화', roomReg.includes('StudyRoomBasicExposure::syncProfileStatus($pdo, $roomId);'));
  ok('(2) 가입 기본등록(과외쌤) 저장 뒤 동기화 2곳', (signup.match(/TutorBasicFields::syncProfileStatus\(/g) || []).length === 2);
  ok('(2) 가입 기본등록(공부방) 저장 뒤 동기화 2곳', (signup.match(/StudyRoomBasicExposure::syncProfileStatus\(/g) || []).length === 2);
  ok('(2) 회원 저장이 입력 profile_status 를 읽지 않음',
    !tutorReg.includes("$input['profile_status']") && !roomReg.includes("$input['profile_status']") && !roomReg.includes("'profile_status', ['draft', 'pending', 'published']"));

  for (const rel of [
    'src/Registration/TutorHubService.php',
    'src/Registration/StudyRoomHubService.php',
    'src/Registration/StudentHubService.php',
  ]) {
    ok(`(2) ${rel} 에 'publish' 동작 없음`, !read(rel).includes("'publish'"));
  }

  for (const rel of [
    'preview/tutor-ui/src/screens/step-contact.js',
    'preview/tutor-ui/src/screens/step-detail.js',
    'preview/study-room-ui/src/layout.js',
    'preview/study-room-ui/src/screens/step-complete.js',
    'preview/study-room-ui/src/screens/step-facility.js',
  ]) {
    const src = read(rel);
    ok(`(2) ${rel} 공개 상태 선택칸 없음`, !src.includes('name="profile_status"') && !src.includes('save-publish'));
  }
  for (const rel of ['preview/tutor-ui/src/form-collect.js', 'preview/study-room-ui/src/form-collect.js']) {
    ok(`(2) ${rel} 저장값에 profile_status 없음`, !read(rel).includes('profile_status'));
  }

  for (const rel of [
    'preview/home-ui/src/tutor-reg/store.js',
    'preview/home-ui/src/study-room-reg/store.js',
    'preview/home-ui/src/student-reg/store.js',
  ]) {
    const src = read(rel);
    ok(`(2) ${rel} 회원 publish 함수·호출 없음`, !/export async function publish\w*\(/.test(src) && !/Action\(id, 'publish'/.test(src));
  }

  const memberUi = [
    'preview/home-ui/src/lifecycle-copy.js',
    'preview/home-ui/src/tutor-reg/tutor-reg-copy.js',
    'preview/home-ui/src/tutor-reg/format.js',
    'preview/home-ui/src/tutor-reg/registration-check-copy.js',
    'preview/home-ui/src/study-room-reg/study-room-reg-copy.js',
    'preview/home-ui/src/study-room-reg/screens.js',
    'preview/home-ui/src/mypage/preview-data.js',
    'preview/home-ui/src/empty-state-copy.js',
    'preview/home-ui/src/handoff-copy.js',
    'preview/study-room-ui/src/summary.js',
    'preview/study-room-ui/src/layout.js',
    'preview/tutor-ui/src/screens/step-contact.js',
    'preview/tutor-ui/src/screens/step-detail.js',
    'preview/auth-ui/src/screens/signup-basic.js',
    'preview/shared/guest-gate-ui.js',
  ];
  const banned = ['공개중', '공개 준비', '미공개', '공개 상태', '공개 가능', '공개하기', '미리보기·공개', '저장만 (아직 비공개)', '바로 공개되지', '연락·공개', '공개가 중지'];
  for (const rel of memberUi) {
    const src = read(rel);
    const hit = banned.filter((w) => src.includes(w));
    ok(`(2) ${rel} 카드 공개 문구 없음`, hit.length === 0, hit.join(', '));
  }
  const life = read('preview/home-ui/src/lifecycle-copy.js');
  ok('(2) 회원 배지 published = 노출중 · hidden = 관리자 숨김', (life.match(/published: '노출중'/g) || []).length === 2 && (life.match(/hidden: '관리자 숨김'/g) || []).length === 2);
}

console.log('\n##### (3) 화면 판정 #####');
{
  const store = await import(pathToFileURL(join(ROOT, 'preview/home-ui/src/tutor-reg/store.js')).href);
  const base = {
    id: 1,
    tutor_display_name: '김쌤',
    has_primary_region: true,
    primary_region_label: '서울특별시',
    school_level: 'middle',
    main_subject_note: '수학',
    preferred_fee_amount: 300000,
    lessons_per_week: 2,
    minutes_per_lesson: 90,
    slogan: '기초부터',
    has_lesson_places: false,
    has_profile_image: false,
    detail_completion_status: 'basic_only',
    intro_short: '',
    intro_long: '',
  };
  const r = store.getPublishReadiness(base);
  ok('(3) 과외쌤 필수 8개만 채우면 노출 판정(사진·수업장소·상세 없음)', r.canPublish === true && r.missing.length === 0, JSON.stringify(r.missing));
  ok('(3) 과외쌤 노출 판정 항목 수 = 8', r.totalCount === 8, String(r.totalCount));
  const r2 = store.getPublishReadiness({ ...base, slogan: '' });
  ok('(3) 슬로건 비면 노출 판정 아님', r2.canPublish === false && r2.missing.length === 1, JSON.stringify(r2.missing));
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
