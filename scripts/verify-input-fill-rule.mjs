/**
 * 사이트오류-24 · 회원 입력 폼 칸 채움 색 (값 있음 #f3f4f6 · 비었거나 포커스 #fff · disabled 제외)
 * 실행(루트): npx --prefix preview/home-ui vite-node scripts/verify-input-fill-rule.mjs
 *
 * 1부 정적: 색 값·선택자는 shared/input-fill.css 한곳(e), 공용 모듈을 부르는 파일은 적용 폼 목록뿐(b),
 *          옛 readonly 배경 규칙 제거(M4), !important 없음(M6).
 * 2부 실제 렌더: 앱별 Vite 개발 서버 + Playwright chromium. 실제 main.js·라우터·CSS 로 화면을 띄우고
 *          API 는 page.route 로 대신 답한다. 카카오 우편번호는 window.daum.Postcode 가짜로 결과만 돌려준다.
 *          (a) 채움 회색·빈칸/포커스 흰색 (b) 제외 화면·타입 표시 없음 (c) readonly 주소칸
 *          (d) 코드 대입(주소·홍보1·대학·지역) 뒤 상태 (f) disabled 는 규칙 밖
 * 3부 변이: 소스를 실제로 되돌려 새 프로세스로 해당 시나리오를 돌려 실패를 확인하고, finally 에서 복구·복구 확인.
 *
 * 자식 실행: node scripts/verify-input-fill-rule.mjs --only=T1,S1  (변이 검사가 쓴다)
 *
 * 사이트오류-25: 시나리오 delayMeMs > 0 이면 /api/auth/me.php 응답만 그 밀리초만큼 늦춘다.
 * me 가 masters 보다 늦어도 활동명·대학명·공부방명이 비면 안 된다. delayMeMs 0 인 기존 케이스는 그대로다.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT = fileURLToPath(import.meta.url);
const ROOT = join(dirname(SCRIPT), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? new Set(onlyArg.slice(7).split(',').filter(Boolean)) : null;
const IS_CHILD = Boolean(ONLY);

const GRAY = 'rgb(243, 244, 246)';
const WHITE = 'rgb(255, 255, 255)';

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

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}
const rel = (full) => relative(ROOT, full).split(sep).join('/');

/* ───────────── 1부 정적 ───────────── */
if (!IS_CHILD) {
  console.log('##### 1부 정적 #####');
  const files = walk(join(ROOT, 'preview'));
  const cssFiles = files.filter((f) => f.endsWith('.css'));
  const jsFiles = files.filter((f) => f.endsWith('.js'));
  const fillCss = read('preview/shared/input-fill.css');
  const fillCssBody = fillCss.replace(/\/\*[\s\S]*?\*\//g, '');

  ok(
    '(e) 색 값 두 개는 input-fill.css 변수로 한 번씩만',
    (fillCssBody.match(/#f3f4f6/gi) || []).length === 1 &&
      (fillCssBody.match(/#fff\b/gi) || []).length === 1 &&
      /--input-fill-filled:\s*#f3f4f6;/.test(fillCssBody) &&
      /--input-fill-empty:\s*#fff;/.test(fillCssBody) &&
      (fillCssBody.match(/#[0-9a-f]{3,8}\b/gi) || []).length === 2,
  );
  ok(
    '(e) 채움 변수·[data-fill] 선택자를 정의한 CSS 는 input-fill.css 하나',
    cssFiles
      .filter((f) => /--input-fill-(filled|empty)\s*:|\[data-fill[\]=]|\[data-input-fill\]/.test(readFileSync(f, 'utf8')))
      .map(rel)
      .join(',') === 'preview/shared/input-fill.css',
  );
  ok(
    '(e) 공용 색 토큰(tokens.css)에 채움 색을 넣지 않음',
    !/input-fill|--fill-/.test(read('preview/home-ui/src/styles/tokens.css')),
  );
  ok(
    '(e) JS 가 칸 배경을 직접 칠하지 않음(옛 tutor 인라인·student-basic-fill 제거)',
    !existsSync(join(ROOT, 'preview/home-ui/src/student-reg/student-basic-fill.css')) &&
      jsFiles.every((f) => {
        const src = readFileSync(f, 'utf8');
        return !/style\.background(Color)?\s*=\s*[^;]*(#f3f4f6|#fff\b|FILL|fill)/i.test(src) && !/student-basic-fill/.test(src);
      }),
  );
  ok(
    '(M6) background-color 만, !important·테두리·윤곽 없음',
    !/!important/.test(fillCssBody) &&
      !/\bbackground\s*:/.test(fillCssBody) &&
      !/\bborder|\boutline|box-shadow|background-image/.test(fillCssBody) &&
      (fillCssBody.match(/background-color\s*:/g) || []).length === 2,
  );
  ok(
    '(M1) data-fill 을 매기는 JS 는 shared/input-fill.js 하나',
    jsFiles.filter((f) => /setAttribute\(\s*'data-fill'/.test(readFileSync(f, 'utf8'))).map(rel).join(',') === 'preview/shared/input-fill.js',
  );
  ok(
    '(M1) 공용 CSS 는 register-flow.css 가 불러 4개 앱 main.js 가 모두 싣는다',
    /^\/\*[^\n]*\*\/\s*\n@import '\.\/input-fill\.css';/.test(read('preview/shared/register-flow.css')) &&
      ['home-ui', 'auth-ui', 'tutor-ui', 'study-room-ui'].every((a) => /import '\.\.\/\.\.\/shared\/register-flow\.css';/.test(read(`preview/${a}/src/main.js`))),
  );

  const EXPECTED_USERS = [
    'preview/auth-ui/src/screens/signup-account-contact.js',
    'preview/auth-ui/src/screens/signup-basic.js',
    'preview/auth-ui/src/screens/signup-form.js',
    'preview/home-ui/src/mypage/screens.js',
    'preview/home-ui/src/student-reg/screens.js',
    'preview/home-ui/src/study-room-reg/embedded-panels.js',
    'preview/home-ui/src/study-room-reg/registration-check-edit.js',
    'preview/home-ui/src/study-room-reg/screens.js',
    'preview/home-ui/src/tutor-reg/screens.js',
    'preview/shared/korean-universities.js',
    'preview/shared/region-cascade.js',
    'preview/shared/study-room-basic-form.js',
    'preview/study-room-ui/src/screens/step-basic.js',
    'preview/study-room-ui/src/screens/step-facility.js',
    'preview/study-room-ui/src/screens/step-lesson.js',
    'preview/tutor-ui/src/screens/step-basic.js',
    'preview/tutor-ui/src/screens/step-contact.js',
    'preview/tutor-ui/src/screens/step-detail.js',
    'preview/tutor-ui/src/screens/step-lesson.js',
  ];
  const users = jsFiles
    .filter((f) => /from '[./]+(shared\/)?input-fill\.js'/.test(readFileSync(f, 'utf8')))
    .map(rel)
    .sort();
  ok('(b) input-fill.js 를 부르는 파일 = 적용 폼 목록(관리자·찾기·게시판·쪽지·후기·고객센터·상품 없음)', users.join(',') === EXPECTED_USERS.join(','), users.join(','));
  ok(
    '(hold) complex-name-from-kakao.js 는 input-fill.js 를 import 하지 않음',
    !/input-fill/.test(read('preview/shared/complex-name-from-kakao.js')),
  );
  ok(
    '(b) 제외 화면 폴더는 공용 모듈을 부르지 않음',
    users.every((f) => !/\/(admin|board|messages|provider-reviews|support|plans|concern|search-ui|neighborhood)/.test(f)),
  );
  const bindCalls = EXPECTED_USERS.filter((f) => /bindInputFill\(/.test(read(f)));
  ok(
    '(M2) bindInputFill 을 부르는 화면 파일 16개',
    bindCalls.length === 16 && !bindCalls.some((f) => /korean-universities|region-cascade|study-room-basic-form/.test(f)),
    bindCalls.join(','),
  );
  ok(
    '(M2) 마이페이지 탈퇴 폼은 적용하지 않음(계정 폼은 표시명·비밀번호만)',
    (read('preview/home-ui/src/mypage/screens.js').match(/bindInputFill\(form\)/g) || []).length === 2,
  );

  const readonlyRules = [
    ['preview/shared/register-form-primitives.css', /\.register-edit-dialog \.form-address input\[readonly\] \{([^}]*)\}/],
    ['preview/shared/register-flow.css', /\.register-flow \.form-address input\[readonly\] \{([^}]*)\}/],
    ['preview/auth-ui/src/styles/base.css', /\n\.form-address input\[readonly\] \{([^}]*)\}/],
  ];
  ok(
    '(M4) 옛 readonly 배경(gray-50) 규칙에서 배경을 뺐고 cursor 만 남김',
    readonlyRules.every(([file, re]) => {
      const m = read(file).match(re);
      return m && !/background/.test(m[1]) && /cursor:\s*default/.test(m[1]);
    }),
  );
  ok(
    '(M4) 공부방 수정 팝업 readonly #fff7ee 규칙 제거',
    !/#fff7ee/i.test(read('preview/study-room-ui/src/styles/register.css')) &&
      !/form-address input\[readonly\]/.test(read('preview/study-room-ui/src/styles/register.css')),
  );
  ok(
    '(M4) 다른 CSS 에 readonly 배경 규칙이 남지 않음',
    cssFiles.every((f) => {
      const src = readFileSync(f, 'utf8');
      return [...src.matchAll(/[^{}]*\[readonly\][^{}]*\{([^}]*)\}/g)].every((m) => !/background/.test(m[1]));
    }),
  );
  const boxShape = spawnSync('git', ['diff', '--quiet', 'HEAD', '--', 'preview/home-ui/src/styles/udx-std-apply.css'], { cwd: ROOT });
  ok('udx-std-apply.css(verify-study-room-box-shape :276-278 구간 파일) 변경 없음', boxShape.status === 0);
}

/* ───────────── 2부 실제 렌더 ───────────── */
const ROLE_TYPE = { parent: 'guardian_student', tutor: 'tutor', study_room: 'study_room_owner', admin: 'admin' };
const CITIES = [
  { id: '117', label: '경기도 의정부시', sido_code: '41', sido_name: '경기도', official_code: '41150', city_name: '의정부시', gu_name: null, kind: 'city' },
  { id: '118', label: '경기도 고양시', sido_code: '41', sido_name: '경기도', official_code: '41280', city_name: '고양시', gu_name: null, kind: 'city' },
  { id: '201', label: '서울특별시 강남구', sido_code: '11', sido_name: '서울특별시', official_code: '11680', city_name: '강남구', gu_name: null, kind: 'gu' },
];
const STUDENT = {
  id: 1, student_name: '김하늘', public_display_name: '맑은하늘', grade_level: '중2', school_level: 'middle', gender: 'female',
  birth_year: 2012, exposure_status: 'published', preferred_lesson_type: 'tutor', request_summary: '', subject_label: '수학',
  lesson_format: 'one_on_one', preferred_fee_amount: 550000, preferred_studyroom_fee_amount: 420000, lesson_places: ['student_home'],
  preferred_tutor_regions: [], preferred_studyroom_regions: [],
};
const TUTOR = {
  id: 1, tutor_id: 1, tutor_display_name: '김수학', profile_status: 'draft', detail_completion_status: 'basic_only',
  main_subject_note: '수학', intro_short: '', preferred_fee_amount: 480000, lessons_per_week: 2, minutes_per_lesson: '',
  university_name: '서울대학교', major_name: '', saved_regions: [], subjects: [], lesson_places: [], profile_images: [],
};
const ROOM = {
  id: 1, study_room_id: 1, study_room_name: '해피공부방', profile_status: 'draft', detail_completion_status: 'basic_only',
  intro_short: '소수 정예 수학', feature_1: '1:1 맞춤 관리', saved_regions: [], classes: [],
};
const POSTCODE = {
  zonecode: '06234', roadAddress: '서울 강남구 테헤란로 1', jibunAddress: '서울 강남구 역삼동 1', sido: '서울', sigungu: '강남구',
  sigunguCode: '11680', bcode: '1168010100', bname: '역삼동', hname: '역삼1동', buildingName: '', apartment: 'N', userSelectedType: 'R',
};

function meFor(role, extra = {}) {
  if (!role || role === 'guest') return { ok: true, authenticated: false };
  return {
    ok: true, authenticated: true, email_verified: true, user_id: 7, email: 'member@example.com', name: '테스트회원',
    role_type: ROLE_TYPE[role], phone_verified: true, admin_level: role === 'admin' ? 'super' : null, ...extra,
  };
}

function apiAnswer(sc, url, body) {
  const p = url.pathname;
  const data = sc.data || {};
  if (p.endsWith('/api/auth/me.php')) return meFor(sc.role, sc.me);
  if (p.endsWith('/api/registrations/students.php')) return { ok: true, students: [{ ...STUDENT, ...(data.student || {}) }] };
  if (p.endsWith('/api/registrations/tutors.php')) return { ok: true, tutors: [{ ...TUTOR, ...(data.tutor || {}) }] };
  if (p.endsWith('/api/registrations/study-rooms.php')) return { ok: true, rooms: [{ ...ROOM, ...(data.room || {}) }] };
  if (p.endsWith('/api/study-room/register.php')) {
    if (body?.action === 'masters') return { ok: true, masters: { regions: [], complexes: [], facilities: [], subjects: [] } };
    if (body?.action === 'load') return { ok: true, room: { ...ROOM, ...(data.room || {}) } };
  }
  if (p.endsWith('/api/tutor/register.php')) {
    if (body?.action === 'masters') return { ok: true, masters: { regions: [], cities: CITIES } };
    if (body?.action === 'load') return { ok: true, tutor: { ...TUTOR, ...(data.tutor || {}) } };
  }
  if (p.endsWith('/api/auth/regions.php')) {
    if (body?.action === 'ensure' || body?.action === 'ensure_region') return null;
    return { ok: true, regions: [], cities: CITIES, complexes: [] };
  }
  return null;
}

const PAGE_HELPERS = `(() => {
  const SKIP = new Set(['hidden','radio','checkbox','button','submit','reset','file','image','range','color']);
  const keyOf = (el) => el.name || el.id || el.getAttribute('data-field') || el.className || el.tagName;
  window.__fillRow = (el) => {
    const cs = getComputedStyle(el);
    return {
      key: keyOf(el), tag: el.tagName, type: String(el.type || '').toLowerCase(), value: String(el.value ?? ''),
      fill: el.getAttribute('data-fill'), bg: cs.backgroundColor, img: cs.backgroundImage,
      disabled: el.disabled, readOnly: Boolean(el.readOnly), visible: el.getClientRects().length > 0,
      focused: document.activeElement === el, p19select: el.classList.contains('p19-select'),
      skip: el.tagName === 'INPUT' && SKIP.has(String(el.type || 'text').toLowerCase()),
    };
  };
  window.__fillSnap = (sel) => {
    const form = document.querySelector(sel);
    if (!form) return null;
    const marked = form.hasAttribute('data-input-fill');
    const els = [...form.querySelectorAll('input, select, textarea')];
    const rows = els.map(window.__fillRow);
    form.removeAttribute('data-input-fill');
    els.forEach((el, i) => { const cs = getComputedStyle(el); rows[i].bgOff = cs.backgroundColor; rows[i].imgOff = cs.backgroundImage; });
    if (marked) form.setAttribute('data-input-fill', '');
    return { marked, rows };
  };
  window.__fillOne = (sel) => { const el = document.querySelector(sel); return el ? window.__fillRow(el) : null; };
  window.__fillRuleOff = (sel) => {
    const form = document.querySelector(sel);
    const had = form.hasAttribute('data-input-fill');
    form.removeAttribute('data-input-fill');
    const out = [...form.querySelectorAll('input, select, textarea')].map((el) => getComputedStyle(el).backgroundColor);
    if (had) form.setAttribute('data-input-fill', '');
    return out;
  };
  window.__fillDoc = () => ({
    marked: document.querySelectorAll('[data-input-fill]').length,
    fills: document.querySelectorAll('[data-fill]').length,
    controls: document.querySelectorAll('input, select, textarea').length,
  });
  window.__postcodeData = ${JSON.stringify(POSTCODE)};
  window.daum = { Postcode: function (opts) { this.open = () => setTimeout(() => opts.oncomplete(window.__postcodeData), 0); } };
})();`;

/** 적용 폼 공통 판정 (a)(b) + M6 화살표 */
function checkApplied(label, snap, opts = {}) {
  if (!snap) {
    ok(`${label}: 폼 렌더`, false);
    return;
  }
  ok(`${label}: data-input-fill 표시`, snap.marked);
  const ctl = snap.rows.filter((r) => !r.skip);
  const skipped = snap.rows.filter((r) => r.skip);
  const wrong = ctl.filter((r) => r.fill !== (r.value.trim() ? 'filled' : 'empty'));
  ok(`${label}: 입력칸마다 data-fill = 값 유무 (${ctl.length}칸)`, ctl.length > 0 && wrong.length === 0, wrong.map((r) => `${r.key}=${r.fill}`).join(','));
  ok(`${label}: (b) 라디오·체크·숨김·파일은 표시 없음 (${skipped.length})`, skipped.every((r) => r.fill == null));
  const live = ctl.filter((r) => !r.disabled && !r.focused);
  const filled = live.filter((r) => r.fill === 'filled');
  const empty = live.filter((r) => r.fill === 'empty');
  const badFilled = filled.filter((r) => r.bg !== GRAY);
  const badEmpty = empty.filter((r) => r.bg !== WHITE);
  ok(
    `${label}: (a) 값 있는 칸 회색 (${filled.length})`,
    (opts.needFilled === false || filled.length > 0) && badFilled.length === 0,
    badFilled.map((r) => `${r.key}:${r.bg}`).join(','),
  );
  ok(
    `${label}: (a) 빈 칸 흰색 (${empty.length})`,
    (opts.needEmpty === false || empty.length > 0) && badEmpty.length === 0,
    badEmpty.map((r) => `${r.key}:${r.bg}`).join(','),
  );
  const imgChanged = ctl.filter((r) => r.img !== r.imgOff);
  ok(`${label}: (M6) 규칙은 background-image(select 화살표)를 바꾸지 않음`, imgChanged.length === 0, imgChanged.map((r) => r.key).join(','));
  const arrows = ctl.filter((r) => r.p19select && r.imgOff !== 'none');
  if (arrows.length) {
    ok(`${label}: (M6) p19-select 화살표 보임 (${arrows.length})`, arrows.every((r) => r.img && r.img !== 'none'));
  }
}

const SCENARIOS = [];
const sc = (def) => SCENARIOS.push(def);

/* tutor-ui 등록 단계 */
sc({
  id: 'T1', app: 'tutor-ui', role: 'tutor', hash: '/register/basic', form: '[data-form="basic"]',
  async run({ snap, focusCheck, one }) {
    checkApplied('T1 과외 등록 기본', await snap());
    const name = await one('#tutor_display_name');
    ok('T1 지연 0: 활동명 채워짐', name?.value === '김수학', JSON.stringify(name));
    await focusCheck('T1 과외 등록 기본', '#tutor_display_name, [name="tutor_display_name"]');
  },
});
sc({
  id: 'T1D', app: 'tutor-ui', role: 'tutor', hash: '/register/basic', form: '[data-form="basic"]', delayMeMs: 40,
  async run({ one }) {
    const name = await one('#tutor_display_name');
    ok('T1D 지연 me≥30: 활동명 비어 있지 않음', name?.value === '김수학', JSON.stringify(name));
  },
});
sc({
  id: 'T2', app: 'tutor-ui', role: 'tutor', hash: '/register/lesson', form: '[data-form="lesson"]',
  async run({ page, snap, one }) {
    checkApplied('T2 과외 등록 수업', await snap());
    await page.selectOption('[data-form="lesson"] [name="minutes_per_lesson"]', { index: 1 });
    const row = await one('[data-form="lesson"] [name="minutes_per_lesson"]');
    ok('T2 과외 등록 수업: 선택하면 회색', row?.fill === 'filled' && row.bg === GRAY, JSON.stringify(row));
  },
});
sc({
  id: 'T3', app: 'tutor-ui', role: 'tutor', hash: '/register/contact', form: '[data-form="contact"]',
  async run({ snap }) {
    checkApplied('T3 과외 등록 연락·경력', await snap());
  },
});
sc({
  id: 'T4', app: 'tutor-ui', role: 'tutor', hash: '/register/detail', form: '[data-form="detail-all"]',
  async run({ page, snap, one, disabledCheck }) {
    checkApplied('T4 과외 등록 상세', await snap());
    const vis = '[data-form="detail-all"] [data-university-autocomplete]';
    const before = await one(vis);
    ok('T4 대학: 저장된 대학명 회색', before?.value === '서울대학교' && before.bg === GRAY, JSON.stringify(before));
    await page.click(vis);
    await page.evaluate((s) => document.querySelector(s).blur(), vis);
    const restored = await one(vis);
    ok('T4 (d) 대학: 눌렀다 고르지 않고 빠지면 되돌린 값 회색', restored?.value === '서울대학교' && restored.fill === 'filled' && restored.bg === GRAY, JSON.stringify(restored));
    await page.selectOption('[data-form="detail-all"] [data-university-sido]', { index: 2 });
    const cleared = await one(vis);
    ok('T4 (d) 대학: 시·도 변경으로 코드가 비운 칸 흰색', cleared?.value === '' && cleared.fill === 'empty' && cleared.bg === WHITE, JSON.stringify(cleared));
    await page.fill(vis, '연세대학교');
    await page.evaluate((s) => document.querySelector(s).blur(), vis);
    const picked = await one(vis);
    const hidden = await page.evaluate(() => document.querySelector('[data-form="detail-all"] [data-university-value]')?.value);
    ok('T4 (d) 대학: 고른 대학 회색·hidden 값 반영', picked?.fill === 'filled' && picked.bg === GRAY && hidden === '연세대학교', JSON.stringify({ picked, hidden }));
    await disabledCheck('T4 과외 등록 상세', '[data-form="detail-all"] [name="major_name"]', '수학과');
  },
});
sc({
  id: 'T4D', app: 'tutor-ui', role: 'tutor', hash: '/register/detail', form: '[data-form="detail-all"]', delayMeMs: 40,
  async run({ one }) {
    const univ = await one('#tutor_univ_detail');
    ok('T4D 지연 me≥30: 대학명(tutor_univ_detail) 비어 있지 않음', univ?.value === '서울대학교', JSON.stringify(univ));
  },
});

/* study-room-ui 등록 단계 */
sc({
  id: 'S1', app: 'study-room-ui', role: 'study_room', hash: '/register/basic?edit=1', form: '[data-form="basic-all"]',
  async run({ page, snap, one, wait }) {
    checkApplied('S1 공부방 기본 수정 팝업', await snap());
    const f = '[data-form="basic-all"]';
    const ro = async (name) => one(`${f} [name="${name}"]`);
    const zip0 = await ro('address_zip');
    const addr0 = await ro('address_text');
    ok('S1 (c) readonly 개설주소 빈칸 흰색', zip0?.readOnly && addr0?.readOnly && zip0.bg === WHITE && addr0.bg === WHITE, JSON.stringify({ zip0, addr0 }));
    await page.click(`${f} [data-address-search="business"]`);
    await wait(() => document.querySelector('[data-form="basic-all"] [name="address_text"]')?.value);
    const zip1 = await ro('address_zip');
    const addr1 = await ro('address_text');
    ok('S1 (c)(d) 주소검색 대입 뒤 readonly 개설주소 회색', zip1?.fill === 'filled' && addr1?.fill === 'filled' && zip1.bg === GRAY && addr1.bg === GRAY, JSON.stringify({ zip1, addr1 }));
    const promo = await one(`${f} [data-region-slot="0"] [data-field="dong_query"]`);
    ok('S1 (d) 홍보1 자동 채움 회색', promo?.value !== '' && promo.fill === 'filled' && promo.bg === GRAY, JSON.stringify(promo));
    await page.click(`${f} [data-address-search="home"]`);
    await wait(() => document.querySelector('[data-form="basic-all"] [name="home_address"]')?.value);
    const home = await ro('home_address');
    ok('S1 (c)(d) 집 주소 대입 뒤 회색', home?.fill === 'filled' && home.bg === GRAY, JSON.stringify(home));
    const roomName = await one('#study_room_name');
    ok('S1 지연 0: 공부방명 채워짐', roomName?.value === '해피공부방', JSON.stringify(roomName));
  },
});
sc({
  id: 'S1D', app: 'study-room-ui', role: 'study_room', hash: '/register/basic?edit=1', form: '[data-form="basic-all"]', delayMeMs: 40,
  async run({ one }) {
    const roomName = await one('#study_room_name');
    ok('S1D 지연 me≥30: 공부방명 비어 있지 않음', roomName?.value === '해피공부방', JSON.stringify(roomName));
  },
});
sc({
  id: 'S2', app: 'study-room-ui', role: 'study_room', hash: '/register/lesson', form: '[data-form="lesson"]',
  async run({ snap }) {
    checkApplied('S2 공부방 상세1', await snap());
  },
});
sc({
  id: 'S3', app: 'study-room-ui', role: 'study_room', hash: '/register/facility', form: '[data-form="facility"]',
  async run({ snap, typeCheck }) {
    checkApplied('S3 공부방 상세2', await snap());
    await typeCheck('S3 공부방 상세2', '[data-form="facility"] [name="feature_1"]');
  },
});

/* auth-ui 가입 */
sc({
  id: 'A1', app: 'auth-ui', role: 'guest', hash: '/signup/form?role=student', form: '[data-form="signup"]',
  async run({ page, snap, one, wait, focusCheck, disabledCheck }) {
    checkApplied('A1 가입 정보', await snap());
    const zip0 = await one('#signup-address-zip');
    const addr0 = await one('#signup-address');
    ok('A1 (c) readonly 주소 빈칸 흰색', zip0?.readOnly && addr0?.readOnly && zip0.bg === WHITE && addr0.bg === WHITE, JSON.stringify({ zip0, addr0 }));
    await page.click('[data-action="search-address"]');
    await wait(() => document.querySelector('#signup-address')?.value);
    const zip1 = await one('#signup-address-zip');
    const addr1 = await one('#signup-address');
    ok('A1 (c)(d) 카카오 주소 확정 뒤 readonly 주소 회색', zip1?.fill === 'filled' && addr1?.fill === 'filled' && zip1.bg === GRAY && addr1.bg === GRAY, JSON.stringify({ zip1, addr1 }));
    await focusCheck('A1 가입 정보', '#signup-name, [data-form="signup"] [name="name"]');
    await disabledCheck('A1 가입 정보', '[data-form="signup"] [name="name"]');
  },
});
sc({
  id: 'A2', app: 'auth-ui', role: 'parent', hash: '/signup/account-contact', form: '[data-form="account-contact"]',
  async run({ snap, typeCheck }) {
    checkApplied('A2 가입 연락처', await snap(), { needFilled: false });
    await typeCheck('A2 가입 연락처', '[data-form="account-contact"] [name="phone"]', '010-1234-5678');
  },
});
sc({
  id: 'A3', app: 'auth-ui', role: 'parent', me: { needs_basic_register: true }, hash: '/signup/basic?role=student', form: '[data-form="basic-student"]',
  async run({ page, snap, one }) {
    const s = await snap();
    checkApplied('A3 가입 기본 학생', s, { needFilled: false });
    const grade = s?.rows.find((r) => r.key === 'grade_level');
    ok('A3 (f) disabled 학년(보이는 칸) 흰색 유지', grade?.disabled && grade.visible && grade.bg === WHITE, JSON.stringify(grade));
    const sido = '[data-form="basic-student"] [data-field="region_sido"]';
    if (await page.$(sido)) {
      await page.selectOption(sido, '경기도');
      const a = await one(sido);
      const c = await one('[data-form="basic-student"] [data-field="region_city"]');
      ok('A3 (d) 지역 연쇄: 시·도 회색, 비운 시·군 흰색', a?.bg === GRAY && c?.fill === 'empty' && c.bg === WHITE, JSON.stringify({ a, c }));
      await page.selectOption('[data-form="basic-student"] [data-field="region_city"]', '의정부시');
      const c2 = await one('[data-form="basic-student"] [data-field="region_city"]');
      ok('A3 (d) 지역 연쇄: 시·군 고르면 회색', c2?.fill === 'filled' && c2.bg === GRAY, JSON.stringify(c2));
    } else {
      ok('A3 (d) 지역 연쇄 칸 렌더', false, 'region_sido 없음');
    }
  },
});
sc({
  id: 'A4', app: 'auth-ui', role: 'study_room', me: { needs_basic_register: true }, hash: '/signup/basic?role=study_room', form: '[data-form="basic-study-room"]',
  async run({ page, snap, one, wait }) {
    checkApplied('A4 가입 기본 공부방', await snap());
    const f = '[data-form="basic-study-room"]';
    await page.click(`${f} [data-address-search="business"]`);
    await wait(() => document.querySelector('[data-form="basic-study-room"] [name="address_text"]')?.value);
    const addr = await one(`${f} [name="address_text"]`);
    const promo = await one(`${f} [data-region-slot="0"] [data-field="dong_query"]`);
    ok('A4 (c)(d) 개설주소·홍보1 대입 뒤 회색', addr?.bg === GRAY && promo?.fill === 'filled' && promo.bg === GRAY, JSON.stringify({ addr, promo }));
  },
});
sc({
  id: 'A5', app: 'auth-ui', role: 'tutor', me: { needs_basic_register: true }, hash: '/signup/basic?role=tutor', form: '[data-form="basic-tutor"]',
  async run({ snap }) {
    checkApplied('A5 가입 기본 과외', await snap(), { needEmpty: false });
  },
});
sc({
  id: 'AX', app: 'auth-ui', role: 'guest', hash: '/login', form: null, excluded: true,
  async run({ page, doc }) {
    for (const h of ['/login', '/find-id', '/find-password']) {
      await page.evaluate((x) => { location.hash = x; }, h);
      await page.waitForTimeout(500);
      const d = await doc();
      ok(`AX (b) 제외 auth ${h}: 표시 없음 (칸 ${d.controls})`, d.controls > 0 && d.marked === 0 && d.fills === 0, JSON.stringify(d));
    }
  },
});

/* home-ui 마이페이지 */
sc({
  id: 'H1', app: 'home-ui', role: 'parent', hash: '/mypage/registrations/students/1/basic', form: '[data-p19-form="basic"]',
  waitFor: '[data-p19-form="basic"] [data-field="region_sido"]',
  async run({ page, snap, one, focusCheck, typeCheck, ruleOffCheck, acceptDialogs }) {
    checkApplied('H1 학생 기본정보', await snap());
    await focusCheck('H1 학생 기본정보', '[data-p19-form="basic"] [name="public_display_name"]');
    await typeCheck('H1 학생 기본정보', '[data-p19-form="basic"] [name="request_summary"]');
    const sido = '[data-p19-form="basic"] [data-field="region_sido"]';
    const city = '[data-p19-form="basic"] [data-field="region_city"]';
    await page.selectOption(sido, '경기도');
    const a = await one(sido);
    const c = await one(city);
    ok('H1 (d) 지역 연쇄: 시·도 회색, 비운 시·군 흰색', a?.bg === GRAY && c?.fill === 'empty' && c.bg === WHITE, JSON.stringify({ a, c }));
    await page.selectOption(city, '의정부시');
    const c2 = await one(city);
    ok('H1 (d) 지역 연쇄: 시·군 고르면 회색', c2?.fill === 'filled' && c2.bg === GRAY, JSON.stringify(c2));
    await ruleOffCheck('H1 학생 기본정보');
    acceptDialogs(true);
    await page.selectOption('[data-p19-form="basic"] [name="preferred_lesson_type"]', 'study_room');
    await page.waitForTimeout(200);
    acceptDialogs(false);
    const dong = await one('[data-p19-form="basic"] [data-p19-hope-region-slot] [data-field="dong_query"]');
    ok('H1 분기 변경으로 갈아 끼운 빈 희망지역 흰색', dong && !dong.disabled && dong.fill === 'empty' && dong.bg === WHITE, JSON.stringify(dong));
  },
});
sc({
  id: 'H2', app: 'home-ui', role: 'parent', hash: '/mypage/registrations/students/1/basic', form: '[data-p19-form="basic"]',
  data: { student: { preferred_lesson_type: 'study_room' } },
  waitFor: '[data-p19-form="basic"] [data-p19-hope-region-slot] [data-address-search]',
  async run({ page, snap, one, wait }) {
    checkApplied('H2 학생 기본정보(공부방 분기)', await snap());
    const q = '[data-p19-form="basic"] [data-p19-hope-region-slot] [data-field="dong_query"]';
    const before = await one(q);
    ok('H2 (c) readonly 희망지역 빈칸 흰색', before?.readOnly && before.fill === 'empty' && before.bg === WHITE, JSON.stringify(before));
    await page.click('[data-p19-form="basic"] [data-p19-hope-region-slot] [data-address-search]');
    await wait((s) => document.querySelector(s)?.value, q);
    const after = await one(q);
    ok('H2 (c)(d) 주소검색 적용 뒤 readonly 희망지역 회색', after?.fill === 'filled' && after.bg === GRAY, JSON.stringify(after));
  },
});
sc({
  id: 'H3', app: 'home-ui', role: 'parent', hash: '/mypage/registrations/students/1/detail', form: '[data-p19-form="detail"]',
  async run({ snap }) {
    checkApplied('H3 학생 상세정보', await snap());
  },
});
sc({
  id: 'H4', app: 'home-ui', role: 'parent', hash: '/mypage/registrations/students/1/settings', form: '[data-p19-form="settings"]',
  async run({ snap }) {
    const s = await snap();
    ok('H4 학생 쪽지설정: data-input-fill 표시', s?.marked);
    ok('H4 학생 쪽지설정: (b) 라디오·체크 표시 없음', s && s.rows.length > 0 && s.rows.filter((r) => r.skip).every((r) => r.fill == null));
  },
});
sc({
  id: 'H5', app: 'home-ui', role: 'parent', hash: '/mypage/account', form: '[data-form="change-display-name"]',
  async run({ page, snap, one }) {
    const nameForm = await snap();
    const pwForm = await page.evaluate(() => window.__fillSnap('[data-form="change-password"]'));
    const withdraw = await page.evaluate(() => window.__fillSnap('[data-form="withdraw-account"]'));
    checkApplied('H5 계정 표시명', nameForm, { needEmpty: false });
    checkApplied('H5 계정 비밀번호', pwForm, { needFilled: false });
    ok('H5 (b) 탈퇴 폼은 표시 없음', withdraw && !withdraw.marked && withdraw.rows.every((r) => r.fill == null), JSON.stringify(withdraw?.rows));
    await page.click('[data-action="toggle-display-name"]');
    const opened = await one('#mypage-display-name');
    ok('H5 (d) 표시명 열기: 코드 대입 + 포커스 중 흰색', opened?.visible && opened.value !== '' && opened.fill === 'filled' && opened.bg === WHITE, JSON.stringify(opened));
    await page.evaluate(() => document.querySelector('#mypage-display-name').blur());
    const blurred = await one('#mypage-display-name');
    ok('H5 표시명 포커스 해제 → 회색', blurred?.bg === GRAY, JSON.stringify(blurred));
  },
});
sc({
  id: 'H6', app: 'home-ui', role: 'tutor', hash: '/mypage/registrations/tutors/1/basic', form: '[data-p21-form="basic"]',
  async run({ snap }) {
    checkApplied('H6 과외 마이 기본정보', await snap(), { needEmpty: false });
  },
});
sc({
  id: 'H7', app: 'home-ui', role: 'tutor', hash: '/mypage/registrations/tutors/1/detail', form: '[data-p21-form="detail"]',
  async run({ page, snap, one }) {
    const s = await snap();
    checkApplied('H7 과외 마이 상세정보', s);
    ok('H7 (M6) p19-select 칸이 있다', s?.rows.some((r) => r.p19select));
    const sel = '[data-p21-form="detail"] select.p19-select';
    await page.selectOption(sel, { index: 1 });
    const row = await one(sel);
    ok('H7 (M6) p19-select 고른 뒤 회색 + 화살표 유지', row?.bg === GRAY && row.img !== 'none', JSON.stringify(row));
  },
});
sc({
  id: 'H8', app: 'home-ui', role: 'study_room', hash: '/mypage/registrations/study-rooms/1/basic?edit=1', form: '[data-form="basic-all"]',
  async run({ page, snap, one, wait }) {
    checkApplied('H8 공부방 마이 기본 수정', await snap());
    await page.click('[data-form="basic-all"] [data-address-search="business"]');
    await wait(() => document.querySelector('[data-form="basic-all"] [name="address_text"]')?.value);
    const addr = await one('[data-form="basic-all"] [name="address_text"]');
    const promo = await one('[data-form="basic-all"] [data-region-slot="0"] [data-field="dong_query"]');
    ok('H8 (c)(d) 개설주소·홍보1 대입 뒤 회색', addr?.bg === GRAY && promo?.fill === 'filled' && promo.bg === GRAY, JSON.stringify({ addr, promo }));
  },
});
sc({
  id: 'H9', app: 'home-ui', role: 'study_room', hash: '/mypage/registrations/study-rooms/1/detail?edit=1', form: '[data-form="lesson"]',
  async run({ snap }) {
    checkApplied('H9 공부방 마이 상세1', await snap());
  },
});
sc({
  id: 'H10', app: 'home-ui', role: 'study_room', hash: '/mypage/registrations/study-rooms/1/detail2?edit=1', form: '[data-form="facility"]',
  async run({ snap }) {
    checkApplied('H10 공부방 마이 상세2', await snap());
  },
});
sc({
  id: 'H11', app: 'home-ui', role: 'study_room', hash: '/mypage/registrations/study-rooms/1/publish', form: null,
  waitFor: '[data-rc-page]',
  async run({ page, one }) {
    // 현재 등록점검 화면은 서랍 여는 버튼을 그리지 않는다(b0b7f46). 버튼을 넣고 실제 bindRegistrationCheckEvents 로 연다.
    // vite-node 가 함수 안 import() 를 바꾸므로 문자열로 넘긴다.
    const opened = async (field) => {
      await page.evaluate(`(async () => {
        document.querySelector('[data-rc-drawer]')?.remove();
        const pageEl = document.querySelector('[data-rc-page]');
        pageEl.querySelectorAll('[data-rc-light]').forEach((b) => b.remove());
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-rc-light', ${JSON.stringify(field)});
        pageEl.appendChild(btn);
        const mod = await import('/src/study-room-reg/registration-check-edit.js');
        mod.bindRegistrationCheckEvents(pageEl.parentElement, () => {});
        btn.click();
      })()`);
      await page.waitForSelector('[data-rc-drawer-form]', { timeout: 5000 }).catch(() => {});
      return page.evaluate(() => window.__fillSnap('[data-rc-drawer-form]'));
    };
    checkApplied('H11 등록점검 서랍(한 줄 소개)', await opened('intro_short'), { needEmpty: false });
    checkApplied('H11 등록점검 서랍(수업시간)', await opened('minutes_per_lesson'), { needFilled: false });
    await page.selectOption('[data-rc-drawer-form] select', { index: 1 });
    const row = await one('[data-rc-drawer-form] select');
    ok('H11 등록점검 서랍: 선택하면 회색', row?.fill === 'filled' && row.bg === GRAY, JSON.stringify(row));
  },
});
sc({
  id: 'HX', app: 'home-ui', role: 'parent', hash: '/guest', form: null, excluded: true,
  async run({ page, doc }) {
    const routes = [
      ['parent', '/guest', '홈·찾기 필터'],
      ['parent', '/community', '게시판'],
      ['parent', '/support', '고객센터'],
      ['parent', '/plans', '상품'],
      ['parent', '/mypage/messages', '쪽지'],
    ];
    for (const [, h, label] of routes) {
      await page.evaluate((x) => { location.hash = x; }, h);
      await page.waitForTimeout(900);
      const d = await doc();
      ok(`HX (b) 제외 ${label} ${h}: 표시 없음 (칸 ${d.controls})`, d.marked === 0 && d.fills === 0, JSON.stringify(d));
    }
  },
});
sc({
  id: 'HA', app: 'home-ui', role: 'admin', hash: '/admin', form: null, excluded: true,
  async run({ page, doc }) {
    await page.waitForTimeout(900);
    const d = await doc();
    ok(`HA (b) 제외 관리자 /admin: 표시 없음 (칸 ${d.controls})`, d.marked === 0 && d.fills === 0, JSON.stringify(d));
  },
});

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

const selected = SCENARIOS.filter((s) => !ONLY || ONLY.has(s.id));
if (selected.length) {
  console.log('##### 2부 실제 렌더 #####');
  const homeRequire = createRequire(join(ROOT, 'preview', 'home-ui', 'package.json'));
  const viteDir = dirname(homeRequire.resolve('vite/package.json'));
  const { createServer } = await import(pathToFileURL(join(viteDir, 'dist', 'node', 'index.js')).href);
  const { chromium } = createRequire(join(ROOT, 'package.json'))('playwright');
  const servers = new Map();
  let browser = null;
  try {
    browser = await launchChromium(chromium);
    for (const s of selected) {
      if (!servers.has(s.app)) {
        const server = await createServer({
          root: join(ROOT, 'preview', s.app),
          configFile: join(ROOT, 'preview', s.app, 'vite.config.js'),
          logLevel: 'error',
          clearScreen: false,
          server: { port: 5300 + servers.size * 7, strictPort: false, host: '127.0.0.1', hmr: false, open: false },
        });
        await server.listen();
        servers.set(s.app, { server, origin: `http://127.0.0.1:${server.httpServer.address().port}` });
      }
      const { origin } = servers.get(s.app);
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await context.addInitScript(PAGE_HELPERS);
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', (e) => pageErrors.push(String(e?.message || e)));
      let acceptDialogs = false;
      page.on('dialog', (d) => (acceptDialogs ? d.accept() : d.dismiss()).catch(() => {}));
      await page.route('**/*', async (route) => {
        const u = new URL(route.request().url());
        if (u.origin !== origin) return route.abort();
        if (!u.pathname.startsWith('/api/')) return route.continue();
        let body = null;
        try {
          body = JSON.parse(route.request().postData() || 'null');
        } catch {
          body = null;
        }
        if (!body && u.searchParams.get('action')) body = { action: u.searchParams.get('action') };
        const out = apiAnswer(s, u, body);
        const delayMe = Number(s.delayMeMs) || 0;
        if (delayMe > 0 && u.pathname.endsWith('/api/auth/me.php')) {
          await new Promise((resolve) => setTimeout(resolve, delayMe));
        }
        return route.fulfill({ status: out ? 200 : 404, contentType: 'application/json', body: JSON.stringify(out || { ok: false, message: 'nf' }) });
      });
      try {
        await page.goto(`${origin}/#${s.hash}`);
        const waitSel = s.waitFor || s.form;
        if (waitSel) await page.waitForSelector(waitSel, { timeout: 20000, state: 'attached' }).catch(() => {});
        else await page.waitForSelector('#app *', { timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(400);
        const helpers = {
          page,
          acceptDialogs(on) {
            acceptDialogs = on;
          },
          snap: () => page.evaluate((sel) => window.__fillSnap(sel), s.form),
          one: (sel) => page.evaluate((x) => window.__fillOne(x), sel),
          doc: () => page.evaluate(() => window.__fillDoc()),
          wait: (fn, arg) => page.waitForFunction(fn, arg, { timeout: 5000 }).catch(() => null),
          async focusCheck(label, sel) {
            await page.focus(sel);
            const f = await helpers.one(sel);
            ok(`${label}: (a) 값 있는 칸 포커스 중 흰색`, f?.fill === 'filled' && f.focused && f.bg === WHITE, JSON.stringify(f));
            await page.evaluate((x) => document.querySelector(x).blur(), sel);
            const b = await helpers.one(sel);
            ok(`${label}: (a) 포커스 해제 → 회색`, b?.fill === 'filled' && b.bg === GRAY, JSON.stringify(b));
          },
          async typeCheck(label, sel, text = '입력값') {
            await page.fill(sel, text);
            await page.evaluate((x) => document.querySelector(x).blur(), sel);
            const t = await helpers.one(sel);
            ok(`${label}: (a) 입력하고 빠지면 회색`, t?.fill === 'filled' && t.bg === GRAY, JSON.stringify(t));
            await page.fill(sel, '');
            await page.evaluate((x) => document.querySelector(x).blur(), sel);
            const e = await helpers.one(sel);
            ok(`${label}: (a) 지우면 흰색`, e?.fill === 'empty' && e.bg === WHITE, JSON.stringify(e));
          },
          async disabledCheck(label, sel, value) {
            const res = await page.evaluate(
              ({ x, v }) => {
                const el = document.querySelector(x);
                if (!el) return null;
                if (v != null) {
                  el.value = v;
                  el.dispatchEvent(new Event('input', { bubbles: true }));
                }
                const enabledBg = getComputedStyle(el).backgroundColor;
                el.disabled = true;
                const disabledBg = getComputedStyle(el).backgroundColor;
                const form = el.closest('[data-input-fill]');
                form?.removeAttribute('data-input-fill');
                const ruleOffBg = getComputedStyle(el).backgroundColor;
                form?.setAttribute('data-input-fill', '');
                el.disabled = false;
                return { fill: el.getAttribute('data-fill'), enabledBg, disabledBg, ruleOffBg };
              },
              { x: sel, v: value ?? null },
            );
            ok(
              `${label}: (f) 값 있는 칸을 disabled 로 → 규칙 밖(흰색 유지)`,
              res?.fill === 'filled' && res.enabledBg === GRAY && res.disabledBg === res.ruleOffBg && res.disabledBg === WHITE,
              JSON.stringify(res),
            );
          },
          async ruleOffCheck(label) {
            const rows = (await helpers.snap()).rows;
            const off = await page.evaluate((sel) => window.__fillRuleOff(sel), s.form);
            const dis = rows.map((r, i) => ({ ...r, off: off[i] })).filter((r) => r.disabled && !r.skip);
            ok(
              `${label}: (f) disabled 칸 배경은 규칙과 무관 (${dis.length})`,
              dis.length > 0 && dis.every((r) => r.bg === r.off),
              dis.map((r) => `${r.key}:${r.bg}/${r.off}`).join(','),
            );
          },
        };
        try {
          await s.run(helpers);
        } catch (err) {
          ok(`${s.id} 시나리오 실행`, false, String(err?.message || err).split('\n')[0]);
        }
        if (!s.excluded && s.form) {
          const d = await helpers.doc();
          const formFills = await page.evaluate(() => [...document.querySelectorAll('[data-fill]')].filter((el) => !el.closest('[data-input-fill]')).length);
          ok(`${s.id} (b) 적용 폼 밖 data-fill 없음`, formFills === 0 && d.marked >= 1, JSON.stringify({ formFills, ...d }));
        }
        ok(`${s.id} 페이지 오류 없음`, pageErrors.length === 0, pageErrors.join(' | '));
      } finally {
        await context.close();
      }
    }
  } finally {
    if (browser) await browser.close();
    for (const { server } of servers.values()) await server.close();
  }
}

/* ───────────── 3부 변이(실제 소스 되돌림 · 새 프로세스) ───────────── */
if (!IS_CHILD) {
  console.log('##### 3부 변이 #####');
  const headOf = (file) => {
    const r = spawnSync('git', ['show', `HEAD:${file}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    if (r.status !== 0) throw new Error(`git show 실패: ${file}`);
    return r.stdout;
  };
  const MUTATIONS = [
    {
      name: 'tutor-reg/screens.js 를 HEAD 로 되돌림(인라인 배경 칠하기)',
      file: 'preview/home-ui/src/tutor-reg/screens.js',
      make: (src, file) => headOf(file),
      only: 'H6',
      expect: ['H6 과외 마이 기본정보: data-input-fill 표시'],
    },
    {
      name: 'study-room-basic-form.js 를 HEAD 로 되돌림(주소·홍보1 대입 뒤 refresh 없음)',
      file: 'preview/shared/study-room-basic-form.js',
      make: (src, file) => headOf(file),
      only: 'S1',
      expect: ['S1 (c)(d) 주소검색 대입 뒤 readonly 개설주소 회색', 'S1 (d) 홍보1 자동 채움 회색'],
    },
    {
      name: 'signup-form.js 카카오 콜백의 refreshInputFill 한 줄 제거',
      file: 'preview/auth-ui/src/screens/signup-form.js',
      make: (src) => {
        const line = /^[ \t]*refreshInputFill\(form\);\r?\n/gm;
        if ((src.match(line) || []).length !== 1) throw new Error('대상 줄이 정확히 1개가 아님');
        return src.replace(line, '');
      },
      only: 'A1',
      expect: ['A1 (c)(d) 카카오 주소 확정 뒤 readonly 주소 회색'],
    },
    {
      name: 'study-room-ui register.css 를 HEAD 로 되돌림(readonly #fff7ee)',
      file: 'preview/study-room-ui/src/styles/register.css',
      make: (src, file) => headOf(file),
      only: 'S1',
      expect: ['S1 (c) readonly 개설주소 빈칸 흰색'],
    },
    {
      name: 'input-fill.css 포커스 처리 제거(채움 :not(:focus) + :focus 흰색 선택자)',
      file: 'preview/shared/input-fill.css',
      make: (src) => {
        const focusSel = /,\r?\n\[data-input-fill\] :is\(input, select, textarea\)\[data-fill\]:focus:not\(:disabled\)/;
        if (!src.includes(':not(:disabled):not(:focus)') || !focusSel.test(src)) throw new Error('대상 없음');
        return src.replace(':not(:disabled):not(:focus)', ':not(:disabled)').replace(focusSel, '');
      },
      only: 'T1',
      expect: ['T1 과외 등록 기본: (a) 값 있는 칸 포커스 중 흰색'],
    },
    {
      name: 'input-fill.css 채움 규칙에서 :not(:disabled) 제거',
      file: 'preview/shared/input-fill.css',
      make: (src) => {
        if (!src.includes("[data-fill='filled']:not(:disabled):not(:focus)")) throw new Error('대상 없음');
        return src.replace("[data-fill='filled']:not(:disabled):not(:focus)", "[data-fill='filled']:not(:focus)");
      },
      only: 'T4',
      expect: ['T4 과외 등록 상세: (f) 값 있는 칸을 disabled 로'],
    },
  ];
  for (const m of MUTATIONS) {
    const full = join(ROOT, m.file);
    const original = readFileSync(full, 'utf8');
    let child = null;
    let mutatedOk = false;
    try {
      const mutated = m.make(original, m.file);
      mutatedOk = mutated !== original;
      writeFileSync(full, mutated, 'utf8');
      child = spawnSync(process.execPath, [SCRIPT, `--only=${m.only}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 300000 });
    } catch (e) {
      ok(`변이 준비: ${m.name}`, false, String(e?.message || e));
    } finally {
      writeFileSync(full, original, 'utf8');
    }
    const restored = readFileSync(full, 'utf8') === original;
    const out = `${child?.stdout || ''}\n${child?.stderr || ''}`;
    const missing = m.expect.filter((label) => !out.includes(`FAIL  ${label}`));
    ok(
      `변이 잡음: ${m.name}`,
      mutatedOk && child && child.status !== 0 && missing.length === 0,
      `status=${child?.status} missing=${missing.join(' / ')} ${out.split('\n').filter((l) => l.startsWith('FAIL')).slice(0, 4).join(' | ')}`,
    );
    ok(`변이 복구 확인: ${m.file}`, restored);
  }
  const clean = spawnSync(process.execPath, [SCRIPT, '--only=T1,T4,S1,A1,H6,H7'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 300000 });
  ok('복구 뒤 새 프로세스 재실행 통과', clean.status === 0, (clean.stdout || '').split('\n').filter((l) => l.startsWith('FAIL')).join(' | '));
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
