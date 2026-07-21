/**
 * 학생 요청문/특이요청 열람 권한 (4장 · 13장 §10-1 · 18§19 · 10-6)
 *
 * 잠금(2026-07-18 운영 결정 1-A):
 * - 무료 공급자: paid_only 본문·열람권 UI 없음 → 「유료등록 시 가능」만
 * - 유료 공급자: paid_only + 열람권(또는 이미 unlock)일 때만 본문
 * - private: 유료여도 비공개 유지
 */

import { PERMISSION_DENIED_COPY } from './empty-state-copy.js';
import { isStudentRequestUnlocked, getRequestViewTicketsRemaining } from './request-unlock.js';
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

/**
 * @param {'private' | 'paid_only' | string} visibility
 * @param {number} [studentId]
 * @param {{ isPaidProvider?: boolean }} [opts]
 */
export function canViewProtectedStudentField(visibility, studentId, opts = {}) {
  if (visibility !== 'paid_only') {
    return false;
  }
  if (!opts.isPaidProvider) {
    return false;
  }
  if (studentId == null) {
    return false;
  }
  return isStudentRequestUnlocked(studentId);
}

/**
 * @param {{ id?: number, request_summary_visibility?: string, special_request_visibility?: string }} student
 * @param {{ viewer?: string }} [opts]
 */
export function getStudentProtectedVisibility(student, opts = {}) {
  const studentId = student.id;
  const isPaid = isPaidProviderViewer(opts.viewer);
  return {
    requestSummary: canViewProtectedStudentField(
      student.request_summary_visibility || 'private',
      studentId,
      { isPaidProvider: isPaid },
    ),
    specialRequest: canViewProtectedStudentField(
      student.special_request_visibility || 'private',
      studentId,
      { isPaidProvider: isPaid },
    ),
    isPaidProvider: isPaid,
  };
}

/** 유료 공급자 · paid_only · 아직 unlock 전 */
export const REQUEST_VIEW_GATE_COPY = {
  title: '요청문 열람권 안내',
  body: '이 학생의 유료 전용 요청문을 보려면 열람권이 필요합니다. (학생당 1회 차감)',
  ctaUnlock: '열람권으로 보기 (1회)',
  ctaPlans: '유료 서비스 안내',
};

/** 무료 공급자 · 10-6-3/4 · 1-A */
export const FREE_PROVIDER_REQUEST_GATE_COPY = {
  title: '유료등록 시 가능합니다',
  body: '요청문·특이요청사항은 유료 등록한 공부방·과외쌤만 열람할 수 있습니다. 열람권만으로는 열 수 없습니다.',
  ctaPlans: '유료 서비스 안내',
};

/** 학부모·학생 피어 열람 · 29#3 — 구조화 조건만, 요청문 비공개 규칙 유지 */
export const PEER_STUDENT_REQUEST_GATE_COPY = {
  title: '요청문은 비교 열람 범위가 아닙니다',
  body: '다른 학생의 요청문·특이요청사항은 기존 공개 규칙에 따라 공급자 열람 대상입니다. 금액·지역·과목 등 구조화 조건만 비교하세요.',
};

export function getRequestViewGateState() {
  const tickets = getRequestViewTicketsRemaining();
  return {
    hasTickets: tickets > 0,
    ticketsRemaining: tickets,
  };
}

export const PAID_GATE_MESSAGE = PERMISSION_DENIED_COPY.paid.body;
