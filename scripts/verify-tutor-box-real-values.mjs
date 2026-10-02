/**
 * 사이트오류-8 · 과외쌤 홈 내 박스 — 목업(MY_TUTOR) 제거, 서버 값 표시
 * 실행(저장소 루트): npx --prefix preview/home-ui vite-node scripts/verify-tutor-box-real-values.mjs
 *
 * 정적: MY_TUTOR·MY_STUDY_ROOM 제거 / 목업 문자열 / readTutorMemberBox 읽는 필드 / TutorHubRepository created_at
 * 실행: fetch 만 흉내 내고 readTutorMemberBox·bootTutorHome 을 실제로 부른다.
 *   - 등록 API 꺼짐(게스트) → 시드(김수학) 아님, 이름 「내 과외 프로필」·미확인 0·조회 「…」
 *   - ROI 실패 → 조회 「—」, ROI 응답 값 없음 → 0
 *   - 쪽지 0건 → 미확인 0, 미확인 2건 → 2
 *   - inquiry_status open/paused/not_accepting/없음 → 쪽지 받음/쪽지 안받음/쪽지 안받음/—
 *   - 값이 바뀐 boot 만 다시 그리고 같은 값이면 멈춘다(무한 재그리기 없음)
 * DB·서버에 접속하지 않는다.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = process.cwd();
let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed += 1;
    console.log('PASS:', msg);
  } else {
    failed += 1;
    console.error('FAIL:', msg);
  }
}

const read = (p) => readFileSync(resolve(root, p), 'utf8');

// ── 정적 ──
const tutorJs = read('preview/home-ui/src/screens/tutor.js');
const seedJs = read('preview/home-ui/src/tutor-home-seed.js');
const dataJs = read('preview/home-ui/src/data.js');
const repoPhp = read('src/Registration/TutorHubRepository.php');

assert(!/\bMY_TUTOR\b/.test(tutorJs), 'tutor.js 에 MY_TUTOR 참조 없음');
assert(!/\bMY_TUTOR\b/.test(dataJs), 'data.js 에 MY_TUTOR 없음');
assert(!/\bMY_STUDY_ROOM\b/.test(dataJs), 'data.js 에 MY_STUDY_ROOM 없음(사용처 없음)');
assert(/readTutorMemberBox\(\)/.test(tutorJs), 'tutor.js 내 박스가 readTutorMemberBox() 로 그린다');
assert(!/쪽지 받음 ·/.test(tutorJs), 'tutor.js 에 「쪽지 받음 ·」 고정 문구 없음');
for (const key of ['name', 'subject', 'inquiry', 'unread', 'views', 'registered']) {
  assert(new RegExp(`box\\.${key}\\b`).test(tutorJs), `tutor.js 가 box.${key} 를 쓴다`);
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(js|mjs|ts|php|html|css)$/.test(name)) out.push(p);
  }
  return out;
}
const srcFiles = [...walk(resolve(root, 'preview/home-ui/src')), ...walk(resolve(root, 'src'))];
for (const needle of ['김우동', '2026-04-15']) {
  const hits = [];
  for (const f of srcFiles) {
    readFileSync(f, 'utf8')
      .split(/\r?\n/)
      .forEach((line, i) => {
        if (line.includes(needle)) hits.push(`${relative(root, f).replace(/\\/g, '/')}:${i + 1}`);
      });
  }
  assert(hits.length === 0, `「${needle}」 문자열이 src 에 없음${hits.length ? ` (남은 곳: ${hits.join(', ')})` : ''}`);
}

const boxFn = seedJs.slice(seedJs.indexOf('export function readTutorMemberBox'));
const boxEnd = boxFn.search(/\r?\n\}\r?\n/);
const boxBody = boxEnd > 0 ? boxFn.slice(0, boxEnd) : '';
assert(/tutor_display_name/.test(boxBody), 'readTutorMemberBox 가 tutor_display_name 을 읽는다');
assert(/main_subject_note/.test(boxBody), 'readTutorMemberBox 가 main_subject_note 를 읽는다');
assert(/inquiry_status/.test(boxBody), 'readTutorMemberBox 가 inquiry_status 를 읽는다');
assert(/created_at/.test(boxBody), 'readTutorMemberBox 가 created_at 을 읽는다');
assert(/readUnread\(\)/.test(boxBody) && /getUnreadCount\(\)/.test(seedJs), 'readTutorMemberBox 가 getUnreadCount() 를 읽는다');
assert(/catch\s*\{/.test(boxBody), 'readTutorMemberBox 가 try/catch 로 기본값을 돌려준다');
assert(!/memoInbox|김수학/.test(seedJs), 'tutor-home-seed.js 에 목업 키·시드 이름 없음');

assert(
  /'created_at'\s*=>\s*!empty\(\$row\['created_at'\]\)\s*\?\s*substr\(\(string\) \$row\['created_at'\], 0, 10\)\s*:\s*null/.test(repoPhp),
  'TutorHubRepository 응답에 created_at(YYYY-MM-DD, 없으면 null) 포함',
);

// ── 실행 ──
const mem = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
};
globalThis.localStorage = globalThis.sessionStorage;
globalThis.window = globalThis;
const winEvents = new EventTarget();
globalThis.addEventListener = winEvents.addEventListener.bind(winEvents);
globalThis.removeEventListener = winEvents.removeEventListener.bind(winEvents);
globalThis.dispatchEvent = winEvents.dispatchEvent.bind(winEvents);
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

const server = { tutors: [], threads: [], roi: { fail: true, lifetime_views: null } };
const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
globalThis.fetch = async (url) => {
  const u = String(url);
  if (u.startsWith('/api/registrations/tutors.php')) return json(200, { ok: true, tutors: server.tutors });
  if (u.startsWith('/api/messages/threads.php')) return json(200, { ok: true, threads: server.threads });
  if (u.startsWith('/api/paid/roi.php')) {
    return server.roi.fail
      ? json(500, { ok: false, message: 'roi down' })
      : json(200, { ok: true, lifetime_views: server.roi.lifetime_views });
  }
  return json(404, { ok: false });
};
const origWarn = console.warn;
console.warn = () => {};

const seed = await import('../preview/home-ui/src/tutor-home-seed.js');
const { noteAuthRoleType } = await import('../preview/home-ui/src/auth-role.js');
const { activateRegistrationsApi, hydrateRegistrationsCache } = await import('../preview/home-ui/src/registrations-backend.js');
const { activateMessagesApi, hydrateMessagesCache } = await import('../preview/home-ui/src/messages-backend.js');

let box = seed.readTutorMemberBox();
assert(box.name === '내 과외 프로필', `게스트(등록 API 꺼짐) 이름 = 내 과외 프로필 (got ${box.name})`);
assert(box.subject === '미등록', `게스트 과목 = 미등록 (got ${box.subject})`);
assert(box.inquiry === '—', `게스트 쪽지 상태 = — (got ${box.inquiry})`);
assert(box.unread === 0, `게스트 미확인 = 0 (got ${box.unread})`);
assert(box.registered === '—', `게스트 등록 = — (got ${box.registered})`);
assert(box.views === '…', `조회 불러오는 중 = … (got ${box.views})`);

noteAuthRoleType('tutor');
await activateRegistrationsApi();
await activateMessagesApi();

let renders = 0;
const rerender = () => {
  renders += 1;
};

await seed.bootTutorHome(rerender);
box = seed.readTutorMemberBox();
assert(box.views === '—', `ROI 호출 실패 → 조회 — (got ${box.views})`);
assert(box.unread === 0, `쪽지 데이터 없음 → 미확인 0 (got ${box.unread})`);
assert(box.name === '내 과외 프로필' && box.subject === '미등록', `프로필 없음 → 내 과외 프로필 / 미등록 (got ${box.name} / ${box.subject})`);
assert(box.registered === '—', `created_at 없음 → 등록 — (got ${box.registered})`);
assert(renders === 1, `첫 boot 에서 값이 채워지면 한 번 다시 그린다 (renders=${renders})`);

await seed.bootTutorHome(rerender);
assert(renders === 1, `같은 값이면 다시 그리지 않는다 (renders=${renders})`);

server.roi = { fail: false, lifetime_views: null };
await seed.bootTutorHome(rerender);
box = seed.readTutorMemberBox();
assert(box.views === '0', `ROI 응답했는데 값 없음 → 조회 0 (got ${box.views})`);
assert(renders === 2, `조회 값이 바뀌면 한 번 다시 그린다 (renders=${renders})`);
await seed.bootTutorHome(rerender);
assert(renders === 2, `다시 그린 뒤 boot 는 멈춘다 (renders=${renders})`);

const tutorRow = (patch) => ({
  id: 7,
  tutor_display_name: '테스트쌤',
  main_subject_note: '수학',
  inquiry_status: 'open',
  created_at: '2025-03-04',
  saved_regions: [],
  deleted_at: null,
  ...patch,
});
server.tutors = [tutorRow({})];
server.threads = [
  { id: 1, unread: true, updatedAt: new Date().toISOString() },
  { id: 2, unread: true, updatedAt: new Date().toISOString() },
  { id: 3, unread: false, updatedAt: new Date().toISOString() },
];
await hydrateMessagesCache();
await seed.bootTutorHome(rerender);
box = seed.readTutorMemberBox();
assert(box.name === '테스트쌤', `이름 = 서버 tutor_display_name (got ${box.name})`);
assert(box.subject === '수학', `과목 = 서버 main_subject_note (got ${box.subject})`);
assert(box.inquiry === '쪽지 받음', `inquiry_status open → 쪽지 받음 (got ${box.inquiry})`);
assert(box.unread === 2, `미확인 = getUnreadCount() 2 (got ${box.unread})`);
assert(box.registered === '2025-03-04', `등록 = 서버 created_at (got ${box.registered})`);
assert(renders === 3, `로그인 뒤 서버 값이 들어오면 다시 그린다 (renders=${renders})`);

const cases = [
  [{ inquiry_status: 'paused' }, '쪽지 안받음'],
  [{ inquiry_status: 'not_accepting' }, '쪽지 안받음'],
  [{ inquiry_status: null }, '—'],
];
for (const [patch, want] of cases) {
  server.tutors = [tutorRow(patch)];
  await hydrateRegistrationsCache();
  assert(seed.readTutorMemberBox().inquiry === want, `inquiry_status ${patch.inquiry_status} → ${want}`);
}

server.tutors = [tutorRow({ tutor_display_name: '  ', main_subject_note: '', created_at: null })];
server.threads = [];
await hydrateRegistrationsCache();
await hydrateMessagesCache();
box = seed.readTutorMemberBox();
assert(box.name === '내 과외 프로필', `빈 표시명 → 내 과외 프로필 (got ${box.name})`);
assert(box.subject === '미등록', `빈 과목 → 미등록 (got ${box.subject})`);
assert(box.registered === '—', `created_at null → 등록 — (got ${box.registered})`);
assert(box.unread === 0, `쪽지 0건 → 미확인 0 (got ${box.unread})`);

console.warn = origWarn;
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
