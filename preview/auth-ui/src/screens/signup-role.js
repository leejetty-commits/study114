import { ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_ICONS, signupState, setRole } from '../state.js';
import { renderAuthShell, renderStepIndicator, bindGlobalEvents, navigate } from '../layout.js';
import { oauthCompleteRoleApi, fetchMeApi } from '../auth-api.js';
import { getLoginReturnTo, resolvePostLoginUrl } from '../../../shared/auth-redirect.js';
import { parseHashQuery } from '../../../shared/preview-links.js';

const ROLES = ['student', 'study_room', 'tutor'];

function isOAuthSignupMode() {
  return parseHashQuery().from === 'oauth';
}

export function renderSignupRole() {
  const selected = signupState.role;
  const oauthMode = isOAuthSignupMode();

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
    ${oauthMode ? '' : renderStepIndicator(2)}
    <div class="panel">
      <h1 class="auth-heading">${oauthMode ? '가입 유형 선택' : '회원 구분 선택'}</h1>
      <p class="auth-subheading mb-8">
        ${
          oauthMode
            ? '소셜 계정으로 가입하셨습니다.<br />주로 사용할 유형을 선택해 주세요.'
            : '가입 후에도 공부방·과외쌤 역할을 추가할 수 있어요.<br />우선 주로 사용할 유형을 선택해 주세요.'
        }
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
        ${oauthMode ? '시작하기' : '다음'}
      </button>

      <p class="text-center mt-6" style="font-size: var(--text-xs); color: var(--gray-400);">
        학생 회원은 본인 학습 조건을 가입 후 기본등록·마이페이지에서 등록합니다. 같은 계정으로 형제자매 정보도 추가할 수 있습니다.
      </p>
    </div>
  `;

  return renderAuthShell(content, {
    showBack: !oauthMode,
    backPath: '/signup/terms',
    backLabel: '약관동의',
  });
}

export function bindSignupRoleEvents(root) {
  bindGlobalEvents(root);

  const oauthMode = isOAuthSignupMode();
  const returnTo = getLoginReturnTo();
  const submitBtn = root.querySelector('[data-submit-role]');
  let selected = signupState.role;

  if (oauthMode) {
    fetchMeApi()
      .then((me) => {
        if (!me?.authenticated) {
          navigate('/login');
        } else if (!me.oauth_role_pending) {
          window.location.href = resolvePostLoginUrl(me.role_type, returnTo);
        }
      })
      .catch(() => navigate('/login'));
  }

  root.querySelectorAll('[data-role]').forEach((card) => {
    card.addEventListener('click', () => {
      selected = card.dataset.role;
      setRole(selected);

      root.querySelectorAll('[data-role]').forEach((c) => {
        c.classList.toggle('is-selected', c.dataset.role === selected);
      });

      if (submitBtn) submitBtn.disabled = false;
    });
  });

  submitBtn?.addEventListener('click', async () => {
    if (!selected) return;
    setRole(selected);

    if (!oauthMode) {
      navigate('/signup/form');
      return;
    }

    submitBtn.disabled = true;
    const prevLabel = submitBtn.textContent;
    submitBtn.textContent = '저장 중…';
    try {
      const data = await oauthCompleteRoleApi(selected);
      if (data.needs_basic_register) {
        navigate(`/signup/basic?from=oauth&role=${selected}`);
        return;
      }
      window.location.href = resolvePostLoginUrl(data.role_type, returnTo);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '회원 구분 저장에 실패했습니다.');
      submitBtn.disabled = false;
      submitBtn.textContent = prevLabel;
    }
  });
}
