/**
 * 13장 — 검색 필드 스키마 (DB 컬럼명 1:1)
 * @typedef {'basic' | 'expanded'} SearchTier
 * @typedef {'room' | 'tutor' | 'student'} SearchTab
 * @typedef {1 | 2} BasicRow
 */

/**
 * @typedef {object} SearchField
 * @property {string} key
 * @property {string} label
 * @property {SearchTier} tier
 * @property {BasicRow} [basicRow] — §8-1 기본검색 1·2줄
 * @property {string} db
 * @property {string} input
 * @property {string} [optionsKey]
 * @property {boolean} [groupOnly] — lesson_format=group 일 때만 (학생)
 */

/** @type {Record<SearchTab, { label: string, defaultRegionHint: string, mapEnabled: boolean, fields: SearchField[] }>} */
export const SEARCH_TABS = {
  room: {
    label: '공부방 찾기',
    defaultRegionHint: '시·군·구를 선택한 뒤 검색',
    mapEnabled: true,
    fields: [
      { key: 'region_id', label: '지역(동/단지)', tier: 'basic', basicRow: 1, db: 'study_room_regions', input: 'region' },
      { key: 'subject_master_id', label: '주력과목', tier: 'basic', basicRow: 1, db: 'study_room_subject_targets · main_subject_note', input: 'subject' },
      { key: 'school_level', label: '대상 학교급', tier: 'basic', basicRow: 1, db: 'study_room_primary_audiences.school_level', input: 'select', optionsKey: 'school_level' },
      { key: 'grade_band', label: '대상 학년', tier: 'basic', basicRow: 1, db: 'study_room_subject_targets.grade_band', input: 'grade', dependsOn: 'school_level' },
      { key: 'price_amount', label: '가격대(월)', tier: 'basic', basicRow: 1, db: 'study_rooms.price_amount', input: 'range' },
      { key: 'lesson_place_type', label: '교습형태', tier: 'basic', basicRow: 2, db: 'study_rooms.lesson_place_type', input: 'select', optionsKey: 'study_room_place' },
      { key: 'lesson_operation_type', label: '수업운영방식', tier: 'basic', basicRow: 2, db: 'study_rooms.lesson_operation_type', input: 'select', optionsKey: 'lesson_operation' },
      { key: 'education_office_registered', label: '교육청 등록', tier: 'basic', basicRow: 2, db: 'study_rooms.education_office_registered', input: 'toggle' },
      { key: 'one_on_one_available', label: '1:1 가능', tier: 'expanded', db: 'study_rooms.one_on_one_available', input: 'toggle' },
      { key: 'weekend_available', label: '주말 가능', tier: 'expanded', db: 'study_rooms.weekend_available', input: 'toggle' },
      { key: 'capacity_per_time', label: '타임별 원생수', tier: 'expanded', db: 'study_rooms.capacity_per_time', input: 'select', optionsKey: 'capacity' },
      { key: 'career_years', label: '교습 경력', tier: 'expanded', db: 'study_rooms.career_years', input: 'text' },
      { key: 'franchise_flag', label: '프랜차이즈', tier: 'expanded', db: 'study_rooms.franchise_flag', input: 'toggle' },
      { key: 'facility_codes', label: '시설', tier: 'expanded', db: 'study_room_facilities', input: 'chips', optionsKey: 'facility' },
      { key: 'detail_completion_status', label: '상세등록 완료', tier: 'expanded', db: 'study_rooms.detail_completion_status', input: 'select', optionsKey: 'detail_completion' },
    ],
  },
  tutor: {
    label: '과외쌤 찾기',
    defaultRegionHint: '시·군·구를 선택한 뒤 검색',
    mapEnabled: false,
    fields: [
      { key: 'tutor_region_id', label: '과외지역', tier: 'basic', basicRow: 1, db: 'tutor_regions.region_id', input: 'city' },
      { key: 'subject_master_id', label: '주력과목', tier: 'basic', basicRow: 1, db: 'tutor_subject_targets · is_primary', input: 'subject' },
      { key: 'school_level', label: '지도 학교급', tier: 'basic', basicRow: 1, db: 'tutor_subject_targets.school_level', input: 'select', optionsKey: 'school_level' },
      { key: 'grade_band', label: '지도 학년', tier: 'basic', basicRow: 1, db: 'tutor_subject_targets.grade_band', input: 'grade', dependsOn: 'school_level' },
      { key: 'preferred_fee_amount', label: '대표 과외비(월)', tier: 'basic', basicRow: 1, db: 'tutors.preferred_fee_amount', input: 'range' },
      { key: 'university_name', label: '대학/대학원', tier: 'basic', basicRow: 2, db: 'tutors.university_name', input: 'university' },
      { key: 'career_year_band', label: '경력구간', tier: 'basic', basicRow: 2, db: 'tutors.career_year_band', input: 'select', optionsKey: 'career_year_band' },
      { key: 'place_type', label: '강의장소', tier: 'basic', basicRow: 2, db: 'tutor_lesson_places.place_type', input: 'chips', optionsKey: 'tutor_place' },
      { key: 'major_name', label: '학과명', tier: 'expanded', db: 'tutors.major_name', input: 'text' },
      { key: 'university_status', label: '학적상태', tier: 'expanded', db: 'tutors.university_status', input: 'select', optionsKey: 'university_status' },
      { key: 'age_band', label: '연령대', tier: 'expanded', db: 'tutors.age_band', input: 'select', optionsKey: 'age_band' },
      { key: 'student_gender_group', label: '학생 성별 구성', tier: 'expanded', db: 'tutors.student_gender_group', input: 'select', optionsKey: 'gender_group' },
      { key: 'student_count_group', label: '수업인원', tier: 'expanded', db: 'tutors.student_count_group', input: 'select', optionsKey: 'student_count' },
      { key: 'teaching_style', label: '강의스타일', tier: 'expanded', db: 'tutor_teaching_style_badges', input: 'chips', optionsKey: 'teaching_style' },
    ],
  },
  student: {
    label: '학생 찾기',
    defaultRegionHint: '시·군·구를 선택한 뒤 검색',
    mapEnabled: false,
    fields: [
      { key: 'preferred_lesson_type', label: '희망 유형', tier: 'basic', basicRow: 1, db: 'students.preferred_lesson_type', input: 'select', optionsKey: 'preferred_lesson_type' },
      { key: 'preferred_region', label: '희망 지역', tier: 'basic', basicRow: 1, db: 'preferred_studyroom_region/complex · preferred_tutor_region', input: 'region' },
      { key: 'subject_master_id', label: '희망 과목', tier: 'basic', basicRow: 1, db: 'student_subject_targets', input: 'subject' },
      { key: 'school_level', label: '학교급', tier: 'basic', basicRow: 1, db: 'students.school_level', input: 'select', optionsKey: 'school_level' },
      { key: 'grade_level', label: '학년', tier: 'basic', basicRow: 1, db: 'students.grade_level', input: 'grade', dependsOn: 'school_level' },
      { key: 'budget_amount', label: '수업예산(월)', tier: 'basic', basicRow: 2, db: 'preferred_fee_amount / preferred_studyroom_fee_amount', input: 'range' },
      { key: 'place_type', label: '희망 수업장소', tier: 'basic', basicRow: 2, db: 'student_preferred_lesson_places', input: 'chips', optionsKey: 'student_place' },
      { key: 'preferred_student_count_group', label: '희망 수업인원', tier: 'basic', basicRow: 2, db: 'students.preferred_student_count_group', input: 'select', optionsKey: 'student_count' },
      { key: 'has_request_summary', label: '한 줄 요청문 있음', tier: 'basic', basicRow: 2, db: 'students.request_summary', input: 'toggle' },
      { key: 'lessons_per_week', label: '주 회수', tier: 'expanded', db: 'students.lessons_per_week', input: 'select', optionsKey: 'lesson_weekly' },
      { key: 'minutes_per_lesson', label: '1회 수업시간', tier: 'expanded', db: 'students.minutes_per_lesson', input: 'select', optionsKey: 'lesson_duration' },
      { key: 'lesson_format', label: '수업형태', tier: 'expanded', db: 'students.lesson_format', input: 'select', optionsKey: 'lesson_format' },
      { key: 'student_gender_group', label: '그룹 구성', tier: 'expanded', groupOnly: true, db: 'students.student_gender_group', input: 'select', optionsKey: 'student_gender_group' },
      { key: 'teaching_style', label: '희망 강의스타일', tier: 'expanded', db: 'student_preferred_teaching_style_badges', input: 'chips', optionsKey: 'teaching_style' },
      { key: 'preferred_tutor_gender', label: '희망 과외쌤 성별', tier: 'expanded', db: 'students.preferred_tutor_gender', input: 'select', optionsKey: 'preferred_tutor_gender' },
    ],
  },
};
