/**
 * 과외쌤 기본정보 필수 항목 = 베이직카드 항목 (정본 73 2절).
 * src/Tutor/TutorBasicFields.php LABELS 와 같은 키·라벨·순서.
 * 과외지역 2·3번은 선택이라 목록에 없다. 성별은 계정 단계 값이라 넣지 않는다.
 */

export const TUTOR_BASIC_FIELDS = [
  { key: 'display_name', label: '표시명' },
  { key: 'primary_region', label: '과외지역 1' },
  { key: 'school_level', label: '대상(학교급)' },
  { key: 'main_subject', label: '주력과목' },
  { key: 'fee', label: '월 과외비' },
  { key: 'lessons_per_week', label: '주 회수' },
  { key: 'minutes', label: '1회 수업시간' },
  { key: 'lesson_places', label: '강의장소' },
  { key: 'student_gender_group', label: '지도 대상 성별' },
  { key: 'student_count_group', label: '수업인원' },
  { key: 'feature_1', label: '특징 1' },
  { key: 'slogan', label: '슬로건' },
  { key: 'profile_image', label: '프로필 사진' },
];

export const TUTOR_BASIC_FIELD_KEYS = TUTOR_BASIC_FIELDS.map((f) => f.key);

export const TUTOR_BASIC_LABELS = Object.fromEntries(TUTOR_BASIC_FIELDS.map((f) => [f.key, f.label]));

export const TUTOR_SCHOOL_LEVEL_CODES = ['preschool', 'elementary', 'middle', 'high', 'n_su', 'general', 'other'];

export const TUTOR_PLACE_OPTIONS = [
  { value: 'student_home_visit', label: '학생자택방문' },
  { value: 'public_place', label: '공공장소' },
  { value: 'tutor_home', label: '강사자택' },
];

export const GENDER_GROUP_OPTIONS = [
  { value: 'male', label: '남학생' },
  { value: 'female', label: '여학생' },
  { value: 'mixed', label: '남여' },
];

export const STUDENT_COUNT_OPTIONS = [
  { value: 'solo', label: '단독' },
  { value: 'two', label: '2명' },
  { value: 'three', label: '3명' },
  { value: 'four_plus', label: '4명 이상' },
];

export const TUTOR_FEATURE_MAX = 100;
export const TUTOR_SLOGAN_MAX = 255;
export const TUTOR_DISPLAY_NAME_MAX = 50;

const SMALLINT_UNSIGNED_MAX = 65535;

function text(v) {
  return String(v ?? '').trim();
}

function positiveInt(v, max) {
  const raw = text(v);
  if (!/^\d+$/.test(raw)) return false;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n >= 1 && n <= max;
}

/**
 * @typedef {object} TutorBasicValues
 * @property {string} [tutor_display_name]
 * @property {boolean} [has_primary_region]
 * @property {string} [school_level]
 * @property {string} [main_subject_note]
 * @property {number|string} [preferred_fee_amount] 원 단위
 * @property {number|string} [lessons_per_week]
 * @property {number|string} [minutes_per_lesson]
 * @property {string[]} [lesson_places]
 * @property {string} [student_gender_group]
 * @property {string} [student_count_group]
 * @property {string} [feature_1]
 * @property {string} [slogan]
 * @property {boolean} [has_profile_image]
 */

/** @param {TutorBasicValues} v @returns {Record<string, boolean>} */
export function tutorBasicOkMap(v) {
  const t = v && typeof v === 'object' ? v : {};
  const places = Array.isArray(t.lesson_places) ? t.lesson_places : [];
  return {
    display_name: text(t.tutor_display_name) !== '' && text(t.tutor_display_name).length <= TUTOR_DISPLAY_NAME_MAX,
    primary_region: t.has_primary_region === true,
    school_level: TUTOR_SCHOOL_LEVEL_CODES.includes(text(t.school_level)),
    main_subject: text(t.main_subject_note) !== '',
    fee: positiveInt(t.preferred_fee_amount, 4294967295),
    lessons_per_week: positiveInt(t.lessons_per_week, SMALLINT_UNSIGNED_MAX),
    minutes: positiveInt(t.minutes_per_lesson, SMALLINT_UNSIGNED_MAX),
    lesson_places: places.some((p) => TUTOR_PLACE_OPTIONS.some((o) => o.value === p)),
    student_gender_group: GENDER_GROUP_OPTIONS.some((o) => o.value === text(t.student_gender_group)),
    student_count_group: STUDENT_COUNT_OPTIONS.some((o) => o.value === text(t.student_count_group)),
    feature_1: text(t.feature_1) !== '' && text(t.feature_1).length <= TUTOR_FEATURE_MAX,
    slogan: text(t.slogan) !== '' && text(t.slogan).length <= TUTOR_SLOGAN_MAX,
    profile_image: t.has_profile_image === true,
  };
}

/** @param {TutorBasicValues} v @param {{ skip?: string[] }} [opts] @returns {string[]} 빈 항목 라벨 (목록 순서) */
export function tutorBasicMissing(v, opts = {}) {
  const skip = new Set(opts.skip || []);
  const ok = tutorBasicOkMap(v);
  return TUTOR_BASIC_FIELDS.filter((f) => !skip.has(f.key) && !ok[f.key]).map((f) => f.label);
}

/** @param {string[]} labels */
export function tutorBasicMissingMessage(labels) {
  return `기본정보를 모두 채워 주세요: ${labels.join(', ')}`;
}

/** 마이페이지 TutorRecord(TutorHubRepository) → 검사 값 */
export function tutorBasicValuesFromRecord(t) {
  const r = t && typeof t === 'object' ? t : {};
  return {
    tutor_display_name: r.tutor_display_name,
    has_primary_region: !!(r.has_primary_region && text(r.primary_region_label)),
    school_level: r.school_level,
    main_subject_note: r.has_primary_subject === false ? '' : r.main_subject_note,
    preferred_fee_amount: r.preferred_fee_amount,
    lessons_per_week: r.lessons_per_week,
    minutes_per_lesson: r.minutes_per_lesson,
    lesson_places: r.lesson_places,
    student_gender_group: r.student_gender_group,
    student_count_group: r.student_count_group,
    feature_1: r.feature_1,
    slogan: r.slogan,
    has_profile_image: !!r.has_profile_image,
  };
}

/** /api/tutor/register.php load 응답(TutorRegisterService::hydrateTutor) → 검사 값 */
export function tutorBasicValuesFromRegisterTutor(t) {
  const r = t && typeof t === 'object' ? t : {};
  const regions = Array.isArray(r.saved_regions) ? r.saved_regions : [];
  const images = Array.isArray(r.images) ? r.images : [];
  return {
    tutor_display_name: r.tutor_display_name,
    has_primary_region: /^[1-9]\d*$/.test(text(regions[0]?.region_id)),
    school_level: r.school_level,
    main_subject_note: r.main_subject_note,
    preferred_fee_amount: r.preferred_fee_amount,
    lessons_per_week: r.lessons_per_week,
    minutes_per_lesson: r.minutes_per_lesson,
    lesson_places: r.lesson_places,
    student_gender_group: r.student_gender_group,
    student_count_group: r.student_count_group,
    feature_1: r.feature_1,
    slogan: r.slogan,
    has_profile_image: images.some((img) => text(img?.image_path || img?.name) !== ''),
  };
}
