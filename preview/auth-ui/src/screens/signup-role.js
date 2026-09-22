import { ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_ICONS, signupState, setRole } from '../state.js';
import { renderAuthShell, renderStepIndicator, bindGlobalEvents, navigate } from '../layout.js';
import { oauthCompleteRoleApi, fetchMeApi, parseApiJson } from '../auth-api.js';
import { getLoginReturnTo, resolvePostLoginUrl, setPostVerifyTarget } from '../../../shared/auth-redirect.js';
import { parseHashQuery } from '../../../shared/preview-links.js';
import { verifyEmailPathForSignupResult } from '../email-verify-send-status.js';

const ROLES = ['student', 'study_room', 'tutor'];

function isOAuthSignupMode() {
  return parseHashQuery().from === 'oauth';
}

function friendlySignupError(data, status) {
  const raw = String(data?.message || '').trim();
  if (raw.includes('이미 사용 중인 이메일')) {
    return '이미 가입된 이메일입니다. 기존 계정으로 로그인해 주세요. 탈퇴한 메일이면 같은 주소로 다시 가입할 수 있습니다.';
  }
  if (raw.includes('gender')) {
    return '성별을 선택해 주세요.';
  }
  if (raw) return raw.replace(/^[a-z_]+:\s*/i, '');
  if (status === 422) return '입력값을 확인해 주세요. 필수 항목이 빠졌거나 형식이 올바르지 않습니다.';
  return `가입 실패 (HTTP ${status})`;
}

function showRoleError(root, msg) {
  let el = root.querySelector('[data-role-error]');
  if (!el) {
    el = document.createElement('p');
    el.className = 'form-error';
    el.setAttribute('data-role-error', '');
    el.setAttribute('role', 'alert');
    root.querySelector('.panel')?.appendChild(el);
  }
  el.hidden = false;
  el.textContent = msg;
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
    ${oauthMode ? '' : renderStepIndicator(3, 5)}
    <div class="panel">
      <h1 class="auth-heading">${oauthMode ? '가입 유형 선택' : '회원 구분 선택'}</h1>
      <p class="auth-subheading mb-8">
        ${
          oauthMode
            ? '소셜 계정으로 가입하셨습니다.<br />주로 사용할 유형을 선택해 주세요.'
            : '사용할 유형 1개를 선택하세요.<br />계정을 만든 뒤 이메일 확인이 끝나면, 그 유형의 기본정보로 이어집니다.'
        }
      </p>

      <div class="role-grid mb-8" data-role-grid>
        ${roleCards}
      </div>

      <p class="form-error" data-role-error hidden role="alert"></p>

      <button
        type="button"
        class="btn btn--primary btn--block"
        data-submit-role
        ${selected ? '' : 'disabled'}
      >
        ${oauthMode ? '시작하기' : '계정 만들기'}
      </button>

      <p class="text-center mt-6" style="font-size: var(--text-xs); color: var(--gray-400);">
        한 계정은 유형 1개만 사용합니다. 다른 유형은 다른 이메일로 가입합니다.
      </p>
    </div>
  `;

  return renderAuthShell(content, {
    showBack: !oauthMode,
    backPath: '/signup/form',
    backLabel: '가입폼',
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
  } else if (!signupState.accountDraft && !signupState.lastSignup) {
    navigate('/signup/form');
    return;
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

    if (oauthMode) {
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
      return;
    }

    const draft = signupState.accountDraft;
    if (!draft) {
      navigate('/signup/form');
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = '계정 생성 중…';
    try {
      const payload = { ...draft, role: selected };
      const res = await fetch('/api/auth/signup.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = parseApiJson(await res.text());

      if (!res.ok || !data.ok) {
        const msg = friendlySignupError(data, res.status);
        showRoleError(root, msg);
        submitBtn.disabled = false;
        submitBtn.textContent = '계정 만들기';
        return;
      }

      const emailSent = data.email_sent === true;
      signupState.lastSignup = {
        userId: data.user_id,
        email: data.email,
        roleType: data.role_type,
        emailSent,
      };
      signupState.accountDraft = null;
      setPostVerifyTarget('basic', selected);
      navigate(verifyEmailPathForSignupResult(emailSent));
    } catch (err) {
      showRoleError(root, err instanceof Error ? err.message : '네트워크 오류');
      submitBtn.disabled = false;
      submitBtn.textContent = '계정 만들기';
    }
  });
}
