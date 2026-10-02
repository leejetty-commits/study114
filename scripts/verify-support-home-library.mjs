/**
 * 사이트오류-6A · 고객센터 홈 박스 순서 + 자료실 입구 검사
 * 실행: cd preview/home-ui && npx --yes vite-node ../../scripts/verify-support-home-library.mjs
 *
 * (a) 홈 본문 박스 순서 == 좌측메뉴(SUPPORT_NAV) 순서. 공지 화면에 붙는 박스도 같다
 * (b) 순서는 SUPPORT_NAV 한 곳에서만 정한다(박스 표는 id 별 제목·설명·아이콘만, 화면 파일에 박스 배열 없음)
 * (c) 운영문의 로그인 필요 규칙 유지
 * (d) 자료실 입구(#/support/library · 하위 주소 · #/library)에 샘플 탭·샘플 카드·다운로드 미구현 문구 없음
 * (e) 역할별 게시판 카드: 공부방·과외쌤·관리자·게스트 공급자 2개 + 학생 꿀팁 가이드, 학생·member 학생 꿀팁 가이드 1개(사이트오류-6B), 역할 확인 전 0개
 * (f) 샘플 코드(LIBRARY_SEED·샘플 스토어·다운로드 안내)를 쓰는 화면 코드가 없다
 * (g) 모바일·키보드: 카드 칸이 좁은 화면에서 한 줄로 내려가고, 입구는 링크(포커스 가능)·aria 라벨이 있다
 * DB·서버에 접속하지 않는다. /api/auth/me.php 만 흉내 낸다.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
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
Object.defineProperty(globalThis, 'location', {
  value: {
    hash: '#/support',
    href: 'http://127.0.0.1:5174/#/support',
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

/** /api/auth/me.php 흉내. null 이면 비로그인. */
const session = { me: null };
function json(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}
globalThis.fetch = async (input) => {
  const url = new URL(String(input), 'http://127.0.0.1:5174');
  if (url.pathname.endsWith('/api/auth/me.php')) {
    return json(200, session.me ? { ok: true, authenticated: true, email_verified: true, ...session.me } : { ok: true, authenticated: false });
  }
  if (url.pathname.endsWith('/api/auth/logout.php')) return json(200, { ok: true });
  return json(404, { ok: false, message: 'not found' });
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

const nav = await load(() => import('../preview/home-ui/src/support/nav.js'), 'support-nav');
const supportCopy = await load(() => import('../preview/home-ui/src/support/support-copy.js'), 'support-copy');
const supportScreens = await load(() => import('../preview/home-ui/src/support/screens.js'), 'support-screens');
const libraryCopy = await load(() => import('../preview/home-ui/src/library/library-copy.js'), 'library-copy');
const libraryScreens = await load(() => import('../preview/home-ui/src/library/library-screens.js'), 'library-screens');
const infoScreens = await load(() => import('../preview/home-ui/src/library/info-board-screens.js'), 'info-board-screens');
const authSession = await load(() => import('../preview/home-ui/src/auth-session.js'), 'auth-session');

const SUPPORT_NAV = nav?.SUPPORT_NAV || [];
const EXPECTED_ORDER = ['공지사항', '자주 묻는 질문', '약관·정책', '자료실', '운영문의'];
const NAMES = { 'info-room': '공부방 쏙쏙정보', 'info-tutor': '과외쌤 따끈 팁가이드' };
const EMPTY_COPY = '학생 꿀팁 가이드가 곧 문을 열어요. 조금만 기다려 주세요';
const INFO_BOARDS = libraryCopy?.INFO_BOARDS || [];

/** 자료실 샘플 목록·다운로드 미구현 흔적 */
const SAMPLE_MARKERS = [
  '전체 자료',
  '양식·체크리스트',
  '가이드 PDF',
  '안전과외 체크리스트',
  '공부방 상담 수용 안내 템플릿',
  '과외 첫 수업 안내 양식',
  '학습 요청 조건 정리표',
  '선지급 주의',
  '발급기관 재확인',
  '실제 파일 없음',
  '파일 다운로드 미구현',
  '다운로드 · 준비 중',
  '파일 다운로드는 준비 중',
  'file_label',
  'pdf-card',
  'lib-card',
  'lib-policy-chips',
  'data-lib-id',
  'class="tab-pills"',
];

function renderSupport(path) {
  globalThis.location.hash = `#${path}`;
  const html = supportScreens?.renderSupportScreen?.(path) ?? '';
  globalThis.location.hash = '#/support';
  return html;
}

/** 홈 박스: [주소, 제목] (그려진 순서) */
function quickTilesOf(html) {
  const grid = (html.match(/<div class="quick-grid">([\s\S]*?)<\/div>\s*<p class="sup-home-hint"/) || ['', ''])[1];
  return [...grid.matchAll(/<a\b([^>]*class="quick-tile[^"]*"[^>]*)>([\s\S]*?)<\/a>/g)].map((m) => {
    const href = (m[1].match(/href="#([^"]+)"/) || ['', ''])[1];
    const title = ((m[2].match(/<h3>([\s\S]*?)<\/h3>/) || ['', ''])[1] || '').trim();
    return [href, title];
  });
}

/** 자료실 게시판 카드: [boardKey, 들어가기 주소, 카드 html] */
function boardCardsOf(html) {
  return html
    .split(/<li\b[^>]*data-library-board="/)
    .slice(1)
    .map((part) => [part.slice(0, part.indexOf('"')), (part.match(/<a\b[^>]*href="#([^"]+)"/) || ['', ''])[1], part]);
}
function boardCardCount(html) {
  return (html.match(/data-library-board="/g) || []).length;
}
function chipsOf(cardHtml) {
  return [...cardHtml.matchAll(/<li class="lib-chip">([\s\S]*?)<\/li>/g)].map((m) => m[1].trim());
}
function sampleHits(html) {
  return SAMPLE_MARKERS.filter((m) => html.includes(m));
}

// ── (a) 홈 박스 순서 ──
ok('nav_order_is_policy_order', () => JSON.stringify(SUPPORT_NAV.map((n) => n.label)) === JSON.stringify(EXPECTED_ORDER));
const homeHtml = renderSupport('/support');
ok('home_box_count_equals_nav', () => quickTilesOf(homeHtml).length === SUPPORT_NAV.length && SUPPORT_NAV.length === 5);
ok('home_box_order_equals_nav_paths', () =>
  JSON.stringify(quickTilesOf(homeHtml).map(([h]) => h)) === JSON.stringify(SUPPORT_NAV.map((n) => n.path)),
);
ok('home_box_titles_equal_nav_labels', () =>
  JSON.stringify(quickTilesOf(homeHtml).map(([, t]) => t)) === JSON.stringify(SUPPORT_NAV.map((n) => n.label)),
);
ok('home_box_titles_policy_order', () => JSON.stringify(quickTilesOf(homeHtml).map(([, t]) => t)) === JSON.stringify(EXPECTED_ORDER));
ok('notice_page_boxes_same_order', () => {
  const html = renderSupport('/support/notice');
  return JSON.stringify(quickTilesOf(html)) === JSON.stringify(quickTilesOf(homeHtml)) && quickTilesOf(html).length === 5;
});
ok('home_boxes_are_links_with_nav', () =>
  (homeHtml.match(/<a\b[^>]*class="quick-tile[^"]*"[^>]*>/g) || []).every((tag) => /href="#\/support\//.test(tag) && /data-sup-nav="\/support\//.test(tag)),
);
ok('home_library_box_not_sample_copy', () => !homeHtml.includes('안내 자료·양식'));

// ── (b) 순서는 한 곳 ──
const CARDS = supportCopy?.SUPPORT_HOME_CARDS;
const screensSrc = src('preview/home-ui/src/support/screens.js');
const quickFnSrc = (screensSrc.match(/function renderSupportQuickCards\([\s\S]*?\r?\n}\r?\n/) || [''])[0];
ok('cards_table_keyed_by_nav_ids', () => {
  if (!CARDS || Array.isArray(CARDS) || typeof CARDS !== 'object') return false;
  const ids = SUPPORT_NAV.map((n) => n.id).sort();
  return JSON.stringify(Object.keys(CARDS).sort()) === JSON.stringify(ids);
});
ok('cards_table_has_no_order_or_path', () =>
  CARDS &&
  Object.values(CARDS).every(
    (c) => c.title && c.desc && c.icon && !('href' in c) && !('path' in c) && !('order' in c) && !('sort' in c) && !('index' in c),
  ),
);
ok('cards_table_titles_match_nav_labels', () => CARDS && SUPPORT_NAV.every((n) => CARDS[n.id]?.title === n.label));
ok('quick_cards_iterate_support_nav', () => quickFnSrc !== '' && /SUPPORT_NAV\s*\.\s*(map|filter|flatMap|reduce)\(/.test(quickFnSrc));
ok('quick_cards_have_no_literal_card_array', () =>
  quickFnSrc !== '' && !/href:\s*['"]\/support/.test(quickFnSrc) && !/title:\s*['"]/.test(quickFnSrc) && !/motif-[a-z]+\.svg/.test(quickFnSrc),
);
ok('screens_import_support_nav', () => /import\s*\{[^}]*\bSUPPORT_NAV\b[^}]*\}\s*from\s*'\.\/nav\.js'/.test(screensSrc));

// ── (c) 운영문의 로그인 규칙 ──
ok('contact_requires_login_in_nav', () => SUPPORT_NAV.find((n) => n.id === 'contact')?.requiresLogin === true);
ok('contact_guest_sees_login_gate', () => renderSupport('/support/contact').includes('login-wall'));
ok('contact_box_links_contact', () => quickTilesOf(homeHtml).some(([h, t]) => h === '/support/contact' && t === '운영문의'));

// ── (d) 자료실 입구에 샘플 없음 (역할 확인 전) ──
const LIB_PATHS = ['/support/library', '/support/library/templates', '/support/library/guides'];
const beforeRole = renderSupport('/support/library');
for (const p of LIB_PATHS) {
  ok(`no_sample_${p.replaceAll('/', '_').slice(1)}`, () => {
    const html = renderSupport(p);
    const hits = sampleHits(html);
    if (hits.length) throw new Error(`샘플 흔적: ${hits.join(', ')}`);
    return html.includes('<h2>자료실</h2>');
  });
}
ok('library_entry_lead_from_constant', () => {
  const lead = libraryCopy?.LIBRARY_ENTRY_COPY?.lead;
  return Boolean(lead) && beforeRole.includes(lead) && !/다운로드|샘플|양식/.test(lead);
});
ok('library_route_screen_no_sample', () => {
  globalThis.location.hash = '#/library';
  const html = libraryScreens?.renderLibraryScreen?.('/library') ?? '';
  globalThis.location.hash = '#/support';
  const hits = sampleHits(html);
  if (hits.length) throw new Error(`샘플 흔적: ${hits.join(', ')}`);
  return html !== '';
});
ok('library_shell_nav_no_sample_sections', () => {
  const shell = src('preview/home-ui/src/library/library-shell.js');
  return shell !== '' && !shell.includes('LIBRARY_SECTIONS') && !shell.includes('LIBRARY_HEAD');
});
ok('entry_hidden_before_role_known', () =>
  boardCardCount(beforeRole) === 0 && !beforeRole.includes(NAMES['info-room']) && !beforeRole.includes(NAMES['info-tutor']) && !beforeRole.includes(EMPTY_COPY),
);

// ── (e) 역할별 카드 ──
const ME = {
  demand: { user_id: 31, role_type: 'guardian_student', name: 's', email: 's@x' },
  member: { user_id: 41, role_type: '', name: 'm', email: 'm@x' },
  room: { user_id: 11, role_type: 'study_room_owner', name: 'r', email: 'r@x' },
  tutor: { user_id: 21, role_type: 'tutor', name: 't', email: 't@x' },
  admin: { user_id: 1, role_type: 'admin', admin_level: 'super', name: 'a', email: 'a@x' },
};
async function signIn(who) {
  session.me = who === 'guest' ? null : ME[who];
  await authSession?.initAuthSession?.();
  await infoScreens?.primeInfoBoardEntry?.();
}
function renderLibraryRoute() {
  globalThis.location.hash = '#/library';
  const html = libraryScreens?.renderLibraryScreen?.('/library') ?? '';
  globalThis.location.hash = '#/support';
  return html;
}
// 사이트오류-6B: 학생 꿀팁 가이드 카드가 모든 역할에 붙는다. 공급자 카드 2개 기대값은 그대로 두고 마지막 카드만 더 본다.
const STUDENT_TIPS = libraryCopy?.STUDENT_TIPS_BOARD || null;
const STUDENT_TIPS_CHIPS = ['공부 노하우', '시험·내신', '입시·진로', '습관·마음관리', '과외쌤·공부방 고르기', '선배 이야기'];
function studentTipsCardOk([key, href, card]) {
  return (
    key === 'info-student' &&
    STUDENT_TIPS !== null &&
    href === '/library/student-tips' &&
    card.includes('학생 꿀팁 가이드') &&
    card.includes(STUDENT_TIPS.lead) &&
    JSON.stringify(chipsOf(card)) === JSON.stringify(STUDENT_TIPS_CHIPS) &&
    /<a\b[^>]*aria-label="[^"]*학생 꿀팁 가이드[^"]*"/.test(card)
  );
}
function twoCardsOk(html) {
  const cards = boardCardsOf(html);
  if (boardCardCount(html) !== 3 || cards.length !== 3) return false;
  if (JSON.stringify(cards.map(([k]) => k)) !== JSON.stringify(['info-room', 'info-tutor', 'info-student'])) return false;
  return cards.slice(0, 2).every(([key, href, card]) => {
    const board = INFO_BOARDS.find((b) => b.boardKey === key);
    return (
      board &&
      href === board.path &&
      card.includes(NAMES[key]) &&
      card.includes(board.lead) &&
      JSON.stringify(chipsOf(card)) === JSON.stringify(board.categories.map((c) => c.label)) &&
      chipsOf(card).length === 4 &&
      new RegExp(`<a\\b[^>]*aria-label="[^"]*${NAMES[key]}[^"]*"`).test(card)
    );
  }) && studentTipsCardOk(cards[2]) && !html.includes(EMPTY_COPY);
}
/** 학생·member: 공급자 카드 0개 · 학생 꿀팁 가이드 카드 하나 · 「곧 문을 열어요」 문구 없음 */
function emptyOk(html) {
  const cards = boardCardsOf(html);
  return (
    boardCardCount(html) === 1 &&
    cards.length === 1 &&
    studentTipsCardOk(cards[0]) &&
    !html.includes(NAMES['info-room']) &&
    !html.includes(NAMES['info-tutor']) &&
    !html.includes('#/library/room-info') &&
    !html.includes('#/library/tutor-tips') &&
    !html.includes(EMPTY_COPY)
  );
}
for (const who of ['guest', 'room', 'tutor', 'admin']) {
  await okAsync(`cards_two_for_${who}`, async () => {
    await signIn(who);
    return twoCardsOk(renderSupport('/support/library'));
  });
  ok(`cards_two_for_${who}_on_library_route`, () => twoCardsOk(renderLibraryRoute()));
}
for (const who of ['demand', 'member']) {
  await okAsync(`cards_zero_and_empty_copy_for_${who}`, async () => {
    await signIn(who);
    const html = renderSupport('/support/library');
    return emptyOk(html) && html.includes('<h2>자료실</h2>');
  });
  ok(`cards_zero_and_empty_copy_for_${who}_on_library_route`, () => emptyOk(renderLibraryRoute()));
}
await okAsync('logout_student_to_guest_shows_cards', async () => {
  await signIn('demand');
  const studentHtml = renderSupport('/support/library');
  session.me = null;
  await authSession?.logout?.();
  return emptyOk(studentHtml) && twoCardsOk(renderSupport('/support/library'));
});
// 사이트오류-6B: 학생 꿀팁 가이드가 문을 열어 「곧 문을 열어요」 문구(studentSoon)는 지운다.
ok('empty_copy_is_constant', () => Boolean(libraryCopy?.LIBRARY_ENTRY_COPY) && !('studentSoon' in libraryCopy.LIBRARY_ENTRY_COPY));
ok('empty_copy_not_literal_in_screens', () =>
  ['preview/home-ui/src/support/screens.js', 'preview/home-ui/src/library/library-screens.js', 'preview/home-ui/src/library/info-board-screens.js'].every(
    (f) => !src(f).includes(EMPTY_COPY),
  ),
);
ok('entry_cards_single_helper', () => {
  const info = src('preview/home-ui/src/library/info-board-screens.js');
  const lib = src('preview/home-ui/src/library/library-screens.js');
  return (
    /export function renderLibraryBoardCards\(/.test(info) &&
    /renderLibraryBoardCards\(/.test(screensSrc) &&
    /renderLibraryBoardCards\(/.test(lib) &&
    !/renderInfoBoardEntryLinks/.test(info + screensSrc + lib)
  );
});
ok('entry_cards_reuse_acl_and_board_defs', () => {
  const info = src('preview/home-ui/src/library/info-board-screens.js');
  const fn = (info.match(/export function renderLibraryBoardCards\([\s\S]*?\r?\n}\r?\n/) || [''])[0];
  return fn !== '' && info.includes('canDiscoverBoard(') && /visibleInfoBoards\(/.test(fn);
});

// ── (f) 샘플 코드 참조 없음 ──
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}
const appFiles = walk(join(root, 'preview/home-ui/src'));
const SAMPLE_SYMBOLS = ['LIBRARY_SEED', 'LIBRARY_SECTIONS', 'LIBRARY_HEAD', 'LIBRARY_EMPTY', 'listLibraryItems', 'renderLibraryCard', 'libraryDownloadControlHtml', 'getLibraryBoardMeta', 'renderBoardPolicyChips', 'canDownloadFromBoard', 'getLibraryItem'];
ok('no_sample_symbols_in_app_src', () => {
  const hits = [];
  for (const f of appFiles) {
    const text = readFileSync(f, 'utf8');
    for (const s of SAMPLE_SYMBOLS) {
      if (new RegExp(`\\b${s}\\b`).test(text) && !(s === 'LIBRARY_SECTIONS' && /router\.js$/.test(f) && /const LIBRARY_SECTIONS = \[/.test(text))) {
        hits.push(`${relative(root, f)}:${s}`);
      }
    }
  }
  if (hits.length) throw new Error(hits.join(', '));
  return true;
});
ok('library_store_sample_file_gone', () => !existsSync(join(root, 'preview/home-ui/src/library/library-store.js')));
ok('library_copy_no_sample_exports', () => {
  const c = libraryCopy || {};
  return !('LIBRARY_SEED' in c) && !('LIBRARY_SECTIONS' in c) && !('LIBRARY_HEAD' in c) && !('LIBRARY_EMPTY' in c) && 'INFO_BOARDS' in c;
});
ok('no_browser_storage_in_entry', () => {
  const info = src('preview/home-ui/src/library/info-board-screens.js');
  const fn = (info.match(/export function renderLibraryBoardCards\([\s\S]*?\r?\n}\r?\n/) || [''])[0];
  return fn !== '' && !/localStorage|sessionStorage|indexedDB/.test(fn + src('preview/home-ui/src/library/library-screens.js'));
});

// ── (g) 모바일 · 키보드 ──
const css = src('preview/home-ui/src/styles/home-support-guide.css');
const infoCss = src('preview/home-ui/src/styles/info-pages.css');
ok('css_board_grid_mobile_safe', () => /\.lib-board-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(min\(100%/.test(css));
ok('css_board_card_wraps_text', () => /\.lib-board-card[^{]*\{[^}]*(overflow-wrap|word-break)/.test(css) && /\.lib-board-card__chips\s*\{[^}]*flex-wrap:\s*wrap/.test(css));
ok('css_quick_grid_mobile_rules', () => /@media \(max-width: 480px\)\s*\{[\s\S]*?\.quick-grid[\s\S]*?grid-template-columns:\s*1fr/.test(infoCss));
await okAsync('entry_links_focusable_and_labelled', async () => {
  await signIn('room');
  const html = renderSupport('/support/library');
  const list = html.match(/<ul\b[^>]*class="lib-board-grid"[^>]*>/)?.[0] || '';
  const enters = html.match(/<a\b[^>]*class="[^"]*lib-board-card__go[^"]*"[^>]*>/g) || [];
  return (
    /aria-label="[^"]+"/.test(list) &&
    enters.length === 3 &&
    enters.every((a) => /href="#\/library\//.test(a) && /aria-label="[^"]+"/.test(a) && !/tabindex="-1"/.test(a))
  );
});

console.log(`\n${passed} passed / ${failed} failed`);
if (failed) process.exit(1);
console.log('support-home-library verify ok');
