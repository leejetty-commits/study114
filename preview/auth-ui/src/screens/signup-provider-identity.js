import { renderAuthShell, bindGlobalEvents, navigate } from '../layout.js';
import { fetchMeApi } from '../auth-api.js';
import {
  basicRegisterPathForMe,
  needsProviderIdentityPrompt,
  resolveAfterAuthUrl,
} from '../../../shared/auth-redirect.js';
import { parseHashQuery } from '../../../shared/preview-links.js';

const COPY = {
  title: '본인인증',
  lead: '공급자 가입은 휴대폰 번호 기준으로 처음 1회 본인인증을 진행합니다. 인증이 끝나면 이후 공개, 쪽지, 유료상품 이용에서 다시 반복하지 않습니다.',
  hint: '번호가 바뀌면 계정설정에서 다시 확인합니다.',
  start: '인증하기',
  retry: '다시 시도',
  proceed: '계속',
  success: '본인인증이 완료되었습니다. 다음 단계로 이동합니다.',
  notReady: '본인인증 연결이 아직 준비되지 않았습니다.',
  failed: '본인인증을 시작하지 못했습니다. 다시 시도해 주세요.',
};

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function basicPath(me) {
  const path = basicRegisterPathForMe(me);
  if (parseHashQuery().from === 'oauth') {
    return path.includes('?') ? `${path}&from=oauth` : `${path}?from=oauth`;
  }
  return path;
}

function panelHtml({ status = '', failed = false } = {}) {
  const statusHtml = status
    ? `<p class="${failed ? 'form-error' : 'form-hint'}" role="${failed ? 'alert' : 'status'}">${esc(status)}</p>`
    : '<p class="form-error" data-identity-status hidden role="alert"></p>';

  return `
    <h1 class="auth-heading">${COPY.title}</h1>
    <p class="auth-subheading">${COPY.lead}</p>
    <p class="form-hint">${COPY.hint}</p>
    ${statusHtml}
    <div class="recovery-actions">
      <button type="button" class="btn btn--primary btn--block" data-action="identity-start">${failed ? COPY.retry : COPY.start}</button>
      <button type="button" class="btn btn--block" data-action="identity-continue">${COPY.proceed}</button>
    </div>
  `;
}

export function renderSignupProviderIdentity() {
  return renderAuthShell('<p class="auth-subheading">확인 중…</p>', { showBack: false });
}

export function bindSignupProviderIdentityEvents(root) {
  bindGlobalEvents(root);
  const card = root.querySelector('.auth-shell__card') || root;
  let me = null;

  const leave = (targetMe) => {
    if (!targetMe?.authenticated) {
      navigate('/login');
      return;
    }
    if (!targetMe.email_verified || targetMe.needs_account_contact || targetMe.oauth_role_pending) {
      window.location.href = resolveAfterAuthUrl(targetMe);
      return;
    }
    if (targetMe.needs_basic_register) {
      navigate(basicPath(targetMe));
      return;
    }
    window.location.href = resolveAfterAuthUrl(targetMe);
  };

  const show = (opts) => {
    card.innerHTML = panelHtml(opts);
    card.querySelector('[data-action="identity-start"]')?.addEventListener('click', () => {
      void begin();
    });
    card.querySelector('[data-action="identity-continue"]')?.addEventListener('click', () => {
      if (me) navigate(basicPath(me));
    });
  };

  const begin = async () => {
    const button = card.querySelector('[data-action="identity-start"]');
    if (button) button.disabled = true;
    try {
      const res = await fetch('/api/auth/phone-identity/start.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: '{}',
      });
      const data = await res.json().catch(() => ({}));
      if (data.already_verified === true && data.ok === true) {
        card.innerHTML = `<h1 class="auth-heading">${COPY.title}</h1><p class="auth-subheading">${COPY.success}</p>`;
        window.setTimeout(() => {
          if (me) navigate(basicPath(me));
        }, 700);
        return;
      }
      const message = data.error === 'vendor_not_configured' ? COPY.notReady : (data.message || COPY.failed);
      show({ status: message, failed: true });
    } catch {
      show({ status: COPY.failed, failed: true });
    }
  };

  fetchMeApi()
    .then((next) => {
      me = next;
      if (!needsProviderIdentityPrompt(next) || next.phone_identity?.mode !== 'warn') {
        leave(next);
        return;
      }
      show();
    })
    .catch(() => {
      card.innerHTML = `<p class="form-error" role="alert">${COPY.failed}</p>
        <button type="button" class="btn btn--primary btn--block" data-action="identity-reload">${COPY.retry}</button>`;
      card.querySelector('[data-action="identity-reload"]')?.addEventListener('click', () => {
        window.location.reload();
      });
    });
}
