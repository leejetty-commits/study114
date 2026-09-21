/**
 * P20-05 — 쪽지 받는 중 ON 시 휴대폰 SMS OTP 게이트
 */

import { getAuthUser } from '../auth-session.js';
import { isRegistrationsApiMode } from '../registrations-backend.js';
import { P20_INQUIRY_COPY } from './study-room-reg-copy.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const CREDENTIALS = { credentials: 'include' };

/**
 * @returns {Promise<{ sent: boolean, resend_available_in: number, already_verified: boolean, masked_phone: string }>}
 */
export async function sendPhoneOtp() {
  const res = await fetch('/api/auth/phone/send-otp.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data.message || '인증번호 발송에 실패했습니다.');
    /** @type {Error & { code?: string, resend_available_in?: number }} */ (err).code = data.error;
    /** @type {Error & { code?: string, resend_available_in?: number }} */ (err).resend_available_in =
      Number(data.resend_available_in) || 0;
    throw err;
  }
  return {
    sent: Boolean(data.sent),
    resend_available_in: Number(data.resend_available_in) || 0,
    already_verified: Boolean(data.already_verified),
    masked_phone: String(data.masked_phone || ''),
  };
}

/**
 * @param {string} code
 * @returns {Promise<boolean>}
 */
export async function verifyPhoneOtp(code) {
  const res = await fetch('/api/auth/phone/verify-otp.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({ code }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data.message || '인증번호 확인에 실패했습니다.');
    /** @type {Error & { code?: string }} */ (err).code = data.error;
    throw err;
  }
  return true;
}

/**
 * @param {{ onVerified: () => void | Promise<void>, onCancel?: () => void }} opts
 */
export function showPhoneVerifyGateModal(opts) {
  const existing = document.getElementById('p20-phone-verify-modal');
  existing?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'p20-phone-verify-modal';
  overlay.className = 'p20-phone-verify-modal';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="p20-phone-verify-modal__panel">
      <h2 class="p20-phone-verify-modal__title">${P20_INQUIRY_COPY.phoneGateTitle}</h2>
      <p class="p20-phone-verify-modal__body">${P20_INQUIRY_COPY.phoneGateBody}</p>
      <p class="p20-phone-verify-modal__phone is-hidden" data-p20-phone-mask></p>
      <p class="p20-phone-verify-modal__error is-hidden" data-p20-phone-error role="alert"></p>
      <label class="p20-phone-verify-modal__field">
        <span class="p20-phone-verify-modal__label">${P20_INQUIRY_COPY.phoneOtpLabel}</span>
        <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code"
          class="p20-phone-verify-modal__input" data-p20-phone-otp placeholder="000000" />
      </label>
      <div class="p20-phone-verify-modal__actions">
        <button type="button" class="btn btn--primary" data-p20-phone-verify-confirm>확인</button>
        <button type="button" class="btn btn--secondary" disabled data-p20-phone-resend>${P20_INQUIRY_COPY.phoneResendCta}</button>
        <button type="button" class="btn btn--ghost" data-p20-phone-verify-cancel>취소</button>
      </div>
    </div>`;

  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
  };

  const errorEl = overlay.querySelector('[data-p20-phone-error]');
  const maskEl = overlay.querySelector('[data-p20-phone-mask]');
  const otpInput = overlay.querySelector('[data-p20-phone-otp]');
  const resendBtn = overlay.querySelector('[data-p20-phone-resend]');
  const confirmBtn = overlay.querySelector('[data-p20-phone-verify-confirm]');

  /** @type {number|null} */
  let resendTimer = null;

  const showError = (msg) => {
    if (!errorEl) return;
    if (msg) {
      errorEl.textContent = msg;
      errorEl.classList.remove('is-hidden');
    } else {
      errorEl.textContent = '';
      errorEl.classList.add('is-hidden');
    }
  };

  const startResendCooldown = (seconds) => {
    if (!resendBtn) return;
    let left = Math.max(0, seconds);
    const tick = () => {
      if (left <= 0) {
        resendBtn.disabled = false;
        resendBtn.textContent = P20_INQUIRY_COPY.phoneResendCta;
        resendTimer = null;
        return;
      }
      resendBtn.disabled = true;
      resendBtn.textContent = `${P20_INQUIRY_COPY.phoneResendCta} (${left}초)`;
      left -= 1;
      resendTimer = window.setTimeout(tick, 1000);
    };
    tick();
  };

  const dispatchSend = async () => {
    showError('');
    if (!isRegistrationsApiMode()) {
      showError('미리보기 모드에서는 문자 인증을 사용할 수 없습니다.');
      return;
    }
    try {
      const result = await sendPhoneOtp();
      if (result.already_verified) {
        close();
        await opts.onVerified();
        return;
      }
      if (maskEl && result.masked_phone) {
        maskEl.textContent = `${result.masked_phone} 으로 인증번호를 보냈습니다.`;
        maskEl.classList.remove('is-hidden');
      }
      startResendCooldown(result.resend_available_in || 60);
      otpInput?.focus();
    } catch (err) {
      const e = /** @type {Error & { code?: string, resend_available_in?: number }} */ (err);
      if (e.code === 'resend_cooldown' && e.resend_available_in) {
        startResendCooldown(e.resend_available_in);
      }
      showError(e.message || '인증번호 발송에 실패했습니다.');
    }
  };

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  overlay.querySelector('[data-p20-phone-verify-cancel]')?.addEventListener('click', () => {
    if (resendTimer) window.clearTimeout(resendTimer);
    close();
    opts.onCancel?.();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      if (resendTimer) window.clearTimeout(resendTimer);
      close();
      opts.onCancel?.();
    }
  });

  resendBtn?.addEventListener('click', () => {
    dispatchSend();
  });

  confirmBtn?.addEventListener('click', async () => {
    const code = String(otpInput?.value || '').replace(/\D/g, '');
    if (code.length !== 6) {
      showError('인증번호 6자리를 입력해 주세요.');
      return;
    }
    if (!isRegistrationsApiMode()) {
      showError('미리보기 모드에서는 문자 인증을 사용할 수 없습니다.');
      return;
    }
    if (confirmBtn) confirmBtn.disabled = true;
    showError('');
    try {
      await verifyPhoneOtp(code);
      const user = getAuthUser();
      if (user) user.phone_verified = true;
      if (resendTimer) window.clearTimeout(resendTimer);
      close();
      await opts.onVerified();
    } catch (err) {
      showError(err instanceof Error ? err.message : '인증번호 확인에 실패했습니다.');
    } finally {
      if (confirmBtn) confirmBtn.disabled = false;
    }
  });

  void dispatchSend();
}

/** @returns {boolean} */
export function isPhoneVerifiedLocal(room) {
  if (room?.owner_phone_verified) return true;
  return Boolean(getAuthUser()?.phone_verified);
}
