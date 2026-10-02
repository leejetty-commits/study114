/**
 * 사이트오류-6B · 「학생 꿀팁 가이드」(#/library/student-tips, info-student) 화면 검사
 * 실행: cd preview/home-ui && npx --yes vite-node ../../scripts/verify-student-tips-board.mjs
 *
 * (a) JS ACL 표 = 정책 = PHP BoardChannelAcl(가능하면 php 로 직접 비교)
 * (b) 계정 7종(게스트·학생·무료 공부방·유료 공부방·무료 과외쌤·유료 과외쌤·관리자) × 읽기·쓰기·수정·삭제 화면 분기(서버 값만 따른다)
 * (c) 작성자: 서버가 준 가린 이름만 그린다. 클라이언트는 이름 원문 필드를 다루지 않는다
 * (d) 「응원해요」 🎉: reactions.php 에 board_key·post_key 로만 보낸다(고민방 post_id·kind 와 다른 몸), 게스트는 로그인 안내
 * (e) 연락처·외부 링크: 서버 422 메시지를 그대로 보여 준다, 글쓰기 화면에 안내
 * (f) 노출: 자료실 입구 카드·메뉴·우측 레일 배너(학생은 이 게시판만, 공급자 게시판 DOM 없음), 0건·실패 구분(상자·제목 유지)
 * (g) 저장 → 새로고침(메모리 캐시 버림) → 서버에서 다시 받아 그대로 있음, 실패 ≠ 0건
 * (h) 입구: 역할 확인 전 불러오는 중 상자, me.php 실패 시 실패 상자 + 다시 시도
 * (i) 브라우저 저장소 쓰기 0, 시드·샘플 글 없음, 6A 잔여 제거
 * DB·서버에 접속하지 않는다. /api/* 는 서버 계약대로 흉내 낸다.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (rel) => {
  const p = join(root, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
};

// ── 최소 브라우저 환경 (저장소 쓰기를 센다) ──
const storageWrites = [];
function makeStorage(label) {
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => {
      storageWrites.push(`${label}:${k}`);
      mem.set(k, String(v));
    },
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear(),
  };
}
globalThis.sessionStorage = makeStorage('session');
globalThis.localStorage = makeStorage('local');
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

const KEY = 'info-student';
const PATH = '/library/student-tips';
const LABEL = '학생 꿀팁 가이드';
const PROVIDER_NAMES = ['공부방 쏙쏙정보', '과외쌤 따끈 팁가이드'];
const CHIPS = ['공부 노하우', '시험·내신', '입시·진로', '습관·마음관리', '과외쌤·공부방 고르기', '선배 이야기'];
const CATEGORY_KEYS = ['study-howto', 'exam-school', 'admission-career', 'habit-mind', 'choose-provider', 'senior-story'];
const BLOCKED_MSG = '연락처·카톡·외부 링크는 올릴 수 없어요. 빼고 다시 올려 주세요.';

const ME = {
  student: { user_id: 31, role_type: 'guardian_student', name: 's', email: 's@x' },
  room_free: { user_id: 12, role_type: 'study_room_owner', name: 'r2', email: 'r2@x' },
  room_paid: { user_id: 11, role_type: 'study_room_owner', name: 'r', email: 'r@x' },
  tutor_free: { user_id: 22, role_type: 'tutor', name: 't2', email: 't2@x' },
  tutor_paid: { user_id: 21, role_type: 'tutor', name: 't', email: 't@x' },
  admin: { user_id: 1, role_type: 'admin', admin_level: 'super', name: 'a', email: 'a@x' },
  member: { user_id: 41, role_type: '', name: 'm', email: 'm@x' },
};
const PAID = new Set([11, 21]);
const MASKED = { 31: '최진○', 32: '김○' };

// ── 가짜 서버 (posts.php · reactions.php · me.php). 글은 이 프로세스 메모리에 남는다(= 서버 DB) ──
const requests = [];
const session = { me: null, meFail: false };
const server = { mode: 'posts', nextFail: null };
const db = { posts: [], cheers: new Set() };
let seq = 0;

function json(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}
function roleOf(me) {
  if (!me) return 'guest';
  if (me.role_type === 'admin' || me.admin_level) return 'admin';
  if (me.role_type === 'guardian_student') return 'demand';
  if (me.role_type === 'study_room_owner') return 'supply-room';
  if (me.role_type === 'tutor') return 'supply-tutor';
  return 'member';
}
function canWrite(me) {
  const r = roleOf(me);
  return r === 'admin' || r === 'demand' || ((r === 'supply-room' || r === 'supply-tutor') && PAID.has(me.user_id));
}
function authorLabelOf(p) {
  if (p.authorRole === 'parent') return MASKED[p.authorId] || '학생';
  return { study_room: '공부방', tutor: '과외쌤', admin: '운영자' }[p.authorRole] || '';
}
function viewOf(p, me, access) {
  const base = { id: p.id, title: p.title, categoryId: p.categoryId, createdAt: p.createdAt };
  if (access !== 'full') return { ...base, body: 'LEAK_BODY', authorLabel: 'LEAK_AUTHOR', cheerCount: 99 };
  const mine = me && me.user_id === p.authorId;
  const admin = roleOf(me) === 'admin';
  return {
    ...base,
    body: p.body,
    authorLabel: authorLabelOf(p),
    updatedAt: p.createdAt,
    edited: Boolean(p.edited),
    canEdit: admin || (mine && canWrite(me)),
    canDelete: admin || mine,
    cheerCount: [...db.cheers].filter((c) => c.endsWith(`|${p.id}`)).length,
    cheered: Boolean(me && db.cheers.has(`${me.user_id}|${p.id}`)),
    canCheer: roleOf(me) !== 'guest' && roleOf(me) !== 'member',
  };
}
function blockedContact(s) {
  return /카톡|kakao|오픈채팅|https?:\/\/|www\.|01[016789][-\s]?\d{3,4}[-\s]?\d{4}|@\w+\./i.test(s);
}

globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input), 'http://127.0.0.1:5174');
  const method = String(init.method || 'GET').toUpperCase();
  const body = init.body ? JSON.parse(String(init.body)) : null;
  requests.push({ method, path: url.pathname, params: Object.fromEntries(url.searchParams), body });
  if (url.pathname.endsWith('/api/auth/me.php')) {
    if (session.meFail) return json(503, { ok: false, message: 'down' });
    return json(200, session.me ? { ok: true, authenticated: true, email_verified: true, ...session.me } : { ok: true, authenticated: false });
  }
  if (url.pathname.endsWith('/api/auth/logout.php')) return json(200, { ok: true });
  if (url.pathname.endsWith('/api/board/concern-hot.php')) return json(200, { ok: true, posts: [], boards: {} });
  const me = session.me;
  const role = roleOf(me);
  if (url.pathname.endsWith('/api/board/reactions.php') && method === 'POST') {
    if (!me) return json(401, { ok: false, error: 'unauthorized', message: '로그인하면 응원할 수 있어요.' });
    if (body?.board_key !== KEY || role === 'member') return json(403, { ok: false, error: 'forbidden', message: 'x' });
    const k = `${me.user_id}|${body.post_key}`;
    if (db.cheers.has(k)) db.cheers.delete(k);
    else db.cheers.add(k);
    return json(200, { ok: true, postKey: body.post_key, cheered: db.cheers.has(k), cheerCount: [...db.cheers].filter((c) => c.endsWith(`|${body.post_key}`)).length });
  }
  if (!url.pathname.endsWith('/api/board/posts.php')) return json(404, { ok: false, message: 'not found' });
  const boardKey = url.searchParams.get('board_key') || body?.board_key;
  if (boardKey !== KEY) {
    // 공급자 정보 게시판: 학생·member 거절(기존 계약)
    if (role === 'demand' || role === 'member') return json(403, { ok: false, error: 'forbidden', message: 'forbidden' });
    return json(200, { ok: true, access: role === 'guest' ? 'titles' : 'full', boardKey, posts: [], total: 0, hasMore: false, canCompose: false });
  }
  if (server.nextFail) {
    const f = server.nextFail;
    server.nextFail = null;
    return json(f.status, { ok: false, error: 'x', message: f.message });
  }
  if (server.mode === 'fail') return json(500, { ok: false, message: 'db down' });
  const access = role === 'guest' || role === 'member' ? 'titles' : 'full';
  if (method === 'GET') {
    const live = server.mode === 'empty' ? [] : db.posts.filter((p) => p.status === 'published').sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const postKey = url.searchParams.get('post_key');
    if (postKey) {
      const p = live.find((x) => x.id === postKey);
      if (!p) return json(404, { ok: false, error: 'not_found', message: '글을 찾을 수 없습니다.' });
      return json(200, { ok: true, access, boardKey, post: viewOf(p, me, access) });
    }
    const category = url.searchParams.get('category') || null;
    const filtered = category ? live.filter((p) => p.categoryId === category) : live;
    const offset = Number(url.searchParams.get('offset') || 0);
    const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || 20), 20));
    const page = filtered.slice(offset, offset + limit);
    return json(200, {
      ok: true,
      access,
      boardKey,
      posts: page.map((p) => viewOf(p, me, access)),
      total: filtered.length,
      limit,
      offset,
      category,
      hasMore: offset + page.length < filtered.length,
      canCompose: access === 'full' && canWrite(me),
    });
  }
  if (method === 'POST') {
    if (!me) return json(401, { ok: false, error: 'unauthorized', message: '로그인이 필요합니다.' });
    if (!canWrite(me)) return json(403, { ok: false, error: 'forbidden', message: '공부방·과외쌤 글쓰기는 픽·프라임 이용 중에 할 수 있어요. 학생 계정은 바로 쓸 수 있어요.' });
    if (blockedContact(`${body.title}\n${body.body}`)) return json(422, { ok: false, error: 'validation', message: BLOCKED_MSG });
    if (body.post_key) {
      const p = db.posts.find((x) => x.id === body.post_key);
      if (!p || (p.authorId !== me.user_id && roleOf(me) !== 'admin')) return json(403, { ok: false, error: 'forbidden', message: '작성자만 수정할 수 있습니다.' });
      Object.assign(p, { title: body.title, body: body.body, categoryId: body.category, edited: true });
      return json(200, { ok: true, post: viewOf(p, me, 'full') });
    }
    seq += 1;
    const authorRole = { demand: 'parent', 'supply-room': 'study_room', 'supply-tutor': 'tutor', admin: 'admin' }[role];
    const p = {
      id: `${KEY}-${1790000000 + seq}-a${seq}`,
      title: body.title,
      body: body.body,
      categoryId: body.category,
      createdAt: `2026-10-02T09:${String(seq).padStart(2, '0')}:00`,
      authorId: me.user_id,
      authorRole,
      status: 'published',
    };
    db.posts.push(p);
    return json(200, { ok: true, post: viewOf(p, me, 'full') });
  }
  if (method === 'DELETE') {
    const p = db.posts.find((x) => x.id === url.searchParams.get('post_key'));
    if (!me) return json(401, { ok: false, message: 'x' });
    if (!p || (p.authorId !== me.user_id && roleOf(me) !== 'admin')) return json(403, { ok: false, message: '작성자만 삭제할 수 있습니다.' });
    p.status = 'deleted';
    return json(200, { ok: true, deleted: true });
  }
  return json(405, { ok: false });
};

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
}
async function okAsync(name, fn) {
  let result = false;
  let detail = '';
  try {
    result = Boolean(await fn());
  } catch (e) {
    detail = String(e?.message || e);
  }
  ok(name, result, detail);
}
async function load(importer, label) {
  try {
    return await importer();
  } catch (e) {
    console.error(`(import 실패: ${label} — ${e?.message || e})`);
    return null;
  }
}
const flush = async (n = 8) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0));
};

/**
 * DOM 없는 bind 검사용 가짜 root. 선택자의 [속성] / [속성="값"] 이 HTML 에 있으면 요소 하나를 돌려준다.
 * 요소의 addEventListener 로 건 함수는 click(selector) 로 부른다.
 */
function fakeRoot(html) {
  const handlers = [];
  const attrOf = (sel) => sel.match(/\[([\w-]+)(?:="([^"]*)")?\]/);
  const find = (sel) => {
    const m = attrOf(sel);
    if (!m) return null;
    const needle = m[2] !== undefined ? `${m[1]}="${m[2]}"` : m[1];
    const re = new RegExp(`<[^>]*\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*>`);
    const tag = html.match(re)?.[0];
    if (!tag) return null;
    return {
      tag,
      disabled: false,
      hidden: true,
      textContent: '',
      innerHTML: '',
      getAttribute: (n) => tag.match(new RegExp(`\\b${n}="([^"]*)"`))?.[1] ?? null,
      setAttribute() {},
      addEventListener: (ev, fn) => handlers.push({ sel, ev, fn }),
    };
  };
  return {
    querySelector: find,
    querySelectorAll: (sel) => {
      const el = find(sel);
      return el ? [el] : [];
    },
    async click(sel) {
      const h = handlers.filter((x) => x.sel === sel && x.ev === 'click');
      for (const x of h) await x.fn({ preventDefault() {}, currentTarget: {} });
      return h.length;
    },
  };
}

// ── 모듈 ──
const acl = await load(() => import('../preview/home-ui/src/board-channel-acl.js'), 'board-channel-acl');
const copy = await load(() => import('../preview/home-ui/src/library/library-copy.js'), 'library-copy');
const router = await load(() => import('../preview/home-ui/src/library/library-router.js'), 'library-router');
const store = await load(() => import('../preview/home-ui/src/library/info-board-store.js'), 'info-board-store');
const screens = await load(() => import('../preview/home-ui/src/library/info-board-screens.js'), 'info-board-screens');
const infoRail = await load(() => import('../preview/home-ui/src/library/info-rail.js'), 'info-rail');
const supportScreens = await load(() => import('../preview/home-ui/src/support/screens.js'), 'support-screens');
const libraryScreens = await load(() => import('../preview/home-ui/src/library/library-screens.js'), 'library-screens');
const authSession = await load(() => import('../preview/home-ui/src/auth-session.js'), 'auth-session');
const emptyState = await load(() => import('../preview/home-ui/src/empty-state-copy.js'), 'empty-state-copy');
const ENTRY = copy?.LIBRARY_ENTRY_COPY || {};
const COPY = copy?.INFO_BOARD_COPY || {};
const TIPS = copy?.STUDENT_TIPS_COPY || {};
const RAIL = copy?.INFO_RAIL_COPY || {};

function renderSupportLibrary() {
  globalThis.location.hash = '#/support/library';
  const html = supportScreens?.renderSupportScreen?.('/support/library') ?? '';
  globalThis.location.hash = '#/guest';
  return html;
}
const boardCards = (html) => [...String(html).matchAll(/data-library-board="([^"]+)"/g)].map((m) => m[1]);

/* ══════ (h) 입구: 역할 확인 전 · me.php 실패 (세션 없는 첫 상태에서 먼저 본다) ══════ */
session.meFail = true;
const pendingHtml = renderSupportLibrary();
ok('entry_loading_box_before_role', () =>
  pendingHtml.includes('data-library-entry-state="loading"') &&
  pendingHtml.includes('data-info-entry-pending') &&
  pendingHtml.includes(ENTRY.loading) &&
  pendingHtml.includes('<h2>자료실</h2>') &&
  boardCards(pendingHtml).length === 0,
);
let rerenders = 0;
const rerender = () => {
  rerenders += 1;
};
screens?.bindInfoBoardEntry?.(fakeRoot(pendingHtml), rerender);
await flush();
const failedHtml = renderSupportLibrary();
ok('entry_me_failure_rerenders', rerenders === 1);
ok('entry_failure_box_keeps_title', () =>
  failedHtml.includes('data-library-entry-state="failed"') &&
  failedHtml.includes(ENTRY.loadFailed) &&
  failedHtml.includes('<h2>자료실</h2>') &&
  failedHtml.includes(`data-action="library-entry-retry"`) &&
  failedHtml.includes(`>${ENTRY.retry}<`) &&
  !failedHtml.includes(ENTRY.loading) &&
  boardCards(failedHtml).length === 0,
);
ok('entry_failure_copy_exact', ENTRY.loadFailed === '길이 막혔어요. 잠시 후 다시 확인해 주세요' && ENTRY.retry === '다시 시도');
ok('entry_failure_on_library_route', () => (libraryScreens?.renderLibraryScreen?.('/library') ?? '').includes(ENTRY.loadFailed));
session.meFail = false;
const failRoot = fakeRoot(failedHtml);
screens?.bindInfoBoardEntry?.(failRoot, rerender);
await failRoot.click('[data-action="library-entry-retry"]');
const retryHtml = renderSupportLibrary();
ok('entry_retry_back_to_loading', retryHtml.includes('data-library-entry-state="loading"') && rerenders === 2);
screens?.bindInfoBoardEntry?.(fakeRoot(retryHtml), rerender);
await flush();
const guestEntry = renderSupportLibrary();
ok('entry_retry_success_shows_guest_cards', JSON.stringify(boardCards(guestEntry)) === JSON.stringify(['info-room', 'info-tutor', KEY]), boardCards(guestEntry).join(','));

/* ══════ (a) ACL ══════ */
const ROLES = ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'admin'];
const WANT = {
  //            discover list  detail compose delete react comment access
  guest: [true, false, false, false, false, false, false, 'titles'],
  member: [true, false, false, false, false, false, false, 'titles'],
  demand: [true, true, true, true, true, true, false, 'full'],
  'supply-room': [true, true, true, true, true, true, false, 'full'],
  'supply-tutor': [true, true, true, true, true, true, false, 'full'],
  admin: [true, true, true, true, true, true, false, 'full'],
};
for (const role of ROLES) {
  ok(`acl_js_${role}`, () => {
    const a = acl.getBoardAccess(KEY, role);
    const got = [a.canDiscover, a.canList, a.canDetail, a.canCompose, a.canDelete, a.canReact, a.canComment, a.access];
    return JSON.stringify(got) === JSON.stringify(WANT[role]);
  });
}
ok('acl_js_provider_boards_student_blocked', () =>
  ['info-room', 'info-tutor'].every((k) => ['demand', 'member'].every((r) => acl.getBoardAccess(k, r).access === 'blocked' && !acl.canDiscoverBoard(k, r))),
);
ok('acl_js_provider_boards_no_react', () => ['info-room', 'info-tutor'].every((k) => ROLES.every((r) => !acl.getBoardAccess(k, r).canReact)));
{
  const php = [process.env.PHP_BIN, 'D:\\php8.2\\php.exe', 'php'].filter(Boolean).find((bin) => {
    try {
      return spawnSync(bin, ['-v'], { encoding: 'utf8' }).status === 0;
    } catch {
      return false;
    }
  });
  if (php) {
    const code = `require '${join(root, 'src', 'bootstrap.php').replace(/\\/g, '/')}'; echo json_encode(array_values(array_filter(Study114\\Board\\BoardChannelAcl::dumpMatrix(), fn($r) => $r['alias'] === 'info-student')));`;
    const out = spawnSync(php, ['-r', code], { encoding: 'utf8' });
    let rows = [];
    try {
      rows = JSON.parse(out.stdout || '[]');
    } catch {
      rows = [];
    }
    const pick = (r) => JSON.stringify([r.role, r.discover, r.list, r.detail, r.compose, r.comment, r.react, r.delete, r.access]);
    const jsRows = acl.dumpBoardAclMatrix().filter((r) => r.alias === KEY);
    ok('acl_js_equals_php_matrix', rows.length === 5 && jsRows.length === 5 && rows.map(pick).join() === jsRows.map(pick).join(), `${rows.length}/${jsRows.length}`);
  } else {
    console.log('INFO  acl_js_equals_php_matrix — php 실행 파일 없음, compare-board-acl-matrix.mjs 로 비교');
  }
}

/* ══════ 문구 · 라우터 ══════ */
ok('copy_board_def', () => {
  const b = copy.STUDENT_TIPS_BOARD;
  return b.boardKey === KEY && b.path === PATH && b.label === LABEL && JSON.stringify(b.categories.map((c) => c.label)) === JSON.stringify(CHIPS)
    && JSON.stringify(b.categories.map((c) => c.key)) === JSON.stringify(CATEGORY_KEYS);
});
ok('copy_library_boards_order', () => JSON.stringify(copy.LIBRARY_BOARDS.map((b) => b.boardKey)) === JSON.stringify(['info-room', 'info-tutor', KEY]));
ok('copy_provider_boards_unchanged', () => copy.INFO_BOARDS.length === 2 && copy.INFO_BOARDS.every((b) => PROVIDER_NAMES.includes(b.label)));
ok('copy_cheer', TIPS.cheer === '응원해요' && TIPS.cheerEmoji === '🎉');
ok('copy_student_soon_removed', !('studentSoon' in ENTRY));
ok('router_parses_student_tips', () => {
  const p = router.parseInfoBoardPath;
  return p(PATH)?.boardKey === KEY && p(`${PATH}/new`)?.view === 'new' && p(`${PATH}/abc-1`)?.view === 'detail' && p(`${PATH}/abc-1/edit`)?.view === 'edit'
    && router.normalizeLibraryPath(PATH) === PATH;
});
const screensSrc = src('preview/home-ui/src/library/info-board-screens.js');
const storeSrc = src('preview/home-ui/src/library/info-board-store.js');
const railSrc = src('preview/home-ui/src/library/info-rail.js');
ok('screens_no_literal_copy', [LABEL, ...CHIPS, TIPS.cheer, TIPS.cheerLogin, ENTRY.loadFailed, ENTRY.loading].every((s) => s && !screensSrc.includes(s) && !railSrc.includes(s)));

/* ══════ (b) 계정 7종 × 화면 ══════ */
async function signIn(who) {
  session.me = who === 'guest' ? null : ME[who];
  if (who === 'guest') await authSession?.logout?.();
  await authSession?.initAuthSession?.();
  await screens?.primeInfoBoardEntry?.();
  store?.resetInfoBoardData?.();
  return store.currentInfoViewer();
}
// 서버에 학생 글 하나(작성자 31 → 「최진○」), 다른 학생 글 하나(32 → 「김○」)
db.posts.push(
  { id: `${KEY}-1790000001-s1`, title: '오답노트 꿀팁', body: '주말에 한 번 더 봐요.', categoryId: 'study-howto', createdAt: '2026-10-01T08:00:00', authorId: 31, authorRole: 'parent', status: 'published' },
  { id: `${KEY}-1790000002-s2`, title: '시험 전날 루틴', body: '일찍 자요.', categoryId: 'exam-school', createdAt: '2026-10-01T08:30:00', authorId: 32, authorRole: 'parent', status: 'published' },
);
const P1 = `${KEY}-1790000001-s1`;
const ACCOUNTS = {
  guest: { access: 'titles', compose: 'login', cheer: false },
  student: { access: 'full', compose: 'link', cheer: true },
  room_free: { access: 'full', compose: 'provider', cheer: true },
  room_paid: { access: 'full', compose: 'link', cheer: true },
  tutor_free: { access: 'full', compose: 'provider', cheer: true },
  tutor_paid: { access: 'full', compose: 'link', cheer: true },
  admin: { access: 'full', compose: 'link', cheer: true },
};
for (const [who, want] of Object.entries(ACCOUNTS)) {
  const viewer = await signIn(who);
  await store.loadInfoList(viewer, KEY, '');
  const list = screens.renderInfoBoardScreen(PATH, viewer);
  await store.loadInfoPost(viewer, KEY, P1);
  const detail = screens.renderInfoBoardScreen(`${PATH}/${P1}`, viewer);
  const compose = screens.renderInfoBoardScreen(`${PATH}/new`, viewer);
  ok(`ui_${who}_frame_and_title`, list.includes(`data-info-board="${KEY}"`) && screens.infoBoardTitleFor(PATH, viewer.boardRole) === LABEL);
  ok(`ui_${who}_list_rows`, list.includes('오답노트 꿀팁') && list.includes('시험 전날 루틴'));
  if (want.compose === 'link') {
    ok(`ui_${who}_write_link`, list.includes(`href="#${PATH}/new"`) && compose.includes(`data-info-form="${KEY}"`) && compose.includes(TIPS.contactNotice));
  } else if (want.compose === 'provider') {
    ok(`ui_${who}_write_blocked_notice`, !list.includes(`href="#${PATH}/new"`) && list.includes(TIPS.freeProviderCompose) && !compose.includes('data-info-form') && compose.includes(TIPS.freeProviderCompose));
  } else {
    ok(`ui_${who}_write_login_notice`, !list.includes(`href="#${PATH}/new"`) && list.includes(COPY.loginToWrite) && !compose.includes('data-info-form') && compose.includes(COPY.loginToWrite));
  }
  if (want.access === 'full') {
    ok(`ui_${who}_read_body_and_masked_author`, detail.includes('주말에 한 번 더 봐요.') && detail.includes('최진○') && !detail.includes('LEAK_'));
    ok(`ui_${who}_cheer_button`, detail.includes(`data-info-cheer="${P1}"`) && detail.includes(TIPS.cheer) && detail.includes(TIPS.cheerEmoji));
    const mine = who === 'student' || who === 'admin';
    ok(`ui_${who}_edit_delete_by_server_flags`, detail.includes(`${P1}/edit`) === mine && detail.includes(`data-info-delete="${P1}"`) === mine);
  } else {
    ok(`ui_${who}_read_titles_only`, !detail.includes('주말에 한 번 더 봐요.') && !detail.includes('최진○') && !detail.includes('LEAK_') && detail.includes(COPY.guestDetail));
    ok(`ui_${who}_cheer_login_guidance`, !detail.includes('data-info-cheer=') && detail.includes(TIPS.cheerLogin));
    ok(`ui_${who}_no_edit_delete`, !detail.includes('/edit"') && !detail.includes('data-info-delete'));
  }
}
await (async () => {
  const viewer = await signIn('member');
  await store.loadInfoList(viewer, KEY, '');
  const list = screens.renderInfoBoardScreen(PATH, viewer);
  ok('ui_member_titles_no_write', list.includes('오답노트 꿀팁') && !list.includes(`href="#${PATH}/new"`) && !list.includes(TIPS.freeProviderCompose));
})();

/* ══════ (b)(g) 쓰기·수정·삭제는 서버로만 · 저장 → 새로고침 → 그대로 ══════ */
let savedId = '';
await okAsync('save_reload_still_present', async () => {
  const viewer = await signIn('student');
  const before = requests.length;
  const saved = await store.saveInfoPost(viewer, { boardKey: KEY, title: '플래너 쓰는 법', body: '하루 세 줄만 써요.', category: 'habit-mind' });
  savedId = saved.id;
  const post = requests.slice(before).find((q) => q.method === 'POST' && q.path.endsWith('/api/board/posts.php'));
  store.resetInfoBoardData();
  const cleared = store.getInfoList(viewer, KEY) === null && store.getInfoPost(viewer, KEY, savedId) === null;
  const list = await store.loadInfoList(viewer, KEY, '');
  const detail = await store.loadInfoPost(viewer, KEY, savedId);
  return Boolean(post) && cleared && list.status === 'ready' && list.posts.some((p) => p.id === savedId) && detail.post?.body === '하루 세 줄만 써요.' && detail.post?.authorLabel === '최진○';
});
ok('save_payload_has_no_author_fields', () => {
  const post = requests.filter((q) => q.method === 'POST' && q.path.endsWith('/api/board/posts.php')).pop();
  return JSON.stringify(Object.keys(post?.body || {}).sort()) === JSON.stringify(['board_key', 'body', 'category', 'title']);
});
await okAsync('edit_via_server', async () => {
  const viewer = store.currentInfoViewer();
  const p = await store.saveInfoPost(viewer, { boardKey: KEY, postKey: savedId, title: '플래너 쓰는 법(보강)', body: '하루 세 줄.', category: 'habit-mind' });
  const req = requests.filter((q) => q.method === 'POST').pop();
  return p.edited === true && req.body.post_key === savedId;
});
await okAsync('edit_other_student_post_rejected_by_server', async () => {
  const viewer = store.currentInfoViewer();
  try {
    await store.saveInfoPost(viewer, { boardKey: KEY, postKey: `${KEY}-1790000002-s2`, title: 'x', body: 'y', category: 'habit-mind' });
    return false;
  } catch (e) {
    return e.status === 403;
  }
});
await okAsync('free_provider_save_rejected_by_server', async () => {
  const viewer = await signIn('tutor_free');
  try {
    await store.saveInfoPost(viewer, { boardKey: KEY, title: 'x', body: 'y', category: 'study-howto' });
    return false;
  } catch (e) {
    return e.status === 403;
  }
});
await okAsync('delete_via_server_then_gone_after_reload', async () => {
  const viewer = await signIn('student');
  await store.deleteInfoPost(viewer, KEY, savedId);
  const req = requests.filter((q) => q.method === 'DELETE').pop();
  store.resetInfoBoardData();
  const list = await store.loadInfoList(viewer, KEY, '');
  return req.params.board_key === KEY && req.params.post_key === savedId && !list.posts.some((p) => p.id === savedId);
});

/* ══════ (e) 연락처 차단: 서버 메시지 그대로 ══════ */
await okAsync('contact_block_shows_server_message', async () => {
  const viewer = await signIn('student');
  try {
    await store.saveInfoPost(viewer, { boardKey: KEY, title: '연락 주세요', body: '010-1234-5678', category: 'study-howto' });
    return false;
  } catch (e) {
    return e.status === 422 && e.message === BLOCKED_MSG;
  }
});
await okAsync('contact_block_message_in_form_error', async () => {
  const viewer = store.currentInfoViewer();
  await store.loadInfoList(viewer, KEY, '');
  const html = screens.renderInfoBoardScreen(`${PATH}/new`, viewer);
  return html.includes('data-info-form-error') && html.includes(TIPS.contactNotice) && screensSrc.includes("err.message !== 'board api error' ? err.message");
});

/* ══════ (d) 「응원해요」 ══════ */
await okAsync('cheer_posts_board_key_only', async () => {
  const viewer = await signIn('student');
  await store.loadInfoPost(viewer, KEY, P1);
  const before = requests.length;
  const r = await store.toggleInfoCheer(viewer, KEY, P1);
  const req = requests.slice(before).find((q) => q.path.endsWith('/api/board/reactions.php'));
  return r.cheered === true && r.cheerCount === 1 && req && JSON.stringify(Object.keys(req.body).sort()) === JSON.stringify(['board_key', 'post_key'])
    && !('post_id' in req.body) && !('kind' in req.body);
});
ok('cheer_detail_reflects_server', () => {
  const viewer = store.currentInfoViewer();
  const html = screens.renderInfoBoardScreen(`${PATH}/${P1}`, viewer);
  return html.includes('aria-pressed="true"') && /data-info-cheer-count>1</.test(html);
});
await okAsync('cheer_toggle_off_once_per_account', async () => {
  const r = await store.toggleInfoCheer(store.currentInfoViewer(), KEY, P1);
  return r.cheered === false && r.cheerCount === 0;
});
await okAsync('cheer_button_click_calls_reactions', async () => {
  const viewer = store.currentInfoViewer();
  const html = screens.renderInfoBoardScreen(`${PATH}/${P1}`, viewer);
  const rootEl = fakeRoot(html);
  let redraw = 0;
  screens.bindInfoBoardEvents(rootEl, () => {
    redraw += 1;
  }, `${PATH}/${P1}`);
  const before = requests.length;
  const clicked = await rootEl.click('[data-info-cheer]');
  await flush();
  const req = requests.slice(before).find((q) => q.path.endsWith('/api/board/reactions.php'));
  return clicked === 1 && req?.body?.post_key === P1 && redraw >= 1;
});
await okAsync('cheer_guest_rejected', async () => {
  const viewer = await signIn('guest');
  try {
    await store.toggleInfoCheer(viewer, KEY, P1);
    return false;
  } catch (e) {
    return e.status === 401;
  }
});
ok('cheer_store_separate_from_concern', !/concern/i.test(storeSrc) && storeSrc.includes("'/api/board/reactions.php'"));
ok('no_comment_ui', !/댓글|data-info-comment|comments\.php/.test(screensSrc + storeSrc));

/* ══════ (g) 실패 ≠ 0건 (상자·제목 유지) ══════ */
await okAsync('list_failure_distinct_from_empty', async () => {
  const viewer = await signIn('student');
  server.mode = 'fail';
  const f = await store.loadInfoList(viewer, KEY, '');
  const failHtml = screens.renderInfoBoardScreen(PATH, viewer);
  server.mode = 'empty';
  const e = await store.loadInfoList(viewer, KEY, '');
  const emptyHtml = screens.renderInfoBoardScreen(PATH, viewer);
  server.mode = 'posts';
  const frame = (h) => h.includes(`data-info-board="${KEY}"`) && h.includes(copy.STUDENT_TIPS_BOARD.lead);
  return f.status === 'failed' && e.status === 'ready' && e.posts.length === 0
    && frame(failHtml) && failHtml.includes(COPY.loadFailed) && failHtml.includes('data-action="info-retry"') && !failHtml.includes(COPY.empty)
    && frame(emptyHtml) && emptyHtml.includes(COPY.empty) && !emptyHtml.includes(COPY.loadFailed);
});

/* ══════ (f) 노출: 입구 카드 · 메뉴 · 레일 배너 ══════ */
const EXPOSURE = {
  guest: ['info-room', 'info-tutor', KEY],
  room_paid: ['info-room', 'info-tutor', KEY],
  tutor_free: ['info-room', 'info-tutor', KEY],
  admin: ['info-room', 'info-tutor', KEY],
  student: [KEY],
  member: [KEY],
};
// 배너 「최신 3개」를 보려고 서버에 글을 두 개 더 둔다(모두 4개).
db.posts.push(
  { id: `${KEY}-1790000003-s3`, title: '영단어 외우는 순서', body: '본문', categoryId: 'study-howto', createdAt: '2026-10-01T09:00:00', authorId: 31, authorRole: 'parent', status: 'published' },
  { id: `${KEY}-1790000004-s4`, title: '선배가 알려 주는 수행평가', body: '본문', categoryId: 'senior-story', createdAt: '2026-10-01T09:30:00', authorId: 21, authorRole: 'tutor', status: 'published' },
);
const railSections = (html) => [...String(html).matchAll(/<section\b[^>]*data-rail-info="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)].map((m) => ({ key: m[1], html: m[0] }));
const NAV_ROLE = { guest: 'guest', room_paid: 'study_room', tutor_free: 'tutor', admin: 'guest', student: 'parent', member: 'guest' };
for (const [who, want] of Object.entries(EXPOSURE)) {
  const viewer = await signIn(who);
  const entry = renderSupportLibrary();
  ok(`card_${who}`, JSON.stringify(boardCards(entry)) === JSON.stringify(want), boardCards(entry).join(','));
  const nav = screens.renderInfoBoardNavLinks('/library', viewer.boardRole);
  ok(`nav_${who}`, JSON.stringify([...nav.matchAll(/data-lib-nav="([^"]+)"/g)].map((m) => m[1])) === JSON.stringify(want.map((k) => copy.LIBRARY_BOARDS.find((b) => b.boardKey === k).path)));
  const ctx = { navRole: NAV_ROLE[who], homeBase: 'http://127.0.0.1:5174', leaveInNewTab: false };
  infoRail.renderInfoRailBanners(ctx);
  await flush();
  const secs = railSections(infoRail.renderInfoRailBanners(ctx));
  ok(`banner_${who}`, JSON.stringify(secs.map((s) => s.key)) === JSON.stringify(want), secs.map((s) => s.key).join(','));
  if (who === 'student' || who === 'member') {
    const all = entry + nav + secs.map((s) => s.html).join('');
    ok(`no_provider_dom_${who}`, PROVIDER_NAMES.every((n) => !all.includes(n)) && !all.includes('/library/room-info') && !all.includes('/library/tutor-tips'));
  }
  const tips = secs.find((s) => s.key === KEY);
  ok(`banner_${who}_latest3_popup_hook`, Boolean(tips) && tips.html.includes(`>${LABEL}<`) && (tips.html.match(/data-info-rail-post="/g) || []).length === 3
    && tips.html.includes(`data-info-rail-open="${KEY}"`) && tips.html.includes('data-info-rail-more'));
}
ok('card_student_tips_chips_and_link', () => {
  const html = renderSupportLibrary();
  const card = html.split(`data-library-board="${KEY}"`)[1] || '';
  return card.includes(`href="#${PATH}"`) && CHIPS.every((c) => card.includes(`>${c}<`)) && card.includes(`aria-label="${LABEL} ${ENTRY.enter}"`);
});
await okAsync('banner_empty_and_failed_keep_box_title', async () => {
  const viewer = await signIn('student');
  const ctx = { navRole: 'parent', homeBase: '', leaveInNewTab: false };
  const stateOf = async (mode) => {
    store.resetInfoBoardData();
    server.mode = mode;
    infoRail.renderInfoRailBanners(ctx);
    await flush();
    return railSections(infoRail.renderInfoRailBanners(ctx))[0] || { html: '' };
  };
  const empty = await stateOf('empty');
  const fail = await stateOf('fail');
  server.mode = 'posts';
  void viewer;
  return empty.html.includes(`>${LABEL}<`) && empty.html.includes('data-rail-state="empty"') && empty.html.includes(RAIL.empty) && !empty.html.includes(RAIL.loadFailed)
    && fail.html.includes(`>${LABEL}<`) && fail.html.includes('data-rail-state="failed"') && fail.html.includes(RAIL.loadFailed) && !fail.html.includes(RAIL.empty);
});
ok('banner_popup_via_rail_popup', railSrc.includes("from '../rail-popup.js'") && /LIBRARY_BOARDS\.find\(/.test(railSrc) && railSrc.includes('openRailPopup({'));
ok('banner_empty_copy_single_file', RAIL.empty === COPY.empty && src('preview/home-ui/src/library/library-copy.js').includes(RAIL.empty) && !railSrc.includes(RAIL.empty));
ok('support_home_library_desc', () => {
  const html = supportScreens?.renderSupportScreen?.('/support') ?? '';
  return /역할별 팁 게시판/.test(html);
});

/* ══════ (i) 저장소 · 시드 · 6A 잔여 ══════ */
ok('no_board_storage_writes', () => {
  const bad = storageWrites.filter((k) => /info|board|tips|library|cheer|post/i.test(k));
  if (bad.length) throw new Error(bad.join(', '));
  return true;
});
ok('no_storage_api_in_board_files', [screensSrc, storeSrc, railSrc, src('preview/home-ui/src/library/library-copy.js')].every((s) => s !== '' && !/localStorage|sessionStorage|indexedDB/.test(s)));
ok('no_seed_posts_in_client', () => {
  const c = src('preview/home-ui/src/library/library-copy.js');
  return !/SEED|sample|posts\s*:\s*\[\s*\{/i.test(c + storeSrc + screensSrc + railSrc) && !/TITLE_|오답노트/.test(c + storeSrc + screensSrc + railSrc);
});
const backendSrc = src('preview/home-ui/src/board/board-backend.js');
ok('6a_library_hydrate_removed', backendSrc !== '' && !/getLibraryPostsCache|LIBRARY_BOARD_KEYS|'library-template'|'library-guide-pdf'/.test(backendSrc));
ok('6a_support_library_section_removed', !/getSupportLibrarySection/.test(src('preview/home-ui/src/support/router.js')));
ok('6a_empty_copy_library_removed', () => emptyState?.EMPTY_COPY && !('library' in emptyState.EMPTY_COPY));
ok('6a_pdf_css_removed', !/\.pdf-(card|grid)/.test(src('preview/home-ui/src/styles/info-pages.css') + src('preview/home-ui/src/styles/zip-visual-v2.css')));
ok('6a_student_soon_removed', !/studentSoon/.test(screensSrc + src('preview/home-ui/src/library/library-copy.js')));

console.log(`\n${passed} passed / ${failed} failed`);
if (failed) process.exit(1);
console.log('student-tips-board verify ok');
process.exit(0);
