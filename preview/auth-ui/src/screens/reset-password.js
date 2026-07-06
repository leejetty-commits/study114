import {
  renderRecoveryStage,
  renderRecoverySuccessIcon,
  renderRecoveryLinks,
  renderTokenErrorCard,
  renderPasswordRuleList,
} from '../recovery-stage.js';
import { bindGlobalEvents } from '../layout.js';
import { passwordResetApi, passwordValidateTokenApi } from '../password-reset-api.js';
import { validatePassword } from '../../../shared/password-policy.js';
import { parseHashQuery } from '../../../shared/preview-links.js';

function renderLoadingCard() {
  return `
    <p class="recovery-stage__loading" aria-live="polite">링크를 확인하는 중입니다…</p>`;
}

function renderFormCard(token) {
  const safeToken = String(token).replace(/"/g, '&quot;');
  return `
    <h1 class="auth-heading">새 비밀번호 설정</h1>
    <p class="auth-subheading recovery-stage__desc">새로 사용할 비밀번호를 입력해 주세요.</p>
    <form data-form="reset-password">
      <input type="hidden" name="token" value="${safeToken}" />
      <div class="form-group">
        <label class="form-label form-label--required" for="reset-password">새 비밀번호</label>
        <input
          class="form-input"
          type="password"
          id="reset-password"
          name="password"
          autocomplete="new-password"
          required
        />
      </div>
      <div class="form-group">
        <label class="form-label form-label--required" for="reset-password-confirm">새 비밀번호 확인</label>
        <input
          class="form-input"
          type="password"
          id="reset-password-confirm"
          name="password_confirm"
          autocomplete="new-password"
          required
        />
      </div>
      ${renderPasswordRuleList()}
      <div class="form-error" data-reset-error hidden role="alert"></div>
      <button type="submit" class="btn btn--primary btn--block mt-6">비밀번호 변경하기</button>
    </form>
    <div class="recovery-links mt-8">
      <a href="#/find-password" data-nav="/find-password">비밀번호 찾기</a>
    </div>`;
}

function renderCompleteCard() {
  return `
    ${renderRecoverySuccessIcon()}
    <h1 class="auth-heading">비밀번호가 변경되었습니다</h1>
    <p class="auth-subheading recovery-stage__desc">새 비밀번호로 다시 로그인해 주세요.</p>
    <button type="button" class="btn btn--primary btn--block" data-nav="/login">로그인하기</button>`;
}

export function renderResetPassword() {
  return renderRecoveryStage(`<div data-reset-panel>${renderLoadingCard()}</div>`);
}

function setPanelHtml(root, html) {
  const panel = root.querySelector('[data-reset-panel]');
  if (panel) panel.innerHTML = html;
  bindResetPasswordEvents(root);
}

/** @param {string} message */
function mapClientPasswordError(message) {
  if (message.includes('일치')) return '비밀번호가 서로 일치하지 않습니다.';
  if (message.includes('8~14') || message.includes('8~14자')) return '8~14자 이내로 입력해 주세요.';
  if (message.includes('영문') || message.includes('숫자') || message.includes('특수')) {
    return '영문, 숫자, 특수문자를 모두 포함해 주세요.';
  }
  if (
    message.includes('쉬운') ||
    message.includes('이메일') ||
    message.includes('이름') ||
    message.includes('휴대폰') ||
    message.includes('반복') ||
    message.includes('패턴')
  ) {
    return '사용할 수 없는 비밀번호입니다. 더 안전한 비밀번호로 다시 입력해 주세요.';
  }
  return message;
}

export function bindResetPasswordEvents(root) {
  bindGlobalEvents(root);

  const panel = root.querySelector('[data-reset-panel]');
  if (panel?.dataset.ready !== '1' && panel?.querySelector('.recovery-stage__loading')) {
    const token = parseHashQuery().token || '';
    if (!token) {
      setPanelHtml(root, renderTokenErrorCard('invalid'));
      if (panel) panel.dataset.ready = '1';
      return;
    }

    passwordValidateTokenApi(token)
      .then(({ status }) => {
        if (status === 'valid') {
          setPanelHtml(root, renderFormCard(token));
        } else {
          setPanelHtml(root, renderTokenErrorCard(status));
        }
        if (panel) panel.dataset.ready = '1';
      })
      .catch(() => {
        setPanelHtml(root, renderTokenErrorCard('invalid'));
        if (panel) panel.dataset.ready = '1';
      });
    return;
  }

  const form = root.querySelector('[data-form="reset-password"]');
  const errorEl = root.querySelector('[data-reset-error]');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const password = String(fd.get('password') ?? '');
    const confirm = String(fd.get('password_confirm') ?? '');
    const token = String(fd.get('token') ?? '');

    const clientError = validatePassword(password, confirm);
    if (clientError) {
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = mapClientPasswordError(clientError);
      }
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '저장 중…';
    }
    if (errorEl) errorEl.hidden = true;

    try {
      await passwordResetApi({ token, password, password_confirm: confirm });
      setPanelHtml(root, renderCompleteCard());
      const nextPanel = root.querySelector('[data-reset-panel]');
      if (nextPanel) nextPanel.dataset.ready = '1';
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err ? err.code : '';
      if (code === 'expired' || code === 'used' || code === 'invalid') {
        setPanelHtml(root, renderTokenErrorCard(code));
        const nextPanel = root.querySelector('[data-reset-panel]');
        if (nextPanel) nextPanel.dataset.ready = '1';
        return;
      }
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent =
          err instanceof Error ? mapClientPasswordError(err.message) : '비밀번호 변경에 실패했습니다.';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '비밀번호 변경하기';
      }
    }
  });
}
