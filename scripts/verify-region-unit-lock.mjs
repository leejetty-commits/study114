/**
 * verify-region-unit-lock.mjs
 * 과외 구·시·군 단위 통일 및 옛 데이터 오류 방지 검사 (정본 72)
 *
 * 검사 항목:
 * (a) INSERT INTO tutor_regions 가 있는 모든 PHP 파일에서 그 저장 경로가 assertSelectable 을 거치는지
 *     (파일에 INSERT가 있으면 같은 파일에 assertSelectable 호출이 있어야 함 — src/ 전체를 훑음).
 *     preferred_tutor_region_id 를 쓰는 저장 파일도 동일.
 * (b) SearchService.php 가 tutor_region_id · preferred_region_id 에 selectableRegionId 사용.
 * (c) 과외쌤 홈 두 파일(tutor-home-seed.js, tutor-activity-chart.js)이 옛 값 안내를 처리
 *     (region_selectable 참조 또는 안내 문구 상수, searchApi 422 우회).
 * (d) 서버 슬롯 페이로드에 region_selectable 포함(TutorHubRepository, TutorRegisterService).
 * (e) [R1 회귀 방지] 빈 슬롯(region_id: '')은 region_selectable: false 라도 stale/다시선택필요 가 뜨지 않음.
 * (f) [R2/R3 방지] searchApi error status/code 전달 및 옛 미정의 지역 '옛 지역' 라벨 대체.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
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

function findPhpFiles(dir) {
  const results = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      results.push(...findPhpFiles(full));
    } else if (entry.endsWith('.php')) {
      results.push(full);
    }
  }
  return results;
}

function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('#'))
    .join('\n');
}

console.log('##### 1. 저장 경로 assertSelectable 검사 (a) #####');

const srcPhpFiles = findPhpFiles(join(ROOT, 'src'));

// (a-1) INSERT INTO tutor_regions
const tutorRegionInsertFiles = srcPhpFiles.filter((file) => {
  const content = readFileSync(file, 'utf8');
  return /INSERT\s+INTO\s+tutor_regions/i.test(content);
});

ok('tutor_regions 저장 파일 1개 이상 존재', tutorRegionInsertFiles.length > 0, `found: ${tutorRegionInsertFiles.length}`);

for (const file of tutorRegionInsertFiles) {
  const rel = file.replace(ROOT + '\\', '').replace(ROOT + '/', '');
  const content = readFileSync(file, 'utf8');
  const code = stripComments(content);
  const hasAssert = /assertSelectable\s*\(/.test(code);
  ok(`(a) ${rel}: tutor_regions 저장 전 assertSelectable 호출`, hasAssert, `file lacks assertSelectable`);
}

// (a-2) preferred_tutor_region_id 저장 파일
const preferredTutorRegionSaveFiles = srcPhpFiles.filter((file) => {
  const content = readFileSync(file, 'utf8');
  if (!content.includes('preferred_tutor_region_id')) return false;
  // 저장(INSERT/UPDATE/save/patch) 로직이 있는지 확인
  const isSaveFile = /INSERT\s+INTO\s+students/i.test(content)
    || /UPDATE\s+students/i.test(content)
    || /function\s+(?:save|update|patch|register|insert)/i.test(content);
  return isSaveFile;
});

ok('preferred_tutor_region_id 저장 파일 1개 이상 존재', preferredTutorRegionSaveFiles.length > 0, `found: ${preferredTutorRegionSaveFiles.length}`);

for (const file of preferredTutorRegionSaveFiles) {
  const rel = file.replace(ROOT + '\\', '').replace(ROOT + '/', '');
  const content = readFileSync(file, 'utf8');
  const code = stripComments(content);
  const hasAssert = /assertSelectable\s*\(/.test(code);
  ok(`(a) ${rel}: preferred_tutor_region_id 저장 전 assertSelectable 호출`, hasAssert, `file lacks assertSelectable`);
}

console.log('\n##### 2. SearchService selectableRegionId 검사 (b) #####');

const searchService = read('src/Search/SearchService.php');
const hasTutorRegionSelectable = /selectableRegionId\s*\(\s*\$pdo\s*,\s*\$filters\s*,\s*['"]tutor_region_id['"]\s*\)/.test(searchService);
const hasPreferredRegionSelectable = /selectableRegionId\s*\(\s*\$pdo\s*,\s*\$filters\s*,\s*['"]preferred_region_id['"]\s*\)/.test(searchService);

ok('(b) SearchService: tutor_region_id 에 selectableRegionId 사용', hasTutorRegionSelectable);
ok('(b) SearchService: preferred_region_id 에 selectableRegionId 사용', hasPreferredRegionSelectable);

console.log('\n##### 3. 과외쌤 홈 옛 값 안내 처리 검사 (c) #####');

const seedJs = read('preview/home-ui/src/tutor-home-seed.js');
const chartJs = read('preview/home-ui/src/tutor-activity-chart.js');
const surfaceJs = read('preview/search-ui/src/search-find-surface.js');
const copyJs = read('preview/home-ui/src/student-reg/student-reg-copy.js');

ok('(c) tutor-home-seed.js: region_selectable 참조', seedJs.includes('region_selectable'));
ok('(c) tutor-home-seed.js: 선택단위 아닐 때 reselect 상태 전환', seedJs.includes("'reselect'"));
ok('(c) tutor-home-seed.js: 틀린 주석 수정(사실에 맞는 설명)', !seedJs.includes('둘 다 SidoRegionEnsure::assertSelectable 을 지난 값이다'));

ok('(c) tutor-activity-chart.js: selectable 확인 및 searchApi 호출 방지', chartJs.includes('selectable === false') || chartJs.includes('!slot.selectable'));
ok('(c) tutor-activity-chart.js: 안내 문구 포함', chartJs.includes('활동지역을 구(시·군)까지 다시 선택해 주세요'));
ok('(c) tutor-activity-chart.js: 지역 수정 링크 연동', chartJs.includes('tutorHomeEditRegionPath'));

ok('(c) student-reg-copy.js: TUTOR_HOME_STUDENT_COPY reselect 문구 등록', copyJs.includes('reselect:') && copyJs.includes('활동지역을 구(시·군)까지 다시 선택해 주세요'));
ok('(c) search-find-surface.js: reselect 안내 화면 및 수정 링크', surfaceJs.includes("status === 'reselect'") && surfaceJs.includes('tutorHomeEditRegionPath'));

console.log('\n##### 4. 서버 슬롯 페이로드 region_selectable 검사 (d) #####');

const tutorHubRepo = read('src/Registration/TutorHubRepository.php');
const tutorRegService = read('src/Tutor/TutorRegisterService.php');

ok('(d) TutorHubRepository: region_selectable 컬럼 조회', tutorHubRepo.includes('region_selectable'));
ok('(d) TutorHubRepository: is_selectable=1 AND is_active=1 조건', /is_selectable\s*=\s*1\s+AND\s+.*is_active\s*=\s*1/i.test(tutorHubRepo));
ok('(d) TutorHubRepository: bool 반환 매핑', tutorHubRepo.includes("'region_selectable' => (bool)"));

ok('(d) TutorRegisterService: region_selectable 컬럼 조회', tutorRegService.includes('region_selectable'));
ok('(d) TutorRegisterService: is_selectable=1 AND is_active=1 조건', /is_selectable\s*=\s*1\s+AND\s+.*is_active\s*=\s*1/i.test(tutorRegService));
ok('(d) TutorRegisterService: bool 반환 매핑', tutorRegService.includes("'region_selectable' => (bool)"));

console.log('\n##### 5. R1 회귀 방지: 빈 슬롯 stale/배지 노출 차단 검사 #####');

const { renderTutorRegionSlot } = await import(pathToFileURL(join(ROOT, 'preview/shared/tutor-region-slots.js')).href);
const sampleUnits = [
  { id: '101', sido_name: '서울특별시', sigungu_name: '강남구' },
  { id: '102', sido_name: '경기도', sigungu_name: '수원시' },
];

// (1) 빈 슬롯 + region_selectable: false -> stale 아님, 배지 없음
const emptySlotHtml = renderTutorRegionSlot(
  { region_id: '', scope_type: 'city', is_primary: false, region_selectable: false },
  1,
  sampleUnits,
);

ok('(R1) 빈 슬롯: data-region-stale 태그에 hidden 속성 있음', emptySlotHtml.includes('data-region-stale hidden'));
ok('(R1) 빈 슬롯: 다시 선택 필요 배지 없음', !emptySlotHtml.includes('다시 선택 필요'));
ok('(R1) 빈 슬롯: stale 안내 문구 미노출', !emptySlotHtml.includes('지역을 다시 선택해 주세요'));

// (2) 옛 값 슬롯(선택단위 아님) -> stale 노출, 다시 선택 필요 배지 있음
const staleSlotHtml = renderTutorRegionSlot(
  { region_id: '999', scope_type: 'city', is_primary: false, region_selectable: false },
  1,
  sampleUnits,
);

ok('(R1) 옛 슬롯: 다시 선택 필요 배지 노출', staleSlotHtml.includes('다시 선택 필요'));
ok('(R1) 옛 슬롯: data-region-stale 안내 문구 노출', staleSlotHtml.includes('data-region-stale>지역을 다시 선택해 주세요'));
ok('(R1) 옛 슬롯: data-region-stale hidden 아님', !staleSlotHtml.includes('data-region-stale hidden'));

console.log('\n##### 6. R2/R3 검사: searchApi error 전달 및 옛 지역 라벨 fallback #####');

const searchApiJs = read('preview/search-ui/src/search-api.js');

ok('(R2) searchApi: err.status 덧붙임', searchApiJs.includes('err.status = res.status'));
ok('(R2) searchApi: err.error 덧붙임', searchApiJs.includes('err.error = body.error'));
ok('(R2) activity-chart: err.status === 422 || err.error === validation', chartJs.includes("err?.status === 422 || err?.error === 'validation'"));
ok('(R2) tutor-home-seed: err.status === 422 || err.error === validation', seedJs.includes("err?.status === 422 || err?.error === 'validation'"));

ok("(R3) tutor-home-seed: selectable=false && !label -> '옛 지역' 대체", seedJs.includes("label = '옛 지역'"));

console.log(`\n========================================`);
console.log(`Total: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
}
