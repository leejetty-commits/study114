/**
 * 사이트오류-12(B) · 과외쌤 홈 「우리동네 학생」 탭 — 활동지역 학생 베이직카드 조회
 * 실행: cd preview/home-ui && npx vite-node ../../scripts/verify-tutor-home-student-tab.mjs
 *
 * (a) liveStudentItems 호출 경로: 화면 boot → tutor-home-seed 조회 → regionFeedContext → getRegionFeed
 * (b) 조회 중 / 조회 실패 / 활동지역 없음 / 조회 끝 0건 카피 분기 (문구는 copy 한곳)
 * (c) 활동지역 3탭 전환 → 그 지역 id로 재조회
 * (d) 공부방 홈 · 학생 홈 · 게스트 경로 불변
 * 서버 응답은 가짜 fetch 로 흉내 낸다. DB·PHP 서버에 접속하지 않는다.
 */
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
    console.error(`FAIL  ${name}${detail ? ` - ${detail}` : ''}`);
  }
}

const seedSrc = read('preview/home-ui/src/tutor-home-seed.js');
const tutorScreenSrc = read('preview/home-ui/src/screens/tutor.js');
const surfaceSrc = read('preview/search-ui/src/search-find-surface.js');
const feedSrc = read('preview/search-ui/src/search-region-feed.js');
const tierSrc = read('preview/search-ui/src/search-tier-render.js');
const roomSeedSrc = read('preview/home-ui/src/study-room-home-seed.js');
const copySrc = read('preview/home-ui/src/student-reg/student-reg-copy.js');
const searchPhp = read('src/Search/SearchService.php');
const tutorRegPhp = read('src/Tutor/TutorRegisterService.php');
const studentHubPhp = read('src/Registration/StudentHubRepository.php');

/* ══════════════ 1부 정적 — (a) 호출 경로 ══════════════ */
console.log('\n##### 1부 정적 #####');

ok(
  '(a) tutor-home-seed: 활동지역 id 로 /search 학생 조회(새 API 없음)',
  /searchApi\(\s*'student',\s*\{ preferred_lesson_type: 'tutor', preferred_region_id: regionId \}/.test(seedSrc) &&
    /import \{ searchApi \} from '\.\.\/\.\.\/search-ui\/src\/search-api\.js'/.test(seedSrc),
);
ok(
  '(a) tutor-home-seed: getTutorStudentLiveItems · getTutorStudentFeedStatus · bootTutorStudentDemand export',
  /export function getTutorStudentLiveItems/.test(seedSrc) &&
    /export function getTutorStudentFeedStatus/.test(seedSrc) &&
    /export function bootTutorStudentDemand/.test(seedSrc),
);
ok(
  '(a) tutor-home-seed: 샘플·mock·seed 로 학생 카드를 채우지 않음(실패·지역없음은 null)',
  /return \{ items: null, status: 'no-region' \}/.test(seedSrc) &&
    /return \{ items: null, status: 'error' \}/.test(seedSrc) &&
    !/buildStudent|SampleItem|studentSample|EXPOSURE_STUDENTS/.test(seedSrc),
);
ok(
  '(a) screens/tutor.js: 학생 탭에서 bootTutorStudentDemand(선택 활동지역)',
  /previewState\.tutorTab === 'student'/.test(tutorScreenSrc) &&
    /bootTutorStudentDemand\(resolveTutorStudentRegionIndex\(previewState\.tutorFind\), rerender\)/.test(tutorScreenSrc),
);
ok(
  '(a) regionFeedContext: 과외쌤 학생 탭 → ctx.liveStudentItems = getTutorStudentLiveItems()',
  /role === 'tutor' && state\.tutorStudentSnap === true[\s\S]{0,220}ctx\.liveStudentItems = getTutorStudentLiveItems\(\)/.test(surfaceSrc),
);
ok(
  '(a) getRegionFeed: liveStudentItems 배열이면 학생 노출 카드로 매핑, 없으면 pending',
  /if \(!Array\.isArray\(ctx\.liveStudentItems\)\) \{\s*return \{ items: \[\], regionLabel, pending: true \};/.test(feedSrc) &&
    /mapSearchResultsToExposure\('student', ctx\.liveStudentItems\)/.test(feedSrc),
);

/* 서버 필터 정적 근거 — 보낸 키가 서버 학생 탭 조건과 맞는지 */
ok(
  '서버: 학생 탭이 preferred_lesson_type 를 그대로 거른다',
  /if \(\$lessonType = \$this->stringFilter\(\$filters, 'preferred_lesson_type'\)\)[\s\S]{0,160}s\.preferred_lesson_type = :preferred_lesson_type/.test(searchPhp),
);
ok(
  '서버: preferred_lesson_type=tutor 면 preferred_region_id = 과외 단위 id → preferred_tutor_region_id 그대로 비교',
  /\$regionId = \$this->studentRegionId\(\$pdo, \$filters, 'preferred_region_id', \$lessonForRegion\)/.test(searchPhp) &&
    /\$regionId !== null && \$lessonForRegion === 'tutor'\) \{\s*\$where\[\] = 's\.preferred_tutor_region_id = :preferred_tutor_unit_id'/.test(searchPhp) &&
    /return \$this->tutorUnitRegionId\(\$pdo, \$filters, \$key\)/.test(searchPhp),
);
ok(
  '서버: 과외 단위 기준이 같다 — tutor_regions.region_id 와 preferred_tutor_region_id 모두 TutorRegionUnit::assertUnit',
  /TutorRegionUnit::assertUnit\(\$pdo, \$regionId\)/.test(tutorRegPhp) &&
    /TutorRegionUnit::assertUnit\(\$this->pdo, \$regionId\)/.test(studentHubPhp),
);
ok(
  'PHP·SQL 변경 없음(조회 전용) — SearchService 에 새 필터 키를 넣지 않았다',
  !/preferred_tutor_activity_region|tutor_home_student/.test(searchPhp),
);

/* (b) 문구 한곳 */
ok(
  '(b) 문구는 student-reg-copy 의 TUTOR_HOME_STUDENT_COPY 한곳',
  /export const TUTOR_HOME_STUDENT_COPY = \{/.test(copySrc) &&
    /import \{ TUTOR_HOME_STUDENT_COPY \} from '@home-ui\/student-reg\/student-reg-copy\.js'/.test(surfaceSrc),
);
ok(
  '(b) search-find-surface 안에 과외쌤 학생 탭 문구 하드코딩 없음',
  !/과외지역을 등록하면/.test(surfaceSrc) && !/불러오지 못했어요/.test(surfaceSrc),
);

/* (c) 3탭 전환 */
ok(
  '(c) 활동지역 3탭이 학생 탭 지역바에 그려진다(과외쌤 탭과 같은 renderTutorRegionTabs)',
  /tab === 'student' && role === 'tutor' && variant === 'home'[\s\S]{0,260}renderTutorRegionTabs\(state, \{[\s\S]{0,140}activeIndex: resolveTutorStudentRegionIndex\(state\)/.test(surfaceSrc),
);
ok(
  '(c) data-tutor-region 핸들러가 학생 탭에서는 tutorStudentRegionIndex 를 바꾼다',
  /ctx\.role === 'tutor' && ctx\.getTab\(\) === 'student'[\s\S]{0,260}state\(\)\.tutorStudentRegionIndex = idx/.test(surfaceSrc),
);
ok(
  '(c) 탭을 누르기 전 기본값은 대표 활동지역',
  /return tutorHomePrimaryIndex\(\);/.test(surfaceSrc) && /export function tutorHomePrimaryIndex/.test(seedSrc),
);

/* (d) 다른 홈 경로 불변 */
ok(
  '(d) 공부방 홈 학생 탭 조회 그대로(preferred_studyroom_region_id · study_room 분기)',
  /preferred_lesson_type: 'study_room', preferred_studyroom_region_id: regionId/.test(roomSeedSrc) &&
    /ctx\.liveStudentItems = getStudyRoomStudentLiveItems\(\)/.test(surfaceSrc),
);
ok(
  '(d) 공부방 홈 학생 탭 로딩 문구 그대로',
  /tab === 'student' && role === 'study_room' && !state\.searchExecuted && state\.studentDemandPending[\s\S]{0,260}학생 목록을 불러오는 중입니다\./.test(surfaceSrc),
);
ok(
  '(d) 학생(parent) 홈 경로 그대로 — studentFeedEntry · studentFeedStatus 분기 유지',
  /if \(!state\.searchExecuted && \(role \|\| state\.role\) === 'parent'\)/.test(surfaceSrc) &&
    /state\.studentFeedStatus = feed\.status;/.test(surfaceSrc),
);
ok(
  '(d) 게스트 경로 그대로 — guestFeedStatus 분기 유지',
  /if \(role === 'guest'\) \{[\s\S]{0,200}const status = guestFeedStatus\(tab\);/.test(surfaceSrc),
);
ok(
  '(d) 과외쌤 홈 대표 고정은 과외쌤 탭만(학생 탭은 고른 탭을 따른다)',
  /viewerRole === 'tutor' && surfaceType === 'home' && mode === 'region' && tab !== 'student'/.test(tierSrc),
);
ok(
  '(d) 과외쌤 홈 내 박스·활동지역 분포 UI 변경 없음',
  /renderTutorRegionPills\(\)/.test(tutorScreenSrc) &&
    /renderTutorActivityBars\(\{ interactive: false \}\)/.test(tutorScreenSrc),
);
ok(
  '(d) 학생찾기 링크배지 유지',
  /학생찾기에서 더 찾아보기/.test(read('preview/home-ui/src/provider-home.js')),
);

/* ══════════════ 2부 실행 — 실제 모듈 + 가짜 /search ══════════════ */
console.log('\n##### 2부 실행 #####');

function makeStorage() {
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(String(k)) ? mem.get(String(k)) : null),
    setItem: (k, v) => mem.set(String(k), String(v)),
    removeItem: (k) => mem.delete(String(k)),
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
for (const name of ['HTMLElement', 'HTMLInputElement', 'HTMLFormElement', 'HTMLSelectElement', 'HTMLButtonElement']) {
  if (typeof globalThis[name] === 'undefined') globalThis[name] = class {};
}
Object.defineProperty(globalThis, 'location', {
  value: {
    hash: '#/tutor',
    href: 'http://127.0.0.1:5174/#/tutor',
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
globalThis.history = { replaceState() {}, pushState() {} };
console.warn = () => {};

/** 과외 단위(광역시 / 도의 시·군) 목록 — regions.php action=tutor_units 응답 모양 */
const TUTOR_UNITS = [
  { id: 117, label: '서울특별시', sido_code: '11', sido_name: '서울특별시', unit_name: '', kind: 'metro', official_code: '1100000000' },
  { id: 424, label: '경기도 의정부시', sido_code: '41', sido_name: '경기도', unit_name: '의정부시', kind: 'city', official_code: '4115000000' },
  { id: 118, label: '경기도 양주시', sido_code: '41', sido_name: '경기도', unit_name: '양주시', kind: 'city', official_code: '4163000000' },
];
const REGION_LABEL = { 424: '경기도 의정부시', 117: '서울특별시', 118: '경기도 양주시' };

function studentRow(id, name, regionLabel) {
  return {
    id,
    title: name,
    grade_level: '중2',
    region_label: regionLabel,
    preferred_lesson_type: 'tutor',
    subject_name: '수학',
    published_at: '2026-09-30 10:00:00',
    created_at: '2026-09-30 10:00:00',
  };
}

const server = {
  tutors: [],
  /** region_id → 학생 목록 */
  studentsByRegion: {},
  fail: false,
  searchBodies: [],
};
const reply = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
  text: async () => JSON.stringify(body),
});
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input), 'http://127.0.0.1:5174');
  let body = null;
  try {
    body = init.body ? JSON.parse(String(init.body)) : null;
  } catch {
    body = null;
  }
  if (url.pathname.endsWith('/api/auth/regions.php')) return reply(200, { ok: true, cities: [], tutor_units: TUTOR_UNITS });
  if (url.pathname.endsWith('/api/registrations/tutors.php')) return reply(200, { ok: true, tutors: server.tutors });
  if (url.pathname.endsWith('/api/messages/threads.php')) return reply(200, { ok: true, threads: [] });
  if (url.pathname.endsWith('/api/paid/roi.php')) return reply(200, { ok: true, lifetime_views: 0 });
  if (url.pathname.endsWith('/api/search/search.php')) {
    server.searchBodies.push(body);
    if (server.fail) return reply(500, { ok: false, message: '검색 서버 오류' });
    const key = String(body?.filters?.preferred_region_id ?? '');
    const items = body?.tab === 'student' ? server.studentsByRegion[key] || [] : [];
    return reply(200, { ok: true, items, total: items.length });
  }
  return reply(404, { ok: false, message: 'not found' });
};

const seed = await import('../preview/home-ui/src/tutor-home-seed.js');
const surface = await import('../preview/search-ui/src/search-find-surface.js');
const providerHome = await import('../preview/home-ui/src/provider-home.js');
const findStateMod = await import('../preview/home-ui/src/find-state.js');
const { noteAuthRoleType } = await import('../preview/home-ui/src/auth-role.js');
const { activateRegistrationsApi } = await import('../preview/home-ui/src/registrations-backend.js');
const copyMod = await import('../preview/home-ui/src/student-reg/student-reg-copy.js');
const COPY = copyMod.TUTOR_HOME_STUDENT_COPY;

const tick = (ms = 25) => new Promise((r) => setTimeout(r, ms));
function visibleText(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const HOME_OPTS = { hideHead: false, hideRegionBar: false, hideSearchCrossLink: false, hideSelfNote: true };
const findState = findStateMod.createFindState();

/** 홈 학생 탭 한 사이클: 그리기 → boot(화면 bind 와 같은 순서) → 다시 그리기 */
async function renderStudentTab() {
  providerHome.renderProviderHomeBody('tutor', 'student', findState, HOME_OPTS);
  await seed.bootTutorHome(() => {});
  seed.bootTutorStudentDemand(surface.resolveTutorStudentRegionIndex(findState), () => {});
  await tick();
  const html = providerHome.renderProviderHomeBody('tutor', 'student', findState, HOME_OPTS);
  return { html, text: visibleText(html) };
}

function lastStudentBody() {
  return [...server.searchBodies].reverse().find((b) => b?.tab === 'student') || null;
}

/** 활동지역 탭 클릭과 같은 상태 변화 */
function clickRegionTab(idx) {
  findState.tutorStudentRegionIndex = idx;
}

function tutorRow(savedRegions) {
  return {
    id: 7,
    tutor_display_name: '테스트쌤',
    main_subject_note: '수학',
    inquiry_status: 'open',
    created_at: '2025-03-04',
    primary_region_label: REGION_LABEL[String(savedRegions[0]?.region_id)] || '',
    saved_regions: savedRegions,
    deleted_at: null,
  };
}

noteAuthRoleType('tutor');
await activateRegistrationsApi();

/* ── 활동지역 없음 ── */
server.tutors = [tutorRow([])];
server.searchBodies = [];
{
  const { html, text } = await renderStudentTab();
  ok('(b) 활동지역 없음 → 「과외지역을 등록하면 학생이 보여요」', text.includes(COPY.noRegion), text.slice(0, 160));
  ok('(b) 활동지역 없음 → data-tutor-student-feed="no-region"', html.includes('data-tutor-student-feed="no-region"'));
  ok('(b) 활동지역 없음 → 조회하지 않는다', lastStudentBody() === null, JSON.stringify(server.searchBodies));
  ok('(b) 활동지역 없음 → 0건 감성 카피를 쓰지 않는다', !text.includes(COPY.emptyBody));
}

/* ── 대표 활동지역 학생 2명 ── */
server.tutors = [
  tutorRow([
    { region_id: 117, is_primary: 1 },
    { region_id: 424, is_primary: 0 },
    { region_id: 118, is_primary: 0 },
  ]),
];
server.studentsByRegion = {
  117: [studentRow(501, '서울 학생A', '서울특별시'), studentRow(502, '서울 학생B', '서울특별시')],
  424: [studentRow(601, '의정부 학생', '경기도 의정부시')],
  118: [],
};
server.searchBodies = [];
{
  const { html, text } = await renderStudentTab();
  const body = lastStudentBody();
  ok('(M1) 서버 /search 학생 탭 호출', body?.tab === 'student', JSON.stringify(body));
  ok(
    '(M1) 필터 = 과외 분기 + 대표 활동지역 id',
    body?.filters?.preferred_lesson_type === 'tutor' && String(body?.filters?.preferred_region_id) === '117',
    JSON.stringify(body?.filters),
  );
  ok('(M1) 새 API 경로를 쓰지 않는다', server.searchBodies.length > 0 && !/tutor-student/.test(JSON.stringify(body)));
  ok(
    '(M1) 받은 학생 2명이 베이직카드로 나온다(학생 카드는 이름 비공개)',
    html.includes('data-student-id="501"') && html.includes('data-student-id="502"') &&
      (html.match(/class="expo-basic expo-basic--student/g) || []).length === 2,
    html.slice(0, 200),
  );
  ok('(M1) 학생 카드 = 베이직 티어(프라임·픽 승격 없음)', !/data-prime-slot|expo-prime/.test(html));
  ok('(M1) 0건·실패·로딩 카피가 함께 나오지 않는다', !text.includes(COPY.emptyBody) && !text.includes(COPY.error) && !text.includes(COPY.loading));
  ok('(M4) 「학생찾기에서 더 찾아보기」 링크배지 유지', text.includes('학생찾기에서 더 찾아보기'));
  ok('(M4) 샘플 카드로 채우지 않는다', !/샘플 학생|data-vacant-sample|_vacantSample/.test(html));
  ok('(c) 활동지역 3탭이 학생 탭에 보인다', (html.match(/data-tutor-region="\d"/g) || []).length === 3, html.slice(0, 120));
  ok('(c) 대표 탭이 기본 선택', /data-tutor-region="0"[^>]*aria-selected="true"/.test(html));
  ok('(M1) 지역 라벨 = 대표 과외 단위(서울특별시)', text.includes('서울특별시'), text.slice(0, 200));
}

/* ── 3탭 전환 → 그 지역으로 재조회 ── */
server.searchBodies = [];
clickRegionTab(1);
{
  const { html, text } = await renderStudentTab();
  const body = lastStudentBody();
  ok('(M3) 탭 2 전환 → 그 지역 id(424)로 다시 조회', String(body?.filters?.preferred_region_id) === '424', JSON.stringify(body?.filters));
  ok(
    '(M3) 탭 2 학생이 바뀐다(601 보이고 501·502 사라짐)',
    html.includes('data-student-id="601"') && !html.includes('data-student-id="501"'),
    html.slice(0, 200),
  );
  ok('(M3) 선택 탭 표시', /data-tutor-region="1"[^>]*aria-selected="true"/.test(html));
  ok('(M3) 지역 라벨 = 선택 활동지역', text.includes('의정부'), text.slice(0, 200));
}

/* ── 0건 지역 ── */
server.searchBodies = [];
clickRegionTab(2);
{
  const { html, text } = await renderStudentTab();
  ok('(M3) 탭 3 전환 → 경기도 양주시(118) 조회', String(lastStudentBody()?.filters?.preferred_region_id) === '118', JSON.stringify(lastStudentBody()?.filters));
  ok('(b) 조회 끝 0건 → 감성 카피', text.includes(COPY.emptyBody) && /아직 함께 공부할 학생이 보이지 않아요/.test(text), text.slice(0, 220));
  ok('(b) 0건 카피 지역 = 선택 과외 단위', text.includes('양주시'), text.slice(0, 200));
  ok('(b) 0건에 「공개 중인 학생이 없습니다」(옛 문구) 안 씀', !text.includes('공개 중인 학생이 없습니다'));
  ok('(b) 0건 → data-tutor-student-feed="ready"', html.includes('data-tutor-student-feed="ready"'));
  ok('(b) 0건에 샘플 카드 없음', !/data-vacant-sample|샘플/.test(html));
}

/* ── 조회 중(로딩) ── */
{
  const copyAll = `${COPY.loading}|${COPY.error}|${COPY.noRegion}`;
  ok('(b) 로딩·실패·지역없음 문구가 서로 다르다', new Set(copyAll.split('|')).size === 3, copyAll);
}
server.searchBodies = [];
server.fail = false;
clickRegionTab(0);
{
  // boot 직후(응답 전) 상태
  providerHome.renderProviderHomeBody('tutor', 'student', findState, HOME_OPTS);
  seed.bootTutorStudentDemand(surface.resolveTutorStudentRegionIndex(findState), () => {});
  const html = providerHome.renderProviderHomeBody('tutor', 'student', findState, HOME_OPTS);
  const text = visibleText(html);
  ok('(b) 조회 중 → 로딩 문구', text.includes(COPY.loading), text.slice(0, 200));
  ok('(b) 조회 중 → data-tutor-student-feed="loading"', html.includes('data-tutor-student-feed="loading"'));
  ok('(b) 조회 중에는 0건 카피를 쓰지 않는다', !text.includes(COPY.emptyBody));
  await tick();
}

/* ── 조회 실패 ── */
server.fail = true;
server.searchBodies = [];
clickRegionTab(1);
{
  const { html, text } = await renderStudentTab();
  ok('(b) 조회 실패 → 「잠시 후 다시 확인해 주세요」 톤', text.includes(COPY.error), text.slice(0, 200));
  ok('(b) 조회 실패 → role="alert"', /role="alert"/.test(html));
  ok('(b) 조회 실패 → data-tutor-student-feed="error"', html.includes('data-tutor-student-feed="error"'));
  ok('(b) 조회 실패와 0건을 구분한다', !text.includes(COPY.emptyBody));
}
server.fail = false;

/* ── (d) 다른 역할 경로 불변 ── */
{
  const roomState = findStateMod.createFindState();
  roomState.studyRoomHome = true;
  const roomHtml = surface.renderFindResultSection('student', roomState, 'study_room', { surfaceType: 'home' });
  const roomText = visibleText(roomHtml);
  ok('(d) 공부방 홈 학생 탭은 공부방 로딩 문구를 그대로 쓴다', roomText.includes('학생 목록을 불러오는 중입니다.'), roomText.slice(0, 160));
  ok('(d) 공부방 홈에 과외쌤 전용 문구 안 나온다', !roomText.includes(COPY.noRegion) && !roomText.includes(COPY.loading));
  ok('(d) 공부방 홈에 data-tutor-student-feed 없음', !roomHtml.includes('data-tutor-student-feed'));

  const guestState = findStateMod.createFindState();
  const guestHtml = surface.renderFindResultSection('student', guestState, 'guest', { surfaceType: 'home' });
  ok('(d) 게스트 홈에 data-tutor-student-feed 없음', !guestHtml.includes('data-tutor-student-feed'));
  ok('(d) 게스트 홈은 게스트 피드 문구를 그대로 쓴다', /목록을 불러오/.test(visibleText(guestHtml)), visibleText(guestHtml).slice(0, 160));

  const parentState = findStateMod.createFindState();
  parentState.role = 'parent';
  const parentHtml = surface.renderFindResultSection('student', parentState, 'parent', { surfaceType: 'home' });
  ok('(d) 학생 홈에 data-tutor-student-feed 없음', !parentHtml.includes('data-tutor-student-feed'));
}

/* ── 과외쌤 탭(자기 노출) 불변 ── */
{
  const tutorTabState = findStateMod.createFindState();
  tutorTabState.homeSelf = true;
  const html = providerHome.renderProviderHomeBody('tutor', 'tutor', tutorTabState, {
    hideHead: true,
    hideRegionBar: true,
    hideSearchCrossLink: true,
    hideSelfNote: true,
  });
  ok('(d) 과외쌤 탭에 data-tutor-student-feed 없음', !html.includes('data-tutor-student-feed'));
  ok('(d) 과외쌤 탭 지역바는 여전히 숨김(hideRegionBar)', !html.includes('data-tutor-region='));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
