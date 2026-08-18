/** 공부방 등록 — 기본정보(미완료 시) + 상세정보 2단계 */

export const REGISTER_PHASES = {
  basic: {
    label: '기본정보',
    hint: '저장된 기본정보 현황을 보고, 필요한 항목만 수정한 뒤 상세정보 등록으로 이어 갑니다.',
    stepKeys: ['basic', 'location'],
  },
  detail: {
    label: '상세정보',
    hint: '검색·목록에 보이는 수업·경력·신뢰·시설 정보를 두 단계로 완성합니다.',
    stepKeys: ['lesson', 'facility'],
  },
};

export const STEPS = [
  { path: '/register/basic', key: 'basic', label: '기본정보', step: 1, phase: 'basic' },
  { path: '/register/location', key: 'location', label: '위치', step: 2, phase: 'basic' },
  { path: '/register/lesson', key: 'lesson', label: '공부방·교습소 상세', step: 3, phase: 'detail' },
  { path: '/register/facility', key: 'facility', label: '경력·신뢰·시설', step: 4, phase: 'detail' },
  { path: '/register/complete', key: 'complete', label: '등록완료', step: 5, phase: null },
];

export const LEGACY_STEP_REDIRECT = {
  career: '/register/lesson',
};

export const SCHOOL_LEVELS = [
  { value: 'preschool', label: '미취학' },
  { value: 'elementary', label: '초등' },
  { value: 'middle', label: '중등' },
  { value: 'high', label: '고등' },
  { value: 'n_su', label: 'N수' },
  { value: 'general', label: '일반' },
  { value: 'other', label: '기타' },
];

export const LESSON_PLACE_TYPES = [
  { value: 'academy', label: '교습소' },
  { value: 'study_room', label: '공부방' },
];

export const LESSON_OPERATION_TYPES = [
  { value: 'group_by_time_slot', label: '그룹별 타임수업' },
  { value: 'time_slot_mixed_grade', label: '타임별 무학년 수업' },
  { value: 'individual_visit', label: '개인별 내방수업' },
];

export const CAPACITY_PER_TIME_OPTIONS = [
  { value: 'one_to_four', label: '1~4명' },
  { value: 'five_to_eight', label: '5~8명' },
  { value: 'nine_plus', label: '최대 9명' },
];

/** 대상 과목 행 · 학년 (단수) */
export const GRADE_OPTIONS = [
  { value: '1학년', label: '1학년' },
  { value: '2학년', label: '2학년' },
  { value: '3학년', label: '3학년' },
  { value: '4학년', label: '4학년' },
  { value: '5학년', label: '5학년' },
  { value: '6학년', label: '6학년' },
  { value: 'N수', label: 'N수' },
];

export const WEEKDAY_OPTIONS = [
  { value: 'mon', label: '월' },
  { value: 'tue', label: '화' },
  { value: 'wed', label: '수' },
  { value: 'thu', label: '목' },
  { value: 'fri', label: '금' },
  { value: 'sat', label: '토' },
  { value: 'sun', label: '일' },
];

/** 소개 구간 · 1일 평균 수업시간 */
export const DAILY_LESSON_MINUTES = [
  { value: '30', label: '30분' },
  { value: '60', label: '60분' },
  { value: '90', label: '90분' },
  { value: '120', label: '120분' },
  { value: '150', label: '150분' },
  { value: '180', label: '180분' },
  { value: 'over_180', label: '3시간 초과' },
];

/** 소개 구간 · 주당 평균 수업회수 / 수업 그룹 주횟수 */
export const WEEKLY_LESSON_COUNTS = [
  { value: '1', label: '1회' },
  { value: '2', label: '2회' },
  { value: '3', label: '3회' },
  { value: '4', label: '4회' },
  { value: '5', label: '5회' },
  { value: '6', label: '6회' },
  { value: '7', label: '7회 이상' },
];

/** 지도 스타일 — 복수 선택 */
export const TEACHING_STYLE_OPTIONS = [
  { id: 'kind', label: '친절' },
  { id: 'meticulous', label: '꼼꼼' },
  { id: 'taciturn', label: '과묵' },
  { id: 'comprehension', label: '이해력' },
  { id: 'problem_solving', label: '문제풀이형' },
  { id: 'concept_focus', label: '개념중심' },
  { id: 'advanced_focus', label: '고난이도' },
  { id: 'pinpoint', label: '족집게' },
  { id: 'patient', label: '인내형' },
  { id: 'attentive', label: '경청형' },
  { id: 'solution_notes', label: '풀이필기중점' },
  { id: 'textbook_focus', label: '교과서중심' },
  { id: 'mock_exam', label: '모의고사풀이' },
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

export const PERSONAL_GENDER_OPTIONS = [
  { value: 'male', label: '남' },
  { value: 'female', label: '여' },
];

export const DUMMY_REGIONS = [
  { id: 1, label: '서울특별시 강남구 대치동' },
  { id: 2, label: '서울특별시 서초구 반포동' },
  { id: 3, label: '부산광역시 해운대구 우동' },
  { id: 4, label: '대구광역시 수성구 범어동' },
  { id: 5, label: '인천광역시 연수구 송도동' },
  { id: 6, label: '광주광역시 서구 치평동' },
  { id: 7, label: '대전광역시 유성구 봉명동' },
  { id: 8, label: '울산광역시 남구 삼산동' },
  { id: 9, label: '세종특별자치시 한솔동' },
  { id: 10, label: '경기도 성남시 분당구 정자동' },
  { id: 11, label: '강원특별자치도 춘천시 효자동' },
  { id: 12, label: '충청북도 청주시 흥덕구 복대동' },
  { id: 13, label: '충청남도 천안시 서북구 불당동' },
  { id: 14, label: '전북특별자치도 전주시 완산구 효자동' },
  { id: 15, label: '전라남도 여수시 학동' },
  { id: 16, label: '경상북도 포항시 북구 장성동' },
  { id: 17, label: '경상남도 창원시 성산구 상남동' },
  { id: 18, label: '제주특별자치도 제주시 노형동' },
];

export const DUMMY_COMPLEXES = [
  { id: 1, region_id: 1, label: '래미안대치팰리스', address: '서울특별시 강남구 대치동 1027' },
  { id: 2, region_id: 1, label: '대치아이파크', address: '서울특별시 강남구 대치동 950' },
  { id: 3, region_id: 3, label: '해운대두산위브', address: '부산광역시 해운대구 우동 1514' },
];

/** API 마스터 (init 시 채움) */
export const apiMasters = {
  regions: /** @type {Array<{id: number, label: string}>} */ ([]),
  complexes: /** @type {Array<{id: number, region_id: number, label: string, address?: string}>} */ ([]),
  facilities: /** @type {Array<{id: number, facility_code: string, facility_name: string}>} */ ([]),
  subjects: /** @type {Array<{id?: number, value: string, label: string}>} */ ([]),
};

export function getRegions() {
  return apiMasters.regions.length ? apiMasters.regions : [];
}

export function getComplexes() {
  return apiMasters.complexes.length ? apiMasters.complexes : [];
}

export function getFacilityOptions() {
  if (!apiMasters.facilities.length) {
    return [];
  }
  return apiMasters.facilities.map((f) => ({
    id: f.id,
    facility_code: f.facility_code,
    facility_name: f.facility_name,
  }));
}

export function getSubjectOptions() {
  if (apiMasters.subjects.length) {
    return apiMasters.subjects.map((s) => ({
      value: String(s.value || s.label || ''),
      label: String(s.label || s.value || ''),
      id: s.id,
    })).filter((s) => s.value);
  }
  return [];
}

export function emptyRoomState() {
  return {
    study_room_id: null,
    gender: '',
    study_room_name: '',
    slogan: '',
    operator_display_name: '',
    intro_short: '',
    intro_long: '',
    primary_school_levels: [],
    lesson_place_type: '',
    lesson_operation_type: '',
    region_id: '',
    complex_id: '',
    region_basis_type: '',
    address_text: '',
    address_zip: '',
    home_address: '',
    home_address_zip: '',
    home_address_line2: '',
    address_line2: '',
    complex_name: '',
    complex_address: '',
    address_sido: '',
    address_sigungu: '',
    address_bname: '',
    latitude: '',
    longitude: '',
    saved_regions: [
      { region_id: '', complex_id: '', region_basis_type: '', is_primary: true },
      { region_id: '', complex_id: '', region_basis_type: '', is_primary: false },
      { region_id: '', complex_id: '', region_basis_type: '', is_primary: false },
    ],
    capacity_per_time: '',
    recruitment_count: '',
    main_subject_note: '',
    teaching_style: '',
    teaching_style_ids: [],
    teaching_style_note: '',
    weekend_available: null,
    one_on_one_available: null,
    card_payment_available: false,
    cash_receipt_available: false,
    correction_available: false,
    attendance_days: [],
    lessons_per_week: '',
    minutes_per_lesson: '',
    lesson_note: '',
    monthly_fee_manwon: '',
    price_amount: '',
    price_description: '',
    price_items: [],
    subjects: [],
    classes: [],
    career_years: '',
    academy_career_years: '',
    university_name: '',
    major_name: '',
    franchise_flag: null,
    franchise_name: '',
    education_office_registered: null,
    education_office_reg_no: '',
    business_registration_available: false,
    other_proof_notes: [],
    feature_1: '',
    feature_2: '',
    feature_3: '',
    facility_ids: [],
    facility_note: '',
    contact_time_note: '',
    contact_phone: '',
    images: [],
    youtube_url: '',
    facebook_url: '',
    instagram_url: '',
    profile_status: '',
    detail_completion_status: '',
    basicComplete: false,
    detailLessonSaved: false,
    detailFacilitySaved: false,
    completeNeedsHydrate: true,
  };
}

export const registerState = emptyRoomState();

export function isRoomBasicComplete(room) {
  const src = room || registerState;
  const hasName = String(src.study_room_name || '').trim() !== '';
  const hasPlace = ['academy', 'study_room'].includes(String(src.lesson_place_type || ''));
  const hasAudience = Array.isArray(src.primary_school_levels) && src.primary_school_levels.length > 0;
  const hasSubject = String(src.main_subject_note || '').trim() !== '';
  const hasSlogan = String(src.slogan || '').trim() !== '';
  const hasHome = String(src.home_address || '').trim() !== '';
  const hasAddress = String(src.address_text || '').trim() !== '';
  const firstPromo = Array.isArray(src.saved_regions) ? src.saved_regions[0] || {} : {};
  const hasRegion =
    String(firstPromo.region_id || '').trim() !== '' ||
    String(firstPromo.complex_id || '').trim() !== '' ||
    String(firstPromo.complex_name || '').trim() !== '' ||
    String(firstPromo.region_label || '').trim() !== '';
  return hasName && hasPlace && hasAudience && hasSubject && hasSlogan && hasHome && hasAddress && hasRegion;
}

export function emptySubject() {
  return {
    school_level: '',
    grade_band: '',
    subject_master_id: '',
    subject_name: '',
    subject_custom: '',
    is_main: false,
  };
}

export function emptyPriceItem() {
  return { item: '', fee: '', note: '' };
}

export function emptyClass() {
  return {
    class_name: '',
    school_level: '',
    grade_band: '',
    subject_name: '',
    subject_custom: '',
    attendance_days: [],
    lessons_per_week: '',
    monthly_fee: '',
    fee_note: '',
    lesson_note: '',
  };
}

export function emptyProofNote() {
  return '';
}
