/**
 * 사이트오류-15 보강 — 학생 홈 「우리동네 과외쌤」 선 1줄, 구간 간격, 빈카드 그리드, 배지.
 * CSS·소스 확인. 카드 노출 로직은 읽기만 한다.
 * 실행: cd preview/home-ui && npx vite-node ../../scripts/verify-student-home-tutor-tier.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), 'utf8') : '');

let passed = 0;
let failed = 0;
function ok(name, cond, detail = '') {
  if (cond) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` - ${detail}` : ''}`);
  }
}

const listings = read('preview/home-ui/src/styles/home-listings.css').replace(/\r\n/g, '\n');
const homeCss = read('preview/home-ui/src/styles/home.css');
const searchCss = read('preview/search-ui/src/styles/search.css');
const visily = read('preview/search-ui/src/styles/search-visily.css');
const provider = read('preview/home-ui/src/provider-home.js');
const tier = read('preview/search-ui/src/search-tier-render.js');
const exposure = read('preview/home-ui/src/exposure-render.js');
const surface = read('preview/search-ui/src/search-find-surface.js');
const branchVerify = read('scripts/verify-student-branch-two-tabs.mjs');

const parentTutorRule =
  '.home-shell--parent .parent-home-region--tutor + .search-results.search-results--pre {\n  border-top: none;\n}';

ok('(M1) 지역 표시 border-bottom 유지 (home.css)', /\.parent-home-region \{[\s\S]*?border-bottom:\s*1px solid var\(--gray-200\);/.test(homeCss));
ok('(M1) 결과 구역 border-top 규칙 유지 (search.css .search-results)', /\.search-results \{[\s\S]*?border-top:\s*1px solid var\(--gray-200\);/.test(searchCss));
ok('(M1) --pre 는 border-top:none 이지만 같은 특이도의 뒤 규칙에 진다', /\.search-results--pre \{\s*border-top:\s*none;/.test(searchCss));
ok('(M1) 학생 홈 과외쌤 탭에서만 결과 border-top 을 끈다', listings.includes(parentTutorRule));
ok('(M1) 전역 .search-results 의 border-top 을 none 으로 바꾸지 않는다', !/\.search-results \{\s*border-top:\s*none/.test(searchCss));
ok('(M1) 공부방 탭 지역 막대는 --tutor 가 없다', /tab === 'room' \? '우리동네' : '탐색 지역'[\s\S]{0,180}class="parent-home-region"/.test(surface));

ok('(M2·M3) --tier-section-gap 정의는 한 곳', (listings.match(/--tier-section-gap:\s*1\.25rem/g) || []).length === 1);
ok('(M2·M3) var(--tier-section-gap) 사용처는 둘', (listings.match(/var\(--tier-section-gap\)/g) || []).length === 2);
ok(
  '(M2) 픽 제목 사용처',
  listings.includes('.home-shell--parent .content-section--blue .list-subsection .section-heading--pick {\n  padding-top: var(--tier-section-gap);\n}'),
);
ok(
  '(M3) 베이직 제목막대 사용처',
  listings.includes('.home-shell--parent .content-section--blue .list-subsection > .section-title-bar--basic {\n  padding-top: var(--tier-section-gap);\n}'),
);
ok('(M2·M3) 전역 픽 간격은 var(--space-4) 그대로', /\.list-subsection \.section-heading \{\s*padding-top:\s*var\(--space-4\);/.test(listings));
ok('(M2·M3) 전역 베이직 간격은 var(--space-3) 그대로', /\.list-subsection > \.section-title-bar--basic \{\s*padding-top:\s*var\(--space-3\);/.test(listings));
ok(
  '(M6) 간격 변수는 parent·blue 규칙 안에만 있다',
  ['.home-shell--parent .content-section--blue {\n  --tier-section-gap: 1.25rem;', '.section-heading--pick {\n  padding-top: var(--tier-section-gap);', '.section-title-bar--basic {\n  padding-top: var(--tier-section-gap);'].every((part) => listings.includes(part)) &&
    !/\.home-shell--guest[\s\S]{0,120}--tier-section-gap/.test(listings) &&
    !/\.home-shell--tutor[\s\S]{0,120}--tier-section-gap/.test(listings),
);

const vacantStart = tier.indexOf('function renderStudentHomeVacantTiers');
const vacantEnd = tier.indexOf('function renderStudentHomeNoStudents');
const vacant = vacantStart >= 0 && vacantEnd > vacantStart ? tier.slice(vacantStart, vacantEnd) : '';
ok('(M4) 0건 베이직은 renderBrowseList 한 번', (vacant.match(/renderBrowseList\(/g) || []).length === 1);
ok('(M4) 빈카드는 tailHtml 로 같은 목록에 붙는다', /tailHtml:\s*renderEmptyBasicPromo\(\)/.test(vacant));
ok(
  '(M4) tailHtml 은 browse-list 안, 샘플 뒤',
  /<div class="browse-list browse-list--table"[\s\S]*?\$\{items\.map[\s\S]*?\}\$\{opts\.tailHtml \|\| ''\}/.test(exposure),
);
ok('(M4) 빈카드는 data-basic-empty', /data-basic-empty="1"/.test(exposure));
ok('(M4) 데스크탑 그리드 2열', /\.browse-list--table \{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(visily));
ok('(M4) 720px 이하 1열', /@media \(max-width:\s*720px\) \{[\s\S]*?\.browse-list--table \{\s*grid-template-columns:\s*1fr;/.test(visily));

ok('(M5) 학생 홈에서 searchTab 이 tutor 이면 배지를 그리지 않는다', /parentHome && searchTab !== 'tutor' \? renderParentFindMoreLink\(searchTab\)/.test(provider));
ok('(M5) renderParentFindMoreLink 함수는 남는다', /function renderParentFindMoreLink\(searchTab\)/.test(provider));
ok('(M5) 공급자 홈 학생 탭 배지 문구는 남는다', provider.includes('>학생찾기에서 더 찾아보기</a>'));
ok(
  '(M5) 과외쌤 탭 배지 기대값 = 없음',
  /ownSearch === 'tutor'[\s\S]{0,280}링크배지 없음[\s\S]{0,200}!html\.includes\('data-parent-find-more="tutor"'\)/.test(branchVerify),
);
ok('(M5) 학생 탭 배지 기대값은 유지', /data-parent-find-more="student"/.test(branchVerify) && branchVerify.includes('학생찾기에서 더 찾아보기'));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
