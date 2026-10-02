/**
 * 사이트오류-4 · 홈 [공지 | 동네 인사] 2단 박스 + 공지/고민방/이달의 베스트 레일 읽기 팝업
 * 실행: cd preview/home-ui && npx --yes vite-node ../../scripts/verify-home-news-row.mjs
 *
 * 1부(이 프로세스, DOM 없음)
 *   (a) 문구 상수가 정책 문구와 같고 화면 파일에 직접 없다
 *   (b) 4역할 2단 박스: 받는 중·0건·실패에서 칸·제목 유지, 상태가 서로 다르고 실패를 0건으로 보이지 않는다
 *   (c) 홈 3줄 상한(서버가 더 줘도 3줄), 동네 인사 0건 문구는 공급자/수요자 따로
 *   (d) 공지 노출: view=home 요청만(center 없음), 역할별 서버 응답만 그린다(학생 전용 공지는 학생에게만)
 *   (e) 세션 변경(auth 이벤트) 시 캐시 버림, 브라우저 저장소 쓰기 없음
 *   (f) 본문 「이달의 베스트」 띠 없음, 레일 맨 위 베스트 방마다 1개, 학생은 학생·학부모 방만·공급자 방 팝업 요청 없음
 *   (g) 사이트오류-4b: 공부방 학생 수요 부트 다시 그리기 정확히 1회(공부방 없음·홍보1 없음·지역+성공·지역+실패),
 *       같은 key 는 같은 Promise·새 요청 없음, renderGuestTempNotice 가 번들 소스에 없음
 * 2부(실제 브라우저: Vite 개발 서버 + Playwright chromium, 홈 앱 그대로. API 는 page.route 로 흉내 낸다)
 *   4역할 화면 순서 3칸 → 2단 → 내 박스, 2단 칸 3줄, 공지·고민방·베스트 팝업 열기·hash 불변·닫기·포커스 복귀,
 *   게스트 고민방 팝업 제목만·로그인 안내, 학생 공급자 방 DOM·요청 없음, 본문 베스트 띠 없음,
 *   「더보기」 글자 크기 ≤ 제목, 좁은 화면에서 두 칸 위아래, 세션 변경 시 팝업 닫힘
 *   4b: 홍보1 없는 공부방·있는 공부방·게스트·학생·과외쌤 5상태 홈이 그려지고 #app 다시 그리기가 멈춘다,
 *       공지·고민방·베스트·팝업 저장소 쓰기 없음(전체 쓰기 키는 출력)
 * DB·PHP 서버에 접속하지 않는다.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (rel) => {
  const p = join(root, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
};

// ── 최소 브라우저 환경(document 없음) + 저장소 쓰기 기록 ──
const storageWrites = [];
function makeStorage(name) {
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => {
      storageWrites.push(`${name}:${k}`);
      mem.set(k, String(v));
    },
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear(),
    key: (i) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size;
    },
  };
}
globalThis.sessionStorage = makeStorage('session');
globalThis.localStorage = makeStorage('local');
globalThis.window = globalThis;
const winEvents = new EventTarget();
globalThis.addEventListener = winEvents.addEventListener.bind(winEvents);
globalThis.removeEventListener = winEvents.removeEventListener.bind(winEvents);
globalThis.dispatchEvent = winEvents.dispatchEvent.bind(winEvents);
if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class extends Event {
    constructor(type, init = {}) {
      super(type);
      this.detail = init.detail;
    }
  };
}
Object.defineProperty(globalThis, 'location', {
  value: {
    hash: '#/guest',
    href: 'http://127.0.0.1:5174/#/guest',
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

const POLICY = {
  noticeEmpty: '오늘은 조용한 날이에요. 새 소식이 생기면 가장 먼저 여기에 걸어 둘게요',
  greetingEmptyProvider: '우리 동네에 아직 인사가 도착하지 않았어요. 올려 주시면 이웃들이 반가워할 거예요',
  greetingEmptyDemand: '이웃 공부방과 과외쌤의 첫 인사를 기다리고 있어요',
  loadFailed: '소식을 불러오는 중 길이 막혔어요. 잠시 후 다시 확인해 주세요',
};
const ROOMS = ['concern-director', 'concern-tutor', 'concern-parent'];
const PROVIDER_ROOMS = ['concern-director', 'concern-tutor'];
const VIEWERS = ['guest', 'parent', 'study_room', 'tutor'];
const ME = {
  guest: null,
  parent: { user_id: 21, role_type: 'guardian_student', name: 'p', email: 'p@x.test' },
  study_room: { user_id: 22, role_type: 'study_room_owner', name: 'r', email: 'r@x.test' },
  tutor: { user_id: 23, role_type: 'tutor', name: 't', email: 't@x.test' },
};
const HOME_HASH = { guest: '#/guest', parent: '#/parent', study_room: '#/study-room', tutor: '#/tutor' };
/** 서버 BoardPostService::filterNoticesByRole('home') 와 같은 규칙 */
const HOME_NOTICE_ALLOWED = {
  guest: ['all'],
  parent: ['all', 'student'],
  study_room: ['all', 'study_room'],
  tutor: ['all', 'tutor'],
};

/** 최신순 공지. 역할 전용 공지를 앞에 두어 홈 3줄 안에 들어오게 한다. */
function noticeRows(extra = 0) {
  const base = [
    { id: 'n-student', title: 'NOTICE_STUDENT', targetRole: 'student' },
    { id: 'n-room', title: 'NOTICE_ROOM', targetRole: 'study_room' },
    { id: 'n-tutor', title: 'NOTICE_TUTOR', targetRole: 'tutor' },
    { id: 'n-all-1', title: 'NOTICE_ALL_1', targetRole: 'all' },
    { id: 'n-all-2', title: 'NOTICE_ALL_2', targetRole: 'all' },
    { id: 'n-all-3', title: 'NOTICE_ALL_3', targetRole: 'all' },
    { id: 'n-all-4', title: 'NOTICE_ALL_4', targetRole: 'all' },
  ];
  for (let i = 0; i < extra; i += 1) base.push({ id: `n-more-${i}`, title: `NOTICE_MORE_${i}`, targetRole: 'all' });
  return base.map((n, i) => ({
    ...n,
    boardKey: 'notice',
    date: `2026-09-${String(28 - Math.min(i, 27)).padStart(2, '0')}`,
    body: [`BODY_${n.id}`, '둘째 줄'],
    pinned: false,
  }));
}
function filterNotices(role, rows) {
  const allowed = HOME_NOTICE_ALLOWED[role] || ['all'];
  return rows.filter((n) => allowed.includes(n.targetRole));
}

/* ══════════════════════ 1부 ══════════════════════ */

const requests = [];
const server = { me: null, role: 'guest', notice: 'posts', greet: 'posts', area: '', rooms: [], search: 'ok' };

function json(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function greetingItems(area, n = 6) {
  return Array.from({ length: n }, (_, i) => ({
    provider_type: i % 2 ? 'tutor' : 'study_room',
    registration_id: 100 + i,
    body: `GREETING_BODY_${i}`,
    neighborhood: area,
    display_name: `NAME_${i}`,
    status: 'up',
    updated_at: 1000 - i,
    teaser: `GREETING_TEASER_${i}`,
    masked_name: `N*${i}`,
  }));
}

function concernItem(role, boardKey, n, reactionTotal = 7) {
  const base = {
    id: `${boardKey}-p${n}`,
    boardKey,
    boardLabel: boardKey,
    title: `TITLE_${boardKey}_${n}`,
    type: 'worry',
    createdAt: '2026-10-01T09:00:00+09:00',
    reactionTotal,
    commentCount: 1,
  };
  if (role === 'guest') return base;
  return { ...base, _numericId: 100 + n, description: `BODY_${boardKey}_${n}`, authorDisplayName: 'AUTHOR' };
}

globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input), 'http://127.0.0.1:5174');
  let body = null;
  try {
    body = init.body ? JSON.parse(String(init.body)) : null;
  } catch {
    body = null;
  }
  requests.push({ path: url.pathname, params: Object.fromEntries(url.searchParams), body });
  if (url.pathname.endsWith('/api/registrations/study-rooms.php')) return json(200, { ok: true, rooms: server.rooms });
  if (url.pathname.endsWith('/api/search/search.php')) {
    if (server.search === 'fail') return json(500, { ok: false, message: 'db down' });
    return json(200, { ok: true, items: [{ id: 7001, name: 'STUDENT_7001' }], total: 1 });
  }
  if (url.pathname.endsWith('/api/auth/me.php')) {
    return json(200, server.me ? { ok: true, authenticated: true, email_verified: true, ...server.me } : { ok: true, authenticated: false });
  }
  if (url.pathname.endsWith('/api/neighborhood-greetings.php')) {
    if (server.greet === 'fail') return json(500, { ok: false });
    return json(200, { ok: true, items: server.greet === 'posts' ? greetingItems(server.area) : [] });
  }
  if (url.pathname.endsWith('/api/board/concern-hot.php')) {
    const view = url.searchParams.get('view') || 'hot';
    if (view === 'best') {
      const boards = {};
      for (const key of ROOMS) boards[key] = [9, 8, 7, 4].map((r, i) => concernItem(server.role, key, 90 + i, r));
      return json(200, { ok: true, view, boards });
    }
    return json(200, { ok: true, view, posts: ROOMS.flatMap((key) => [concernItem(server.role, key, 1), concernItem(server.role, key, 2)]) });
  }
  if (url.pathname.endsWith('/api/board/posts.php')) {
    const boardKey = url.searchParams.get('board_key');
    if (boardKey === 'notice') {
      if (server.notice === 'fail') return json(500, { ok: false, message: 'db down' });
      if (server.notice === 'empty') return json(200, { ok: true, access: 'full', posts: [] });
      // 홈 3줄 상한을 화면 쪽에서 보려고 limit 를 무시하고 전부 준다.
      return json(200, { ok: true, access: 'full', posts: filterNotices(server.role, noticeRows()) });
    }
    return json(200, { ok: true, access: 'titles', posts: [], total: 0 });
  }
  return json(404, { ok: false, message: 'not found' });
};

const copyMod = await import('../preview/home-ui/src/home-news-copy.js');
const auth = await import('../preview/home-ui/src/auth-session.js');
const news = await import('../preview/home-ui/src/home-news-row.js');
const banner = await import('../preview/home-ui/src/home-marketing-banner.js');
const rail = await import('../preview/home-ui/src/right-rail.js');
const concernStore = await import('../preview/home-ui/src/concern/store.js');
const concernPopup = await import('../preview/home-ui/src/concern/rail-concern-popup.js');
const locationDisplay = await import('../preview/shared/location-display.js');
const roomSeed = await import('../preview/home-ui/src/study-room-home-seed.js');
const registrations = await import('../preview/home-ui/src/registrations-backend.js');

const COPY = copyMod.HOME_NEWS_COPY || {};
server.area = locationDisplay.readGuestBaseline().room || '';
const tick = (ms = 15) => new Promise((r) => setTimeout(r, ms));

async function signIn(viewer) {
  server.me = ME[viewer];
  server.role = viewer;
  location.hash = HOME_HASH[viewer];
  await auth.initAuthSession?.();
  location.hash = HOME_HASH[viewer];
}

function resetNews() {
  dispatchEvent(new CustomEvent('auth:role-change'));
}

/** @returns {{ row: string, notice: { state: string, html: string }, greeting: { state: string, html: string } }} */
function parseRow(html) {
  const cell = (kind) => {
    const at = html.indexOf(`data-home-news="${kind}"`);
    if (at < 0) return { state: '', html: '' };
    const start = html.lastIndexOf('<section', at);
    const end = html.indexOf('</section>', at);
    const chunk = html.slice(start, end);
    return { state: chunk.match(/data-home-news-state="([^"]+)"/)?.[1] || '', html: chunk };
  };
  return { row: html, notice: cell('notice'), greeting: cell('greeting') };
}

// (a) 문구 상수
ok(
  'a_copy_constants_exact',
  Object.entries(POLICY).every(([k, v]) => COPY[k] === v),
  JSON.stringify(Object.fromEntries(Object.keys(POLICY).map((k) => [k, COPY[k]]))),
);
const SCREEN_FILES = [
  'preview/home-ui/src/screens/guest.js',
  'preview/home-ui/src/screens/parent.js',
  'preview/home-ui/src/screens/study-room.js',
  'preview/home-ui/src/screens/tutor.js',
  'preview/home-ui/src/home-news-row.js',
  'preview/home-ui/src/neighborhood-greeting-ui.js',
  'preview/home-ui/src/home-marketing-banner.js',
  'preview/home-ui/src/right-rail.js',
  'preview/home-ui/src/concern/rail-concern-popup.js',
];
ok(
  'a_no_copy_literals_in_screen_files',
  SCREEN_FILES.every((f) => src(f) !== '') && SCREEN_FILES.every((f) => Object.values(POLICY).every((v) => !src(f).includes(v))),
);
ok('a_no_pressure_tone', () => !/가입하세요|지금 가입|작성하세요|써 주세요|올려야/.test(Object.values(POLICY).join('|')));

// (b)(c)(d) 4역할 × 상태
const exposure = {};
for (const viewer of VIEWERS) {
  await signIn(viewer);
  const isProvider = viewer === 'study_room' || viewer === 'tutor';

  // 받는 중
  resetNews();
  server.notice = 'posts';
  server.greet = 'posts';
  const loading = parseRow(news.renderHomeNewsRow(viewer));
  ok(
    `b_loading_cells_titles_${viewer}`,
    loading.notice.state === 'loading' &&
      loading.greeting.state === 'loading' &&
      loading.notice.html.includes(`>${COPY.noticeTitle}<`) &&
      loading.greeting.html.includes(`>${COPY.greetingTitle}<`) &&
      loading.row.includes(COPY.loading) &&
      !Object.values(POLICY).some((v) => loading.row.includes(v)),
    `${loading.notice.state}/${loading.greeting.state}`,
  );
  await tick();

  // 글 있음
  const before = requests.length;
  const posts = parseRow(news.renderHomeNewsRow(viewer));
  const noticeLines = (posts.notice.html.match(/data-home-notice-open="/g) || []).length;
  const titles = [...posts.notice.html.matchAll(/NOTICE_[A-Z_0-9]+/g)].map((m) => m[0]);
  exposure[viewer] = titles;
  ok(`b_posts_state_${viewer}`, posts.notice.state === 'posts', posts.notice.state);
  ok(`c_notice_home_three_lines_${viewer}`, noticeLines === 3, `lines ${noticeLines}`);
  const expectNotice = filterNotices(viewer, noticeRows()).slice(0, 3).map((n) => n.title);
  ok(`d_notice_exposure_${viewer}`, titles.join('|') === expectNotice.join('|'), `got ${titles.join(',')} want ${expectNotice.join(',')}`);
  if (viewer !== 'parent') ok(`d_no_student_notice_${viewer}`, !posts.row.includes('NOTICE_STUDENT'));
  if (viewer === 'guest') {
    const lines = (posts.greeting.html.match(/class="ng-rail__item"/g) || []).length;
    ok('c_greeting_home_three_lines_guest', posts.greeting.state === 'posts' && lines === 3, `${posts.greeting.state} lines ${lines}`);
    ok('c_guest_greeting_teaser_masked', posts.greeting.html.includes('GREETING_TEASER_0') && !posts.greeting.html.includes('GREETING_BODY_') && !posts.greeting.html.includes('NAME_0'));
  }
  ok(`b_no_refetch_when_fresh_${viewer}`, requests.length === before, `${requests.length - before} requests`);

  // 0건
  resetNews();
  server.notice = 'empty';
  server.greet = 'empty';
  news.renderHomeNewsRow(viewer);
  await tick();
  const empty = parseRow(news.renderHomeNewsRow(viewer));
  const greetEmpty = isProvider ? POLICY.greetingEmptyProvider : POLICY.greetingEmptyDemand;
  const greetOther = isProvider ? POLICY.greetingEmptyDemand : POLICY.greetingEmptyProvider;
  ok(
    `b_empty_copy_${viewer}`,
    empty.notice.state === 'empty' &&
      empty.greeting.state === 'empty' &&
      empty.notice.html.includes(POLICY.noticeEmpty) &&
      empty.greeting.html.includes(greetEmpty) &&
      !empty.greeting.html.includes(greetOther) &&
      !empty.row.includes(POLICY.loadFailed) &&
      empty.notice.html.includes(`>${COPY.noticeTitle}<`) &&
      empty.greeting.html.includes(`>${COPY.greetingTitle}<`),
    `${empty.notice.state}/${empty.greeting.state}`,
  );

  // 실패(0건 문구로 보이면 안 된다)
  resetNews();
  server.notice = 'fail';
  server.greet = 'fail';
  news.renderHomeNewsRow(viewer);
  await tick();
  const fail = parseRow(news.renderHomeNewsRow(viewer));
  ok(
    `b_fail_copy_not_empty_${viewer}`,
    fail.notice.state === 'failed' &&
      fail.greeting.state === 'failed' &&
      fail.notice.html.includes(POLICY.loadFailed) &&
      fail.greeting.html.includes(POLICY.loadFailed) &&
      ![POLICY.noticeEmpty, POLICY.greetingEmptyProvider, POLICY.greetingEmptyDemand].some((v) => fail.row.includes(v)) &&
      fail.notice.html.includes(`>${COPY.noticeTitle}<`) &&
      fail.greeting.html.includes(`>${COPY.greetingTitle}<`),
    `${fail.notice.state}/${fail.greeting.state}`,
  );
  server.notice = 'posts';
  server.greet = 'posts';
}

const noticeReqs = requests.filter((q) => q.path.endsWith('/api/board/posts.php') && q.params.board_key === 'notice');
ok('d_notice_requests_view_home_only', noticeReqs.length > 0 && noticeReqs.every((q) => q.params.view === 'home'), JSON.stringify(noticeReqs.slice(0, 3)));
ok('d_notice_home_requests_limit_3', noticeReqs.every((q) => q.params.limit === '3'));
ok('d_no_local_notice_seed_used', () => !/listNoticesForHome|readGreetings|NOTICE_SEED|SEED_/.test(src('preview/home-ui/src/home-news-row.js')));

// (e) 세션 변경 → 캐시 버림
await signIn('study_room');
resetNews();
news.renderHomeNewsRow('study_room');
await tick();
const warm = parseRow(news.renderHomeNewsRow('study_room'));
dispatchEvent(new CustomEvent('auth:logout'));
const afterLogout = parseRow(news.renderHomeNewsRow('study_room'));
ok('e_auth_event_drops_cache', warm.notice.state === 'posts' && afterLogout.notice.state === 'loading' && afterLogout.greeting.state === 'loading');
await tick();
const NEWS_FILES = [
  'preview/home-ui/src/home-news-row.js',
  'preview/home-ui/src/home-news-loader.js',
  'preview/home-ui/src/home-news-copy.js',
  'preview/home-ui/src/neighborhood-greeting-ui.js',
  'preview/home-ui/src/concern/rail-concern-popup.js',
];
ok('e_no_browser_storage_in_sources', NEWS_FILES.every((f) => src(f) !== '' && !/localStorage|sessionStorage|indexedDB/.test(src(f))));
const newsWrites = storageWrites.filter((k) => /notice|greet|news|concern|best|rail/i.test(k));
ok('e_no_storage_writes_at_runtime', newsWrites.length === 0, newsWrites.join(','));

// (f) 이달의 베스트 이동
const bannerSrc = src('preview/home-ui/src/home-marketing-banner.js');
const railSrc = src('preview/home-ui/src/right-rail.js');
ok('f_body_best_strip_removed', !/renderConcernBestStrip|HOME_BEST_STRIP_PLACEMENT|concern-best-strip|renderHomeNoticeStrip/.test(bannerSrc + railSrc));
ok('f_right_rail_no_best_strip_export', typeof rail.renderConcernBestStrip === 'undefined' && typeof banner.HOME_BEST_STRIP_PLACEMENT === 'undefined');
ok('f_best_css_removed', !/concern-best-strip|concern-best-card/.test(src('preview/home-ui/src/styles/home-right-rail.css')));
for (const viewer of VIEWERS) {
  location.hash = HOME_HASH[viewer];
  const trio = banner.renderHomeMarketingBanner(viewer === 'study_room' ? 'study_room' : viewer);
  ok(`f_trio_has_no_best_or_notice_${viewer}`, !trio.includes('이달의 베스트') && !trio.includes('data-rail-best') && !trio.includes('home-notice-strip'));
}

const expectedRooms = { guest: ROOMS, study_room: ROOMS, tutor: ROOMS, parent: ['concern-parent'] };
for (const viewer of VIEWERS) {
  await signIn(viewer);
  concernStore.resetConcernData();
  rail.renderPromoWithRightRail('home_right_rail', { navRole: viewer });
  await Promise.all([
    concernStore.ensureBestConcernPosts(),
    concernStore.ensureRailConcernPosts('latest'),
    concernStore.ensureRailConcernPosts('hot'),
  ]);
  const html = rail.renderPromoWithRightRail('home_right_rail', { navRole: viewer });
  const bestAt = html.indexOf('data-rail-best');
  const firstRoom = html.indexOf('data-rail-room=');
  const bestChunk = html.slice(html.lastIndexOf('<section', bestAt), html.indexOf('</section>', bestAt));
  const bestKeys = [...bestChunk.matchAll(/data-concern-best-open="([^"]+)"/g)].map((m) => m[1]);
  ok(`f_rail_best_on_top_${viewer}`, bestAt >= 0 && firstRoom > bestAt, `best@${bestAt} room@${firstRoom}`);
  ok(
    `f_rail_best_one_per_room_${viewer}`,
    bestKeys.length === expectedRooms[viewer].length && [...new Set(bestKeys)].length === bestKeys.length && bestKeys.every((k) => expectedRooms[viewer].includes(k)),
    bestKeys.join(','),
  );
  ok(`f_rail_best_top_reaction_item_${viewer}`, expectedRooms[viewer].every((k) => bestChunk.includes(`TITLE_${k}_90`)) && !bestChunk.includes('_93'));
  if (viewer === 'parent') {
    ok(
      'f_student_no_provider_room_dom',
      PROVIDER_ROOMS.every((k) => !html.includes(`data-rail-room="${k}"`) && !html.includes(`data-concern-best-open="${k}"`) && !html.includes(`TITLE_${k}_`)),
    );
    const beforeReq = requests.length;
    let threw = '';
    try {
      for (const k of PROVIDER_ROOMS) {
        concernPopup.openConcernRailPopup({ mode: 'room', boardKey: k, navRole: 'parent', homeBase: '', leaveInNewTab: false });
        concernPopup.openConcernRailPopup({ mode: 'best', boardKey: k, navRole: 'parent', homeBase: '', leaveInNewTab: false });
      }
    } catch (e) {
      threw = String(e?.message || e);
    }
    ok('f_student_provider_room_popup_no_request', !threw && requests.length === beforeReq, threw || `${requests.length - beforeReq} requests`);
  }
  if (viewer === 'guest') ok('f_guest_rail_no_body_author', !/BODY_|AUTHOR/.test(html));
}
ok('f_best_rule_constants', concernPopup.BEST_MIN_REACTIONS === 5 && concernPopup.BEST_PER_BOARD === 3);
ok(
  'f_best_helper_filters_under_5',
  () => {
    const got = concernPopup.bestPostsForBoard({ x: [{ id: 'a', title: 'A', reactionTotal: 9 }, { id: 'b', title: 'B', reactionTotal: 4 }] }, 'x');
    return got.length === 1 && got[0].id === 'a';
  },
);

// (g) 사이트오류-4b: 공부방 홈 학생 수요 부트 — 다시 그리기는 정확히 1회, 같은 key 는 기존 결과 재사용
await signIn('study_room');
const REGION_ROOM = (regionId) => ({
  id: 501,
  profile_status: 'published',
  saved_regions: [{ is_primary: true, region_id: regionId, region_label: server.area, promo_label: server.area }],
});
const BOOT_CASES = [
  { name: 'no_room', rooms: [], search: 'ok', searches: 0, live: [] },
  { name: 'room_without_region', rooms: [{ id: 501, profile_status: 'published', saved_regions: [] }], search: 'ok', searches: 0, live: [] },
  { name: 'region_search_ok', rooms: [REGION_ROOM(1168010600)], search: 'ok', searches: 1, live: [7001] },
  { name: 'region_search_fail', rooms: [REGION_ROOM(1168010700)], search: 'fail', searches: 1, live: [] },
];
const RERENDER_CAP = 5;
const bootSummary = [];
for (const c of BOOT_CASES) {
  server.rooms = c.rooms;
  server.search = c.search;
  await registrations.activateRegistrationsApi();
  const searchCount = () => requests.filter((q) => q.path.endsWith('/api/search/search.php') && q.body?.tab === 'student').length;
  const searchBefore = searchCount();
  let calls = 0;
  // 실제 화면처럼 다시 그리기가 bind 에서 같은 부트를 다시 부른다. 상한을 넘으면 무한 반복으로 본다.
  const rerender = () => {
    calls += 1;
    if (calls <= RERENDER_CAP) roomSeed.bootStudyRoomStudentDemand(rerender);
  };
  let threw = '';
  let first = null;
  try {
    first = roomSeed.bootStudyRoomStudentDemand(rerender);
  } catch (e) {
    threw = String(e?.message || e);
  }
  const syncCalls = calls;
  await first?.catch?.(() => {});
  await tick();
  const again = roomSeed.bootStudyRoomStudentDemand(rerender);
  await again;
  await tick();
  const live = (roomSeed.getStudyRoomStudentLiveItems() || []).map((item) => item.id);
  bootSummary.push(`${c.name}: sync=${syncCalls} total=${calls} searches=${searchCount() - searchBefore}`);
  ok(`g_rerender_once_${c.name}`, !threw && syncCalls === 0 && calls === 1, threw || `sync ${syncCalls} total ${calls}`);
  ok(`g_same_key_reuses_boot_${c.name}`, Boolean(first) && again === first && calls === 1);
  ok(`g_search_requests_${c.name}`, searchCount() - searchBefore === c.searches, `${searchCount() - searchBefore}`);
  ok(`g_student_live_${c.name}`, JSON.stringify(live) === JSON.stringify(c.live), JSON.stringify(live));
}
/** 번들 소스(preview/<번들>/src · preview/shared) 전체 .js */
function bundleSources() {
  const out = [];
  const walk = (dir) => {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === 'node_modules' || ent.name === 'dist') continue;
      const p = join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (/\.(js|mjs)$/.test(ent.name)) out.push(p);
    }
  };
  for (const b of ['home-ui', 'search-ui', 'study-room-ui', 'tutor-ui', 'auth-ui']) {
    const dir = join(root, 'preview', b, 'src');
    if (existsSync(dir)) walk(dir);
  }
  walk(join(root, 'preview', 'shared'));
  return out;
}
const BUNDLE_FILES = bundleSources();
const tempNoticeLeft = BUNDLE_FILES.filter((p) => readFileSync(p, 'utf8').includes('renderGuestTempNotice'));
ok('g_removed_guest_temp_notice', BUNDLE_FILES.length > 50 && tempNoticeLeft.length === 0, tempNoticeLeft.join(','));
server.rooms = [];
server.search = 'ok';

console.log('\n공부방 학생 수요 부트(다시 그리기 횟수):');
for (const line of bootSummary) console.log(`  ${line}`);

console.log('\n역할별 홈 공지 3줄(서버 view=home 응답 기준):');
for (const [viewer, titles] of Object.entries(exposure)) console.log(`  ${viewer.padEnd(10)} ${titles.join(', ')}`);

/* ══════════════════════ 2부 (브라우저) ══════════════════════ */

const B = 'B_';
const SHOT_DIR = join(process.env.TEMP || tmpdir(), 's114-home-news-row');
const bServer = { me: null, role: 'guest', notices: noticeRows(8), area: server.area, roomRegion: true };
const bRequests = [];

function roleFromMe(me) {
  if (!me) return 'guest';
  if (me.role_type === 'guardian_student') return 'parent';
  if (me.role_type === 'study_room_owner') return 'study_room';
  if (me.role_type === 'tutor') return 'tutor';
  return 'guest';
}

/** 고민방 게시판 서버 흉내: 게스트는 제목 항목, 학생은 학생·학부모 방만, 공급자는 전부. */
function concernAccess(role, boardKey) {
  if (role === 'guest') return 'titles';
  if (role === 'parent') return boardKey === 'concern-parent' ? 'full' : 'blocked';
  return 'full';
}

async function bRoute(route) {
  const req = route.request();
  const url = new URL(req.url());
  const fulfill = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  bRequests.push({ path: url.pathname, params: Object.fromEntries(url.searchParams) });
  const role = roleFromMe(bServer.me);
  if (url.pathname.endsWith('/api/auth/me.php')) {
    return fulfill(200, bServer.me ? { ok: true, authenticated: true, email_verified: true, ...bServer.me } : { ok: true, authenticated: false });
  }
  if (url.pathname.endsWith('/api/neighborhood-greetings.php')) return fulfill(200, { ok: true, items: greetingItems(bServer.area) });
  // 공부방 세션: 등록 공부방 하나. bServer.roomRegion 이 false 면 홍보1 지역이 없는 공부방.
  if (url.pathname.endsWith('/api/registrations/study-rooms.php') && role === 'study_room') {
    return fulfill(200, {
      ok: true,
      rooms: [
        {
          id: 501,
          profile_status: 'published',
          name: 'ROOM_501',
          region_label: bServer.area,
          location_label: bServer.area,
          saved_regions: bServer.roomRegion
            ? [{ is_primary: true, region_id: 1168010600, region_label: bServer.area, promo_label: bServer.area }]
            : [],
        },
      ],
    });
  }
  if (url.pathname.endsWith('/api/search/search.php')) return fulfill(200, { ok: true, items: [], total: 0 });
  if (url.pathname.endsWith('/api/board/concern-hot.php')) {
    const view = url.searchParams.get('view') || 'hot';
    if (view === 'best') {
      const boards = {};
      for (const key of ROOMS) boards[key] = [9, 8, 7, 4].map((r, i) => concernItem(role, key, 90 + i, r));
      return fulfill(200, { ok: true, view, boards });
    }
    return fulfill(200, { ok: true, view, posts: ROOMS.flatMap((key) => [1, 2, 3].map((n) => concernItem(role, key, n))) });
  }
  if (url.pathname.endsWith('/api/board/posts.php')) {
    const boardKey = url.searchParams.get('board_key') || '';
    if (boardKey === 'notice') {
      return fulfill(200, { ok: true, access: 'full', posts: filterNotices(role, bServer.notices) });
    }
    if (ROOMS.includes(boardKey)) {
      const access = concernAccess(role, boardKey);
      if (access === 'blocked') return fulfill(403, { ok: false, error: 'forbidden', message: 'forbidden' });
      const all = Array.from({ length: 13 }, (_, i) => concernItem(role, boardKey, i + 1));
      const best = [9, 8, 7].map((r, i) => concernItem(role, boardKey, 90 + i, r));
      const postKey = url.searchParams.get('post_key');
      if (postKey) {
        const p = [...all, ...best].find((x) => x.id === postKey);
        return fulfill(200, { ok: true, access, posts: p ? [p] : [], total: p ? 1 : 0 });
      }
      const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || 20), 50));
      const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
      return fulfill(200, { ok: true, access, posts: all.slice(offset, offset + limit), total: all.length, limit, offset });
    }
    return fulfill(200, { ok: true, access: role === 'guest' ? 'titles' : 'full', posts: [], total: 0, limit: 3, offset: 0 });
  }
  return fulfill(404, { ok: false, message: 'nf' });
}

/** PLAYWRIGHT_BROWSERS_PATH 가 빈 폴더를 가리키면 기본 설치 위치(ms-playwright)의 chromium 으로 다시 띄운다. */
async function launchChromium(chromium) {
  try {
    return await chromium.launch();
  } catch (first) {
    const base = process.env.LOCALAPPDATA
      ? join(process.env.LOCALAPPDATA, 'ms-playwright')
      : join(process.env.HOME || '', process.platform === 'darwin' ? 'Library/Caches/ms-playwright' : '.cache/ms-playwright');
    const dirs = existsSync(base) ? readdirSync(base) : [];
    const candidates = [
      ...dirs.filter((d) => d.startsWith('chromium_headless_shell-')).map((d) => join(base, d, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe')),
      ...dirs.filter((d) => d.startsWith('chromium_headless_shell-')).map((d) => join(base, d, 'chrome-linux', 'headless_shell')),
      ...dirs.filter((d) => /^chromium-\d+$/.test(d)).map((d) => join(base, d, 'chrome-win', 'chrome.exe')),
      ...dirs.filter((d) => /^chromium-\d+$/.test(d)).map((d) => join(base, d, 'chrome-win64', 'chrome.exe')),
    ].filter((p) => existsSync(p));
    if (!candidates.length) throw first;
    return chromium.launch({ executablePath: candidates[0] });
  }
}

const NEXT_BOX = {
  guest: '.hero-map',
  parent: '.provider-home-tabs',
  study_room: '.home-mkt-wrap__panel, .provider-home-tabs',
  tutor: '.provider-home-tabs',
};
const domOrder = {};
const steadyLog = [];
const greetingWriteTags = [];
const GREETING_STORAGE_KEY = 'local:study114-neighborhood-greetings-v1';

let viteServer = null;
let browser = null;
try {
  const homeRequire = createRequire(join(root, 'preview', 'home-ui', 'package.json'));
  const viteDir = dirname(homeRequire.resolve('vite/package.json'));
  const { createServer } = await import(pathToFileURL(join(viteDir, 'dist', 'node', 'index.js')).href);
  const rootRequire = createRequire(join(root, 'package.json'));
  const { chromium } = rootRequire('playwright');

  viteServer = await createServer({
    root: join(root, 'preview', 'home-ui'),
    configFile: join(root, 'preview', 'home-ui', 'vite.config.js'),
    logLevel: 'error',
    clearScreen: false,
    server: { port: 5198, strictPort: false, host: '127.0.0.1', hmr: false, open: false },
  });
  await viteServer.listen();
  const origin = `http://127.0.0.1:${viteServer.httpServer.address().port}`;
  browser = await launchChromium(chromium);
  mkdirSync(SHOT_DIR, { recursive: true });

  async function openHome(viewer, viewport = { width: 1280, height: 900 }) {
    bServer.me = ME[viewer];
    bServer.role = viewer;
    const context = await browser.newContext({ viewport });
    // 저장소 쓰기 기록 + #app 통째 다시 그리기 횟수(#app 직계 자식 교체)
    await context.addInitScript(`(() => {
      window.__s114Writes = [];
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        window.__s114Writes.push((this === window.sessionStorage ? 'session:' : 'local:') + k);
        return set.call(this, k, v);
      };
      window.__s114AppRenders = 0;
      document.addEventListener('DOMContentLoaded', () => {
        const app = document.getElementById('app');
        if (!app) return;
        new MutationObserver((recs) => {
          if (recs.some((r) => r.type === 'childList')) window.__s114AppRenders += 1;
        }).observe(app, { childList: true });
      });
    })();`);
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e?.message || e)));
    await page.route('**/*', (route) => {
      const u = new URL(route.request().url());
      if (u.origin !== origin) return route.abort();
      if (u.pathname.startsWith('/api/')) return bRoute(route);
      return route.continue();
    });
    await page.goto(`${origin}/${HOME_HASH[viewer]}`);
    const ready = await page
      .waitForSelector('[data-home-news-row] [data-home-news="notice"][data-home-news-state="posts"]', { timeout: 20000 })
      .then(() => true)
      .catch(() => false);
    await page.waitForSelector('[data-home-news="greeting"]:not([data-home-news-state="loading"])', { timeout: 5000 }).catch(() => {});
    return { context, page, pageErrors, ready };
  }
  const evIn = (page) => (fn, arg) => page.evaluate(fn, arg).catch((e) => `ERR:${e?.message || e}`);
  const waitIn = (page) => async (sel, timeout = 4000, state = 'attached') => {
    try {
      await page.waitForSelector(sel, { timeout, state });
      return true;
    } catch {
      return false;
    }
  };
  const popupInfo = (page) =>
    evIn(page)(() => {
      const p = document.getElementById('rail-popup');
      const d = p?.querySelector('[role="dialog"]');
      const a = document.activeElement;
      return {
        open: Boolean(p),
        kind: p?.getAttribute('data-rail-popup-kind') || '',
        modal: d?.getAttribute('aria-modal') || '',
        title: p?.querySelector('.rail-popup__title')?.textContent?.trim() || '',
        selected: p?.querySelector('.rail-popup__post-title')?.textContent?.trim() || '',
        body: p?.querySelector('.rail-popup__body')?.textContent || '',
        guest: p?.querySelector('.rail-popup__guest-text')?.textContent?.trim() || '',
        login: Boolean(p?.querySelector('.rail-popup__login')),
        items: [...(p?.querySelectorAll('[data-rail-popup-item]') || [])].map((el) => el.querySelector('.rail-popup__item-title')?.textContent?.trim() || ''),
        pages: (p?.querySelectorAll('[data-rail-popup-page]:not(.rail-popup__page--step)') || []).length,
        go: p?.querySelector('[data-rail-popup-leave]')?.getAttribute('href') || '',
        goText: p?.querySelector('[data-rail-popup-leave]')?.textContent?.trim() || '',
        focusInPopup: Boolean(a && p?.contains(a)),
      };
    });

  for (const viewer of VIEWERS) {
    const reqStart = bRequests.length;
    const { context, page, pageErrors, ready } = await openHome(viewer);
    const ev = evIn(page);
    const wait = waitIn(page);
    const tag = viewer;
    const where = ready
      ? ''
      : JSON.stringify(
          await ev(() => ({
            hash: location.hash,
            row: Boolean(document.querySelector('[data-home-news-row]')),
            state: document.querySelector('[data-home-news="notice"]')?.getAttribute('data-home-news-state') || '',
            text: (document.body?.innerText || '').slice(0, 300),
          })),
        );
    ok(`${B}home_row_loaded_${tag}`, ready, `${where} errors=${pageErrors.slice(0, 3).join(' | ')}`);

    // 순서: 3칸 → 2단 → 내 박스
    const order = await ev((nextSel) => {
      const trio = document.querySelector('.home-promo-trio');
      const row = document.querySelector('[data-home-news-row]');
      const next = document.querySelector(nextSel);
      const before = (a, b) => Boolean(a && b && a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      const siblings = row?.parentElement
        ? [...row.parentElement.children].map((el) => (el.getAttribute('class') || el.tagName).split(' ')[0]).slice(0, 6)
        : [];
      return {
        trioThenRow: trio?.nextElementSibling === row,
        rowBeforeNext: before(row, next),
        nextFound: Boolean(next),
        rows: document.querySelectorAll('[data-home-news-row]').length,
        siblings,
        noticeLines: row?.querySelectorAll('[data-home-notice-open]').length ?? -1,
        greetingLines: row?.querySelectorAll('.ng-rail__item').length ?? -1,
        greetingState: row?.querySelector('[data-home-news="greeting"]')?.getAttribute('data-home-news-state') || '',
        noticeTitles: [...(row?.querySelectorAll('.home-news-row__notice-title') || [])].map((el) => el.textContent.trim()),
        heroArea: document.querySelector('.hero-map')?.getAttribute('data-region-label') || '',
        bodyBestStrip: document.querySelectorAll('.concern-best-strip, [data-concern-best-strip]').length,
        mainBest: [...document.querySelectorAll('[data-rail-best]')].filter((el) => !el.closest('[data-right-rail-slot]')).length,
      };
    }, NEXT_BOX[viewer]);
    domOrder[viewer] = Array.isArray(order?.siblings) ? order.siblings.join(' > ') : String(order);
    ok(`${B}order_trio_row_mybox_${tag}`, order.trioThenRow && order.rowBeforeNext && order.rows === 1, JSON.stringify(order));
    ok(`${B}notice_three_lines_${tag}`, order.noticeLines === 3, String(order.noticeLines));
    ok(
      `${B}notice_exposure_${tag}`,
      order.noticeTitles.join('|') === filterNotices(viewer, bServer.notices).slice(0, 3).map((n) => n.title).join('|'),
      order.noticeTitles.join(','),
    );
    if (viewer === 'guest') {
      ok(`${B}greeting_three_lines_guest`, order.greetingLines === 3, `${order.greetingState} ${order.greetingLines} area=${order.heroArea}/${bServer.area}`);
    } else {
      ok(`${B}greeting_cell_settled_${tag}`, ['posts', 'empty'].includes(order.greetingState) && order.greetingLines <= 3, order.greetingState);
    }
    ok(`${B}no_best_strip_in_body_${tag}`, order.bodyBestStrip === 0 && order.mainBest === 0);

    // 글자 크기: 「더보기」 ≤ 칸 제목, 레일 「더보기」 ≤ 띠 제목
    const fonts = await ev(() => {
      const px = (el) => (el ? parseFloat(getComputedStyle(el).fontSize) : NaN);
      const pairs = [];
      document.querySelectorAll('.home-news-row__cell').forEach((cell) => {
        pairs.push(['row', px(cell.querySelector('.home-news-row__more')), px(cell.querySelector('.home-news-row__title'))]);
      });
      document.querySelectorAll('[data-right-rail-slot] .live-rail-slot').forEach((slot) => {
        const more = slot.querySelector('.live-rail-room__more, [data-info-rail-more], .live-rail-slot__cta');
        const title = slot.querySelector('.live-rail-slot__title');
        if (more && title) pairs.push([slot.className.split(' ')[1] || 'slot', px(more), px(title)]);
      });
      return pairs;
    });
    ok(
      `${B}more_font_le_title_${tag}`,
      fonts.length >= 2 && fonts.every(([, m, t]) => Number.isFinite(m) && Number.isFinite(t) && m <= t),
      JSON.stringify(fonts),
    );
    ok(
      `${B}titles_have_aria_label_${tag}`,
      await ev(() =>
        [...document.querySelectorAll('.home-news-row__title')].every((h) => h.getAttribute('aria-label')) &&
        [...document.querySelectorAll('.home-news-row__more')].every((b) => b.tagName === 'BUTTON' && b.tabIndex >= 0 && b.getAttribute('aria-label')),
      ),
    );

    // 레일: 맨 위 이달의 베스트, 방마다 1개
    await wait('[data-right-rail-slot] [data-rail-best][data-rail-state="posts"]', 8000);
    const railInfo = await ev(() => {
      const r = document.querySelector('[data-right-rail-slot="home_right_rail"]');
      const best = r?.querySelector('[data-rail-best]');
      const firstRoom = r?.querySelector('[data-rail-room]');
      return {
        bestFirst: Boolean(best && firstRoom && best.compareDocumentPosition(firstRoom) & Node.DOCUMENT_POSITION_FOLLOWING),
        bestKeys: [...(best?.querySelectorAll('[data-concern-best-open]') || [])].map((b) => b.getAttribute('data-concern-best-open')),
        rooms: [...(r?.querySelectorAll('[data-rail-room]') || [])].map((s) => s.getAttribute('data-rail-room')),
        bestTitle: best?.querySelector('.live-rail-slot__title')?.textContent?.trim() || '',
      };
    });
    const wantRooms = viewer === 'parent' ? ['concern-parent'] : ROOMS;
    ok(
      `${B}rail_best_top_one_per_room_${tag}`,
      railInfo.bestFirst &&
        railInfo.bestTitle === '이달의 베스트' &&
        railInfo.bestKeys.length === wantRooms.length &&
        wantRooms.every((k) => railInfo.bestKeys.includes(k)),
      JSON.stringify(railInfo),
    );
    if (viewer === 'parent') {
      ok(`${B}student_no_provider_room_dom`, PROVIDER_ROOMS.every((k) => !railInfo.rooms.includes(k) && !railInfo.bestKeys.includes(k)));
    }

    const hash0 = await ev(() => location.hash);

    // 공지 팝업: 제목 클릭 → 그 공지 선택
    const firstNotice = filterNotices(viewer, bServer.notices)[0];
    await page.click(`[data-home-notice-open="${firstNotice.id}"]`).catch(() => {});
    const nOpen = await wait('#rail-popup .rail-popup__body');
    const n1 = await popupInfo(page);
    ok(
      `${B}notice_popup_open_selected_${tag}`,
      nOpen && n1.kind === 'notice' && n1.modal === 'true' && n1.selected === firstNotice.title && n1.body.includes(`BODY_${firstNotice.id}`),
      JSON.stringify(n1),
    );
    ok(`${B}notice_popup_hash_unchanged_${tag}`, (await ev(() => location.hash)) === hash0);
    const visible = filterNotices(viewer, bServer.notices);
    ok(
      `${B}notice_popup_list_10_per_page_exposure_${tag}`,
      n1.items.length === Math.min(10, visible.length) &&
        n1.pages === Math.ceil(visible.length / 10) &&
        n1.items.every((t) => visible.some((n) => n.title === t)) &&
        (viewer === 'parent' || !n1.items.includes('NOTICE_STUDENT')),
      `${n1.items.length} items ${n1.pages} pages`,
    );
    ok(`${B}notice_popup_go_board_${tag}`, n1.go === '#/support/notice' && n1.goText === '게시판에서 보기', `${n1.go} ${n1.goText}`);
    ok(`${B}notice_popup_focus_inside_${tag}`, n1.focusInPopup);
    // 팝업 안에서 다른 공지 고르기
    if (n1.items.length > 1) {
      await page.click('#rail-popup [data-rail-popup-item]:nth-of-type(1)').catch(() => {});
      await page.locator('#rail-popup [data-rail-popup-item]').nth(1).click().catch(() => {});
      await page.waitForFunction((t) => document.querySelector('#rail-popup .rail-popup__post-title')?.textContent?.trim() === t, n1.items[1], { timeout: 3000 }).catch(() => {});
      ok(`${B}notice_popup_switch_${tag}`, (await popupInfo(page)).selected === n1.items[1]);
    }
    await page.keyboard.press('Escape');
    const nClosed = await wait('#rail-popup', 3000, 'detached');
    const back = await ev(() => document.activeElement?.getAttribute('data-home-notice-open') || '');
    ok(`${B}notice_popup_esc_focus_back_${tag}`, nClosed && back === firstNotice.id, back);
    // 「더보기」 → 최신 공지
    await page.click('[data-home-notice-more]').catch(() => {});
    await wait('#rail-popup .rail-popup__body');
    const n2 = await popupInfo(page);
    ok(`${B}notice_more_selects_latest_${tag}`, n2.selected === visible[0].title, n2.selected);
    await page.click('#rail-popup .rail-popup__close').catch(() => {});
    const n2Closed = await wait('#rail-popup', 3000, 'detached');
    ok(`${B}notice_close_focus_back_to_more_${tag}`, n2Closed && (await ev(() => document.activeElement?.hasAttribute('data-home-notice-more'))) === true);

    // 고민방 방 배너 팝업
    const roomKey = viewer === 'parent' ? 'concern-parent' : 'concern-director';
    await wait(`[data-right-rail-slot] [data-rail-room="${roomKey}"] [data-concern-rail-post]`, 6000);
    await page.click(`[data-right-rail-slot] [data-rail-room="${roomKey}"] [data-concern-rail-post="${roomKey}-p1"]`).catch(() => {});
    await wait('#rail-popup .rail-popup__post-title');
    await page.waitForFunction(() => document.querySelectorAll('#rail-popup [data-rail-popup-item]').length > 0, null, { timeout: 4000 }).catch(() => {});
    const c1 = await popupInfo(page);
    ok(`${B}concern_room_popup_open_${tag}`, c1.kind === 'concern-room' && c1.modal === 'true' && c1.selected === `TITLE_${roomKey}_1`, JSON.stringify(c1));
    ok(`${B}concern_room_popup_list_pages_${tag}`, c1.items.length === 10 && c1.pages === 2, `${c1.items.length}/${c1.pages}`);
    ok(`${B}concern_room_popup_hash_unchanged_${tag}`, (await ev(() => location.hash)) === hash0);
    ok(`${B}concern_room_popup_go_board_${tag}`, c1.go.startsWith('#/community/') && c1.goText === '게시판에서 보기', c1.go);
    if (viewer === 'guest') {
      ok(
        `${B}guest_concern_popup_titles_only`,
        c1.body === '' && c1.guest === '로그인하면 전체 내용을 볼 수 있어요' && c1.login && c1.items.length > 0,
        JSON.stringify({ body: c1.body, guest: c1.guest, login: c1.login }),
      );
    } else {
      ok(`${B}concern_room_popup_body_${tag}`, c1.body.includes(`BODY_${roomKey}_1`), c1.body);
    }
    await page.keyboard.press('Escape');
    const cClosed = await wait('#rail-popup', 3000, 'detached');
    const cBack = await ev(() => document.activeElement?.getAttribute('data-concern-rail-post') || '');
    ok(`${B}concern_room_popup_esc_focus_back_${tag}`, cClosed && cBack === `${roomKey}-p1`, cBack);
    // 방 「더보기」 → 최신 글
    await page.click(`[data-right-rail-slot] [data-rail-room="${roomKey}"] [data-concern-rail-more]`).catch(() => {});
    await wait('#rail-popup .rail-popup__post-title');
    ok(`${B}concern_room_more_latest_${tag}`, (await popupInfo(page)).selected === `TITLE_${roomKey}_1`);
    await page.mouse.click(5, 5);
    ok(`${B}concern_room_backdrop_close_${tag}`, await wait('#rail-popup', 3000, 'detached'));

    // 이달의 베스트 팝업: 그 방 베스트 최대 3개
    await page.click(`[data-right-rail-slot] [data-concern-best-open="${roomKey}"]`).catch(() => {});
    await wait('#rail-popup .rail-popup__post-title');
    await page.waitForFunction(() => document.querySelectorAll('#rail-popup [data-rail-popup-item]').length > 0, null, { timeout: 4000 }).catch(() => {});
    const b1 = await popupInfo(page);
    ok(
      `${B}best_popup_open_three_${tag}`,
      b1.kind === 'concern-best' && b1.selected === `TITLE_${roomKey}_90` && b1.items.length === 3 && !b1.items.includes(`TITLE_${roomKey}_93`),
      JSON.stringify({ kind: b1.kind, selected: b1.selected, items: b1.items }),
    );
    ok(`${B}best_popup_hash_unchanged_${tag}`, (await ev(() => location.hash)) === hash0);
    if (b1.items.length > 1) {
      await page.locator('#rail-popup [data-rail-popup-item]').nth(1).click().catch(() => {});
      await page.waitForFunction((t) => document.querySelector('#rail-popup .rail-popup__post-title')?.textContent?.trim() === t, b1.items[1], { timeout: 3000 }).catch(() => {});
      ok(`${B}best_popup_switch_${tag}`, (await popupInfo(page)).selected === b1.items[1]);
    }
    await page.click('#rail-popup .rail-popup__close').catch(() => {});
    const bClosed = await wait('#rail-popup', 3000, 'detached');
    const bBack = await ev(() => document.activeElement?.getAttribute('data-concern-best-open') || '');
    ok(`${B}best_popup_close_focus_back_${tag}`, bClosed && bBack === roomKey, bBack);

    if (viewer === 'parent') {
      const leaked = bRequests
        .slice(reqStart)
        .filter((q) => q.path.endsWith('/api/board/posts.php') && PROVIDER_ROOMS.includes(q.params.board_key));
      ok(`${B}student_no_provider_room_requests`, leaked.length === 0, JSON.stringify(leaked.slice(0, 2)));
    }

    // 세션 변경 → 팝업 닫힘
    if (viewer === 'study_room') {
      await page.click('[data-home-notice-more]').catch(() => {});
      await wait('#rail-popup .rail-popup__body');
      await ev(() => window.dispatchEvent(new CustomEvent('auth:logout')));
      ok(`${B}auth_change_closes_popup`, await wait('#rail-popup', 3000, 'detached'));
    }

    await page.screenshot({ path: join(SHOT_DIR, `home-${viewer}.png`), fullPage: false }).catch(() => {});
    const ourErrors = pageErrors.filter((m) => /home-news|rail-concern|rail-popup|neighborhood-greeting|right-rail/i.test(m));
    ok(`${B}no_page_errors_from_changed_modules_${tag}`, ourErrors.length === 0, ourErrors.join(' | '));
    await context.close();
  }

  // 사이트오류-4b: 5가지 상태로 홈이 멈추지 않고 그려지고, 다 그린 뒤 #app 다시 그리기가 멈춘다
  const STEADY = [
    { tag: 'study_room_no_region', viewer: 'study_room', roomRegion: false },
    { tag: 'study_room_region', viewer: 'study_room', roomRegion: true },
    { tag: 'guest', viewer: 'guest', roomRegion: true },
    { tag: 'parent', viewer: 'parent', roomRegion: true },
    { tag: 'tutor', viewer: 'tutor', roomRegion: true },
  ];
  const APP_RENDER_CAP = 20;
  for (const s of STEADY) {
    bServer.roomRegion = s.roomRegion;
    const { context, page, pageErrors, ready } = await openHome(s.viewer);
    await page.waitForTimeout(3000);
    const probe = () =>
      Promise.race([
        page.evaluate(() => ({ renders: window.__s114AppRenders, writes: [...window.__s114Writes], row: Boolean(document.querySelector('[data-home-news-row]')) })),
        new Promise((r) => setTimeout(() => r(null), 5000)),
      ]).catch(() => null);
    const p1 = await probe();
    await page.waitForTimeout(2000);
    const p2 = await probe();
    const writeCounts = {};
    for (const k of p2?.writes || []) writeCounts[k] = (writeCounts[k] || 0) + 1;
    steadyLog.push(`${s.tag.padEnd(22)} renders=${p1?.renders ?? '멈춤'}→${p2?.renders ?? '멈춤'} writes=${JSON.stringify(writeCounts)}`);
    const newsWrites = (p2?.writes || []).filter((k) => /notice|news|concern|best|popup|rail/i.test(k));
    ok(`${B}no_storage_writes_news_popup_${s.tag}`, Boolean(p2) && newsWrites.length === 0, newsWrites.join(','));
    if ((p2?.writes || []).includes(GREETING_STORAGE_KEY)) greetingWriteTags.push(s.tag);
    const crash = pageErrors.filter((m) => /Maximum call stack|too much recursion/i.test(m));
    ok(`${B}steady_home_rendered_${s.tag}`, ready && Boolean(p2?.row) && crash.length === 0, `${pageErrors.slice(0, 2).join(' | ')}`);
    ok(
      `${B}steady_app_renders_capped_${s.tag}`,
      Boolean(p1 && p2) && p2.renders <= APP_RENDER_CAP && p2.renders === p1.renders,
      `${p1?.renders}→${p2?.renders}`,
    );
    await context.close();
  }
  bServer.roomRegion = true;

  // 좁은 화면: 두 칸 위아래
  const narrow = await openHome('guest', { width: 600, height: 900 });
  const stack = await evIn(narrow.page)(() => {
    const [a, b] = [...document.querySelectorAll('.home-news-row__cell')].map((el) => el.getBoundingClientRect());
    return a && b ? { stacked: b.top >= a.bottom - 1, sameLeft: Math.abs(a.left - b.left) < 2 } : null;
  });
  ok(`${B}mobile_cells_stacked`, Boolean(stack?.stacked && stack?.sameLeft), JSON.stringify(stack));
  await narrow.page.screenshot({ path: join(SHOT_DIR, 'home-guest-mobile.png'), fullPage: false }).catch(() => {});
  await narrow.context.close();
} catch (e) {
  ok(`${B}browser_part_ran`, false, String(e?.stack || e));
} finally {
  if (browser) await browser.close().catch(() => {});
  if (viteServer) await viteServer.close().catch(() => {});
}

console.log('\n4역할 홈 2단 박스 형제 순서(부모 안 앞 6개):');
for (const [viewer, line] of Object.entries(domOrder)) console.log(`  ${viewer.padEnd(10)} ${line}`);
console.log('\n5가지 상태 홈(#app 다시 그리기 3초→5초, 저장소 쓰기 키):');
for (const line of steadyLog) console.log(`  ${line}`);
if (greetingWriteTags.length) {
  console.log(
    `  참고: ${GREETING_STORAGE_KEY} 쓰기가 남아 있다(${greetingWriteTags.join(', ')}). main.js 의 pullNeighborhoodGreetings 가 쓴다 —` +
      ' 마이페이지 인사 편집·내리기와 가입 완료 화면이 이 키를 읽어 이번에 지우지 않았다.',
  );
}
console.log(`스크린샷: ${SHOT_DIR}`);

console.log(`\n${passed} passed / ${failed} failed`);
if (failed) process.exit(1);
console.log('home-news-row verify ok');
