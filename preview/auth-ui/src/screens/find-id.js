import { FIND_ID_TEMP } from '../state.js';
import { renderAuthShell, renderTempNotice, bindGlobalEvents } from '../layout.js';

export function renderFindId() {
  const content = `
    ${FIND_ID_TEMP ? renderTempNotice('아이디 찾기 입력 필드·인증 방식은 SSOT 2장 §3.6 [임시]') : ''}
    <div class="panel">
      <h1 class="auth-heading">아이디 찾기</h1>
      <p class="auth-subheading mb-8">가입 시 등록한 정보로 아이디(이메일)를 확인합니다.</p>

      <form data-form="find-id">
        <div class="form-group">
          <label class="form-label form-label--required" for="find-id-name">이름</label>
          <input
            class="form-input"
            type="text"
            id="find-id-name"
            name="name"
            placeholder="가입 시 입력한 이름"
            value="김우동"
          />
        </div>
        <div class="form-group">
          <label class="form-label form-label--required" for="find-id-phone">휴대폰 번호</label>
          <input
            class="form-input"
            type="tel"
            id="find-id-phone"
            name="phone"
            placeholder="010-0000-0000"
            value="010-1234-5678"
          />
        </div>
        <button type="submit" class="btn btn--primary btn--block">아이디 찾기</button>
      </form>

      <div class="result-box" data-result hidden>
        <p class="result-box__label">회원님의 이메일(ID)는</p>
        <p class="result-box__value">pa***@example.com</p>
        <p class="form-hint mt-4" style="text-align: center;">보안을 위해 일부가 마스킹 처리됩니다.</p>
      </div>

      <div class="auth-links mt-8">
        <a href="#/find-password" data-nav="/find-password">비밀번호 찾기</a>
        <span class="auth-links__sep">|</span>
        <a href="#/login" data-nav="/login">로그인</a>
      </div>
    </div>
  `;

  return renderAuthShell(content, { showBack: true, backPath: '/login', backLabel: '로그인' });
}

export function bindFindIdEvents(root) {
  bindGlobalEvents(root);

  const form = root.querySelector('[data-form="find-id"]');
  const result = root.querySelector('[data-result]');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}
