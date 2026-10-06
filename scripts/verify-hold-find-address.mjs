/**
 * 보류 묶음 찾기 주소 — 정적·가짜응답 합격 (운영 DB·라이브 호출 없음)
 * 실행: npx --yes vite-node scripts/verify-hold-find-address.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { complexNameFromKakao } from '../preview/shared/complex-name-from-kakao.js';
import { renderListPagination } from '../preview/home-ui/src/list-pagination.js';

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
assert(/function guPickIncomplete[\s\S]*return true;/.test(surface), '1 숨은 시군구 id 없으면 검색 막음');
assert(surface.includes('시·군·구까지 선택해 주세요'), '1 안내 문구');
assert(!surface.includes('지역 조건 없이 검색'), '1 옛 무조건 검색 문구 0');
assert(/function findScopeMissing[\s\S]*sigungu_region_id[\s\S]*region_id[\s\S]*complex_id/.test(surface), '1 URL 복원도 같은 거절');

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

assert(form.includes('seq !== businessEnsureSeq'), '5f 사업장 순번');
assert(form.includes('slotEnsureSeq.get(slotKey) !== seq'), '5f 홍보 순번');
assert(form.includes('seq !== hopeEnsureSeq'), '5f 학생 순번');
assert(surface.includes('seq !== studyroomDongSeq'), '5f confirmStudyroomDong 순번');
assert(/basis===complex|region_basis_type === 'complex'[\s\S]{0,180}complex_name/.test(form), '5c 단지명 필수');

if (failed > 0) {
  console.error(`\nverify-hold-find-address FAILED (${failed})`);
  process.exit(1);
}
console.log('\nverify-hold-find-address OK');
