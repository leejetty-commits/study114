/**
 * 18c — request-unlock → provider-status.js 위임
 */

import { unlockStudentRequest } from './paid-api.js';
import {
  getRequestViewTicketsRemaining,
  isStudentRequestUnlocked,
  markStudentRequestUnlocked,
  applyRequestViewUnlockResponse,
  resetProviderStatus,
} from './provider-status.js';

export {
  getRequestViewTicketsRemaining,
  isStudentRequestUnlocked,
};

/** @deprecated provider-status가 관리 — no-op */
export function setRequestViewTickets(_count) {}

export function markStudentUnlocked(studentId) {
  markStudentRequestUnlocked(studentId);
}

export function resetRequestUnlockCache() {
  resetProviderStatus();
}

/** @deprecated hydrateProviderStatus 사용 */
export async function hydrateRequestUnlockCache() {
  return null;
}

/**
 * @param {number} studentId
 */
export async function unlockStudentRequestView(studentId) {
  const data = await unlockStudentRequest(studentId);
  applyRequestViewUnlockResponse(data);
  return data;
}
