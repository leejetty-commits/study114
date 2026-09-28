/**
 * 주 회수. 1~7회 + 기타. 「7회 이상」은 쓰지 않는다.
 * DB는 횟수(SMALLINT). 기타는 8.
 */

export const LESSON_WEEKLY_LABEL = '주 회수';
export const LESSON_WEEKLY_OTHER = '8';

/** @type {{ value: string, label: string }[]} */
export const LESSON_WEEKLY_OPTIONS = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
  value: String(n),
  label: `${n}회`,
}));
LESSON_WEEKLY_OPTIONS.push({ value: LESSON_WEEKLY_OTHER, label: '기타' });

/** @type {Record<string, string>} */
export const LESSON_WEEKLY_LABELS = Object.fromEntries(
  LESSON_WEEKLY_OPTIONS.map((o) => [o.value, o.label]),
);

/**
 * @param {unknown} current
 * @returns {string}
 */
export function lessonWeeklySelectValue(current) {
  const v = String(current ?? '').trim();
  if (v === 'other' || v === LESSON_WEEKLY_OTHER) return LESSON_WEEKLY_OTHER;
  return v;
}

/**
 * @param {unknown} current
 */
export function lessonWeeklyOptions(current) {
  const v = lessonWeeklySelectValue(current);
  if (!v || LESSON_WEEKLY_OPTIONS.some((o) => o.value === v)) return LESSON_WEEKLY_OPTIONS;
  if (!/^\d+$/.test(v)) return LESSON_WEEKLY_OPTIONS;
  const other = LESSON_WEEKLY_OPTIONS[LESSON_WEEKLY_OPTIONS.length - 1];
  return [...LESSON_WEEKLY_OPTIONS.slice(0, -1), { value: v, label: `${v}회` }, other];
}

/**
 * @param {unknown} current
 * @returns {string}
 */
export function lessonWeeklyLabel(current) {
  const v = String(current ?? '').trim();
  if (!v) return '';
  if (v === 'other' || v === LESSON_WEEKLY_OTHER) return '기타';
  const hit = LESSON_WEEKLY_OPTIONS.find((o) => o.value === v);
  if (hit) return hit.label;
  if (/^\d+$/.test(v)) return `${v}회`;
  return v;
}
