/**
 * 찜 목록 = 카드 (2026-10-09) · 화면 모듈 수준.
 * 실행: cd preview/home-ui && npx --yes vite-node ../../scripts/verify-wishlist-card-zoom-screen.mjs
 *       (보통은 node scripts/verify-wishlist-card-zoom.mjs 가 부른다)
 * WISHLIST_VERIFY_ROOT 가 있으면 그 폴더(옛 커밋 압축)의 preview 소스를 올린다.
 *
 * 홈·찾기 카드 캐시가 빈 상태에서 찜 API 응답(가짜 fetch)만으로 찜 카드가 그려지고,
 * 카드를 누르면 기존 확대카드(openDetailModal)가 body 에 붙는지 센다. 서버·DB·운영 계정에 접속하지 않는다.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = (process.env.WISHLIST_VERIFY_ROOT || ROOT).replace(/\\/g, '/');
const mod = (rel) => import(`${SRC}/${rel}`);

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

/* ── 작은 가짜 DOM (HTML 문자열 → 요소 트리 · 속성 선택자) ── */
const VOID = new Set(['input', 'br', 'img', 'hr', 'meta', 'link', 'source', 'area', 'col', 'embed', 'wbr']);
const decode = (s) =>
  s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

class FakeElement {
  constructor(tag, attrs = []) {
    this.tagName = String(tag).toUpperCase();
    this.attrs = new Map(attrs);
    this.childNodes = [];
    this.parentNode = null;
    this.listeners = new Map();
    this.style = {};
  }
  get children() {
    return this.childNodes.filter((n) => n instanceof FakeElement);
  }
  getAttribute(n) {
    return this.attrs.has(n) ? this.attrs.get(n) : null;
  }
  setAttribute(n, v) {
    this.attrs.set(n, String(v));
  }
  hasAttribute(n) {
    return this.attrs.has(n);
  }
  removeAttribute(n) {
    this.attrs.delete(n);
  }
  get id() {
    return this.getAttribute('id') || '';
  }
  set id(v) {
    this.setAttribute('id', v);
  }
  get className() {
    return this.getAttribute('class') || '';
  }
  set className(v) {
    this.setAttribute('class', v);
  }
  get dataset() {
    const out = {};
    for (const [k, v] of this.attrs) {
      if (k.startsWith('data-')) out[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
    }
    return out;
  }
  get textContent() {
    return this.childNodes.map((n) => (n instanceof FakeElement ? n.textContent : n.data)).join('');
  }
  set textContent(v) {
    this.childNodes = [{ data: String(v) }];
  }
  get innerHTML() {
    return this._html || '';
  }
  set innerHTML(html) {
    this._html = String(html);
    this.childNodes = [];
    parseInto(this, String(html));
  }
  get classList() {
    const el = this;
    const list = () => (el.getAttribute('class') || '').split(/\s+/).filter(Boolean);
    const save = (arr) => el.setAttribute('class', arr.join(' '));
    return {
      contains: (c) => list().includes(c),
      add: (...cs) => save([...new Set([...list(), ...cs])]),
      remove: (...cs) => save(list().filter((x) => !cs.includes(x))),
      toggle: (c, force) => {
        const on = force === undefined ? !list().includes(c) : Boolean(force);
        save(on ? [...new Set([...list(), c])] : list().filter((x) => x !== c));
        return on;
      },
    };
  }
  appendChild(el) {
    if (el.parentNode) el.parentNode.childNodes = el.parentNode.childNodes.filter((n) => n !== el);
    el.parentNode = this;
    this.childNodes.push(el);
    return el;
  }
  remove() {
    if (this.parentNode) this.parentNode.childNodes = this.parentNode.childNodes.filter((n) => n !== this);
    this.parentNode = null;
  }
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 0, height: 0 };
  }
  focus() {}
  descendants() {
    const out = [];
    const walk = (el) => el.children.forEach((c) => (out.push(c), walk(c)));
    walk(this);
    return out;
  }
  querySelectorAll(sel) {
    const groups = parseSelector(sel);
    return this.descendants().filter((el) => groups.some((g) => matchComplex(el, g)));
  }
  querySelector(sel) {
    return this.querySelectorAll(sel)[0] || null;
  }
  matches(sel) {
    return parseSelector(sel).some((g) => matchComplex(this, g));
  }
  closest(sel) {
    for (let el = this; el instanceof FakeElement; el = el.parentNode) if (el.matches(sel)) return el;
    return null;
  }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  removeEventListener() {}
  /** 버블링 클릭 */
  click() {
    const ev = {
      type: 'click',
      target: this,
      currentTarget: null,
      defaultPrevented: false,
      stopped: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.stopped = true;
      },
    };
    for (let el = this; el instanceof FakeElement && !ev.stopped; el = el.parentNode) {
      ev.currentTarget = el;
      for (const fn of el.listeners.get('click') || []) fn.call(el, ev);
    }
  }
}

function parseInto(root, html) {
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z0-9-]+)\s*>|<([a-zA-Z0-9-]+)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+)/g;
  const attrRe = /([^\s=>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let cur = root;
  let m;
  while ((m = re.exec(html))) {
    if (m[1]) {
      const tag = m[1].toUpperCase();
      for (let el = cur; el && el !== root; el = el.parentNode) {
        if (el.tagName === tag) {
          cur = el.parentNode;
          break;
        }
      }
    } else if (m[2]) {
      const attrs = [];
      let a;
      attrRe.lastIndex = 0;
      while ((a = attrRe.exec(m[3] || ''))) attrs.push([a[1], decode(a[2] ?? a[3] ?? a[4] ?? '')]);
      const el = new FakeElement(m[2], attrs);
      el.parentNode = cur;
      cur.childNodes.push(el);
      if (!m[4] && !VOID.has(m[2].toLowerCase())) cur = el;
    } else if (m[5]) {
      cur.childNodes.push({ data: decode(m[5]) });
    }
  }
}

function splitTop(sel, sepRe) {
  const out = [];
  let depth = 0;
  let quote = '';
  let buf = '';
  for (const ch of sel) {
    if (quote) {
      if (ch === quote) quote = '';
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '[') depth += 1;
    else if (ch === ']') depth -= 1;
    else if (depth === 0 && sepRe.test(ch)) {
      if (buf.trim()) out.push(buf.trim());
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}
function parseCompound(text) {
  const c = { tag: '', ids: [], classes: [], attrs: [], pseudos: [] };
  const re = /^([a-zA-Z0-9-]+|\*)|#([\w-]+)|\.([\w-]+)|\[\s*([\w-]+)\s*(?:([\^$*]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]+)))?\s*\]|:([\w-]+)(?:\([^)]*\))?/g;
  let m;
  while ((m = re.exec(text))) {
    if (m[1]) c.tag = m[1] === '*' ? '' : m[1].toUpperCase();
    else if (m[2]) c.ids.push(m[2]);
    else if (m[3]) c.classes.push(m[3]);
    else if (m[4]) c.attrs.push({ name: m[4], op: m[5] || '', value: m[6] ?? m[7] ?? m[8] ?? '' });
    else if (m[9]) c.pseudos.push(m[9]);
  }
  return c;
}
function parseSelector(sel) {
  return splitTop(sel, /,/).map((g) => splitTop(g, /\s/).filter((p) => p !== '>').map(parseCompound));
}
function matchCompound(el, c) {
  if (c.tag && el.tagName !== c.tag) return false;
  if (c.ids.some((id) => el.id !== id)) return false;
  if (c.classes.some((k) => !el.classList.contains(k))) return false;
  for (const a of c.attrs) {
    const v = el.getAttribute(a.name);
    if (v === null) return false;
    if (a.op === '=' && v !== a.value) return false;
    if (a.op === '^=' && !v.startsWith(a.value)) return false;
    if (a.op === '$=' && !v.endsWith(a.value)) return false;
    if (a.op === '*=' && !v.includes(a.value)) return false;
  }
  return c.pseudos.length === 0;
}
function matchComplex(el, parts) {
  if (!matchCompound(el, parts[parts.length - 1])) return false;
  let i = parts.length - 2;
  for (let anc = el.parentNode; i >= 0 && anc instanceof FakeElement; anc = anc.parentNode) {
    if (matchCompound(anc, parts[i])) i -= 1;
  }
  return i < 0;
}

/* ── 브라우저 전역 ── */
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
  hash: '#/mypage/wishlist',
  href: 'http://127.0.0.1:5174/#/mypage/wishlist',
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
const body = new FakeElement('body');
const htmlEl = new FakeElement('html');
htmlEl.appendChild(body);
globalThis.document = {
  documentElement: Object.assign(htmlEl, { style: { setProperty() {}, getPropertyValue() { return ''; } } }),
  body,
  getElementById: (id) => htmlEl.querySelectorAll(`#${id}`)[0] || null,
  querySelector: (sel) => htmlEl.querySelector(sel),
  querySelectorAll: (sel) => htmlEl.querySelectorAll(sel),
  createElement: (tag) => new FakeElement(tag),
  addEventListener() {},
  removeEventListener() {},
};
globalThis.history = globalThis.history || { pushState() {}, replaceState() {}, state: null };
if (typeof globalThis.dispatchEvent !== 'function') {
  const winEvents = new EventTarget();
  globalThis.dispatchEvent = (event) => winEvents.dispatchEvent(event);
  globalThis.addEventListener = (type, fn, opts) => winEvents.addEventListener(type, fn, opts);
  globalThis.removeEventListener = (type, fn, opts) => winEvents.removeEventListener(type, fn, opts);
}
try {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'verify-wishlist-card-zoom', language: 'ko' },
    configurable: true,
  });
} catch {
  /* vite-node 가 navigator 를 고정한 경우 */
}
if (typeof globalThis.matchMedia !== 'function') {
  globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
}
globalThis.alert = () => {};
globalThis.open = () => null;
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);

/* ── 가짜 API ── */
const session = { role_type: 'guardian_student', email: 'parent@verify.invalid', name: '학부모', user_id: 10 };

const ROOM_CARD = {
  id: 3,
  title: '찜한 공개 공부방',
  region_label: '강남구 대치동',
  summary: '수학\n짧은 소개',
  price_amount: 250000,
  main_subject_note: '수학',
  intro_short: '짧은 소개',
  inquiry_status: 'open',
  profile_status: 'published',
  education_office_registered: true,
  exposure_tier: 'basic',
  position_sku: null,
  recommend_count: 2,
  review_count: 1,
  paid_badges: [],
  image_path: '/uploads/study-rooms/3/basic_720.jpg',
  image_path_basic: '/uploads/study-rooms/3/basic_720.jpg',
  image_path_prime: '',
  latitude: 37.5,
  longitude: 127.06,
  published_at: '2026-01-01 00:00:00',
  created_at: '2026-01-01 00:00:00',
};
const TUTOR_CARD = {
  id: 7,
  title: '찜한 과외쌤',
  region_label: '서울특별시',
  summary: '수학 · 한국대학교 수학과',
  preferred_fee_amount: 400000,
  main_subject_note: '수학',
  university_name: '한국대학교',
  major_name: '수학과',
  profile_status: 'published',
  exposure_tier: 'basic',
  position_sku: null,
  recommend_count: 0,
  review_count: 0,
  paid_badges: [],
  published_at: '2026-01-01 00:00:00',
  created_at: '2026-01-01 00:00:00',
};
const LATE_TUTOR_CARD = { ...TUTOR_CARD, id: 12, title: '나중에 찜한 과외쌤' };

const INITIAL_ROWS = [
  { id: 1, target_type: 'study_room', target_id: 3, created_at: '2026-10-01 10:00:00', card_status: 'visible', card: ROOM_CARD },
  { id: 2, target_type: 'study_room', target_id: 4, created_at: '2026-10-01 09:00:00', card_status: 'unavailable', card: null },
  { id: 3, target_type: 'tutor', target_id: 7, created_at: '2026-10-01 08:00:00', card_status: 'visible', card: TUTOR_CARD },
];
let favoriteRows = [...INITIAL_ROWS];

/** @type {Array<{ url: string, method: string, body: any }>} */
const calls = [];

function responseJson(payload, okStatus = true) {
  const json = JSON.stringify(payload);
  return { ok: okStatus, status: okStatus ? 200 : 401, json: async () => payload, text: async () => json };
}

globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : String(input?.url ?? input ?? '');
  const method = String(init.method || 'GET').toUpperCase();
  let reqBody = null;
  try {
    reqBody = init.body ? JSON.parse(String(init.body)) : null;
  } catch {
    reqBody = init.body ?? null;
  }
  calls.push({ url, method, body: reqBody });
  if (url.includes('/api/auth/me.php') || url.includes('/api/auth/login.php')) {
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
  if (url.includes('/api/handoff/favorites')) {
    if (method === 'GET') return responseJson({ ok: true, items: favoriteRows });
    if (method === 'DELETE') {
      const id = Number(new URL(url, 'http://x').searchParams.get('target_id'));
      favoriteRows = favoriteRows.filter((r) => Number(r.target_id) !== id);
      return responseJson({ ok: true, removed: true });
    }
    if (method === 'POST') return responseJson({ ok: true, in_favorite: true, target_type: reqBody?.target_type, target_id: reqBody?.target_id });
  }
  if (url.includes('/api/search/search.php')) {
    // 홈·찾기 카드 캐시가 빈 조건: 검색은 항상 0건.
    return responseJson({ ok: true, tab: reqBody?.tab, total: 0, rows: [], items: [] });
  }
  return responseJson({ ok: true, items: [], threads: [], posts: [], students: [], rooms: [], tutors: [], cities: [], tutor_units: [] });
};

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms));
async function until(pred, n = 80) {
  for (let i = 0; i < n; i += 1) {
    if (pred()) return true;
    await tick();
  }
  return false;
}

/* ── 실제 모듈 ── */
const { initAuthSession } = await mod('preview/home-ui/src/auth-session.js');
const { isHandoffApiMode } = await mod('preview/home-ui/src/handoff-backend.js');
const { renderMypageScreen, bindMypageScreenEvents } = await mod('preview/home-ui/src/mypage/screens.js');
const { getHomeBasicPool } = await mod('preview/home-ui/src/home-basic-live.js');
const { EXPOSURE_STUDY_ROOMS, EXPOSURE_TUTORS } = await mod('preview/home-ui/src/exposure-data.js');
const { closeDetailModal } = await mod('preview/home-ui/src/detail-decision/detail-shell.js');

let rerenders = 0;
let root = new FakeElement('main');
function render() {
  loc.hash = '#/mypage/wishlist';
  root = new FakeElement('main');
  root.innerHTML = renderMypageScreen('/mypage/wishlist');
  bindMypageScreenEvents(root, () => {
    rerenders += 1;
    render();
  });
  return root;
}
const modal = () => document.getElementById('p24-detail-modal');
const providerCard = (r, kind, id) => r.querySelector(`[data-provider-kind="${kind}"][data-provider-id="${id}"]`);

async function runAs(roleType, label) {
  session.role_type = roleType;
  favoriteRows = [...INITIAL_ROWS];
  const user = await initAuthSession(false);
  await until(() => isHandoffApiMode());
  ok(`[${label}] 로그인 · 찜 API 모드`, !!user && isHandoffApiMode(), user ? user.role_type : 'null');
  ok(`[${label}] 찜 목록 API 를 읽음`, calls.some((c) => c.url.includes('/api/handoff/favorites') && c.method === 'GET'));
  ok(
    `[${label}] 전제: 홈·찾기 카드 캐시가 비어 있음`,
    getHomeBasicPool('study_room').length === 0 && getHomeBasicPool('tutor').length === 0 && EXPOSURE_STUDY_ROOMS.length === 0 && EXPOSURE_TUTORS.length === 0,
  );

  const r = render();
  const room = providerCard(r, 'study_room', 3);
  const tutor = providerCard(r, 'tutor', 7);
  ok(
    `[${label}] 캐시 없이 공부방 찜 카드가 그려짐(이름·지역·사진)`,
    !!room && room.textContent.includes('찜한 공개 공부방') && room.textContent.includes('강남구 대치동')
      && !!room.querySelector('img[src="/uploads/study-rooms/3/basic_720.jpg"]'),
    room ? room.textContent.slice(0, 80) : 'no card',
  );
  ok(
    `[${label}] 캐시 없이 과외쌤 찜 카드가 그려짐`,
    !!tutor && tutor.textContent.includes('찜한 과외쌤') && tutor.textContent.includes('서울특별시'),
  );
  const gone = r.querySelector('[data-wish-unavailable="study_room"][data-id="4"]');
  ok(
    `[${label}] 지금 볼 수 없는 찜은 상태 문구 + 찜 해제 버튼`,
    !!gone && gone.textContent.includes('지금은 볼 수 없는 카드예요')
      && !!r.querySelector('[data-mypage-wish-remove][data-kind="study_room"][data-id="4"]')
      && !providerCard(r, 'study_room', 4),
  );
  ok(
    `[${label}] 찜 목록에서 곧바로 마이샵으로 보내는 링크·버튼 없음`,
    !r.querySelector('[data-p24-action="open-myshop"]') && !r.innerHTML.includes('#/myshop') && !r.innerHTML.includes('/myshop/'),
  );

  closeDetailModal();
  ok(`[${label}] 탭 전에는 확대카드 없음`, !modal());
  const roomBody = room?.querySelector('.expo-hcard__name') || room;
  roomBody?.click();
  await tick();
  const m1 = modal();
  ok(
    `[${label}] 공부방 카드를 탭하면 확대카드(openDetailModal) 렌더`,
    !!m1 && m1.innerHTML.includes('p24-modal') && (m1.querySelector('.p24-modal__title')?.textContent || '') === '찜한 공개 공부방',
    m1 ? m1.querySelector('.p24-modal__title')?.textContent : 'no modal',
  );
  ok(
    `[${label}] 확대카드 안에 기존 마이샵 버튼(공부방 3)`,
    !!m1?.querySelector('[data-p24-action="open-myshop"][data-study-room-id="3"]'),
  );
  closeDetailModal();

  const tutorDetail = tutor?.querySelector('[data-action="search-open-detail"]');
  tutorDetail?.click();
  await tick();
  const m2 = modal();
  ok(
    `[${label}] 과외쌤 카드 「상세」도 같은 확대카드`,
    !!m2 && (m2.querySelector('.p24-modal__title')?.textContent || '') === '찜한 과외쌤',
  );
  closeDetailModal();
}

await runAs('guardian_student', '학생');

const r1 = render();
const removeGone = r1.querySelector('[data-mypage-wish-remove][data-kind="study_room"][data-id="4"]');
removeGone?.click();
await tick(20);
ok(
  '볼 수 없는 카드도 찜 해제됨(DELETE target_id=4 · 목록에서 빠짐)',
  calls.some((c) => c.method === 'DELETE' && c.url.includes('/api/handoff/favorites') && c.url.includes('target_id=4'))
    && !root.querySelector('[data-wish-unavailable="study_room"][data-id="4"]'),
);

// 화면에서 막 찜해서 카드 정보가 아직 없으면 찜 목록을 한 번 다시 읽어 카드로 바꾼다.
const { toggleWishlist } = await mod('preview/home-ui/src/user-actions-state.js');
favoriteRows = [
  ...favoriteRows,
  { id: 9, target_type: 'tutor', target_id: 12, created_at: '2026-10-02 10:00:00', card_status: 'visible', card: LATE_TUTOR_CARD },
];
toggleWishlist('tutor', 12);
await tick(20);
const before = rerenders;
render();
const refreshed = await until(() => rerenders > before && !!providerCard(root, 'tutor', 12));
ok(
  '카드 정보 없는 찜은 찜 목록을 다시 읽어 카드로 그림',
  refreshed && providerCard(root, 'tutor', 12).textContent.includes('나중에 찜한 과외쌤'),
);

// 서버가 계속 카드 정보를 못 주면: 한 번 들어온 동안은 한 번만, 다른 화면에 갔다 다시 오면 다시 읽는다.
const { refreshFavorites } = await mod('preview/home-ui/src/handoff-backend.js');
favoriteRows = [
  ...favoriteRows,
  { id: 10, target_type: 'tutor', target_id: 13, created_at: '2026-10-03 10:00:00', card_status: 'unknown', card: null },
];
if (typeof refreshFavorites === 'function') await refreshFavorites();
const favGets = () => calls.filter((c) => c.method === 'GET' && c.url.includes('/api/handoff/favorites')).length;
const g0 = favGets();
render();
await until(() => favGets() > g0);
await tick(20);
const g1 = favGets();
render();
await tick(20);
const g2 = favGets();
globalThis.dispatchEvent(new Event('hashchange'));
render();
await until(() => favGets() > g2);
const g3 = favGets();
ok('카드 정보 없는 찜: 같은 방문에서는 한 번만 다시 읽음', g1 === g0 + 1 && g2 === g1, `${g0}→${g1}→${g2}`);
ok('카드 정보 없는 찜: 다른 화면에 갔다 다시 오면 다시 읽음', g3 === g2 + 1, `${g2}→${g3}`);

await runAs('study_room_owner', '공부방');

console.log(`\nscreen ${passed} PASS / ${failed} FAIL`);
process.exit(failed ? 1 : 0);
