import { renderRecoveryStage } from '../recovery-stage.js';
import { bindGlobalEvents, navigate } from '../layout.js';
import { fetchMeApi } from '../auth-api.js';
import {
  basicRegisterPathForMe,
  getLoginReturnTo,
  needsProviderIdentityGate,
  resolveAfterAuthUrl,
} from '../../../shared/auth-redirect.js';

const COPY = {
  title: '본인인증',
  lead:
    '공급자 가입은 휴대폰 번호 기준으로 처음 1회 본인인증을 진행합니다. 인증이 끝나면 이후 공개, 쪽지, 유료상품 이용에서 다시 반복하지 않습니다.',
  hint: '번호가 바뀌면 계정설정에서 다시 확인합니다.',
  start: '인증하기',
  retry: '다시 시도',
  done: '본인인증이 완료되었습니다. 다음 단계로 이동합니다.',
  blocked: '인증을 완료하지 않아 다음 단계로 이동할 수 없습니다.',
  retryLead: '다시 시도한 뒤 계속 진행해 주세요.',
};

export function renderSignupProviderIdentity() {
  return renderRecoveryStage(`
    <div data-provider-identity>
      <h1 class="auth-heading">확인 중입니다</h1>
    </div>
  `);
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {string} [reason]
 */
function failureHtml(reason) {
  const why = String(reason || '').trim();
  const extra =
    why && why !== COPY.blocked && why !== COPY.retryLead
      ? `<p class="form-error" role="alert">${esc(why)}</p>`
      : '';
  return `
    ${extra}
    <p class="form-error" role="alert">${COPY.blocked}</p>
    <p class="form-hint">${COPY.retryLead}</p>
  `;
}

async function postPhone(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data.message || '인증을 완료하지 못했습니다.');
    err.code = data.error || '';
    throw err;
  }
  return data;
}

function leaveWithoutAdvance(me) {
  if (me?.needs_basic_register && me?.phone_verified === true) {
    navigate(basicRegisterPathForMe(me));
    return;
  }
  if (me?.needs_basic_register && !needsProviderIdentityGate(me)) {
    navigate(basicRegisterPathForMe(me));
    return;
  }
  window.location.href = resolveAfterAuthUrl(me, getLoginReturnTo());
}

/**
 * @param {HTMLElement} root
 */
function mountGate(root) {
  const box = root.querySelector('[data-provider-identity]');
  if (!box) return;

  let phase = 'intro';

  const paint = ({ masked = '', error = '', success = false } = {}) => {
    if (success) {
      box.innerHTML = `
        <h1 class="auth-heading">${COPY.title}</h1>
        <p class="auth-subheading recovery-stage__desc" role="status">${COPY.done}</p>
      `;
      return;
    }
    const codeBlock =
      phase === 'code'
        ? `
          <p class="recovery-stage__email-hint" data-identity-mask>${masked ? esc(masked) : ''}</p>
          <label class="form-label" for="provider-identity-code">인증번호</label>
          <input class="form-input" id="provider-identity-code" data-identity-code inputmode="numeric" autocomplete="one-time-code" maxlength="6" />
        `
        : '';
    box.innerHTML = `
      <h1 class="auth-heading">${COPY.title}</h1>
      <p class="auth-subheading recovery-stage__desc">${COPY.lead}</p>
      <p class="form-hint">${COPY.hint}</p>
      ${error ? `<div data-identity-error>${failureHtml(error)}</div>` : ''}
      ${codeBlock}
      <div class="recovery-actions">
        <button type="button" class="btn btn--primary btn--block" data-action="identity-verify">${COPY.start}</button>
        <button type="button" class="btn btn--ghost btn--block" data-action="identity-retry">${COPY.retry}</button>
        <button type="button" class="btn btn--ghost btn--block" data-action="identity-close">닫기</button>
      </div>
    `;
    bindActions(masked);
  };

  const setBusy = (busy) => {
    box.querySelectorAll('button').forEach((btn) => {
      btn.disabled = busy;
    });
  };

  const goNext = async () => {
    const latest = await fetchMeApi();
    if (latest.phone_verified !== true || needsProviderIdentityGate(latest)) {
      phase = 'intro';
      paint({ error: COPY.blocked });
      return;
    }
    paint({ success: true });
    window.setTimeout(() => {
      navigate(basicRegisterPathForMe(latest));
    }, 700);
  };

  const sendCode = async () => {
    setBusy(true);
    try {
      const data = await postPhone('/api/auth/phone/send-otp.php', {});
      if (data.already_verified) {
        await goNext();
        return;
      }
      phase = 'code';
      paint({ masked: data.masked_phone || '' });
    } catch (err) {
      phase = 'intro';
      paint({ error: err instanceof Error ? err.message : COPY.blocked });
    }
  };

  const submitCode = async () => {
    const input = box.querySelector('[data-identity-code]');
    const code = String(input?.value || '').trim();
    setBusy(true);
    try {
      await postPhone('/api/auth/phone/verify-otp.php', { code });
      await goNext();
    } catch (err) {
      phase = 'code';
      const masked = box.querySelector('[data-identity-mask]')?.textContent || '';
      paint({
        masked,
        error: err instanceof Error ? err.message : COPY.blocked,
      });
    }
  };

  const bindActions = (masked) => {
    box.querySelector('[data-action="identity-verify"]')?.addEventListener('click', () => {
      if (phase === 'code') submitCode();
      else sendCode();
    });
    box.querySelector('[data-action="identity-retry"]')?.addEventListener('click', () => {
      sendCode();
    });
    box.querySelector('[data-action="identity-close"]')?.addEventListener('click', () => {
      phase = 'intro';
      paint({ error: COPY.blocked });
    });
    box.querySelector('[data-identity-code]')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitCode();
      }
    });
    if (masked) {
      const maskEl = box.querySelector('[data-identity-mask]');
      if (maskEl && !maskEl.textContent) maskEl.textContent = masked;
    }
  };

  paint();
}

export function bindSignupProviderIdentityEvents(root) {
  bindGlobalEvents(root);
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
      if (!needsProviderIdentityGate(me)) {
        leaveWithoutAdvance(me);
        return;
      }
      mountGate(root);
    })
    .catch(() => navigate('/login'));
}
