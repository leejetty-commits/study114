import {
  SCHOOL_LEVEL_LABELS,
  STUDENT_COUNT_LABELS,
  STUDENT_PLACE_LABELS,
  TEACHING_STYLE_LABELS,
  TUTOR_PLACE_LABELS,
} from '@home-enums';

export {
  SCHOOL_LEVEL_LABELS,
  STUDENT_COUNT_LABELS,
  STUDENT_PLACE_LABELS,
  TEACHING_STYLE_LABELS,
  TUTOR_PLACE_LABELS,
};

export const STUDY_ROOM_PLACE_LABELS = {
  academy: '교습소',
  study_room: '공부방',
};

export const LESSON_OPERATION_LABELS = {
  group_by_time_slot: '타임별 그룹',
  time_slot_mixed_grade: '타임별 무학년',
  individual_visit: '개별 방문',
};

export const CAPACITY_LABELS = {
  one_to_four: '1~4명',
  five_to_eight: '5~8명',
  nine_plus: '9명 이상',
};

export const CAREER_YEAR_BAND_LABELS = {
  y1_3: '1~3년',
  y4_6: '4~6년',
  y7_10: '7~10년',
  y10_plus: '10년 이상',
};

export const UNIVERSITY_STATUS_LABELS = {
  enrolled: '재학',
  leave: '휴학',
  completed: '수료',
  graduated: '졸업',
};

export const AGE_BAND_LABELS = {
  early_20s: '20대 초',
  late_20s: '20대 후',
  early_30s: '30대 초',
  late_30s: '30대 후',
  early_40s: '40대 초',
  late_40s: '40대 후',
  over_50: '50대 이상',
};

export const GENDER_GROUP_LABELS = {
  male: '남학생',
  female: '여학생',
  mixed: '남녀',
};

export const PREFERRED_LESSON_TYPE_LABELS = {
  tutor: '과외',
  study_room: '공부방',
  both: '과외+공부방',
};

export const FACILITY_LABELS = {
  aircon: '에어컨',
  ventilation: '환기',
  restroom: '화장실/샤워',
  parking: '주차/발렛',
  safety: 'CCTV/안전',
};

/** @type {Record<string, Record<string, string>>} */
export const LESSON_FORMAT_LABELS = {
  one_on_one: '단독과외',
  group: '그룹과외',
};

export const STUDENT_GENDER_GROUP_LABELS = {
  male: '남',
  female: '여',
  mixed: '남여',
};

export const OPTION_LABELS = {
  school_level: SCHOOL_LEVEL_LABELS,
  study_room_place: STUDY_ROOM_PLACE_LABELS,
  lesson_operation: LESSON_OPERATION_LABELS,
  capacity: CAPACITY_LABELS,
  career_year_band: CAREER_YEAR_BAND_LABELS,
  tutor_place: TUTOR_PLACE_LABELS,
  gender_group: GENDER_GROUP_LABELS,
  student_count: STUDENT_COUNT_LABELS,
  teaching_style: TEACHING_STYLE_LABELS,
  university_status: UNIVERSITY_STATUS_LABELS,
  age_band: AGE_BAND_LABELS,
  student_place: STUDENT_PLACE_LABELS,
  preferred_lesson_type: PREFERRED_LESSON_TYPE_LABELS,
  facility: FACILITY_LABELS,
  lesson_format: LESSON_FORMAT_LABELS,
  student_gender_group: STUDENT_GENDER_GROUP_LABELS,
  detail_completion: {
    basic_only: '기본만',
    expanded_in_progress: '상세 진행중',
    expanded_complete: '상세 완료',
  },
};
