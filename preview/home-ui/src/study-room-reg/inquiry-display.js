/**
 * P20-05 — 쪽지 수신 2상태 · 카드 CTA 매핑 (공부방)
 */

import { P20_INQUIRY_COPY } from './study-room-reg-copy.js';

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

/** 운영자 화면 요약 (목록 등) */
export function operatorInquirySummary(status) {
  if (isInquiryReceiving(status)) return P20_INQUIRY_COPY.cardReceiving;
  const reason = inquiryClosedReasonLabel(status);
  return reason ? `${P20_INQUIRY_COPY.cardClosed} · ${reason}` : P20_INQUIRY_COPY.cardClosed;
}

/**
 * 쪽지설정 「홈화면 카드표시」 요약 — 2상태 + OFF일 때만 사유
 * @param {string|null|undefined} inquiryStatus
 * @returns {{ line: string, reasonLine: string|null }}
 */
export function homeCardDisplaySummary(inquiryStatus) {
  if (isInquiryReceiving(inquiryStatus)) {
    return { line: P20_INQUIRY_COPY.cardReceiving, reasonLine: null };
  }
  return {
    line: P20_INQUIRY_COPY.cardClosed,
    reasonLine: inquiryClosedReasonLabel(inquiryStatus) || '잠시 쉼',
  };
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
    label: P20_INQUIRY_COPY.cardClosed,
    disabled: true,
    reasonLine: inquiryClosedReasonLabel(inquiryStatus) || '잠시 쉼',
  };
}

/**
 * 마이샵 본문용 — 이벤트 없는 읽기 전용 상태 문구 (CTA/버튼 카피 금지)
 * @param {string|null|undefined} inquiryStatus
 * @returns {string}
 */
export function myshopInquiryStatusLine(inquiryStatus) {
  if (inquiryStatus === 'open' || isInquiryReceiving(inquiryStatus)) {
    return '현재 쪽지 가능';
  }
  if (inquiryStatus === 'capacity_full') {
    return '현재는 정원 마감 상태입니다';
  }
  if (inquiryStatus === 'paused' || inquiryStatus === 'waiting_only') {
    return '현재는 잠시 쉬는 중입니다';
  }
  if (inquiryStatus == null || inquiryStatus === '') {
    return '';
  }
  return '현재는 쪽지를 받지 않아요';
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
