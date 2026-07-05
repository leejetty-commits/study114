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

/** 공부방 Prime — 11장 §4-0·§4-1 */
export const STUDY_ROOM_PRIME_FIELDS = [
  { key: 'location_label', label: '위치', db: 'study_rooms.region_id/complex_id/address_text' },
  { key: 'image_path', label: '대표 이미지(16:9)', db: 'study_room_images.image_path' },
  { key: 'study_room_name', label: '공부방명', db: 'study_rooms.study_room_name' },
  { key: 'price_amount', label: '대표 가격', db: 'study_rooms.price_amount' },
  { key: 'badges', label: '신뢰배지', db: 'study_room_badges / education_office_registered' },
  { key: 'grade_band', label: '대상', db: 'study_room_subject_targets.school_level/grade_band' },
  { key: 'main_subject_note', label: '과목', db: 'study_rooms.main_subject_note' },
  { key: 'lesson_place_label', label: '수업장소', db: 'study_rooms.lesson_place_type' },
  { key: 'capacity_per_time', label: '원생수', db: 'study_rooms.capacity_per_time' },
  { key: 'lesson_operation_label', label: '수업형태', db: 'study_rooms.lesson_operation_type' },
  { key: 'features_joined', label: '특징', db: 'study_rooms.feature_1~3' },
  { key: 'intro_short', label: '소개', db: 'study_rooms.intro_short' },
  { key: 'slogan', label: '슬로건', db: 'study_rooms.slogan' },
];

export const STUDY_ROOM_PICK_FIELDS = [
  'location_label',
  'image_path',
  'study_room_name',
  'price_amount',
  'badges',
  'grade_band',
  'main_subject_note',
  'lesson_place_label',
  'capacity_per_time',
  'lesson_operation_label',
  'feature_1',
  'slogan',
];

export const STUDY_ROOM_BASIC_FIELDS = [
  'study_room_name',
  'grade_band',
  'main_subject_note',
  'price_amount',
  'location_label',
  'lesson_place_label',
  'capacity_per_time',
  'lesson_operation_label',
  'feature_1',
  'slogan',
  'registered_at',
];

/** 공부방 비교표 — 11장 §4-3 */
export const STUDY_ROOM_COMPARE_ROWS = [
  { key: 'study_room_name', label: '공부방명', db: 'study_rooms.study_room_name' },
  { key: 'location_label', label: '위치', db: 'study_rooms.region_id/complex_id/address_text' },
  { key: 'grade_band', label: '대상 학년', db: 'study_room_subject_targets' },
  { key: 'main_subject_note', label: '주력과목', db: 'study_rooms.main_subject_note' },
  { key: 'price_amount', label: '가격 대표값', db: 'study_rooms.price_amount' },
  { key: 'lesson_place_label', label: '수업장소', db: 'study_rooms.lesson_place_type' },
  { key: 'lesson_operation_label', label: '수업운영형태', db: 'study_rooms.lesson_operation_type' },
  { key: 'capacity_per_time', label: '타임별 원생수', db: 'study_rooms.capacity_per_time' },
  { key: 'education_office_registered', label: '교육청 등록', db: 'study_rooms.education_office_registered' },
  { key: 'weekend_available', label: '주말 가능', db: 'study_rooms.weekend_available' },
  { key: 'facility_summary', label: '시설 핵심', db: 'study_room_facilities/facility_note' },
  { key: 'features_joined', label: '특징', db: 'study_rooms.feature_1~3' },
];

/** 과외쌤 — 11장 §5-0·§5-2 (008 DDL) */
export const TUTOR_PRIME_FIELDS = [
  { key: 'location_label', label: '수업가능지역', db: 'tutor_regions' },
  { key: 'image_path', label: '프로필', db: 'tutor_images.image_path' },
  { key: 'trust_badges', label: '졸업/경력배지', db: 'university_status / career_year_band' },
  { key: 'education_summary', label: '학교·학과', db: 'university_name / major_name' },
  { key: 'fee_card_label', label: '월·주·분', db: 'preferred_fee_amount + lessons_per_week + minutes_per_lesson' },
  { key: 'tutor_display_name', label: '표시명', db: 'tutors.tutor_display_name' },
  { key: 'verification_count_label', label: '제출자료', db: 'tutor_verification_documents 집계' },
  { key: 'grade_band', label: '대상', db: 'tutor_subject_targets.school_level/grade_band' },
  { key: 'main_subject_note', label: '과목', db: 'tutors.main_subject_note' },
  { key: 'lesson_places_label', label: '수업장소', db: 'tutor_lesson_places' },
  { key: 'student_target_label', label: '학생구성', db: 'student_gender_group / student_count_group' },
  { key: 'main_material_note', label: '주교재', db: 'tutors.main_material_note' },
  { key: 'features_joined', label: '특징', db: 'tutors.feature_1~3' },
  { key: 'teaching_style_label', label: '강의스타일', db: 'tutor_teaching_style_badges' },
  { key: 'intro_short', label: '소개', db: 'tutors.intro_short' },
  { key: 'slogan', label: '슬로건', db: 'tutors.slogan' },
];

export const TUTOR_PICK_FIELDS = [
  'location_label',
  'image_path',
  'trust_badges',
  'education_summary',
  'fee_card_label',
  'tutor_display_name',
  'verification_count_label',
  'main_subject_note',
  'lesson_places_label',
  'student_target_label',
  'main_material_note',
  'feature_1',
  'teaching_style_label',
  'slogan',
];

export const TUTOR_BASIC_FIELDS = [
  'tutor_display_name',
  'grade_band',
  'main_subject_note',
  'fee_card_label',
  'location_label',
  'lesson_places_label',
  'student_target_label',
  'feature_1',
  'teaching_style_label',
  'slogan',
];

export const TUTOR_COMPARE_ROWS = [
  { key: 'tutor_display_name', label: '표시명', db: 'tutors.tutor_display_name' },
  { key: 'gender_age_label', label: '성별/연령대', db: 'user_profiles.gender / tutors.age_band' },
  { key: 'main_subject_note', label: '주요 과목', db: 'tutor_subject_targets / main_subject_note' },
  { key: 'location_label', label: '수업가능지역', db: 'tutor_regions' },
  { key: 'fee_card_label', label: '월·주·분', db: 'preferred_fee_amount / lessons_per_week / minutes_per_lesson' },
  { key: 'career_label', label: '경력구간', db: 'tutors.career_year_band' },
  { key: 'university_status_label', label: '학적상태', db: 'tutors.university_status' },
  { key: 'education_summary', label: '학교·학과', db: 'university_name / major_name' },
  { key: 'lesson_places_label', label: '강의장소', db: 'tutor_lesson_places' },
  { key: 'student_target_label', label: '학생구성', db: 'student_gender_group / student_count_group' },
  { key: 'teaching_style_label', label: '강의스타일', db: 'tutor_teaching_style_badges' },
  { key: 'verification_count_label', label: '제출자료', db: 'tutor_verification_documents' },
  { key: 'features_joined', label: '특징', db: 'tutors.feature_1~3' },
];

/** 학생 리스트 — 11장 §6-0 (비교 대상 아님) */
export const STUDENT_LIST_FIELDS = [
  { key: 'public_display_name', db: 'students.public_display_name' },
  { key: 'grade_level', db: 'students.grade_level' },
  { key: 'gender', db: 'students.gender' },
  { key: 'location_label', db: 'preferred_studyroom_region/complex · preferred_tutor_region' },
  { key: 'subject_label', db: 'student_subject_targets' },
  { key: 'teaching_style_label', db: 'student_preferred_teaching_style_badges' },
  { key: 'budget_card_label', db: 'preferred_fee_amount / preferred_studyroom_fee_amount + lessons_per_week + minutes_per_lesson' },
  { key: 'lesson_places_label', db: 'student_preferred_lesson_places' },
  { key: 'student_lesson_target_label', label: '수업형태/인원', db: 'lesson_format · student_gender_group · preferred_student_count_group' },
  { key: 'preferred_student_count_group', label: '희망 수업인원', db: 'students.preferred_student_count_group' },
  { key: 'lesson_format', db: 'students.lesson_format' },
  { key: 'student_gender_group', db: 'students.student_gender_group' },
  { key: 'visibility_summary_label', db: 'request_summary_visibility / special_request_visibility' },
];

export const COMPARE_MAX = 3;
