import { signupState, ROLE_LABELS, resetSignupState } from '../state.js';
import { renderAuthShell, renderStepIndicator, bindGlobalEvents } from '../layout.js';

export function renderSignupComplete() {
  const role = signupState.role || 'student';
  const roleLabel = ROLE_LABELS[role];
  const saved = signupState.lastSignup;

  const content = `
    ${renderStepIndicator(4)}
    <div class="panel success-message">
      <div class="success-icon">✓</div>
      <h1 class="auth-heading">회원가입 완료</h1>
      <p class="auth-subheading">
        우동공과 가입이 완료되었습니다.<br />
        선택하신 회원 구분: ${roleLabel}
      </p>

      <dl class="success-info">
        <dt>회원 ID (DB)</dt>
        <dd>${saved?.userId ?? '—'}</dd>
        <dt>이메일(ID)</dt>
        <dd>${saved?.email ?? '—'}</dd>
        <dt>역할 (DB role_type)</dt>
        <dd>${saved?.roleType ?? '—'}</dd>
        <dt>회원 구분 (UI)</dt>
        <dd>${roleLabel}</dd>
      </dl>
      <div class="actions-stack">
        <button type="button" class="btn btn--primary btn--block" data-action="go-detail-register">
          ${roleLabel} 상세등록 (프리뷰)
        </button>
        <button type="button" class="btn btn--secondary btn--block" data-action="go-home">
          메인 홈으로 (프리뷰)
        </button>
        <button type="button" class="btn btn--ghost btn--block" data-nav="/login">로그인하기</button>
      </div>

      <p class="form-note text-center mt-6">
        9장 기준 역할별 메인 화면은 다음 단계에서 연결 예정
      </p>
    </div>
  `;

  return renderAuthShell(content);
}

export function bindSignupCompleteEvents(root) {
  bindGlobalEvents(root);

  root.querySelector('[data-action="go-detail-register"]')?.addEventListener('click', () => {
    const role = signupState.role || 'student';
    alert(`[프리뷰] ${ROLE_LABELS[role]} 상세등록 화면은 가입 후 별도 단계로 구현 예정입니다.`);
  });

  root.querySelector('[data-action="go-home"]')?.addEventListener('click', () => {
    alert('[프리뷰] 9장 기준 역할별 메인 홈 화면은 다음 단계에서 구현 예정입니다.');
  });

  root.querySelector('[data-nav="/login"]')?.addEventListener('click', () => {
    resetSignupState();
  });
}
