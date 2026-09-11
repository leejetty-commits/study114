/**
 * 과외쌤 쪽지 수신 — tutors.inquiry_status SSOT.
 *
 * open          = 쪽지 받는 중
 * paused        = 쪽지 안받음 · 잠시 쉼 (일시 중단, 다시 열 수 있음)
 * not_accepting = 쪽지 안받음 · 신규 학생 안 받음 (신규 모집을 닫음. paused와 다른 값)
 *
 * 배지 / 라디오 / 재진입 초기값은 이 필드 하나만 본다.
 * not_accepting은 UI 라벨이 아니라 서버에 저장되는 운영 상태다.
 */

import { P21_INQUIRY_COPY } from './inquiries-copy.js';

/** @typedef {{ receiving: boolean, reason: 'paused'|'not_accepting' }} TutorInquiryPref */

export const TUTOR_INQUIRY_STATUSES = /** @type {const} */ (['open', 'paused', 'not_accepting']);

/** @param {unknown} raw @returns {'open'|'paused'|'not_accepting'} */
export function normalizeTutorInquiryStatus(raw) {
  return raw === 'open' || raw === 'not_accepting' ? raw : 'paused';
}

/** @param {unknown} status @returns {TutorInquiryPref} */
export function tutorInquiryPrefFromStatus(status) {
  const normalized = normalizeTutorInquiryStatus(status);
  if (normalized === 'open') return { receiving: true, reason: 'paused' };
  if (normalized === 'not_accepting') return { receiving: false, reason: 'not_accepting' };
  return { receiving: false, reason: 'paused' };
}

/**
 * 저장 매핑. 닫힘인데 이유가 paused/not_accepting가 아니면 null.
 * 여기서 paused로 접히면 안 된다.
 * @param {boolean} receiving
 * @param {unknown} reason
 * @returns {'open'|'paused'|'not_accepting'|null}
 */
export function tutorInquiryStatusFromPref(receiving, reason) {
  if (receiving) return 'open';
  if (reason === 'paused' || reason === 'not_accepting') return reason;
  return null;
}

/** 저장값 → UI → 저장값. open/paused/not_accepting 모두 항등이어야 한다. */
export function foldTutorInquiryStatus(status) {
  const pref = tutorInquiryPrefFromStatus(status);
  return tutorInquiryStatusFromPref(pref.receiving, pref.reason);
}

/** @param {unknown} status */
export function tutorInquiryStoredLine(status) {
  const normalized = normalizeTutorInquiryStatus(status);
  if (normalized === 'open') return P21_INQUIRY_COPY.storedOpen;
  if (normalized === 'not_accepting') return P21_INQUIRY_COPY.storedNotAccepting;
  return P21_INQUIRY_COPY.storedPaused;
}
