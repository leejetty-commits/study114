import { renderAuthShell, renderBrandHero, renderSocialLogin, bindGlobalEvents } from '../layout.js';
import { loginApi } from '../auth-api.js';

export function renderLogin() {
  const content = `
    ${renderBrandHero()}
    <div class="panel">
      <h1 class="auth-heading">로그인</h1>
      <p class="auth-subheading mb-8">우리 동네 공부방·과외 정보, 우동공과에서 확인하세요.</p>

      <form data-form="login">
        <div class="form-group">
          <label class="form-label form-label--required" for="login-email">이메일(ID)</label>
          <input
            class="form-input"
            type="email"
            id="login-email"
            name="email"
            placeholder="example@email.com"
            value="guardian1@dev.local"
            autocomplete="email"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="login-password">비밀번호</label>
          <input
            class="form-input"
            type="password"
            id="login-password"
            name="password"
            placeholder="password"
            value=""
            autocomplete="current-password"
          />
        </div>
        <div class="form-group">
          <label class="form-check form-check--inline">
            <input class="form-check__input" type="checkbox" name="remember" checked />
            <span class="form-check__label">로그인 상태 유지</span>
          </label>
        </div>
        <button type="submit" class="btn btn--primary btn--block">로그인</button>
      </form>

      <div class="auth-links mt-6">
        <a href="#/find-id" data-nav="/find-id">아이디 찾기</a>
        <span class="auth-links__sep">|</span>
        <a href="#/find-password" data-nav="/find-password">비밀번호 찾기</a>
      </div>

      <div class="divider">또는</div>

      ${renderSocialLogin()}

      <p class="text-center mt-8" style="font-size: var(--text-sm); color: var(--gray-500);">
        아직 회원이 아니신가요?
        <a href="#/signup/terms" data-nav="/signup/terms" style="color: var(--link-color); font-weight: 600;">회원가입</a>
      </p>
    </div>
  `;

  return renderAuthShell(content);
}

export function bindLoginEvents(root) {
  bindGlobalEvents(root);

  const form = root.querySelector('[data-form="login"]');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '로그인 중…';
    }
    try {
      const data = await loginApi({
        email: String(fd.get('email') ?? ''),
        password: String(fd.get('password') ?? ''),
      });
      alert(`로그인 성공\n${data.email} (${data.role_type})`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '로그인 실패');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '로그인';
      }
    }
  });
}
