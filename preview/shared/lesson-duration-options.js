/**
 * 1회 수업시간. 20~120분(10분 간격) + 기타.
 * DB는 분(SMALLINT). 기타는 999. 150·180·over_180 은 기본 목록에 없다.
 */

export const LESSON_DURATION_LABEL = '1회 수업시간';
export const LESSON_DURATION_OTHER = '999';

/** @type {{ value: string, label: string }[]} */
export const LESSON_DURATION_OPTIONS = [];
for (let minutes = 20; minutes <= 120; minutes += 10) {
  LESSON_DURATION_OPTIONS.push({ value: String(minutes), label: `${minutes}분` });
}
LESSON_DURATION_OPTIONS.push({ value: LESSON_DURATION_OTHER, label: '기타' });

/** @type {Record<string, string>} */
export const LESSON_DURATION_LABELS = Object.fromEntries(
  LESSON_DURATION_OPTIONS.map((o) => [o.value, o.label]),
);

/**
 * @param {unknown} current
 * @returns {string}
 */
export function lessonDurationSelectValue(current) {
  const v = String(current ?? '').trim();
  if (v === 'over_180' || v === 'other' || v === LESSON_DURATION_OTHER) return LESSON_DURATION_OTHER;
  return v;
}

/**
 * 저장된 분(예: 150)은 목록 밖에 한 줄로만 남긴다. 기본 선택지에는 넣지 않는다.
 * @param {unknown} current
 */
export function lessonDurationOptions(current) {
  const v = lessonDurationSelectValue(current);
  if (!v || LESSON_DURATION_OPTIONS.some((o) => o.value === v)) return LESSON_DURATION_OPTIONS;
  if (!/^\d+$/.test(v)) return LESSON_DURATION_OPTIONS;
  const other = LESSON_DURATION_OPTIONS[LESSON_DURATION_OPTIONS.length - 1];
  return [...LESSON_DURATION_OPTIONS.slice(0, -1), { value: v, label: `${v}분` }, other];
}

/**
 * @param {unknown} current
 * @returns {string}
 */
export function lessonDurationLabel(current) {
  const v = String(current ?? '').trim();
  if (!v) return '';
  if (v === 'over_180' || v === 'other' || v === LESSON_DURATION_OTHER) return '기타';
  const hit = LESSON_DURATION_OPTIONS.find((o) => o.value === v);
  if (hit) return hit.label;
  if (/^\d+$/.test(v)) return `${v}분`;
  return v;
}
