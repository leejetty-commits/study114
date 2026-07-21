/**
 * 9장 부록 §17 — 비밀번호 재설정 API 클라이언트
 *
 * ## validate-token 응답 해석 (고정)
 *
 * | 필드 | 의미 |
 * |------|------|
 * | `ok: true` | API 호출·처리 자체는 정상 (HTTP 200 + JSON 파싱 성공) |
 * | `ok: false` | 네트워크/서버/파싱 실패 — 토큰 상태와 무관 |
 * | `status` | 비즈니스 토큰 상태 — **ok와 분리해서만** 해석 |
 *
 * `status` 값: `valid` · `invalid` · `expired` · `used`
 *
 * ⚠️ `ok: true, status: "invalid"` 는 “요청은 성공, 토큰은 무효”이지 전체 실패가 아님.
 */

/** @typedef {'valid'|'invalid'|'expired'|'used'} PasswordResetTokenStatus */

/** 서버 config(auth.password_reset_resend_cooldown_seconds)와 동일 — 5분 */
export const PASSWORD_RESET_RESEND_COOLDOWN_SEC = 300;

/** @type {readonly PasswordResetTokenStatus[]} */
export const PASSWORD_RESET_TOKEN_STATUSES = ['valid', 'invalid', 'expired', 'used'];

/**
 * @param {unknown} status
 * @returns {status is PasswordResetTokenStatus}
 */
export function isPasswordResetTokenStatus(status) {
  return PASSWORD_RESET_TOKEN_STATUSES.includes(status);
}

/**
 * @param {string} email
 * @returns {Promise<{ ok: true, message: string, resend_available_in?: number }>}
 */
export async function passwordForgotApi(email) {
  const res = await fetch('/api/auth/password/forgot.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || `서버 오류 (${res.status})`);
  }
  return data;
}

/**
 * @param {string} token
 * @returns {Promise<{ ok: true, status: PasswordResetTokenStatus }>}
 */
export async function passwordValidateTokenApi(token) {
  const res = await fetch(
    `/api/auth/password/validate-token.php?token=${encodeURIComponent(token)}`,
  );
  const data = await res.json().catch(() => ({}));

  // ok = request/handler success only
  if (!res.ok || !data.ok) {
    throw new Error(data.message || `서버 오류 (${res.status})`);
  }

  const status = data.status;
  if (!isPasswordResetTokenStatus(status)) {
    throw new Error(`Unexpected token status: ${String(status)}`);
  }

  return { ok: true, status };
}

/**
 * @param {Record<string, string>} payload
 */
export async function passwordResetApi(payload) {
  const res = await fetch('/api/auth/password/reset.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data.message || `서버 오류 (${res.status})`);
    if (data.error) {
      err.code = data.error;
    }
    throw err;
  }
  return data;
}

/** @param {number} seconds */
export function formatResendCountdown(seconds) {
  const left = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(left / 60);
  const s = left % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
