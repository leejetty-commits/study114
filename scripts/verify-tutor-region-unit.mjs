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
 * 운영 DB·서버에 접속하지 않는다. 샘플·가짜 회원 데이터를 만들지 않는다.
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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
