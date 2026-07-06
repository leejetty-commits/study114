import { renderAuthShell, renderSocialLogin, bindGlobalEvents } from '../layout.js';
import { loginApi } from '../auth-api.js';
import {
  getLoginReturnTo,
  resolvePostLoginUrl,
  oauthStartUrl,
} from '../../../shared/auth-redirect.js';
import {
  renderLoginUtilBar,
  renderLoginBackdrop,
  renderLoginStageBelow,
} from '../login-stage.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function readOAuthError() {
  const hash = window.location.hash;
  const qIdx = hash.indexOf('?');
  if (qIdx === -1) return '';
  const params = new URLSearchParams(hash.slice(qIdx + 1));
  return params.get('oauth_error') || '';
}

export function renderLogin() {
  const returnTo = getLoginReturnTo();
  const oauthError = readOAuthError();
  const devEmail = import.meta.env.DEV ? 'guardian1@dev.local' : '';

  const content = `
    <div class="login-stage">
      ${renderLoginUtilBar()}
      ${renderLoginBackdrop()}
      <div class="login-stage__card panel panel--login">
        <div class="login-stage__brand">
          <img
            class="login-stage__wordmark"
            src="/assets/brand/logo-wordmark.png"
            alt="우동공과"
            width="120"
            height="32"
          />
        </div>
        <h1 class="auth-heading">로그인</h1>
        <p class="auth-subheading login-stage__sub">
          우리 동네 공부방·과외쌤 찾기와 쪽지 연결을 이어서 이용하세요.
        </p>
        ${
          oauthError
            ? `<p class="login-stage__error" role="alert">${esc(oauthError)}</p>`
            : ''
        }
        <div class="login-stage__error-slot" data-login-error hidden></div>

        <form data-form="login" class="login-form">
          <div class="form-group">
            <label class="form-label form-label--required" for="login-email">이메일(ID)</label>
            <input
              class="form-input"
              type="email"
              id="login-email"
              name="email"
              placeholder="example@email.com"
              value="${esc(devEmail)}"
              autocomplete="email"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label form-label--required" for="login-password">비밀번호</label>
            <input
              class="form-input"
              type="password"
              id="login-password"
              name="password"
              placeholder="비밀번호"
              autocomplete="current-password"
              required
            />
          </div>
          <button type="submit" class="btn btn--primary btn--block">로그인</button>
        </form>

        <div class="auth-links mt-6">
          <span>처음이신가요?</span>
          <a href="#/signup/terms" data-nav="/signup/terms">회원가입</a>
          <span class="auth-links__sep">|</span>
          <a href="#/find-password" data-nav="/find-password">비밀번호 찾기</a>
        </div>
        <p class="login-stage__signup-hint">학부모·공부방·과외쌤 공통 계정으로 시작합니다.</p>

        <div class="divider">또는</div>

        ${renderSocialLogin(returnTo)}
      </div>
      ${renderLoginStageBelow({ returnTo })}
    </div>
  `;

  return renderAuthShell(content, { wide: true, hideDefaultCard: true });
}

export function bindLoginEvents(root) {
  bindGlobalEvents(root);
  const returnTo = getLoginReturnTo();

  root.querySelector('[data-action="login-region"]')?.addEventListener('click', () => {
    window.alert('로그인 후 마이페이지·지역 설정에서 활동 지역을 등록할 수 있습니다.');
  });

  root.querySelectorAll('[data-action^="social-"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const provider = btn.getAttribute('data-action')?.replace('social-', '');
      if (!provider) return;
      window.location.href = oauthStartUrl(provider, returnTo);
    });
  });

  const form = root.querySelector('[data-form="login"]');
  const errorSlot = root.querySelector('[data-login-error]');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const submitBtn = form.querySelector('[type="submit"]');
    if (errorSlot) {
      errorSlot.hidden = true;
      errorSlot.textContent = '';
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '로그인 중…';
    }
    try {
      const data = await loginApi({
        email: String(fd.get('email') ?? ''),
        password: String(fd.get('password') ?? ''),
      });
      window.location.href = resolvePostLoginUrl(data.role_type, returnTo);
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다.';
      if (errorSlot) {
        errorSlot.hidden = false;
        errorSlot.textContent = message;
        errorSlot.setAttribute('role', 'alert');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '로그인';
      }
    }
  });
}
