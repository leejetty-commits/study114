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
    label: '공부방찾기',
    defaultRegionHint: '내 기본 지역(동/단지) 자동 적용',
    mapEnabled: true,
    fields: [
      { key: 'region_id', label: '지역(동/단지)', tier: 'basic', basicRow: 1, db: 'study_rooms.region_id · study_room_regions', input: 'region' },
      { key: 'subject_master_id', label: '주력과목', tier: 'basic', basicRow: 1, db: 'study_room_subject_targets · main_subject_note', input: 'subject' },
      { key: 'school_level', label: '대상 학년/학교급', tier: 'basic', basicRow: 1, db: 'study_room_subject_targets.school_level', input: 'select', optionsKey: 'school_level' },
      { key: 'price_amount', label: '가격대(월)', tier: 'basic', basicRow: 1, db: 'study_rooms.price_amount', input: 'range' },
      { key: 'lesson_place_type', label: '수업장소', tier: 'basic', basicRow: 2, db: 'study_rooms.lesson_place_type', input: 'select', optionsKey: 'study_room_place' },
      { key: 'lesson_operation_type', label: '수업운영형태', tier: 'basic', basicRow: 2, db: 'study_rooms.lesson_operation_type', input: 'select', optionsKey: 'lesson_operation' },
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
    label: '과외쌤찾기',
    defaultRegionHint: '내 기본 시 자동 적용',
    mapEnabled: false,
    fields: [
      { key: 'tutor_region_id', label: '활동 지역(시)', tier: 'basic', basicRow: 1, db: 'tutor_regions.region_id', input: 'city' },
      { key: 'subject_master_id', label: '주력과목', tier: 'basic', basicRow: 1, db: 'tutor_subject_targets · is_primary', input: 'subject' },
      { key: 'school_level', label: '대상 학생군/학년', tier: 'basic', basicRow: 1, db: 'tutor_subject_targets.school_level', input: 'select', optionsKey: 'school_level' },
      { key: 'preferred_fee_amount', label: '대표 과외비(월)', tier: 'basic', basicRow: 1, db: 'tutors.preferred_fee_amount', input: 'range' },
      { key: 'university_name', label: '학교명', tier: 'basic', basicRow: 2, db: 'tutors.university_name', input: 'text' },
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
    label: '학생찾기',
    defaultRegionHint: '내 영업권 지역 자동 적용',
    mapEnabled: false,
    fields: [
      { key: 'preferred_lesson_type', label: '희망 유형', tier: 'basic', basicRow: 1, db: 'students.preferred_lesson_type', input: 'select', optionsKey: 'preferred_lesson_type' },
      { key: 'preferred_region', label: '희망 지역', tier: 'basic', basicRow: 1, db: 'preferred_studyroom_region/complex · preferred_tutor_region', input: 'region' },
      { key: 'subject_master_id', label: '희망 과목', tier: 'basic', basicRow: 1, db: 'student_subject_targets', input: 'subject' },
      { key: 'grade_level', label: '학교급/학년', tier: 'basic', basicRow: 1, db: 'students.grade_level', input: 'text' },
      { key: 'budget_amount', label: '수업예산(월)', tier: 'basic', basicRow: 2, db: 'preferred_fee_amount / preferred_studyroom_fee_amount', input: 'range' },
      { key: 'place_type', label: '희망 수업장소', tier: 'basic', basicRow: 2, db: 'student_preferred_lesson_places', input: 'chips', optionsKey: 'student_place' },
      { key: 'preferred_student_count_group', label: '희망 수업인원', tier: 'basic', basicRow: 2, db: 'students.preferred_student_count_group', input: 'select', optionsKey: 'student_count' },
      { key: 'lessons_per_week', label: '주 횟수', tier: 'expanded', db: 'students.lessons_per_week', input: 'text' },
      { key: 'minutes_per_lesson', label: '1회 시간(분)', tier: 'expanded', db: 'students.minutes_per_lesson', input: 'text' },
      { key: 'lesson_format', label: '수업형태', tier: 'expanded', db: 'students.lesson_format', input: 'select', optionsKey: 'lesson_format' },
      { key: 'student_gender_group', label: '그룹 구성', tier: 'expanded', groupOnly: true, db: 'students.student_gender_group', input: 'select', optionsKey: 'student_gender_group' },
      { key: 'teaching_style', label: '희망 강의스타일', tier: 'expanded', db: 'student_preferred_teaching_style_badges', input: 'chips', optionsKey: 'teaching_style' },
    ],
  },
};

export const MOCK_SUBJECTS = ['수학', '영어', '국어', '과학', '사회'];

/**
 * 비로그인·프리뷰 기본 지역 (축별 분리 · 7.18 확정)
 * - 공부방: 행정동 · 과외쌤/학생: 시
 * 로그인 후에는 계정 노출/활동/희망 슬롯으로 대체한다.
 */
export const GUEST_DEFAULT_REGIONS = {
  room: '서울 강남구 대치동',
  tutor: '서울시',
  student: '서울시',
};

/** 과외 활동/희망 시 — 최대 3 · 대표 1 (시 단위만) */
export const MOCK_TUTOR_REGIONS = [
  { id: 'seoul', label: '서울시', primary: true },
  { id: 'busan', label: '부산시', primary: false },
  { id: 'incheon', label: '인천시', primary: false },
];

/** @param {number} [index] */
export function getTutorRegionLabel(index = 0) {
  return MOCK_TUTOR_REGIONS[index]?.label || MOCK_TUTOR_REGIONS[0].label;
}

export const MOCK_REGIONS = {
  room: GUEST_DEFAULT_REGIONS.room,
  tutor: GUEST_DEFAULT_REGIONS.tutor,
  student: GUEST_DEFAULT_REGIONS.student,
};

/** §8-4 결과 행 더미 */
export const MOCK_RESULT_ROWS = {
  room: [
    { left: '대치 대표 노출 수학 공부방\n대치동', center: '중등·고등 수학\n소수정예 · 숙제관리', right: '월 48만원\n찜 · 비교 · 상세' },
    { left: '우동 추천 노출 영어 공부방\n해운대', center: '초등·중등 영어\n발음교정', right: '월 32만원\n찜 · 비교 · 상세' },
    { left: '센텀 기본 노출 국어 공부방\n센텀동', center: '초등·중등 국어\n독해 중심', right: '월 22만원\n찜 · 비교 · 상세' },
  ],
  tutor: [
    { left: '대치 대표 노출 수학\n강남구', center: '중·고 수학 · 서울대 수학과\n경력 7~10년', right: '월 60만원 · 주2 · 90분\n찜 · 비교 · 상세' },
    { left: '우동 추천 노출 영어\n해운대', center: '초·중 영어 · 연세대\n아이엘츠', right: '월 40만원 · 주2 · 60분\n찜 · 비교 · 상세' },
  ],
  student: [
    { left: '맑은하늘\n중2 · 남', center: '수학·영어 · 학생자택\n단독과외', right: '수업예산 55만\n메모 보내기' },
    { left: '초등왕\n초5 · 여', center: '종합 · 공부방\n그룹과외 · 남여 · 2명', right: '수업예산 38만\n메모 보내기' },
  ],
};
