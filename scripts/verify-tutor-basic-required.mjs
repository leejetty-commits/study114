/**
 * 과외쌤 기본정보 필수 = 베이직카드 항목 (2026-10-09, 정본 73 2절)
 *
 *   npx vite-node scripts/verify-tutor-basic-required.mjs [--ref <commit>]
 *
 * 1부 정적 검사: 현재 작업트리와 --ref(기본 HEAD 와 origin/main 의 merge-base) 를 같은 항목으로 비교해 전/후 표를 찍는다.
 *     실패 판정은 "후"만. "전"은 무엇이 바뀌었는지 보이는 용도.
 * 2부 동작 검사(현재만): 공용 목록 · 등록점검 보드 · 공개 판정 · PHP/JS 목록 일치.
 */
import './verify-dom-storage-shim.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

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

const BASIC_KEYS = [
  'display_name',
  'primary_region',
  'school_level',
  'main_subject',
  'fee',
  'lessons_per_week',
  'minutes',
  'lesson_places',
  'student_gender_group',
  'student_count_group',
  'feature_1',
  'slogan',
  'profile_image',
];

/** 기본정보 화면이 보내는 입력 이름 (지역·사진·표시명·주력과목 제외) */
const MOVED_INPUTS = [
  'school_level',
  'preferred_fee_amount',
  'lessons_per_week',
  'minutes_per_lesson',
  'lesson_places',
  'student_gender_group',
  'student_count_group',
  'feature_1',
  'slogan',
];
/** 상세 화면에서 빠져야 하는 입력 (대상 select 는 추가 과목 행에 school_level 이 남아 있어 제외) */
const DETAIL_GONE = MOVED_INPUTS.filter((n) => n !== 'school_level' && n !== 'slogan');

function readWork(rel) {
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
  const next = rest.slice(1).search(/\n(?:export )?(?:async )?function \w+\(/);
  return next < 0 ? rest : rest.slice(0, next + 1);
}

/** PHP `private function name(` 본문 */
function phpFn(src, name) {
  const m = new RegExp(`function ${name}\\(`).exec(src);
  if (!m) return '';
  const rest = src.slice(m.index);
  const next = rest.slice(1).search(/\n\s+(?:public|private|protected)(?: static)? function /);
  return next < 0 ? rest : rest.slice(0, next + 1);
}

const hasInput = (src, name) =>
  src.includes(`name="${name}"`) || src.includes(`radios('${name}'`) || src.includes(`id="${name}" name="${name}"`);

function staticChecks(read) {
  const signup = read('preview/auth-ui/src/screens/signup-basic.js');
  const signupTutor = fnBody(signup, 'renderTutorBasic');
  const screens = read('preview/home-ui/src/tutor-reg/screens.js');
  const basicForm = fnBody(screens, 'renderBasicForm');
  const detailForm = fnBody(screens, 'renderDetailForm');
  const inline = read('preview/home-ui/src/tutor-reg/inline-save.js');
  const stepBasic = read('preview/tutor-ui/src/screens/step-basic.js');
  const stepLesson = read('preview/tutor-ui/src/screens/step-lesson.js');
  const stepDetail = read('preview/tutor-ui/src/screens/step-detail.js');
  const stepContact = read('preview/tutor-ui/src/screens/step-contact.js');
  const state = read('preview/tutor-ui/src/state.js');
  const collect = read('preview/tutor-ui/src/form-collect.js');
  const store = read('preview/home-ui/src/tutor-reg/store.js');
  const rcCopy = read('preview/home-ui/src/tutor-reg/registration-check-copy.js');
  const rcModel = read('preview/home-ui/src/tutor-reg/registration-check-model.js');
  const basicReg = read('src/Auth/BasicRegisterService.php');
  const regSvc = read('src/Tutor/TutorRegisterService.php');
  const hubSvc = read('src/Registration/TutorHubService.php');
  const imgSvc = read('src/Media/TutorProfileImageService.php');
  const registerState = (/export const registerState = \{[\s\S]*?\n\};/.exec(state) || [''])[0];

  return [
    // —— 화면: 기본정보 3곳에 필수로
    ['S1', '공용 목록 preview/shared/tutor-basic-fields.js', !!read('preview/shared/tutor-basic-fields.js')],
    ['S2', '공용 목록 src/Tutor/TutorBasicFields.php', !!read('src/Tutor/TutorBasicFields.php')],
    ...MOVED_INPUTS.map((n) => [
      `S3.${n}`,
      `가입 renderTutorBasic: ${n} 입력`,
      hasInput(signupTutor, n),
    ]),
    ['S3.photo', '가입 renderTutorBasic: 프로필 사진 칸', signupTutor.includes('data-tutor-signup-photo')],
    ['S3.req', '가입 renderTutorBasic: 필수 표시 = 지역 제외 13칸 이상', (signupTutor.match(/form-label--required/g) || []).length >= 12],
    ...BASIC_KEYS.map((k) => [
      `S4.${k}`,
      `마이페이지 renderBasicForm: data-trc-field="${k}"`,
      basicForm.includes(`data-trc-field="${k}"`),
    ]),
    ...MOVED_INPUTS.map((n) => [`S5.${n}`, `tutor-ui step-basic: ${n} 입력`, hasInput(stepBasic, n)]),
    ['S5.photo', 'tutor-ui step-basic: 프로필 사진 칸', stepBasic.includes('data-tutor-basic-photo')],
    // —— 상세 화면에서 빠짐
    ...DETAIL_GONE.map((n) => [`S6.${n}`, `tutor-ui step-lesson: ${n} 없음`, !hasInput(stepLesson, n)]),
    ...DETAIL_GONE.map((n) => [`S7.${n}`, `tutor-ui step-detail: ${n} 없음`, !hasInput(stepDetail, n)]),
    ['S8', 'tutor-ui step-contact: 특징 1 없음', !hasInput(stepContact, 'feature_1')],
    ...DETAIL_GONE.map((n) => [`S9.${n}`, `마이페이지 renderDetailForm: ${n} 입력 없음`, !hasInput(detailForm, n)]),
    ['S9.photo', '마이페이지 renderDetailForm: 프로필 사진 없음', !detailForm.includes('data-trc-field="profile_image"')],
    // —— 미리 채운 값 없음
    ['S10.gender', "registerState student_gender_group 기본값 ''", /student_gender_group: ''/.test(registerState)],
    ['S10.count', "registerState student_count_group 기본값 ''", /student_count_group: ''/.test(registerState)],
    ['S10.level', "registerState school_level 기본값 ''", /school_level: ''/.test(registerState)],
    ['S10.basis', "registerState fee_basis_type 기본값 ''", /fee_basis_type: ''/.test(registerState)],
    ['S10.img', 'registerState images 가짜 사진 없음', /images: \[\]/.test(registerState)],
    [
      'S10.sync',
      "TutorRegisterService 'middle' 대체값 없음(학교급 목록 줄 제외)",
      !regSvc.split('\n').some((l) => l.includes("'middle'") && !l.includes("'preschool'")),
    ],
    ['S10.collect', "form-collect 산정방식 기본값 없음", !/fee_basis_type'\) \?\? 'monthly/.test(collect)],
    // —— 서버 검사
    ['S11', '가입 기본등록: TutorBasicFields::normalizeInput', basicReg.includes('TutorBasicFields::normalizeInput')],
    ['S12', '마이페이지 basic 저장: TutorBasicFields::normalizeInput', phpFn(regSvc, 'saveBasic').includes('TutorBasicFields::normalizeInput')],
    ['S13', '공개 판정 publishMissing: TutorBasicFields::missingForTutor', hubSvc.includes('TutorBasicFields::missingForTutor')],
    ['S14', '성별 동기화는 gender 가 왔을 때만', /isset\(\$input\['gender'\]\)/.test(regSvc)],
    ['S15', 'saveCareer 특징 1 안 씀', !phpFn(regSvc, 'saveCareer').includes("'feature_1'")],
    // —— C4: 지역은 바꿨을 때만
    ['C4.a', "inline-save: regions 단계 따로 안 보냄", !/step: 'regions'|'regions'\s*,/.test(fnBody(inline, 'saveTutorBasicInline'))],
    ['C4.b', 'saveBasic: saved_regions 있을 때만 지역 검사', phpFn(regSvc, 'saveBasic').includes("array_key_exists('saved_regions'")],
    ['C4.c', 'persistTutorBasicForm: 지역 dirty 표시', fnBody(screens, 'persistTutorBasicForm').includes('p21RegionsDirty')],
    // —— 사진
    ['P1', '가입 사진: 기존 업로드 API(uploadTutorProfilePhotoApi)', signup.includes('uploadTutorProfilePhotoApi')],
    ['P2', 'tutor-ui 사진: 기존 업로드 API', stepBasic.includes('uploadTutorProfilePhotoApi')],
    ['P3', '마지막 사진 삭제 막음(서버)', imgSvc.includes('1장은 남겨야')],
    // —— 등록점검 · 공개 판정 = 한 목록
    ['R1', '등록점검 copy: TUTOR_BASIC_FIELD_KEYS', rcCopy.includes('TUTOR_BASIC_FIELD_KEYS')],
    ['R2', '등록점검 model: tutorBasicOkMap', rcModel.includes('tutorBasicOkMap')],
    ['R3', '공개 판정 store: tutorBasicMissing', store.includes('tutorBasicMissing')],
  ];
}

function invariantChecks() {
  const same = (rel, pick = (s) => s) => pick(readWork(rel)) === pick(readRef(rel)) && readRef(rel) !== '';
  const pickIds = (s) => (/export const TRC_PICK_FIELD_IDS = [^\n]+/.exec(s) || [''])[0];
  const primeIds = (s) => (/export const TRC_PRIME_FIELD_IDS = [^\n]+/.exec(s) || [''])[0];
  const copy = 'preview/home-ui/src/tutor-reg/registration-check-copy.js';
  return [
    ['I1', '과외지역 단위 TutorRegionUnit.php 그대로', same('src/Region/TutorRegionUnit.php')],
    ['I2', '픽 조건 TRC_PICK_FIELD_IDS 그대로', same(copy, pickIds)],
    ['I3', '프라임 조건 TRC_PRIME_FIELD_IDS 그대로', same(copy, primeIds)],
    ['I4', 'sql/schema 새 파일 없음', gitDiffNames('sql/').length === 0],
    ['I5', '학생·공부방 화면 안 건드림', gitDiffNames('preview/home-ui/src/study-room', 'preview/home-ui/src/student', 'preview/auth-ui/src/screens/signup-student.js').length === 0],
  ];
}

function gitDiffNames(...paths) {
  try {
    const tracked = execFileSync('git', ['diff', '--name-only', REF, '--', ...paths], { cwd: root, encoding: 'utf8' });
    const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', ...paths], { cwd: root, encoding: 'utf8' });
    return `${tracked}\n${untracked}`.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {
    return ['(git diff 실패)'];
  }
}

let failed = 0;
const mark = (b) => (b ? 'O' : 'X');

console.log(`##### 1부 정적 검사 (전 = ${REF} · 후 = 작업트리) #####`);
const after = staticChecks(readWork);
const before = new Map(staticChecks(readRef).map(([id, , ok]) => [id, ok]));
let beforePass = 0;
let afterPass = 0;
for (const [id, label, ok] of after) {
  const b = before.get(id);
  if (b) beforePass += 1;
  if (ok) afterPass += 1;
  else failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  [전 ${mark(b)} → 후 ${mark(ok)}] ${id} ${label}`);
}
console.log(`정적 ${after.length}항목: 전 ${beforePass} 통과 → 후 ${afterPass} 통과`);

console.log(`\n##### 바뀌면 안 되는 것 (${REF} 대비) #####`);
for (const [id, label, ok] of invariantChecks()) {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id} ${label}`);
}

console.log('\n##### 2부 동작 검사 (작업트리) #####');
const assert = (ok, msg) => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
};

const shared = await import('../preview/shared/tutor-basic-fields.js');
const { TUTOR_BASIC_FIELDS, TUTOR_BASIC_FIELD_KEYS, tutorBasicMissing, tutorBasicOkMap, tutorBasicValuesFromRecord, tutorBasicValuesFromRegisterTutor } = shared;

assert(TUTOR_BASIC_FIELD_KEYS.join(',') === BASIC_KEYS.join(','), 'JS 공용 목록 13키·순서');
assert(!TUTOR_BASIC_FIELD_KEYS.includes('gender'), '성별 제외');
assert(!TUTOR_BASIC_FIELD_KEYS.some((k) => /region_2|region_3|secondary/.test(k)), '과외지역 2·3번 목록에 없음(선택)');

const php = readWork('src/Tutor/TutorBasicFields.php');
const phpLabels = [...(/LABELS = \[([\s\S]*?)\];/.exec(php)?.[1] || '').matchAll(/'(\w+)'\s*=>\s*'([^']+)'/g)].map((m) => [m[1], m[2]]);
assert(
  JSON.stringify(phpLabels) === JSON.stringify(TUTOR_BASIC_FIELDS.map((f) => [f.key, f.label])),
  'PHP TutorBasicFields::LABELS = JS TUTOR_BASIC_FIELDS (키·라벨·순서)',
);
const optVals = (list) => list.map((o) => o.value);
const phpList = (name) => (new RegExp(`${name} = \\[([^\\]]*)\\]`).exec(php)?.[1] || '').match(/'(\w+)'/g)?.map((s) => s.slice(1, -1)) || [];
assert(JSON.stringify(phpList('SCHOOL_LEVELS')) === JSON.stringify(shared.TUTOR_SCHOOL_LEVEL_CODES), 'PHP SCHOOL_LEVELS = JS TUTOR_SCHOOL_LEVEL_CODES');
assert(JSON.stringify(phpList('LESSON_PLACES')) === JSON.stringify(optVals(shared.TUTOR_PLACE_OPTIONS)), 'PHP LESSON_PLACES = JS TUTOR_PLACE_OPTIONS');
assert(JSON.stringify(phpList('GENDER_GROUPS')) === JSON.stringify(optVals(shared.GENDER_GROUP_OPTIONS)), 'PHP GENDER_GROUPS = JS GENDER_GROUP_OPTIONS');
assert(JSON.stringify(phpList('COUNT_GROUPS')) === JSON.stringify(optVals(shared.STUDENT_COUNT_OPTIONS)), 'PHP COUNT_GROUPS = JS STUDENT_COUNT_OPTIONS');

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
  lesson_places: ['student_home_visit'],
  student_gender_group: 'mixed',
  student_count_group: 'solo',
  feature_1: '내신 대비',
  slogan: '꾸준히 함께',
  has_profile_image: true,
  profile_images: [{ path: '/x.jpg' }],
  detail_completion_status: 'expanded_complete',
  intro_short: '소개',
  fee_basis_type: 'monthly_by_weekly_schedule',
  university_name: '서울대학교',
};

assert(tutorBasicMissing({}).length === 13, '빈 값 → 13항목 모두 빠짐');
assert(tutorBasicMissing(tutorBasicValuesFromRecord(FULL)).length === 0, '다 채운 레코드 → 빠진 항목 없음');
assert(tutorBasicOkMap({ lessons_per_week: '0' }).lessons_per_week === false, '주 회수 0 → 미충족');
assert(tutorBasicOkMap({ student_gender_group: 'x' }).student_gender_group === false, '목록 밖 값 → 미충족');
assert(tutorBasicOkMap({ feature_1: 'a'.repeat(101) }).feature_1 === false, '특징 1 100자 초과 → 미충족');
assert(
  tutorBasicMissing(
    tutorBasicValuesFromRegisterTutor({ saved_regions: [{ region_id: '' }, { region_id: '12' }], images: [] }),
  ).includes('과외지역 1'),
  '지역 2번만 있고 1번 없음 → 과외지역 1 빠짐',
);
assert(
  !tutorBasicMissing(tutorBasicValuesFromRegisterTutor({ saved_regions: [{ region_id: '5' }, { region_id: '' }, { region_id: '' }] })).includes('과외지역 1'),
  '지역 1번만 → 과외지역 1 충족(2·3 선택)',
);

const { buildTutorRegistrationCheckModel } = await import('../preview/home-ui/src/tutor-reg/registration-check-model.js');
const { getPublishReadiness } = await import('../preview/home-ui/src/tutor-reg/store.js');

const labelOf = Object.fromEntries(TUTOR_BASIC_FIELDS.map((f) => [f.key, f.label]));
for (const drop of [null, ...BASIC_KEYS]) {
  const t = { ...FULL };
  if (drop === 'display_name') t.tutor_display_name = '';
  if (drop === 'primary_region') t.has_primary_region = false;
  if (drop === 'school_level') t.school_level = '';
  if (drop === 'main_subject') t.main_subject_note = '';
  if (drop === 'fee') t.preferred_fee_amount = 0;
  if (drop === 'lessons_per_week') t.lessons_per_week = 0;
  if (drop === 'minutes') t.minutes_per_lesson = 0;
  if (drop === 'lesson_places') t.lesson_places = [];
  if (drop === 'student_gender_group') t.student_gender_group = '';
  if (drop === 'student_count_group') t.student_count_group = '';
  if (drop === 'feature_1') t.feature_1 = '';
  if (drop === 'slogan') t.slogan = '';
  if (drop === 'profile_image') t.has_profile_image = false;
  const readiness = getPublishReadiness(t);
  const model = buildTutorRegistrationCheckModel(t, readiness);
  const basicRows = model.board.find((s) => s.id === 'basic')?.rows || [];
  const boardEmpty = basicRows.filter((r) => r.status === 'empty').map((r) => r.id);
  const readinessBasicMiss = readiness.missing.filter((m) => Object.values(labelOf).includes(m));
  const want = drop ? [drop] : [];
  const tag = drop || '없음';
  assert(basicRows.map((r) => r.id).join(',') === BASIC_KEYS.join(','), `빼기 ${tag}: 보드 기본 행 = 공용 목록`);
  assert(JSON.stringify(boardEmpty) === JSON.stringify(want), `빼기 ${tag}: 보드 빈칸 = ${want.join(',') || '없음'}`);
  assert(
    JSON.stringify(readinessBasicMiss) === JSON.stringify(want.map((k) => labelOf[k])),
    `빼기 ${tag}: 공개 판정 빠진 기본 항목 = 보드와 같음`,
  );
  assert(readiness.canPublish === (drop === null), `빼기 ${tag}: 공개 가능 = ${drop === null}`);
  assert(model.counts.basicLeft === want.length, `빼기 ${tag}: Basic 배지 남은 수 = ${want.length}`);
}

console.log('\n##### PHP 동작 (php 있을 때만) #####');
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
if (!phpBin) {
  console.log('NOT RUN  php 실행 파일 없음 — scripts/verify-tutor-basic-required.php 는 CI/서버에서 실행');
} else {
  try {
    const out = execFileSync(phpBin, ['scripts/verify-tutor-basic-required.php'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    process.stdout.write(out);
  } catch (e) {
    failed += 1;
    process.stdout.write(String(e.stdout || ''));
    console.log('FAIL  scripts/verify-tutor-basic-required.php');
  }
}

if (failed > 0) {
  console.error(`\nverify-tutor-basic-required FAILED (${failed})`);
  process.exit(1);
}
console.log('\nverify-tutor-basic-required OK');
