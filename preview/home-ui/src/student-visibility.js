/**
 * 학생 요청문/특이요청 열람 권한 (4장 · 13장 §10-1 · 14장 §9)
 * @typedef {'free' | 'paid'} ProviderSubscription
 */

/**
 * @param {ProviderSubscription} providerSubscription
 * @param {'private' | 'paid_only'} visibility
 */
export function canViewProtectedStudentField(providerSubscription, visibility) {
  if (providerSubscription !== 'paid') return false;
  return visibility === 'paid_only';
}

/**
 * @param {ProviderSubscription} providerSubscription
 * @param {{ request_summary_visibility: string, special_request_visibility: string }} student
 */
export function getStudentProtectedVisibility(student, providerSubscription) {
  return {
    requestSummary: canViewProtectedStudentField(
      providerSubscription,
      student.request_summary_visibility || 'private',
    ),
    specialRequest: canViewProtectedStudentField(
      providerSubscription,
      student.special_request_visibility || 'private',
    ),
  };
}

export const PAID_GATE_MESSAGE = '유료등록시 가능합니다';
