/**
 * checkout 세션 — 구매 버튼 → #/plans/checkout 전달용
 * sessionStorage에 저장해 새로고침에도 유지
 */

const KEY = 'study114-plans-checkout';
const RESULT_KEY = 'study114-plans-result';

/**
 * @typedef {object} PlansCheckoutDraft
 * @property {string} productCode
 * @property {string} optionId
 * @property {string} productName
 * @property {string} optionLabel
 * @property {string} apiVariant
 * @property {number} priceKrw
 * @property {'study_room'|'tutor'} providerType
 * @property {string} providerId
 * @property {string} providerLabel
 * @property {number} createdAt
 */

/**
 * @typedef {object} PlansResultState
 * @property {'success'|'failed'|'canceled'|'pending'} status
 * @property {string} [orderRef]
 * @property {string} [message]
 * @property {string} [productName]
 * @property {string} [providerLabel]
 * @property {string} [optionLabel]
 * @property {number} [chargeKrw]
 * @property {string} [providerType]
 * @property {string} [providerId]
 */

/** @param {PlansCheckoutDraft} draft */
export function setCheckoutDraft(draft) {
  sessionStorage.setItem(KEY, JSON.stringify(draft));
}

/** @returns {PlansCheckoutDraft | null} */
export function getCheckoutDraft() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearCheckoutDraft() {
  sessionStorage.removeItem(KEY);
}

/** @param {PlansResultState} result */
export function setCheckoutResult(result) {
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
}

/** @returns {PlansResultState | null} */
export function getCheckoutResult() {
  try {
    const raw = sessionStorage.getItem(RESULT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearCheckoutResult() {
  sessionStorage.removeItem(RESULT_KEY);
}
