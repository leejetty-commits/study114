/**
 * 학생 요청문/특이요청 열람 권한 (4장 · 13장 §10-1 · 18§19)
 */

import { PERMISSION_DENIED_COPY } from './empty-state-copy.js';
import { isStudentRequestUnlocked, getRequestViewTicketsRemaining } from './request-unlock.js';

/**
 * @param {'private' | 'paid_only'} visibility
 * @param {number} [studentId]
 */
export function canViewProtectedStudentField(visibility, studentId) {
  if (visibility !== 'paid_only') {
    return false;
  }
  if (studentId == null) {
    return false;
  }

  return isStudentRequestUnlocked(studentId);
}

/**
 * @param {{ id?: number, request_summary_visibility: string, special_request_visibility: string }} student
 */
export function getStudentProtectedVisibility(student) {
  const studentId = student.id;
  return {
    requestSummary: canViewProtectedStudentField(
      student.request_summary_visibility || 'private',
      studentId,
    ),
    specialRequest: canViewProtectedStudentField(
      student.special_request_visibility || 'private',
      studentId,
    ),
  };
}

/** paid_only 필드 게이트용 */
export const REQUEST_VIEW_GATE_COPY = {
  title: '요청문 열람권 안내',
  body: '이 학생의 paid_only 요청문을 보려면 열람권이 필요합니다. (학생당 1회 차감)',
  ctaUnlock: '열람권으로 보기 (1회)',
  ctaPlans: '유료 서비스 안내',
};

export function getRequestViewGateState() {
  const tickets = getRequestViewTicketsRemaining();
  return {
    hasTickets: tickets > 0,
    ticketsRemaining: tickets,
  };
}

export const PAID_GATE_MESSAGE = PERMISSION_DENIED_COPY.paid.body;
