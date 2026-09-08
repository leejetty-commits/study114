/**
 * CUR-006 — 확인메일 발송/재전송 결과 분류 (UI 전용)
 * 서버 내부 원인·메일 인프라 문구는 노출하지 않는다.
 */

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
  if (kind === 'success') {
    return '확인 메일을 다시 보냈습니다. 받은편지함과 스팸함을 확인해 주세요.';
  }
  if (kind === 'cooldown') {
    const wait = Math.max(0, Math.ceil(Number(resendAvailableIn) || 0));
    if (wait > 0 && typeof opts.formatCountdown === 'function') {
      return `최근에 확인 메일을 보냈습니다. ${opts.formatCountdown(wait)} 후에 다시 시도해 주세요.`;
    }
    return '최근에 확인 메일을 보냈습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (kind === 'already_verified') {
    return '이미 이메일이 확인되었습니다.';
  }
  return '확인 메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

/** hash query `send=0` → 가입 직후 발송 실패 UI */
export function isSignupEmailSendFailedFlag(sendParam) {
  return String(sendParam ?? '') === '0';
}

/** @param {boolean} emailSent */
export function verifyEmailPathForSignupResult(emailSent) {
  return emailSent ? '/signup/verify-email?send=1' : '/signup/verify-email?send=0';
}
