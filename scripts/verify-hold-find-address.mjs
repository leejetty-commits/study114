/**
 * 보류 묶음 찾기 주소 — 정적·가짜응답 합격 (운영 DB·라이브 호출 없음)
 * 실행: npx --yes vite-node scripts/verify-hold-find-address.mjs
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

if (typeof import.meta.env === 'undefined' && !process.env.VITE_NODE_SUB) {
  const npxCmd = process.platform === 'win32' ? 'cmd.exe' : 'npx';
  const npxArgs = process.platform === 'win32'
    ? ['/d', '/s', '/c', 'npx --yes vite-node scripts/verify-hold-find-address.mjs']
    : ['--yes', 'vite-node', 'scripts/verify-hold-find-address.mjs'];
  const res = spawnSync(npxCmd, npxArgs, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: { ...process.env, VITE_NODE_SUB: '1' },
  });
  process.exit(res.status ?? 1);
}

const { complexNameFromKakao } = await import('../preview/shared/complex-name-from-kakao.js');
const { renderListPagination } = await import('../preview/home-ui/src/list-pagination.js');
const { normalizeLocation } = await import('../preview/shared/location-display.js');

const root = process.cwd();
const read = (rel) => readFileSync(resolve(root, rel), 'utf8');
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else {
    console.log('PASS:', msg);
  }
}

function sliceFn(src, name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) return '';
  const nextFn = src.indexOf('\nfunction ', start + 10);
  const nextExport = src.indexOf('\nexport ', start + 10);
  let end = src.length;
  if (nextFn > 0) end = Math.min(end, nextFn);
  if (nextExport > 0) end = Math.min(end, nextExport);
  return src.slice(start, end);
}

const surface = read('preview/search-ui/src/search-find-surface.js');
const api = read('preview/search-ui/src/search-api.js');
const enums = read('preview/search-ui/src/search-enums.js');
const tier = read('preview/search-ui/src/search-tier-render.js');
const searchPhp = read('src/Search/SearchService.php');
const regionsPhp = read('public/api/auth/regions.php');
const guLink = read('src/Region/RegionGuLink.php');
const basic = read('src/Auth/BasicRegisterService.php');
const sync = read('src/StudyRoom/StudyRoomRegisterService.php');
const homeSeed = read('preview/home-ui/src/study-room-home-seed.js');
const helper = read('preview/shared/complex-name-from-kakao.js');
const guestSearch = read('public/api/search/search.php');
const form = read('preview/shared/study-room-basic-form.js');

assert(!/if \(tab === 'room'\) return false;/.test(surface), '1 공부방 구 미선택 early-return 삭제');
assert(!/studentHopeType === 'study_room'\) return false;/.test(surface), '1 학생 공부방 early-return 삭제');
const guPickBody = sliceFn(surface, 'guPickIncomplete');
assert(
  guPickBody.includes('return true;') &&
    guPickBody.includes('f_sigungu_region_id') &&
    !/if \(tab === 'room'\) return false/.test(guPickBody),
  '1 숨은 시군구 id 없으면 검색 막음',
);
const scopeBody = sliceFn(surface, 'findScopeMissing');
assert(
  scopeBody.includes('sigungu_region_id') && scopeBody.includes('region_id') && scopeBody.includes('complex_id'),
  '1 URL 복원도 같은 거절',
);
assert(surface.includes('시·군·구까지 선택해 주세요'), '1 안내 문구');
assert(!surface.includes('지역 조건 없이 검색'), '1 옛 무조건 검색 문구 0');
assert(/function findScopeMissing[\s\S]*sigungu_region_id[\s\S]*region_id[\s\S]*complex_id/.test(surface), '1 URL 복원도 같은 거절');

// (a) studentFeedFilters
const feedFiltersBody = sliceFn(surface, 'studentFeedFilters');
assert(!feedFiltersBody.includes('region_label'), 'studentFeedFilters region_label 반환 경로 0');
assert(
  feedFiltersBody.includes('sigungu_region_id') &&
    (feedFiltersBody.includes('resolveCanonicalGuRegionId') || feedFiltersBody.includes('selectableFindRegionId')),
  'studentFeedFilters 동 단위면 sigungu_region_id 또는 null',
);

// (b) findScopeMissing 분기에서 searchExposureItems = [] · searchExecuted = true · searchError = GU_PICK_HINT 삭제 및 안내 유지
const runFiltersBody = sliceFn(surface, 'runFindSearchWithFilters');
const scopeMissingMatch = runFiltersBody.match(/if\s*\(findScopeMissing\(tab,\s*filters\)\)\s*\{([\s\S]*?)\}/);
const scopeMissingBlock = scopeMissingMatch ? scopeMissingMatch[1] : '';
assert(scopeMissingBlock !== '', 'findScopeMissing 분기 존재');
assert(!scopeMissingBlock.includes('searchExposureItems = []'), 'findScopeMissing searchExposureItems = [] 삭제');
assert(!scopeMissingBlock.includes('searchExecuted = true'), 'findScopeMissing searchExecuted = true 삭제');
assert(!scopeMissingBlock.includes('searchError = GU_PICK_HINT'), 'findScopeMissing searchError = GU_PICK_HINT 삭제');
assert(scopeMissingBlock.includes('findScopeHint'), 'findScopeMissing 안내 문구 state.findScopeHint 남김');
assert(scopeMissingBlock.includes('state._needsSearchRestore = false'), 'findScopeMissing _needsSearchRestore = false 유지');

assert(/\$guOnly[\s\S]*\$exposureTier = 'basic'/.test(searchPhp), '2 구 검색 서버 basic');
assert(/options\.step3Prime[\s\S]*renderProviderTierResults\(/.test(tier), '2 3단계는 프라임 렌더');
assert(/primeSlots:\s*Number\(s\.prime_slots\)\s*\|\|\s*3/.test(read('preview/home-ui/src/exposure-rules.js')), '2 프라임 칸 기본 3');
assert(!/renderProviderFlatResults\('study_room'[\s\S]{0,120}step3Prime/.test(tier), '2 구 검색은 플랫 경로');

const pageHtml = renderListPagination('find-server', 21, 1, 20);
assert(pageHtml.includes('data-page="2"'), '3 total 21 → 페이지 2');
assert(pageHtml.includes('data-page="1"'), '3 페이지 1 버튼');
assert(/limit:\s*20/.test(surface) && /limit \?\? 20/.test(api), '3 1쪽 요청 20');
assert(/searchTotal = Number\(result\.total\)/.test(surface), '3 건수 = 서버 total');
assert(surface.includes('${state.searchTotal}건'), '3 건수 문구가 total');

assert(!/both:\s*'과외쌤\+공부방'/.test(enums), '4 both 라벨 0');
assert(!surface.includes('과외쌤+공부방'), '4 화면 both 문구 0');
assert(
  /field\.key === 'preferred_lesson_type' \? '' : '<option value="">선택<\/option>'/.test(surface),
  '4 희망 유형만 빈 선택 제거',
);
const labels = enums.slice(enums.indexOf('PREFERRED_LESSON_TYPE_LABELS'), enums.indexOf('FACILITY_LABELS'));
assert(labels.includes("tutor: '과외쌤'") && labels.includes("study_room: '공부방'") && !labels.includes('both'), '4 희망 옵션 2');

assert(/srr_cx\.complex_id = :complex_id/.test(searchPhp), '5 공부방 complex WHERE');
assert(/preferred_studyroom_complex_id = :preferred_studyroom_complex_id/.test(searchPhp), '5 학생 complex WHERE');
assert(/SELECT id FROM complexes WHERE region_id = \? AND name = \? AND is_active = 1 LIMIT 1/.test(regionsPhp), '5 complex-by-name trim 정확 SELECT');
assert(!/INSERT INTO complexes/.test(regionsPhp), '5 regions.php INSERT 0');
assert(!/ComplexEnsure/.test(surface) && !/ComplexEnsure/.test(api), '5 검색 화면 ComplexEnsure 0');
assert(!/LIKE/.test(regionsPhp.slice(regionsPhp.indexOf("complex-by-name"), regionsPhp.indexOf("complex-by-name") + 900)), '5 단지명 LIKE 0');

assert(!existsSync(resolve(root, 'src/Region/AddressRegionMatch.php')), '6 AddressRegionMatch.php 삭제');
assert(!basic.includes('AddressRegionMatch::match') && !sync.includes('AddressRegionMatch::match'), '6 match 호출 0');
assert(!basic.includes('$cname = $caddr') && !sync.includes('$cname = $caddr'), '6 cname = $caddr 0');
assert(/function saveFacility\(/.test(sync) && /profile_status/.test(sync), '6 saveFacility 숨김 가드 유지');

assert(!/from ['"].*input-fill\.js['"]/.test(helper), '7 헬퍼 input-fill import 0');
assert(!/data-input-fill/.test(surface), '7 찾기 data-input-fill 0');
assert(form.includes('complexNameFromKakao'), '7 등록 폼이 단지명 1함수를 씀');
assert(!/function complexPlaceLabel/.test(form), '7 complexPlaceLabel 삭제');
assert(/apartment === true/.test(helper), '7 apartment === true');

assert(/rejectRegionLabel\(\$filters,\s*'region_label'\)/.test(searchPhp), '8 공부방 region_label 거절');
assert(!/filters\.region_label = asText\(filters\.region_id\)/.test(api), '8 클라 region_label 승격 삭제');
assert(/36000/.test(guLink) && /36110/.test(guLink), '8 세종 36000 → 36110');
const seedFn = homeSeed.slice(homeSeed.indexOf('export function studyRoomHomeSearchFilters'), homeSeed.indexOf('export function bootStudyRoomHome'));
assert(!/region_label\s*=/.test(seedFn), '9 홈 시드 region_label 대입 0');
assert(!/sigungu_region_id/.test(seedFn), '9 홈 시군구 전환 없음');

const guestSlice = guestSearch.split('\n').slice(60, 76).join('\n');
assert(guestSlice.includes('대치동') && guestSlice.includes('강남구') && guestSlice.includes('guestScopedFilters'), '9 게스트 search.php:61-76 대치동/강남구 유지');
assert(/GUEST_BASE_GU_OFFICIAL_CODE = '1168000000'/.test(guLink), '9 게스트 강남구 코드 유지');
assert(/GUEST_BASE_GU_OFFICIAL_CODE/.test(searchPhp), '9 검색이 강남구 코드를 사용');

for (const rel of [
  'preview/search-ui/src/search-find-surface.js',
  'preview/search-ui/src/search-api.js',
  'preview/search-ui/src/search-enums.js',
  'preview/search-ui/src/search-schema.js',
  'preview/search-ui/src/search-tier-render.js',
  'preview/search-ui/src/screens/search-page.js',
  'preview/search-ui/src/student-hope-type.js',
  'preview/shared/study-room-basic-form.js',
  'preview/shared/complex-name-from-kakao.js',
  'preview/home-ui/src/study-room-home-seed.js',
]) {
  assert(!read(rel).includes('학부모'), `9 ${rel} 학부모 0`);
}

assert(complexNameFromKakao({ apartment: true, buildingName: ' 래미안대치팰리스 ' }) === '래미안대치팰리스', 'C1 trim 이름');
assert(complexNameFromKakao({ apartment: 'Y', buildingName: '래미안' }) === '', 'C1 문자 Y 는 빈값');
assert(complexNameFromKakao({ apartment: true, buildingName: '   ' }) === '', 'C1 빈 이름');
assert(complexNameFromKakao({ apartment: false, buildingName: '래미안' }) === '', 'C1 apartment false');

const HOLD_PROBE_PHP = String.raw`<?php
declare(strict_types=1);
require_once getcwd() . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Region\RegionGuLink;
use Study114\Search\SearchService;

final class HoldStmt
{
    private array $rows = [];
    private array $colRows = [];
    private mixed $column = false;
    private int $cursor = 0;
    private bool $columnFetched = false;
    private array $bound = [];

    public function __construct(private HoldPdo $pdo, private string $sql) {}

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

final class HoldPdo extends PDO
{
    public array $log = [];

    public function __construct() {}

    #[\ReturnTypeWillChange]
    public function prepare(string $q, array $o = []): HoldStmt
    {
        return new HoldStmt($this, $q);
    }

    public function answer(string $sql, array $p): array
    {
        if (str_contains($sql, 'information_schema')) {
            return ['column' => false];
        }
        if (str_contains($sql, 'dong_name = :dong_name')) {
            return ['column' => 100];
        }
        if (str_contains($sql, 'official_code = ?')) {
            return ['column' => (($p[0] ?? '') === '1168000000') ? 27 : false];
        }
        if (str_contains($sql, 'is_selectable = 1')) {
            return ['column' => in_array((int) ($p[0] ?? 0), [27, 360, 500], true) ? 1 : false];
        }
        if (str_contains($sql, 'SELECT d.id')) {
            $gu = (int) ($p[0] ?? 0);
            if ($gu === 360) {
                return ['col_rows' => [361101]];
            }
            return ['col_rows' => [100]];
        }
        if (str_contains($sql, 'COUNT(DISTINCT sr.id)') || str_contains($sql, 'FROM study_rooms sr')) {
            $ids = $this->roomIds($sql, $p);
            if (str_contains($sql, 'COUNT(DISTINCT sr.id)')) {
                return ['column' => count($ids)];
            }
            return ['rows' => array_map(static fn (int $id): array => holdRoomRow($id), $ids)];
        }
        if (str_contains($sql, 'COUNT(DISTINCT s.id)') || str_contains($sql, 'FROM students s')) {
            $rows = $this->studentRows($sql, $p);
            if (str_contains($sql, 'COUNT(DISTINCT s.id)')) {
                return ['column' => count($rows)];
            }
            return ['rows' => $rows];
        }
        return ['column' => false, 'rows' => []];
    }

    private function roomIds(string $sql, array $p): array
    {
        $rooms = [
            ['id' => 1, 'region' => 100, 'complex' => 0],
            ['id' => 2, 'region' => 100, 'complex' => 9],
            ['id' => 3, 'region' => 200, 'complex' => 77],
        ];
        $ids = [];
        foreach ($rooms as $room) {
            if (str_contains($sql, '1 = 0')) {
                continue;
            }
            if (str_contains($sql, 'srr.region_id = :region_id') && (int) $room['region'] !== (int) ($p['region_id'] ?? 0)) {
                continue;
            }
            if (str_contains($sql, 'srr_cx.complex_id') && (int) $room['complex'] !== (int) ($p['complex_id'] ?? 0)) {
                continue;
            }
            if (str_contains($sql, 'srr_sg.region_id IN')) {
                $dongs = [];
                foreach ($p as $k => $v) {
                    if (str_starts_with((string) $k, 'sg_promo_')) {
                        $dongs[] = (int) $v;
                    }
                }
                if (!in_array((int) $room['region'], $dongs, true)) {
                    continue;
                }
            }
            $ids[] = $room['id'];
        }
        return $ids;
    }

    private function studentRows(string $sql, array $p): array
    {
        $students = [
            ['id' => 10, 'lesson' => 'study_room', 'dong' => 100, 'complex' => 1, 'tutor_region' => 0],
            ['id' => 11, 'lesson' => 'study_room', 'dong' => 300, 'complex' => 88, 'tutor_region' => 0],
        ];
        $rows = [];
        foreach ($students as $s) {
            if (str_contains($sql, '1 = 0')) {
                continue;
            }
            if (str_contains($sql, 'preferred_lesson_type = :preferred_lesson_type') && $s['lesson'] !== (string) ($p['preferred_lesson_type'] ?? '')) {
                continue;
            }
            if (str_contains($sql, 'preferred_studyroom_complex_id = :preferred_studyroom_complex_id') && (int) $s['complex'] !== (int) ($p['preferred_studyroom_complex_id'] ?? 0)) {
                continue;
            }
            $dongHit = false;
            $sawDong = false;
            if (str_contains($sql, 'preferred_studyroom_region_id IN')) {
                $sawDong = true;
                foreach ($p as $k => $v) {
                    if (str_starts_with((string) $k, 'sr_gu_dong_') || str_starts_with((string) $k, 'guest_dong_')) {
                        if ((int) $s['dong'] === (int) $v) {
                            $dongHit = true;
                        }
                    }
                }
            }
            $tutorHit = str_contains($sql, 'preferred_tutor_region_id = :guest_gu_id')
                && (int) $s['tutor_region'] === (int) ($p['guest_gu_id'] ?? -1);
            if ($sawDong || str_contains($sql, 'preferred_tutor_region_id = :guest_gu_id')) {
                if (!$dongHit && !$tutorHit) {
                    continue;
                }
            }
            $rows[] = [
                'id' => $s['id'],
                'public_display_name' => '학생' . $s['id'],
                'grade_level' => '',
                'gender' => '',
                'lesson_format' => null,
                'student_gender_group' => null,
                'preferred_student_count_group' => null,
                'preferred_fee_amount' => null,
                'preferred_studyroom_fee_amount' => null,
                'preferred_lesson_type' => $s['lesson'],
                'request_summary' => null,
                'special_request_note' => null,
                'published_at' => null,
                'created_at' => null,
                'budget_amount' => null,
                'dong_name' => $s['dong'] === 100 ? '대치동' : '신곡동',
                'sigungu_name' => $s['dong'] === 100 ? '강남구' : '의정부시',
                'sido_name' => '',
                'complex_name' => '',
                'subject_name' => null,
            ];
        }
        return $rows;
    }
}

function holdRoomRow(int $id): array
{
    return [
        'id' => $id,
        'study_room_name' => '방' . $id,
        'price_amount' => 100000,
        'intro_short' => '',
        'intro_long' => '',
        'main_subject_note' => '',
        'teaching_style' => '',
        'grade_band' => '',
        'audience_label' => '',
        'feature_1' => '',
        'feature_2' => '',
        'feature_3' => '',
        'slogan' => '',
        'lesson_place_type' => null,
        'capacity_per_time' => null,
        'lesson_operation_type' => null,
        'facility_note' => '',
        'inquiry_status' => '',
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
        'complex_name' => '',
        'promo_dong_name' => '대치동',
        'promo_sigungu_name' => '강남구',
        'promo_complex_name' => '',
        'promo_basis' => 'dong',
        'image_path_prime' => '',
        'image_path_basic' => '',
    ];
}

function holdOk(string $name, bool $cond, string $detail = ''): void
{
    if ($cond) {
        echo 'PASS: ' . $name . ($detail === '' ? '' : ' ' . $detail) . "\n";
        return;
    }
    echo 'FAIL: ' . $name . ($detail === '' ? '' : ' — ' . $detail) . "\n";
}

function holdIds(array $result): array
{
    $out = array_map(static fn (array $it): int => (int) $it['id'], $result['items'] ?? []);
    sort($out);
    return $out;
}

function holdCountSql(HoldPdo $pdo): string
{
    $sql = '';
    foreach ($pdo->log as $line) {
        if (str_contains($line, 'COUNT(DISTINCT')) {
            $sql = $line;
        }
    }
    return $sql;
}

$pdo = new HoldPdo();
(new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);
$search = new SearchService();

$stu = $search->guestScopedFilters('student', [
    'preferred_lesson_type' => 'study_room',
    'preferred_studyroom_complex_id' => 88,
]);
holdOk(
    'R11 게스트 학생 complex 키 0 · preferred_region_id 강남구',
    is_array($stu) && !array_key_exists('preferred_studyroom_complex_id', $stu) && (int) ($stu['preferred_region_id'] ?? 0) === 27,
    json_encode($stu, JSON_UNESCAPED_UNICODE)
);
$roomF = $search->guestScopedFilters('room', ['complex_id' => 77, 'region_id' => 200]);
holdOk(
    'R11 게스트 공부방 complex_id 0 · region_id 대치동',
    is_array($roomF) && !array_key_exists('complex_id', $roomF) && (int) ($roomF['region_id'] ?? 0) === 100,
    json_encode($roomF, JSON_UNESCAPED_UNICODE)
);

$pdo->log = [];
$guestStuEmpty = $search->search('student', is_array($search->guestScopedFilters('student', [])) ? $search->guestScopedFilters('student', []) : [], 1, 20);
$guestStuComplex = $search->search('student', is_array($stu) ? $stu : [], 1, 20);
$outside = 0;
foreach ($guestStuComplex['items'] ?? [] as $item) {
    if ((int) $item['id'] === 11) {
        $outside++;
    }
}
holdOk(
    'R11 게스트 학생 단지 우회 id 집합 = 빈 필터 · 강남구 밖 0',
    holdIds($guestStuComplex) === holdIds($guestStuEmpty) && $outside === 0,
    json_encode(holdIds($guestStuComplex)) . '=' . json_encode(holdIds($guestStuEmpty)) . ' outside=' . $outside
);

$guestRoomEmpty = $search->search('room', is_array($search->guestScopedFilters('room', [])) ? $search->guestScopedFilters('room', []) : [], 1, 20);
$guestRoomComplex = $search->search('room', is_array($roomF) ? $roomF : [], 1, 20);
holdOk(
    'R11 게스트 공부방 단지 우회 id 집합 = 빈 필터',
    holdIds($guestRoomComplex) === holdIds($guestRoomEmpty) && !in_array(3, holdIds($guestRoomComplex), true),
    json_encode(holdIds($guestRoomComplex)) . '=' . json_encode(holdIds($guestRoomEmpty))
);

$pdo->log = [];
$byGu = $search->search('room', ['sigungu_region_id' => 500], 1, 20);
$tiersOk = ($byGu['items'] ?? []) !== [] ;
foreach ($byGu['items'] ?? [] as $item) {
    if (($item['exposure_tier'] ?? '') !== 'basic' || ($item['position_sku'] ?? null) !== null) {
        $tiersOk = false;
    }
}
holdOk('R11 구 검색 exposure_tier=basic · position_sku=null', $tiersOk && count($byGu['items'] ?? []) > 0, json_encode(array_map(static fn ($it) => [$it['id'], $it['exposure_tier'], $it['position_sku']], $byGu['items'] ?? [])));

$pdo->log = [];
$onlyComplex = $search->search('room', ['complex_id' => 9], 1, 20);
holdOk('R11 complex_id만 SQL에 srr_cx.complex_id', str_contains(holdCountSql($pdo), 'srr_cx.complex_id'), holdCountSql($pdo));
$otherComplex = 0;
foreach ($onlyComplex['items'] ?? [] as $item) {
    if ((int) $item['id'] !== 2) {
        $otherComplex++;
    }
}
holdOk('R11 complex_id만 다른 complex 카드 0', holdIds($onlyComplex) === [2] && $otherComplex === 0, json_encode(holdIds($onlyComplex)));

$pdo->log = [];
$byRegion = $search->search('room', ['region_id' => 100], 1, 20);
$pdo->log = [];
$both = $search->search('room', ['region_id' => 100, 'complex_id' => 9], 1, 20);
holdOk('R11 region_id+complex_id SQL에 srr_cx 없음', !str_contains(holdCountSql($pdo), 'srr_cx'), holdCountSql($pdo));
holdOk(
    'R11 region_id+complex_id id 집합 = region_id',
    holdIds($both) === holdIds($byRegion) && (int) $both['total'] === (int) $byRegion['total'],
    json_encode(holdIds($both)) . ' total=' . $both['total'] . '/' . $byRegion['total']
);

$pdo->log = [];
$threw = false;
$msg = '';
try {
    $search->search('room', ['region_label' => '대치동'], 1, 20);
} catch (InvalidArgumentException $e) {
    $threw = true;
    $msg = $e->getMessage();
}
holdOk('R11 region_label 예외', $threw && $msg === '지역은 구(시·군)까지 선택해 주세요.', $msg);

$pdo->log = [];
$search->search('student', ['preferred_lesson_type' => 'study_room', 'preferred_region_id' => 27], 1, 20);
$studentSql = holdCountSql($pdo);
holdOk(
    'R11 학생 구 SQL에 study_room + 동 IN',
    str_contains($studentSql, "preferred_lesson_type = 'study_room'") && str_contains($studentSql, 'preferred_studyroom_region_id IN'),
    $studentSql
);

$before = count($pdo->log);
$sejongIds = RegionGuLink::dongIdsUnderGu(360);
$sejongSql = implode("\n", array_slice($pdo->log, $before));
holdOk(
    'R11 세종 36000 행 동 목록에 36110 동',
    in_array(361101, $sejongIds, true) && str_contains($sejongSql, '36110'),
    json_encode($sejongIds)
);

exit(0);
`;

const hasPhp = (() => {
  try {
    const chk = spawnSync('php', ['-v'], { encoding: 'utf8' });
    return chk.status === 0;
  } catch {
    return false;
  }
})();

if (hasPhp) {
  const probe = spawnSync('php', [], {
    cwd: root,
    input: HOLD_PROBE_PHP,
    encoding: 'utf8',
  });
  const probeOut = `${probe.stdout || ''}`;
  let behaviorPass = 0;
  for (const line of probeOut.split(/\r?\n/)) {
    if (line.startsWith('PASS:')) {
      behaviorPass += 1;
      console.log(line);
    } else if (line.startsWith('FAIL:')) {
      failed += 1;
      console.error(line);
    } else if (line.trim()) {
      console.log(line);
    }
  }
  assert(
    probe.status === 0 && !/Fatal error|Uncaught/.test(`${probe.stderr || ''}${probeOut}`),
    `R11 PHP 가짜 PDO 종료 0 (${probe.status} ${(probe.stderr || '').slice(0, 500)})`,
  );
  assert(behaviorPass >= 6, `R11 행동 단언 ${behaviorPass}개`);
} else {
  console.log('PASS: R11 PHP 검사 미실행(php 없음)');
}

assert(form.includes('seq !== businessEnsureSeq'), '5f 사업장 순번');
assert(form.includes('slotEnsureSeq.get(slotKey) !== seq'), '5f 홍보 순번');
assert(form.includes('seq !== hopeEnsureSeq'), '5f 학생 순번');
assert(surface.includes('seq !== studyroomDongSeq'), '5f confirmStudyroomDong 순번');
assert(/basis===complex|region_basis_type === 'complex'[\s\S]{0,180}complex_name/.test(form), '5c 단지명 필수');

const roomOf = (raw) => normalizeLocation({ raw }, 'room');
const tutorOf = (raw) => normalizeLocation({ raw }, 'tutor');
assert(roomOf('서울특별시').displayLabel === '', 'S3 공부방 서울특별시 display 빈값');
assert(roomOf('경기도').displayLabel === '', 'S3 공부방 경기도 display 빈값');
const gangnam = roomOf('서울특별시 강남구');
assert(gangnam.displayLabel === '서울특별시 강남구', 'S3 공부방 서울특별시 강남구 표시');
assert(gangnam.apartmentName === '', 'S3 강남구 apartmentName 빈값');
assert(gangnam.regionKey === '서울특별시|강남구', 'S3 강남구 regionKey');
assert(gangnam.level === 'district', 'S3 강남구 level district');
const sejong = roomOf('세종특별자치시');
assert(sejong.displayLabel === '세종특별자치시', 'S3 세종 표시');
assert(sejong.apartmentName === '', 'S3 세종 apartmentName 빈값');
assert(sejong.regionKey === '', 'S3 세종 regionKey 빈값');
assert(roomOf('경기도 의정부시').displayLabel === '경기도 의정부시', 'S3 경기도 의정부시 표시');
assert(roomOf('서울시 강남구').displayLabel === '서울시 강남구', 'S3 서울시 강남구 표시');
assert(roomOf('대치동 · 은마아파트').displayLabel === '대치동 · 은마아파트', 'S3 단지 표시');
assert(roomOf('서울 강남구 대치동').displayLabel === '서울 강남구 대치동', 'S3 동 표시');
assert(roomOf('강남구').displayLabel === '', 'S3 구 단독 display 빈값');
assert(tutorOf('서울특별시 강남구').displayLabel === '서울특별시 강남구', 'S3 과외 강남구');
assert(tutorOf('서울특별시').displayLabel === '서울특별시', 'S3 과외 서울특별시');
assert(tutorOf('경기도').displayLabel === '경기도', 'S3 과외 경기도');
assert(tutorOf('세종특별자치시').displayLabel === '세종특별자치시', 'S3 과외 세종');
assert(tutorOf('세종특별자치시').regionKey === '세종특별자치시', 'S3 과외 세종 regionKey');
assert(tutorOf('경기도 의정부시').displayLabel === '경기도 의정부시', 'S3 과외 의정부');
assert(tutorOf('대치동 · 은마아파트').apartmentName === '은마아파트', 'S3 과외 단지 apartmentName');
assert(tutorOf('서울 강남구 대치동').regionKey === '서울|강남구|대치동', 'S3 과외 동 regionKey');
assert(tutorOf('강남구').displayLabel === '강남구', 'S3 과외 강남구 단독');

const pageSrc = read('preview/search-ui/src/screens/search-page.js');
const restoreBody = sliceFn(pageSrc, 'afterSearchPageMount');
assert(
  restoreBody.includes('whenFindCitiesReady') && restoreBody.includes('runFindSearchWithFilters'),
  'S1 복원 검색은 단위 목록 로드 뒤',
);
const refreshBody = sliceFn(surface, 'refreshSearchedLabelWhenCitiesReady');
assert(
  refreshBody.includes('findCitiesStatus') &&
    refreshBody.includes('applySearchedRegionLabel') &&
    refreshBody.includes('syncFindHashState'),
  'S1 목록 로드 뒤 라벨 재계산',
);
const gpsBody = sliceFn(surface, 'bootFindGpsIfNeeded');
assert(
  gpsBody.includes('noDongPlace') && gpsBody.includes("reason: 'broad-region-only'"),
  'S3 GPS 공부방 동 없는 결과 건너뜀',
);
const step3Body = sliceFn(surface, 'applyStep3FromKakao');
assert(
  step3Body.includes('normalizeLocation({ raw: dongName, dong: dongName }, \'room\')') &&
    !step3Body.includes("join(' ')"),
  'S4 동 표시는 공부방 축 동 라벨',
);

const behaviorSrc = `
const citiesReady = {};
citiesReady.promise = new Promise((resolve) => { citiesReady.go = resolve; });
const mem = new Map();
const storage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() { return mem.size; },
};
globalThis.localStorage = storage;
globalThis.sessionStorage = storage;
globalThis.window = globalThis;
globalThis.location = { hash: '#/search/tutor', href: 'http://127.0.0.1:5174/search/', origin: 'http://127.0.0.1:5174', pathname: '/search/', search: '' };
globalThis.history = { replaceState(_s, _t, url) { const text = String(url || ''); if (text.startsWith('#')) location.hash = text; }, pushState() {} };
let searchCalls = 0;
globalThis.fetch = async (input) => {
  const url = String(input);
  if (url.includes('action=cities')) {
    await citiesReady.promise;
    return { ok: true, json: async () => ({ ok: true, cities: [
      { id: 27, label: '강남구', sido_code: '11', sido_name: '서울특별시', official_code: '1168000000', city_name: '강남구', gu_name: '', kind: 'gu' },
    ] }) };
  }
  searchCalls += 1;
  return { ok: true, json: async () => ({ ok: true, items: [], total: 21 }) };
};
const surfaceMod = await import('../search-ui/src/search-find-surface.js');
const lateState = { role: 'tutor', searchPage: 1, searchExecuted: false, searchTotal: 0, searchExposureItems: [], canonicalLocation: null, activeRegionLabel: '' };
const lateRun = surfaceMod.runFindSearchWithFilters('tutor', { tutor_region_id: '27' }, lateState, 'tutor', () => {});
await Promise.resolve();
console.log((/^\\d+$/.test(String(lateState.activeRegionLabel || '')) ? 'PASS' : 'FAIL') + ': S1 목록 전 라벨은 숫자 id (' + lateState.activeRegionLabel + ')');
citiesReady.go();
await lateRun;
await new Promise((r) => setTimeout(r, 50));
console.log((lateState.activeRegionLabel === '서울특별시 강남구' ? 'PASS' : 'FAIL') + ': S1 목록 뒤 강남구 (' + lateState.activeRegionLabel + ')');
console.log((!/^\\d+$/.test(String(lateState.activeRegionLabel || '')) ? 'PASS' : 'FAIL') + ': S1 숫자 id 0');
for (const kind of ['dong', 'complex', 'pending']) {
  const blocked = {
    role: 'study_room', searchPage: 2, searchExecuted: true, searchTotal: 21,
    searchExposureItems: [{ id: 1 }], searchRows: [{ id: 1 }], searchItems: [{ id: 1 }],
    activeRegionLabel: '대치동',
    canonicalLocation: { displayLabel: '대치동', source: 'session', dong: '대치동' },
    lastSearchFilters: { region_id: '100' },
    step3ByTab: { room: { basis: kind === 'complex' ? 'complex' : 'dong', display: kind === 'complex' ? '은마아파트' : '', dongId: '', complexId: '', unconfirmed: kind !== 'pending', pending: kind === 'pending', seq: 1 } },
  };
  const callsBefore = searchCalls;
  const hashBefore = String(globalThis.location.hash || '');
  await surfaceMod.runFindSearchWithFilters('room', { sigungu_region_id: '27' }, blocked, 'study_room', () => {});
  console.log((searchCalls === callsBefore ? 'PASS' : 'FAIL') + ': S5 ' + kind + ' search.php 0');
  console.log((blocked.searchTotal === 21 ? 'PASS' : 'FAIL') + ': S5 ' + kind + ' 건수 유지');
  console.log((blocked.activeRegionLabel === '대치동' ? 'PASS' : 'FAIL') + ': S5 ' + kind + ' 현재위치 유지 (' + blocked.activeRegionLabel + ')');
  console.log((String(globalThis.location.hash || '') === hashBefore ? 'PASS' : 'FAIL') + ': S5 ' + kind + ' URL 유지');
}
`;

const behaviorFile = resolve(root, 'preview/home-ui/.hold-s1-behavior.mjs');
writeFileSync(behaviorFile, behaviorSrc);
let behavior;
try {
  const npxCmd = process.platform === 'win32' ? 'cmd.exe' : 'npx';
  const npxArgs = process.platform === 'win32'
    ? ['/d', '/s', '/c', 'npx --yes vite-node .hold-s1-behavior.mjs']
    : ['--yes', 'vite-node', '.hold-s1-behavior.mjs'];
  behavior = spawnSync(npxCmd, npxArgs, {
    cwd: resolve(root, 'preview/home-ui'),
    encoding: 'utf8',
  });
} finally {
  try { unlinkSync(behaviorFile); } catch { /* ignore */ }
}
const behaviorOut = `${behavior.stdout || ''}\n${behavior.stderr || ''}`;
for (const line of behaviorOut.split(/\r?\n/)) {
  if (line.startsWith('PASS:')) console.log(line);
  else if (line.startsWith('FAIL:')) {
    failed += 1;
    console.error(line);
  }
}
assert(behavior.status === 0 && /S1 목록 뒤 강남구/.test(behavior.stdout || ''), `S1 행동 종료 0 (${behavior.status} ${(behavior.stderr || '').slice(0, 400)})`);

if (failed > 0) {
  console.error(`\nverify-hold-find-address FAILED (${failed})`);
  process.exit(1);
}
console.log('\nverify-hold-find-address OK');
