/**
 * 학생 기본정보(가입) 희망 유형 「공부방 찾기」 제출 게이트 (2026-10-09)
 * 실행(저장소 루트): node scripts/verify-student-hope-hidden-required.mjs
 *         옛 커밋 확인: node scripts/verify-student-hope-hidden-required.mjs --ref b5ffeb5
 *
 * 숨은 과외 희망지역 칸의 select required 가 브라우저 제약검사에 남으면 「다음」을 눌러도 submit 이 안 난다.
 * 실제 signup-basic.js(renderStudentBasic · bindSignupBasicEvents)를 작은 가짜 DOM 에 올리고,
 * 브라우저 제출 규칙(disabled·readonly·hidden input 제외, required 빈 값이면 submit 없음)을 흉내 내 확인한다.
 * 운영 서버·계정에 접속하지 않는다. 샘플 회원 데이터를 만들지 않는다(지역 단위 2행만 화면 목록으로 쓴다).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const SCREEN = 'preview/auth-ui/src/screens/signup-basic.js';

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

/* ── 가짜 DOM ── */
const VOID = new Set(['input', 'br', 'img', 'hr', 'meta', 'link', 'source', 'area', 'col', 'embed', 'wbr']);
const decode = (s) =>
  s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

class FakeElement {
  constructor(tag, attrs = []) {
    this.tagName = tag.toUpperCase();
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
  toggleAttribute(n, force) {
    const on = force === undefined ? !this.attrs.has(n) : Boolean(force);
    if (on && !this.attrs.has(n)) this.attrs.set(n, '');
    if (!on) this.attrs.delete(n);
    return on;
  }
  get id() {
    return this.getAttribute('id') || '';
  }
  get name() {
    return this.getAttribute('name') || '';
  }
  get type() {
    const t = (this.getAttribute('type') || '').toLowerCase();
    if (this.tagName === 'INPUT') return t || 'text';
    if (this.tagName === 'BUTTON') return t || 'submit';
    if (this.tagName === 'SELECT') return 'select-one';
    return t;
  }
  get textContent() {
    return this.childNodes.map((n) => (n instanceof FakeElement ? n.textContent : n.data)).join('');
  }
  set textContent(v) {
    this.childNodes = [{ data: String(v) }];
  }
  set innerHTML(html) {
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
  dispatchEvent(ev) {
    ev.target = ev.target || this;
    const results = [];
    for (let el = this; el instanceof FakeElement; el = ev.bubbles ? el.parentNode : null) {
      for (const fn of el.listeners.get(ev.type) || []) results.push(fn.call(el, ev));
    }
    return results;
  }
}
const boolProp = (prop, attr = prop) =>
  Object.defineProperty(FakeElement.prototype, prop, {
    get() {
      return this.hasAttribute(attr);
    },
    set(v) {
      this.toggleAttribute(attr, Boolean(v));
    },
  });
boolProp('hidden');
boolProp('disabled');
boolProp('required');
boolProp('readOnly', 'readonly');

class HTMLElementShim extends FakeElement {}
class HTMLFormElementShim extends HTMLElementShim {}
class HTMLButtonElementShim extends HTMLElementShim {}
class HTMLTextAreaElementShim extends HTMLElementShim {
  get value() {
    return this._value ?? this.textContent;
  }
  set value(v) {
    this._value = String(v);
  }
}
class HTMLOptionElementShim extends HTMLElementShim {
  get value() {
    return this.getAttribute('value') ?? this.textContent;
  }
}
class HTMLInputElementShim extends HTMLElementShim {
  get value() {
    return this._value ?? this.getAttribute('value') ?? (this.type === 'radio' || this.type === 'checkbox' ? 'on' : '');
  }
  set value(v) {
    this._value = String(v);
  }
  get checked() {
    return this._checked ?? this.hasAttribute('checked');
  }
  set checked(v) {
    this._checked = Boolean(v);
    if (v && this.type === 'radio') {
      const scope = this.closest('form') || this;
      scope.querySelectorAll('input').forEach((r) => {
        if (r !== this && r.type === 'radio' && r.name === this.name) r._checked = false;
      });
    }
  }
}
class HTMLSelectElementShim extends HTMLElementShim {
  get options() {
    return this.querySelectorAll('option');
  }
  get value() {
    const opts = this.options;
    const picked = opts.filter((o) => (o._selected ?? o.hasAttribute('selected'))).pop() || opts[0];
    return picked ? picked.value : '';
  }
  set value(v) {
    this.options.forEach((o) => {
      o._selected = o.value === String(v);
    });
  }
}
const TAG_CLASS = {
  FORM: HTMLFormElementShim,
  INPUT: HTMLInputElementShim,
  SELECT: HTMLSelectElementShim,
  OPTION: HTMLOptionElementShim,
  BUTTON: HTMLButtonElementShim,
  TEXTAREA: HTMLTextAreaElementShim,
};

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
      const Cls = TAG_CLASS[m[2].toUpperCase()] || HTMLElementShim;
      const el = new Cls(m[2], attrs);
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
  const re = /^([a-zA-Z0-9-]+|\*)|#([\w-]+)|\.([\w-]+)|\[\s*([\w-]+)\s*(?:([\^$*]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]+)))?\s*\]|:([\w-]+)/g;
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
  for (const p of c.pseudos) {
    if (p === 'checked' && !(el.checked === true)) return false;
    if (p === 'disabled' && !el.disabled) return false;
  }
  return true;
}
function matchComplex(el, parts) {
  if (!matchCompound(el, parts[parts.length - 1])) return false;
  let i = parts.length - 2;
  for (let anc = el.parentNode; i >= 0 && anc instanceof FakeElement; anc = anc.parentNode) {
    if (matchCompound(anc, parts[i])) i -= 1;
  }
  return i < 0;
}

globalThis.HTMLElement = HTMLElementShim;
globalThis.HTMLInputElement = HTMLInputElementShim;
globalThis.HTMLSelectElement = HTMLSelectElementShim;
globalThis.HTMLFormElement = HTMLFormElementShim;
globalThis.HTMLButtonElement = HTMLButtonElementShim;
globalThis.HTMLTextAreaElement = HTMLTextAreaElementShim;
globalThis.FormData = class {
  constructor(form) {
    this.list = [];
    form.querySelectorAll('input, select, textarea').forEach((el) => {
      if (!el.name || el.disabled) return;
      if (el.tagName === 'INPUT' && ['button', 'submit', 'reset', 'image', 'file'].includes(el.type)) return;
      if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) return;
      this.list.push([el.name, String(el.value)]);
    });
  }
  entries() {
    return this.list[Symbol.iterator]();
  }
};

/** 브라우저 제약검사 후보: disabled·readonly(select 제외)·hidden/button input 은 빠진다. hidden 조상은 빠지지 않는다. */
function invalidControls(form) {
  return form.querySelectorAll('input, select, textarea').filter((el) => {
    if (el.disabled) return false;
    if (el.tagName === 'INPUT' && ['hidden', 'button', 'submit', 'reset', 'image'].includes(el.type)) return false;
    if (el.tagName !== 'SELECT' && el.hasAttribute('readonly')) return false;
    if (el.required) {
      if (el.type === 'radio') {
        if (!form.querySelectorAll('input').some((r) => r.type === 'radio' && r.name === el.name && r.checked)) return true;
      } else if (el.type === 'checkbox') {
        if (!el.checked) return true;
      } else if (String(el.value) === '') return true;
    }
    if (el.type === 'number' && el.value !== '' && el.hasAttribute('min') && Number(el.value) < Number(el.getAttribute('min'))) {
      return true;
    }
    return false;
  });
}
const hiddenAncestor = (el) => {
  for (let a = el.parentNode; a instanceof FakeElement; a = a.parentNode) if (a.hidden) return true;
  return false;
};
const describe = (el) => `${el.tagName}#${el.id || el.name || '?'}${hiddenAncestor(el) ? '(숨은 조상)' : ''}`;

/** 「다음」 클릭: 제약검사 통과 시에만 submit 리스너가 돈다. */
async function clickNext(form) {
  const invalid = invalidControls(form);
  if (invalid.length) {
    invalid.forEach((el) => el.dispatchEvent({ type: 'invalid', bubbles: false, preventDefault() {} }));
    return { fired: false, invalid };
  }
  const results = form.dispatchEvent({ type: 'submit', bubbles: true, preventDefault() {} });
  await Promise.all(results.map((r) => Promise.resolve(r)));
  await tick();
  return { fired: true, invalid };
}
const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms));

/* ── signup-basic.js 를 실제 소스로 올린다 ── */
const refArg = process.argv.indexOf('--ref');
const ref = refArg > 0 ? process.argv[refArg + 1] : '';
let source;
if (ref) {
  const r = spawnSync('git', ['show', `${ref}:${SCREEN}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (r.status !== 0) {
    console.error(`FAIL  git show ${ref}:${SCREEN} — ${r.stderr}`);
    process.exit(1);
  }
  source = r.stdout;
  console.log(`(소스: ${ref}:${SCREEN})`);
} else {
  source = read(SCREEN);
}

const imported = [];
let body = source.replace(/^import\s+\{([\s\S]*?)\}\s+from\s+'[^']+';[ \t]*$/gm, (_m, names) => {
  names
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean)
    .forEach((n) => imported.push(n));
  return '';
});
body = body.replace(/^export\s+/gm, '');

const shared = (rel) => import(pathToFileURL(join(ROOT, rel)).href);
const cascade = await shared('preview/shared/tutor-unit-cascade.js');
const regionSlots = await shared('preview/shared/tutor-region-slots.js');
const studyForm = await shared('preview/shared/study-room-basic-form.js');
const enums = await shared('preview/auth-ui/src/register-enums.js');
const sidos = await shared('preview/shared/korea-sidos.js');
const subjects = await shared('preview/shared/main-subjects.js');
const school = await shared('preview/shared/school-grade.js');
const inputFill = await shared('preview/shared/input-fill.js');
const feeCheonwon = await shared('preview/shared/fee-cheonwon.js');
const lessonDuration = await shared('preview/shared/lesson-duration-options.js');
const lessonWeekly = await shared('preview/shared/lesson-weekly-options.js');
const tutorBasic = await shared('preview/shared/tutor-basic-fields.js');

const UNITS = [
  { id: '11', label: '서울특별시', sido_code: '11', sido_name: '서울특별시', unit_name: '', kind: 'metro' },
  { id: '41', label: '경기도 수원시', sido_code: '41', sido_name: '경기도', unit_name: '수원시', kind: 'city' },
];
const signupState = { role: 'student', tutorUnits: UNITS, regions: [], basicRegister: {} };
const apiCalls = [];
const alerts = [];
const noop = () => {};
const DEPS = {
  signupState,
  ...enums,
  fetchMeApi: async () => ({ authenticated: true, email_verified: true, needs_basic_register: true }),
  basicRegisterApi: async (role, data) => {
    apiCalls.push({ role, data: { ...data } });
    return { ok: true };
  },
  resolveAfterAuthUrl: () => '/',
  resolveUiRoleForBasicRegister: () => 'student',
  resolvePostLoginUrl: () => '/',
  AUTH_WELCOME_COPY: new Proxy({}, { get: () => '' }),
  buildHomeStudentImportUrl: () => '/',
  isReturnImportMode: () => false,
  mapAuthFormToStudentRecord: () => ({}),
  renderAuthShell: (c) => c,
  renderBrandHero: () => '',
  renderStepIndicator: () => '',
  renderRoleBadge: () => '',
  bindGlobalEvents: noop,
  navigate: noop,
  parseHashQuery: () => ({ role: 'student' }),
  activityLabelFromRegionId: sidos.activityLabelFromRegionId,
  regionIdFromActivityLabel: sidos.regionIdFromActivityLabel,
  ...cascade,
  renderMainSubjectSelect: subjects.renderMainSubjectSelect,
  SCHOOL_LEVEL_FORM_OPTIONS: school.SCHOOL_LEVEL_FORM_OPTIONS,
  gradeOptionHtml: school.gradeOptionHtml,
  bindSchoolGradePairs: noop,
  ...regionSlots,
  ...studyForm,
  bindStudentHopeRegion: noop,
  bindInputFill: inputFill.bindInputFill,
  ...feeCheonwon,
  ...lessonDuration,
  ...lessonWeekly,
  ...tutorBasic,
};
const missing = imported.filter((n) => !(n in DEPS));
ok('signup-basic.js import 이름을 모두 채움(실제 모듈 · 브라우저 전용만 대체)', missing.length === 0, missing.join(', '));

const fakeWindow = { location: { href: '' } };
const factory = new Function(
  '__deps',
  'alert',
  'confirm',
  'window',
  'document',
  `const { ${imported.join(', ')} } = __deps;\n${body}\nreturn { renderStudentBasic, bindSignupBasicEvents };`,
);
const screen = factory(DEPS, (msg) => alerts.push(String(msg)), () => false, fakeWindow, { getElementById: () => null });

/** @param {Record<string, unknown>} draft */
async function mount(draft = {}) {
  signupState.basicRegister = { student: draft };
  apiCalls.length = 0;
  alerts.length = 0;
  const root = new HTMLElementShim('div', [['id', 'app']]);
  root.innerHTML = screen.renderStudentBasic();
  screen.bindSignupBasicEvents(root);
  await tick();
  return { root, form: root.querySelector('form[data-form="basic-student"]') };
}
function pickRadio(form, name, value) {
  const el = form.querySelectorAll(`input[name="${name}"]`).find((r) => r.value === value);
  if (!el) throw new Error(`radio ${name}=${value} 없음`);
  el.checked = true;
  el.dispatchEvent({ type: 'change', bubbles: true });
}
function setValue(form, sel, value) {
  const el = form.querySelector(sel);
  if (!el) throw new Error(`${sel} 없음`);
  el.value = value;
  el.dispatchEvent({ type: 'change', bubbles: true });
}
function fillCommon(form) {
  setValue(form, '#public_display_name', '검증학생');
  setValue(form, '#school_level', 'preschool');
  const subject = form.querySelector('#subject_names').options.find((o) => o.value)?.value || '';
  setValue(form, '#subject_names', subject);
  pickRadio(form, 'lesson_format', 'one_on_one');
}
function fillStudyRoomHope(form) {
  const slot = form.querySelector('[data-hope-region] [data-region-slot]');
  slot.querySelector('[data-field="region_id"]').value = '900001';
  slot.querySelector('[data-field="region_label"]').value = '대치동';
  setValue(form, '#preferred_studyroom_fee_amount', '300');
}
const hiddenRequired = (form) =>
  form.querySelectorAll('[required]').filter((el) => !el.disabled && hiddenAncestor(el)).map(describe);

console.log('##### 전제: 과외 희망지역 칸이 required 로 그려진다 #####');
{
  const { form } = await mount({});
  const sido = form.querySelector('#student_hope_sido');
  ok('학생 폼에 과외 희망지역 select#student_hope_sido 가 있음', !!sido);
  ok('과외 단위 목록이 있으면 select#student_hope_sido 에 required 속성', !!sido && sido.hasAttribute('required'));
  ok('과외 희망지역 칸은 [data-student-tutor-block] 안', !!sido?.closest('[data-student-tutor-block]'));
}

console.log('##### 1. 과외 → 공부방 찾기로 바꾼 뒤 「다음」 #####');
{
  const { form } = await mount({});
  pickRadio(form, 'preferred_lesson_type', 'study_room');
  fillCommon(form);
  fillStudyRoomHope(form);
  ok('공부방 찾기: 과외 칸 숨김 · 공부방 칸 보임', form.querySelector('[data-student-tutor-block]').hidden && !form.querySelector('[data-student-studyroom-block]').hidden);
  ok('공부방 찾기: 숨은 칸 안에 살아 있는 required 없음', hiddenRequired(form).length === 0, hiddenRequired(form).join(', '));
  const r = await clickNext(form);
  ok('공부방 찾기: 브라우저 제약검사 통과(:invalid 없음)', r.invalid.length === 0, r.invalid.map(describe).join(', '));
  ok('공부방 찾기: 「다음」 → submit 발생', r.fired);
  ok('공부방 찾기: 저장 API 1회 · preferred_lesson_type=study_room · region_id=공부방 희망지역', apiCalls.length === 1 && apiCalls[0].data.preferred_lesson_type === 'study_room' && apiCalls[0].data.region_id === '900001', JSON.stringify(apiCalls.map((c) => c.data)) + ' alerts=' + JSON.stringify(alerts));

  pickRadio(form, 'preferred_lesson_type', 'tutor');
  ok('다시 과외: select#student_hope_sido required 복원(보일 때는 그대로 검사)', form.querySelector('#student_hope_sido').required === true);
  ok('다시 과외: 숨은 공부방 칸 안에 살아 있는 required 없음', hiddenRequired(form).length === 0, hiddenRequired(form).join(', '));
}

console.log('##### 2. 저장된 값이 공부방 찾기인 채로 처음 열기 #####');
{
  const { form } = await mount({ preferred_lesson_type: 'study_room' });
  ok('처음부터 공부방: 숨은 과외 칸 안에 살아 있는 required 없음', hiddenRequired(form).length === 0, hiddenRequired(form).join(', '));
  fillCommon(form);
  fillStudyRoomHope(form);
  const r = await clickNext(form);
  ok('처음부터 공부방: 「다음」 → submit 발생 · 저장 API 1회', r.fired && apiCalls.length === 1, `${r.invalid.map(describe).join(', ')} api=${apiCalls.length} alerts=${JSON.stringify(alerts)}`);
}

console.log('##### 3. 공부방 찾기 · 희망지역 비움 → JS 안내(alert)로 막힘 #####');
{
  const { form } = await mount({});
  pickRadio(form, 'preferred_lesson_type', 'study_room');
  fillCommon(form);
  setValue(form, '#preferred_studyroom_fee_amount', '300');
  const r = await clickNext(form);
  ok('희망지역 비움: submit 은 나고 JS 검사 alert 로 멈춤 · 저장 안 함', r.fired && apiCalls.length === 0 && alerts.some((a) => a.includes('행정동')), JSON.stringify(alerts));
}

console.log('##### 4. 과외 찾기 회귀 #####');
{
  const { form } = await mount({});
  fillCommon(form);
  setValue(form, '#preferred_fee_amount', '400');
  const before = await clickNext(form);
  ok('과외 · 시·도 미선택: 보이는 required 로 브라우저가 막음(기존 동작)', !before.fired && before.invalid.some((el) => el.id === 'student_hope_sido'), before.invalid.map(describe).join(', '));
  setValue(form, '#student_hope_sido', '서울특별시');
  const r = await clickNext(form);
  ok('과외 · 서울특별시: 「다음」 → 저장 API 1회 · region_id=11 · activity_city=서울특별시', r.fired && apiCalls.length === 1 && apiCalls[0].data.region_id === '11' && apiCalls[0].data.activity_city === '서울특별시', JSON.stringify(apiCalls.map((c) => c.data)) + ' alerts=' + JSON.stringify(alerts));
}

console.log('##### 5. 같은 모양 다른 화면 (정적) #####');
{
  const reg = read('preview/home-ui/src/student-reg/screens.js');
  ok('마이페이지 학생 기본정보: 숨은 희망 패널의 칸은 disabled', /panel\.hidden = !on;[\s\S]{0,120}el\.disabled = !on;/.test(reg));
  ok('마이페이지 학생 기본정보: 과외 희망지역 칸은 required 없이 그림', !/renderTutorUnitCascade\(\{[^}]*required/.test(reg));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
