/**
 * 사이트오류-10 · 과외쌤 대표 지역 라벨 = 「시도 시군구」(서버)
 * 실행(저장소 루트): node scripts/verify-tutor-region-label.mjs
 *
 * 1부(정적): TutorHubRepository · ProviderTicketRepository 가 sido_name 만 읽지 않고
 *   OfficialRegionLabel::sigunguLabel 로 라벨을 만든다. 응답 필드명 유지, '—' 같은 대체 문자열 없음.
 * 2부(PHP, 가짜 PDO): regions 는 sql/schema/073_region_official_seed.sql 공식 시드를 그대로 읽어 쓴다.
 *   동 행은 RegionEnsure(카카오 주소검색)가 만드는 모양(시도 약칭 · unit_level=dong · official_code NULL).
 *   경기도 양주시 / 서울 강남구 / 세종 / 수원시 영통구 / 대표 없음 / 동 행 / 지역 행 없음.
 * 3부(정적): 마이프로필 화면이 서버 primary_region_label 을 그대로 쓰고 클라이언트에서 다시 조합하지 않는다.
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

/* ══════════════════════ 1부: 정적 ══════════════════════ */
console.log('##### 1부 정적 #####');
const hubPhp = read('src/Registration/TutorHubRepository.php');
const ticketPhp = read('src/Paid/ProviderTicketRepository.php');
const helperPhp = read('src/Registration/OfficialRegionLabel.php');
const studentPhp = read('src/Registration/StudentHubRepository.php');

ok('헬퍼 OfficialRegionLabel 존재', helperPhp.includes('final class OfficialRegionLabel'));
ok('헬퍼 sigunguLabel(): ?string', /public function sigunguLabel\(mixed \$regionId\): \?string/.test(helperPhp));
ok('TutorHub: sido_name 단독 조회 제거', !/SELECT r\.sido_name FROM tutor_regions/.test(hubPhp));
ok('TutorHub: OfficialRegionLabel::sigunguLabel 사용', hubPhp.includes('(new OfficialRegionLabel($this->pdo))->sigunguLabel('));
ok('TutorHub: primaryRegionLabel(): ?string', /private function primaryRegionLabel\(int \$tutorId\): \?string/.test(hubPhp));
ok("TutorHub: 응답 키 primary_region_label 유지", /'primary_region_label'\s*=>\s*\$primaryRegion,/.test(hubPhp));
ok("TutorHub: 응답 키 location_label 유지(대체 문자열 없음)", /'location_label'\s*=>\s*\$primaryRegion,/.test(hubPhp));
ok("TutorHub: '—' 대체값 제거", !hubPhp.includes("? $primaryRegion : '—'"));
ok('Ticket: sido_name 단독 조회 제거', !/SELECT r\.sido_name FROM tutor_regions/.test(ticketPhp));
ok('Ticket: OfficialRegionLabel 사용', ticketPhp.includes('use Study114\\Registration\\OfficialRegionLabel;') && ticketPhp.includes('->sigunguLabel($regionId)'));
ok('Ticket: 공부방 분기 쿼리 그대로', ticketPhp.includes('SELECT CONCAT(r.dong_name, IFNULL(CONCAT(" · ", c.name), ""))'));
ok('Student: 같은 헬퍼로 위임(중복 구현 없음)', studentPhp.includes('(new OfficialRegionLabel($this->pdo))->resolve($regionId)')
  && !studentPhp.includes('function joinRegionTokens') && !studentPhp.includes('function selectableSigunguForDong'));

/* ══════════════════════ 2부: 서버 (가짜 PDO) ══════════════════════ */
console.log('##### 2부 서버 (가짜 PDO · 073 공식 시드) #####');

const seedSql = read('sql/schema/073_region_official_seed.sql');
const SEED_RE = /\('(\d+)', '([^']*)', '(\d+)', '([^']*)', NULL, '', '(sido|sigungu)', '(\d{10})', ([01])\)/g;
const seed = [];
for (const m of seedSql.matchAll(SEED_RE)) {
  seed.push({
    id: 1000 + seed.length,
    sido_name: m[2],
    sigungu_code: m[3],
    sigungu_name: m[4],
    dong_name: '',
    unit_level: m[5],
    official_code: m[6],
    is_selectable: Number(m[7]),
  });
}
ok('073 시드 284행 파싱', seed.length === 284, String(seed.length));
const byCode = (code) => seed.find((r) => r.official_code === code);
const YANGJU = byCode('4163000000');
const GANGNAM = byCode('1168000000');
const SEJONG = byCode('3600000000');
const YEONGTONG = byCode('4111700000');
ok('시드: 경기도 양주시', YANGJU?.sido_name === '경기도' && YANGJU?.sigungu_name === '양주시');
ok('시드: 서울특별시 강남구', GANGNAM?.sido_name === '서울특별시' && GANGNAM?.sigungu_name === '강남구');
ok('시드: 세종(시도=시군구 이름)', SEJONG?.sido_name === '세종특별자치시' && SEJONG?.sigungu_name === '세종특별자치시');
ok('시드: 수원시 영통구', YEONGTONG?.sigungu_name === '수원시 영통구');

// RegionEnsure::insertRow 모양 — 카카오 시도 약칭, unit_level 기본 dong, official_code NULL
const dongRow = (id, sido, sigunguName, sigunguCode, dong) => ({
  id, sido_name: sido, sigungu_code: sigunguCode, sigungu_name: sigunguName, dong_name: dong,
  unit_level: 'dong', official_code: null, is_selectable: 0,
});
const DONGS = [
  dongRow(9001, '경기', '양주시', '41630', '옥정동'),
  dongRow(9002, '경기', '수원시 영통구', '41117', '매탄동'),
  dongRow(9003, '경기', '양주시', '41630', '시 대표'),
];
const REGIONS = [...seed, ...DONGS];

const CASES = {
  yangju: [{ region_id: YANGJU.id, is_primary: 1 }],
  gangnam: [{ region_id: GANGNAM.id, is_primary: 1 }, { region_id: YANGJU.id, is_primary: 0 }],
  sejong: [{ region_id: SEJONG.id, is_primary: 1 }],
  yeongtong: [{ region_id: YEONGTONG.id, is_primary: 1 }],
  none: [],
  no_primary: [{ region_id: YANGJU.id, is_primary: 0 }],
  dong_okjeong: [{ region_id: 9001, is_primary: 1 }],
  dong_maetan: [{ region_id: 9002, is_primary: 1 }],
  dong_city_rep: [{ region_id: 9003, is_primary: 1 }],
  missing_row: [{ region_id: 777777, is_primary: 1 }],
  second_slot_primary: [{ region_id: YANGJU.id, is_primary: 0 }, { region_id: YEONGTONG.id, is_primary: 1 }],
};

const PHP_CODE = String.raw`<?php
declare(strict_types=1);
require_once getcwd() . '/src/bootstrap.php';

use Study114\Paid\ProviderTicketRepository;
use Study114\Registration\TutorHubRepository;

final class TrStmt
{
    private array $rows = [];
    private mixed $column = false;
    private int $cursor = 0;
    public function __construct(private TrPdo $pdo, private string $sql) {}
    public function bindValue(string|int $k, mixed $v, int $t = PDO::PARAM_STR): bool { return true; }
    public function execute(?array $params = null): bool
    {
        $sql = preg_replace('/\s+/', ' ', trim($this->sql));
        $p = array_values($params ?? []);
        $this->pdo->log[] = $sql;
        $a = ($this->pdo->resolver)($sql, $p);
        $this->rows = $a['rows'] ?? [];
        $this->column = $a['column'] ?? false;
        $this->cursor = 0;
        return true;
    }
    public function fetch(mixed ...$a): mixed { return $this->rows[$this->cursor++] ?? false; }
    public function fetchColumn(mixed ...$a): mixed { return $this->column; }
    public function fetchAll(mixed ...$a): array { return $this->rows; }
    public function rowCount(): int { return count($this->rows); }
}

final class TrPdo extends PDO
{
    public array $log = [];
    public $resolver;
    public function __construct(callable $r) { $this->resolver = $r; }
    #[\ReturnTypeWillChange] public function prepare(string $q, array $o = []): TrStmt { return new TrStmt($this, $q); }
    #[\ReturnTypeWillChange] public function query(string $q, ?int $m = null, mixed ...$a): TrStmt { $s = new TrStmt($this, $q); $s->execute([]); return $s; }
}

$IN = json_decode(base64_decode('__INPUT_B64__'), true);
$REGIONS = $IN['regions'];
$CASES = $IN['cases'];

const TUTOR_ID = 501;
const USER_ID = 50;

function tutorRow(): array
{
    return [
        'id' => TUTOR_ID, 'user_id' => USER_ID, 'tutor_display_name' => '테스트쌤', 'profile_status' => 'draft',
        'inquiry_status' => 'open', 'detail_completion_status' => 'basic_only', 'main_subject_note' => '수학',
        'preferred_fee_amount' => null, 'fee_basis_type' => null, 'lessons_per_week' => null, 'monthly_session_count' => null,
        'minutes_per_lesson' => null, 'fee_description' => null, 'intro_short' => null, 'intro_long' => null, 'feature_1' => null,
        'university_name' => null, 'major_name' => null, 'university_status' => null, 'proof_document_available' => 0,
        'career_year_band' => null, 'student_gender_group' => null, 'student_count_group' => null, 'contact_time_note' => null,
        'created_at' => '2026-10-01 09:00:00', 'updated_at' => '2026-10-02 09:00:00', 'published_at' => null,
    ];
}

function resolver(array $regions, array $slots): callable
{
    $byId = [];
    foreach ($regions as $r) { $byId[(int) $r['id']] = $r; }
    $ordered = [];
    foreach ($slots as $i => $s) { $ordered[] = ['region_id' => $s['region_id'], 'scope_type' => 'city', 'is_primary' => $s['is_primary'], 'priority_order' => $i]; }
    $primaryId = false;
    foreach ($ordered as $s) { if ((int) $s['is_primary'] === 1) { $primaryId = $s['region_id']; break; } }

    return static function (string $sql, array $p) use ($byId, $ordered, $primaryId): array {
        if (str_contains($sql, 'FROM tutors t WHERE t.id = ? AND t.user_id = ?')) {
            return ['rows' => ((int) $p[0] === TUTOR_ID && (int) $p[1] === USER_ID) ? [tutorRow()] : []];
        }
        if (str_contains($sql, 'SELECT * FROM tutors WHERE id = ? LIMIT 1')) { return ['rows' => [tutorRow()]]; }
        if (str_contains($sql, 'priority_order = 0')) {
            $slot1 = false;
            foreach ($ordered as $s) {
                if ((int) $s['priority_order'] === 0 && (int) $s['region_id'] > 0) { $slot1 = (int) $s['region_id']; break; }
            }
            if ((int) ($p[0] ?? 0) !== TUTOR_ID) { return ['column' => false]; }
            if (str_contains($sql, 'SELECT 1 FROM tutor_regions')) { return ['column' => $slot1 !== false ? 1 : false]; }
            return ['column' => $slot1];
        }
        if (str_contains($sql, 'SELECT tr.region_id FROM tutor_regions tr WHERE tr.tutor_id = ? AND tr.is_primary = 1')) {
            return ['column' => (int) $p[0] === TUTOR_ID ? $primaryId : false];
        }
        if (str_contains($sql, 'SELECT region_id, scope_type, is_primary FROM tutor_regions')) { return ['rows' => $ordered]; }
        if (str_contains($sql, 'SELECT 1 FROM tutor_regions WHERE tutor_id = ? AND is_primary = 1')) { return ['column' => $primaryId !== false ? 1 : false]; }
        if (str_contains($sql, 'FROM regions WHERE id = ? LIMIT 1') && str_contains($sql, 'unit_level, official_code')) {
            $r = $byId[(int) ($p[0] ?? 0)] ?? null;
            return ['rows' => $r ? [$r] : []];
        }
        if (str_contains($sql, 'WHERE is_selectable = 1 AND CHAR_LENGTH(official_code) >= 5 AND LEFT(official_code, 5) = ?')) {
            $hits = [];
            foreach ($byId as $r) {
                if ((int) $r['is_selectable'] === 1 && strlen((string) $r['official_code']) >= 5 && substr((string) $r['official_code'], 0, 5) === ($p[0] ?? '')) { $hits[] = $r; }
            }
            usort($hits, static fn ($a, $b) => (int) $a['id'] <=> (int) $b['id']);
            return ['rows' => $hits ? [['id' => $hits[0]['id'], 'sido_name' => $hits[0]['sido_name'], 'sigungu_name' => $hits[0]['sigungu_name']]] : []];
        }
        if (str_contains($sql, 'SELECT CONCAT(r.dong_name, IFNULL(CONCAT(" · ", c.name), "")) FROM study_room_regions')) {
            return ['column' => '대치동 · 은마'];
        }
        if (str_contains($sql, 'information_schema')) { return ['column' => 1]; }
        return [];
    };
}

$out = [];
foreach ($CASES as $key => $slots) {
    try {
        $pdo = new TrPdo(resolver($REGIONS, $slots));
        $t = (new TutorHubRepository($pdo))->getForOwner(USER_ID, TUTOR_ID);
        $ticket = (new ProviderTicketRepository($pdo))->primaryRegionLabel('tutor', TUTOR_ID);
        $legacy = false;
        foreach ($pdo->log as $sql) { if (str_contains($sql, 'SELECT r.sido_name FROM tutor_regions')) { $legacy = true; } }
        $out[$key] = [
            'primary_region_label' => array_key_exists('primary_region_label', $t ?? []) ? $t['primary_region_label'] : 'MISSING',
            'location_label' => array_key_exists('location_label', $t ?? []) ? $t['location_label'] : 'MISSING',
            'has_primary_region' => $t['has_primary_region'] ?? 'MISSING',
            'primary_region_id' => $t['primary_region_id'] ?? 'MISSING',
            'ticket' => $ticket,
            'legacy_sql' => $legacy,
        ];
    } catch (Throwable $e) {
        $out[$key] = ['error' => get_class($e) . ': ' . $e->getMessage()];
    }
}
$pdo = new TrPdo(resolver($REGIONS, []));
$out['_ticket_zero'] = (new ProviderTicketRepository($pdo))->primaryRegionLabel('tutor', 0);
$out['_ticket_room'] = (new ProviderTicketRepository($pdo))->primaryRegionLabel('study_room', 77);
echo 'JSON ' . json_encode($out, JSON_UNESCAPED_UNICODE) . "\n";
`;

function phpBin() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  if (existsSync('D:\\php8.2\\php.exe')) return 'D:\\php8.2\\php.exe';
  return 'php';
}

const inputB64 = Buffer.from(JSON.stringify({ regions: REGIONS, cases: CASES }), 'utf8').toString('base64');
const php = spawnSync(phpBin(), [], {
  cwd: ROOT,
  input: PHP_CODE.replace('__INPUT_B64__', inputB64),
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024,
});
const line = String(php.stdout || '').split(/\r?\n/).find((l) => l.startsWith('JSON '));
ok('PHP 실행', php.status === 0 && !!line, `${php.error?.message || ''} ${php.stderr || ''} ${php.stdout || ''}`.slice(0, 800));
/** @type {Record<string, any>} */
const R = line ? JSON.parse(line.slice(5)) : {};

function expectLabel(key, want, title, ticketWant = want) {
  const r = R[key] || {};
  ok(`${title} · 오류 없음`, !r.error, r.error || '');
  ok(`${title} · primary_region_label = ${JSON.stringify(want)}`, r.primary_region_label === want, JSON.stringify(r.primary_region_label));
  ok(`${title} · location_label = ${JSON.stringify(want)}`, r.location_label === want, JSON.stringify(r.location_label));
  ok(`${title} · has_primary_region = ${want !== null}`, r.has_primary_region === (want !== null), JSON.stringify(r.has_primary_region));
  ok(`${title} · 이용권 primaryRegionLabel('tutor') = ${JSON.stringify(ticketWant)}`, r.ticket === ticketWant, JSON.stringify(r.ticket));
  ok(`${title} · 옛 sido_name 단독 쿼리 미실행`, r.legacy_sql === false);
  if (want !== null) {
    ok(`${title} · 라벨에 숫자(id) 없음`, !/\d/.test(String(r.primary_region_label)), String(r.primary_region_label));
  }
}

expectLabel('yangju', '경기도 양주시', 'C1 경기도 양주시');
expectLabel('gangnam', '서울특별시 강남구', 'C2 서울 강남구');
expectLabel('sejong', '세종특별자치시', 'C3 세종(반복 제거)');
ok('C3 세종 · 「세종특별자치시 세종특별자치시」 아님', R.sejong?.primary_region_label !== '세종특별자치시 세종특별자치시');
expectLabel('yeongtong', '경기도 수원시 영통구', 'C4 구가 있는 시(수원시 영통구)');
expectLabel('none', null, 'C5 활동지역 없음');
{
  const r = R.no_primary || {};
  ok('C5b 슬롯1만 있고 is_primary 아님 · 오류 없음', !r.error, r.error || '');
  ok('C5b 슬롯1만 있고 is_primary 아님 · primary_region_label = "경기도 양주시"', r.primary_region_label === '경기도 양주시', JSON.stringify(r.primary_region_label));
  ok('C5b 슬롯1만 있고 is_primary 아님 · location_label = "경기도 양주시"', r.location_label === '경기도 양주시', JSON.stringify(r.location_label));
  ok('C5b 슬롯1만 있고 is_primary 아님 · has_primary_region = true', r.has_primary_region === true, JSON.stringify(r.has_primary_region));
  ok('C5b 슬롯1만 있고 is_primary 아님 · 이용권은 is_primary 행이 없어 null', r.ticket === null, JSON.stringify(r.ticket));
  ok('C5b 슬롯1만 있고 is_primary 아님 · 옛 sido_name 단독 쿼리 미실행', r.legacy_sql === false);
}
expectLabel('missing_row', null, 'C5c 대표 region_id 행이 regions 에 없음');
ok('C5c · 라벨에 region_id 777777 이 새지 않음', !String(R.missing_row?.primary_region_label ?? '').includes('777777') && !String(R.missing_row?.ticket ?? '').includes('777777'));
expectLabel('dong_okjeong', '경기도 양주시', 'C6 동 행(경기 양주시 옥정동) → 상위 시군구');
ok('C6 · 동 이름(옥정동) 미포함 · 약칭(경기) 펴짐', !String(R.dong_okjeong?.primary_region_label).includes('옥정동') && String(R.dong_okjeong?.primary_region_label).startsWith('경기도 '));
expectLabel('dong_maetan', '경기도 수원시 영통구', 'C6b 동 행(수원시 영통구 매탄동) → 상위 구');
expectLabel('dong_city_rep', '경기도 양주시', 'C6c 시 대표 동 행 → 상위 시');
expectLabel('second_slot_primary', '경기도 양주시', 'C7 대표는 슬롯1', '경기도 수원시 영통구');
ok('C7 · primary_region_id = 슬롯1 id', R.second_slot_primary?.primary_region_id === String(YANGJU.id), JSON.stringify(R.second_slot_primary?.primary_region_id));
ok("Z1 이용권 providerId 0 (tutor) = null", R._ticket_zero === null, JSON.stringify(R._ticket_zero));
ok('Z2 이용권 공부방 분기 = 홍보1 라벨 그대로', R._ticket_room === '대치동 · 은마', JSON.stringify(R._ticket_room));

/* ══════════════════════ 3부: 화면까지 (정적) ══════════════════════ */
console.log('##### 3부 화면 경로 (정적) #####');
const profileRead = read('preview/home-ui/src/tutor-reg/profile-read.js');
const regBackend = read('preview/home-ui/src/registrations-backend.js');
const regApi = read('preview/home-ui/src/registrations-api.js');
const apiTutors = read('public/api/registrations/tutors.php');
ok('API: GET /api/registrations/tutors.php → TutorHubService::listForOwner', apiTutors.includes("RegistrationApi::ok(['tutors' => $service->listForOwner($userId)])"));
ok('클라: registrations-api tutors 엔드포인트', regApi.includes("tutors: '/api/registrations/tutors.php'"));
ok('클라: hydrateRegistrationsCache 가 응답 행을 그대로 복사', regBackend.includes('tutorsCache = (tutorsRes.tutors ?? []).map((t) => ({ ...t }));'));
ok('마이프로필: 과외지역 = 서버 primary_region_label 그대로', profileRead.includes("{ label: '과외지역', value: display(t.primary_region_label || t.location_label) }"));
const clientFiles = [
  'preview/home-ui/src/tutor-reg/profile-read.js',
  'preview/home-ui/src/registrations-backend.js',
  'preview/home-ui/src/tutor-reg/screens.js',
  'preview/home-ui/src/tutor-reg/format.js',
  'preview/home-ui/src/tutor-reg/inline-save.js',
];
/** 용어 정정만 같은 줄로 본다. 「대표 활동 시」를 먼저 바꿔 「활동 시」 치환이 앞부분을 건드리지 않게 한다. */
function normalizeRegionTerm(line) {
  return line
    .replace(/대표 활동 시/g, '대표 과외지역')
    .replace(/활동지역/g, '과외지역')
    .replace(/활동 지역/g, '과외지역')
    .replace(/활동 시/g, '과외지역');
}
/** 디자인 통일 v2(A1: 과외 마이프로필 kicker·버튼 삭제, 미입력, 안내문구 변경) 승인 변경 */
function isApprovedProfileReadChange(line) {
  const trimmed = line.trim();
  return (
    trimmed === ''
    || trimmed === 'export const TUTOR_PROFILE_LEAD_COPY ='
    || trimmed === "'입력한 프로필 정보를 그대로 확인합니다. 각 항목의 수정을 누르면 바로 고칠 수 있어요.';"
    || trimmed === '<dd class="p21-profile__value${r.value ? \'\' : \' is-empty\'}">${r.value ? esc(r.value) : \'\'}</dd>'
    || trimmed === '<dd class="p21-profile__value${r.value ? \'\' : \' is-empty\'}">${r.value ? esc(r.value) : \'미입력\'}</dd>'
    || trimmed === '<p class="p21-profile__kicker">마이프로필</p>'
    || trimmed === '<p class="p21-profile__lead">입력한 프로필 정보를 그대로 확인합니다. 수정은 기본정보·상세정보에서 합니다.</p>'
    || trimmed === '<p class="p21-profile__lead">${TUTOR_PROFILE_LEAD_COPY}</p>'
    || trimmed === '<div class="p21-profile__actions">'
    || trimmed === '<a class="btn btn--secondary" href="#${basicHref}" data-p21-nav="${basicHref}">기본정보 수정</a>'
    || trimmed === '<a class="btn btn--secondary" href="#${detailHref}" data-p21-nav="${detailHref}">상세정보 수정</a>'
    || trimmed === '</div>'
  );
}

function termOnlyClientDiff(stdout) {
  const removed = [];
  const added = [];
  for (const raw of String(stdout).split('\n')) {
    const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
    if (
      line.startsWith('diff ')
      || line.startsWith('index ')
      || line.startsWith('--- ')
      || line.startsWith('+++ ')
      || line.startsWith('@@')
    ) {
      continue;
    }
    if (line.startsWith('-')) {
      const content = line.slice(1);
      if (isApprovedProfileReadChange(content)) continue;
      removed.push(normalizeRegionTerm(content));
    } else if (line.startsWith('+')) {
      const content = line.slice(1);
      if (isApprovedProfileReadChange(content)) continue;
      added.push(normalizeRegionTerm(content));
    }
  }
  if (removed.length !== added.length) {
    return { ok: false, detail: `변경 줄 수 ${removed.length}−/${added.length}+` };
  }
  for (let i = 0; i < removed.length; i += 1) {
    if (removed[i] !== added[i]) {
      return { ok: false, detail: `용어 정정 외 변경: ${added[i].trim().slice(0, 160)}` };
    }
  }
  return { ok: true, detail: '' };
}
const diff = spawnSync('git', ['diff', '-U0', 'HEAD', '--', ...clientFiles], { cwd: ROOT, encoding: 'utf8' });
const termDiff = diff.status === 0
  ? termOnlyClientDiff(diff.stdout)
  : { ok: false, detail: `git diff 실패 ${diff.status}` };
ok('클라이언트 라벨은 용어 정정만 허용(로직·값 변경 금지)', termDiff.ok, termDiff.detail);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
