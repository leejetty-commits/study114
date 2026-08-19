import { renderAuthShell, bindGlobalEvents, navigate } from '../layout.js';
import { fetchMeApi, saveAccountContactApi } from '../auth-api.js';
import { parseHashQuery } from '../../../shared/preview-links.js';
import { getLoginReturnTo, resolvePostLoginUrl } from '../../../shared/auth-redirect.js';
import { formatMobile, isValidMobile } from '../../../shared/phone.js';

const PHONE_GUIDE =
  '휴대폰 번호는 010-0000-0000 형식으로 입력해 주세요.\n숫자만 넣어도 됩니다.\n예: 01012345678 또는 010-1234-5678';

export function renderSignupAccountContact() {
  const content = `
    <div class="panel">
      <h1 class="auth-heading">계정 연락처</h1>
      <p class="auth-subheading mb-6">이메일과 휴대폰은 가입 시 필수입니다. 로그인·비밀번호 찾기·계정 복구·운영 안내에만 쓰고, 검색·상세·쪽지·프로필에는 올리지 않습니다.</p>
      <form data-form="account-contact" novalidate>
        <div class="form-group" data-email-wrap hidden>
          <label class="form-label form-label--required" for="account-email">이메일(ID)</label>
          <input class="form-input" type="email" id="account-email" name="email" autocomplete="username" />
          <p class="form-hint">로그인 ID이자 비밀번호 찾기 기준입니다. 이미 가입한 이메일이면 그 계정에 소셜이 연결됩니다.</p>
        </div>
        <div class="form-group">
          <label class="form-label form-label--required" for="account-phone">휴대폰</label>
          <input class="form-input" type="tel" id="account-phone" name="phone" placeholder="010-0000-0000" inputmode="numeric" maxlength="13" autocomplete="tel" required />
          <p class="form-hint">010-0000-0000. 숫자만 넣어도 됩니다. 다른 회원에게는 보여 주지 않습니다.</p>
        </div>
        <p class="form-error" data-contact-error hidden role="alert"></p>
        <button type="submit" class="btn btn--primary btn--block">저장하고 계속</button>
      </form>
    </div>
  `;
  return renderAuthShell(content, { showBack: false });
}

export function bindSignupAccountContactEvents(root) {
  bindGlobalEvents(root);
  const form = root.querySelector('[data-form="account-contact"]');
  const errorEl = root.querySelector('[data-contact-error]');
  const emailWrap = root.querySelector('[data-email-wrap]');
  const emailInput = root.querySelector('#account-email');
  const phoneInput = root.querySelector('#account-phone');

  phoneInput?.addEventListener('blur', () => {
    const formatted = formatMobile(phoneInput.value);
    if (formatted) phoneInput.value = formatted;
  });

  fetchMeApi()
    .then((me) => {
      if (!me.authenticated) {
        navigate('/login');
        return;
      }
      if (me.needs_account_contact === false) {
        continueAfterContact(me);
        return;
      }
      const internal = /@users\.study114\.local$/i.test(String(me.email || '')) || /^oauth_/i.test(String(me.email || '').split('@')[0] || '');
      if (internal && emailWrap && emailInput) {
        emailWrap.hidden = false;
        emailInput.required = true;
      }
    })
    .catch(() => navigate('/login'));

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
    const fd = new FormData(form);
    const phone = String(fd.get('phone') ?? '').trim();
    const email = String(fd.get('email') ?? '').trim();
    if (phoneInput) {
      phoneInput.value = formatMobile(phone) || phone;
    }
    if (!isValidMobile(phone)) {
      window.alert(PHONE_GUIDE);
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = '휴대폰 번호를 정확히 입력해 주세요.';
      }
      phoneInput?.focus();
      return;
    }
    try {
      await saveAccountContactApi({ phone, email });
      const me = await fetchMeApi();
      continueAfterContact(me);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '저장에 실패했습니다.';
      window.alert(msg);
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = msg;
      }
    }
  });
}

function continueAfterContact(me) {
  const q = parseHashQuery();
  if (me.oauth_role_pending) {
    const params = new URLSearchParams({ from: 'oauth' });
    if (q.return_to) params.set('return_to', q.return_to);
    navigate(`/signup/role?${params.toString()}`);
    return;
  }
  const returnTo = getLoginReturnTo() || q.return_to;
  if (returnTo) {
    window.location.href = String(returnTo).startsWith('http')
      ? returnTo
      : resolvePostLoginUrl(me.role_type || 'guardian_student');
    return;
  }
  window.location.href = resolvePostLoginUrl(me.role_type || 'guardian_student');
}
