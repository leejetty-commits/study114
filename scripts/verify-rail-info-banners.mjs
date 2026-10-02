/**
 * 사이트오류-3b · 우측 레일 정보 게시판 배너 2개(방마다 서버 최신 3개) + 페이지 이동 없는 읽기 팝업(공용 틀)
 * 실행: cd preview/home-ui && npx --yes vite-node ../../scripts/verify-rail-info-banners.mjs
 *
 * 1부(이 프로세스, DOM 없음)
 *   (a) 역할별(공부방·과외쌤·관리자·게스트·학생·member·미인증) × 레일(홈·찾기·상세·등록·유료) 배너 있음/없음, 학생·member 는 공급자 배너 DOM 없음
 *       (사이트오류-6B: 학생 꿀팁 가이드 배너는 모든 역할에 하나. 아래 2개 기대값은 공급자 배너 기준)
 *   (b) 배너 2개 순서·제목 정확, 「이번 시즌 추천 행동」 아래(추천 행동 칸 뒤)
 *   (c) 방마다 3개·서버 최신순, 요청은 board_key·limit=3 (분류 없음)
 *   (d) 받는 중·0건·실패가 서로 다르고 배너 제목은 항상 있다
 *   (e) 문구는 library-copy.js INFO_RAIL_COPY 한 곳, 화면 파일(right-rail.js·info-rail.js·rail-popup.js)에 직접 없음
 *   (f) 게스트는 제목만(서버가 본문·작성자를 섞어 보내도 그리지 않는다)
 *   (g) 정보 게시판 저장·삭제 후 레일 캐시 무효화 → 다음 렌더에 새 글
 *   (h) 세션 변경(auth 이벤트) 시 캐시가 버려진다, 로컬 저장소를 쓰지 않는다
 * 2부(실제 브라우저: Vite 개발 서버 + Playwright chromium. API 는 page.route 로 흉내 낸다)
 *   글 제목 클릭 → 팝업·hash 불변, role="dialog"·aria-modal·aria-labelledby, 닫기 버튼 포커스, Tab 이 밖으로 안 나감,
 *   페이지 번호 이동(offset/limit), 목록 클릭 시 본문 교체, ESC·배경·닫기 후 포커스 복귀·스크롤 잠금 해제·스크롤 위치 유지,
 *   「더보기」는 최신 글 선택, 0건 문구, 게스트 팝업 본문 없음·로그인 안내, 「게시판에서 보기」, 찾기 레일(absolute) 팝업,
 *   세션 변경(로그아웃·다른 역할 로그인) 시 팝업 닫힘·캐시 버림, 모바일 시트
 * DB·PHP 서버에 접속하지 않는다.
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (rel) => {
  const p = join(root, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
};

// ── 최소 브라우저 환경(document 없음) ──
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
  let result = false;
  try {
    result = typeof cond === 'function' ? Boolean(cond()) : Boolean(cond);
  } catch (e) {
    detail = detail || String(e?.message || e);
  }
  if (result) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
  return result;
}
async function load(importer, label) {
  try {
    return await importer();
  } catch (e) {
    console.error(`(import 실패: ${label} — ${e?.message || e})`);
    return null;
  }
}
const flush = async (n = 6) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0));
};

const BOARDS = ['info-room', 'info-tutor'];
// 사이트오류-6B: 학생 꿀팁 가이드 배너가 모든 역할에 추가됐다. 아래 공급자 배너 기대값은 BOARDS 두 개로만 본다.
const STUDENT_BOARD = 'info-student';
const SERVER_BOARDS = [...BOARDS, STUDENT_BOARD];
const NAMES = { 'info-room': '공부방 쏙쏙정보', 'info-tutor': '과외쌤 따끈 팁가이드' };
const PATHS = { 'info-room': '/library/room-info', 'info-tutor': '/library/tutor-tips' };
const POLICY_COPY = {
  empty: '아직 글이 도착하지 않았어요. 첫 정보를 기다려요',
  loadFailed: '글을 불러오는 중 길이 막혔어요. 잠시 후 다시 확인해 주세요',
  guestDetail: '로그인하면 전체 내용을 볼 수 있어요',
  goBoard: '게시판에서 보기',
  more: '더보기',
};
const SEASON_TITLE = '이번 시즌 추천 행동';
const HOME_BASE = 'http://127.0.0.1:5174';

/* ══════════════════════ 1부 ══════════════════════ */

// ── 가짜 서버 ──
const requests = [];
const server = { role: 'guest', mode: 'posts', me: null };
const serverPosts = { 'info-room': [], 'info-tutor': [], 'info-student': [] };
function makePost(boardKey, n, minutesAgo) {
  const t = new Date(Date.UTC(2026, 9, 1, 0, 0) - minutesAgo * 60000).toISOString().slice(0, 19);
  return {
    id: `${boardKey}-p${n}`,
    title: `TITLE_${boardKey}_${n}`,
    categoryId: boardKey === 'info-room' ? 'know-how' : boardKey === STUDENT_BOARD ? 'study-howto' : 'lesson',
    createdAt: t,
    body: `BODY_${boardKey}_${n}`,
    authorLabel: 'AUTHOR_LABEL',
    updatedAt: t,
    edited: false,
    canEdit: true,
    canDelete: true,
  };
}
function resetServerPosts(count = 5) {
  for (const key of SERVER_BOARDS) serverPosts[key] = Array.from({ length: count }, (_, i) => makePost(key, i + 1, i + 1));
}
resetServerPosts();
const byNewest = (a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0);
const titlesOf = (p) => ({
  id: p.id,
  title: p.title,
  categoryId: p.categoryId,
  createdAt: p.createdAt,
  body: 'LEAK_BODY',
  authorLabel: 'LEAK_AUTHOR',
});
function json(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}
let seq = 0;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input), 'http://127.0.0.1:5174');
  const method = String(init.method || 'GET').toUpperCase();
  const body = init.body ? JSON.parse(String(init.body)) : null;
  requests.push({ method, path: url.pathname, params: Object.fromEntries(url.searchParams), body });
  if (url.pathname.endsWith('/api/auth/me.php')) {
    return json(200, server.me ? { ok: true, authenticated: true, email_verified: true, ...server.me } : { ok: true, authenticated: false });
  }
  if (url.pathname.endsWith('/api/auth/logout.php')) return json(200, { ok: true });
  if (url.pathname.endsWith('/api/board/concern-hot.php')) return json(200, { ok: true, posts: [], boards: {} });
  if (!url.pathname.endsWith('/api/board/posts.php')) return json(404, { ok: false, message: 'not found' });
  const boardKey = url.searchParams.get('board_key') || body?.board_key;
  if (!SERVER_BOARDS.includes(boardKey)) return json(404, { ok: false, message: 'not found' });
  if (server.mode === 'fail') return json(500, { ok: false, message: 'db down' });
  const role = server.role;
  const isStudentBoard = boardKey === STUDENT_BOARD;
  if (!isStudentBoard && (role === 'demand' || role === 'member')) return json(403, { ok: false, error: 'forbidden', message: 'forbidden' });
  const access = role === 'guest' || (isStudentBoard && role === 'member') ? 'titles' : 'full';
  if (method === 'GET') {
    const all = server.mode === 'empty' ? [] : [...serverPosts[boardKey]].sort(byNewest);
    const postKey = url.searchParams.get('post_key');
    if (postKey) {
      const p = all.find((x) => x.id === postKey);
      if (!p) return json(404, { ok: false, error: 'not_found', message: 'nf' });
      return json(200, { ok: true, access, boardKey, post: access === 'titles' ? titlesOf(p) : p });
    }
    const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || 20), 20));
    const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
    const page = all.slice(offset, offset + limit);
    return json(200, {
      ok: true,
      access,
      boardKey,
      posts: page.map((p) => (access === 'titles' ? titlesOf(p) : p)),
      total: all.length,
      limit,
      offset,
      category: null,
      hasMore: offset + page.length < all.length,
      canCompose: access === 'full',
    });
  }
  if (method === 'POST') {
    seq += 1;
    const post = { ...makePost(boardKey, 900 + seq, -seq), title: body.title, body: body.body, categoryId: body.category };
    if (body.post_key) {
      serverPosts[boardKey] = serverPosts[boardKey].map((p) => (p.id === body.post_key ? { ...p, title: body.title } : p));
      return json(200, { ok: true, post: { ...post, id: body.post_key } });
    }
    serverPosts[boardKey] = [post, ...serverPosts[boardKey]];
    return json(200, { ok: true, post });
  }
  if (method === 'DELETE') {
    const key = url.searchParams.get('post_key');
    serverPosts[boardKey] = serverPosts[boardKey].filter((p) => p.id !== key);
    return json(200, { ok: true, deleted: true });
  }
  return json(405, { ok: false });
};

const copyMod = await load(() => import('../preview/home-ui/src/library/library-copy.js'), 'library-copy');
const infoStore = await load(() => import('../preview/home-ui/src/library/info-board-store.js'), 'info-board-store');
const rail = await load(() => import('../preview/home-ui/src/right-rail.js'), 'right-rail');
const authSession = await load(() => import('../preview/home-ui/src/auth-session.js'), 'auth-session');
const RAIL_COPY = copyMod?.INFO_RAIL_COPY || {};

/** 세션을 만든다(앱 부트와 같은 initAuthSession). me=null 이면 비로그인. */
async function signIn(me, hash = '#/guest') {
  server.me = me;
  location.hash = me && me.email_verified === false ? '#/guide/register' : hash;
  await authSession?.initAuthSession?.();
  location.hash = hash;
}

/** @returns {{ key: string, html: string, at: number }[]} */
function allInfoSections(html) {
  const out = [];
  const re = /<section\b[^>]*data-rail-info="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g;
  let m;
  while ((m = re.exec(String(html)))) out.push({ key: m[1], html: m[0], at: m.index });
  return out;
}
/** 공급자 정보 게시판 배너(info-room·info-tutor)만. */
const infoSections = (html) => allInfoSections(html).filter((s) => BOARDS.includes(s.key));
/** 학생 꿀팁 가이드 배너만. */
const studentTipsSections = (html) => allInfoSections(html).filter((s) => s.key === STUDENT_BOARD);
/** 학생 꿀팁 가이드 배너를 뺀 HTML(공급자 배너 흔적 판정용). */
const withoutStudentTips = (html) => studentTipsSections(html).reduce((acc, s) => acc.replace(s.html, ''), String(html));
const stateOf = (sec) => sec.html.match(/data-rail-state="([^"]+)"/)?.[1] || '';
const postTitlesIn = (sec) => [...sec.html.matchAll(/TITLE_info-[a-z]+_\d+/g)].map((m) => m[0]);

function renderSlots(navRole) {
  const r = rail || {};
  return {
    home: r.renderPromoWithRightRail?.('home_right_rail', { navRole }) ?? '',
    search: r.renderRightRailSidebar?.('search_right_rail', { navRole, linkMode: 'absolute', homeBase: HOME_BASE }) ?? '',
    detail: r.renderRightRailBlock?.('detail_right_rail', {}) ?? '',
    register: r.renderRegisterRightRail?.({ navRole, homeBase: HOME_BASE }) ?? '',
    plans: r.renderPromoWithRightRail?.('plans_right_rail', { navRole }) ?? '',
  };
}

const ROLE_CASES = [
  { name: 'study_room', hash: '#/study-room', navRole: 'study_room', me: { user_id: 11, role_type: 'study_room_owner', name: 'r', email: 'r@x' }, server: 'supply-room', show: true },
  { name: 'tutor', hash: '#/tutor', navRole: 'tutor', me: { user_id: 21, role_type: 'tutor', name: 't', email: 't@x' }, server: 'supply-tutor', show: true },
  { name: 'admin', hash: '#/guest', navRole: undefined, me: { user_id: 1, role_type: 'admin', admin_level: 'super', name: 'a', email: 'a@x' }, server: 'admin', show: true },
  { name: 'guest', hash: '#/guest', navRole: 'guest', me: null, server: 'guest', show: true, guestView: true },
  { name: 'student', hash: '#/parent', navRole: 'parent', me: { user_id: 31, role_type: 'guardian_student', name: 's', email: 's@x' }, server: 'demand', show: false },
  { name: 'student_nosession', hash: '#/parent', navRole: 'parent', me: null, server: 'demand', show: false },
  { name: 'member', hash: '#/guest', navRole: 'guest', me: { user_id: 41, role_type: '', name: 'm', email: 'm@x' }, server: 'member', show: false },
  { name: 'unverified', hash: '#/study-room', navRole: 'study_room', me: { user_id: 51, role_type: 'study_room_owner', name: 'u', email: 'u@x', email_verified: false }, server: 'guest', show: true, guestView: true },
];
const SLOT_NAMES = ['home', 'search', 'detail', 'register', 'plans'];
const exposure = {};
const providerReqCount = () => requests.filter((q) => q.path.endsWith('/api/board/posts.php') && BOARDS.includes(q.params.board_key)).length;

for (const rc of ROLE_CASES) {
  infoStore?.resetInfoBoardData?.();
  server.role = rc.server;
  server.mode = 'posts';
  await signIn(rc.me, rc.hash);
  const providerReqBefore = providerReqCount();
  const loading = renderSlots(rc.navRole);
  await flush();
  const done = renderSlots(rc.navRole);
  exposure[rc.name] = SLOT_NAMES.map((s) => `${s}=${infoSections(done[s]).length}+${studentTipsSections(done[s]).length}`).join(' ');

  for (const slot of SLOT_NAMES) {
    const tag = `${rc.name}/${slot}`;
    const secs = infoSections(done[slot]);
    if (rc.show) {
      ok(`a_banners_shown_${tag}`, secs.length === 2, `got ${secs.length}`);
      ok(
        `b_order_titles_${tag}`,
        secs.length === 2 &&
          secs[0].key === 'info-room' &&
          secs[1].key === 'info-tutor' &&
          secs.every((s) => s.html.includes(`>${NAMES[s.key]}<`)),
        secs.map((s) => s.key).join(','),
      );
      const action = done[slot].lastIndexOf('live-rail-slot--action');
      ok(`b_below_action_slot_${tag}`, secs.length === 2 && action >= 0 && secs[0].at > action, `action@${action} info@${secs[0]?.at}`);
      ok(`a_more_button_${tag}`, secs.length === 2 && secs.every((s) => s.html.includes(`>${POLICY_COPY.more}<`) && /data-info-rail-more/.test(s.html)));
      ok(`a_student_tips_banner_${tag}`, studentTipsSections(done[slot]).length === 1);
    } else {
      // 사이트오류-6B: 학생·member 에게는 학생 꿀팁 가이드 배너 하나만 있다. 공급자 배너 흔적은 그 배너를 뺀 나머지에서 본다.
      const all = withoutStudentTips(Object.values(done).join('')) + withoutStudentTips(Object.values(loading).join(''));
      const rest = withoutStudentTips(done[slot]);
      ok(
        `a_no_dom_${tag}`,
        secs.length === 0 &&
          !rest.includes('data-rail-info') &&
          !rest.includes('쏙쏙') &&
          !rest.includes('팁가이드') &&
          !rest.includes('/library/room-info') &&
          !rest.includes('이 공간의 소개만'),
      );
      ok(`a_student_tips_only_${tag}`, allInfoSections(done[slot]).map((s) => s.key).join(',') === STUDENT_BOARD);
      if (slot === 'plans') {
        // 「더보기」는 사이트오류-4 고민방 방 배너에도 있으므로 정보 배너 없음은 data-info-rail 표식으로 본다.
        ok(
          `a_no_copy_anywhere_${rc.name}`,
          !Object.values(POLICY_COPY)
            .filter((c) => c !== POLICY_COPY.more)
            .some((c) => all.includes(c)) && !all.includes('data-info-rail'),
        );
      }
    }
  }
  if (!rc.show) {
    // 사이트오류-6B: 학생 꿀팁 가이드 요청은 정상. 공급자 게시판 요청만 0 이어야 한다.
    const reqAfter = providerReqCount();
    ok(`a_no_server_request_${rc.name}`, reqAfter === providerReqBefore, `${reqAfter - providerReqBefore} requests`);
    continue;
  }
  const home = infoSections(done.home);
  // (c) 방마다 3개 · 최신순
  ok(
    `c_three_newest_${rc.name}`,
    home.length === 2 &&
      home.every((s) => JSON.stringify(postTitlesIn(s)) === JSON.stringify([1, 2, 3].map((n) => `TITLE_${s.key}_${n}`))),
    home.map((s) => postTitlesIn(s).join('|')).join(' / '),
  );
  ok(
    `c_dates_shown_${rc.name}`,
    home.length === 2 && home.every((s) => (s.html.match(/2026\.09\.30/g) || []).length === 3),
  );
  const railReqs = requests.slice(-40).filter((q) => q.path.endsWith('/api/board/posts.php') && q.method === 'GET' && !q.params.post_key);
  ok(
    `c_request_limit3_no_category_${rc.name}`,
    BOARDS.every((k) =>
      railReqs.some((q) => q.params.board_key === k && q.params.limit === '3' && !('category' in q.params) && !('offset' in q.params)),
    ),
    JSON.stringify(railReqs.map((q) => q.params)),
  );
  ok(`d_loading_state_${rc.name}`, infoSections(loading.home).every((s) => stateOf(s) === 'loading') && infoSections(loading.home).length === 2);
  if (rc.guestView) {
    const all = Object.values(done).join('');
    ok(`f_guest_titles_only_${rc.name}`, !/LEAK_|BODY_|AUTHOR_LABEL/.test(all) && all.includes('TITLE_info-room_1'));
  } else {
    ok(`f_rail_never_shows_body_${rc.name}`, !/BODY_|AUTHOR_LABEL/.test(Object.values(done).join('')));
  }
}

// ── (d) 받는 중 · 0건 · 실패 ──
await signIn(ROLE_CASES[0].me, '#/study-room');
server.role = 'supply-room';
const bodyOf = (sec) => sec.html.replace(/<div class="live-rail-slot__band">[\s\S]*?<\/div>/, '').replace(/data-rail-info-live="[^"]*"/g, '');
const stateHtml = {};
for (const mode of ['loading', 'posts', 'empty', 'fail']) {
  infoStore?.resetInfoBoardData?.();
  server.mode = mode === 'loading' ? 'posts' : mode;
  let html = rail?.renderPromoWithRightRail?.('home_right_rail', { navRole: 'study_room' }) ?? '';
  if (mode !== 'loading') {
    await flush();
    html = rail?.renderPromoWithRightRail?.('home_right_rail', { navRole: 'study_room' }) ?? '';
  }
  stateHtml[mode] = infoSections(html);
}
server.mode = 'posts';
const S = stateHtml;
ok('d_titles_always_present', ['loading', 'posts', 'empty', 'fail'].every((m) => S[m].length === 2 && S[m].every((s) => s.html.includes(`>${NAMES[s.key]}<`))));
ok('d_state_attrs', ['loading', 'posts', 'empty', 'fail'].every((m, i) => S[m].every((s) => stateOf(s) === ['loading', 'posts', 'empty', 'failed'][i])));
ok(
  'd_loading_has_indicator_no_copy',
  S.loading.length === 2 &&
    S.loading.every((s) => s.html.includes(RAIL_COPY.loading || '__none__') && !s.html.includes(POLICY_COPY.empty) && !s.html.includes(POLICY_COPY.loadFailed)),
);
ok('d_empty_copy', S.empty.length === 2 && S.empty.every((s) => s.html.includes(POLICY_COPY.empty) && !s.html.includes(POLICY_COPY.loadFailed) && !s.html.includes('TITLE_')));
ok('d_fail_copy', S.fail.length === 2 && S.fail.every((s) => s.html.includes(POLICY_COPY.loadFailed) && !s.html.includes(POLICY_COPY.empty) && !s.html.includes('TITLE_')));
ok('d_states_distinct', () => {
  const bodies = ['loading', 'posts', 'empty', 'fail'].map((m) => bodyOf(S[m][0]));
  return new Set(bodies).size === 4;
});

// ── (g) 저장·삭제 후 캐시 무효화 ──
infoStore?.resetInfoBoardData?.();
server.mode = 'posts';
resetServerPosts();
const roomViewer = infoStore?.currentInfoViewer?.() ?? { boardRole: 'supply-room', ownerKey: '11:study_room_owner:' };
rail?.renderPromoWithRightRail?.('home_right_rail', { navRole: 'study_room' });
await flush();
const firstTitle = () => postTitlesIn(infoSections(rail?.renderPromoWithRightRail?.('home_right_rail', { navRole: 'study_room' }) ?? '')[0] || { html: '' })[0];
const firstTitleRaw = () => {
  const sec = infoSections(rail?.renderPromoWithRightRail?.('home_right_rail', { navRole: 'study_room' }) ?? '')[0];
  return sec?.html.match(/data-info-rail-post="[^"]+"[^>]*>[\s\S]*?<span class="live-rail-info__title">([^<]*)</)?.[1] || '';
};
ok('g_cache_fresh_before_save', () => infoStore.isInfoRailFresh(roomViewer, 'info-room') === true && firstTitle() === 'TITLE_info-room_1');
let saved = null;
try {
  saved = await infoStore?.saveInfoPost?.(roomViewer, { boardKey: 'info-room', title: 'NEW_RAIL_POST', body: 'b', category: 'recruit' });
} catch (e) {
  console.error(`(save 실패: ${e?.message || e})`);
}
ok('g_save_invalidates_rail', () => saved && infoStore.isInfoRailFresh(roomViewer, 'info-room') === false && infoStore.isInfoRailFresh(roomViewer, 'info-tutor') === true);
rail?.renderPromoWithRightRail?.('home_right_rail', { navRole: 'study_room' });
await flush();
ok('g_next_render_shows_new_post', () => firstTitleRaw() === 'NEW_RAIL_POST');
try {
  if (saved) await infoStore.deleteInfoPost(roomViewer, 'info-room', saved.id);
} catch (e) {
  console.error(`(delete 실패: ${e?.message || e})`);
}
ok('g_delete_invalidates_rail', () => saved && infoStore.isInfoRailFresh(roomViewer, 'info-room') === false);
rail?.renderPromoWithRightRail?.('home_right_rail', { navRole: 'study_room' });
await flush();
ok('g_next_render_drops_deleted', () => firstTitle() === 'TITLE_info-room_1' && firstTitleRaw() !== 'NEW_RAIL_POST');

// ── (h) 세션 변경 → 캐시 버림 ──
ok('h_cache_present_before_logout', () => infoStore.getInfoRailList(roomViewer, 'info-room') !== null);
globalThis.dispatchEvent(new Event('auth:logout'));
ok('h_logout_event_drops_cache', () => infoStore.getInfoRailList(roomViewer, 'info-room') === null);
rail?.renderPromoWithRightRail?.('home_right_rail', { navRole: 'study_room' });
await flush();
globalThis.dispatchEvent(new Event('auth:role-change'));
ok('h_role_change_event_drops_cache', () => infoStore.getInfoRailList(roomViewer, 'info-room') === null);

// ── (e) 문구 · 소스 ──
const railSrc = src('preview/home-ui/src/right-rail.js');
const infoRailSrc = src('preview/home-ui/src/library/info-rail.js');
const popupSrc = src('preview/home-ui/src/rail-popup.js');
const storeSrc = src('preview/home-ui/src/library/info-board-store.js');
ok('e_copy_constants_exact', Object.entries(POLICY_COPY).every(([k, v]) => RAIL_COPY[k] === v), JSON.stringify(RAIL_COPY));
ok('e_copy_has_loading_distinct', typeof RAIL_COPY.loading === 'string' && RAIL_COPY.loading && !Object.values(POLICY_COPY).includes(RAIL_COPY.loading));
ok('e_board_names_from_info_boards', () => BOARDS.every((k) => copyMod.INFO_BOARDS.find((b) => b.boardKey === k)?.label === NAMES[k]));
ok('e_new_files_exist', infoRailSrc !== '' && popupSrc !== '');
ok(
  'e_no_literal_copy_in_screen_files',
  infoRailSrc !== '' &&
    popupSrc !== '' &&
    [...Object.values(POLICY_COPY).filter((v) => v !== '더보기'), ...Object.values(NAMES), RAIL_COPY.loading || '글을 불러오는 중이에요'].every(
      (s) => !railSrc.includes(s) && !infoRailSrc.includes(s) && !popupSrc.includes(s),
    ),
);
ok('e_right_rail_old_box_removed', !railSrc.includes('RAIL_PROVIDER_INFO') && !railSrc.includes('쏙쏙 최신정보'));
ok('e_visibility_uses_can_discover', /canDiscoverBoard\(/.test(infoRailSrc));
ok('e_popup_is_generic', popupSrc !== '' && /export function openRailPopup\(/.test(popupSrc) && !/info-room|info-tutor|library|posts\.php|INFO_/.test(popupSrc));
ok('e_terms_clean', () => {
  const all = JSON.stringify(RAIL_COPY);
  return all !== '{}' && !/학부모|공개|숨김|심사|이용권/.test(all);
});
ok(
  'h_no_local_storage',
  [infoRailSrc, popupSrc, storeSrc].every((s) => s !== '' && !/localStorage|sessionStorage|indexedDB/.test(s)),
);

console.log('\n역할별 정보 배너 개수(레일별):');
for (const [role, line] of Object.entries(exposure)) console.log(`  ${role.padEnd(18)} ${line}`);

/* ══════════════════════ 2부 (브라우저) ══════════════════════ */

const HARNESS = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>rail-popup harness</title>
<style>body{margin:0;font-family:sans-serif}#rail,#rail-search{width:320px;margin-left:40px}</style></head>
<body><div id="top" style="height:1200px">top</div><div id="rail"></div><div id="rail-search"></div><div style="height:2400px"></div></body></html>`;

const bServer = { me: null, role: 'supply-room', counts: { 'info-room': 23, 'info-tutor': 0, 'info-student': 4 } };
const bRequests = [];
function bPosts(boardKey) {
  return Array.from({ length: bServer.counts[boardKey] }, (_, i) => {
    const n = i + 1;
    const t = new Date(Date.UTC(2026, 9, 1, 0, 0) - n * 60000).toISOString().slice(0, 19);
    return {
      id: `${boardKey}-p${n}`,
      title: `TITLE_${boardKey}_${n}`,
      categoryId: boardKey === 'info-room' ? 'know-how' : boardKey === STUDENT_BOARD ? 'study-howto' : 'lesson',
      createdAt: t,
      body: `BODY_${boardKey}_${n}\n둘째 줄 <script>window.__xss=1</script>`,
      authorLabel: '공부방',
      updatedAt: t,
      edited: false,
      canEdit: false,
      canDelete: false,
    };
  });
}
async function bRoute(route) {
  const req = route.request();
  const url = new URL(req.url());
  const fulfill = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  bRequests.push({ method: req.method(), path: url.pathname, params: Object.fromEntries(url.searchParams) });
  if (url.pathname.endsWith('/api/auth/me.php')) {
    return fulfill(200, bServer.me ? { ok: true, authenticated: true, email_verified: true, ...bServer.me } : { ok: true, authenticated: false });
  }
  if (url.pathname.endsWith('/api/auth/logout.php')) return fulfill(200, { ok: true });
  if (url.pathname.endsWith('/api/board/concern-hot.php')) return fulfill(200, { ok: true, posts: [], boards: {} });
  if (!url.pathname.endsWith('/api/board/posts.php')) return fulfill(404, { ok: false, message: 'nf' });
  const boardKey = url.searchParams.get('board_key');
  if (!SERVER_BOARDS.includes(boardKey)) return fulfill(404, { ok: false });
  const role = bServer.role;
  const isStudentBoard = boardKey === STUDENT_BOARD;
  if (!isStudentBoard && (role === 'demand' || role === 'member')) return fulfill(403, { ok: false, error: 'forbidden', message: 'forbidden' });
  const access = role === 'guest' || (isStudentBoard && role === 'member') ? 'titles' : 'full';
  const all = bPosts(boardKey);
  const postKey = url.searchParams.get('post_key');
  if (postKey) {
    const p = all.find((x) => x.id === postKey);
    if (!p) return fulfill(404, { ok: false, error: 'not_found' });
    return fulfill(200, { ok: true, access, boardKey, post: access === 'titles' ? titlesOf(p) : p });
  }
  const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || 20), 20));
  const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
  const page = all.slice(offset, offset + limit);
  return fulfill(200, {
    ok: true,
    access,
    boardKey,
    posts: page.map((p) => (access === 'titles' ? titlesOf(p) : p)),
    total: all.length,
    limit,
    offset,
    category: null,
    hasMore: offset + page.length < all.length,
    canCompose: false,
  });
}

/** PLAYWRIGHT_BROWSERS_PATH 가 빈 폴더를 가리키면 기본 설치 위치(ms-playwright)의 chromium 으로 다시 띄운다. */
async function launchChromium(chromium) {
  try {
    return await chromium.launch();
  } catch (first) {
    const base = process.env.LOCALAPPDATA
      ? join(process.env.LOCALAPPDATA, 'ms-playwright')
      : join(process.env.HOME || '', process.platform === 'darwin' ? 'Library/Caches/ms-playwright' : '.cache/ms-playwright');
    const { readdirSync } = await import('node:fs');
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

let viteServer = null;
let browser = null;
const B = 'B_';
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
    server: { port: 5199, strictPort: false, host: '127.0.0.1', hmr: false, open: false },
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [
      {
        name: 'rail-popup-harness',
        configureServer(s) {
          s.middlewares.use((req, res, next) => {
            if (String(req.url || '').startsWith('/__rail-harness')) {
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(HARNESS);
              return;
            }
            next();
          });
        },
      },
    ],
  });
  await viteServer.listen();
  const port = viteServer.httpServer.address().port;
  const origin = `http://127.0.0.1:${port}`;

  browser = await launchChromium(chromium);
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e?.message || e)));
  await page.route('**/api/**', bRoute);
  await page.goto(`${origin}/__rail-harness.html#/study-room`);
  // 문자열로 넘긴다(함수로 넘기면 vite-node 가 import() 를 바꿔 써서 브라우저에서 깨진다).
  const imported = await page.evaluate(`(async () => {
    try {
      await import('/src/styles/home-right-rail.css');
      window.__rail = await import('/src/right-rail.js');
      window.__auth = await import('/src/auth-session.js');
      window.__store = await import('/src/library/info-board-store.js');
      return 'ok';
    } catch (e) {
      return String((e && e.message) || e);
    }
  })()`);
  ok(`${B}harness_modules_load`, imported === 'ok', imported);

  const wait = async (sel, timeout = 3000) => {
    try {
      await page.waitForSelector(sel, { timeout, state: 'attached' });
      return true;
    } catch {
      return false;
    }
  };
  const gone = async (sel, timeout = 3000) => {
    try {
      await page.waitForSelector(sel, { timeout, state: 'detached' });
      return true;
    } catch {
      return false;
    }
  };
  const ev = (fn, arg) => page.evaluate(fn, arg).catch((e) => `ERR:${e?.message || e}`);
  async function session(me, role) {
    bServer.me = me;
    bServer.role = role;
    await ev(async () => {
      await window.__auth.initAuthSession();
    });
  }
  async function mount(target, slot, opts) {
    await ev(
      ({ target: t, slot: s, opts: o }) => {
        const el = document.getElementById(t);
        const r = window.__rail;
        el.innerHTML =
          s === 'search' ? r.renderRightRailSidebar('search_right_rail', o) : r.renderPromoWithRightRail('home_right_rail', o);
        r.bindRightRailEvents(el);
      },
      { target, slot, opts },
    );
  }
  const popupSel = '#rail-popup';
  const selTitle = () => ev(() => document.querySelector('#rail-popup .rail-popup__post-title')?.textContent?.trim() || '');
  const lockState = () =>
    ev(() => ({
      cls: document.documentElement.classList.contains('is-rail-popup-open') || document.body.classList.contains('is-rail-popup-open'),
      overflow: [getComputedStyle(document.documentElement).overflow, getComputedStyle(document.body).overflow],
      y: window.scrollY,
    }));
  const activeInfo = () =>
    ev(() => {
      const a = document.activeElement;
      return {
        inPopup: Boolean(a && document.getElementById('rail-popup')?.contains(a)),
        isClose: Boolean(a?.matches?.('#rail-popup .rail-popup__close')),
        post: a?.getAttribute?.('data-info-rail-post') || '',
        more: Boolean(a?.hasAttribute?.('data-info-rail-more')),
        board: a?.closest?.('[data-rail-info]')?.getAttribute('data-rail-info') || '',
      };
    });

  // ── 공부방 세션 · 홈 레일(같은 탭) ──
  await session({ user_id: 11, role_type: 'study_room_owner', name: 'r', email: 'r@x' }, 'supply-room');
  await mount('rail', 'home', { navRole: 'study_room' });
  const bannerReady = await wait('#rail [data-rail-info="info-room"][data-rail-state="posts"]', 5000);
  ok(`${B}banner_redrawn_from_server`, bannerReady);
  ok(
    `${B}banner_empty_board_copy`,
    (await wait('#rail [data-rail-info="info-tutor"][data-rail-state="empty"]')) &&
      (await ev(() => document.querySelector('#rail [data-rail-info="info-tutor"]')?.textContent || '')).includes(POLICY_COPY.empty),
  );
  const firstTitleBtn = '#rail [data-rail-info="info-room"] [data-info-rail-post="info-room-p1"]';
  // 사이트오류-4로 레일 위쪽(이달의 베스트·방 배너 더보기)이 길어져 고정 900px 에서는 제목이 화면 밖이라
  // 클릭이 먼저 스크롤한다. 제목을 화면 안에 둔 위치를 기준으로 스크롤 유지를 본다.
  await ev(() => {
    window.scrollTo(0, 900);
    const btn = document.querySelector('#rail [data-rail-info="info-room"] [data-info-rail-post="info-room-p1"]');
    if (btn && btn.getBoundingClientRect().bottom > window.innerHeight) btn.scrollIntoView({ block: 'center' });
  });
  const hash0 = await ev(() => location.hash);
  const lock0 = await lockState();
  let opened = false;
  if (bannerReady) {
    await page.click(firstTitleBtn).catch(() => {});
    opened = await wait(`${popupSel} .rail-popup__body`);
  }
  ok(`${B}title_click_opens_popup`, opened);
  ok(`${B}hash_unchanged_on_open`, opened && (await ev(() => location.hash)) === hash0, String(hash0));
  const dlg = await ev(() => {
    const d = document.querySelector('#rail-popup [role="dialog"]');
    const id = d?.getAttribute('aria-labelledby') || '';
    return { modal: d?.getAttribute('aria-modal'), label: id ? document.getElementById(id)?.textContent?.trim() : '' };
  });
  ok(`${B}dialog_role_aria_modal`, opened && dlg.modal === 'true', JSON.stringify(dlg));
  ok(`${B}aria_labelledby_board_name`, opened && dlg.label === NAMES['info-room'], JSON.stringify(dlg));
  ok(`${B}focus_on_close_button`, opened && (await activeInfo()).isClose);
  const lock1 = await lockState();
  ok(`${B}scroll_locked_while_open`, opened && lock1.cls && lock1.overflow.includes('hidden') && lock1.y === lock0.y, JSON.stringify(lock1));
  const sel1 = await ev(() => {
    const root = document.querySelector('#rail-popup [data-rail-popup-selected]');
    return {
      title: root?.querySelector('.rail-popup__post-title')?.textContent?.trim() || '',
      body: root?.querySelector('.rail-popup__body')?.innerText || '',
      ws: root?.querySelector('.rail-popup__body') ? getComputedStyle(root.querySelector('.rail-popup__body')).whiteSpace : '',
      text: root?.textContent || '',
      scripts: document.querySelectorAll('#rail-popup script').length,
      xss: window.__xss === 1,
    };
  });
  ok(`${B}selected_post_is_clicked_one`, sel1.title === 'TITLE_info-room_1', sel1.title);
  ok(
    `${B}selected_body_escaped_keeps_breaks`,
    sel1.body.includes('BODY_info-room_1\n') && sel1.body.includes('<script>') && sel1.scripts === 0 && !sel1.xss && sel1.ws === 'pre-wrap',
    JSON.stringify(sel1),
  );
  ok(`${B}selected_meta_category_author_date`, sel1.text.includes('운영 노하우') && sel1.text.includes('공부방') && sel1.text.includes('2026.09.30'));
  const list1 = await ev(() => ({
    items: [...document.querySelectorAll('#rail-popup [data-rail-popup-item]')].map((b) => b.getAttribute('data-rail-popup-item')),
    current: document.querySelector('#rail-popup [data-rail-popup-item][aria-current="true"]')?.getAttribute('data-rail-popup-item') || '',
    pages: [...document.querySelectorAll('#rail-popup [data-rail-popup-page]')].map((b) => b.textContent.trim()),
  }));
  ok(
    `${B}list_page1_ten_newest`,
    Array.isArray(list1.items) && list1.items.length === 10 && list1.items[0] === 'info-room-p1' && list1.items[9] === 'info-room-p10' && list1.current === 'info-room-p1',
    JSON.stringify(list1),
  );
  ok(`${B}pager_numbers_from_total`, Array.isArray(list1.pages) && ['1', '2', '3'].every((n) => list1.pages.includes(n)) && !list1.pages.includes('4'), JSON.stringify(list1.pages));

  // Tab 이 팝업 밖으로 나가지 않는다
  let trapped = opened;
  for (let i = 0; opened && i < 26; i += 1) {
    await page.keyboard.press('Tab');
    if (!(await activeInfo()).inPopup) trapped = false;
  }
  await ev(() => document.querySelector('#rail-popup .rail-popup__close')?.focus());
  await page.keyboard.press('Shift+Tab');
  const back = await activeInfo();
  ok(`${B}tab_trapped_in_popup`, trapped && back.inPopup && !back.isClose);

  // 페이지 번호
  let paged = false;
  if (opened) {
    await page.click('#rail-popup [data-rail-popup-page="2"]').catch(() => {});
    paged = await wait('#rail-popup [data-rail-popup-item="info-room-p11"]');
  }
  const list2 = await ev(() => ({
    items: [...document.querySelectorAll('#rail-popup [data-rail-popup-item]')].map((b) => b.getAttribute('data-rail-popup-item')),
    current: document.querySelector('#rail-popup [data-rail-popup-page][aria-current="page"]')?.textContent?.trim() || '',
    focus: document.activeElement?.getAttribute?.('data-rail-popup-page') || '',
  }));
  ok(`${B}page2_lists_11_to_20`, paged && list2.items.length === 10 && list2.items[0] === 'info-room-p11' && list2.items[9] === 'info-room-p20' && list2.current === '2', JSON.stringify(list2));
  ok(
    `${B}page2_request_offset_limit`,
    bRequests.some((q) => q.params.board_key === 'info-room' && q.params.offset === '10' && q.params.limit === '10' && !q.params.post_key),
  );
  ok(`${B}page_change_keeps_selected`, paged && (await selTitle()) === 'TITLE_info-room_1');
  // 목록 글 클릭 → 위쪽 본문 교체
  let swapped = false;
  if (paged) {
    await page.click('#rail-popup [data-rail-popup-item="info-room-p12"]').catch(() => {});
    try {
      await page.waitForFunction(() => document.querySelector('#rail-popup .rail-popup__post-title')?.textContent?.trim() === 'TITLE_info-room_12', null, { timeout: 3000 });
      swapped = true;
    } catch {
      swapped = false;
    }
  }
  ok(
    `${B}list_click_swaps_body`,
    swapped &&
      (await ev(() => document.querySelector('#rail-popup .rail-popup__body')?.innerText || '')).includes('BODY_info-room_12') &&
      bRequests.some((q) => q.params.post_key === 'info-room-p12'),
  );
  ok(`${B}list_click_hash_unchanged_popup_open`, swapped && (await ev(() => location.hash)) === hash0 && Boolean(await ev(() => document.getElementById('rail-popup'))));
  // ESC
  if (opened) await page.keyboard.press('Escape');
  const escClosed = opened && (await gone(popupSel));
  const afterEsc = await activeInfo();
  const lock2 = await lockState();
  ok(`${B}esc_closes`, escClosed);
  ok(`${B}esc_focus_returns_to_opener`, escClosed && afterEsc.post === 'info-room-p1' && afterEsc.board === 'info-room', JSON.stringify(afterEsc));
  ok(`${B}esc_scroll_unlocked_position_kept`, escClosed && !lock2.cls && !lock2.overflow.includes('hidden') && lock2.y === lock0.y, JSON.stringify(lock2));
  ok(`${B}hash_unchanged_after_close`, (await ev(() => location.hash)) === hash0);

  // 「더보기」 → 최신 글 선택 · 배경 클릭 닫기
  let moreOpened = false;
  if (bannerReady) {
    await page.click('#rail [data-rail-info="info-room"] [data-info-rail-more]').catch(() => {});
    moreOpened = await wait(`${popupSel} .rail-popup__body`);
  }
  ok(`${B}more_opens_with_newest_selected`, moreOpened && (await selTitle()) === 'TITLE_info-room_1');
  if (moreOpened) await page.mouse.click(8, 8);
  const bgClosed = moreOpened && (await gone(popupSel));
  ok(`${B}backdrop_click_closes_focus_back_to_more`, bgClosed && (await activeInfo()).more, JSON.stringify(await activeInfo()));
  // 닫기 버튼
  let closeOpened = false;
  if (bannerReady) {
    await page.click('#rail [data-rail-info="info-room"] [data-info-rail-post="info-room-p2"]').catch(() => {});
    closeOpened = await wait(`${popupSel} .rail-popup__body`);
  }
  if (closeOpened) await page.click('#rail-popup .rail-popup__close').catch(() => {});
  const btnClosed = closeOpened && (await gone(popupSel));
  ok(`${B}close_button_closes_focus_back`, btnClosed && (await activeInfo()).post === 'info-room-p2');
  // 0건 게시판 팝업
  let emptyOpened = false;
  if (bannerReady) {
    await page.click('#rail [data-rail-info="info-tutor"] [data-info-rail-more]').catch(() => {});
    emptyOpened = await wait(popupSel);
    if (emptyOpened) {
      try {
        await page.waitForFunction((t) => document.getElementById('rail-popup')?.textContent?.includes(t), POLICY_COPY.empty, { timeout: 3000 });
      } catch {
        /* 아래에서 판정 */
      }
    }
  }
  const emptyState = await ev(() => ({
    text: document.getElementById('rail-popup')?.textContent || '',
    items: document.querySelectorAll('#rail-popup [data-rail-popup-item]').length,
    label: document.getElementById(document.querySelector('#rail-popup [role="dialog"]')?.getAttribute('aria-labelledby') || '')?.textContent?.trim(),
  }));
  ok(`${B}empty_board_popup_copy`, emptyOpened && emptyState.text.includes(POLICY_COPY.empty) && emptyState.items === 0 && emptyState.label === NAMES['info-tutor'], JSON.stringify(emptyState).slice(0, 200));
  if (emptyOpened) await page.keyboard.press('Escape');
  await gone(popupSel);
  // 「게시판에서 보기」(홈: 같은 탭 hash 이동, 팝업 닫힘)
  let goOpened = false;
  if (bannerReady) {
    await page.click(firstTitleBtn).catch(() => {});
    goOpened = await wait(`${popupSel} .rail-popup__body`);
  }
  const go = await ev((label) => {
    const a = [...document.querySelectorAll('#rail-popup a')].find((x) => x.textContent.trim() === label);
    return a ? { href: a.getAttribute('href'), target: a.getAttribute('target') || '' } : null;
  }, POLICY_COPY.goBoard);
  ok(`${B}go_board_link_home_hash`, goOpened && go?.href === '#/library/room-info' && go.target === '', JSON.stringify(go));
  ok(`${B}popup_has_no_write_edit_delete`, goOpened && !(await ev(() => /<form|data-info-delete|\/edit"|\/new"|글쓰기|고치기|지우기|댓글/.test(document.getElementById('rail-popup')?.innerHTML || ''))));
  if (goOpened && go) {
    await page.click(`#rail-popup a[href="${go.href}"]`).catch(() => {});
  }
  ok(`${B}go_board_closes_and_navigates`, goOpened && (await gone(popupSel)) && (await ev(() => location.hash)) === '#/library/room-info' && !(await lockState()).cls);
  await ev((h) => {
    history.replaceState(null, '', h);
  }, hash0);

  // 세션 변경: 로그아웃 → 팝업 닫힘 · 캐시 버림
  let s1 = false;
  if (bannerReady) {
    await page.click(firstTitleBtn).catch(() => {});
    s1 = await wait(`${popupSel} .rail-popup__body`);
  }
  await ev(async () => {
    await window.__auth.logout();
  });
  const s1Closed = s1 && (await gone(popupSel, 2000));
  ok(`${B}logout_closes_popup`, s1Closed && !(await lockState()).cls);
  ok(
    `${B}logout_drops_cache`,
    s1Closed && (await ev(() => window.__store.getInfoRailList({ boardRole: 'supply-room', ownerKey: '11:study_room_owner:' }, 'info-room') === null)),
  );
  // 다른 역할로 로그인(auth:login) → 팝업 닫힘
  await session({ user_id: 11, role_type: 'study_room_owner', name: 'r', email: 'r@x' }, 'supply-room');
  await mount('rail', 'home', { navRole: 'study_room' });
  await wait('#rail [data-rail-info="info-room"][data-rail-state="posts"]', 5000);
  let s2 = false;
  await page.click(firstTitleBtn).catch(() => {});
  s2 = await wait(`${popupSel} .rail-popup__body`);
  bServer.me = { user_id: 21, role_type: 'tutor', name: 't', email: 't@x' };
  bServer.role = 'supply-tutor';
  await ev(async () => {
    await window.__auth.initAuthSession();
    window.dispatchEvent(new CustomEvent('auth:login'));
  });
  ok(`${B}role_change_login_closes_popup`, s2 && (await gone(popupSel, 2000)));
  ok(
    `${B}role_change_drops_cache`,
    s2 && (await ev(() => window.__store.getInfoRailList({ boardRole: 'supply-room', ownerKey: '11:study_room_owner:' }, 'info-room') === null)),
  );

  // 찾기 레일(absolute 모드, 다른 번들과 같은 호출) → 팝업 동작 · 「게시판에서 보기」 새 탭
  await session({ user_id: 11, role_type: 'study_room_owner', name: 'r', email: 'r@x' }, 'supply-room');
  await ev(() => {
    document.getElementById('rail').innerHTML = '';
  });
  await mount('rail-search', 'search', { navRole: 'study_room', linkMode: 'absolute', homeBase: HOME_BASE });
  const searchReady = await wait('#rail-search [data-rail-info="info-room"][data-rail-state="posts"]', 5000);
  const hashS = await ev(() => location.hash);
  let sOpened = false;
  if (searchReady) {
    await page.click('#rail-search [data-rail-info="info-room"] [data-info-rail-post="info-room-p1"]').catch(() => {});
    sOpened = await wait(`${popupSel} .rail-popup__body`);
  }
  ok(`${B}search_rail_popup_opens_hash_unchanged`, sOpened && (await ev(() => location.hash)) === hashS);
  const goS = await ev((label) => {
    const a = [...document.querySelectorAll('#rail-popup a')].find((x) => x.textContent.trim() === label);
    return a ? { href: a.getAttribute('href'), target: a.getAttribute('target') || '' } : null;
  }, POLICY_COPY.goBoard);
  ok(`${B}search_go_board_new_tab_home_base`, sOpened && goS?.href === `${HOME_BASE}/#/library/room-info` && goS.target === '_blank', JSON.stringify(goS));
  if (sOpened) await page.keyboard.press('Escape');
  await gone(popupSel);

  // 게스트: 배너 제목만 · 팝업 본문 없음 · 로그인 안내
  await session(null, 'guest');
  await ev(() => {
    document.getElementById('rail-search').innerHTML = '';
  });
  await mount('rail', 'home', { navRole: 'guest' });
  const gReady = await wait('#rail [data-rail-info="info-room"][data-rail-state="posts"]', 5000);
  ok(`${B}guest_banner_titles_only`, gReady && !(await ev(() => /LEAK_|BODY_/.test(document.getElementById('rail').innerHTML))));
  let gOpened = false;
  if (gReady) {
    await page.click(firstTitleBtn).catch(() => {});
    gOpened = await wait(`${popupSel} .rail-popup__post-title`);
    if (gOpened) await wait('#rail-popup [data-rail-popup-item]');
  }
  const gState = await ev((copy) => {
    const p = document.getElementById('rail-popup');
    const login = [...(p?.querySelectorAll('a') || [])].find((a) => /\/#\/login\?/.test(a.getAttribute('href') || ''));
    return {
      body: Boolean(p?.querySelector('.rail-popup__body')),
      leak: /LEAK_|BODY_/.test(p?.innerHTML || ''),
      copy: (p?.textContent || '').includes(copy),
      login: login ? login.getAttribute('href') : '',
      items: p?.querySelectorAll('[data-rail-popup-item]').length || 0,
      title: p?.querySelector('.rail-popup__post-title')?.textContent?.trim() || '',
    };
  }, POLICY_COPY.guestDetail);
  ok(`${B}guest_popup_no_body`, gOpened && !gState.body && !gState.leak && gState.title === 'TITLE_info-room_1', JSON.stringify(gState));
  ok(`${B}guest_popup_login_guidance`, gOpened && gState.copy && gState.login.includes('/#/login?'), JSON.stringify(gState));
  ok(`${B}guest_popup_list_titles`, gOpened && gState.items === 10 && !gState.leak);
  if (gOpened) await page.keyboard.press('Escape');
  await gone(popupSel);

  // 학생: 공급자 배너 DOM 없음, 학생 꿀팁 가이드 배너 하나만(사이트오류-6B)
  await session({ user_id: 31, role_type: 'guardian_student', name: 's', email: 's@x' }, 'demand');
  await ev(() => {
    location.hash = '#/parent';
  });
  await mount('rail', 'home', { navRole: 'parent' });
  await page.waitForTimeout(300);
  ok(`${B}student_no_banner_dom`, (await ev(() => document.querySelectorAll('[data-rail-info="info-room"], [data-rail-info="info-tutor"]').length)) === 0);
  ok(
    `${B}student_tips_banner_only`,
    (await ev(() => [...document.querySelectorAll('[data-rail-info]')].map((s) => s.getAttribute('data-rail-info')).join(','))) === STUDENT_BOARD,
  );

  // 모바일: 거의 전체 화면 시트
  await session({ user_id: 11, role_type: 'study_room_owner', name: 'r', email: 'r@x' }, 'supply-room');
  await page.setViewportSize({ width: 390, height: 844 });
  await ev(() => {
    location.hash = '#/study-room';
    window.scrollTo(0, 0);
  });
  await mount('rail', 'home', { navRole: 'study_room' });
  const mReady = await wait('#rail [data-rail-info="info-room"][data-rail-state="posts"]', 5000);
  let mOpened = false;
  if (mReady) {
    await page.click(firstTitleBtn).catch(() => {});
    mOpened = await wait(`${popupSel} .rail-popup__body`);
  }
  const box = mOpened ? await page.locator('#rail-popup [role="dialog"]').boundingBox() : null;
  ok(`${B}mobile_sheet_near_full_screen`, Boolean(box && box.width >= 390 * 0.95 && box.height >= 844 * 0.85), JSON.stringify(box));
  if (mOpened) await page.keyboard.press('Escape');

  ok(`${B}no_page_errors`, pageErrors.length === 0, pageErrors.join(' | ').slice(0, 300));
} catch (e) {
  ok(`${B}browser_setup`, false, String(e?.stack || e?.message || e).slice(0, 400));
} finally {
  await browser?.close().catch(() => {});
  await viteServer?.close().catch(() => {});
}

console.log(`\n${passed} passed / ${failed} failed`);
if (failed) process.exit(1);
console.log('rail-info-banners verify ok');
process.exit(0);
