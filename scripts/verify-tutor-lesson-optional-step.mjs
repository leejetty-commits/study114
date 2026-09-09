/**
 * tutor-ui lesson step gate — UI 선택값은 단계 이동을 막지 않음
 * validateLessonState + payloadForStep 동작 검증 (문자열 삭제 여부에만 의존하지 않음)
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateLessonState, payloadForStep } from '../preview/tutor-ui/src/form-collect.js';

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
    main_subject_note: '수학',
    preferred_fee_amount: '300000',
    fee_basis_type: 'monthly_by_weekly_schedule',
    lessons_per_week: '',
    monthly_session_count: '',
    minutes_per_lesson: '',
    fee_description: '',
    lesson_places: ['student_home_visit'],
    subjects: [],
    ...overrides,
  };
}

// —— 1) 주간 횟수 기준: 필수만, 선택 공란 → 통과
{
  const state = base({
    fee_basis_type: 'monthly_by_weekly_schedule',
    lessons_per_week: '',
    minutes_per_lesson: '',
    monthly_session_count: '',
  });
  assert(validateLessonState(state) === null, '1 weekly-basis: empty optionals pass');
  const p = payloadForStep('lesson', state);
  assert(p.lessons_per_week === '', '1 weekly-basis: empty weekly in payload (no default)');
  assert(p.minutes_per_lesson === '', '1 weekly-basis: empty minutes in payload');
  assert(p.fee_basis_type === 'monthly_by_weekly_schedule', '1 weekly-basis: basis preserved');
}

// —— 2) 월 총 횟수 기준: 필수만, 선택 공란 → 통과
{
  const state = base({
    fee_basis_type: 'monthly_by_total_sessions',
    monthly_session_count: '',
    minutes_per_lesson: '',
    lessons_per_week: '',
  });
  assert(validateLessonState(state) === null, '2 monthly-basis: empty optionals pass');
  const p = payloadForStep('lesson', state);
  assert(p.monthly_session_count === '', '2 monthly-basis: empty monthly count in payload');
  assert(p.minutes_per_lesson === '', '2 monthly-basis: empty minutes in payload');
}

// —— 3) 선택값 입력 시 payload 유지 + 양의 정수 PASS
{
  const state = base({
    lessons_per_week: '2',
    monthly_session_count: '8',
    minutes_per_lesson: '90',
    fee_description: '협의 가능',
  });
  assert(validateLessonState(state) === null, '3 filled optionals: validate pass');
  const p = payloadForStep('lesson', state);
  assert(p.lessons_per_week === '2', '3 payload keeps lessons_per_week');
  assert(p.monthly_session_count === '8', '3 payload keeps monthly_session_count');
  assert(p.minutes_per_lesson === '90', '3 payload keeps minutes_per_lesson');
  assert(p.fee_description === '협의 가능', '3 payload keeps fee_description');
  assert(!Object.values(p).some((v) => v === 2 || v === 90), '3 payload values stay strings (no invented coercion to fill empties)');
}

// —— 3b) 선택값 형식: 0 / 음수 / 비숫자 / 소수 → FAIL · 공란·양수 → PASS
{
  const posMsg = '주 횟수: 1 이상의 정수로 입력해 주세요.';
  const rangeMsg = '주 횟수: 1~65535 사이의 정수로 입력해 주세요.';
  assert(validateLessonState(base({ lessons_per_week: '' })) === null, '3b blank weekly PASS');
  assert(validateLessonState(base({ lessons_per_week: '   ' })) === null, '3b whitespace-only weekly PASS (trim=blank)');
  assert(validateLessonState(base({ lessons_per_week: '3' })) === null, '3b positive weekly PASS');
  assert(validateLessonState(base({ lessons_per_week: ' 3 ' })) === null, '3b trimmed positive weekly PASS');
  assert(validateLessonState(base({ lessons_per_week: '0' })) === posMsg, '3b zero weekly FAIL');
  assert(validateLessonState(base({ lessons_per_week: '-1' })) === posMsg, '3b negative weekly FAIL');
  assert(validateLessonState(base({ lessons_per_week: 'abc' })) === posMsg, '3b non-numeric weekly FAIL');
  assert(validateLessonState(base({ lessons_per_week: '1.5' })) === posMsg, '3b decimal weekly FAIL (SMALLINT integer)');
  assert(
    validateLessonState(base({ minutes_per_lesson: '0' })) ===
      '1회 수업 시간: 1 이상의 정수로 입력해 주세요.',
    '3b zero minutes FAIL',
  );
  assert(
    validateLessonState(base({ monthly_session_count: 'x' })) ===
      '월 총 횟수: 1 이상의 정수로 입력해 주세요.',
    '3b non-numeric monthly FAIL',
  );
  // DB 기술 계약: tutors.lessons_per_week SMALLINT UNSIGNED (0..65535). 사업 상한 아님.
  assert(validateLessonState(base({ lessons_per_week: '65535' })) === null, '3b SMALLINT UNSIGNED max PASS');
  assert(validateLessonState(base({ lessons_per_week: '65536' })) === rangeMsg, '3b above SMALLINT UNSIGNED FAIL');
  assert(
    validateLessonState(base({ lessons_per_week: '9007199254740993' })) === posMsg,
    '3b beyond Number.isSafeInteger FAIL',
  );
}

// —— 4) 필수값 누락 → 차단
assert(
  validateLessonState(base({ preferred_fee_amount: '' })) === '월 대표 과외비를 입력해 주세요.',
  '4a missing fee blocked',
);
assert(
  validateLessonState(base({ preferred_fee_amount: '0' })) === '월 대표 과외비를 입력해 주세요.',
  '4a fee zero blocked',
);
assert(
  validateLessonState(base({ fee_basis_type: '' })) === '산정방식을 선택해 주세요.',
  '4b missing fee basis blocked',
);
assert(
  validateLessonState(base({ lesson_places: [] })) === '강의장소를 1개 이상 선택해 주세요.',
  '4c missing places blocked',
);
assert(
  validateLessonState(base({ main_subject_note: '' })) ===
    '주력과목이 없습니다. 기본등록에서 주력과목을 먼저 저장해 주세요.',
  '4d missing main subject blocked',
);
assert(
  validateLessonState(base({ main_subject_note: '   ' })) ===
    '주력과목이 없습니다. 기본등록에서 주력과목을 먼저 저장해 주세요.',
  '4d blank main subject blocked',
);

// —— 5) 추가 과목 불완전 행
assert(
  validateLessonState(
    base({
      subjects: [{ school_level: 'middle', grade_band: 'm1_m2', subject_name: '', is_primary: false }],
    }),
  ) === '학년대를 선택했다면 과목명도 입력해 주세요. (예: 미적분2, 확률과 통계)',
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

// —— 라우팅·저장 경로 미변경 (step-lesson 정적)
{
  const lesson = readFileSync(resolve(root, 'preview/tutor-ui/src/screens/step-lesson.js'), 'utf8');
  assert(lesson.includes("saveAndNavigate(registerState, 'lesson', '/register/contact')"), 'step-lesson saveAndNavigate unchanged');
  assert(lesson.includes('validateLessonState'), 'step-lesson still calls validateLessonState');
  assert(lesson.includes('<label class="form-label">주 횟수</label>'), 'UI optional mark for weekly unchanged');
  assert(lesson.includes('form-label--required') && lesson.includes('월 대표 과외비'), 'UI required fee mark unchanged');
}

// —— 범위: home-ui / evaluator 미수정 가드 (동작 계약이 남아 있음)
{
  const inline = readFileSync(resolve(root, 'preview/home-ui/src/tutor-reg/inline-save.js'), 'utf8');
  assert(inline.includes('주 횟수를 입력해 주세요.'), 'scope: home-ui inline-save untouched');
  const evaluator = readFileSync(resolve(root, 'src/Tutor/TutorDetailCompletionEvaluator.php'), 'utf8');
  assert(evaluator.includes('schedule_count') && evaluator.includes('scheduleOk'), 'scope: evaluator untouched');
  const saveLesson = readFileSync(resolve(root, 'src/Tutor/TutorRegisterService.php'), 'utf8');
  assert(saveLesson.includes("optionalInt($input, 'lessons_per_week')"), 'scope: API optionalInt lessons unchanged');
  assert(saveLesson.includes("optionalInt($input, 'minutes_per_lesson')"), 'scope: API optionalInt minutes unchanged');
}

if (failed > 0) {
  console.error(`\ntutor lesson optional step gate FAILED (${failed})`);
  process.exit(1);
}
console.log('\ntutor lesson optional step gate OK');
