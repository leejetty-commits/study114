/**
 * 월 총 횟수. DB는 tutors.monthly_session_count (SMALLINT UNSIGNED NULL).
 * 화면 옵션은 2~15, 「월16회 이상」은 16. 빈 값은 NULL.
 */

/** @type {{ value: string, label: string }[]} */
export function lessonMonthlyOptions() {
  const options = [{ value: '', label: '선택' }];
  for (let n = 2; n <= 15; n += 1) {
    options.push({ value: String(n), label: `월${n}회` });
  }
  options.push({ value: '16', label: '월16회 이상' });
  return options;
}

/**
 * @param {unknown} current
 * @returns {string} select value. 2~15는 그 값, 16 이상은 16, 없거나 0·1은 빈 칸.
 */
export function lessonMonthlySelectValue(current) {
  const raw = String(current ?? '').trim();
  if (!/^\d+$/.test(raw)) return '';
  const n = Number(raw);
  if (n >= 16) return '16';
  if (n >= 2 && n <= 15) return String(n);
  return '';
}

/** 옵션에 없는 기존 값(0·1 등). 사용자가 상자를 건드리지 않으면 저장 요청에 싣지 않는다. 16 이상은 「월16회 이상」이라 저장 대상이다. */
export function lessonMonthlyOmitUntilTouched(current) {
  const raw = String(current ?? '').trim();
  if (raw === '') return false;
  return lessonMonthlySelectValue(raw) === '';
}

/**
 * @param {unknown} current
 * @returns {string} 없거나 옵션 밖이면 빈 문자열. 등록점검 빈 칸은 기존 「—」 규칙을 쓴다.
 */
export function lessonMonthlyLabel(current) {
  const selected = lessonMonthlySelectValue(current);
  if (!selected) return '';
  const hit = lessonMonthlyOptions().find((o) => o.value === selected);
  return hit ? hit.label : '';
}
