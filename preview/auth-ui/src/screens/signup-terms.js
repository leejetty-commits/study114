import { TERMS, signupState, markTermsAgreed } from '../state.js';
import { renderAuthShell, renderBrandHero, renderStepIndicator, bindGlobalEvents, navigate } from '../layout.js';
import { policyUiUrl } from '../../../shared/preview-links.js';
import { AUTH_WELCOME_COPY } from '../../../shared/auth-welcome-copy.js';

const TERM_POLICY_PATH = {
  service: '/policy/terms',
  privacy: '/policy/privacy',
  marketing: '/policy/marketing',
};

export function renderSignupTerms() {
  const checked = signupState.termsChecked || {};
  const allChecked = TERMS.length > 0 && TERMS.every((term) => checked[term.id]);
  const marketing = signupState.marketingConsent;
  const marketingYes = marketing === true ? 'checked' : '';
  const marketingNo = marketing === false ? 'checked' : '';
  const termsItems = TERMS.map(
    (term) => `
      <div class="terms-item">
        <label class="form-check">
          <input
            class="form-check__input terms-check"
            type="checkbox"
            name="${term.id}"
            data-required="${term.required}"
            ${checked[term.id] ? 'checked' : ''}
          />
          <span class="form-check__label">
            ${term.required ? '<strong>[필수]</strong>' : '[선택]'} ${term.label}
          </span>
        </label>
        <button type="button" class="terms-item__view" data-action="view-terms" data-term-id="${term.id}">보기</button>
      </div>
    `,
  ).join('');

  const content = `
    ${renderStepIndicator(1, 5)}
    <div>
      ${renderBrandHero()}
      <h1 class="auth-heading">${AUTH_WELCOME_COPY.gateTitle}</h1>
      <p class="auth-subheading mb-8">${AUTH_WELCOME_COPY.gateSub}</p>
      <p class="auth-section-title mb-4">${AUTH_WELCOME_COPY.termsSection}</p>
      <p class="form-hint mb-6">${AUTH_WELCOME_COPY.termsSub}</p>

      <form data-form="terms">
        <div class="terms-all">
          <label class="form-check">
            <input class="form-check__input" type="checkbox" id="terms-all" data-check-all ${allChecked ? 'checked' : ''} />
            <span class="form-check__label"><strong>전체 동의</strong></span>
          </label>
          <p class="form-check__meta">필수 약관만 한 번에 동의합니다. 마케팅 수신은 아래에서 따로 고릅니다.</p>
        </div>

        <div class="terms-list mb-8">
          ${termsItems}
          <div class="terms-item">
            <div class="form-check">
              <span class="form-check__label">[선택] 마케팅 정보 수신</span>
            </div>
            <button type="button" class="terms-item__view" data-action="view-terms" data-term-id="marketing">보기</button>
          </div>
          <div class="terms-item">
            <label class="form-check">
              <input class="form-check__input" type="radio" name="marketing_consent" value="yes" ${marketingYes} />
              <span class="form-check__label">동의함</span>
            </label>
            <label class="form-check">
              <input class="form-check__input" type="radio" name="marketing_consent" value="no" ${marketingNo} />
              <span class="form-check__label">동의하지 않음</span>
            </label>
          </div>
          <p class="form-hint">동의함 또는 동의하지 않음 중 하나를 골라 주세요. 동의하지 않아도 가입할 수 있습니다.</p>
        </div>

        <button type="submit" class="btn btn--primary btn--block" data-submit-terms disabled>
          다음
        </button>
      </form>

      <p class="text-center mt-6" style="font-size: var(--text-sm); color: var(--gray-500);">
        이미 계정이 있으신가요?
        <a href="#/login" data-nav="/login" style="color: var(--link-color); font-weight: 600;">로그인</a>
      </p>
    </div>
  `;

  return renderAuthShell(content);
}

export function bindSignupTermsEvents(root) {
  bindGlobalEvents(root);

  const form = root.querySelector('[data-form="terms"]');
  const checkAll = root.querySelector('[data-check-all]');
  const termChecks = root.querySelectorAll('.terms-check');
  const marketingRadios = root.querySelectorAll('input[name="marketing_consent"]');
  const submitBtn = root.querySelector('[data-submit-terms]');

  function selectedMarketing() {
    return [...marketingRadios].find((radio) => radio.checked) || null;
  }

  function updateSubmitState() {
    const requiredChecks = [...termChecks].filter((c) => c.dataset.required === 'true');
    const allRequiredChecked = requiredChecks.every((c) => c.checked);
    submitBtn.disabled = !(allRequiredChecked && selectedMarketing());
  }

  checkAll?.addEventListener('change', () => {
    termChecks.forEach((c) => {
      c.checked = checkAll.checked;
    });
    updateSubmitState();
  });

  termChecks.forEach((check) => {
    check.addEventListener('change', () => {
      checkAll.checked = [...termChecks].every((c) => c.checked);
      updateSubmitState();
    });
  });

  marketingRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      updateSubmitState();
    });
  });

  updateSubmitState();

  root.querySelectorAll('[data-action="view-terms"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const termId = btn.getAttribute('data-term-id') || 'service';
      const path = TERM_POLICY_PATH[termId] || '/policy/terms';
      window.open(policyUiUrl(path), '_blank', 'noopener');
    });
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const picked = selectedMarketing();
    if (!picked || submitBtn.disabled) return;
    const next = {};
    termChecks.forEach((check) => {
      next[check.name] = check.checked;
    });
    signupState.termsChecked = next;
    signupState.marketingConsent = picked.value === 'yes';
    markTermsAgreed();
    navigate('/signup/form');
  });
}
