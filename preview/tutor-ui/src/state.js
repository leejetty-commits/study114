/** 과외쌤 등록 — 기본등록(미완료 시) + 상세등록 2단계 */

export const REGISTER_PHASES = {
  basic: {
    label: '기본등록',
    hint: '가입 때 받은 정보가 없으면 여기서 먼저 채웁니다. 이미 있다면 건너뜁니다.',
    stepKeys: ['basic', 'regions'],
  },
  detail: {
    label: '상세등록',
    hint: '검색·목록에 보이는 수업·학력·연락 정보를 두 단계로 완성합니다.',
    stepKeys: ['lesson', 'contact'],
  },
};

export const STEPS = [
  { path: '/register/basic', key: 'basic', label: '기본정보', step: 1, phase: 'basic', uiStepFull: 1 },
  { path: '/register/regions', key: 'regions', label: '과외지역', step: 2, phase: 'basic', uiStepFull: 2 },
  { path: '/register/lesson', key: 'lesson', label: '수업·가격', step: 3, phase: 'detail', uiStepFull: 3, uiStepDetail: 1 },
  { path: '/register/contact', key: 'contact', label: '학력·연락', step: 4, phase: 'detail', uiStepFull: 4, uiStepDetail: 2 },
  { path: '/register/complete', key: 'complete', label: '등록완료', step: 5, phase: null },
];

/** 옛 학력 단계 URL 호환 */
export const LEGACY_STEP_REDIRECT = {
  career: '/register/lesson',
};

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
  cities: /** @type {Array<{id: number, label: string}>} */ ([]),
};

export function getRegions() {
  return apiMasters.regions.length
    ? apiMasters.regions
    : [{ id: 1, label: '서울특별시 강남구 대치동' }];
}

export function getCities() {
  return apiMasters.cities.length ? apiMasters.cities : [];
}

/** 기본등록(이름+과외지역) 완료 여부 — 상세등록 진입 시 스킵 판단 */
export function isTutorBasicComplete(tutor) {
  if (!tutor || !tutor.tutor_id) return false;
  const hasName = String(tutor.tutor_display_name || '').trim() !== '';
  const hasRegion =
    Array.isArray(tutor.saved_regions) &&
    tutor.saved_regions.some((r) => String(r?.region_id || '').trim() !== '');
  return hasName && hasRegion;
}

export const registerState = {
  tutor_id: null,
  gender: 'male',
  tutor_display_name: '',
  slogan: '',
  intro_short: '',
  intro_long: '',
  student_gender_group: 'mixed',
  student_count_group: 'solo',
  age_band: 'early_30s',
  saved_regions: [
    { region_id: '', scope_type: 'city', is_primary: true },
    { region_id: '', scope_type: 'city', is_primary: false },
    { region_id: '', scope_type: 'city', is_primary: false },
  ],
  main_subject_note: '',
  preferred_fee_amount: '',
  fee_basis_type: 'monthly_by_weekly_schedule',
  lessons_per_week: '',
  monthly_session_count: '',
  minutes_per_lesson: '',
  fee_description: '',
  subjects: [
    { school_level: 'middle', grade_band: '', subject_master_id: '', subject_name: '', is_primary: true },
  ],
  lesson_places: [],
  university_name: '',
  major_name: '',
  university_status: 'graduated',
  career_year_band: 'y1_3',
  main_material_note: '',
  feature_1: '',
  feature_2: '',
  feature_3: '',
  proof_document_available: false,
  teaching_style_badges: [],
  contact_time_note: '',
  youtube_url: '',
  facebook_url: '',
  instagram_url: '',
  images: [{ image_type: 'profile', sort_order: 1, name: 'profile.jpg' }],
  profile_status: 'draft',
  detail_completion_status: 'basic_only',
  /** @type {boolean} */
  basicComplete: false,
};

export function emptySubject() {
  return { school_level: 'middle', grade_band: '', subject_master_id: '', subject_name: '', is_primary: false };
}
