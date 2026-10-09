/**
 * 2026-10-09 카드 「상세」 버튼 삭제 · 학생 이름 가리기 = 마지막 글자만
 * 실행: cd preview/home-ui && npx vite-node ../../scripts/verify-card-detail-mask-20261009.mjs
 *
 * (1) 공부방·과외쌤·학생 카드(베이직·픽·프라임, 손님·로그인)에 「상세」 버튼이 없다. 확대카드는 카드 클릭으로만 연다.
 * (2) 학생 공개 표시명은 마지막 글자만 가린다. 3자 이상 이공○ / 남궁○, 2자 이○, 1자 ○, 끝의 「학생」은 다시 붙인다.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), 'utf8') : '');

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
    console.error(`FAIL  ${name}${detail ? ` - ${detail}` : ''}`);
  }
}

/* ══════════════ 1부 정적 ══════════════ */
console.log('##### 1부 정적 #####');

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(js|css)$/.test(name)) out.push(full);
  }
  return out;
}
const previewFiles = walk(join(ROOT, 'preview'));
const hits = (re) => previewFiles.filter((f) => re.test(readFileSync(f, 'utf8'))).map((f) => relative(ROOT, f));

ok('(1) 카드 「상세」 버튼 클래스(expo-hcard__detail) 0', hits(/expo-hcard__detail/).length === 0, hits(/expo-hcard__detail/).join(','));
ok('(1) 「상세」 버튼 연결(search-open-detail) 0', hits(/search-open-detail/).length === 0, hits(/search-open-detail/).join(','));
const renderSrc = read('preview/home-ui/src/exposure-render.js');
ok('(1) exposure-render.js 에 「상세」 버튼 없음', !/>상세<\/button>/.test(renderSrc));
ok('(1) search-handoff.js 의 쓰이지 않던 「상세」 버튼 함수 삭제', !/renderSearchRowActions|>상세</.test(read('preview/search-ui/src/search-handoff.js')));
const detailSrc = read('preview/home-ui/src/detail-decision/index.js');
ok('(1) 카드 클릭 → 확대카드 연결 유지(학생 카드)', /\[data-action="open-student-detail"\]/.test(detailSrc) && /openDetailDecision\(\{ kind: 'student'/.test(detailSrc));
ok('(1) 카드 클릭 → 확대카드 연결 유지(공부방·과외쌤 카드)', /\[data-provider-id\]\[data-provider-kind\]/.test(detailSrc));

const maskSrc = read('preview/home-ui/src/student-blind-teaser.js');
ok('(2) 이름 가리기 함수가 한 곳(student-blind-teaser.js)', /export function maskPublicDisplayName/.test(maskSrc));
const doc29 = read('docs/internal/29-exposure-gnb-decisions.md');
ok('(2) 정본 29: 마지막 글자만 가린다', /마지막 글자만 가린다/.test(doc29) && /이공○/.test(doc29) && !/`김○○`/.test(doc29));

/* ══════════════ 2부 실행 ══════════════ */
console.log('\n##### 2부 실행 #####');

function makeStorage() {
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(String(k)) ? mem.get(String(k)) : null),
    setItem: (k, v) => mem.set(String(k), String(v)),
    removeItem: (k) => mem.delete(String(k)),
    clear: () => mem.clear(),
    key: (i) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size;
    },
  };
}
globalThis.sessionStorage = makeStorage();
globalThis.localStorage = makeStorage();
globalThis.window = globalThis;
const winEvents = new EventTarget();
globalThis.addEventListener = winEvents.addEventListener.bind(winEvents);
globalThis.removeEventListener = winEvents.removeEventListener.bind(winEvents);
globalThis.dispatchEvent = winEvents.dispatchEvent.bind(winEvents);
for (const name of ['HTMLElement', 'HTMLInputElement', 'HTMLFormElement', 'HTMLSelectElement', 'HTMLButtonElement']) {
  if (typeof globalThis[name] === 'undefined') globalThis[name] = class {};
}
Object.defineProperty(globalThis, 'location', {
  value: {
    hash: '#/search/student',
    href: 'http://127.0.0.1:5174/#/search/student',
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
globalThis.history = { replaceState() {}, pushState() {} };
globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({ ok: false }), text: async () => '{}' });
console.warn = () => {};

const { maskPublicDisplayName } = await import('../preview/home-ui/src/student-blind-teaser.js');
const cases = [
  ['이공영', '이공○'],
  ['남궁민수', '남궁○'],
  ['이준', '이○'],
  ['김', '○'],
  ['김민수학생', '김민○학생'],
  ['민수학생', '민○학생'],
  ['학생', '○학생'],
  ['', '○○학생'],
  [null, '○○학생'],
];
for (const [raw, want] of cases) {
  const got = maskPublicDisplayName(raw);
  ok(`(2) 「${raw ?? 'null'}」 → 「${want}」`, got === want, `got ${got}`);
}

const { renderBasicRow, renderExposureBox } = await import('../preview/home-ui/src/exposure-render.js');

const room = {
  id: 7,
  study_room_name: '해님공부방',
  location_label: '경기도 의정부시 가능동',
  price_amount: 300000,
  grade_band: '초등',
  main_subject_note: '수학',
  slogan: '함께 해요',
  profile_status: 'published',
};
const tutor = {
  id: 11,
  tutor_display_name: '최고수학샘1',
  location_label: '경기도 의정부시',
  preferred_fee_amount: 300000,
  lessons_per_week: 3,
  minutes_per_lesson: 90,
  main_subject_note: '수학',
  profile_status: 'published',
};
const student = {
  id: 21,
  public_display_name: '이공영',
  grade_level: '초5',
  subject_label: '수학',
  location_label: '경기도 의정부시 가능동',
  preferred_lesson_type: 'study_room',
  preferred_studyroom_fee_amount: 420000,
  exposure_status: 'published',
};

const noDetail = (html) => !/>상세</.test(html) && !/expo-hcard__detail/.test(html) && !/search-open-detail/.test(html);

for (const [label, opts] of [
  ['손님', { guest: true }],
  ['공부방 로그인', { viewerRole: 'study_room' }],
  ['과외쌤 로그인', { viewerRole: 'tutor' }],
  ['학부모 로그인', { viewerRole: 'parent' }],
]) {
  for (const layout of [undefined, 'table']) {
    const tag = `${label}${layout ? ' 표' : ''}`;
    const roomHtml = renderBasicRow('study_room', room, { ...opts, layout });
    ok(`(1) [${tag}] 공부방 베이직: 「상세」 없음 + 카드 클릭 표시 유지`, noDetail(roomHtml) && /data-provider-kind="study_room"/.test(roomHtml));
    const tutorHtml = renderBasicRow('tutor', tutor, { ...opts, layout });
    ok(`(1) [${tag}] 과외쌤 베이직: 「상세」 없음 + 카드 클릭 표시 유지`, noDetail(tutorHtml) && /data-provider-kind="tutor"/.test(tutorHtml));
    const studentHtml = renderBasicRow('student', student, { ...opts, layout });
    ok(`(1) [${tag}] 학생 베이직: 「상세」 없음 + 카드 클릭 표시 유지`, noDetail(studentHtml) && /data-action="open-student-detail"/.test(studentHtml));
    ok(`(2) [${tag}] 학생 카드 이름 「이공○」`, studentHtml.includes('이공○') && !studentHtml.includes('이공영'));
  }
  for (const tier of ['pick', 'prime']) {
    for (const kind of ['study_room', 'tutor']) {
      const html = renderExposureBox(kind, tier, kind === 'tutor' ? tutor : room, '', opts);
      ok(`(1) [${label}] ${kind === 'tutor' ? '과외쌤' : '공부방'} ${tier === 'pick' ? '픽' : '프라임'}: 「상세」 없음`, noDetail(html));
    }
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
