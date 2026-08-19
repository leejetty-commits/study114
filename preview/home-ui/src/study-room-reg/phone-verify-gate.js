/**
 * P20-05 — 쪽지 받는 중 ON 시 휴대폰 내부 확인 게이트 (OTP 세부 구현 후속)
 */

import { getAuthUser } from '../auth-session.js';
import { isRegistrationsApiMode } from '../registrations-backend.js';
import { P20_INQUIRY_COPY } from './study-room-reg-copy.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const CREDENTIALS = { credentials: 'include' };

/**
 * @returns {Promise<boolean>}
 */
export async function requestInternalPhoneVerify() {
  const res = await fetch('/api/auth/phone/verify-internal.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || '연락처 확인에 실패했습니다.');
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
      <p class="p20-phone-verify-modal__sub">${P20_INQUIRY_COPY.phoneGateSub}</p>
      <div class="p20-phone-verify-modal__actions">
        <button type="button" class="btn btn--primary" data-p20-phone-verify-confirm>확인하기</button>
        <button type="button" class="btn btn--secondary" data-p20-phone-verify-cancel>취소</button>
      </div>
    </div>`;

  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
  };

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  overlay.querySelector('[data-p20-phone-verify-cancel]')?.addEventListener('click', () => {
    close();
    opts.onCancel?.();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      close();
      opts.onCancel?.();
    }
  });

  overlay.querySelector('[data-p20-phone-verify-confirm]')?.addEventListener('click', async () => {
    const btn = overlay.querySelector('[data-p20-phone-verify-confirm]');
    if (btn) btn.disabled = true;
    try {
      if (isRegistrationsApiMode()) {
        await requestInternalPhoneVerify();
        const user = getAuthUser();
        if (user) user.phone_verified = true;
      } else {
        sessionStorage.setItem('study114_phone_verified_stub', '1');
      }
      close();
      await opts.onVerified();
    } catch (err) {
      alert(err instanceof Error ? err.message : '연락처 확인에 실패했습니다.');
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

/** @returns {boolean} */
export function isPhoneVerifiedLocal(room) {
  if (room?.owner_phone_verified) return true;
  if (sessionStorage.getItem('study114_phone_verified_stub') === '1') return true;
  return Boolean(getAuthUser()?.phone_verified);
}
