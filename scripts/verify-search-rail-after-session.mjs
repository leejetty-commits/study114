/**
 * 234c-3a · 찾기 첫 화면 레일 6건은 me.php 확인 뒤에 한 번만.
 * 실행: cd preview/search-ui && npx vite-node ../../scripts/verify-search-rail-after-session.mjs
 *
 * DB·서버에 접속하지 않는다. me.php·concern-hot.php·posts.php 는 여기서 흉내 낸다.
 */
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
    hash: '#/search/room',
    href: 'http://127.0.0.1:5176/#/search/room',
    origin: 'http://127.0.0.1:5176',
    host: '127.0.0.1:5176',
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

/** @type {'member'|'guest'|'student'|'fail'} */
let meMode = 'guest';
/** @type {string[]} */
const calls = [];

const ROOMS = ['concern-director', 'concern-tutor', 'concern-parent'];
const INFO = ['info-room', 'info-tutor', 'info-student'];

function json(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function concernItem(boardKey, n) {
  return {
    id: `${boardKey}-p${n}`,
    boardKey,
    boardLabel: boardKey,
    title: `TITLE_${boardKey}_${n}`,
    type: 'worry',
    createdAt: '2026-10-01T09:00:00+09:00',
    reactionTotal: 7,
    commentCount: 1,
    description: `BODY_${boardKey}`,
    authorDisplayName: `AUTHOR_${boardKey}`,
  };
}

function infoItem(boardKey, n) {
  return {
    id: `${boardKey}-i${n}`,
    title: `INFO_${boardKey}_${n}`,
    categoryId: 'know-how',
    createdAt: '2026-10-02T09:00:00+09:00',
    body: `BODY_${boardKey}`,
    authorDisplayName: `AUTHOR_${boardKey}`,
  };
}

function meBody() {
  if (meMode === 'guest') return { ok: true, authenticated: false };
  const role = meMode === 'student' ? 'guardian_student' : 'study_room_owner';
  return {
    ok: true,
    authenticated: true,
    email_verified: true,
    user_id: meMode === 'student' ? 8 : 7,
    email: 'member@example.com',
    role_type: role,
    name: '회원',
    admin_level: null,
    needs_basic_register: false,
    oauth_role_pending: false,
  };
}

globalThis.fetch = async (input) => {
  const url = new URL(String(input), 'http://127.0.0.1:5176');
  calls.push(`${url.pathname}${url.search}`);
  if (url.pathname.endsWith('/api/auth/me.php')) {
    if (meMode === 'fail') throw new Error('offline');
    return json(200, meBody());
  }
  if (url.pathname.endsWith('/api/board/concern-hot.php')) {
    const view = url.searchParams.get('view') || 'hot';
    if (view === 'best') {
      const boards = {};
      for (const key of ROOMS) boards[key] = [concernItem(key, 9)];
      return json(200, { ok: true, view, boards });
    }
    const posts = ROOMS.flatMap((key) => [concernItem(key, 1), concernItem(key, 2)]);
    return json(200, { ok: true, view, posts });
  }
  if (url.pathname.endsWith('/api/board/posts.php')) {
    const boardKey = url.searchParams.get('board_key') || '';
    return json(200, {
      ok: true,
      access: 'titles',
      posts: INFO.includes(boardKey) ? [infoItem(boardKey, 1), infoItem(boardKey, 2), infoItem(boardKey, 3)] : [],
      total: 3,
    });
  }
  return json(200, { ok: true, posts: [], items: [], threads: [] });
};

const page = await import('../preview/search-ui/src/screens/search-page.js');
const layout = await import('../preview/search-ui/src/layout.js');
const rail = await import('../preview/home-ui/src/right-rail.js');
const auth = await import('../preview/home-ui/src/auth-session.js');
const store = await import('../preview/home-ui/src/concern/store.js');
const infoStore = await import('../preview/home-ui/src/library/info-board-store.js');

let passed = 0;
let failed = 0;
function ok(name, cond, detail = '') {
  if (cond) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function railOf(from) {
  const slice = calls.slice(from);
  return {
    hot: slice.filter((u) => u.includes('/api/board/concern-hot.php')),
    posts: slice.filter((u) => u.includes('/api/board/posts.php')),
  };
}

function views(urls) {
  return urls.map((u) => new URL(u, 'http://127.0.0.1:5176').searchParams.get('view')).sort();
}

function boards(urls) {
  return urls.map((u) => new URL(u, 'http://127.0.0.1:5176').searchParams.get('board_key')).sort();
}

function rooms(html) {
  return [...String(html).matchAll(/data-rail-room="([^"]+)"/g)].map((m) => m[1]);
}

async function flush() {
  for (let i = 0; i < 8; i += 1) await new Promise((r) => setTimeout(r, 0));
}

function resetRail() {
  store.resetConcernData();
  infoStore.resetInfoBoardData();
}

const LOADING = '글을 불러오는 중이에요';

async function boot(mode) {
  meMode = mode;
  return auth.initAuthSession();
}

// ── 고친 뒤: 로그인 공부방, 확인 전 0건 → 확인 후 6건 → 다시 그려도 0건 ──
{
  meMode = 'member';
  const before = calls.length;
  const held = page.renderSearchPage({ sessionReady: false, deferRailFetch: true });
  await flush();
  const heldRail = railOf(before);
  ok('member_hold_hot_0', heldRail.hot.length === 0, String(heldRail.hot.length));
  ok('member_hold_posts_0', heldRail.posts.length === 0, String(heldRail.posts.length));
  ok('member_hold_best_title', held.includes('이달의 베스트'));
  ok('member_hold_hot_title', held.includes('지금 고민 HOT'));
  ok('member_hold_loading', held.includes(LOADING));
  ok('member_hold_three_rooms', rooms(held).length === 3, rooms(held).join(','));

  const mark = calls.length;
  await boot('member');
  const duringMe = railOf(mark);
  ok('member_me_does_not_fetch_rail', duringMe.hot.length === 0 && duringMe.posts.length === 0, `${duringMe.hot.length}+${duringMe.posts.length}`);

  const sent = calls.length;
  const live = page.renderSearchPage({ sessionReady: true });
  await flush();
  const once = railOf(sent);
  ok('member_once_hot_3', views(once.hot).join(',') === 'best,hot,latest', views(once.hot).join(','));
  ok('member_once_posts_3', boards(once.posts).join(',') === [...INFO].sort().join(','), boards(once.posts).join(','));
  ok('member_confirm_shows_loading_first', live.includes(LOADING));
  const after = calls.length;
  const painted = page.renderSearchPage({ sessionReady: true });
  await flush();
  const again = railOf(after);
  ok('member_repaint_hot_0', again.hot.length === 0, String(again.hot.length));
  ok('member_repaint_posts_0', again.posts.length === 0, String(again.posts.length));
  ok('member_painted_titles', painted.includes('TITLE_concern-director_1') && painted.includes('INFO_info-room_1'));
  ok('member_painted_not_loading', !painted.includes(LOADING));
  ok('member_hot_popup_attr', painted.includes('data-concern-hot-open'));
  ok('member_room_popup_attr', painted.includes('data-concern-rail-open'));
  ok('member_info_open_attr', painted.includes('data-info-rail-open'));
  ok('member_leave_inpage', painted.includes('data-concern-rail-leave="inpage"') && painted.includes('data-info-rail-leave="inpage"'));
  ok('member_three_rooms', rooms(painted).join(',') === ROOMS.join(','), rooms(painted).join(','));
  console.log(`COUNT member new ${once.hot.length + once.posts.length} (hot ${once.hot.length} + posts ${once.posts.length})`);
}

// ── 고치기 전 경로: 확인 전에 한 번, 주인이 바뀐 뒤 한 번 더 → 12건 ──
{
  await auth.logout();
  resetRail();
  meMode = 'guest';
  const from = calls.length;
  layout.renderSearchRightRail();
  await flush();
  const guestWave = railOf(from);
  await boot('member');
  const mid = calls.length;
  layout.renderSearchRightRail();
  await flush();
  const memberWave = railOf(mid);
  const oldTotal = guestWave.hot.length + guestWave.posts.length + memberWave.hot.length + memberWave.posts.length;
  ok('old_path_12', oldTotal === 12, String(oldTotal));
  console.log(`COUNT old path ${oldTotal} (guest ${guestWave.hot.length + guestWave.posts.length} + member ${memberWave.hot.length + memberWave.posts.length})`);
}

// ── 비회원: 확인 전 0, 확인 후 6, 다시 그려도 그대로. 본문·작성자 없음 ──
{
  await auth.logout();
  resetRail();
  const from = calls.length;
  const held = page.renderSearchPage({ sessionReady: false, deferRailFetch: true });
  await flush();
  const heldRail = railOf(from);
  ok('guest_hold_0', heldRail.hot.length + heldRail.posts.length === 0, String(heldRail.hot.length + heldRail.posts.length));
  ok('guest_hold_loading', held.includes(LOADING) && held.includes('이달의 베스트'));
  await boot('guest');
  ok('guest_anonymous', auth.getSessionConfirmStatus() === 'anonymous' && !auth.getAuthUser());
  const sent = calls.length;
  const painted = layout.renderSearchRightRail();
  await flush();
  const once = railOf(sent);
  ok('guest_once_6', once.hot.length === 3 && once.posts.length === 3, `${once.hot.length}+${once.posts.length}`);
  const againFrom = calls.length;
  const againHtml = layout.renderSearchRightRail();
  await flush();
  const again = railOf(againFrom);
  ok('guest_repaint_0', again.hot.length + again.posts.length === 0, String(again.hot.length + again.posts.length));
  ok('guest_titles_only', againHtml.includes('TITLE_concern-director_1') && !againHtml.includes('BODY_') && !againHtml.includes('AUTHOR_'));
  ok('guest_three_rooms', rooms(againHtml).length === 3, rooms(againHtml).join(','));
  ok('guest_first_paint_loading', painted.includes(LOADING) && !painted.includes('BODY_'));
  console.log(`COUNT guest new ${once.hot.length + once.posts.length}`);
}

// ── unconfirmed: 마지막 공부방 회원으로 한 번. 재시도는 me.php 안에서 끝나고 레일은 한 번 ──
{
  await boot('member');
  resetRail();
  meMode = 'fail';
  const started = Date.now();
  const user = await auth.initAuthSession();
  const elapsed = Date.now() - started;
  ok('unconfirmed_returns', auth.getSessionConfirmStatus() === 'unconfirmed' && user?.role_type === 'study_room_owner', auth.getSessionConfirmStatus());
  ok('unconfirmed_bounded', elapsed < 8000, `${elapsed}ms`);
  const sent = calls.length;
  const painted = layout.renderSearchRightRail();
  await flush();
  const once = railOf(sent);
  ok('unconfirmed_once_6', once.hot.length === 3 && once.posts.length === 3, `${once.hot.length}+${once.posts.length}`);
  const againFrom = calls.length;
  layout.renderSearchRightRail();
  await flush();
  const again = railOf(againFrom);
  ok('unconfirmed_repaint_0', again.hot.length + again.posts.length === 0);
  ok('unconfirmed_member_rooms', rooms(painted).join(',') === ROOMS.join(','), rooms(painted).join(','));
  console.log(`COUNT unconfirmed ${once.hot.length + once.posts.length} in ${elapsed}ms`);
}

// ── 학생: 고민방 1칸, 정보 배너는 학생 꿀팁만, HOT·인페이지 속성 유지 ──
{
  await auth.logout();
  resetRail();
  await boot('student');
  resetRail();
  const sent = calls.length;
  const painted = layout.renderSearchRightRail();
  await flush();
  const once = railOf(sent);
  ok('student_one_room', rooms(painted).join(',') === 'concern-parent', rooms(painted).join(','));
  ok('student_info_one', boards(once.posts).join(',') === 'info-student', boards(once.posts).join(','));
  ok('student_hot_still_3', views(once.hot).join(',') === 'best,hot,latest', views(once.hot).join(','));
  ok('student_popup_attrs', painted.includes('data-concern-hot-open') && painted.includes('data-info-rail-leave="inpage"'));
  ok('student_no_provider_info', !painted.includes('data-rail-info="info-room"') && !painted.includes('data-rail-info="info-tutor"'));
}

// ── 홈 레일은 플래그 없이 지금처럼 바로 받는다 ──
{
  await auth.logout();
  resetRail();
  const sent = calls.length;
  rail.renderPromoWithRightRail('home_right_rail', { navRole: 'study_room' });
  await flush();
  const home = railOf(sent);
  ok('home_still_fetches', home.hot.length === 3 && home.posts.length === 3, `${home.hot.length}+${home.posts.length}`);
}

console.log(failed ? `FAIL ${failed} / ${passed + failed}` : `OK ${passed}`);
process.exit(failed ? 1 : 0);
