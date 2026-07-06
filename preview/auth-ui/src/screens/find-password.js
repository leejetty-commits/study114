import {
  renderRecoveryStage,
  renderRecoverySuccessIcon,
  renderRecoveryLinks,
} from '../recovery-stage.js';
import { bindGlobalEvents } from '../layout.js';
import {
  passwordForgotApi,
  PASSWORD_RESET_RESEND_COOLDOWN_SEC,
  formatResendCountdown,
} from '../password-reset-api.js';

const SENT_MESSAGE =
  '입력한 이메일로 비밀번호 재설정 링크를 보냈습니다. 메일이 보이지 않으면 스팸함도 확인해 주세요.';

function normalizeEmail(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

/** @returns {string|null} */
function validateEmailFormat(email) {
  if (!email) return '이메일을 입력해 주세요.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '올바른 이메일 형식이 아닙니다.';
  return null;
}

function renderRequestStep() {
  return `
    <div data-step="request">
      <h1 class="auth-heading">비밀번호 찾기</h1>
      <p class="auth-subheading recovery-stage__desc">
        가입한 이메일을 입력하면 비밀번호를 다시 설정할 수 있는 링크를 보내드립니다.
      </p>
      <form data-form="find-password">
        <div class="form-group">
          <label class="form-label form-label--required" for="find-pw-email">이메일</label>
          <input
            class="form-input"
            type="email"
            id="find-pw-email"
            name="email"
            placeholder="가입한 이메일을 입력하세요"
            autocomplete="email"
            required
          />
          <p class="form-error" data-email-error hidden role="alert"></p>
        </div>
        <button type="submit" class="btn btn--primary btn--block">재설정 메일 보내기</button>
      </form>
      ${renderRecoveryLinks()}
    </div>`;
}

function renderSentStep(email) {
  const masked = email.replace(/(.{2}).*(@.*)/, '$1***$2');
  return `
    <div data-step="sent" data-email="${email.replace(/"/g, '&quot;')}">
      ${renderRecoverySuccessIcon()}
      <h1 class="auth-heading">메일을 확인해 주세요</h1>
      <p class="auth-subheading recovery-stage__desc">${SENT_MESSAGE}</p>
      <p class="recovery-stage__email-hint" data-sent-email>${masked}</p>
      <div class="recovery-actions">
        <button type="button" class="btn btn--secondary btn--block" data-action="resend">메일 다시 보내기</button>
        <button type="button" class="btn btn--ghost btn--block" data-action="re-enter">이메일 다시 입력</button>
      </div>
      ${renderRecoveryLinks({ signup: false })}
    </div>`;
}

export function renderFindPassword() {
  return renderRecoveryStage(renderRequestStep());
}

function showStep(root, html) {
  const card = root.querySelector('.recovery-stage__card');
  if (card) card.innerHTML = html;
  bindFindPasswordEvents(root);
}

/** @param {number} secondsUntilResend */
function startResendCooldown(root, secondsUntilResend = PASSWORD_RESET_RESEND_COOLDOWN_SEC) {
  const sent = root.querySelector('[data-step="sent"]');
  const btn = root.querySelector('[data-action="resend"]');
  if (!sent || !btn) return;

  const until = Date.now() + Math.max(0, secondsUntilResend) * 1000;
  sent.dataset.cooldownUntil = String(until);

  const tick = () => {
    const leftSec = Math.max(0, (until - Date.now()) / 1000);
    if (leftSec <= 0) {
      btn.disabled = false;
      btn.textContent = '메일 다시 보내기';
      return;
    }
    btn.disabled = true;
    btn.textContent = `메일 다시 보내기 (${formatResendCountdown(leftSec)})`;
    window.setTimeout(tick, 1000);
  };
  tick();
}

/**
 * @param {number} [fromApi]
 */
function resolveCooldownSeconds(fromApi) {
  if (typeof fromApi === 'number' && fromApi > 0) {
    return fromApi;
  }
  return PASSWORD_RESET_RESEND_COOLDOWN_SEC;
}

async function submitForgot(root, email) {
  const data = await passwordForgotApi(email);
  showStep(root, renderSentStep(email));
  startResendCooldown(root, resolveCooldownSeconds(data.resend_available_in));
  return data;
}

export function bindFindPasswordEvents(root) {
  bindGlobalEvents(root);

  const sent = root.querySelector('[data-step="sent"]');
  const cooldownUntil = sent?.dataset.cooldownUntil;
  if (sent && cooldownUntil && !root.dataset.cooldownBound) {
    const leftSec = Math.max(0, (Number(cooldownUntil) - Date.now()) / 1000);
    if (leftSec > 0) {
      startResendCooldown(root, leftSec);
    }
    root.dataset.cooldownBound = '1';
  }

  const form = root.querySelector('[data-form="find-password"]');
  const emailError = root.querySelector('[data-email-error]');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const raw = String(new FormData(form).get('email') ?? '');
    const email = normalizeEmail(raw);
    const formatError = validateEmailFormat(email);

    if (formatError) {
      if (emailError) {
        emailError.hidden = false;
        emailError.textContent = formatError;
      }
      return;
    }
    if (emailError) emailError.hidden = true;

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '발송 중…';
    }

    try {
      await submitForgot(root, email);
    } catch {
      showStep(root, renderSentStep(email));
      startResendCooldown(root);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '재설정 메일 보내기';
      }
    }
  });

  root.querySelector('[data-action="re-enter"]')?.addEventListener('click', () => {
    delete root.dataset.cooldownBound;
    showStep(root, renderRequestStep());
  });

  root.querySelector('[data-action="resend"]')?.addEventListener('click', async () => {
    const sentEl = root.querySelector('[data-step="sent"]');
    const email = sentEl?.dataset.email || '';
    if (!email) return;

    const btn = root.querySelector('[data-action="resend"]');
    if (btn?.disabled) return;

    if (btn) {
      btn.disabled = true;
      btn.textContent = '발송 중…';
    }
    try {
      const data = await passwordForgotApi(email);
      startResendCooldown(root, resolveCooldownSeconds(data.resend_available_in));
    } catch {
      startResendCooldown(root);
    }
  });
}
