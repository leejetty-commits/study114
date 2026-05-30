import { ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_ICONS, signupState, setRole } from '../state.js';
import { renderAuthShell, renderStepIndicator, bindGlobalEvents, navigate } from '../layout.js';

const ROLES = ['student', 'study_room', 'tutor'];

export function renderSignupRole() {
  const selected = signupState.role;

  const roleCards = ROLES.map(
    (role) => `
      <button
        type="button"
        class="role-card ${selected === role ? 'is-selected' : ''}"
        data-role="${role}"
      >
        <span class="role-card__icon">${ROLE_ICONS[role]}</span>
        <span class="role-card__body">
          <span class="role-card__title">${ROLE_LABELS[role]}</span>
          <span class="role-card__desc">${ROLE_DESCRIPTIONS[role]}</span>
        </span>
      </button>
    `,
  ).join('');

  const content = `
    ${renderStepIndicator(2)}
    <div class="panel">
      <h1 class="auth-heading">회원 구분 선택</h1>
      <p class="auth-subheading mb-8">
        가입 후에도 공부방·과외쌤 역할을 추가할 수 있어요.<br />
        우선 주로 사용할 유형을 선택해 주세요.
      </p>

      <div class="role-grid mb-8" data-role-grid>
        ${roleCards}
      </div>

      <button
        type="button"
        class="btn btn--primary btn--block"
        data-submit-role
        ${selected ? '' : 'disabled'}
      >
        다음
      </button>

      <p class="text-center mt-6" style="font-size: var(--text-xs); color: var(--gray-400);">
        학생(학부모) 회원은 자녀 정보를 가입 후 상세등록·마이페이지에서 등록합니다.
      </p>
    </div>
  `;

  return renderAuthShell(content, { showBack: true, backPath: '/signup/terms', backLabel: '약관동의' });
}

export function bindSignupRoleEvents(root) {
  bindGlobalEvents(root);

  const submitBtn = root.querySelector('[data-submit-role]');
  let selected = signupState.role;

  root.querySelectorAll('[data-role]').forEach((card) => {
    card.addEventListener('click', () => {
      selected = card.dataset.role;
      setRole(selected);

      root.querySelectorAll('[data-role]').forEach((c) => {
        c.classList.toggle('is-selected', c.dataset.role === selected);
      });

      submitBtn.disabled = false;
    });
  });

  submitBtn?.addEventListener('click', () => {
    if (!selected) return;
    setRole(selected);
    navigate('/signup/form');
  });
}
