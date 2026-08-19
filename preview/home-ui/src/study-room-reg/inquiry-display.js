/**
 * P20-05 — 쪽지 수신 2상태 · 카드 CTA 매핑 (공부방)
 */

/** @typedef {'open'|'paused'|'capacity_full'|'waiting_only'} InquiryStatusDb */

/** @param {string|null|undefined} status */
export function isInquiryReceiving(status) {
  return status === 'open';
}

/** @param {string|null|undefined} status */
export function inquiryClosedReasonLabel(status) {
  if (status === 'capacity_full') return '정원 마감';
  if (status === 'paused' || status === 'waiting_only') return '잠시 쉼';
  return null;
}

/** 운영자 화면 요약 */
export function operatorInquirySummary(status) {
  if (isInquiryReceiving(status)) return '받는 중';
  const reason = inquiryClosedReasonLabel(status);
  return reason ? `안 받음 · ${reason}` : '안 받음';
}

/**
 * @param {string|null|undefined} inquiryStatus
 * @returns {{ label: string, disabled: boolean, reasonLine: string|null }}
 */
export function resolveStudyRoomCardCta(inquiryStatus) {
  if (isInquiryReceiving(inquiryStatus)) {
    return { label: '쪽지하기', disabled: false, reasonLine: null };
  }
  return {
    label: '지금은 쪽지 안 받음',
    disabled: true,
    reasonLine: inquiryClosedReasonLabel(inquiryStatus) || '잠시 쉼',
  };
}

/**
 * @param {string|null|undefined} inquiryStatus
 * @returns {{ receiving: boolean, reason: 'capacity_full'|'paused'|null }}
 */
export function parseInquiryFormState(inquiryStatus) {
  if (inquiryStatus === 'open') return { receiving: true, reason: null };
  if (inquiryStatus === 'capacity_full') return { receiving: false, reason: 'capacity_full' };
  return { receiving: false, reason: 'paused' };
}

/**
 * @param {boolean} receiving
 * @param {'capacity_full'|'paused'|null} reason
 * @returns {InquiryStatusDb}
 */
export function inquiryStatusFromForm(receiving, reason) {
  if (receiving) return 'open';
  if (reason === 'capacity_full') return 'capacity_full';
  return 'paused';
}
