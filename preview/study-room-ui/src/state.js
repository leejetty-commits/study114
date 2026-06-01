/** 5장 SSOT 필드명 — DB 컬럼과 1:1 */

/** 기본등록 → 일반 리스트 · 상세등록 → Prime/Pick 자격 전제 (5·8·9장) */
export const REGISTER_PHASES = {
  basic: {
    label: '기본등록',
    hint: '완료 시 일반 리스트 노출 가능',
    stepKeys: ['basic', 'location'],
  },
  detail: {
    label: '상세등록',
    hint: '누구나 이어서 작성 · 완료 시 Prime/Pick 자격',
    stepKeys: ['lesson', 'career', 'facility'],
  },
};

export const STEPS = [
  { path: '/register/basic', key: 'basic', label: '기본정보', step: 1, phase: 'basic' },
  { path: '/register/location', key: 'location', label: '위치', step: 2, phase: 'basic' },
  { path: '/register/lesson', key: 'lesson', label: '수업·가격', step: 3, phase: 'detail' },
  { path: '/register/career', key: 'career', label: '경력·특징', step: 4, phase: 'detail' },
  { path: '/register/facility', key: 'facility', label: '시설·연락·사진', step: 5, phase: 'detail' },
  { path: '/register/complete', key: 'complete', label: '등록완료', step: 6, phase: null },
];

export const SCHOOL_LEVELS = [
  { value: 'preschool', label: '미취학' },
  { value: 'elementary', label: '초등' },
  { value: 'middle', label: '중등' },
  { value: 'high', label: '고등' },
  { value: 'retake', label: '재수' },
  { value: 'general', label: '일반' },
  { value: 'other', label: '기타' },
];

/** 5장 §11-3 권장 체크 ~5개 */
export const FACILITY_OPTIONS = [
  { id: 1, facility_code: 'aircon', facility_name: '냉난방' },
  { id: 2, facility_code: 'ventilation', facility_name: '환기' },
  { id: 3, facility_code: 'restroom', facility_name: '화장실/위생' },
  { id: 4, facility_code: 'parking', facility_name: '통학/주차 편의' },
  { id: 5, facility_code: 'safety', facility_name: 'CCTV/안전관리' },
];

export const IMAGE_TYPES = [
  { value: 'cover', label: '대표' },
  { value: 'interior', label: '내부' },
  { value: 'facility', label: '시설' },
  { value: 'other', label: '기타' },
];

export const DUMMY_REGIONS = [
  { id: 1, label: '서울 강남구 대치동' },
  { id: 2, label: '서울 서초구 반포동' },
  { id: 3, label: '부산 해운대구 우동' },
];

export const DUMMY_COMPLEXES = [
  { id: 1, region_id: 1, label: '래미안대치팰리스' },
  { id: 2, region_id: 1, label: '대치아이파크' },
  { id: 3, region_id: 3, label: '해운대두산위브' },
];

export const registerState = {
  study_room_name: '우동공과 대치점',
  operator_display_name: '김선생',
  intro_short: '대치동 인근 소규모 맞춤 공부방',
  intro_long: '학생 개별 수준에 맞춘 관리형 공부방입니다. 자기주도와 피드백을 병행합니다.',
  lesson_place_type: 'office',

  region_id: '1',
  complex_id: '1',
  address_text: '서울 강남구 대치동 123',
  latitude: '',
  longitude: '',
  saved_regions: [
    { region_id: '1', complex_id: '1', is_primary: true },
    { region_id: '2', complex_id: '', is_primary: false },
    { region_id: '', complex_id: '', is_primary: false },
  ],

  capacity_per_time: '4~6명',
  recruitment_count: '12',
  main_subject_note: '수학·영어',
  teaching_style: '자기주도 + 개별 피드백',
  weekend_available: true,
  one_on_one_available: false,
  price_amount: '350000',
  price_description: '주 2회 기준 월 35만원. 과목·횟수별 상이 — 문의',
  subjects: [
    { school_level: 'middle', grade_band: '중1~2', subject_name: '수학', is_main: true },
    { school_level: 'middle', grade_band: '중1~2', subject_name: '영어', is_main: false },
  ],

  career_years: '8',
  academy_career_years: '3',
  franchise_flag: false,
  franchise_name: '',
  education_office_registered: true,
  education_office_reg_no: '제2024-001234호',
  feature_1: '소규모 밀착 관리',
  feature_2: '학부모 주간 리포트',
  feature_3: '자습·질의 병행',

  facility_ids: [1, 2, 3, 5],
  facility_note: '창가 자연광, 정수기·제습기 구비',
  contact_time_note: '평일 14:00~21:00',
  contact_phone: '010-1234-5678',
  images: [
    { image_type: 'cover', sort_order: 1, name: '대표.jpg' },
  ],

  /** 상세등록 — 외부 YouTube URL 1개 (5장 §15) `[임시]` 컬럼명 */
  youtube_url: '',

  profile_status: 'draft',
  detail_registration_complete: false,
};

export function emptySubject() {
  return { school_level: 'middle', grade_band: '', subject_name: '', is_main: false };
}
