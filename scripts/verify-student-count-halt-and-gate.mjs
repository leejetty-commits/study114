/**
 * 무결성-10 · 학생 수 0/2+ 안내 화면 + 로그인 사용자 빈카드 클릭 통과
 * 실행: cd preview/home-ui && npx --yes vite-node ../../scripts/verify-student-count-halt-and-gate.mjs
 *
 * (a) 로그인 상태에서 빈카드 클릭 → 로그인 창 없음, preventDefault/stopPropagation 없음
 * (b) 비로그인 → 로그인 창 열림 (같은 바인딩, 클릭 시점 판정)
 * (c) 학생 0명 → 기본정보 입력 링크, 2명 → 운영문의 링크
 *
 * DB·서버에 접속하지 않는다. /api/auth/me.php 응답만 흉내 내고 나머지 API 는 실패로 돌려준다.
 */

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
const loc = {
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
};
Object.defineProperty(globalThis, 'location', { value: loc, writable: true, configurable: true });

function matchOne(el, sel) {
  const m = sel.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/);
  if (!m) return false;
  const v = el.getAttribute(m[1]);
  return m[2] === undefined ? v !== null : v === m[2];
}

class FakeElement {
  constructor(tag = 'div', attrs = {}) {
    this.tagName = tag.toUpperCase();
    this.attrs = { ...attrs };
    this.parent = null;
    this.children = [];
    this.listeners = {};
    this.className = '';
    this.innerHTML = '';
    this.dataset = {};
  }
  get id() {
    return this.attrs.id ?? '';
  }
  set id(v) {
    this.attrs.id = String(v);
  }
  getAttribute(k) {
    return k in this.attrs ? this.attrs[k] : null;
  }
  setAttribute(k, v) {
    this.attrs[k] = String(v);
  }
  addEventListener(type, fn) {
    (this.listeners[type] ||= []).push(fn);
  }
  removeEventListener() {}
  appendChild(c) {
    c.parent = this;
    this.children.push(c);
    return c;
  }
  remove() {
    if (!this.parent) return;
    this.parent.children = this.parent.children.filter((x) => x !== this);
    this.parent = null;
  }
  contains(n) {
    for (let x = n; x; x = x.parent) if (x === this) return true;
    return false;
  }
  matches(sel) {
    return sel.split(',').some((s) => matchOne(this, s.trim()));
  }
  closest(sel) {
    for (let x = this; x; x = x.parent) if (x.matches(sel)) return x;
    return null;
  }
  querySelector() {
    return null;
  }
  querySelectorAll() {
    return [];
  }
}
globalThis.Element = FakeElement;
const body = new FakeElement('body');
globalThis.document = {
  body,
  createElement: (tag) => new FakeElement(tag),
  getElementById: (id) => body.children.find((c) => c.id === id) || null,
  addEventListener() {},
  removeEventListener() {},
  querySelector: () => null,
  querySelectorAll: () => [],
};

/** @type {null | { authenticated: boolean, role_type?: string }} */
let meResponse = null;
globalThis.fetch = async (url) => {
  const u = String(url);
  if (u.includes('/api/auth/me.php') && meResponse) {
    return new Response(JSON.stringify({ ok: true, ...meResponse }), { status: 200 });
  }
  if (u.includes('/api/auth/logout.php')) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
  return new Response(JSON.stringify({ ok: false, authenticated: false }), { status: 401 });
};
const quiet = console.warn;
console.warn = () => {};

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

const { bindGuestEmptyCardLoginGate } = await import('../preview/shared/guest-gate-ui.js');
const { initAuthSession, isLoggedIn, logout } = await import('../preview/home-ui/src/auth-session.js');
const { initChromeSession, chromeLogout } = await import('../preview/shared/chrome-session.js');
const { renderStudentCountHalt } = await import('../preview/home-ui/src/student-reg/screens.js');
const { getStudents, updateStudent, addStudent } = await import('../preview/home-ui/src/student-reg/store.js');
const { STUDENT_COUNT_HALT_COPY } = await import('../preview/home-ui/src/student-reg/student-reg-copy.js');
const { AUTH_UI_BASE } = await import('../preview/shared/preview-links.js');

const GATE_ID = 'guest-deep-access-gate';
const authBase = String(AUTH_UI_BASE).replace(/\/$/, '');

// ── (c) 학생 수 안내 화면 ──
console.log('\n=== (c) 학생 수 안내 화면 ===');
addStudent({ student_name: '검증학생1', exposure_status: 'published' });
addStudent({ student_name: '검증학생2', exposure_status: 'draft' });
addStudent({ student_name: '검증학생3', exposure_status: 'hidden' });
const seedActive = getStudents();
assert(seedActive.length >= 2, `검증용 활성 학생 ${seedActive.length}명(2명 이상 시나리오 준비)`);
for (const s of seedActive.slice(2)) await updateStudent(s.id, { exposure_status: 'deleted' });
assert(getStudents().length === 2, '활성 학생 2명으로 맞춤');
const many = renderStudentCountHalt();
assert(many.includes('data-student-count-halt="many"'), '2명: many 화면');
assert(many.includes('href="#/support/contact"'), '2명: 운영문의 링크 href="#/support/contact"');
assert(many.includes('data-p19-nav="/support/contact"'), '2명: data-p19-nav="/support/contact"');
assert(many.includes(STUDENT_COUNT_HALT_COPY.many.title(2)), '2명: 학생 수 안내 문구');
assert(many.includes(`>${STUDENT_COUNT_HALT_COPY.many.cta}</a>`), '2명: 「운영문의」 버튼');
assert(!many.includes('/students/'), '2명: 특정 학생 화면으로 보내는 링크 없음(임의로 고르지 않음)');

for (const s of getStudents()) await updateStudent(s.id, { exposure_status: 'deleted' });
assert(getStudents().length === 0, '활성 학생 0명으로 맞춤');
const zeroGuest = renderStudentCountHalt();
assert(zeroGuest.includes('data-student-count-halt="zero"'), '0명: zero 화면');
assert(zeroGuest.includes(`href="${authBase}/#/signup/basic"`), `0명(세션 없음): ${authBase}/#/signup/basic`);
assert(zeroGuest.includes(`>${STUDENT_COUNT_HALT_COPY.zero.cta}</a>`), '0명: 「기본정보 입력」 버튼');

for (const html of [many, zeroGuest]) {
  assert(!/열지 않았습니다|내 등록을/.test(html), '시스템식 문구 없음');
  assert(!/공개|보드/.test(html), '「공개」「보드」 표현 없음');
}

// ── (b) 비로그인 → 로그인 창 ──
console.log('\n=== (b) 비로그인 빈카드 클릭 ===');
const root = new FakeElement('section');
const card = root.appendChild(new FakeElement('article', { 'data-basic-empty': '' }));
const inner = card.appendChild(new FakeElement('span'));
const sample = root.appendChild(new FakeElement('article', { 'data-expo-sample': '' }));
bindGuestEmptyCardLoginGate(root);
bindGuestEmptyCardLoginGate(root);
assert(root.listeners.click?.length === 1, '바인딩은 한 번만(클릭 시점 판정 검증용으로 같은 핸들러 재사용)');

function click(target) {
  document.getElementById(GATE_ID)?.remove();
  const e = {
    target,
    defaultPrevented: false,
    stopped: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {
      this.stopped = true;
    },
  };
  for (const fn of root.listeners.click || []) fn(e);
  return { e, opened: Boolean(document.getElementById(GATE_ID)) };
}

let r = click(inner);
assert(!isLoggedIn() && r.opened, '비로그인 · 빈카드 → 로그인 창 열림');
assert(r.e.defaultPrevented && r.e.stopped, '비로그인 · preventDefault/stopPropagation 실행');
r = click(sample);
assert(r.opened, '비로그인 · 샘플카드 → 로그인 창 열림');

// ── (a) 로그인(home·search: auth-session) → 통과 ──
console.log('\n=== (a) 로그인 빈카드 클릭 (auth-session) ===');
meResponse = { authenticated: true, user_id: 11, email: 'p@example.test', role_type: 'guardian_student', name: '학부모', email_verified: true };
await initAuthSession(false);
assert(isLoggedIn(), 'initAuthSession 후 isLoggedIn() = true');
r = click(inner);
assert(!r.opened, '로그인 · 빈카드 → 로그인 창 없음');
assert(!r.e.defaultPrevented && !r.e.stopped, '로그인 · preventDefault/stopPropagation 없음');
r = click(sample);
assert(!r.opened && !r.e.defaultPrevented, '로그인 · 샘플카드 → 통과');

const zeroParent = renderStudentCountHalt();
assert(
  zeroParent.includes(`href="${authBase}/#/signup/basic?role=student"`),
  `0명(학부모 세션): ${authBase}/#/signup/basic?role=student`,
);

await logout();
meResponse = null;
r = click(inner);
assert(!isLoggedIn() && r.opened, 'logout 후 같은 바인딩 → 다시 로그인 창(클릭 시점 판정)');

// ── (a') 로그인(공부방·과외·인증 UI: chrome-session) → 통과 ──
console.log('\n=== (a\') 로그인 빈카드 클릭 (chrome-session) ===');
meResponse = { authenticated: true, user_id: 12, email: 't@example.test', role_type: 'tutor', name: '쌤', email_verified: true };
await initChromeSession();
r = click(inner);
assert(!r.opened && !r.e.defaultPrevented, 'initChromeSession 로그인 · 빈카드 → 통과');
await chromeLogout();
r = click(inner);
assert(r.opened, 'chromeLogout 후 → 다시 로그인 창');

console.warn = quiet;
console.log(`\n통과 ${passed} / 실패 ${failed}`);
if (failed) process.exit(1);
