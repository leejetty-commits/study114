/**
 * 학생 요청문/특이요청 열람 권한
 *
 * 2026-08 정책: 로그인한 공급자(과외쌤·원장)는 요청문·특이사항을 결제 없이 열람.
 * 블라인드(실명·전화·상세주소)는 유지. 학부모 피어는 비교범위(구조화)만.
 */

import { PERMISSION_DENIED_COPY } from './empty-state-copy.js';
import { isProviderPaid } from './messages/permissions.js';

/**
 * @param {string} [viewer]
 * @returns {boolean}
 */
export function isPaidProviderViewer(viewer) {
  if (viewer === 'admin') return true;
  if (viewer !== 'tutor' && viewer !== 'study_room') return false;
  return isProviderPaid();
}

function isProviderViewer(viewer) {
  return viewer === 'tutor' || viewer === 'study_room' || viewer === 'admin';
}

/**
 * @param {'private' | 'paid_only' | string} visibility
 * @param {number} [studentId]
 * @param {{ isPaidProvider?: boolean, viewer?: string }} [opts]
 */
export function canViewProtectedStudentField(visibility, studentId, opts = {}) {
  if (isProviderViewer(opts.viewer)) {
    return true;
  }
  return false;
}

/**
 * @param {{ id?: number, request_summary_visibility?: string, special_request_visibility?: string }} student
 * @param {{ viewer?: string }} [opts]
 */
export function getStudentProtectedVisibility(student, opts = {}) {
  const viewer = opts.viewer;
  const provider = isProviderViewer(viewer);
  return {
    requestSummary: provider,
    specialRequest: provider,
    isPaidProvider: isPaidProviderViewer(viewer),
  };
}

/** @deprecated 요청문 열람권 폐지 — 잔여 참조 호환 */
export const REQUEST_VIEW_GATE_COPY = {
  title: '요청문 열람',
  body: '로그인한 공부방·과외쌤은 요청문을 무료로 볼 수 있습니다.',
  ctaUnlock: '',
  ctaPlans: '유료 서비스 안내',
};

export const FREE_PROVIDER_REQUEST_GATE_COPY = {
  title: '요청문 열람',
  body: '로그인한 공부방·과외쌤은 요청문·특이요청사항을 무료로 볼 수 있습니다.',
  ctaPlans: '유료 서비스 안내',
};

/** 학부모·학생 피어 열람 — 구조화 조건만, 요청문 비공개 규칙 유지 */
export const PEER_STUDENT_REQUEST_GATE_COPY = {
  title: '요청문은 비교 열람 범위가 아닙니다',
  body: '다른 학생의 요청문·특이요청사항은 기존 공개 규칙에 따라 공급자 열람 대상입니다. 금액·지역·과목 등 구조화 조건만 비교하세요.',
};

export function getRequestViewGateState() {
  return {
    hasTickets: false,
    ticketsRemaining: 0,
  };
}

export const PAID_GATE_MESSAGE = PERMISSION_DENIED_COPY.paid.body;
