/**
 * 등록점검 비교용 가상 카드 — 홈 실카드 렌더러에 넣을 풀데이터.
 * 사용자 미완성 프로필을 샘플로 쓰지 않는다.
 */

export const TUTOR_CARD_SAMPLE_IMAGE = '/assets/brand/tutor-card-sample.jpg';

function sampleBase() {
  return {
    id: 'trc-sample',
    tutor_display_name: '김하린',
    gender: 'female',
    location_label: '서울 강남구',
    main_subject_note: '수학',
    grade_band: '중·고',
    preferred_fee_amount: 450000,
    fee_basis_type: 'monthly_by_weekly_schedule',
    lessons_per_week: 2,
    monthly_session_count: 8,
    minutes_per_lesson: 90,
    intro_short: '중등 내신부터 수능까지, 개념을 먼저 잡고 유형으로 확장합니다',
    intro_long:
      '첫 달은 약점 유형을 찾고, 이후에는 주간 과제로 같은 유형을 반복합니다. 수업 후 짧은 리포트로 이번 주 목표와 다음 숙제를 남깁니다.',
    feature_1: '내신 1등급 관리',
    feature_2: '약점 유형 반복',
    feature_3: '주간 학습 리포트',
    university_name: '연세대학교',
    major_name: '수학과',
    university_status: 'graduated',
    career_year_band: 'y4_6',
    proof_document_available: true,
    verification_doc_count: 2,
    student_gender_group: 'mixed',
    student_count_group: 'solo',
    lesson_places: ['student_home_visit', 'public_place'],
    teaching_style_badges: ['meticulous', 'concept_focus'],
    main_material_note: '개념서 + 유형 500제',
    slogan: '개념이 잡히면 점수는 따라옵니다',
    profile_status: 'published',
    compare_eligible: true,
    image_path: TUTOR_CARD_SAMPLE_IMAGE,
    image_path_basic: TUTOR_CARD_SAMPLE_IMAGE,
    image_path_prime: TUTOR_CARD_SAMPLE_IMAGE,
  };
}

/**
 * @param {'basic'|'pick'|'prime'} [tier]
 */
export function buildTutorSamplePreviewItem(tier = 'basic') {
  const item = sampleBase();
  if (tier === 'pick') {
    item.paid_badges = ['jjokjipge'];
  } else if (tier === 'prime') {
    item.paid_badges = ['hot'];
  }
  return item;
}
