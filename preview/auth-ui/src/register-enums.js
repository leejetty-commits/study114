/** 14장 — 기본등록 ENUM (DB code → UI 한글) */

export const PREFERRED_LESSON_TYPE_LABELS = {
  tutor: '과외쌤',
  study_room: '공부방',
};

export const STUDENT_PLACE_OPTIONS = [
  { value: 'student_home', label: '학생자택' },
  { value: 'study_room', label: '공부방' },
  { value: 'public_place', label: '공공장소' },
];

export const STUDENT_COUNT_OPTIONS = [
  { value: 'solo', label: '단독' },
  { value: 'two', label: '2명' },
  { value: 'three', label: '3명' },
  { value: 'four_plus', label: '4명 이상' },
];

export const TEACHING_STYLE_OPTIONS = [
  { value: 'passion', label: '열정' },
  { value: 'meticulous', label: '꼼꼼' },
  { value: 'kind', label: '친절' },
  { value: 'from_basics', label: '기초부터' },
  { value: 'advanced_focus', label: '고난이도중심' },
  { value: 'concept_focus', label: '개념중심' },
  { value: 'solution_focus', label: '풀이중심' },
];

export const SCHOOL_LEVEL_OPTIONS = [
  { value: 'preschool', label: '미취학' },
  { value: 'elementary', label: '초등' },
  { value: 'middle', label: '중등' },
  { value: 'high', label: '고등' },
  { value: 'n_su', label: 'N수' },
];

export const VISIBILITY_OPTIONS = [
  { value: 'private', label: '비공개' },
  { value: 'paid_only', label: '유료공개' },
];

export const CAPACITY_PER_TIME_OPTIONS = [
  { value: 'one_to_four', label: '1~4명' },
  { value: 'five_to_eight', label: '5~8명' },
  { value: 'nine_plus', label: '최대 9명' },
];

export const CAREER_YEAR_BAND_OPTIONS = [
  { value: 'y1_3', label: '1~3년' },
  { value: 'y4_6', label: '4~6년' },
  { value: 'y7_10', label: '7~10년' },
  { value: 'y10_plus', label: '10년 이상' },
];

export const UNIVERSITY_STATUS_OPTIONS = [
  { value: 'enrolled', label: '재학' },
  { value: 'leave', label: '휴학' },
  { value: 'completed', label: '수료' },
  { value: 'graduated', label: '졸업' },
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

export const TUTOR_PLACE_OPTIONS = [
  { value: 'student_home_visit', label: '학생자택방문' },
  { value: 'public_place', label: '공공장소' },
  { value: 'tutor_home', label: '강사자택' },
];

export const FEE_BASIS_OPTIONS = [
  { value: 'monthly_by_weekly_schedule', label: '주간 일정 기준 월액' },
  { value: 'monthly_by_total_sessions', label: '월 총 횟수 기준' },
];

export const LESSON_OPERATION_OPTIONS = [
  { value: 'group_by_time_slot', label: '타임별 그룹' },
  { value: 'time_slot_mixed_grade', label: '타임별 혼합학년' },
  { value: 'individual_visit', label: '개별 방문' },
];

export const LESSON_PLACE_TYPE_OPTIONS = [
  { value: 'academy', label: '교습소' },
  { value: 'study_room', label: '공부방' },
];

export const LESSON_FORMAT_OPTIONS = [
  { value: 'one_on_one', label: '단독과외' },
  { value: 'group', label: '그룹과외' },
];

export const PERSONAL_GENDER_OPTIONS = [
  { value: 'male', label: '남' },
  { value: 'female', label: '여' },
];

export const STUDENT_GENDER_GROUP_OPTIONS = [
  { value: 'male', label: '남' },
  { value: 'female', label: '여' },
  { value: 'mixed', label: '남여' },
];

export const GENDER_GROUP_OPTIONS = [
  { value: 'male', label: '남학생' },
  { value: 'female', label: '여학생' },
  { value: 'mixed', label: '혼성' },
];
