/**
 * 과외 단위 게이트 (2026-10-09 · 정본 72 잠금)
 * 실행(저장소 루트): npx --yes vite-node scripts/verify-tutor-region-unit.mjs
 *
 * 1부 서버(실제 PHP · sqlite 메모리 DB):
 *   sql/schema/073_region_official_seed.sql 과 078_tutor_unit_gwangju.sql 을 그대로 실행해 regions 를 만든다.
 *   주소 예시표 → TutorRegionUnit::unitIdForRegion / labelForId.
 *   구·동·도 행 저장 거부(TutorRegionUnit::assertUnit · BasicRegisterService · SearchService 과외 필터).
 *   공부방 구 단위(selectableRegionId · dongIdsUnderGu · is_selectable 수)는 그대로.
 * 2부 프런트(tutor-unit-cascade.js): 같은 단위 목록으로 주소 → 단위 id, 1·2단계 선택.
 * 3부 정적: 저장 경로가 TutorRegionUnit 을 쓰고, 공부방 검색 searchRooms 본문이 origin/main 과 같다.
 * 4부 찾기 화면(2단계): 과외쌤 찾기 선택·검색(서울 시·도만 / 경기도만 불가 / 경기도 수원시 / 전남광주 광주),
 *   GPS → 과외 단위, 손님 라벨 서울특별시, 확대카드 「—」 아님, 공부방 찾기 결과 = origin/main 모듈과 같음.
 * 운영 DB·서버에 접속하지 않는다. 샘플·가짜 회원 데이터를 만들지 않는다.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

/** 주소 예시표. sido·sigungu 는 카카오 주소검색이 주는 글자 모양, code 는 073 공식 행. */
const ADDRESSES = [
  { key: 'gangnam', title: '서울 강남구', sido: '서울', sigungu: '강남구', code: '1168000000', want: '서울특별시' },
  { key: 'yeongtong', title: '수원시 영통구', sido: '경기', sigungu: '수원시 영통구', code: '4111700000', want: '경기도 수원시' },
  { key: 'gwangju_si', title: '경기도 광주시', sido: '경기', sigungu: '광주시', code: '4161000000', want: '경기도 광주시' },
  { key: 'gwangsan', title: '전남광주 광산구', sido: '전남광주', sigungu: '광산구', code: '1233000000', want: '전남광주통합특별시 광주' },
  { key: 'suncheon', title: '순천시', sido: '전남광주', sigungu: '순천시', code: '1215000000', want: '전남광주통합특별시 순천시' },
  { key: 'ganghwa', title: '인천 강화군', sido: '인천', sigungu: '강화군', code: '2871000000', want: '인천광역시' },
  { key: 'gijang', title: '부산 기장군', sido: '부산', sigungu: '기장군', code: '2671000000', want: '부산광역시' },
  { key: 'sejong', title: '세종', sido: '세종', sigungu: '', code: '3600000000', want: '세종특별자치시' },
  { key: 'goseong_gw', title: '강원 고성군', sido: '강원', sigungu: '고성군', code: '5182000000', want: '강원특별자치도 고성군' },
];

if (process.env.TRU_FIND_INPUT) {
  await runFindPart(JSON.parse(readFileSync(process.env.TRU_FIND_INPUT, 'utf8')));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

const PHP_CODE = String.raw`<?php
declare(strict_types=1);
require_once getcwd() . '/src/bootstrap.php';

use Study114\Auth\BasicRegisterService;
use Study114\Database\Connection;
use Study114\Region\RegionGuLink;
use Study114\Region\TutorRegionUnit;
use Study114\Search\SearchService;

$IN = json_decode(base64_decode('__INPUT_B64__'), true);
$out = ['errors' => []];

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
$pdo->sqliteCreateFunction('LEFT', static fn ($s, $n) => $s === null ? null : mb_substr((string) $s, 0, (int) $n), 2);
$pdo->sqliteCreateFunction('CHAR_LENGTH', static fn ($s) => $s === null ? null : mb_strlen((string) $s), 1);
$pdo->exec('CREATE TABLE regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sido_code TEXT NULL,
    sido_name TEXT NOT NULL,
    sigungu_code TEXT NULL,
    sigungu_name TEXT NOT NULL,
    dong_code TEXT NULL,
    dong_name TEXT NOT NULL DEFAULT "",
    unit_level TEXT NOT NULL DEFAULT "dong",
    official_code TEXT NULL UNIQUE,
    is_selectable INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1
)');

$sqlOf = static function (string $file, string $head): string {
    $text = (string) file_get_contents(getcwd() . '/' . $file);
    $at = strpos($text, $head);
    if ($at === false) { throw new RuntimeException($file . ' 에 ' . $head . ' 없음'); }
    $end = strpos($text, ';', $at);
    return substr($text, $at, $end - $at);
};
$seed = str_replace('INSERT IGNORE INTO regions', 'INSERT OR IGNORE INTO regions', $sqlOf('sql/schema/073_region_official_seed.sql', 'INSERT IGNORE INTO regions'));
$pdo->exec($seed);
$selectableBefore = (int) $pdo->query('SELECT COUNT(*) FROM regions WHERE is_selectable = 1')->fetchColumn();
$gwangjuSql = str_replace('FROM DUAL', '', $sqlOf('sql/schema/078_tutor_unit_gwangju.sql', 'INSERT INTO regions'));
$pdo->exec($gwangjuSql);
$pdo->exec($gwangjuSql);
$out['seed_rows'] = (int) $pdo->query("SELECT COUNT(*) FROM regions WHERE official_code IS NOT NULL")->fetchColumn();
$out['gwangju_rows'] = $pdo->query("SELECT id, sido_code, sido_name, sigungu_code, sigungu_name, unit_level, official_code, is_selectable, is_active FROM regions WHERE sido_code = '12' AND sigungu_code = '12200'")->fetchAll();
$out['selectable_before_078'] = $selectableBefore;
$out['selectable_after_078'] = (int) $pdo->query('SELECT COUNT(*) FROM regions WHERE is_selectable = 1')->fetchColumn();

// 카카오 주소검색 동 행(RegionEnsure::insertRow 모양: 시도 약칭 · unit_level 기본 dong · official_code NULL)
$ins = $pdo->prepare('INSERT INTO regions (sido_code, sido_name, sigungu_code, sigungu_name, dong_code, dong_name, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)');
$dongs = [
    'daechi' => ['11', '서울', '11680', '강남구', '1168010600', '대치동'],
    'maetan' => ['41', '경기', '41117', '수원시 영통구', '4111710300', '매탄동'],
    'songjeong' => ['12', '광주', '12330', '광산구', '1233010100', '송정동'],
    'ganghwa_eup' => ['28', '인천', '28710', '강화군', '2871025000', '강화읍'],
    'jochiwon' => ['36', '세종특별자치시', '36110', '세종특별자치시', '3611025000', '조치원읍'],
];
$dongIds = [];
foreach ($dongs as $k => $d) {
    $ins->execute($d);
    $dongIds[$k] = (int) $pdo->lastInsertId();
}

(new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);

$idOf = static function (string $code) use ($pdo): ?int {
    $s = $pdo->prepare('SELECT id FROM regions WHERE official_code = ?');
    $s->execute([$code]);
    $v = $s->fetchColumn();
    return $v === false ? null : (int) $v;
};

// 단위 목록
$units = TutorRegionUnit::listUnits($pdo);
$out['units'] = $units;

// 단위 목록 기대값을 seed 에서 따로 센다
$expect = 0;
foreach ($pdo->query('SELECT sido_code, sigungu_code, sigungu_name, unit_level, official_code FROM regions WHERE official_code IS NOT NULL')->fetchAll() as $r) {
    if (in_array($r['sido_code'], TutorRegionUnit::METRO_SIDO_CODES, true) && $r['unit_level'] === 'sido') { $expect++; continue; }
    if (in_array($r['sido_code'], TutorRegionUnit::PROVINCE_SIDO_CODES, true) && $r['unit_level'] === 'sigungu'
        && !preg_match('/\s/u', (string) $r['sigungu_name'])
        && !in_array((string) $r['sigungu_code'], TutorRegionUnit::GWANGJU_GU_CODES, true)) { $expect++; }
}
$out['expect_unit_count'] = $expect + 1;

// 주소 예시표: 공식 행 · 동 행 → 단위
$addr = [];
foreach ($IN['addresses'] as $a) {
    $rowId = $idOf($a['code']);
    $unitId = $rowId === null ? null : TutorRegionUnit::unitIdForRegion($pdo, $rowId);
    $addr[$a['key']] = [
        'row_id' => $rowId,
        'unit_id' => $unitId,
        'label' => $unitId === null ? null : TutorRegionUnit::labelForId($pdo, $unitId),
    ];
}
$out['addr'] = $addr;
$dongLift = [];
foreach ($dongIds as $k => $id) {
    $u = TutorRegionUnit::unitIdForRegion($pdo, $id);
    $dongLift[$k] = $u === null ? null : TutorRegionUnit::labelForId($pdo, $u);
}
$out['dong_lift'] = $dongLift;

// 일반구 39 · 광역시 구·군 · 옛 광주 5구가 모두 단위로 올라가는지
$lift = ['general_gu' => [], 'metro_gu' => [], 'gwangju_gu' => []];
foreach ($pdo->query("SELECT id, sido_code, sido_name, sigungu_code, sigungu_name FROM regions WHERE unit_level = 'sigungu' AND official_code IS NOT NULL")->fetchAll() as $r) {
    $label = TutorRegionUnit::labelForId($pdo, TutorRegionUnit::unitIdForRegion($pdo, (int) $r['id']));
    if (preg_match('/\s/u', (string) $r['sigungu_name'])) {
        $parent = preg_split('/\s+/u', (string) $r['sigungu_name'])[0];
        $lift['general_gu'][] = ['name' => $r['sigungu_name'], 'label' => $label, 'want' => $r['sido_name'] . ' ' . $parent];
    } elseif (in_array($r['sido_code'], TutorRegionUnit::METRO_SIDO_CODES, true) && $r['sido_code'] !== '36') {
        $lift['metro_gu'][] = ['name' => $r['sigungu_name'], 'label' => $label, 'want' => $r['sido_name']];
    } elseif (in_array((string) $r['sigungu_code'], TutorRegionUnit::GWANGJU_GU_CODES, true)) {
        $lift['gwangju_gu'][] = ['name' => $r['sigungu_name'], 'label' => $label];
    }
}
$out['lift'] = $lift;

// 저장 거부: 과외 단위가 아닌 행
$rejectIds = [
    '구(서울 강남구)' => $idOf('1168000000'),
    '일반구(수원시 영통구)' => $idOf('4111700000'),
    '옛 광주 구(광산구)' => $idOf('1233000000'),
    '광역시 군 행(인천 강화군)' => $idOf('2871000000'),
    '도 행(경기도)' => $idOf('4100000000'),
    '도 행(강원특별자치도)' => $idOf('5100000000'),
    '통합특별시 시도 행(전남광주)' => $idOf('1200000000'),
    '동 행(대치동)' => $dongIds['daechi'],
    '동 행(매탄동)' => $dongIds['maetan'],
    '없는 id' => 99999999,
];
$reject = [];
foreach ($rejectIds as $name => $id) {
    $msg = null;
    try { TutorRegionUnit::assertUnit($pdo, (int) $id); } catch (InvalidArgumentException $e) { $msg = $e->getMessage(); }
    $reject[$name] = ['id' => $id, 'message' => $msg, 'label' => TutorRegionUnit::labelForId($pdo, $id)];
}
$out['reject'] = $reject;

// 과외쌤 가입 저장(BasicRegisterService::normalizeTutorSignupRegions) — 실제 메서드
$basic = (new ReflectionClass(BasicRegisterService::class))->newInstanceWithoutConstructor();
$norm = new ReflectionMethod(BasicRegisterService::class, 'normalizeTutorSignupRegions');
$signup = [];
foreach ([
    'unit_ok' => [$addr['gangnam']['unit_id'], $addr['yeongtong']['unit_id'], $addr['gwangsan']['unit_id']],
    'gu' => [$idOf('1168000000')],
    'dong' => [$dongIds['daechi']],
    'province' => [$idOf('4100000000')],
    'slot2_gu' => [$addr['gangnam']['unit_id'], $idOf('4111700000')],
] as $k => $ids) {
    try {
        $signup[$k] = ['ok' => $norm->invoke($basic, ['saved_regions' => array_map(static fn ($id) => ['region_id' => (string) $id], $ids)])];
    } catch (InvalidArgumentException $e) {
        $signup[$k] = ['error' => $e->getMessage()];
    }
}
$out['signup'] = $signup;

// 검색: 과외쌤 tutor_region_id · 학생 과외 희망(preferred_lesson_type=tutor) 은 단위 id 만, 공부방은 구 그대로
$svc = new SearchService();
$call = static function (string $method, array $args) use ($svc) {
    try {
        return ['ok' => (new ReflectionMethod(SearchService::class, $method))->invokeArgs($svc, $args)];
    } catch (InvalidArgumentException $e) {
        return ['error' => $e->getMessage()];
    }
};
$seoul = $addr['gangnam']['unit_id'];
$gangnam = $idOf('1168000000');
$out['search'] = [
    'tutor_unit' => $call('tutorUnitRegionId', [$pdo, ['tutor_region_id' => $seoul], 'tutor_region_id']),
    'tutor_suwon' => $call('tutorUnitRegionId', [$pdo, ['tutor_region_id' => TutorRegionUnit::unitIdForRegion($pdo, (int) $idOf('4111700000'))], 'tutor_region_id']),
    'tutor_gwangju' => $call('tutorUnitRegionId', [$pdo, ['tutor_region_id' => $addr['gwangsan']['unit_id']], 'tutor_region_id']),
    'tutor_gu' => $call('tutorUnitRegionId', [$pdo, ['tutor_region_id' => $gangnam], 'tutor_region_id']),
    'tutor_dong' => $call('tutorUnitRegionId', [$pdo, ['tutor_region_id' => $dongIds['daechi']], 'tutor_region_id']),
    'tutor_province' => $call('tutorUnitRegionId', [$pdo, ['tutor_region_id' => $idOf('4100000000')], 'tutor_region_id']),
    'student_tutor_unit' => $call('studentRegionId', [$pdo, ['preferred_region_id' => $seoul], 'preferred_region_id', 'tutor']),
    'student_tutor_gu' => $call('studentRegionId', [$pdo, ['preferred_region_id' => $gangnam], 'preferred_region_id', 'tutor']),
    'room_gu' => $call('selectableRegionId', [$pdo, ['sigungu_region_id' => $gangnam], 'sigungu_region_id']),
    'room_unit_metro' => $call('selectableRegionId', [$pdo, ['sigungu_region_id' => $seoul], 'sigungu_region_id']),
    'room_gwangju_unit' => $call('selectableRegionId', [$pdo, ['sigungu_region_id' => $addr['gwangsan']['unit_id']], 'sigungu_region_id']),
    'student_room_gu' => $call('studentRegionId', [$pdo, ['preferred_region_id' => $gangnam], 'preferred_region_id', 'study_room']),
];
$out['room_dongs_under_gangnam'] = RegionGuLink::dongIdsUnderGu((int) $gangnam);
$out['daechi_id'] = $dongIds['daechi'];

echo 'JSON ' . json_encode($out, JSON_UNESCAPED_UNICODE) . "\n";
`;

function phpBin() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  if (existsSync('D:\\php8.2\\php.exe')) return 'D:\\php8.2\\php.exe';
  return 'php';
}

console.log('##### 1부 서버 (실제 PHP · sqlite · 073 + 078) #####');
const input = Buffer.from(JSON.stringify({ addresses: ADDRESSES }), 'utf8').toString('base64');
const php = spawnSync(phpBin(), ['-d', 'extension=pdo_sqlite', '-d', 'extension=mbstring'], {
  cwd: ROOT,
  input: PHP_CODE.replace('__INPUT_B64__', input),
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
});
const line = String(php.stdout || '').split(/\r?\n/).find((l) => l.startsWith('JSON '));
ok('PHP 실행', php.status === 0 && !!line, `${php.status} ${(php.stderr || '').slice(0, 600)} ${(php.stdout || '').slice(0, 600)}`);
const R = line ? JSON.parse(line.slice(5)) : {};

ok('073 공식 행 284 적재', R.seed_rows === 284, String(R.seed_rows));
ok('078 두 번 실행해도 광주 행 1개', Array.isArray(R.gwangju_rows) && R.gwangju_rows.length === 1, JSON.stringify(R.gwangju_rows));
{
  const g = R.gwangju_rows?.[0] || {};
  ok(
    '078 행 = 12 · 전남광주통합특별시 · 12200 · 광주 · sigungu · official_code NULL · is_selectable 0',
    g.sido_code === '12' && g.sido_name === '전남광주통합특별시' && g.sigungu_code === '12200' && g.sigungu_name === '광주'
      && g.unit_level === 'sigungu' && g.official_code === null && Number(g.is_selectable) === 0 && Number(g.is_active) === 1,
    JSON.stringify(g),
  );
}
ok('공부방 축 불변: 078 전후 is_selectable 행 수 같음(256)', R.selectable_before_078 === 256 && R.selectable_after_078 === 256, `${R.selectable_before_078}→${R.selectable_after_078}`);

const units = Array.isArray(R.units) ? R.units : [];
const labels = units.map((u) => u.label);
ok(`단위 목록 수 = seed 에서 센 값(${R.expect_unit_count})`, units.length === R.expect_unit_count, String(units.length));
ok('단위 목록 라벨 중복 없음', new Set(labels).size === labels.length);
ok('단위 목록에 구 단위 없음(라벨이 「구」로 끝나지 않음)', !labels.some((l) => /구$/.test(l)), labels.filter((l) => /구$/.test(l)).join(', '));
ok('단위 목록에 도 단독 행 없음', !labels.some((l) => /^(경기도|강원특별자치도|충청북도|충청남도|전북특별자치도|경상북도|경상남도|제주특별자치도|전남광주통합특별시)$/.test(l)));
ok('단위 목록에 일반구 이름 없음(공백 2개 이상 아님)', !labels.some((l) => l.split(' ').length > 2));
ok('세종은 한 번만: 「세종특별자치시」 1행 · 반복 없음', labels.filter((l) => l.includes('세종')).length === 1 && labels.includes('세종특별자치시'));
ok('광역시 7개 = 서울·부산·대구·인천·대전·울산·세종(시 전체 1행)', ['서울특별시', '부산광역시', '대구광역시', '인천광역시', '대전광역시', '울산광역시', '세종특별자치시'].every((l) => labels.includes(l)) && units.filter((u) => u.kind === 'metro').length === 7);
ok('전남광주 광주 1행(kind gwangju)', units.filter((u) => u.kind === 'gwangju').length === 1 && labels.includes('전남광주통합특별시 광주'));
ok('일반구가 있는 시는 시 전체 1행(수원·성남·안양·부천·안산·고양·용인·청주·천안·포항·창원·전주)', [
  '경기도 수원시', '경기도 성남시', '경기도 안양시', '경기도 부천시', '경기도 안산시', '경기도 고양시', '경기도 용인시',
  '충청북도 청주시', '충청남도 천안시', '경상북도 포항시', '경상남도 창원시', '전북특별자치도 전주시',
].every((l) => labels.includes(l)), labels.filter((l) => /수원|성남|안양|부천|안산|고양|용인|청주|천안|포항|창원|전주/.test(l)).join(', '));
ok('경기도 화성시 단위 있음', labels.includes('경기도 화성시'));
ok('같은 이름 고성군은 도별로 따로(강원·경남)', labels.includes('강원특별자치도 고성군') && labels.includes('경상남도 고성군'));

console.log('--- 주소 예시표 (서버) ---');
for (const a of ADDRESSES) {
  const r = R.addr?.[a.key] || {};
  ok(`주소 「${a.title}」 → 「${a.want}」`, r.label === a.want, JSON.stringify(r));
}
ok('세종 라벨에 「세종특별자치시」 한 번만', (R.addr?.sejong?.label || '').split('세종특별자치시').length === 2);
ok('동 행(대치동) → 서울특별시', R.dong_lift?.daechi === '서울특별시', String(R.dong_lift?.daechi));
ok('동 행(영통구 매탄동) → 경기도 수원시', R.dong_lift?.maetan === '경기도 수원시', String(R.dong_lift?.maetan));
ok('동 행(광주 광산구 송정동) → 전남광주통합특별시 광주', R.dong_lift?.songjeong === '전남광주통합특별시 광주', String(R.dong_lift?.songjeong));
ok('동 행(인천 강화읍) → 인천광역시', R.dong_lift?.ganghwa_eup === '인천광역시', String(R.dong_lift?.ganghwa_eup));
ok('동 행(세종 조치원읍) → 세종특별자치시', R.dong_lift?.jochiwon === '세종특별자치시', String(R.dong_lift?.jochiwon));
{
  const g = R.lift?.general_gu || [];
  const bad = g.filter((r) => r.label !== r.want);
  ok(`일반구 ${g.length}행 모두 상위 시 단위로`, g.length === 39 && bad.length === 0, JSON.stringify(bad.slice(0, 5)));
  const m = R.lift?.metro_gu || [];
  const badM = m.filter((r) => r.label !== r.want);
  ok(`광역시 구·군 ${m.length}행 모두 광역시 단위로`, m.length > 0 && badM.length === 0, JSON.stringify(badM.slice(0, 5)));
  const gj = R.lift?.gwangju_gu || [];
  ok('옛 광주 5개 구 모두 「전남광주통합특별시 광주」', gj.length === 5 && gj.every((r) => r.label === '전남광주통합특별시 광주'), JSON.stringify(gj));
}

console.log('--- 저장 거부 (구·동·도) ---');
for (const [name, r] of Object.entries(R.reject || {})) {
  ok(`저장 거부: ${name}`, r.message === '과외지역은 목록에서 광역시 또는 도의 시·군을 선택해 주세요.' && r.label === null, JSON.stringify(r));
}
ok('가입 저장: 단위 3개 통과', JSON.stringify(R.signup?.unit_ok?.ok) === JSON.stringify([R.addr?.gangnam?.unit_id, R.addr?.yeongtong?.unit_id, R.addr?.gwangsan?.unit_id]), JSON.stringify(R.signup?.unit_ok));
ok('가입 저장: 구 거부', /광역시 또는 도의 시·군/.test(R.signup?.gu?.error || ''), JSON.stringify(R.signup?.gu));
ok('가입 저장: 동 거부', /광역시 또는 도의 시·군/.test(R.signup?.dong?.error || ''), JSON.stringify(R.signup?.dong));
ok('가입 저장: 도 행 거부', /광역시 또는 도의 시·군/.test(R.signup?.province?.error || ''), JSON.stringify(R.signup?.province));
ok('가입 저장: 2번 칸 일반구 거부', /광역시 또는 도의 시·군/.test(R.signup?.slot2_gu?.error || ''), JSON.stringify(R.signup?.slot2_gu));

console.log('--- 검색 ---');
const S = R.search || {};
ok('과외쌤 찾기 tutor_region_id = 단위 id 통과', S.tutor_unit?.ok === R.addr?.gangnam?.unit_id, JSON.stringify(S.tutor_unit));
ok('과외쌤 찾기 tutor_region_id = 경기도 수원시 단위 통과', S.tutor_suwon?.ok === R.addr?.yeongtong?.unit_id, JSON.stringify(S.tutor_suwon));
ok('과외쌤 찾기 tutor_region_id = 전남광주 광주 단위 통과', S.tutor_gwangju?.ok === R.addr?.gwangsan?.unit_id, JSON.stringify(S.tutor_gwangju));
ok('과외쌤 찾기 tutor_region_id 구 거부', /광역시 또는 도의 시·군/.test(S.tutor_gu?.error || ''), JSON.stringify(S.tutor_gu));
ok('과외쌤 찾기 tutor_region_id 동 거부', /광역시 또는 도의 시·군/.test(S.tutor_dong?.error || ''), JSON.stringify(S.tutor_dong));
ok('과외쌤 찾기 tutor_region_id 도 행 거부', /광역시 또는 도의 시·군/.test(S.tutor_province?.error || ''), JSON.stringify(S.tutor_province));
ok('학생 찾기(과외 희망) preferred_region_id = 단위 id 통과', S.student_tutor_unit?.ok === R.addr?.gangnam?.unit_id, JSON.stringify(S.student_tutor_unit));
ok('학생 찾기(과외 희망) preferred_region_id 구 거부', /광역시 또는 도의 시·군/.test(S.student_tutor_gu?.error || ''), JSON.stringify(S.student_tutor_gu));
ok('공부방 찾기 구(강남구) 그대로 통과', typeof S.room_gu?.ok === 'number' && S.room_gu.ok > 0, JSON.stringify(S.room_gu));
ok('공부방 찾기는 과외 단위(서울특별시) 를 받지 않음(구 단위 그대로)', /구\(시·군\)까지/.test(S.room_unit_metro?.error || ''), JSON.stringify(S.room_unit_metro));
ok('공부방 찾기는 078 광주 행을 받지 않음', /구\(시·군\)까지/.test(S.room_gwangju_unit?.error || ''), JSON.stringify(S.room_gwangju_unit));
ok('학생 찾기(공부방 희망) 구 그대로 통과', S.student_room_gu?.ok === S.room_gu?.ok, JSON.stringify(S.student_room_gu));
ok('공부방 구 → 소속 동(대치동) 그대로', Array.isArray(R.room_dongs_under_gangnam) && R.room_dongs_under_gangnam.map(Number).includes(R.daechi_id), JSON.stringify(R.room_dongs_under_gangnam));

/* ══════════════ 2부 프런트 ══════════════ */
console.log('##### 2부 프런트 (tutor-unit-cascade.js · 같은 단위 목록) #####');
globalThis.HTMLSelectElement = class {};
globalThis.HTMLInputElement = class {};
globalThis.HTMLElement = class {};
const cascade = await import(pathToFileURL(join(ROOT, 'preview/shared/tutor-unit-cascade.js')).href);
const U = cascade.normalizeTutorUnits(units);
ok('normalizeTutorUnits 가 서버 목록을 그대로 받음', U.length === units.length && U.length > 0, String(U.length));
for (const a of ADDRESSES) {
  const id = cascade.tutorUnitIdForAddress(a.sido, a.sigungu, U);
  ok(`화면 주소 「${a.title}」 → 서버와 같은 단위 id(${a.want})`, id === String(R.addr?.[a.key]?.unit_id ?? '') && cascade.tutorUnitLabelFromId(id, U) === a.want, `${id} ${cascade.tutorUnitLabelFromId(id, U)}`);
}
ok('화면 주소 「광주 서구」(옛 광주) → 전남광주통합특별시 광주', cascade.tutorUnitLabelFromId(cascade.tutorUnitIdForAddress('광주', '서구', U), U) === '전남광주통합특별시 광주');
ok('화면 주소 「경남 고성군」 → 경상남도 고성군(강원과 구분)', cascade.tutorUnitLabelFromId(cascade.tutorUnitIdForAddress('경남', '고성군', U), U) === '경상남도 고성군');
ok('화면 주소 시도만(「경기」) → 단위 없음', cascade.tutorUnitIdForAddress('경기', '', U) === '');
{
  const sidos = cascade.listTutorSidoOptions(U);
  ok('1단계 시·도 = 16개(특별시·광역시·세종 7 + 도·전남광주 9)', sidos.length === 16, sidos.map((s) => s.sido_name).join(','));
  ok('1단계 시·도에 광주광역시·전라남도 따로 없음(전남광주통합특별시 하나)', !sidos.some((s) => s.sido_name === '광주광역시' || s.sido_name === '전라남도') && sidos.some((s) => s.sido_name === '전남광주통합특별시'));
  const seoul = cascade.resolveTutorCascade(U, { sidoName: '서울특별시' });
  ok('서울특별시: 1단계에서 끝(2단계 칸 없음)', seoul.complete === true && seoul.showUnit === false && seoul.label === '서울특별시');
  const sejong = cascade.resolveTutorCascade(U, { sidoName: '세종특별자치시' });
  ok('세종: 1단계에서 끝 · 이름 한 번', sejong.complete === true && sejong.showUnit === false && sejong.label === '세종특별자치시');
  const gg = cascade.resolveTutorCascade(U, { sidoName: '경기도' });
  ok('경기도: 시도만으로는 미완료 · 2단계 시·군 칸', gg.complete === false && gg.showUnit === true && gg.regionId === '');
  const suwon = cascade.resolveTutorCascade(U, { sidoName: '경기도', unitName: '수원시' });
  ok('경기도 → 수원시: 완료 · 라벨 경기도 수원시', suwon.complete === true && suwon.label === '경기도 수원시');
  const ggUnits = cascade.listTutorUnitsInSido(U, '경기도').map((u) => u.unit_name);
  ok('경기도 2단계에 일반구(영통구 등) 없음', !ggUnits.some((n) => /구$/.test(n) || n.includes(' ')), ggUnits.filter((n) => /구$/.test(n)).join(','));
  const jg = cascade.listTutorUnitsInSido(U, '전남광주통합특별시').map((u) => u.unit_name);
  ok('전남광주 2단계 = 광주 + 시·군(광산구 등 구 없음)', jg.includes('광주') && jg.includes('순천시') && !jg.some((n) => /구$/.test(n)), jg.join(','));
  const html = cascade.renderTutorUnitCascade({ units: U, regionId: R.addr?.yeongtong?.unit_id, hiddenName: 'region_id' });
  ok('선택칸 HTML: 시·도 · 시·군 두 칸만(구 칸 없음)', html.includes('data-field="region_sido"') && html.includes('data-field="region_city"') && !html.includes('region_gu'));
  ok('선택칸 HTML: 저장 hidden = 단위 id', html.includes(`value="${R.addr?.yeongtong?.unit_id}"`));
  const empty = cascade.renderTutorUnitCascade({ units: [] });
  ok('목록이 없으면 오류 문구 · 샘플로 채우지 않음', empty.includes(cascade.TUTOR_UNIT_LIST_ERROR) && !empty.includes('<option'));
}

/* ══════════════ 3부 정적 ══════════════ */
console.log('##### 3부 정적 #####');
const tutorReg = read('src/Tutor/TutorRegisterService.php');
const basicReg = read('src/Auth/BasicRegisterService.php');
const studentHub = read('src/Registration/StudentHubRepository.php');
const searchPhp = read('src/Search/SearchService.php');
const regionsApi = read('public/api/auth/regions.php');
ok('과외쌤 마이페이지 저장 = TutorRegionUnit::assertUnit', /TutorRegionUnit::assertUnit\(\$pdo, \$regionId\)/.test(tutorReg));
ok('과외쌤 가입 저장 = TutorRegionUnit::assertUnit', /TutorRegionUnit::assertUnit\(\$pdo, \$id\)/.test(basicReg));
ok('학생 가입 과외 희망 = TutorRegionUnit::assertUnit', /TutorRegionUnit::assertUnit\(Connection::get\(\), \$tutorRegionId\)/.test(basicReg));
ok('학생 마이페이지 과외 희망 = TutorRegionUnit::assertUnit', /TutorRegionUnit::assertUnit\(\$this->pdo, \$regionId\)/.test(studentHub));
ok('과외 축에 SidoRegionEnsure::assertSelectable 없음', ![tutorReg, basicReg, studentHub].some((s) => s.includes('assertSelectable')));
ok('regions.php: tutor_units 액션 · cities 는 그대로', /\$action === 'tutor_units'/.test(regionsApi) && /\$action === 'cities'/.test(regionsApi));
ok('과외 축 is_selectable 미사용(TutorRegionUnit 본문)', !read('src/Region/TutorRegionUnit.php').replace(/\/\*[\s\S]*?\*\//g, '').includes('is_selectable'));

function fnBody(src, name) {
  const at = src.indexOf(`private function ${name}(`);
  if (at < 0) return '';
  const next = src.indexOf('\n    private function ', at + 10);
  const nextPub = src.indexOf('\n    public function ', at + 10);
  const ends = [next, nextPub].filter((n) => n > 0);
  return src.slice(at, ends.length ? Math.min(...ends) : undefined);
}
const mainSearch = spawnSync('git', ['show', 'origin/main:src/Search/SearchService.php'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
if (mainSearch.status === 0) {
  const a = fnBody(mainSearch.stdout.replace(/\r\n/g, '\n'), 'searchRooms');
  const b = fnBody(searchPhp.replace(/\r\n/g, '\n'), 'searchRooms');
  ok('공부방 검색 searchRooms 본문 = origin/main 과 같음', a !== '' && a === b, `${a.length}/${b.length}`);
} else {
  ok('origin/main SearchService 읽기', false, mainSearch.stderr);
}
const regionCascade = read('preview/shared/region-cascade.js');
const mainCascade = spawnSync('git', ['show', 'origin/main:preview/shared/region-cascade.js'], { cwd: ROOT, encoding: 'utf8' });
ok('공부방·찾기 공용 region-cascade.js 불변', mainCascade.status === 0 && mainCascade.stdout.replace(/\r\n/g, '\n') === regionCascade.replace(/\r\n/g, '\n'));

/* ══════════════ 4부 찾기 화면 (2단계) ══════════════ */
console.log('##### 4부 찾기 화면 (search-find-surface.js · 같은 단위 목록 · @home-ui 별칭 때문에 preview/home-ui 에서 실행) #####');
{
  const inputFile = join(tmpdir(), `tru-find-${process.pid}.json`);
  writeFileSync(inputFile, JSON.stringify({
    units,
    gangnamGu: R.addr?.gangnam?.row_id,
    seoul: R.addr?.gangnam?.unit_id,
    suwon: R.addr?.yeongtong?.unit_id,
    gwangju: R.addr?.gwangsan?.unit_id,
  }));
  const child = spawnSync(
    process.platform === 'win32' ? 'cmd.exe' : 'npx',
    process.platform === 'win32'
      ? ['/d', '/s', '/c', 'npx --yes vite-node ../../scripts/verify-tutor-region-unit.mjs']
      : ['--yes', 'vite-node', '../../scripts/verify-tutor-region-unit.mjs'],
    { cwd: join(ROOT, 'preview/home-ui'), encoding: 'utf8', env: { ...process.env, TRU_FIND_INPUT: inputFile }, maxBuffer: 32 * 1024 * 1024 },
  );
  rmSync(inputFile, { force: true });
  const lines = String(child.stdout || '').split(/\r?\n/);
  for (const l of lines) {
    if (l.startsWith('PASS  ')) {
      passed += 1;
      console.log(l);
    } else if (l.startsWith('##### ') || l.startsWith('--- ')) {
      console.log(l);
    }
  }
  for (const l of String(child.stderr || '').split(/\r?\n/)) {
    if (l.startsWith('FAIL  ')) {
      failed += 1;
      console.error(l);
    }
  }
  ok('4부 하위 실행 종료 0', child.status === 0, `${child.status} ${String(child.stderr || '').split(/\r?\n/).filter((l) => !l.startsWith('FAIL  ')).join(' ').slice(0, 800)}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

/**
 * 4부 본문(하위 실행). 브라우저 API(저장소·주소·fetch·GPS·네이버 역지오코딩)만 흉내 내고 실제 모듈을 부른다.
 * 공부방 분기는 origin/main 의 search-find-surface.js 를 같은 조건으로 돌려 결과가 같은지 본다.
 * @param {{ units: object[], gangnamGu: number, seoul: number, suwon: number, gwangju: number }} input
 */
async function runFindPart(input) {
  console.log('##### 4부 찾기 화면 #####');
  const mem = new Map();
  const storage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear(),
    key: (i) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size;
    },
  };
  globalThis.sessionStorage = storage;
  globalThis.localStorage = storage;
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
    value: { hash: '#/search/tutor', href: 'http://127.0.0.1:5174/search/#/search/tutor', origin: 'http://127.0.0.1:5174', host: '127.0.0.1:5174', hostname: '127.0.0.1', protocol: 'http:', pathname: '/search/', search: '', assign() {}, replace() {} },
    writable: true,
    configurable: true,
  });
  globalThis.history = {
    replaceState(_s, _t, url) {
      const text = String(url || '');
      if (text.startsWith('#')) location.hash = text;
    },
    pushState() {},
  };
  console.warn = () => {};
  console.info = () => {};

  /** 네이버 역지오코딩 결과(시도·시군구·동). GPS 경우마다 바꾼다. */
  let gpsArea = ['서울특별시', '강남구', '대치동'];
  Object.defineProperty(globalThis, 'navigator', {
    value: { geolocation: { getCurrentPosition: (okFn) => okFn({ coords: { latitude: 37.5, longitude: 127.06 } }) } },
    writable: true,
    configurable: true,
  });
  globalThis.naver = {
    maps: {
      LatLng: class {},
      Service: {
        OrderType: { ADDR: 'addr', ROAD_ADDR: 'roadaddr' },
        Status: { OK: 200 },
        reverseGeocode: (_req, cb) => cb(200, { v2: { results: [{ region: { area1: { name: gpsArea[0] }, area2: { name: gpsArea[1] }, area3: { name: gpsArea[2] } } }] } }),
      },
    },
  };

  const CITIES = [
    { id: input.gangnamGu, label: '강남구', sido_code: '11', sido_name: '서울특별시', official_code: '1168000000', city_name: '강남구', gu_name: '', kind: 'gu' },
  ];
  /** @type {Array<{ tab: string, filters: Record<string, unknown> }>} */
  const searches = [];
  globalThis.fetch = async (url, init = {}) => {
    const text = String(url);
    const res = (body) => ({ ok: true, status: 200, json: async () => body });
    if (text.includes('action=tutor_units')) return res({ ok: true, tutor_units: input.units });
    if (text.includes('action=cities')) return res({ ok: true, cities: CITIES });
    if (text.includes('/api/search/search.php')) {
      searches.push(JSON.parse(String(init.body || '{}')));
      return res({ ok: true, items: [], total: 0 });
    }
    if (text.includes('/api/auth/me.php')) return res({ ok: true, authenticated: false });
    throw new Error(`offline ${text}`);
  };

  const cascade = await import('../preview/shared/tutor-unit-cascade.js');
  const loc = await import('../preview/shared/location-display.js');
  const teaser = await import('../preview/home-ui/src/student-blind-teaser.js');
  const tutorDetail = await import('../preview/home-ui/src/detail-decision/tutor-detail.js');
  const studyroomDetail = await import('../preview/home-ui/src/detail-decision/studyroom-detail.js');
  const surface = await import('../preview/search-ui/src/search-find-surface.js');
  const U = cascade.normalizeTutorUnits(input.units);
  const noop = () => {};
  const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms));
  const freshState = (role) => ({ role, searchPage: 1, searchExecuted: false, searchTotal: 0, searchExposureItems: [], canonicalLocation: null, activeRegionLabel: '', expanded: false });
  const PICK_HINT = '광역시는 시·도, 도는 시·군까지 선택해 주세요';

  await surface.whenFindCitiesReady('tutor');

  console.log('--- 과외쌤 찾기: 선택 → 검색 ---');
  {
    const st = freshState('study_room');
    const html = surface.renderCompactFindForm('tutor', st, { role: 'study_room' });
    ok('과외쌤 찾기 지역칸 = 과외 단위 2칸(시·도 · 시·군) · 구 칸 없음', html.includes('data-region-cascade="tutor_unit"') && html.includes('data-field="region_city"') && !html.includes('region_gu'), html.slice(0, 200));
    ok('과외쌤 찾기 안내 = 광역시는 시·도, 도는 시·군', html.includes(PICK_HINT));
  }
  /** @param {string} sidoName @param {string} [unitName] */
  async function searchTutor(sidoName, unitName = '') {
    const pick = cascade.resolveTutorCascade(U, { sidoName, unitName });
    const st = freshState('study_room');
    const before = searches.length;
    const hint = { textContent: '' };
    const form = {
      querySelector: (sel) => {
        if (sel.includes('f_tutor_region_id')) {
          const el = new globalThis.HTMLInputElement();
          el.value = String(pick.regionId || '');
          return el;
        }
        return sel.includes('search-field__hint') ? hint : null;
      },
    };
    if (!pick.regionId) {
      await surface.runFindSearch('tutor', form, st, 'study_room', noop);
      await surface.runFindSearchWithFilters('tutor', {}, st, 'study_room', noop);
    } else {
      await surface.runFindSearchWithFilters('tutor', { tutor_region_id: pick.regionId }, st, 'study_room', noop);
    }
    await tick();
    return { pick, st, sent: searches.slice(before), hint: hint.textContent };
  }
  {
    const r = await searchTutor('서울특별시');
    ok('서울: 시·도만으로 검색됨(tutor_region_id = 서울특별시 단위)', r.pick.complete && r.sent.length === 1 && String(r.sent[0].filters?.tutor_region_id) === String(input.seoul), JSON.stringify(r.sent));
    ok('서울: 현재 위치 = 서울특별시', r.st.activeRegionLabel === '서울특별시', r.st.activeRegionLabel);
  }
  {
    const r = await searchTutor('경기도');
    ok('경기도만: 검색 요청 없음', r.sent.length === 0, JSON.stringify(r.sent));
    ok('경기도만: 시·군 선택 안내', r.hint === PICK_HINT && r.st.findScopeHint === PICK_HINT, `${r.hint} / ${r.st.findScopeHint}`);
  }
  {
    const r = await searchTutor('경기도', '수원시');
    ok('경기도 수원시: 검색됨(tutor_region_id = 수원시 단위)', r.sent.length === 1 && String(r.sent[0].filters?.tutor_region_id) === String(input.suwon), JSON.stringify(r.sent));
    ok('경기도 수원시: 현재 위치 = 경기도 수원시', r.st.activeRegionLabel === '경기도 수원시', r.st.activeRegionLabel);
  }
  {
    const r = await searchTutor('전남광주통합특별시', '광주');
    ok('전남광주 광주: 검색됨(tutor_region_id = 078 광주 단위)', r.sent.length === 1 && String(r.sent[0].filters?.tutor_region_id) === String(input.gwangju), JSON.stringify(r.sent));
    ok('전남광주 광주: 현재 위치 = 전남광주통합특별시 광주', r.st.activeRegionLabel === '전남광주통합특별시 광주', r.st.activeRegionLabel);
  }

  console.log('--- 현재 위치 · GPS ---');
  /** @param {string} tab @param {string[]} area @param {object} [extra] */
  async function gps(tab, area, extra = {}) {
    gpsArea = area;
    sessionStorage.clear();
    const st = { ...freshState('study_room'), ...extra };
    await surface.bootFindGpsIfNeeded(st, tab, noop);
    await tick();
    return st;
  }
  {
    const st = await gps('tutor', ['서울특별시', '강남구', '대치동']);
    ok('GPS 강남구 대치동 → 과외쌤 찾기 위치 서울특별시', st.canonicalLocation?.displayLabel === '서울특별시' && String(st.canonicalLocation?.regionId) === String(input.seoul), JSON.stringify(st.canonicalLocation));
    ok('GPS 강남구 → 화면 라벨 서울특별시', surface.resolveActiveRegionLabel('tutor', st, 'study_room') === '서울특별시', surface.resolveActiveRegionLabel('tutor', st, 'study_room'));
  }
  {
    const st = await gps('tutor', ['경기도', '수원시 영통구', '매탄동']);
    ok('GPS 수원시 영통구 → 경기도 수원시', st.canonicalLocation?.displayLabel === '경기도 수원시' && String(st.canonicalLocation?.regionId) === String(input.suwon), JSON.stringify(st.canonicalLocation));
  }
  {
    const st = await gps('student', ['서울특별시', '강남구', '대치동'], { studentHopeType: 'tutor', hopeTypeResolved: true });
    ok('GPS 학생 찾기(과외 희망) → 서울특별시', st.canonicalLocation?.displayLabel === '서울특별시', JSON.stringify(st.canonicalLocation));
  }

  console.log('--- 손님 · 확대카드 ---');
  ok('손님 과외쌤 기준 라벨 상수 = 서울특별시', loc.GUEST_BASE_TUTOR_LABEL === '서울특별시');
  ok('손님 기준(서버 전) 과외쌤 = 서울특별시 · 학생 = 서울시 강남구 · 공부방 = 대치동', (() => {
    const b = loc.readGuestBaseline();
    return b.tutor === '서울특별시' && b.student === '서울시 강남구' && b.room === loc.GUEST_BASE_ROOM_LABEL;
  })(), JSON.stringify(loc.readGuestBaseline()));
  {
    const st = freshState('guest');
    await surface.runFindSearchWithFilters('tutor', { tutor_region_id: String(input.seoul) }, st, 'guest', noop);
    await tick();
    ok('손님 과외쌤 찾기 현재 위치 = 서울특별시', st.activeRegionLabel === '서울특별시', st.activeRegionLabel);
  }
  for (const label of ['서울특별시', '세종특별자치시', '경기도 수원시', '전남광주통합특별시 광주', '경상북도 안동시']) {
    ok(`손님 확대카드 과외지역 「${label}」 그대로(「—」 아님)`, teaser.coarseRegionForGuest(label, 'tutor') === label, teaser.coarseRegionForGuest(label, 'tutor'));
  }
  ok('손님 과외쌤 상세 본문 과외지역 = 서울특별시', tutorDetail.renderTutorDetailBody({ location_label: '서울특별시' }, 'guest').includes('<dt>과외지역</dt><dd>서울특별시</dd>'));
  ok('손님 학생 카드(과외 희망) 지역 = 서울특별시', teaser.guestStudentTeaserFields({ location_label: '서울특별시', preferred_lesson_type: 'tutor' }).region === '서울특별시');
  {
    const roomLabels = ['서울특별시 강남구 대치동', '서울시 강남구 대치동 · 은마아파트', '대치동', '경기도 수원시 영통구 매탄동', '서울특별시 강남구', '강남구', '역삼1동', '목동권', '', '—', '경기도 수원시', '서울특별시', '세종특별자치시', '경상북도 안동시'];
    const mainTeaser = spawnSync('git', ['show', 'origin/main:preview/home-ui/src/student-blind-teaser.js'], { cwd: ROOT, encoding: 'utf8' });
    const fn = mainTeaser.stdout.replace(/\r\n/g, '\n').match(/export function coarseRegionForGuest\(locationLabel\) \{[\s\S]*?\n\}/)?.[0] || '';
    const oldCoarse = fn ? new Function(`${fn.replace('export ', '')}; return coarseRegionForGuest;`)() : null;
    const diffOf = (fnNew) => (oldCoarse ? roomLabels.filter((l) => oldCoarse(l) !== fnNew(l)) : ['main 읽기 실패']);
    ok('공부방 라벨(경기도 수원시·서울특별시 포함) 손님 표기 = origin/main (kind study_room)', diffOf((l) => teaser.coarseRegionForGuest(l, 'study_room')).length === 0, JSON.stringify(diffOf((l) => teaser.coarseRegionForGuest(l, 'study_room'))));
    ok('kind 없이 부르면 공부방 축(= origin/main)', diffOf((l) => teaser.coarseRegionForGuest(l)).length === 0, JSON.stringify(diffOf((l) => teaser.coarseRegionForGuest(l))));
    ok('공부방 라벨 「경기도 수원시」 = origin/main 결과', oldCoarse && teaser.coarseRegionForGuest('경기도 수원시', 'study_room') === oldCoarse('경기도 수원시'), `${teaser.coarseRegionForGuest('경기도 수원시', 'study_room')} / ${oldCoarse?.('경기도 수원시')}`);
    ok('공부방 라벨 「서울특별시」 = origin/main 결과', oldCoarse && teaser.coarseRegionForGuest('서울특별시', 'study_room') === oldCoarse('서울특별시'), `${teaser.coarseRegionForGuest('서울특별시', 'study_room')} / ${oldCoarse?.('서울특별시')}`);
    ok('손님 공부방 상세 본문 「서울특별시」 = origin/main 결과', oldCoarse && studyroomDetail.renderStudyRoomDetailBody({ location_label: '서울특별시' }, 'guest').includes(`<dd>${oldCoarse('서울특별시')}</dd>`));
    {
      const callers = ['preview/home-ui/src/exposure-render.js', 'preview/home-ui/src/detail-decision/tutor-detail.js', 'preview/home-ui/src/detail-decision/studyroom-detail.js', 'preview/home-ui/src/detail-decision/detail-utils.js', 'preview/home-ui/src/student-blind-teaser.js'];
      const calls = callers.flatMap((f) => [...read(f).matchAll(/coarseRegionForGuest\(([^)]*\))?[^)]*\)/g)].filter((m) => !/export function/.test(read(f).slice(Math.max(0, m.index - 20), m.index))).map((m) => `${f}: ${m[0]}`));
      const noKind = calls.filter((c) => !/coarseRegionForGuest\(item\.location_label, /.test(c));
      ok(`coarseRegionForGuest 호출부 ${calls.length}곳 모두 kind 명시`, calls.length === 8 && noKind.length === 0, JSON.stringify(noKind.length ? noKind : calls));
    }
    ok('손님 학생 카드(공부방 희망) 「경기도 수원시」 = origin/main 결과', oldCoarse && teaser.guestStudentTeaserFields({ location_label: '경기도 수원시', preferred_lesson_type: 'study_room' }).region === oldCoarse('경기도 수원시'));
  }

  console.log('--- 공부방 찾기 = origin/main 과 같은 결과 ---');
  const mainSrc = spawnSync('git', ['show', 'origin/main:preview/search-ui/src/search-find-surface.js'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  const mainFile = join(ROOT, 'preview/search-ui/src/zz-tru-main-find-surface.tmp.js');
  let mainSurface = null;
  if (mainSrc.status === 0) {
    writeFileSync(mainFile, mainSrc.stdout);
    try {
      mainSurface = await import(/* @vite-ignore */ pathToFileURL(mainFile).href);
      await mainSurface.whenFindCitiesReady();
    } finally {
      rmSync(mainFile, { force: true });
    }
  }
  ok('origin/main search-find-surface.js 불러옴', !!mainSurface, mainSrc.stderr);
  if (mainSurface) {
    /** @param {any} mod @param {string} tab @param {string} role @param {Record<string, string>} filters @param {object} [extra] */
    async function roomRun(mod, tab, role, filters, extra = {}) {
      sessionStorage.clear();
      location.hash = `#/search/${tab}`;
      const st = { ...freshState(role), ...extra };
      const formBefore = mod.renderCompactFindForm(tab, st, { role });
      const before = searches.length;
      await mod.runFindSearchWithFilters(tab, { ...filters }, st, role, noop);
      await tick();
      return {
        formBefore,
        formAfter: mod.renderCompactFindForm(tab, st, { role }),
        bar: mod.renderFindFilterBar(tab, st),
        sent: searches.slice(before).map((s) => ({ tab: s.tab, filters: s.filters })),
        label: st.activeRegionLabel,
        place: st.canonicalLocation?.displayLabel,
        hash: location.hash,
      };
    }
    const cases = [
      ['공부방 찾기 강남구(공부방 회원)', 'room', 'study_room', { sigungu_region_id: String(input.gangnamGu) }, {}],
      ['공부방 찾기 강남구(손님)', 'room', 'guest', { sigungu_region_id: String(input.gangnamGu) }, {}],
      ['공부방 찾기 지역 없음', 'room', 'study_room', {}, {}],
      ['학생 찾기(공부방 희망) 강남구', 'student', 'study_room', { preferred_region_id: String(input.gangnamGu), preferred_lesson_type: 'study_room' }, { studentHopeType: 'study_room', hopeTypeResolved: true }],
    ];
    for (const [name, tab, role, filters, extra] of cases) {
      const a = await roomRun(mainSurface, tab, role, filters, extra);
      const b = await roomRun(surface, tab, role, filters, extra);
      const keys = Object.keys(a).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
      ok(`${name}: 폼 HTML · 검색 요청 · 현재 위치 · 주소 = origin/main`, keys.length === 0, keys.map((k) => `${k}: ${JSON.stringify(a[k]).slice(0, 160)} ≠ ${JSON.stringify(b[k]).slice(0, 160)}`).join(' | '));
      if (name === '공부방 찾기 강남구(공부방 회원)') {
        ok('공부방 찾기 강남구: sigungu_region_id = 강남구 id 그대로', String(b.sent[0]?.filters?.sigungu_region_id) === String(input.gangnamGu), JSON.stringify(b.sent));
      }
    }
    {
      gpsArea = ['서울특별시', '강남구', '대치동'];
      const run = async (mod) => {
        sessionStorage.clear();
        const st = freshState('study_room');
        await mod.bootFindGpsIfNeeded(st, 'room', noop);
        await tick();
        return JSON.stringify({ place: st.canonicalLocation?.displayLabel, level: st.canonicalLocation?.level, dong: st.canonicalLocation?.dong });
      };
      const a = await run(mainSurface);
      const b = await run(surface);
      ok('공부방 찾기 GPS 강남구 대치동 = origin/main', a === b && b.includes('대치동'), `${a} / ${b}`);
    }
  }
}
