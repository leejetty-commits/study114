/** 공부방 등록 — 기본등록(미완료 시) + 상세등록 2단계 */

export const REGISTER_PHASES = {
  basic: {
    label: '기본등록',
    hint: '저장된 기본·위치 현황을 보고, 필요할 때만 수정한 뒤 상세등록으로 이어갑니다.',
    stepKeys: ['basic', 'location'],
  },
  detail: {
    label: '상세등록',
    hint: '검색·목록에 보이는 수업·경력·시설 정보를 두 단계로 완성합니다.',
    stepKeys: ['lesson', 'facility'],
  },
};

export const STEPS = [
  { path: '/register/basic', key: 'basic', label: '기본정보', step: 1, phase: 'basic' },
  { path: '/register/location', key: 'location', label: '위치', step: 2, phase: 'basic' },
  { path: '/register/lesson', key: 'lesson', label: '수업·가격', step: 3, phase: 'detail' },
  { path: '/register/facility', key: 'facility', label: '경력·시설', step: 4, phase: 'detail' },
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
};

export function getRegions() {
  return apiMasters.regions.length ? apiMasters.regions : DUMMY_REGIONS;
}

export function getComplexes() {
  return apiMasters.complexes.length ? apiMasters.complexes : DUMMY_COMPLEXES;
}

export function getFacilityOptions() {
  if (apiMasters.facilities.length) {
    return apiMasters.facilities.map((f) => ({
      id: f.id,
      facility_code: f.facility_code,
      facility_name: f.facility_name,
    }));
  }
  return FACILITY_OPTIONS;
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
    lesson_place_type: '',
    lesson_operation_type: '',
    region_id: '',
    complex_id: '',
    region_basis_type: '',
    address_text: '',
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
    weekend_available: null,
    one_on_one_available: null,
    price_amount: '',
    price_description: '',
    subjects: [],
    career_years: '',
    academy_career_years: '',
    franchise_flag: null,
    franchise_name: '',
    education_office_registered: null,
    education_office_reg_no: '',
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
  const hasRegion =
    String(src.region_id || '').trim() !== '' ||
    String(src.complex_id || '').trim() !== '' ||
    (Array.isArray(src.saved_regions) &&
      src.saved_regions.some(
        (r) => String(r?.region_id || '').trim() !== '' || String(r?.complex_id || '').trim() !== '',
      ));
  return hasName && hasRegion;
}

export function emptySubject() {
  return { school_level: 'middle', grade_band: '', subject_master_id: '', subject_name: '', is_main: false };
}
