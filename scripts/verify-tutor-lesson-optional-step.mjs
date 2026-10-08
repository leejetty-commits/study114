/**
 * tutor-ui lesson step gate — UI 선택값은 단계 이동을 막지 않음
 * validateLessonState + payloadForStep 동작 검증 (문자열 삭제 여부에만 의존하지 않음)
 *
 * 정본 73 0절(2026-10-09): 월 과외비·주 회수·1회 수업시간·주력과목은 기본등록 필수 8개라 기본 단계에서 검사.
 * 수업 단계는 산정방식(필수)·월 총 횟수·가격 설명·추가 과목, 그리고 상세 선택 항목 강의장소·원생수.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateLessonState, payloadForStep } from '../preview/tutor-ui/src/form-collect.js';
import { tutorBasicOkMap, tutorBasicMissing } from '../preview/shared/tutor-basic-fields.js';

const root = process.cwd();
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg, cond === false ? '' : `(got: ${JSON.stringify(cond)})`);
  } else {
    console.log('PASS:', msg);
  }
}

function base(overrides = {}) {
  return {
    fee_basis_type: 'monthly_by_weekly_schedule',
    monthly_session_count: '',
    fee_description: '',
    lesson_places: [],
    student_gender_group: '',
    student_count_group: '',
    subjects: [],
    ...overrides,
  };
}

// —— 1) 주간 횟수 기준: 필수만, 선택 공란 → 통과 · 기본정보 항목은 lesson payload 에 없음
{
  const state = base({ fee_basis_type: 'monthly_by_weekly_schedule', lessons_per_week: '', minutes_per_lesson: '' });
  assert(validateLessonState(state) === null, '1 weekly-basis: empty optionals pass');
  const p = payloadForStep('lesson', state);
  assert(!('lessons_per_week' in p), '1 lesson payload has no lessons_per_week (basic step)');
  assert(!('minutes_per_lesson' in p), '1 lesson payload has no minutes_per_lesson (basic step)');
  assert(!('preferred_fee_amount' in p), '1 lesson payload has no fee (basic step)');
  assert(p.fee_basis_type === 'monthly_by_weekly_schedule', '1 weekly-basis: basis preserved');
  assert(Array.isArray(p.lesson_places) && p.lesson_places.length === 0, '1 lesson payload carries places (detail, empty ok)');
  assert(p.student_gender_group === '' && p.student_count_group === '', '1 lesson payload: 원생수 empty, no default');
}

// —— 1b) 상세 선택 항목(강의장소·원생수) 입력 시 lesson payload 로 저장
{
  const state = base({
    lesson_places: ['public_place'],
    student_gender_group: 'female',
    student_count_group: 'two',
  });
  assert(validateLessonState(state) === null, '1b filled detail optionals pass');
  const p = payloadForStep('lesson', state);
  assert(p.lesson_places.join(',') === 'public_place', '1b payload keeps lesson_places');
  assert(p.student_gender_group === 'female' && p.student_count_group === 'two', '1b payload keeps 원생수');
  const basicP = payloadForStep('basic', state);
  assert(!('lesson_places' in basicP) && !('student_gender_group' in basicP), '1b basic payload has no detail items');
}

// —— 2) 월 총 횟수 기준: 필수만, 선택 공란 → 통과
{
  const state = base({ fee_basis_type: 'monthly_by_total_sessions', monthly_session_count: '' });
  assert(validateLessonState(state) === null, '2 monthly-basis: empty optionals pass');
  const p = payloadForStep('lesson', state);
  assert(p.monthly_session_count === '', '2 monthly-basis: empty monthly count in payload');
}

// —— 3) 선택값 입력 시 payload 유지
{
  const state = base({ monthly_session_count: '8', fee_description: '협의 가능' });
  assert(validateLessonState(state) === null, '3 filled optionals: validate pass');
  const p = payloadForStep('lesson', state);
  assert(p.monthly_session_count === '8', '3 payload keeps monthly_session_count');
  assert(p.fee_description === '협의 가능', '3 payload keeps fee_description');
  assert(!Object.values(p).some((v) => v === 8), '3 payload values stay strings (no invented coercion to fill empties)');
}

// —— 3b) 형식: 주 회수·1회 수업시간은 기본정보 필수 → 공란·0·음수·비숫자·소수·상한 초과 모두 미충족
{
  const ok = (v) => tutorBasicOkMap(v);
  assert(ok({ lessons_per_week: '' }).lessons_per_week === false, '3b blank weekly = basic missing');
  assert(ok({ lessons_per_week: '   ' }).lessons_per_week === false, '3b whitespace-only weekly = basic missing');
  assert(ok({ lessons_per_week: '3' }).lessons_per_week === true, '3b positive weekly ok');
  assert(ok({ lessons_per_week: ' 3 ' }).lessons_per_week === true, '3b trimmed positive weekly ok');
  assert(ok({ lessons_per_week: '0' }).lessons_per_week === false, '3b zero weekly FAIL');
  assert(ok({ lessons_per_week: '-1' }).lessons_per_week === false, '3b negative weekly FAIL');
  assert(ok({ lessons_per_week: 'abc' }).lessons_per_week === false, '3b non-numeric weekly FAIL');
  assert(ok({ lessons_per_week: '1.5' }).lessons_per_week === false, '3b decimal weekly FAIL (SMALLINT integer)');
  assert(ok({ minutes_per_lesson: '0' }).minutes === false, '3b zero minutes FAIL');
  assert(
    validateLessonState(base({ monthly_session_count: 'x' })) === '월 총 횟수: 1 이상의 정수로 입력해 주세요.',
    '3b non-numeric monthly FAIL',
  );
  // DB 기술 계약: tutors.lessons_per_week SMALLINT UNSIGNED (0..65535). 사업 상한 아님.
  assert(ok({ lessons_per_week: '65535' }).lessons_per_week === true, '3b SMALLINT UNSIGNED max ok');
  assert(ok({ lessons_per_week: '65536' }).lessons_per_week === false, '3b above SMALLINT UNSIGNED FAIL');
  assert(ok({ lessons_per_week: '9007199254740993' }).lessons_per_week === false, '3b beyond Number.isSafeInteger FAIL');
}

// —— 4) 필수값 누락 → 차단 (과외비·주력과목은 기본정보 검사, 산정방식은 수업 단계). 강의장소는 선택.
{
  const missing = tutorBasicMissing({});
  assert(missing.includes('월 과외비'), '4a missing fee blocked (basic)');
  assert(tutorBasicOkMap({ preferred_fee_amount: '0' }).fee === false, '4a fee zero blocked (basic)');
  assert(validateLessonState(base({ fee_basis_type: '' })) === '산정방식을 선택해 주세요.', '4b missing fee basis blocked');
  assert(!missing.includes('강의장소'), '4c places not in basic required list');
  assert(validateLessonState(base({ lesson_places: [] })) === null, '4c empty places pass lesson step (선택)');
  assert(missing.includes('주력과목'), '4d missing main subject blocked (basic)');
  assert(tutorBasicOkMap({ main_subject_note: '   ' }).main_subject === false, '4d blank main subject blocked (basic)');
}

// —— 5) 추가 과목 불완전 행
assert(
  validateLessonState(
    base({
      subjects: [{ school_level: 'middle', grade_band: 'm1_m2', subject_name: '', is_primary: false }],
    }),
  ) === '학년을 선택했다면 과목명도 입력해 주세요. (예: 미적분2, 확률과 통계)',
  '5 incomplete subject row blocked',
);
assert(
  validateLessonState(
    base({
      subjects: [
        { school_level: 'middle', grade_band: 'm1_m2', subject_name: '미적분2', is_primary: false },
      ],
    }),
  ) === null,
  '5 complete subject row pass',
);

// —— 라우팅·저장 경로 미변경 (step-lesson 정적) · 기본정보 항목 위치
{
  const lesson = readFileSync(resolve(root, 'preview/tutor-ui/src/screens/step-lesson.js'), 'utf8');
  const basic = readFileSync(resolve(root, 'preview/tutor-ui/src/screens/step-basic.js'), 'utf8');
  assert(lesson.includes("saveAndNavigate(registerState, 'lesson', '/register/contact')"), 'step-lesson saveAndNavigate unchanged');
  assert(lesson.includes('validateLessonState'), 'step-lesson still calls validateLessonState');
  assert(!lesson.includes('name="lessons_per_week"') && !lesson.includes('name="preferred_fee_amount"'), 'step-lesson: weekly/fee inputs moved out');
  assert(basic.includes('for="lessons_per_week">주 회수') && basic.includes('name="lessons_per_week" required'), 'step-basic: 주 회수 on basic, required');
  assert(basic.includes('for="preferred_fee_amount">월 과외비') && basic.includes('name="preferred_fee_amount"'), 'step-basic: 월 과외비 on basic');
  assert(!basic.includes('form-label--required'), 'step-basic: no 필수 mark (정본 73 0-3)');
  assert(lesson.includes('name="lesson_places"') && !lesson.includes('form-label--required">강의장소'), 'step-lesson: 강의장소 optional');
}

// —— 범위: home-ui 기본정보 저장은 공용 목록 · evaluator 미수정 · API 는 TutorBasicFields
{
  const inline = readFileSync(resolve(root, 'preview/home-ui/src/tutor-reg/inline-save.js'), 'utf8');
  assert(inline.includes('tutorBasicMissing'), 'scope: home-ui inline-save uses shared basic list');
  const evaluator = readFileSync(resolve(root, 'src/Tutor/TutorDetailCompletionEvaluator.php'), 'utf8');
  assert(evaluator.includes('schedule_count') && evaluator.includes('scheduleOk'), 'scope: evaluator untouched');
  const basicPhp = readFileSync(resolve(root, 'src/Tutor/TutorBasicFields.php'), 'utf8');
  assert(basicPhp.includes("positiveInt($input['lessons_per_week']"), 'scope: API basic lessons_per_week positive int');
  assert(basicPhp.includes("positiveInt($input['minutes_per_lesson']"), 'scope: API basic minutes positive int');
}

if (failed > 0) {
  console.error(`\ntutor lesson optional step gate FAILED (${failed})`);
  process.exit(1);
}
console.log('\ntutor lesson optional step gate OK');
