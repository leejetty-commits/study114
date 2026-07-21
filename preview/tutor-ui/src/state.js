/** 8장 SSOT 필드명 — DB 컬럼과 1:1 */

/** 기본등록 = draft seed · 상세등록 = 검색/공개 본체 (Notion 14장 2026-07-18) */
export const REGISTER_PHASES = {
  basic: {
    label: '기본등록',
    hint: '공개 전 임시 저장 · 상세등록으로 이어짐',
    stepKeys: ['basic', 'regions'],
  },
  detail: {
    label: '상세등록',
    hint: '검색·목록·공개에 쓰이는 정보 · 완료 후 일반 등록 · 이어 대표/추천 노출 구매',
    stepKeys: ['lesson', 'career', 'contact'],
  },
};

export const STEPS = [
  { path: '/register/basic', key: 'basic', label: '기본정보', step: 1, phase: 'basic' },
  { path: '/register/regions', key: 'regions', label: '활동지역', step: 2, phase: 'basic' },
  { path: '/register/lesson', key: 'lesson', label: '과목·가격', step: 3, phase: 'detail' },
  { path: '/register/career', key: 'career', label: '학력·경력', step: 4, phase: 'detail' },
  { path: '/register/contact', key: 'contact', label: '연락·사진', step: 5, phase: 'detail' },
  { path: '/register/complete', key: 'complete', label: '등록완료', step: 6, phase: null },
];

export const PERSONAL_GENDER_OPTIONS = [
  { value: 'male', label: '남' },
  { value: 'female', label: '여' },
];

export const GENDER_GROUP_OPTIONS = [
  { value: 'male', label: '남학생' },
  { value: 'female', label: '여학생' },
  { value: 'mixed', label: '남여' },
];

export const STUDENT_COUNT_OPTIONS = [
  { value: 'solo', label: '단독' },
  { value: 'two', label: '2명' },
  { value: 'three', label: '3명' },
  { value: 'four_plus', label: '4명 이상' },
];

export const AGE_BAND_OPTIONS = [
  { value: 'early_20s', label: '20대 전반' },
  { value: 'late_20s', label: '20대 후반' },
  { value: 'early_30s', label: '30대 전반' },
  { value: 'late_30s', label: '30대 후반' },
  { value: 'early_40s', label: '40대 전반' },
  { value: 'late_40s', label: '40대 후반' },
  { value: 'over_50', label: '50대 이상' },
];

export const SCHOOL_LEVELS = [
  { value: 'preschool', label: '미취학' },
  { value: 'elementary', label: '초등' },
  { value: 'middle', label: '중등' },
  { value: 'high', label: '고등' },
  { value: 'n_su', label: 'N수' },
];

export const FEE_BASIS_OPTIONS = [
  { value: 'monthly_by_weekly_schedule', label: '주간 일정 기준' },
  { value: 'monthly_by_total_sessions', label: '월 총 횟수 기준' },
];

export const TUTOR_PLACE_OPTIONS = [
  { value: 'student_home_visit', label: '학생자택방문' },
  { value: 'public_place', label: '공공장소' },
  { value: 'tutor_home', label: '강사자택' },
];

export const TEACHING_STYLE_OPTIONS = [
  { id: 'passion', label: '열정' },
  { id: 'meticulous', label: '꼼꼼' },
  { id: 'kind', label: '친절' },
  { id: 'from_basics', label: '기초부터' },
  { id: 'advanced_focus', label: '고난이도' },
  { id: 'concept_focus', label: '개념중심' },
  { id: 'solution_focus', label: '풀이중심' },
];

export const UNIVERSITY_STATUS_OPTIONS = [
  { value: 'enrolled', label: '재학' },
  { value: 'leave', label: '휴학' },
  { value: 'completed', label: '수료' },
  { value: 'graduated', label: '졸업' },
];

export const CAREER_YEAR_BAND_OPTIONS = [
  { value: 'y1_3', label: '1~3년' },
  { value: 'y4_6', label: '4~6년' },
  { value: 'y7_10', label: '7~10년' },
  { value: 'y10_plus', label: '10년 이상' },
];

export const IMAGE_TYPES = [
  { value: 'profile', label: '프로필' },
  { value: 'intro', label: '소개' },
  { value: 'proof_aux', label: '증빙보조' },
  { value: 'other', label: '기타' },
];

export const apiMasters = {
  regions: /** @type {Array<{id: number, label: string}>} */ ([]),
};

export function getRegions() {
  return apiMasters.regions.length
    ? apiMasters.regions
    : [{ id: 1, label: '서울특별시 강남구 대치동' }];
}

export const registerState = {
  tutor_id: null,
  gender: 'male',
  tutor_display_name: '김수학',
  slogan: '개념부터 문제까지',
  intro_short: '대치동 중등 수학 전문',
  intro_long: '학생 수준에 맞춘 맞춤 수업을 진행합니다.',
  student_gender_group: 'mixed',
  student_count_group: 'solo',
  age_band: 'early_30s',
  saved_regions: [
    { region_id: '1', scope_type: 'city', is_primary: true },
    { region_id: '', scope_type: 'city', is_primary: false },
    { region_id: '', scope_type: 'city', is_primary: false },
  ],
  main_subject_note: '수학',
  preferred_fee_amount: '480000',
  fee_basis_type: 'monthly_by_weekly_schedule',
  lessons_per_week: '2',
  monthly_session_count: '8',
  minutes_per_lesson: '90',
  fee_description: '주 2회 · 90분 기준 월 48만원',
  subjects: [
    { school_level: 'middle', grade_band: '중1~2', subject_master_id: '5', subject_name: '수학', is_primary: true },
  ],
  lesson_places: ['student_home_visit', 'public_place'],
  university_name: '서울대학교',
  major_name: '수학과',
  university_status: 'graduated',
  career_year_band: 'y7_10',
  main_material_note: '쎈 수학',
  feature_1: '개념+심화 병행',
  feature_2: '내신 대비',
  feature_3: '',
  proof_document_available: true,
  teaching_style_badges: ['meticulous', 'concept_focus'],
  contact_time_note: '평일 18:00~22:00',
  youtube_url: '',
  facebook_url: '',
  instagram_url: '',
  images: [{ image_type: 'profile', sort_order: 1, name: 'profile.jpg' }],
  profile_status: 'draft',
  detail_completion_status: 'basic_only',
};

export function emptySubject() {
  return { school_level: 'middle', grade_band: '', subject_master_id: '', subject_name: '', is_primary: false };
}
