/**
 * 사이트오류-3 · 정보 게시판 화면 검사 (「공부방 쏙쏙정보」 #/library/room-info · 「과외쌤 따끈 팁가이드」 #/library/tutor-tips)
 * 실행: cd preview/home-ui && npx --yes vite-node ../../scripts/verify-info-boards-client.mjs
 *
 * (a) 라우터가 info 주소(목록·상세·글쓰기·수정)를 해석하고, 첫 진입 때 고객센터 자료실로 돌려보내지 않는다
 * (b) 학생·member 에게 진입 링크가 없고, 직접 주소로 오면 「볼 수 없는 게시판이에요」만 보인다(게시판 이름도 없음)
 * (c) 문구는 library-copy.js 상수이고 화면 파일에 직접 박히지 않는다
 * (d) 게스트 목록·상세는 제목만(서버가 본문을 섞어 보내도 그리지 않는다), 상세는 로그인 안내
 * (e) 쓰기 가능 여부는 서버 값(canCompose)을 따른다. 무료 공급자는 안내 문구, 유료는 글쓰기 링크
 * (f) 글쓰기·수정·삭제는 /api/board/posts.php 로만 간다(로컬 저장 없음). 저장 성공은 목록에 바로 반영, 실패는 서버 메시지
 * (g) 세션 주인(계정·역할)이 바뀌면 이전 캐시를 쓰지 않는다
 * (h) 자료실 입구(#/support/library): 공급자·관리자·게스트에게만 두 게시판 카드(「들어가기」 링크), 학생·member 와 역할 확인 전에는 링크 없음
 *     (6A: 3c 진입 링크 줄을 입구 카드로 합쳤고 샘플 탭을 걷었다 — 링크 글자는 「들어가기」, 게시판 이름은 aria-label 로 확인)
 * DB·서버에 접속하지 않는다. /api/board/posts.php 응답은 이 티켓의 서버 계약대로 흉내 낸다.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (rel) => {
  const p = join(root, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
};

// ── 최소 브라우저 환경 ──
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
const replaced = [];
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
    replace(v) {
      replaced.push(String(v));
    },
  },
  writable: true,
  configurable: true,
});

// ── 가짜 서버 (/api/board/posts.php) ──
const requests = [];
const server = { role: 'guest', mode: 'posts', canCompose: false, nextFail: null };
let seq = 0;
const store = {
  'info-room': [],
  'info-tutor': [],
};
function makePost(boardKey, n, extra = {}) {
  return {
    id: `${boardKey}-p${n}`,
    title: `TITLE_${boardKey}_${n}`,
    categoryId: boardKey === 'info-room' ? 'know-how' : 'lesson',
    createdAt: '2026-10-01T09:00:00',
    body: `BODY_${boardKey}_${n}\n<script>x</script>`,
    authorLabel: '공부방',
    updatedAt: '2026-10-01T09:00:00',
    edited: false,
    canEdit: false,
    canDelete: false,
    ...extra,
  };
}
function resetServerPosts(count = 3) {
  for (const key of Object.keys(store)) {
    store[key] = Array.from({ length: count }, (_, i) => makePost(key, i + 1));
  }
}
resetServerPosts();

function json(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}
function titlesOf(p) {
  // 서버가 실수로 본문·작성자를 섞어 보내도 화면은 그리지 않아야 한다.
  return { id: p.id, title: p.title, categoryId: p.categoryId, createdAt: p.createdAt, body: 'LEAK_BODY', authorLabel: 'LEAK_AUTHOR' };
}

/** /api/auth/me.php 흉내. null 이면 비로그인. */
const session = { me: null };

globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input), 'http://127.0.0.1:5174');
  const method = String(init.method || 'GET').toUpperCase();
  const body = init.body ? JSON.parse(String(init.body)) : null;
  requests.push({ method, path: url.pathname, params: Object.fromEntries(url.searchParams), body, credentials: init.credentials });
  if (url.pathname.endsWith('/api/auth/me.php')) {
    return json(200, session.me ? { ok: true, authenticated: true, email_verified: true, ...session.me } : { ok: true, authenticated: false });
  }
  if (url.pathname.endsWith('/api/auth/logout.php')) return json(200, { ok: true });
  if (!url.pathname.endsWith('/api/board/posts.php')) return json(404, { ok: false, message: 'not found' });
  if (server.nextFail) {
    const f = server.nextFail;
    server.nextFail = null;
    return json(f.status, { ok: false, error: 'x', message: f.message });
  }
  if (server.mode === 'fail') return json(500, { ok: false, message: 'db down' });
  const role = server.role;
  const blocked = role === 'demand' || role === 'member';
  if (method === 'GET') {
    const boardKey = url.searchParams.get('board_key');
    if (blocked) return json(403, { ok: false, error: 'forbidden', message: 'forbidden' });
    const access = role === 'guest' ? 'titles' : 'full';
    const postKey = url.searchParams.get('post_key');
    const all = server.mode === 'empty' ? [] : store[boardKey] || [];
    if (postKey) {
      const p = all.find((x) => x.id === postKey);
      if (!p) return json(404, { ok: false, error: 'not_found', message: '글을 찾을 수 없습니다.' });
      return json(200, { ok: true, access, boardKey, post: access === 'titles' ? titlesOf(p) : p });
    }
    const category = url.searchParams.get('category') || null;
    const filtered = category ? all.filter((p) => p.categoryId === category) : all;
    const offset = Number(url.searchParams.get('offset') || 0);
    const limit = 20;
    const page = filtered.slice(offset, offset + limit);
    return json(200, {
      ok: true,
      access,
      boardKey,
      posts: page.map((p) => (access === 'titles' ? titlesOf(p) : p)),
      total: filtered.length,
      limit,
      offset,
      category,
      hasMore: offset + page.length < filtered.length,
      canCompose: access === 'full' && server.canCompose,
    });
  }
  if (method === 'POST') {
    seq += 1;
    const post = makePost(body.board_key, 100 + seq, {
      id: body.post_key || `${body.board_key}-new${seq}`,
      title: body.title,
      body: body.body,
      categoryId: body.category,
      canEdit: true,
      canDelete: true,
      edited: Boolean(body.post_key),
    });
    return json(200, { ok: true, post });
  }
  if (method === 'DELETE') return json(200, { ok: true, deleted: true });
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
/** @param {() => Promise<any>} importer */
async function load(importer, label) {
  try {
    return await importer();
  } catch (e) {
    console.error(`(import 실패: ${label} — ${e?.message || e})`);
    return null;
  }
}

const router = await load(() => import('../preview/home-ui/src/library/library-router.js'), 'library-router');
const copy = await load(() => import('../preview/home-ui/src/library/library-copy.js'), 'library-copy');
const acl = await load(() => import('../preview/home-ui/src/board-channel-acl.js'), 'board-channel-acl');
const state = await load(() => import('../preview/home-ui/src/state.js'), 'state');
const infoStore = await load(() => import('../preview/home-ui/src/library/info-board-store.js'), 'info-board-store');
const screens = await load(() => import('../preview/home-ui/src/library/info-board-screens.js'), 'info-board-screens');

const COPY = copy?.INFO_BOARD_COPY || {};
const POLICY_COPY = {
  empty: '아직 글이 도착하지 않았어요. 첫 정보를 기다려요',
  loadFailed: '글을 불러오는 중 길이 막혔어요. 잠시 후 다시 확인해 주세요',
  freeProviderCompose: '글쓰기는 픽·프라임을 이용 중인 공부방·과외쌤이 할 수 있어요',
  guestDetail: '로그인하면 전체 내용을 볼 수 있어요',
  blocked: '볼 수 없는 게시판이에요',
};
const NAMES = { 'info-room': '공부방 쏙쏙정보', 'info-tutor': '과외쌤 따끈 팁가이드' };
const CATEGORIES = {
  'info-room': [
    ['know-how', '운영 노하우'],
    ['recruit', '학생 모집·홍보'],
    ['admin-tax', '시설·행정·세무'],
    ['edu-news', '입시·교육 소식'],
  ],
  'info-tutor': [
    ['lesson', '수업 노하우'],
    ['consult-match', '상담·학생 매칭'],
    ['contract-tax', '계약·정산·세무'],
    ['edu-news', '입시·교육 소식'],
  ],
};

const viewers = {
  guest: { boardRole: 'guest', ownerKey: 'guest' },
  demand: { boardRole: 'demand', ownerKey: '31:guardian_student:' },
  member: { boardRole: 'member', ownerKey: '41::' },
  room: { boardRole: 'supply-room', ownerKey: '11:study_room_owner:' },
  room2: { boardRole: 'supply-room', ownerKey: '12:study_room_owner:' },
  tutor: { boardRole: 'supply-tutor', ownerKey: '21:tutor:' },
  admin: { boardRole: 'admin', ownerKey: '1:admin:super' },
};

// ── (a) 라우터 ──
const parse = (p) => router?.parseInfoBoardPath?.(p) ?? null;
ok('route_room_list', () => {
  const r = parse('/library/room-info');
  return r?.boardKey === 'info-room' && r.view === 'list' && r.basePath === '/library/room-info';
});
ok('route_tutor_list', () => {
  const r = parse('/library/tutor-tips');
  return r?.boardKey === 'info-tutor' && r.view === 'list';
});
ok('route_new', () => parse('/library/room-info/new')?.view === 'new' && parse('/library/tutor-tips/new')?.view === 'new');
ok('route_detail', () => {
  const r = parse('/library/tutor-tips/info-tutor-1790000000-ab12cd');
  return r?.view === 'detail' && r.postKey === 'info-tutor-1790000000-ab12cd';
});
ok('route_edit', () => {
  const r = parse('/library/room-info/info-room-1-abc/edit');
  return r?.view === 'edit' && r.postKey === 'info-room-1-abc';
});
ok('route_normalize_keeps_info_paths', () =>
  ['/library/room-info', '/library/tutor-tips/new', '/library/room-info/abc-1', '/library/room-info/abc-1/edit'].every(
    (p) => router?.normalizeLibraryPath(p) === p,
  ),
);
ok('route_existing_library_unchanged', () =>
  router?.normalizeLibraryPath('/library') === '/library' &&
  router?.normalizeLibraryPath('/library/guides') === '/library/guides' &&
  router?.normalizeLibraryPath('/library/templates') === '/library/templates' &&
  router?.normalizeLibraryPath('/library/unknown') === null &&
  router?.normalizeLibraryPath('/library/room-info/a/b/c') === null &&
  parse('/library/guides') === null,
);
ok('bootstrap_info_path_not_redirected', () => {
  replaced.length = 0;
  globalThis.location.hash = '#/library/room-info/new';
  const r = state.bootstrapLibraryRoute();
  return r === false && replaced.length === 0;
});
ok('bootstrap_existing_library_still_redirects', () => {
  replaced.length = 0;
  globalThis.location.hash = '#/library/templates';
  const r = state.bootstrapLibraryRoute();
  globalThis.location.hash = '#/guest';
  return r === true && replaced[0] === '#/support/library/templates';
});

// ── 클라이언트 ACL(서버 표와 같은 값) ──
ok('acl_js_guest_titles', () => ['info-room', 'info-tutor'].every((k) => acl.getBoardAccess(k, 'guest').access === 'titles'));
ok('acl_js_student_member_blocked', () =>
  ['info-room', 'info-tutor'].every(
    (k) => acl.getBoardAccess(k, 'parent').access === 'blocked' && acl.getBoardAccess(k, 'member').access === 'blocked',
  ),
);
ok('acl_js_providers_admin_full_compose', () =>
  ['info-room', 'info-tutor'].every((k) =>
    ['study_room', 'tutor', 'admin'].every((r) => {
      const a = acl.getBoardAccess(k, r);
      return a.access === 'full' && a.canCompose && a.canDelete;
    }),
  ),
);
ok('acl_js_no_comment_react_download_upload', () =>
  ['info-room', 'info-tutor'].every((k) =>
    ['guest', 'parent', 'member', 'study_room', 'tutor', 'admin'].every((r) => {
      const a = acl.getBoardAccess(k, r);
      return !a.canComment && !a.canReact && !a.canDownload && !a.canUpload;
    }),
  ),
);
// 사이트오류-6B: info-student 행(5개)이 매트릭스에 더해졌다. 이 항목은 공급자 정보 게시판 2개 행만 센다.
ok('acl_js_matrix_has_info_rows', () => acl.dumpBoardAclMatrix().filter((r) => ['info-room', 'info-tutor'].includes(r.channel)).length === 10);

// ── (c) 문구 ──
ok('copy_policy_strings_exact', () => Object.entries(POLICY_COPY).every(([k, v]) => COPY[k] === v));
ok('copy_board_names_exact', () =>
  (copy?.INFO_BOARDS || []).length === 2 &&
  copy.INFO_BOARDS.every((b) => NAMES[b.boardKey] === b.label) &&
  copy.INFO_BOARDS.find((b) => b.boardKey === 'info-room')?.path === '/library/room-info' &&
  copy.INFO_BOARDS.find((b) => b.boardKey === 'info-tutor')?.path === '/library/tutor-tips',
);
ok('copy_categories_exact', () =>
  Object.entries(CATEGORIES).every(([key, cats]) => {
    const b = (copy?.INFO_BOARDS || []).find((x) => x.boardKey === key);
    return b && JSON.stringify(b.categories.map((c) => [c.key, c.label])) === JSON.stringify(cats);
  }),
);
const screenSrc = src('preview/home-ui/src/library/info-board-screens.js');
const storeSrc = src('preview/home-ui/src/library/info-board-store.js');
const shellSrc = src('preview/home-ui/src/library/library-shell.js');
ok('screens_have_no_literal_copy', () =>
  screenSrc !== '' &&
  [...Object.values(POLICY_COPY), ...Object.values(NAMES), ...Object.values(CATEGORIES).flat().map(([, l]) => l)].every(
    (s) => !screenSrc.includes(s) && !shellSrc.includes(s),
  ),
);
ok('copy_terms_clean', () => {
  const all = JSON.stringify({ COPY, boards: copy?.INFO_BOARDS || [] });
  return all !== '{"COPY":{},"boards":[]}' && !/학부모|보드|공개|숨김|심사|이용권/.test(all);
});
ok('store_server_only_no_local_storage', () =>
  storeSrc !== '' &&
  !/localStorage|sessionStorage|indexedDB/.test(storeSrc) &&
  storeSrc.includes('/api/board/posts.php'),
);

// ── (b) 진입 링크 · 학생 차단 ──
const navLinks = (path, role) => screens?.renderInfoBoardNavLinks?.(path, role);
// 사이트오류-6B: 학생·member 메뉴에는 학생 꿀팁 가이드 하나만 있다. 공급자 게시판 링크·이름은 여전히 없어야 한다.
ok('nav_links_none_for_student_member', () =>
  ['demand', 'member'].every((r) => {
    const html = navLinks('/library', r) || '';
    return (
      !html.includes('#/library/room-info') &&
      !html.includes('#/library/tutor-tips') &&
      !html.includes(NAMES['info-room']) &&
      !html.includes(NAMES['info-tutor']) &&
      (html.match(/href="#\/library\//g) || []).length === 1 &&
      html.includes('#/library/student-tips')
    );
  }),
);
ok('nav_links_for_guest_provider_admin', () =>
  ['guest', 'supply-room', 'supply-tutor', 'admin'].every((r) => {
    const html = navLinks('/library', r) || '';
    return html.includes('#/library/room-info') && html.includes('#/library/tutor-tips') && html.includes(NAMES['info-room']);
  }),
);
ok('shell_renders_nav_links_helper', () => shellSrc.includes('renderInfoBoardNavLinks('));
const render = (path, viewer) => screens?.renderInfoBoardScreen?.(path, viewer) ?? '';
for (const who of ['demand', 'member']) {
  ok(`screen_${who}_direct_url_blocked`, () =>
    ['/library/room-info', '/library/tutor-tips/info-tutor-p1', '/library/room-info/new', '/library/room-info/x/edit'].every((p) => {
      const html = render(p, viewers[who]);
      return html.includes(POLICY_COPY.blocked) && !html.includes('쏙쏙') && !html.includes('팁가이드') && !html.includes('data-info-');
    }),
  );
}
await okAsync('student_never_requests_server', async () => {
  const before = requests.length;
  render('/library/room-info', viewers.demand);
  await infoStore.loadInfoList(viewers.demand, 'info-room', '');
  return requests.length === before;
});

// ── (d) 게스트 제목만 ──
await okAsync('guest_list_titles_only', async () => {
  server.role = 'guest';
  const entry = await infoStore.loadInfoList(viewers.guest, 'info-room', '');
  const html = render('/library/room-info', viewers.guest);
  return (
    entry.access === 'titles' &&
    entry.posts.every((p) => p.body === undefined && p.authorLabel === undefined) &&
    html.includes('TITLE_info-room_1') &&
    html.includes('#/library/room-info/info-room-p1') &&
    !html.includes('LEAK_BODY') &&
    !html.includes('LEAK_AUTHOR') &&
    !html.includes('#/library/room-info/new')
  );
});
await okAsync('guest_detail_title_and_login_copy', async () => {
  const entry = await infoStore.loadInfoPost(viewers.guest, 'info-room', 'info-room-p2');
  const html = render('/library/room-info/info-room-p2', viewers.guest);
  return (
    entry.post?.title === 'TITLE_info-room_2' &&
    entry.post.body === undefined &&
    html.includes('TITLE_info-room_2') &&
    html.includes(POLICY_COPY.guestDetail) &&
    html.includes('/#/login?') &&
    !html.includes('LEAK_BODY') &&
    !html.includes('BODY_info-room_2')
  );
});
ok('guest_compose_shows_login_not_form', () => {
  const html = render('/library/room-info/new', viewers.guest);
  return html.includes('/#/login?') && !html.includes('<form');
});

// ── (e) 쓰기 가능 여부 = 서버 canCompose ──
await okAsync('free_provider_sees_notice_not_compose_link', async () => {
  server.role = 'supply-room';
  server.canCompose = false;
  await infoStore.loadInfoList(viewers.room2, 'info-tutor', '');
  const html = render('/library/tutor-tips', viewers.room2);
  return html.includes(POLICY_COPY.freeProviderCompose) && !html.includes('#/library/tutor-tips/new') && html.includes('TITLE_info-tutor_1');
});
ok('free_provider_compose_page_has_no_form', () => {
  const html = render('/library/tutor-tips/new', viewers.room2);
  return html.includes(POLICY_COPY.freeProviderCompose) && !html.includes('<form');
});
await okAsync('paid_provider_sees_compose_link_and_form', async () => {
  server.role = 'supply-room';
  server.canCompose = true;
  await infoStore.loadInfoList(viewers.room, 'info-room', '');
  const list = render('/library/room-info', viewers.room);
  const form = render('/library/room-info/new', viewers.room);
  const options = (form.match(/<option value="[a-z-]+"/g) || []).map((o) => o.slice(15, -1));
  return (
    list.includes('#/library/room-info/new') &&
    !list.includes(POLICY_COPY.freeProviderCompose) &&
    form.includes('<form') &&
    form.includes('maxlength="100"') &&
    form.includes('maxlength="5000"') &&
    JSON.stringify(options) === JSON.stringify(CATEGORIES['info-room'].map(([k]) => k))
  );
});
ok('list_has_all_plus_four_category_tabs', () => {
  const html = render('/library/room-info', viewers.room);
  const tabs = (html.match(/data-info-cat="[a-z-]*"/g) || []).map((t) => t.slice(15, -1));
  return JSON.stringify(tabs) === JSON.stringify(['', ...CATEGORIES['info-room'].map(([k]) => k)]) && html.includes(COPY.allTab || '전체');
});
await okAsync('category_tab_requests_server_filter', async () => {
  await infoStore.loadInfoList(viewers.room, 'info-room', 'recruit');
  const last = requests[requests.length - 1];
  await infoStore.loadInfoList(viewers.room, 'info-room', '');
  return last.method === 'GET' && last.params.category === 'recruit' && last.params.board_key === 'info-room';
});
await okAsync('empty_list_copy', async () => {
  server.mode = 'empty';
  await infoStore.loadInfoList(viewers.tutor, 'info-tutor', '');
  server.mode = 'posts';
  return render('/library/tutor-tips', viewers.tutor).includes(POLICY_COPY.empty);
});
await okAsync('load_failed_copy', async () => {
  server.mode = 'fail';
  const entry = await infoStore.loadInfoList(viewers.admin, 'info-room', '');
  server.mode = 'posts';
  return entry.status === 'failed' && render('/library/room-info', viewers.admin).includes(POLICY_COPY.loadFailed);
});
await okAsync('more_button_and_paging', async () => {
  resetServerPosts(25);
  server.role = 'supply-tutor';
  const first = await infoStore.loadInfoList(viewers.tutor, 'info-room', '');
  const hasMoreBtn = render('/library/room-info', viewers.tutor).includes('data-info-more');
  const next = await infoStore.loadMoreInfoList(viewers.tutor, 'info-room');
  const last = requests[requests.length - 1];
  resetServerPosts(3);
  return first.posts.length === 20 && first.hasMore && hasMoreBtn && next.posts.length === 25 && !next.hasMore && last.params.offset === '20';
});

// ── (g) 세션 주인 ──
ok('owner_switch_drops_cache', () => {
  const tutorHad = infoStore.getInfoList(viewers.tutor, 'info-room') !== null;
  const guestSees = infoStore.getInfoList(viewers.guest, 'info-room');
  const tutorAfter = infoStore.getInfoList(viewers.tutor, 'info-room');
  return tutorHad && guestSees === null && tutorAfter === null;
});

// ── (f) 서버 저장 경로 ──
await okAsync('detail_full_escapes_html_keeps_breaks', async () => {
  server.role = 'supply-room';
  await infoStore.loadInfoPost(viewers.room, 'info-room', 'info-room-p1');
  const html = render('/library/room-info/info-room-p1', viewers.room);
  return html.includes('&lt;script>') && !html.includes('<script>') && html.includes('BODY_info-room_1') && html.includes('공부방');
});
ok('edit_page_needs_server_can_edit', () => {
  const html = render('/library/room-info/info-room-p1/edit', viewers.room);
  return html !== '' && !html.includes('<form') && !html.includes('data-info-delete');
});
await okAsync('save_posts_to_server_and_list_updates_without_reload', async () => {
  server.canCompose = true;
  await infoStore.loadInfoList(viewers.room, 'info-room', '');
  const before = requests.length;
  const post = await infoStore.saveInfoPost(viewers.room, { boardKey: 'info-room', title: '새 글', body: '줄1\n줄2', category: 'recruit' });
  const req = requests[requests.length - 1];
  const entry = infoStore.getInfoList(viewers.room, 'info-room');
  return (
    requests.length === before + 1 &&
    req.method === 'POST' &&
    req.path === '/api/board/posts.php' &&
    req.credentials === 'include' &&
    req.body.board_key === 'info-room' &&
    req.body.title === '새 글' &&
    req.body.body === '줄1\n줄2' &&
    req.body.category === 'recruit' &&
    req.body.author_role === undefined &&
    req.body.author_user_id === undefined &&
    entry.posts[0]?.id === post.id
  );
});
await okAsync('save_failure_surfaces_server_message', async () => {
  server.nextFail = { status: 403, message: 'SERVER_SAYS_NO' };
  try {
    await infoStore.saveInfoPost(viewers.room, { boardKey: 'info-room', title: 'x', body: 'y', category: 'recruit' });
    return false;
  } catch (e) {
    return e.message === 'SERVER_SAYS_NO';
  }
});
await okAsync('edit_posts_post_key_and_updates_caches', async () => {
  const entry = infoStore.getInfoList(viewers.room, 'info-room');
  const target = entry.posts[0];
  const saved = await infoStore.saveInfoPost(viewers.room, { boardKey: 'info-room', postKey: target.id, title: '고친 글', body: 'z', category: 'edu-news' });
  const req = requests[requests.length - 1];
  const after = infoStore.getInfoList(viewers.room, 'info-room');
  const detail = infoStore.getInfoPost(viewers.room, 'info-room', target.id);
  return req.body.post_key === target.id && saved.edited && after.posts[0].title === '고친 글' && detail?.post?.title === '고친 글';
});
ok('own_post_detail_shows_edit_delete', () => {
  const entry = infoStore.getInfoList(viewers.room, 'info-room');
  const html = render(`/library/room-info/${entry.posts[0].id}`, viewers.room);
  return html.includes(`#/library/room-info/${entry.posts[0].id}/edit`) && html.includes('data-info-delete');
});
await okAsync('delete_calls_server_and_drops_from_list', async () => {
  const entry = infoStore.getInfoList(viewers.room, 'info-room');
  const target = entry.posts[0].id;
  await infoStore.deleteInfoPost(viewers.room, 'info-room', target);
  const req = requests[requests.length - 1];
  const after = infoStore.getInfoList(viewers.room, 'info-room');
  return (
    req.method === 'DELETE' &&
    req.params.board_key === 'info-room' &&
    req.params.post_key === target &&
    !after.posts.some((p) => p.id === target) &&
    infoStore.getInfoPost(viewers.room, 'info-room', target) === null
  );
});

// ── (h) 자료실 입구(#/support/library) 진입 링크 ──
const supportScreens = await load(() => import('../preview/home-ui/src/support/screens.js'), 'support-screens');
const authSession = await load(() => import('../preview/home-ui/src/auth-session.js'), 'auth-session');
const supportSrc = src('preview/home-ui/src/support/screens.js');

function renderSupportLibrary() {
  globalThis.location.hash = '#/support/library';
  const html = supportScreens?.renderSupportScreen?.('/support/library') ?? '';
  globalThis.location.hash = '#/guest';
  return html;
}
/** 정보 게시판 링크만 뽑는다: [목적지, 이름(aria-label 에서 「들어가기」를 뺀 값)] */
function infoLinksOf(html) {
  return [...html.matchAll(/<a\b([^>]*href="(#\/library\/[^"]*)"[^>]*)>([\s\S]*?)<\/a>/g)].map((m) => [
    m[2],
    ((m[1].match(/aria-label="([^"]*)"/) || ['', m[3].replace(/<[^>]+>/g, '')])[1] || '').replace(/\s*들어가기$/, '').trim(),
  ]);
}
const LIBRARY_HEAD_MARK = '<h2>자료실</h2>';
const ME = {
  demand: { user_id: 31, role_type: 'guardian_student', name: 's', email: 's@x' },
  member: { user_id: 41, role_type: '', name: 'm', email: 'm@x' },
  room: { user_id: 11, role_type: 'study_room_owner', name: 'r', email: 'r@x' },
  tutor: { user_id: 21, role_type: 'tutor', name: 't', email: 't@x' },
  admin: { user_id: 1, role_type: 'admin', admin_level: 'super', name: 'a', email: 'a@x' },
};
/** 세션 확인을 끝낸 상태로 만든다(앱 부트와 같은 initAuthSession + 진입 링크 역할 확인). */
async function signIn(who) {
  session.me = who === 'guest' ? null : ME[who];
  await authSession?.initAuthSession?.();
  await screens?.primeInfoBoardEntry?.();
}
// 사이트오류-6B: 학생 꿀팁 가이드 입구가 모든 역할에 붙는다.
const STUDENT_TIPS_LINK = ['#/library/student-tips', '학생 꿀팁 가이드'];
const EXPECTED_LINKS = JSON.stringify([
  ['#/library/room-info', NAMES['info-room']],
  ['#/library/tutor-tips', NAMES['info-tutor']],
  STUDENT_TIPS_LINK,
]);
const STUDENT_ONLY_LINKS = JSON.stringify([STUDENT_TIPS_LINK]);

const beforeRoleKnown = renderSupportLibrary();
ok('support_library_renders', () => beforeRoleKnown.includes(LIBRARY_HEAD_MARK) && !beforeRoleKnown.includes('class="tab-pills"'));
ok('support_entry_hidden_before_role_known', () =>
  beforeRoleKnown !== '' &&
  infoLinksOf(beforeRoleKnown).length === 0 &&
  !beforeRoleKnown.includes('쏙쏙') &&
  !beforeRoleKnown.includes('팁가이드'),
);
ok('support_screens_use_shared_helper', () => /renderLibraryBoardCards\(/.test(supportSrc));
ok('support_screens_no_literal_info_copy', () =>
  supportSrc !== '' &&
  [...Object.values(NAMES), COPY.navHeading || '정보 게시판', '/library/room-info', '/library/tutor-tips'].every(
    (s) => !supportSrc.includes(s),
  ),
);

for (const who of ['demand', 'member']) {
  await okAsync(`support_entry_none_for_${who}`, async () => {
    await signIn(who);
    const html = renderSupportLibrary();
    return (
      html.includes(LIBRARY_HEAD_MARK) &&
      JSON.stringify(infoLinksOf(html)) === STUDENT_ONLY_LINKS &&
      !html.includes('쏙쏙') &&
      !html.includes('팁가이드') &&
      !html.includes('data-library-board="info-room"') &&
      !html.includes('data-library-board="info-tutor"') &&
      (html.match(/data-library-board="/g) || []).length === 1
    );
  });
}
for (const who of ['guest', 'room', 'tutor', 'admin']) {
  await okAsync(`support_entry_two_links_for_${who}`, async () => {
    await signIn(who);
    const html = renderSupportLibrary();
    return JSON.stringify(infoLinksOf(html)) === EXPECTED_LINKS && (html.match(/data-library-board="/g) || []).length === 3;
  });
}
ok('support_library_head_unchanged_by_entry', () => {
  const html = renderSupportLibrary();
  const head = (h) => h.slice(0, h.indexOf(LIBRARY_HEAD_MARK) + LIBRARY_HEAD_MARK.length);
  return html.includes(LIBRARY_HEAD_MARK) && head(html) === head(beforeRoleKnown);
});
await okAsync('support_back_from_info_restores_library', async () => {
  await signIn('room');
  const first = renderSupportLibrary();
  render('/library/room-info', currentViewerOrRoom());
  const back = renderSupportLibrary();
  return first === back && first.includes(LIBRARY_HEAD_MARK) && JSON.stringify(infoLinksOf(back)) === EXPECTED_LINKS;
});
await okAsync('support_entry_logout_becomes_guest_links', async () => {
  await signIn('demand');
  const studentHtml = renderSupportLibrary();
  session.me = null;
  await authSession?.logout?.();
  const guestHtml = renderSupportLibrary();
  return JSON.stringify(infoLinksOf(studentHtml)) === STUDENT_ONLY_LINKS && JSON.stringify(infoLinksOf(guestHtml)) === EXPECTED_LINKS;
});
function currentViewerOrRoom() {
  return infoStore?.currentInfoViewer?.() ?? viewers.room;
}

console.log(`\n${passed} passed / ${failed} failed`);
if (failed) process.exit(1);
console.log('info-boards-client verify ok');
