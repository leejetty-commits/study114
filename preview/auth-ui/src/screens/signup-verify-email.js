import {
  renderRecoveryStage,
  renderRecoverySuccessIcon,
  renderRecoveryLinks,
} from '../recovery-stage.js';
import { bindGlobalEvents, navigate } from '../layout.js';
import { fetchMeApi } from '../auth-api.js';
import { formatResendCountdown } from '../password-reset-api.js';
import {
  consumePostVerifyTarget,
  getLoginReturnTo,
  oauthRoleSelectionUrl,
  resolveAfterAuthUrl,
} from '../../../shared/auth-redirect.js';
import { parseHashQuery } from '../../../shared/preview-links.js';

const EMAIL_VERIFY_RESEND_COOLDOWN_SEC = 300;

function isInternalAuthEmail(email) {
  const e = String(email || '')
    .trim()
    .toLowerCase();
  return e.endsWith('@users.study114.local') || /^oauth_/i.test(e.split('@')[0] || '');
}

function maskEmail(email) {
  const e = String(email || '').trim();
  const at = e.indexOf('@');
  if (at < 1) return '';
  const local = e.slice(0, at);
  const domain = e.slice(at);
  const keep = local.slice(0, Math.min(2, local.length));
  return `${keep}***${domain}`;
}

function continueAfterVerified(me) {
  const target = consumePostVerifyTarget();
  const returnTo = getLoginReturnTo();
  if (target === 'basic') {
    navigate('/signup/basic');
    return;
  }
  if (target === 'role') {
    window.location.href = oauthRoleSelectionUrl(returnTo);
    return;
  }
  window.location.href = resolveAfterAuthUrl(me, returnTo);
}

export function renderSignupVerifyEmail() {
  const q = parseHashQuery();
  const verified = q.verified === '1';
  const err = q.email_verify_error || '';

  const body = verified
    ? `
        ${renderRecoverySuccessIcon()}
        <h1 class="auth-heading">이메일이 확인되었습니다</h1>
        <p class="auth-subheading recovery-stage__desc">가입이 완료되었습니다. 이어서 진행합니다.</p>
        <p class="form-hint">이메일은 로그인 및 계정 확인에 사용됩니다. 휴대폰 번호는 비공개로 보관됩니다.</p>
        <button type="button" class="btn btn--primary btn--block" data-action="continue-verified">계속</button>
      `
    : `
        <h1 class="auth-heading">이메일을 확인해 주세요</h1>
        <p class="auth-subheading recovery-stage__desc">
          입력값은 저장되었고 계정은 만들어졌습니다. 메일 안의 링크를 눌러야 가입이 완료됩니다.
        </p>
        <p class="form-hint">이메일은 로그인 및 계정 확인에 사용됩니다.</p>
        <p class="form-hint">휴대폰 번호는 비공개로 보관됩니다. 휴대폰 본인확인은 필요한 경우 내부 신뢰도 점검을 위해 진행될 수 있으며, 다른 사용자에게 공개되지 않습니다.</p>
        ${err ? `<p class="form-error" role="alert">${esc(err)}</p>` : ''}
        <p class="recovery-stage__email-hint" data-masked-email></p>
        <p class="form-error" data-verify-status hidden role="alert"></p>
        <div class="recovery-actions">
          <button type="button" class="btn btn--primary btn--block" data-action="resend-verify">확인 메일 보내기</button>
        </div>
        ${renderRecoveryLinks({ signup: false })}
      `;

  return renderRecoveryStage(`<div data-verify-wait>${body}</div>`);
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

export function bindSignupVerifyEmailEvents(root) {
  bindGlobalEvents(root);
  const q = parseHashQuery();
  const verifiedFromLink = q.verified === '1';

  const applyCooldown = (seconds) => {
    const btn = root.querySelector('[data-action="resend-verify"]');
    if (!btn) return;
    let left = Math.max(0, Math.ceil(Number(seconds) || 0));
    if (left <= 0) {
      btn.disabled = false;
      btn.textContent = '확인 메일 보내기';
      return;
    }
    btn.disabled = true;
    const tick = () => {
      if (left <= 0) {
        btn.disabled = false;
        btn.textContent = '확인 메일 보내기';
        return;
      }
      btn.textContent = `메일 다시 보내기 (${formatResendCountdown(left)})`;
      left -= 1;
      window.setTimeout(tick, 1000);
    };
    tick();
  };

  const sendVerify = async ({ silent } = {}) => {
    const status = root.querySelector('[data-verify-status]');
    const btn = root.querySelector('[data-action="resend-verify"]');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch('/api/auth/email/send-verification.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: '{}',
      });
      const data = await res.json().catch(() => ({}));
      if (data.already_verified) {
        const me = await fetchMeApi();
        continueAfterVerified(me);
        return;
      }
      applyCooldown(data.resend_available_in ?? EMAIL_VERIFY_RESEND_COOLDOWN_SEC);
      if (status && !silent) {
        status.hidden = false;
        status.textContent = data.message || '확인 메일을 보냈습니다.';
      }
    } catch {
      if (status) {
        status.hidden = false;
        status.textContent = '확인 메일 발송에 실패했습니다.';
      }
      if (btn) btn.disabled = false;
    }
  };

  root.querySelector('[data-action="continue-verified"]')?.addEventListener('click', async () => {
    const me = await fetchMeApi();
    continueAfterVerified(me);
  });

  root.querySelector('[data-action="resend-verify"]')?.addEventListener('click', () => sendVerify());

  fetchMeApi()
    .then((me) => {
      if (!me.authenticated) {
        navigate('/login');
        return;
      }
      if (me.needs_account_contact) {
        window.location.href = resolveAfterAuthUrl(me, getLoginReturnTo());
        return;
      }
      if (isInternalAuthEmail(me.email)) {
        window.location.href = resolveAfterAuthUrl(me, getLoginReturnTo());
        return;
      }
      if (me.email_verified) {
        if (verifiedFromLink) return;
        continueAfterVerified(me);
        return;
      }
      const hint = root.querySelector('[data-masked-email]');
      if (hint) hint.textContent = maskEmail(me.email);
      sendVerify({ silent: true });
    })
    .catch(() => navigate('/login'));
}
