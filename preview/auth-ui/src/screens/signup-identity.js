/**
 * 공급자(공부방·과외쌤) 가입단계 본인확인.
 * 판정은 서버 phone_verified_* 만. skip 은 warn/off 에서만 서버 can_skip 플래그로 노출.
 */

import { renderAuthShell, bindGlobalEvents, navigate } from '../layout.js';
import { fetchMeApi, sendPhoneOtpApi, verifyPhoneOtpApi } from '../auth-api.js';
import {
  getLoginReturnTo,
  resolveAfterAuthUrl,
  basicRegisterPathForMe,
  uiRoleFromRoleType,
} from '../../../shared/auth-redirect.js';
import { setRole } from '../state.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

export function renderSignupIdentity() {
  const content = `
    <div class="panel" data-signup-identity>
      <h1 class="auth-heading">본인확인</h1>
      <p class="auth-subheading mb-6">공부방·과외쌤은 가입 단계에서 최초 1회 휴대폰 본인확인을 합니다. 전화번호는 외부에 공개되지 않습니다.</p>
      <p class="form-hint" data-identity-mask></p>
      <p class="form-error" data-identity-error hidden role="alert"></p>
      <div class="form-group">
        <label class="form-label" for="identity-otp">인증번호 6자리</label>
        <input class="form-input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6"
          id="identity-otp" data-identity-otp autocomplete="one-time-code" placeholder="000000" />
      </div>
      <div class="recovery-actions">
        <button type="button" class="btn btn--primary btn--block" data-identity-confirm>확인</button>
        <button type="button" class="btn btn--secondary btn--block" data-identity-resend disabled>인증번호 다시 받기</button>
        <button type="button" class="btn btn--ghost btn--block" data-identity-skip hidden>나중에 하기</button>
      </div>
      <p class="form-hint">같은 번호로는 쪽지·공개·유료에서 다시 인증하지 않습니다. 번호를 바꾸면 계정설정에서만 다시 확인합니다.</p>
    </div>
  `;
  return renderAuthShell(content, { showBack: false });
}

export function bindSignupIdentityEvents(root) {
  bindGlobalEvents(root);
  const errorEl = root.querySelector('[data-identity-error]');
  const maskEl = root.querySelector('[data-identity-mask]');
  const otpInput = root.querySelector('[data-identity-otp]');
  const resendBtn = root.querySelector('[data-identity-resend]');
  const confirmBtn = root.querySelector('[data-identity-confirm]');
  const skipBtn = root.querySelector('[data-identity-skip]');

  /** @type {number|null} */
  let resendTimer = null;

  const showError = (msg) => {
    if (!errorEl) return;
    if (msg) {
      errorEl.hidden = false;
      errorEl.textContent = msg;
    } else {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
  };

  const startResendCooldown = (seconds) => {
    if (!resendBtn) return;
    let left = Math.max(0, seconds);
    const tick = () => {
      if (left <= 0) {
        resendBtn.disabled = false;
        resendBtn.textContent = '인증번호 다시 받기';
        resendTimer = null;
        return;
      }
      resendBtn.disabled = true;
      resendBtn.textContent = `인증번호 다시 받기 (${left}초)`;
      left -= 1;
      resendTimer = window.setTimeout(tick, 1000);
    };
    tick();
  };

  const continueNext = async () => {
    const me = await fetchMeApi();
    const roleUi = uiRoleFromRoleType(me?.role_type);
    if (roleUi) setRole(roleUi);
    if (me?.needs_basic_register) {
      navigate(basicRegisterPathForMe(me));
      return;
    }
    window.location.href = resolveAfterAuthUrl(me, getLoginReturnTo());
  };

  const dispatchSend = async () => {
    showError('');
    try {
      const result = await sendPhoneOtpApi();
      if (result.already_verified) {
        await continueNext();
        return;
      }
      if (maskEl && result.masked_phone) {
        maskEl.textContent = `${result.masked_phone} 으로 인증번호를 보냈습니다.`;
      }
      startResendCooldown(Number(result.resend_available_in) || 60);
      otpInput?.focus();
    } catch (err) {
      const e = /** @type {Error & { code?: string, resend_available_in?: number }} */ (err);
      if (e.code === 'resend_cooldown' && e.resend_available_in) {
        startResendCooldown(e.resend_available_in);
      }
      showError(e.message || '인증번호 발송에 실패했습니다.');
    }
  };

  fetchMeApi()
    .then((me) => {
      if (!me.authenticated) {
        navigate('/login');
        return;
      }
      if (!me.email_verified || me.needs_account_contact || me.oauth_role_pending) {
        window.location.href = resolveAfterAuthUrl(me, getLoginReturnTo());
        return;
      }
      const roleUi = uiRoleFromRoleType(me.role_type);
      if (roleUi !== 'study_room' && roleUi !== 'tutor') {
        window.location.href = resolveAfterAuthUrl(me, getLoginReturnTo());
        return;
      }
      if (me.phone_verified || !me.needs_provider_identity) {
        continueNext();
        return;
      }
      if (maskEl && me.masked_phone) {
        maskEl.textContent = `등록 번호 ${me.masked_phone}`;
      }
      if (skipBtn && me.provider_identity_can_skip) {
        skipBtn.hidden = false;
      }
      void dispatchSend();
    })
    .catch(() => navigate('/login'));

  resendBtn?.addEventListener('click', () => {
    dispatchSend();
  });

  confirmBtn?.addEventListener('click', async () => {
    const code = String(otpInput?.value || '').replace(/\D/g, '');
    if (code.length !== 6) {
      showError('인증번호 6자리를 입력해 주세요.');
      return;
    }
    if (confirmBtn) confirmBtn.disabled = true;
    showError('');
    try {
      await verifyPhoneOtpApi(code);
      if (resendTimer) window.clearTimeout(resendTimer);
      await continueNext();
    } catch (err) {
      showError(err instanceof Error ? err.message : '인증번호 확인에 실패했습니다.');
    } finally {
      if (confirmBtn) confirmBtn.disabled = false;
    }
  });

  skipBtn?.addEventListener('click', async () => {
    const me = await fetchMeApi().catch(() => null);
    if (!me?.provider_identity_can_skip) {
      showError('이 계정은 본인확인을 건너뛸 수 없습니다.');
      return;
    }
    if (resendTimer) window.clearTimeout(resendTimer);
    const roleUi = uiRoleFromRoleType(me?.role_type);
    if (roleUi) setRole(roleUi);
    if (me?.needs_basic_register) {
      navigate(basicRegisterPathForMe(me));
      return;
    }
    window.location.href = resolveAfterAuthUrl(
      { ...me, needs_provider_identity: false, provider_identity_required: false },
      getLoginReturnTo(),
    );
  });
}
