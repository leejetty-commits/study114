/**
 * 수업료·예산 UI는 천원, DB·API 금액은 원.
 * 입력값 × 1000 = 원. 화면에는 「천원」만 쓴다.
 */

export const WON_PER_CHEONWON = 1000;

/**
 * @param {unknown} raw 천원 입력
 * @returns {string} 원. 비거나 0 이하면 빈 문자열
 */
export function cheonwonInputToWon(raw) {
  const n = Number(String(raw ?? '').replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return '';
  return String(Math.round(n * WON_PER_CHEONWON));
}

/**
 * @param {unknown} won 원
 * @returns {string} 천원 입력칸 값
 */
export function wonToCheonwonInput(won) {
  if (won == null || won === '') return '';
  const n = Number(won);
  if (!Number.isFinite(n) || n <= 0) return '';
  return String(Math.round(n / WON_PER_CHEONWON));
}

/**
 * DB 원 → 카드 문구. 원·만원 표기는 쓰지 않는다.
 * @param {unknown} priceAmount
 */
export function formatMonthlyCheonwon(priceAmount) {
  if (priceAmount == null || priceAmount === '') return '—';
  const n = Number(priceAmount);
  if (Number.isNaN(n)) return String(priceAmount);
  if (n <= 0) return '—';
  const cheon = Math.round(n / WON_PER_CHEONWON);
  return `월 ${cheon.toLocaleString('ko-KR')}천원~`;
}

/** 찾기 범위 필터. 폼 값은 천원, API는 원. */
const CHEON_RANGE_KEYS = [
  'price_amount_min',
  'price_amount_max',
  'preferred_fee_amount_min',
  'preferred_fee_amount_max',
  'budget_amount_min',
  'budget_amount_max',
];

/**
 * @param {Record<string, string | string[]>} filters
 */
export function scaleCheonwonRangeFilters(filters) {
  for (const key of CHEON_RANGE_KEYS) {
    const raw = filters[key];
    if (raw == null || Array.isArray(raw) || raw === '') continue;
    const won = cheonwonInputToWon(raw);
    if (won) filters[key] = won;
  }
  return filters;
}
