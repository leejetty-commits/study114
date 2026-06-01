/**
 * 11장 — 노출·비교 필드 스키마 (UI 렌더용)
 * DB 컬럼명과 1:1. 임의 필드명 추가 금지.
 */

/** @typedef {'prime' | 'pick' | 'basic'} ExposureTier */
/** @typedef {'study_room' | 'tutor'} ProviderKind */

export const EXPOSURE_TIER_META = {
  prime: { label: 'Prime', desc: '설득' },
  pick: { label: 'Pick', desc: '핵심 비교' },
  basic: { label: 'Basic', desc: '대량 노출' },
};

/** 공부방 Prime — 11장 §3-1 */
export const STUDY_ROOM_PRIME_FIELDS = [
  { key: 'image_path', label: '대표 이미지', db: 'study_room_images.image_path' },
  { key: 'study_room_name', label: '공부방명', db: 'study_rooms.study_room_name' },
  { key: 'location_label', label: '위치', db: 'study_rooms.region_id/complex_id/address_text' },
  { key: 'main_subject_note', label: '주력과목', db: 'study_rooms.main_subject_note' },
  { key: 'grade_band', label: '대상 학년', db: 'study_room_subject_targets.school_level/grade_band' },
  { key: 'price_amount', label: '대표 가격', db: 'study_rooms.price_amount' },
  { key: 'intro_short', label: '짧은 소개', db: 'study_rooms.intro_short' },
  { key: 'feature_1', label: '특징1', db: 'study_rooms.feature_1' },
  { key: 'feature_2', label: '특징2', db: 'study_rooms.feature_2' },
  { key: 'badges', label: '배지', db: 'education_office_registered/career_years/…' },
];

export const STUDY_ROOM_PICK_FIELDS = [
  'image_path',
  'study_room_name',
  'location_label',
  'main_subject_note',
  'grade_band',
  'price_amount',
  'feature_1',
  'badges',
];

export const STUDY_ROOM_BASIC_FIELDS = [
  'study_room_name',
  'location_label',
  'main_subject_note',
  'grade_band',
  'price_amount',
  'profile_status',
  'registered_at',
];

/** 공부방 비교표 행 — 11장 §3-4 */
export const STUDY_ROOM_COMPARE_ROWS = [
  { key: 'study_room_name', label: '공부방명', db: 'study_rooms.study_room_name' },
  { key: 'location_label', label: '위치', db: 'study_rooms.region_id/complex_id/address_text' },
  { key: 'grade_band', label: '대상 학년', db: 'study_room_subject_targets' },
  { key: 'main_subject_note', label: '주력과목', db: 'study_rooms.main_subject_note' },
  { key: 'price_amount', label: '가격 대표값', db: 'study_rooms.price_amount' },
  { key: 'lesson_place_type', label: '수업 형태', db: 'study_rooms.lesson_place_type' },
  { key: 'capacity_per_time', label: '1타임 인원', db: 'study_rooms.capacity_per_time' },
  { key: 'education_office_registered', label: '교육청 등록', db: 'study_rooms.education_office_registered' },
  { key: 'weekend_available', label: '주말 가능', db: 'study_rooms.weekend_available' },
  { key: 'facility_summary', label: '시설 핵심', db: 'study_room_facilities/facility_note' },
  { key: 'features_joined', label: '특징', db: 'study_rooms.feature_1~3' },
];

/** 과외쌤 — 8장 설계 필드명 (실DB 미생성) */
export const TUTOR_PRIME_FIELDS = [
  { key: 'image_path', label: '프로필', db: 'tutor_images.image_path' },
  { key: 'display_name', label: '표시명', db: 'tutors.display_name' },
  { key: 'main_subject_note', label: '주요 과목', db: 'tutor_subject_targets.subject_name' },
  { key: 'location_label', label: '가능 지역', db: 'tutor_regions' },
  { key: 'preferred_fee_amount', label: '대표 과외비', db: 'tutors.preferred_fee_amount' },
  { key: 'career_label', label: '경력', db: 'tutors.career_years' },
  { key: 'intro_short', label: '짧은 소개', db: 'tutors.intro_short' },
  { key: 'feature_1', label: '특징1', db: 'tutors.feature_1' },
  { key: 'feature_2', label: '특징2', db: 'tutors.feature_2' },
  { key: 'badges', label: '배지', db: 'tutors.verification_available' },
];

export const TUTOR_PICK_FIELDS = [
  'image_path',
  'display_name',
  'main_subject_note',
  'location_label',
  'preferred_fee_amount',
  'career_years',
  'feature_1',
];

export const TUTOR_BASIC_FIELDS = [
  'display_name',
  'main_subject_note',
  'location_label',
  'preferred_fee_amount',
  'career_years',
  'feature_1',
];

export const TUTOR_COMPARE_ROWS = [
  { key: 'display_name', label: '표시명', db: 'tutors.display_name' },
  { key: 'gender_lesson_label', label: '성별/수업 형태', db: 'tutors.gender/lesson_format' },
  { key: 'main_subject_note', label: '주요 과목', db: 'tutor_subject_targets.subject_name' },
  { key: 'location_label', label: '가능 지역', db: 'tutor_regions' },
  { key: 'preferred_fee_amount', label: '대표 과외비', db: 'tutors.preferred_fee_amount' },
  { key: 'career_label', label: '경력', db: 'tutors.career_years' },
  { key: 'education_summary', label: '학력 요약', db: 'tutors.education_background_note' },
  { key: 'verification_label', label: '증빙 가능', db: 'tutors.verification_available' },
  { key: 'features_joined', label: '특징', db: 'tutors.feature_1~3' },
];

/** 학생 리스트 — 11장 §5 */
export const STUDENT_LIST_FIELDS = [
  { key: 'public_display_name', db: 'students.public_display_name' },
  { key: 'grade_level', db: 'students.grade_level' },
  { key: 'gender', db: 'students.gender' },
  { key: 'location_label', db: 'students.preferred_region_id/preferred_complex_id' },
  { key: 'subject_label', db: 'student_subject_targets.subject_name' },
  { key: 'preferred_fee_amount', db: 'students.preferred_fee_amount' },
  { key: 'request_summary', db: 'students.request_summary' },
];

export const COMPARE_MAX = 3;
