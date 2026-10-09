/**
 * 2026-10-09 가입 완료 동네인사 팝업 · 기본정보 미완료 회원 차단 · 과외쌤 홈 「우리동네 과외쌤」 목록
 * 실행: cd preview/home-ui && npx vite-node ../../scripts/verify-signup-home-fix-20261009.mjs
 *
 * (1) 동네인사 팝업: 올리기 성공·건너뛰기 모두 팝업만 닫고 가입 완료 화면(상세등록 이어하기)을 남긴다.
 * (2) 기본정보 미완료(서버 needs_basic_register)면 학생·과외쌤·공부방 모두 기본정보 화면으로 보낸다.
 *     home-ui·search-ui(auth-session) · study-room-ui·tutor-ui(chrome-session). auth-ui 는 기본정보 화면이 있어 제외.
 * (3) 과외쌤 홈 「우리동네 과외쌤」 = 대표 과외지역 노출 카드 전부(내 카드 포함). 0장이면 빈 카드 칸, 샘플 없음.
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

/* ══════════════ 1부 정적 ══════════════ */
console.log('##### 1부 정적 #####');

const completeSrc = read('preview/auth-ui/src/screens/signup-complete.js');
const skipBlock = completeSrc.slice(completeSrc.indexOf('[data-ng-skip]'), completeSrc.indexOf('[data-ng-publish]'));
const publishBlock = completeSrc.slice(completeSrc.indexOf('[data-ng-publish]'), completeSrc.indexOf('fetchMeApi()'));
const closeBlock = completeSrc.slice(completeSrc.indexOf('const closePrompt'), completeSrc.indexOf('const prompt ='));
ok('(1) 팝업 닫기 함수: 다시 안 뜨게 표시 + 팝업만 제거', /markPromptDone\(\)/.test(closeBlock) && /\[data-ng-prompt\]'\)\.forEach\(\(el\) => el\.remove\(\)\)/.test(closeBlock));
ok('(1) 팝업 닫기 함수는 다른 화면으로 이동하지 않는다', !/location\.(assign|replace|href)/.test(closeBlock));
ok('(1) 건너뛰기 = 팝업만 닫기(홈 이동 없음)', /closePrompt\(\)/.test(skipBlock) && !/location\./.test(skipBlock));
ok('(1) 인사 올리기 성공 = 팝업 닫기', /closePrompt\(\)/.test(publishBlock) && !/showStatus\(/.test(publishBlock));
ok('(1) 인사 올리기 실패는 팝업에 오류만 보인다', /if \(!saved\.ok\) \{\s*showError\(saved\.error\);\s*return;/.test(publishBlock));
ok('(1) 홈으로 바로 보내던 roleHomeUrl·goRoleHome 없음', !/roleHomeUrl|goRoleHome/.test(completeSrc));
ok('(1) 가입 완료 화면의 「상세등록 이어하기」 버튼 그대로', /data-action="go-detail-register"[\s\S]{0,80}상세등록 이어하기/.test(completeSrc));

const authSessionSrc = read('preview/home-ui/src/auth-session.js');
ok('(2) home-ui 세션: 역할 조건 없이 needs_basic_register 면 기본정보 화면', /if \(data\.needs_basic_register && !isGuidePublicPath\(\)\)/.test(authSessionSrc));
ok('(2) home-ui 세션: 학생 전용 조건 제거', !/needs_basic_register && data\.role_type === 'guardian_student'/.test(authSessionSrc));
const chromeSrc = read('preview/shared/chrome-session.js');
ok('(2) chrome-session: 기본값 basicGate=true', /initChromeSession\(\{ basicGate = true \} = \{\}\)/.test(chromeSrc));
ok('(2) chrome-session: needs_basic_register 면 basicRegisterPathForMe 로 이동', /basicGate && data\.needs_basic_register/.test(chromeSrc) && /basicRegisterPathForMe\(src\)/.test(chromeSrc));
ok('(2) auth-ui 만 basicGate:false', /initChromeSession\(\{ basicGate: false \}\)/.test(read('preview/auth-ui/src/main.js')));
for (const app of ['study-room-ui', 'tutor-ui']) {
  const src = read(`preview/${app}/src/main.js`);
  ok(`(2) ${app}: 기본 차단 사용(basicGate:false 없음)`, /initChromeSession\(\)/.test(src) && !/basicGate: false/.test(src));
}

ok('(3) 본인만 걸러내던 search-provider-self.js 삭제', !existsSync(join(ROOT, 'preview/search-ui/src/search-provider-self.js')));
const selfRefs = ['search-ui/src/search-find-surface.js', 'search-ui/src/search-region-feed.js', 'search-ui/src/search-role-access.js', 'search-ui/src/state.js']
  .filter((rel) => /filterToProviderSelf|isProviderSelfPreviewMode|getProviderSelfFeed|search-provider-self/.test(read(`preview/${rel}`)));
ok('(3) 본인만 보기 참조 0', selfRefs.length === 0, selfRefs.join(','));
const seedSrc = read('preview/home-ui/src/tutor-home-seed.js');
ok('(3) tutor-home-seed: 대표 과외지역 id 로 과외쌤 검색', /searchApi\('tutor', \{ tutor_region_id: regionId \}/.test(seedSrc));
ok('(3) screens/tutor.js: 과외쌤 탭에서 bootTutorHomeTutors', /bootTutorHomeTutors\(rerender\)/.test(read('preview/home-ui/src/screens/tutor.js')));

/* ══════════════ 2부 실행 ══════════════ */
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
const nav = { replaced: [] };
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
    replace(url) {
      nav.replaced.push(String(url));
    },
  },
  writable: true,
  configurable: true,
});
globalThis.history = { replaceState() {}, pushState() {} };
console.warn = () => {};

const TUTOR_UNITS = [
  { id: 117, label: '서울특별시', sido_code: '11', sido_name: '서울특별시', unit_name: '', kind: 'metro', official_code: '1100000000' },
  { id: 424, label: '경기도 의정부시', sido_code: '41', sido_name: '경기도', unit_name: '의정부시', kind: 'city', official_code: '4115000000' },
  { id: 118, label: '경기도 양주시', sido_code: '41', sido_name: '경기도', unit_name: '양주시', kind: 'city', official_code: '4163000000' },
];

function tutorCard(id, name, regionLabel) {
  return {
    id,
    title: name,
    tutor_display_name: name,
    region_label: regionLabel,
    main_subject_note: '수학',
    preferred_fee_amount: 300000,
    lessons_per_week: 3,
    minutes_per_lesson: 90,
    slogan: '함께 해요',
    profile_status: 'published',
    exposure_tier: 'basic',
    position_sku: null,
    published_at: '2026-10-09 15:00:00',
    created_at: '2026-10-09 15:00:00',
  };
}

const server = {
  me: null,
  tutors: [],
  tutorsByRegion: {},
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
  if (url.pathname.endsWith('/api/auth/me.php')) return reply(200, server.me);
  if (url.pathname.endsWith('/api/auth/regions.php')) return reply(200, { ok: true, cities: [], tutor_units: TUTOR_UNITS });
  if (url.pathname.endsWith('/api/registrations/tutors.php')) return reply(200, { ok: true, tutors: server.tutors });
  if (url.pathname.endsWith('/api/messages/threads.php')) return reply(200, { ok: true, threads: [] });
  if (url.pathname.endsWith('/api/paid/roi.php')) return reply(200, { ok: true, lifetime_views: 0 });
  if (url.pathname.endsWith('/api/search/search.php')) {
    server.searchBodies.push(body);
    if (server.fail) return reply(500, { ok: false, message: '검색 서버 오류' });
    if (body?.tab !== 'tutor') return reply(200, { ok: true, items: [], total: 0 });
    const items = server.tutorsByRegion[String(body?.filters?.tutor_region_id ?? '')] || [];
    return reply(200, { ok: true, items, total: items.length });
  }
  return reply(404, { ok: false, message: 'not found' });
};

function meFor(roleType, needsBasic) {
  return {
    ok: true,
    authenticated: true,
    user_id: 9,
    email: 'member@example.com',
    role_type: roleType,
    name: '회원',
    email_verified: true,
    oauth_role_pending: false,
    needs_account_contact: false,
    needs_basic_register: needsBasic,
  };
}

/* ── (2) home-ui·search-ui 세션 ── */
const authSession = await import('../preview/home-ui/src/auth-session.js');
const EXPECT_ROLE = { guardian_student: 'student', tutor: 'tutor', study_room_owner: 'study_room' };
for (const [roleType, uiRole] of Object.entries(EXPECT_ROLE)) {
  nav.replaced = [];
  server.me = meFor(roleType, true);
  const user = await authSession.fetchSession();
  ok(`(2) home-ui ${roleType} 기본정보 미완료 → 세션 없음`, user === null);
  ok(
    `(2) home-ui ${roleType} 기본정보 미완료 → 기본정보 화면(role=${uiRole})`,
    nav.replaced.length === 1 && nav.replaced[0].endsWith(`#/signup/basic?role=${uiRole}`),
    JSON.stringify(nav.replaced),
  );
  nav.replaced = [];
  server.me = meFor(roleType, false);
  const done = await authSession.fetchSession();
  ok(`(2) home-ui ${roleType} 기본정보 완료 → 그대로 이용`, done?.role_type === roleType && nav.replaced.length === 0, JSON.stringify(nav.replaced));
}
nav.replaced = [];
globalThis.location.pathname = '/guide/terms';
server.me = meFor('tutor', true);
ok('(2) home-ui 이용안내(/guide)는 차단하지 않는다', (await authSession.fetchSession()) !== null && nav.replaced.length === 0);
globalThis.location.pathname = '/';

/* ── (2) study-room-ui·tutor-ui 세션 ── */
const chrome = await import('../preview/shared/chrome-session.js');
for (const [roleType, uiRole] of Object.entries(EXPECT_ROLE)) {
  nav.replaced = [];
  server.me = meFor(roleType, true);
  const user = await chrome.initChromeSession();
  ok(
    `(2) 상세등록 앱 ${roleType} 기본정보 미완료 → 기본정보 화면(role=${uiRole})`,
    user === null && nav.replaced.length === 1 && nav.replaced[0].endsWith(`#/signup/basic?role=${uiRole}`),
    JSON.stringify(nav.replaced),
  );
}
nav.replaced = [];
server.me = meFor('tutor', true);
ok('(2) auth-ui(basicGate:false)는 기본정보 화면에 머문다', (await chrome.initChromeSession({ basicGate: false }))?.role_type === 'tutor' && nav.replaced.length === 0);
nav.replaced = [];
server.me = meFor('tutor', false);
ok('(2) 상세등록 앱 기본정보 완료 → 그대로 이용', (await chrome.initChromeSession())?.role_type === 'tutor' && nav.replaced.length === 0);

/* ── (3) 과외쌤 홈 「우리동네 과외쌤」 ── */
const seed = await import('../preview/home-ui/src/tutor-home-seed.js');
const providerHome = await import('../preview/home-ui/src/provider-home.js');
const findStateMod = await import('../preview/home-ui/src/find-state.js');
const { noteAuthRoleType } = await import('../preview/home-ui/src/auth-role.js');
const { activateRegistrationsApi } = await import('../preview/home-ui/src/registrations-backend.js');
const feedMod = await import('../preview/search-ui/src/search-region-feed.js');

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
const HOME_OPTS = { hideHead: true, hideRegionBar: true, hideSearchCrossLink: true };
const findState = findStateMod.createFindState();

async function renderTutorTab() {
  const first = providerHome.renderProviderHomeBody('tutor', 'tutor', findState, HOME_OPTS);
  await seed.bootTutorHome(() => {});
  seed.bootTutorHomeTutors(() => {});
  await tick();
  const html = providerHome.renderProviderHomeBody('tutor', 'tutor', findState, HOME_OPTS);
  return { first, html, text: visibleText(html) };
}
function lastTutorBody() {
  return [...server.searchBodies].reverse().find((b) => b?.tab === 'tutor') || null;
}
function myTutor(regionId) {
  return {
    id: 11,
    tutor_display_name: '최고수학샘1',
    main_subject_note: '수학',
    inquiry_status: 'paused',
    created_at: '2026-10-09',
    profile_status: 'published',
    saved_regions: [{ region_id: regionId, is_primary: 1 }],
    deleted_at: null,
  };
}

ok('(3) getRegionFeed: 조회 전(null)이면 pending', feedMod.getRegionFeed('tutor', { tutorHome: true, liveTutorItems: null }).pending === true);
ok(
  '(3) getRegionFeed: 받은 카드를 걸러내지 않고 전부 돌려준다',
  feedMod.getRegionFeed('tutor', { tutorHome: true, liveTutorItems: [tutorCard(11, 'A', ''), tutorCard(12, 'B', '')] }).items.length === 2,
);

noteAuthRoleType('tutor');
server.tutors = [myTutor(424)];
await activateRegistrationsApi();

/* 대표 과외지역(의정부시)에 내 카드 + 다른 과외쌤 카드 */
server.tutorsByRegion = {
  424: [tutorCard(11, '최고수학샘1', '경기도 의정부시'), tutorCard(12, '이웃영어샘', '경기도 의정부시')],
  118: [],
};
server.searchBodies = [];
{
  const { first, html, text } = await renderTutorTab();
  ok('(3) 조회 전에는 불러오는 중 안내', /data-tutor-home-feed="(idle|loading)"/.test(first), first.slice(0, 200));
  const body = lastTutorBody();
  ok('(3) 대표 과외지역 id(424)로 과외쌤 검색', String(body?.filters?.tutor_region_id) === '424', JSON.stringify(body));
  ok('(3) 조회 끝 → data-tutor-home-feed="ready"', html.includes('data-tutor-home-feed="ready"'));
  ok('(3) 내 카드가 보인다', text.includes('최고수학샘1'), text.slice(0, 300));
  ok('(3) 같은 지역 다른 과외쌤 카드도 보인다', text.includes('이웃영어샘'), text.slice(0, 300));
  ok('(3) 「선택한 지역에 과외쌤이 없습니다」 안 나온다', !text.includes('선택한 지역에 과외쌤이 없습니다'));
}

/* 대표 과외지역에 노출 카드 0장 */
server.tutors = [myTutor(118)];
server.searchBodies = [];
{
  const { html, text } = await renderTutorTab();
  ok('(3) 0장 → 대표 과외지역(118)으로 다시 조회', String(lastTutorBody()?.filters?.tutor_region_id) === '118');
  ok('(3) 0장 → 기존 빈 카드 칸', html.includes('data-tutor-home-vacant="tutor"'), html.slice(0, 300));
  ok('(3) 0장 → 샘플 카드 없음', !text.includes('샘플') && !html.includes('data-expo-sample'));
}

/* 검색 서버 실패 */
server.tutors = [myTutor(117)];
server.fail = true;
{
  const { html } = await renderTutorTab();
  ok('(3) 조회 실패 → 오류 안내(role=alert)', html.includes('data-tutor-home-feed="error"') && html.includes('role="alert"'));
}
server.fail = false;

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
