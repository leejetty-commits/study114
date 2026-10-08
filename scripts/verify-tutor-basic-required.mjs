/**
 * 과외쌤 기본등록 필수 8개 (정본 73 0절, 2026-10-09)
 *
 *   npx vite-node scripts/verify-tutor-basic-required.mjs [--ref <commit>]
 *
 * 검사 항목
 *   A. 서버: 8개 중 하나라도 빠지면 저장 거절 (scripts/verify-tutor-basic-required.php)
 *   B. 기본등록은 상세 4개(수업장소·원생수·특징·사진) 없이 통과, 상세 4개는 상세등록에서 저장
 *   C. 기본등록 화면 3곳에 「필수」 표시 없음
 *   D. 과외지역 2·3번에만 「선택」 표시
 *   E. 미리 채운 값(가짜 기본값) 없음
 *   F. 등록점검 보드·공개 판정이 같은 8개 목록
 *   G. 바뀌면 안 되는 것 (--ref, 기본 HEAD 와 origin/main 의 merge-base 대비)
 *   T. 변조 검사: 위 검사 함수에 일부러 틀린 입력을 넣어 실제로 잡는지 확인
 */
import './verify-dom-storage-shim.mjs';
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

const root = process.cwd();
const refArg = process.argv.indexOf('--ref');
function mergeBase() {
  try {
    return execFileSync('git', ['merge-base', 'HEAD', 'origin/main'], { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return 'origin/main';
  }
}
const REF = refArg > 0 ? process.argv[refArg + 1] : mergeBase();

const BASIC_KEYS = ['display_name', 'primary_region', 'school_level', 'main_subject', 'fee', 'lessons_per_week', 'minutes', 'slogan'];
/** 기본등록 화면이 받는 입력 이름 (표시명·주력과목·과외지역 제외) */
const BASIC_INPUTS = ['school_level', 'preferred_fee_amount', 'lessons_per_week', 'minutes_per_lesson', 'slogan'];
/** 상세등록 선택 항목 입력 이름 (사진은 따로) */
const DETAIL_INPUTS = ['lesson_places', 'student_gender_group', 'student_count_group', 'feature_1'];

function read(rel) {
  const p = resolve(root, rel);
  return existsSync(p) ? readFileSync(p, 'utf8').replace(/\r\n/g, '\n') : '';
}

function readRef(rel) {
  try {
    return execFileSync('git', ['show', `${REF}:${rel}`], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    }).replace(/\r\n/g, '\n');
  } catch {
    return '';
  }
}

/** `function name(` 부터 다음 최상위 function 직전까지 */
function fnBody(src, name) {
  const re = new RegExp(`(?:^|\\n)(?:export )?(?:async )?function ${name}\\(`);
  const m = re.exec(src);
  if (!m) return '';
  const rest = src.slice(m.index + 1);
  const next = rest.slice(1).search(/\n(?:export )?(?:async )?function \w+\(|\n\/\*\*/);
  return next < 0 ? rest : rest.slice(0, next + 1);
}

/** PHP `function name(` 본문 */
function phpFn(src, name) {
  const m = new RegExp(`function ${name}\\(`).exec(src);
  if (!m) return '';
  const rest = src.slice(m.index);
  const next = rest.slice(1).search(/\n\s+(?:\/\*\*|(?:public|private|protected)(?: static)? function )/);
  return next < 0 ? rest : rest.slice(0, next + 1);
}

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// —— 검사 함수 (문자열·값만 받는다. 변조 검사가 같은 함수를 쓴다)

const hasInput = (src, name) =>
  src.includes(`name="${name}"`) || src.includes(`radios('${name}'`) || src.includes(`id="${name}" name="${name}"`);

/** C: 「필수」 글자·필수 표시 클래스·reqMark 없음 */
const noRequiredMark = (src) => !/필수|form-label--required|reqMark\(|p19-required/.test(stripComments(src));

/** D: 지역 슬롯 html 3개 → 1번 제목엔 「선택」 없음, 2·3번 제목엔 있음 */
function regionLabelsOk(htmls) {
  const titles = htmls.map((h) => (/<strong>([^<]*)<\/strong>/.exec(h) || [, ''])[1]);
  return titles.length === 3 && !titles[0].includes('선택') && titles[1].includes('(선택)') && titles[2].includes('(선택)');
}

/** E: 고정 코드값으로 메우는 대체값(`?? 'mixed'`, `|| 'male'` …) 없음 */
const FAKE_DEFAULT =
  /(\?\?|\|\|)\s*'(male|female|mixed|solo|two|three|four_plus|monthly_by_weekly_schedule|monthly_by_total_sessions|middle|elementary|high|student_home_visit|public_place|tutor_home)'/;
const noFakeDefault = (src) => !FAKE_DEFAULT.test(stripComments(src));

/** E: registerState 기본값이 빈 값 */
const EMPTY_STATE_KEYS = [
  'gender',
  'tutor_display_name',
  'school_level',
  'main_subject_note',
  'preferred_fee_amount',
  'lessons_per_week',
  'minutes_per_lesson',
  'slogan',
  'student_gender_group',
  'student_count_group',
  'fee_basis_type',
  'feature_1',
];
function registerStateEmpty(stateSrc) {
  const block = (/export const registerState = \{[\s\S]*?\n\};/.exec(stateSrc) || [''])[0];
  return (
    block !== '' &&
    EMPTY_STATE_KEYS.every((k) => new RegExp(`\\n\\s+${k}: '',`).test(block)) &&
    /\n\s+lesson_places: \[\],/.test(block) &&
    /\n\s+images: \[\],/.test(block)
  );
}

/** E: 렌더된 html 에 고른 값(selected·checked) 없음 */
const noPreselected = (html) => !/<option value="[^"]+"\s+selected/.test(html) && !/\schecked(\s|>|\/)/.test(html);

/** B: 기본등록 화면에 상세 입력 없음 */
const noDetailInputs = (src) => DETAIL_INPUTS.every((n) => !hasInput(src, n)) && !/profile_image|tutor_profile_photo|PhotoEditor/.test(src);
/** B: 상세 화면에 상세 입력 있음 */
const hasDetailInputs = (src) => DETAIL_INPUTS.every((n) => hasInput(src, n));

let failed = 0;
const assert = (ok, msg) => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
};
const section = (title) => console.log(`\n##### ${title} #####`);

const files = {
  signup: read('preview/auth-ui/src/screens/signup-basic.js'),
  screens: read('preview/home-ui/src/tutor-reg/screens.js'),
  inline: read('preview/home-ui/src/tutor-reg/inline-save.js'),
  stepBasic: read('preview/tutor-ui/src/screens/step-basic.js'),
  stepLesson: read('preview/tutor-ui/src/screens/step-lesson.js'),
  stepDetail: read('preview/tutor-ui/src/screens/step-detail.js'),
  state: read('preview/tutor-ui/src/state.js'),
  collect: read('preview/tutor-ui/src/form-collect.js'),
  regionSlots: read('preview/shared/tutor-region-slots.js'),
  basicReg: read('src/Auth/BasicRegisterService.php'),
  regSvc: read('src/Tutor/TutorRegisterService.php'),
  basicPhp: read('src/Tutor/TutorBasicFields.php'),
};
const screensOf = {
  '가입 renderTutorBasic': fnBody(files.signup, 'renderTutorBasic'),
  '가입 renderMainSubjectOne': fnBody(files.signup, 'renderMainSubjectOne'),
  '마이페이지 renderBasicForm': fnBody(files.screens, 'renderBasicForm'),
  'tutor-ui renderBasic': fnBody(files.stepBasic, 'renderBasic'),
};
const detailOf = {
  '마이페이지 renderDetailForm': fnBody(files.screens, 'renderDetailForm'),
  'tutor-ui renderLesson+renderContact': fnBody(files.stepLesson, 'renderLesson') + read('preview/tutor-ui/src/screens/step-contact.js'),
  'tutor-ui renderDetail': fnBody(files.stepDetail, 'renderDetail'),
};

// ———————————————————————————————— A. 서버 거절
section('A. 서버: 8개 중 하나라도 빠지면 거절 (PHP)');
let phpBin = '';
for (const cand of [process.env.PHP_BIN, 'D:\\php8.2\\php.exe', 'php'].filter(Boolean)) {
  try {
    execFileSync(cand, ['-v'], { stdio: 'ignore' });
    phpBin = cand;
    break;
  } catch {
    /* 다음 후보 */
  }
}
function runPhp(env = {}) {
  try {
    const out = execFileSync(phpBin, ['scripts/verify-tutor-basic-required.php'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: String(e.stdout || '') + String(e.stderr || '') };
  }
}
if (!phpBin) {
  failed += 1;
  console.log('FAIL  php 실행 파일 없음 — PHP_BIN 을 지정해 주세요');
} else {
  const r = runPhp();
  process.stdout.write(r.out);
  assert(r.ok, 'scripts/verify-tutor-basic-required.php 통과');
}
assert(phpFn(files.basicReg, 'registerTutor').includes('TutorBasicFields::normalizeInput'), '가입 기본등록(registerTutor) → TutorBasicFields::normalizeInput');
assert(phpFn(files.regSvc, 'saveBasic').includes('TutorBasicFields::normalizeInput'), '마이페이지·tutor-ui basic 저장(saveBasic) → TutorBasicFields::normalizeInput');
assert(phpFn(files.basicReg, 'tutorAccountBasicComplete').includes('TutorBasicFields::missingForTutor'), '기본등록 완료 판정 → TutorBasicFields::missingForTutor');

// ———————————————————————————————— B. 상세 4개
section('B. 상세 4개(수업장소·원생수·특징·사진)는 기본등록에 없음 · 상세등록에서 저장');
for (const [name, src] of Object.entries(screensOf)) {
  if (name.includes('renderMainSubjectOne')) continue;
  assert(noDetailInputs(src), `${name}: 상세 4개 입력 없음`);
  assert(BASIC_INPUTS.every((n) => hasInput(src, n)), `${name}: 대상·월 과외비·주 회수·1회 수업시간·슬로건 입력 있음`);
}
for (const [name, src] of Object.entries(detailOf)) {
  if (name.includes('renderLesson')) {
    assert(['lesson_places', 'student_gender_group', 'student_count_group'].every((n) => hasInput(src, n)), `${name}: 수업장소·원생수 입력`);
    assert(hasInput(src, 'feature_1'), `${name}: 특징 1 입력(연락 단계)`);
  } else {
    assert(hasDetailInputs(src), `${name}: 수업장소·원생수·특징 1 입력`);
  }
}
assert(detailOf['마이페이지 renderDetailForm'].includes('renderTutorProfilePhotoEditor(tutor)'), '마이페이지 상세: 프로필 사진 편집(기존 업로드 그대로)');
assert(!files.basicReg.includes('profile-image') && !phpFn(files.regSvc, 'saveBasic').includes('tutor_images'), '서버 기본등록이 사진을 보지 않음');
assert(phpFn(files.regSvc, 'saveLesson').includes("'lesson_places'") && phpFn(files.regSvc, 'saveLesson').includes("'student_gender_group'"), '서버 상세 1(saveLesson): 수업장소·원생수 저장');
assert(phpFn(files.regSvc, 'saveCareer').includes("'feature_1'"), '서버 상세 2(saveCareer): 특징 1 저장');
assert(!existsSync(resolve(root, 'preview/shared/tutor-profile-photo.js')), '가입 단계 사진 업로드 모듈 없음(되돌림)');
assert(
  !/1장은 남겨야/.test(read('src/Media/TutorProfileImageService.php')),
  '사진 삭제 제한(마지막 1장) 없음 — 사진은 선택',
);

const { validateLessonState, payloadForStep } = await import('../preview/tutor-ui/src/form-collect.js');
const shared = await import('../preview/shared/tutor-basic-fields.js');
const { TUTOR_BASIC_FIELDS, TUTOR_BASIC_FIELD_KEYS, tutorBasicMissing, tutorBasicValuesFromRecord, tutorBasicValuesFromRegisterTutor } = shared;
const BASIC_FILLED = {
  tutor_display_name: '김쌤',
  has_primary_region: true,
  school_level: 'middle',
  main_subject_note: '수학',
  preferred_fee_amount: '400000',
  lessons_per_week: '2',
  minutes_per_lesson: '90',
  slogan: '꾸준히 함께',
};
assert(tutorBasicMissing(BASIC_FILLED).length === 0, 'JS: 8개만 채움(상세 4개 없음) → 통과');
const lessonP = payloadForStep('lesson', { fee_basis_type: 'monthly_by_weekly_schedule', lesson_places: ['public_place'], student_gender_group: 'female', student_count_group: 'two', subjects: [] });
assert(lessonP.lesson_places?.[0] === 'public_place' && lessonP.student_gender_group === 'female', 'tutor-ui lesson payload: 수업장소·원생수');
assert(payloadForStep('career', { feature_1: '내신' }).feature_1 === '내신', 'tutor-ui career payload: 특징 1');
assert(validateLessonState({ fee_basis_type: 'monthly_by_weekly_schedule', lesson_places: [], subjects: [] }) === null, 'tutor-ui 상세 1: 수업장소 비어도 통과(선택)');
const basicP = payloadForStep('basic', { ...BASIC_FILLED, lesson_places: ['public_place'], feature_1: 'x', gender: 'male', saved_regions: [] });
assert(DETAIL_INPUTS.every((k) => !(k in basicP)) && !('gender' in basicP), 'tutor-ui basic payload: 상세 4개·성별 안 보냄');

// ———————————————————————————————— C. 필수 표시
section('C. 기본등록 화면에 「필수」 표시 없음');
for (const [name, src] of Object.entries(screensOf)) {
  assert(src !== '' && noRequiredMark(src), `${name}: 「필수」·필수 표시 없음`);
}
assert(noRequiredMark(fnBody(files.regionSlots, 'renderTutorRegionSlot')), '과외지역 슬롯 renderTutorRegionSlot: 「필수」 없음');

// ———————————————————————————————— D. 선택 표시
section('D. 과외지역 2·3번에만 「선택」');
const { renderTutorRegionSlot } = await import('../preview/shared/tutor-region-slots.js');
for (const opts of [{}, { labelPrefix: '과외지역', showPrimary: false }, { namePrefix: 'p21_' }]) {
  const htmls = [0, 1, 2].map((i) => renderTutorRegionSlot({ region_id: '', is_primary: i === 0 }, i, [], opts));
  assert(regionLabelsOk(htmls), `renderTutorRegionSlot ${JSON.stringify(opts)}: 1번 「선택」 없음 · 2·3번 「(선택)」`);
}
for (const [name, src] of Object.entries(screensOf)) {
  if (name.includes('renderMainSubjectOne')) continue;
  assert(src.includes('renderTutorRegionSlot('), `${name}: 과외지역 칸 = renderTutorRegionSlot`);
}

// ———————————————————————————————— E. 미리 채우기 없음
section('E. 미리 채운 값(가짜 기본값) 없음');
assert(registerStateEmpty(files.state), 'tutor-ui registerState: 기본등록·상세 선택 항목 기본값이 빈 값, 사진 []');
const noFake = {
  'tutor-ui form-collect.js': files.collect,
  'tutor-ui step-basic.js': files.stepBasic,
  'tutor-ui step-lesson.js': files.stepLesson,
  'tutor-ui step-detail.js': files.stepDetail,
  '마이페이지 renderBasicForm': screensOf['마이페이지 renderBasicForm'],
  '마이페이지 renderDetailForm': detailOf['마이페이지 renderDetailForm'],
  '마이페이지 persistTutorBasicForm': fnBody(files.screens, 'persistTutorBasicForm'),
  '마이페이지 inline-save.js': files.inline,
  '가입 renderTutorBasic': screensOf['가입 renderTutorBasic'],
  '가입 loadIncompleteBasicDraft': fnBody(files.signup, 'loadIncompleteBasicDraft'),
  'TutorBasicFields.php': files.basicPhp,
  'TutorRegisterService::saveBasic/saveLesson/saveCareer/hydrateTutor': ['saveBasic', 'saveLesson', 'saveCareer', 'hydrateTutor'].map((n) => phpFn(files.regSvc, n)).join('\n'),
};
for (const [name, src] of Object.entries(noFake)) {
  assert(src !== '' && noFakeDefault(src), `${name}: 고정값 대체(?? / || '코드값') 없음`);
}
const hydrate = phpFn(files.regSvc, 'hydrateTutor');
for (const k of ['student_gender_group', 'student_count_group', 'fee_basis_type']) {
  assert(new RegExp(`'${k}'\\s*=> \\(string\\) \\(\\$row\\['${k}'\\] \\?\\? ''\\)`).test(hydrate), `hydrateTutor ${k} 없으면 ''`);
}
const emptyBasic = payloadForStep('basic', {
  tutor_display_name: '',
  school_level: '',
  main_subject_note: '',
  preferred_fee_amount: '',
  lessons_per_week: '',
  minutes_per_lesson: '',
  slogan: '',
  saved_regions: [],
});
assert(
  Object.entries(emptyBasic).every(([k, v]) => (k === 'saved_regions' ? Array.isArray(v) && v.length === 0 : v === '')),
  'tutor-ui basic payload: 빈 입력은 빈 값 그대로(지어내지 않음)',
);
const emptyLesson = payloadForStep('lesson', { fee_basis_type: '', student_gender_group: '', student_count_group: '', lesson_places: [], subjects: [] });
assert(emptyLesson.student_gender_group === '' && emptyLesson.student_count_group === '' && emptyLesson.fee_basis_type === '', 'tutor-ui lesson payload: 원생수·산정방식 빈 값 그대로');

let renderedBasic = '';
try {
  if (typeof globalThis.window === 'undefined') {
    const href = 'http://localhost/register/tutor/#/register/basic';
    globalThis.window = {
      location: { href, hash: '#/register/basic', search: '', pathname: '/register/tutor/', origin: 'http://localhost' },
      addEventListener() {},
      removeEventListener() {},
    };
  }
  const { renderBasic } = await import('../preview/tutor-ui/src/screens/step-basic.js');
  renderedBasic = renderBasic();
} catch (e) {
  console.log(`(tutor-ui renderBasic 렌더 실패: ${e instanceof Error ? e.message : e})`);
}
assert(renderedBasic.includes('name="slogan"'), 'tutor-ui renderBasic 렌더됨(새 등록 상태)');
assert(noPreselected(renderedBasic), 'tutor-ui renderBasic 새 등록: 고른 값(selected·checked) 없음');
assert(noRequiredMark(renderedBasic), 'tutor-ui renderBasic 렌더 html: 「필수」 없음');
const renderedSlots = [0, 1, 2].map((i) => (renderedBasic.split('data-region-slot="')[i + 1] || ''));
assert(regionLabelsOk(renderedSlots.map((s) => `<x>${s}`)), 'tutor-ui renderBasic 렌더 html: 지역 2·3번만 「(선택)」');

// ———————————————————————————————— F. 등록점검 · 공개 판정
section('F. 등록점검 보드·공개 판정 = 같은 8개 목록');
assert(TUTOR_BASIC_FIELD_KEYS.join(',') === BASIC_KEYS.join(','), 'JS 공용 목록 8키·순서');
const phpLabels = [...(/LABELS = \[([\s\S]*?)\];/.exec(files.basicPhp)?.[1] || '').matchAll(/'(\w+)'\s*=>\s*'([^']+)'/g)].map((m) => [m[1], m[2]]);
assert(JSON.stringify(phpLabels) === JSON.stringify(TUTOR_BASIC_FIELDS.map((f) => [f.key, f.label])), 'PHP LABELS = JS TUTOR_BASIC_FIELDS (키·라벨·순서)');
const phpLevels = (/SCHOOL_LEVELS = \[([^\]]*)\]/.exec(files.basicPhp)?.[1] || '').match(/'(\w+)'/g)?.map((s) => s.slice(1, -1)) || [];
assert(JSON.stringify(phpLevels) === JSON.stringify(shared.TUTOR_SCHOOL_LEVEL_CODES), 'PHP SCHOOL_LEVELS = JS TUTOR_SCHOOL_LEVEL_CODES');
assert(
  tutorBasicMissing(tutorBasicValuesFromRegisterTutor({ saved_regions: [{ region_id: '' }, { region_id: '12' }] })).includes('과외지역 1'),
  '지역 2번만 있고 1번 없음 → 과외지역 1 빠짐',
);
assert(
  !tutorBasicMissing(tutorBasicValuesFromRegisterTutor({ saved_regions: [{ region_id: '5' }, { region_id: '' }, { region_id: '' }] })).includes('과외지역 1'),
  '지역 1번만 → 과외지역 1 충족(2·3 선택)',
);

const { buildTutorRegistrationCheckModel } = await import('../preview/home-ui/src/tutor-reg/registration-check-model.js');
const { getPublishReadiness } = await import('../preview/home-ui/src/tutor-reg/store.js');
const FULL = {
  id: 7,
  tutor_display_name: '김쌤',
  has_primary_region: true,
  primary_region_label: '서울특별시',
  school_level: 'middle',
  main_subject_note: '수학',
  has_primary_subject: true,
  preferred_fee_amount: 400000,
  lessons_per_week: 2,
  minutes_per_lesson: 90,
  slogan: '꾸준히 함께',
  lesson_places: ['student_home_visit'],
  has_lesson_places: true,
  student_gender_group: 'mixed',
  student_count_group: 'solo',
  feature_1: '내신 대비',
  has_profile_image: true,
  detail_completion_status: 'expanded_complete',
  intro_short: '소개',
  fee_basis_type: 'monthly_by_weekly_schedule',
  university_name: '서울대학교',
};
const labelOf = Object.fromEntries(TUTOR_BASIC_FIELDS.map((f) => [f.key, f.label]));
const dropBasic = {
  display_name: { tutor_display_name: '' },
  primary_region: { has_primary_region: false },
  school_level: { school_level: '' },
  main_subject: { main_subject_note: '' },
  fee: { preferred_fee_amount: 0 },
  lessons_per_week: { lessons_per_week: 0 },
  minutes: { minutes_per_lesson: 0 },
  slogan: { slogan: '' },
};
for (const drop of [null, ...BASIC_KEYS]) {
  const t = { ...FULL, ...(drop ? dropBasic[drop] : {}) };
  const readiness = getPublishReadiness(t);
  const model = buildTutorRegistrationCheckModel(t, readiness);
  const basicRows = model.board.find((s) => s.id === 'basic')?.rows || [];
  const boardEmpty = basicRows.filter((r) => r.status === 'empty').map((r) => r.id);
  const readinessBasicMiss = readiness.missing.filter((m) => Object.values(labelOf).includes(m));
  const want = drop ? [drop] : [];
  const tag = drop || '없음';
  assert(basicRows.map((r) => r.id).join(',') === BASIC_KEYS.join(','), `빼기 ${tag}: 보드 기본 행 = 8개 목록`);
  assert(JSON.stringify(boardEmpty) === JSON.stringify(want), `빼기 ${tag}: 보드 빈칸 = ${want.join(',') || '없음'}`);
  assert(JSON.stringify(readinessBasicMiss) === JSON.stringify(want.map((k) => labelOf[k])), `빼기 ${tag}: 공개 판정의 빠진 기본 항목 = 보드와 같음`);
  assert(readiness.canPublish === (drop === null), `빼기 ${tag}: 공개 가능 = ${drop === null}`);
}
const dropDetail = {
  lesson_places: { lesson_places: [], has_lesson_places: false },
  원생수: { student_gender_group: '', student_count_group: '' },
  feature_1: { feature_1: '' },
  profile_image: { has_profile_image: false },
};
for (const [tag, patch] of Object.entries(dropDetail)) {
  const t = { ...FULL, ...patch };
  const model = buildTutorRegistrationCheckModel(t, getPublishReadiness(t));
  const basicRows = model.board.find((s) => s.id === 'basic')?.rows || [];
  assert(basicRows.every((r) => r.status === 'filled'), `상세 ${tag} 빠짐: 기본정보 보드는 모두 채움`);
  assert(tutorBasicMissing(tutorBasicValuesFromRecord(t)).length === 0, `상세 ${tag} 빠짐: 기본등록 필수 검사 통과`);
}

// ———————————————————————————————— G. 바뀌면 안 되는 것
section(`G. 바뀌면 안 되는 것 (${REF} 대비)`);
const same = (rel, pick = (s) => s) => readRef(rel) !== '' && pick(read(rel)) === pick(readRef(rel));
const copyRel = 'preview/home-ui/src/tutor-reg/registration-check-copy.js';
const lineOf = (name) => (s) => (new RegExp(`export const ${name} = [^\\n]+`).exec(s) || [''])[0];
function gitDiffNames(...paths) {
  try {
    const tracked = execFileSync('git', ['diff', '--name-only', REF, '--', ...paths], { cwd: root, encoding: 'utf8' });
    const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', ...paths], { cwd: root, encoding: 'utf8' });
    return `${tracked}\n${untracked}`.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {
    return ['(git diff 실패)'];
  }
}
assert(same('src/Region/TutorRegionUnit.php'), '과외지역 단위 TutorRegionUnit.php 그대로');
assert(same(copyRel, lineOf('TRC_PICK_FIELD_IDS')), '픽 조건 TRC_PICK_FIELD_IDS 그대로');
assert(same(copyRel, lineOf('TRC_PRIME_FIELD_IDS')), '프라임 조건 TRC_PRIME_FIELD_IDS 그대로');
assert(gitDiffNames('sql/').length === 0, 'sql/ 변경 없음(새 컬럼 없음)');
assert(same('src/Media/TutorProfileImageService.php'), '사진 업로드 서버 그대로');
assert(
  !Object.values(files).some((s) => s.includes('room-card-default')),
  '과외쌤 기본등록 코드가 공부방 기본 이미지(room-card-default) 안 씀',
);

// ———————————————————————————————— T. 변조 검사
section('T. 변조 검사 — 일부러 틀린 입력을 넣으면 검사가 잡아야 한다');
const tamper = (caught, msg) => assert(caught, `변조 잡음: ${msg}`);
const basicForm = screensOf['마이페이지 renderBasicForm'];
tamper(!noRequiredMark(basicForm.replace('표시명</span>', '표시명 <em class="p19-required">필수</em></span>')), '마이페이지 기본정보에 「필수」 표시 추가');
tamper(!noRequiredMark(screensOf['tutor-ui renderBasic'].replace('class="form-label" for="slogan"', 'class="form-label form-label--required" for="slogan"')), 'tutor-ui 기본등록에 form-label--required 추가');
tamper(!noRequiredMark(screensOf['가입 renderTutorBasic'].replace('과외지역 (최대 3곳)', '과외지역 (필수)')), '가입 화면에 「필수」 글자 추가');
const goodSlots = [0, 1, 2].map((i) => renderTutorRegionSlot({ region_id: '' }, i, []));
tamper(!regionLabelsOk(goodSlots.map((h) => h.replace(' (선택)', ''))), '지역 2·3번 「선택」 지움');
tamper(!regionLabelsOk([goodSlots[0].replace('</strong>', ' (선택)</strong>'), goodSlots[1], goodSlots[2]]), '지역 1번에 「선택」 붙임');
tamper(!noFakeDefault(`${files.collect}\nstate.student_gender_group = String(fd.get('student_gender_group') ?? 'mixed');`), "form-collect 에 ?? 'mixed' 대체값 추가");
tamper(!noFakeDefault(detailOf['마이페이지 renderDetailForm'].replace('tutor.student_count_group)', "tutor.student_count_group || 'solo')")), "마이페이지 상세에 || 'solo' 추가");
tamper(!noFakeDefault(hydrate.replace("['fee_basis_type'] ?? '')", "['fee_basis_type'] ?? 'monthly_by_weekly_schedule')")), '서버 hydrateTutor 산정방식 기본값 되살림');
tamper(!registerStateEmpty(files.state.replace("  school_level: '',", "  school_level: 'middle',")), "registerState school_level: 'middle'");
tamper(!registerStateEmpty(files.state.replace('  images: [],', "  images: [{ image_type: 'profile', image_path: 'profile.jpg' }],")), 'registerState 가짜 사진');
tamper(!noPreselected(renderedBasic.replace('<option value="middle"', '<option value="middle" selected')), '렌더 html 에 학교급 미리 선택');
tamper(!noDetailInputs(`${basicForm}<input type="checkbox" name="lesson_places" value="public_place" />`), '마이페이지 기본정보에 수업장소 칸 추가');
tamper(!noDetailInputs(`${screensOf['tutor-ui renderBasic']}<input id="tutor_profile_photo" type="file" />`), 'tutor-ui 기본등록에 사진 칸 추가');
tamper(!hasDetailInputs(detailOf['마이페이지 renderDetailForm'].replace('name="feature_1"', 'name="feature_x"')), '마이페이지 상세에서 특징 1 칸 지움');
tamper(
  tutorBasicMissing({ ...BASIC_FILLED, slogan: '' }).join() === '슬로건' && tutorBasicMissing({ ...BASIC_FILLED, has_primary_region: false }).join() === '과외지역 1',
  'JS 공용 검사: 슬로건·과외지역 1 빼면 그 항목만 빠짐',
);

if (phpBin) {
  const src = files.basicPhp;
  const dir = mkdtempSync(join(tmpdir(), 'tbr-tamper-'));
  const cases = [
    ['슬로건 검사를 끔', src.replace("'slogan'           => $slogan !== '',", "'slogan'           => true,")],
    ['주 회수 검사를 끔', src.replace("'lessons_per_week' => $weekly !== null,", "'lessons_per_week' => true,")],
    ['과외지역 1 검사를 끔', src.replace("'primary_region'   => $hasPrimaryRegion,", "'primary_region'   => true,")],
    ['수업장소를 기본등록 필수에 넣음', src.replace("'slogan'           => '슬로건',", "'slogan'           => '슬로건',\n        'lesson_places'    => '강의장소',")],
  ];
  try {
    for (const [label, changed] of cases) {
      if (changed === src) {
        assert(false, `변조 사본 만들기 실패(원문 줄이 바뀜): ${label}`);
        continue;
      }
      const file = join(dir, 'TutorBasicFields.php');
      writeFileSync(file, changed, 'utf8');
      const r = runPhp({ TBR_TAMPER_FILE: file });
      tamper(!r.ok && /FAIL/.test(r.out), `서버 TutorBasicFields — ${label} → PHP 검사 FAIL`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (failed > 0) {
  console.error(`\nverify-tutor-basic-required FAILED (${failed})`);
  process.exit(1);
}
console.log('\nverify-tutor-basic-required OK');
