import { FIND_PASSWORD_TEMP } from '../state.js';
import { renderAuthShell, renderTempNotice, bindGlobalEvents } from '../layout.js';

export function renderFindPassword() {
  const content = `
    ${FIND_PASSWORD_TEMP ? renderTempNotice('비밀번호 찾기 단계·필드는 SSOT 2장 §3.7 [임시]') : ''}
    <div class="panel">
      <h1 class="auth-heading">비밀번호 찾기</h1>
      <p class="auth-subheading mb-8">가입 이메일로 인증 후 새 비밀번호를 설정합니다.</p>

      <form data-form="find-password">
        <div data-step="1">
          <div class="form-group">
            <label class="form-label form-label--required" for="find-pw-email">이메일(ID)</label>
            <input
              class="form-input"
              type="email"
              id="find-pw-email"
              name="email"
              placeholder="가입 시 사용한 이메일"
              value="parent@example.com"
            />
          </div>
          <button type="button" class="btn btn--primary btn--block" data-action="send-code">
            인증번호 받기
          </button>
        </div>

        <div data-step="2" hidden class="mt-6">
          <div class="form-group">
            <label class="form-label form-label--required" for="find-pw-code">인증번호</label>
            <div style="display: flex; gap: var(--space-2);">
              <input
                class="form-input"
                type="text"
                id="find-pw-code"
                name="code"
                placeholder="6자리 숫자"
                maxlength="6"
                style="flex: 1;"
              />
              <button type="button" class="btn btn--secondary btn--sm" style="flex-shrink: 0;" data-action="verify-code">
                확인
              </button>
            </div>
            <p class="form-hint">[프리뷰] 더미 인증번호: 123456</p>
          </div>
        </div>

        <div data-step="3" hidden class="mt-6">
          <div class="form-group">
            <label class="form-label form-label--required" for="find-pw-new">새 비밀번호</label>
            <input
              class="form-input"
              type="password"
              id="find-pw-new"
              name="new_password"
              placeholder="8자 이상"
            />
          </div>
          <div class="form-group">
            <label class="form-label form-label--required" for="find-pw-new-confirm">새 비밀번호 확인</label>
            <input
              class="form-input"
              type="password"
              id="find-pw-new-confirm"
              name="new_password_confirm"
              placeholder="비밀번호 재입력"
            />
          </div>
          <button type="submit" class="btn btn--primary btn--block">비밀번호 변경</button>
        </div>
      </form>

      <div class="result-box" data-result hidden>
        <p class="result-box__label">비밀번호가 변경되었습니다</p>
        <p class="result-box__value">새 비밀번호로 로그인해 주세요.</p>
        <button type="button" class="btn btn--primary btn--block mt-6" data-nav="/login">로그인하기</button>
      </div>

      <div class="auth-links mt-8">
        <a href="#/find-id" data-nav="/find-id">아이디 찾기</a>
        <span class="auth-links__sep">|</span>
        <a href="#/login" data-nav="/login">로그인</a>
      </div>
    </div>
  `;

  return renderAuthShell(content, { showBack: true, backPath: '/login', backLabel: '로그인' });
}

export function bindFindPasswordEvents(root) {
  bindGlobalEvents(root);

  const step2 = root.querySelector('[data-step="2"]');
  const step3 = root.querySelector('[data-step="3"]');
  const result = root.querySelector('[data-result]');
  const form = root.querySelector('[data-form="find-password"]');

  root.querySelector('[data-action="send-code"]')?.addEventListener('click', () => {
    step2.hidden = false;
    alert('[프리뷰] 인증번호 123456이 발송되었습니다. (더미)');
  });

  root.querySelector('[data-action="verify-code"]')?.addEventListener('click', () => {
    const code = root.querySelector('#find-pw-code')?.value;
    if (code === '123456' || code === '') {
      step3.hidden = false;
      alert('[프리뷰] 인증이 완료되었습니다.');
    } else {
      alert('인증번호가 올바르지 않습니다. (프리뷰: 123456 또는 빈 값)');
    }
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    form.hidden = true;
    result.hidden = false;
  });
}
