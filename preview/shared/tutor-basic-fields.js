/**
 * 과외쌤 기본등록 필수 8개 (정본 73 0-2절).
 * src/Tutor/TutorBasicFields.php LABELS 와 같은 키·라벨·순서.
 * 과외지역 2·3번은 선택이라 목록에 없다. 성별은 계정 단계 값이다.
 * 사진·수업장소·원생수·특징은 상세등록 선택 항목이다.
 */

export const TUTOR_BASIC_FIELDS = [
  { key: 'display_name', label: '표시명' },
  { key: 'primary_region', label: '과외지역 1' },
  { key: 'school_level', label: '대상(학교급)' },
  { key: 'main_subject', label: '주력과목' },
  { key: 'fee', label: '월 과외비' },
  { key: 'lessons_per_week', label: '주 회수' },
  { key: 'minutes', label: '1회 수업시간' },
  { key: 'slogan', label: '슬로건' },
];

export const TUTOR_BASIC_FIELD_KEYS = TUTOR_BASIC_FIELDS.map((f) => f.key);

export const TUTOR_BASIC_LABELS = Object.fromEntries(TUTOR_BASIC_FIELDS.map((f) => [f.key, f.label]));

export const TUTOR_SCHOOL_LEVEL_CODES = ['preschool', 'elementary', 'middle', 'high', 'n_su', 'general', 'other'];

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
 * @property {string} [slogan]
 */

/** @param {TutorBasicValues} v @returns {Record<string, boolean>} */
export function tutorBasicOkMap(v) {
  const t = v && typeof v === 'object' ? v : {};
  return {
    display_name: text(t.tutor_display_name) !== '' && text(t.tutor_display_name).length <= TUTOR_DISPLAY_NAME_MAX,
    primary_region: t.has_primary_region === true,
    school_level: TUTOR_SCHOOL_LEVEL_CODES.includes(text(t.school_level)),
    main_subject: text(t.main_subject_note) !== '',
    fee: positiveInt(t.preferred_fee_amount, 4294967295),
    lessons_per_week: positiveInt(t.lessons_per_week, SMALLINT_UNSIGNED_MAX),
    minutes: positiveInt(t.minutes_per_lesson, SMALLINT_UNSIGNED_MAX),
    slogan: text(t.slogan) !== '' && text(t.slogan).length <= TUTOR_SLOGAN_MAX,
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
    slogan: r.slogan,
  };
}

/** /api/tutor/register.php load 응답(TutorRegisterService::hydrateTutor) → 검사 값 */
export function tutorBasicValuesFromRegisterTutor(t) {
  const r = t && typeof t === 'object' ? t : {};
  const regions = Array.isArray(r.saved_regions) ? r.saved_regions : [];
  return {
    tutor_display_name: r.tutor_display_name,
    has_primary_region: /^[1-9]\d*$/.test(text(regions[0]?.region_id)),
    school_level: r.school_level,
    main_subject_note: r.main_subject_note,
    preferred_fee_amount: r.preferred_fee_amount,
    lessons_per_week: r.lessons_per_week,
    minutes_per_lesson: r.minutes_per_lesson,
    slogan: r.slogan,
  };
}
