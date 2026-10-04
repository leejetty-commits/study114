/**
 * 사이트오류-18 · 마이페이지 「내 공지」를 모든 하위 화면 상단에 한 번만 고정.
 * 실행: cd preview/home-ui && npx vite-node ../../scripts/verify-mypage-notice-top.mjs
 *
 * Chromium 없이 소스 확인과 renderMypageShell·renderMypageScreen 호출로 센다.
 * 공지·등록 API 는 가짜 응답만 쓰고, DB·서버에 접속하지 않는다.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
    detail = `${detail} threw ${e?.message || e}`.trim();
  }
  if (value) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function walkCss(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkCss(p, acc);
    else if (name.endsWith('.css')) acc.push(p);
  }
  return acc;
}

const screensSrc = read('preview/home-ui/src/mypage/screens.js');
const shellSrc = read('preview/home-ui/src/mypage/shell.js');
const mainSrc = read('preview/home-ui/src/main.js');
const css = read('preview/home-ui/src/styles/mypage-ops.css');
const shellFn = shellSrc.slice(shellSrc.indexOf('export function renderMypageShell'));

ok('(b) screens.js에 renderMypageNoticeStrip 없음', !screensSrc.includes('renderMypageNoticeStrip'));
ok('(b) screens.js에 _withNotice 없음', !screensSrc.includes('_withNotice'));
ok('(b) screens.js에 _entryPath 없음', !screensSrc.includes('_entryPath'));
ok('(a) 틀이 공지 스트립을 한 번만 호출', (shellFn.match(/renderMypageNoticeStrip\(\)/g) || []).length === 1);
ok('(a) guest이면 스트립을 넣지 않음', /role === 'guest' \? '' : renderMypageNoticeStrip\(\)/.test(shellFn));
ok('(a) 스트립이 bodyHtml 앞', () => {
  const noticeAt = shellFn.indexOf('renderMypageNoticeStrip()');
  const bodyAt = shellFn.indexOf('${bodyHtml}');
  return noticeAt >= 0 && bodyAt > noticeAt;
});

const borderNeedle = 'border-bottom: 2px solid var(--gray-300)';
const cssHits = [];
for (const file of walkCss(join(ROOT, 'preview/home-ui/src/styles'))) {
  const n = readFileSync(file, 'utf8').split(borderNeedle).length - 1;
  if (n) cssHits.push(`${file}:${n}`);
}
ok('(f) border-bottom 2px var(--gray-300) 이 스타일 한 곳', cssHits.length === 1 && cssHits[0].endsWith('mypage-ops.css:1'), cssHits.join(','));
ok('(f) 그 선언은 .mypage-notice 안', () => {
  const rule = css.match(/\.mypage-notice \{[^}]*\}/);
  return Boolean(rule && rule[0].includes(borderNeedle) && rule[0].includes('margin: 0 0 var(--space-4, 16px)'));
});
ok('(f) 화면 제목 구분선은 1px 로 별도', /\.mypage-content__head \{[\s\S]*?border-bottom:\s*1px solid var\(--mp-line\);/.test(css));
ok('(M7) 제목 말줄임 유지', /\.mypage-notice__title \{[\s\S]*?text-overflow:\s*ellipsis;[\s\S]*?white-space:\s*nowrap;/.test(css));
ok('(M6) 캐시 후 마이페이지일 때만 다시 그림', () => {
  const fn = mainSrc.slice(mainSrc.indexOf('function hydrateNotices'), mainSrc.indexOf('import { activateBoardApi'));
  return (
    fn.includes('hydrateNoticeHome()') &&
    fn.includes('!isMypageRoute()') &&
    fn.includes('getNoticeHomePosts().length === 0') &&
    fn.includes("querySelector('.mypage-notice')") &&
    fn.includes('render()')
  );
});

// ── 화면 호출. 브라우저 저장소·주소만 흉내 낸다. ──
const mem = new Map();
const storage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
};
globalThis.sessionStorage = storage;
globalThis.localStorage = storage;
globalThis.window = globalThis;
const loc = {
  hash: '#/mypage/account',
  href: 'http://127.0.0.1:5174/#/mypage/account',
  origin: 'http://127.0.0.1:5174',
  host: '127.0.0.1:5174',
  hostname: '127.0.0.1',
  protocol: 'http:',
  pathname: '/',
  search: '',
  assign() {},
  replace(url) {
    const s = String(url || '');
    const hash = s.startsWith('#') ? s : s.includes('#') ? s.slice(s.indexOf('#')) : '';
    if (hash) this.hash = hash;
  },
};
Object.defineProperty(globalThis, 'location', { value: loc, writable: true, configurable: true });
globalThis.document = {
  documentElement: { style: { setProperty() {}, getPropertyValue() { return ''; } } },
  body: { appendChild() {}, removeChild() {} },
  getElementById() { return null; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement() {
    return { style: {}, setAttribute() {}, appendChild() {}, addEventListener() {}, classList: { add() {}, remove() {} } };
  },
  addEventListener() {},
  removeEventListener() {},
};
globalThis.history = globalThis.history || { pushState() {}, replaceState() {}, state: null };
if (typeof globalThis.dispatchEvent !== 'function') {
  const winEvents = new EventTarget();
  globalThis.dispatchEvent = (event) => winEvents.dispatchEvent(event);
}
try {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'verify-mypage-notice-top', language: 'ko' },
    configurable: true,
  });
} catch {
  /* vite-node 가 navigator 를 이미 고정한 경우 그대로 쓴다 */
}
if (typeof globalThis.matchMedia !== 'function') {
  globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
}

const STUDENT = {
  id: 1,
  student_name: '김하늘',
  public_display_name: '맑은하늘',
  grade_level: '중2',
  gender: 'female',
  birth_year: 2012,
  exposure_status: 'published',
  preferred_lesson_type: 'tutor',
  preferred_tutor_gender: 'any',
  preferred_tutor_regions: [],
  preferred_studyroom_regions: [],
};
const ROOM = {
  id: 1,
  study_room_name: '한빛공부방',
  profile_status: 'published',
  inquiry_status: 'open',
  detail_completion_status: 'basic_only',
  region_label: '강남구',
  main_subject_note: '수학',
  has_representative_image: false,
  has_subject_targets: true,
  has_regions: true,
  lesson_place_set: true,
  contact_method_set: true,
  compare_eligible: false,
};
const TUTOR = {
  id: 1,
  tutor_display_name: '김수학',
  profile_status: 'published',
  inquiry_status: 'open',
  detail_completion_status: 'basic_only',
  location_label: '강남구',
  primary_region_label: '강남구',
  main_subject_note: '수학',
};
const NOTICE = { id: 'n1', title: '점검 안내', date: '2026-10-03', body: ['본문'], targetRole: 'all' };

const session = {
  authenticated: true,
  role_type: 'guardian_student',
  email: 'guardian1@dev.local',
  name: '학생',
  user_id: 11,
  students: [STUDENT],
  rooms: [ROOM],
  tutors: [TUTOR],
  homeNotices: [NOTICE],
};

function responseJson(body, okStatus = true) {
  return {
    ok: okStatus,
    status: okStatus ? 200 : 401,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function urlOf(input) {
  if (typeof input === 'string') return input;
  if (input && typeof input.url === 'string') return input.url;
  return String(input ?? '');
}

globalThis.fetch = async (input) => {
  const url = urlOf(input);
  if (url.includes('/api/auth/me.php') || url.includes('/api/auth/login.php')) {
    if (!session.authenticated) return responseJson({ ok: true, authenticated: false });
    return responseJson({
      ok: true,
      authenticated: true,
      email_verified: true,
      oauth_role_pending: false,
      needs_basic_register: false,
      user_id: session.user_id,
      email: session.email,
      role_type: session.role_type,
      name: session.name,
      phone_verified: true,
      admin_level: null,
    });
  }
  if (url.includes('/api/registrations/students.php')) {
    return responseJson({ ok: true, students: session.role_type === 'guardian_student' ? session.students : [] });
  }
  if (url.includes('/api/registrations/study-rooms.php')) {
    return responseJson({ ok: true, rooms: session.role_type === 'study_room_owner' ? session.rooms : [] });
  }
  if (url.includes('/api/registrations/tutors.php')) {
    return responseJson({ ok: true, tutors: session.role_type === 'tutor' ? session.tutors : [] });
  }
  if (url.includes('/api/board/posts.php')) {
    const posts = url.includes('view=home') ? session.homeNotices : [];
    return responseJson({ ok: true, access: 'full', posts });
  }
  return responseJson({ ok: true, posts: [], items: [] });
};

function noticeCount(html) {
  return (String(html).match(/class="mypage-notice"/g) || []).length;
}

const { initAuthSession } = await import('../preview/home-ui/src/auth-session.js');
const { activateBoardApi, hydrateNoticeHome, resetNoticeCaches } = await import('../preview/home-ui/src/board/board-backend.js');
const { renderMypageShell } = await import('../preview/home-ui/src/mypage/shell.js');
const { renderMypageScreen } = await import('../preview/home-ui/src/mypage/screens.js');
const { getDefaultMypagePath } = await import('../preview/home-ui/src/mypage/router.js');

await activateBoardApi({ navRole: 'parent' });
await hydrateNoticeHome();

async function login(roleType, email, name) {
  session.authenticated = true;
  session.role_type = roleType;
  session.email = email;
  session.name = name;
  const user = await initAuthSession(false);
  ok(`login ${roleType}`, user && user.role_type === roleType, user ? user.role_type : 'null');
}

function paint(role, label, path) {
  loc.hash = `#${path}`;
  const marker = `<!--BODY:${role}:${label}-->`;
  let body = '';
  try {
    body = renderMypageScreen(path);
  } catch (e) {
    ok(`${role} ${label} 화면`, false, e?.message || String(e));
    return;
  }
  const html = renderMypageShell(path, `${marker}${body}`);
  const n = noticeCount(html);
  const noticeAt = html.indexOf('class="mypage-notice"');
  const headStart = html.indexOf('mypage-content__head');
  const headEnd = headStart >= 0 ? html.indexOf('</header>', headStart) : -1;
  const markerAt = html.indexOf(marker);
  ok(
    `${role} ${label} 공지 1개·제목 아래·본문 앞 (${path})`,
    n === 1 && noticeAt > headEnd && markerAt > noticeAt,
    `count=${n} noticeAt=${noticeAt} headEnd=${headEnd} markerAt=${markerAt}`,
  );
  if (n === 1) {
    ok(
      `${role} ${label} 더보기·행은 #/support/notice`,
      (html.match(/href="#\/support\/notice"/g) || []).length >= 2,
    );
  }
}

await login('guardian_student', 'guardian1@dev.local', '학생');
const parentEntry = getDefaultMypagePath('parent');
paint('parent', '입구', parentEntry);
paint('parent', '기본정보', '/mypage/registrations/students/1/basic');
paint('parent', '쪽지설정', '/mypage/registrations/students/1/settings');
paint('parent', '쪽지', '/mypage/messages');
paint('parent', '계정설정', '/mypage/account');

await login('study_room_owner', 'room-owner1@dev.local', '공부방');
paint('study_room', '입구', getDefaultMypagePath('study_room'));
paint('study_room', '기본정보', '/mypage/registrations/study-rooms/1/basic');
paint('study_room', '쪽지설정', '/mypage/registrations/study-rooms/1/inquiries');
paint('study_room', '쪽지', '/mypage/messages');
paint('study_room', '계정설정', '/mypage/account');

await login('tutor', 'tutor-owner1@dev.local', '과외쌤');
paint('tutor', '입구', getDefaultMypagePath('tutor'));
paint('tutor', '기본정보', '/mypage/registrations/tutors/1/basic');
paint('tutor', '쪽지설정', '/mypage/registrations/tutors/1/inquiries');
paint('tutor', '쪽지', '/mypage/messages');
paint('tutor', '계정설정', '/mypage/account');

ok('(a) 틀 출력에 공지가 본문 마커보다 앞이고 1개', () => {
  loc.hash = '#/mypage/account';
  const html = renderMypageShell('/mypage/account', '<!--BODY-->');
  const n = noticeCount(html);
  const headStart = html.indexOf('mypage-content__head');
  const headEnd = headStart >= 0 ? html.indexOf('</header>', headStart) : -1;
  const noticeAt = html.indexOf('class="mypage-notice"');
  return n === 1 && headEnd >= 0 && headEnd < noticeAt && noticeAt < html.indexOf('<!--BODY-->');
});

session.authenticated = false;
await initAuthSession(false);
ok('(d) guest 0개', () => noticeCount(renderMypageShell('/mypage/account', '<!--BODY-->')) === 0);

await login('guardian_student', 'guardian1@dev.local', '학생');
session.homeNotices = [];
resetNoticeCaches();
await hydrateNoticeHome();
ok('(e) 공지 0건이면 0개', () => noticeCount(renderMypageShell('/mypage/account', '<!--BODY-->')) === 0);
ok('(e) 0건 계정설정도 0개', () => {
  loc.hash = '#/mypage/account';
  return noticeCount(renderMypageShell('/mypage/account', renderMypageScreen('/mypage/account'))) === 0;
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
