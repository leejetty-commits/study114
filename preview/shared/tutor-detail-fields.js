/**
 * 과외쌤 상세정보1·2 칸 한 벌. 화면 라벨과 등록점검 표가 이 목록을 같이 쓴다.
 */
import { SCHOOL_LEVEL_FORM_LABELS } from './school-grade.js';
import { lessonWeeklyLabel } from './lesson-weekly-options.js';
import { lessonMonthlyLabel } from './lesson-monthly-options.js';
import { YOUTUBE_URL_FIELDS, BLOG_PAIRS } from './promo-links.js';

export const TUTOR_DETAIL_GROUP_LESSON = '수업 · 과목 · 가격';
export const TUTOR_DETAIL_GROUP_CAREER = '학력 · 경력 · 특징';
export const TUTOR_DETAIL_GROUP_PROMO = '홍보 채널';
export const TUTOR_DETAIL_GROUP_PHOTO = '프로필 사진';

const GENDER = { male: '남학생', female: '여학생', mixed: '혼성' };
const COUNT = { solo: '단독', two: '2명', three: '3명', four_plus: '4명 이상' };
const AGE = {
  early_20s: '20대 전반',
  late_20s: '20대 후반',
  early_30s: '30대 전반',
  late_30s: '30대 후반',
  early_40s: '40대 전반',
  late_40s: '40대 후반',
  over_50: '50대 이상',
};
const BASIS = {
  monthly_by_weekly_schedule: '주 회수 기준',
  monthly_by_total_sessions: '월 총 횟수 기준',
};
const PLACE = {
  student_home_visit: '학생자택방문',
  public_place: '공공장소',
  tutor_home: '강사자택',
};
const UNI = { enrolled: '재학', leave: '휴학', completed: '수료', graduated: '졸업' };
const CAREER = { y1_3: '1~3년', y4_6: '4~6년', y7_10: '7~10년', y10_plus: '10년 이상' };
const STYLE = {
  passion: '열정',
  meticulous: '꼼꼼',
  kind: '친절',
  from_basics: '기초부터',
  advanced_focus: '고난이도',
  concept_focus: '개념중심',
  solution_focus: '풀이중심',
};

function text(v) {
  return String(v ?? '').trim();
}

function filledText(v) {
  return text(v) !== '';
}

function weeklyBasis(tutor) {
  return text(tutor?.fee_basis_type) !== 'monthly_by_total_sessions';
}

function subjectSummary(tutor) {
  const rows = (Array.isArray(tutor?.subjects) ? tutor.subjects : []).filter((row) => text(row?.subject_name));
  if (!rows.length) return '';
  const first = rows[0];
  const level = SCHOOL_LEVEL_FORM_LABELS[first.school_level] || '';
  const grade = text(first.grade_band);
  const inner = [level, grade].filter(Boolean).join('·');
  const head = `${text(first.subject_name)}${inner ? `(${inner})` : ''}`;
  return rows.length > 1 ? `${head} 외 ${rows.length - 1}` : head;
}

function styleSummary(tutor) {
  const names = (Array.isArray(tutor?.teaching_style_badges) ? tutor.teaching_style_badges : [])
    .map((id) => STYLE[id])
    .filter(Boolean);
  if (!names.length) return '';
  if (names.length <= 2) return names.join(' · ');
  return `${names.slice(0, 2).join(' · ')} 외 ${names.length - 2}`;
}

function promoSummary(tutor) {
  const parts = [];
  const youtube = YOUTUBE_URL_FIELDS.filter((key) => text(tutor?.[key])).length;
  const blog = BLOG_PAIRS.filter((pair) => text(tutor?.[pair.url])).length;
  if (youtube) parts.push(`유튜브 ${youtube}`);
  if (blog) parts.push(`블로그 ${blog}`);
  if (text(tutor?.instagram_url)) parts.push('인스타');
  if (text(tutor?.tiktok_url)) parts.push('틱톡');
  if (text(tutor?.naver_clip_url)) parts.push('네이버 클립');
  return parts.join(' · ');
}

function photoSummary(tutor) {
  if (!tutor?.has_profile_image) return '';
  const n = Array.isArray(tutor?.profile_images) ? tutor.profile_images.length : 0;
  return n > 0 ? `${n}장` : '등록됨';
}

/**
 * @typedef {object} TutorDetailField
 * @property {string} id
 * @property {string | ((tutor: object) => string)} label
 * @property {'detail'|'detail2'} tab
 * @property {string} group
 * @property {number} order
 * @property {string | ((tutor: object) => string)} focus
 * @property {(tutor: object) => string} value
 * @property {(tutor: object) => boolean} filled
 * @property {(tutor: object) => boolean} [visible]
 */

/** @type {TutorDetailField[]} */
export const TUTOR_DETAIL_FIELDS = [
  {
    id: 'student_gender_group',
    label: '지도 대상 성별',
    tab: 'detail',
    group: TUTOR_DETAIL_GROUP_LESSON,
    order: 10,
    focus: 'student_target',
    value: (t) => GENDER[t?.student_gender_group] || '',
    filled: (t) => filledText(GENDER[t?.student_gender_group]),
  },
  {
    id: 'student_count_group',
    label: '수업인원',
    tab: 'detail',
    group: TUTOR_DETAIL_GROUP_LESSON,
    order: 20,
    focus: 'student_count_group',
    value: (t) => COUNT[t?.student_count_group] || '',
    filled: (t) => filledText(COUNT[t?.student_count_group]),
  },
  {
    id: 'age_band',
    label: '과외쌤 연령대',
    tab: 'detail',
    group: TUTOR_DETAIL_GROUP_LESSON,
    order: 30,
    focus: 'age_band',
    value: (t) => AGE[t?.age_band] || '',
    filled: (t) => filledText(AGE[t?.age_band]),
  },
  {
    id: 'subjects',
    label: '추가 과목',
    tab: 'detail',
    group: TUTOR_DETAIL_GROUP_LESSON,
    order: 40,
    focus: 'subjects',
    value: subjectSummary,
    filled: (t) => subjectSummary(t) !== '',
  },
  {
    id: 'fee_basis',
    label: '산정방식',
    tab: 'detail',
    group: TUTOR_DETAIL_GROUP_LESSON,
    order: 50,
    focus: 'fee_basis',
    value: (t) => BASIS[t?.fee_basis_type] || '',
    filled: (t) => filledText(BASIS[t?.fee_basis_type]),
  },
  {
    id: 'schedule',
    label: (t) => (weeklyBasis(t) ? '주 회수' : '월 총 횟수'),
    tab: 'detail',
    group: TUTOR_DETAIL_GROUP_LESSON,
    order: 60,
    focus: (t) => (weeklyBasis(t) ? 'lessons_per_week' : 'monthly_session_count'),
    value: (t) => (weeklyBasis(t) ? lessonWeeklyLabel(t?.lessons_per_week) : lessonMonthlyLabel(t?.monthly_session_count)),
    filled: (t) =>
      weeklyBasis(t)
        ? lessonWeeklyLabel(t?.lessons_per_week) !== ''
        : lessonMonthlyLabel(t?.monthly_session_count) !== '',
  },
  {
    id: 'fee_description',
    label: '가격 설명',
    tab: 'detail',
    group: TUTOR_DETAIL_GROUP_LESSON,
    order: 70,
    focus: 'fee_description',
    value: (t) => text(t?.fee_description),
    filled: (t) => filledText(t?.fee_description),
  },
  {
    id: 'lesson_places',
    label: '강의장소',
    tab: 'detail',
    group: TUTOR_DETAIL_GROUP_LESSON,
    order: 80,
    focus: 'lesson_places',
    value: (t) =>
      (Array.isArray(t?.lesson_places) ? t.lesson_places : [])
        .map((id) => PLACE[id])
        .filter(Boolean)
        .join(' · '),
    filled: (t) =>
      (Array.isArray(t?.lesson_places) ? t.lesson_places : []).some((id) => PLACE[id]),
  },
  {
    id: 'university_name',
    label: '대학/대학원',
    tab: 'detail2',
    group: TUTOR_DETAIL_GROUP_CAREER,
    order: 110,
    focus: 'university',
    value: (t) => text(t?.university_name),
    filled: (t) => filledText(t?.university_name),
  },
  {
    id: 'major_name',
    label: '전공',
    tab: 'detail2',
    group: TUTOR_DETAIL_GROUP_CAREER,
    order: 120,
    focus: 'major_name',
    value: (t) => text(t?.major_name),
    filled: (t) => filledText(t?.major_name),
  },
  {
    id: 'university_status',
    label: '학적상태',
    tab: 'detail2',
    group: TUTOR_DETAIL_GROUP_CAREER,
    order: 130,
    focus: 'university_status',
    value: (t) => UNI[t?.university_status] || '',
    filled: (t) => filledText(UNI[t?.university_status]),
  },
  {
    id: 'career_year_band',
    label: '경력구간',
    tab: 'detail2',
    group: TUTOR_DETAIL_GROUP_CAREER,
    order: 140,
    focus: 'career_year_band',
    value: (t) => CAREER[t?.career_year_band] || '',
    filled: (t) => filledText(CAREER[t?.career_year_band]),
  },
  {
    id: 'main_material_note',
    label: '주교재',
    tab: 'detail2',
    group: TUTOR_DETAIL_GROUP_CAREER,
    order: 150,
    focus: 'main_material_note',
    value: (t) => text(t?.main_material_note),
    filled: (t) => filledText(t?.main_material_note),
  },
  {
    id: 'feature_1',
    label: '특징 1',
    tab: 'detail2',
    group: TUTOR_DETAIL_GROUP_CAREER,
    order: 160,
    focus: 'feature_1',
    value: (t) => text(t?.feature_1),
    filled: (t) => filledText(t?.feature_1),
  },
  {
    id: 'feature_2',
    label: '특징 2',
    tab: 'detail2',
    group: TUTOR_DETAIL_GROUP_CAREER,
    order: 170,
    focus: 'feature_2',
    value: (t) => text(t?.feature_2),
    filled: (t) => filledText(t?.feature_2),
  },
  {
    id: 'feature_3',
    label: '특징 3',
    tab: 'detail2',
    group: TUTOR_DETAIL_GROUP_CAREER,
    order: 180,
    focus: 'feature_3',
    value: (t) => text(t?.feature_3),
    filled: (t) => filledText(t?.feature_3),
  },
  {
    id: 'proof_document_available',
    label: '증빙서류 제출 가능',
    tab: 'detail2',
    group: TUTOR_DETAIL_GROUP_CAREER,
    order: 190,
    focus: 'proof_document_available',
    value: (t) => (t?.proof_document_available ? '제출 가능' : ''),
    filled: (t) => !!t?.proof_document_available,
  },
  {
    id: 'teaching_style_badges',
    label: '강의스타일',
    tab: 'detail2',
    group: TUTOR_DETAIL_GROUP_CAREER,
    order: 200,
    focus: 'teaching_style_badges',
    value: styleSummary,
    filled: (t) => styleSummary(t) !== '',
  },
  {
    id: 'intro_long',
    label: '상세 소개',
    tab: 'detail2',
    group: TUTOR_DETAIL_GROUP_CAREER,
    order: 210,
    focus: 'intro_long',
    value: (t) => text(t?.intro_long),
    filled: (t) => filledText(t?.intro_long),
  },
  {
    id: 'contact_time_note',
    label: '연락 가능 시간',
    tab: 'detail2',
    group: TUTOR_DETAIL_GROUP_CAREER,
    order: 220,
    focus: 'contact_time_note',
    value: (t) => text(t?.contact_time_note),
    filled: (t) => filledText(t?.contact_time_note),
  },
  {
    id: 'promo_channels',
    label: '홍보 채널',
    tab: 'detail2',
    group: TUTOR_DETAIL_GROUP_PROMO,
    order: 310,
    focus: 'promo_channels',
    value: promoSummary,
    filled: (t) => promoSummary(t) !== '',
  },
  {
    id: 'profile_image',
    label: '프로필 사진',
    tab: 'detail2',
    group: TUTOR_DETAIL_GROUP_PHOTO,
    order: 410,
    focus: 'profile_image',
    value: photoSummary,
    filled: (t) => !!t?.has_profile_image,
  },
];

/** @param {string} id */
export function tutorDetailField(id) {
  return TUTOR_DETAIL_FIELDS.find((field) => field.id === id) || null;
}

/** @param {TutorDetailField} field @param {object} [tutor] */
export function tutorDetailFieldText(field, tutor) {
  return typeof field.label === 'function' ? field.label(tutor || {}) : field.label;
}

/** @param {TutorDetailField} field @param {object} [tutor] */
export function tutorDetailFieldFocus(field, tutor) {
  return typeof field.focus === 'function' ? field.focus(tutor || {}) : field.focus;
}

/** 옛 `detail?focus=` 가 상세정보2 칸이면 detail2. 모르는 칸은 detail. */
export function tutorDetailTabForFocus(focus) {
  const key = text(focus);
  if (!key) return 'detail';
  for (const field of TUTOR_DETAIL_FIELDS) {
    const names = new Set([field.id]);
    if (typeof field.focus === 'string') names.add(field.focus);
    if (field.id === 'schedule') {
      names.add('lessons_per_week');
      names.add('monthly_session_count');
    }
    if (names.has(key)) return field.tab;
  }
  return 'detail';
}

export function tutorDetailFocusIds() {
  const ids = new Set();
  for (const field of TUTOR_DETAIL_FIELDS) {
    if (typeof field.focus === 'string') ids.add(field.focus);
  }
  ids.add('lessons_per_week');
  ids.add('monthly_session_count');
  return [...ids];
}
