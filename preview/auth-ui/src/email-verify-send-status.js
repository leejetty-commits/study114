/**
 * CUR-006 — 확인메일 발송/재전송 결과 분류 (UI 전용)
 * 서버 내부 원인·메일 인프라 문구는 노출하지 않는다.
 */

import { AUTH_WELCOME_COPY, emailVerifyCooldownMessage } from '../../shared/auth-welcome-copy.js';

/** @typedef {'success' | 'cooldown' | 'fail' | 'already_verified'} EmailVerifySendKind */

/**
 * @param {object} data
 * @param {{ httpOk?: boolean }} [opts]
 * @returns {EmailVerifySendKind}
 */
export function classifyEmailVerifySendResult(data, opts = {}) {
  const httpOk = opts.httpOk !== false;
  if (!httpOk || data == null || data.ok === false) {
    return 'fail';
  }
  if (data.already_verified) {
    return 'already_verified';
  }
  if (data.sent === true) {
    return 'success';
  }
  const wait = Number(data.resend_available_in ?? 0);
  if (Number.isFinite(wait) && wait > 0) {
    return 'cooldown';
  }
  return 'fail';
}

/**
 * @param {EmailVerifySendKind} kind
 * @param {number} [resendAvailableIn]
 * @param {{ formatCountdown?: (sec: number) => string }} [opts]
 */
export function emailVerifySendStatusMessage(kind, resendAvailableIn = 0, opts = {}) {
  if (kind === 'success') return AUTH_WELCOME_COPY.verify.resendSuccess;
  if (kind === 'cooldown') return emailVerifyCooldownMessage(resendAvailableIn, opts.formatCountdown);
  if (kind === 'already_verified') return AUTH_WELCOME_COPY.verify.already;
  return AUTH_WELCOME_COPY.verify.resendFail;
}

/** hash query `send=0` → 가입 직후 발송 실패 UI */
export function isSignupEmailSendFailedFlag(sendParam) {
  return String(sendParam ?? '') === '0';
}

/** @param {boolean} emailSent */
export function verifyEmailPathForSignupResult(emailSent) {
  return emailSent ? '/signup/verify-email?send=1' : '/signup/verify-email?send=0';
}
