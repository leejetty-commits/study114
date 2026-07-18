import { TERMS, TERMS_TEMP } from '../state.js';
import { renderAuthShell, renderStepIndicator, renderTempNotice, bindGlobalEvents, navigate } from '../layout.js';
import { markTermsAgreed } from '../state.js';
import { policyUiUrl } from '../../../shared/preview-links.js';

const TERM_POLICY_PATH = {
  service: '/policy/terms',
  privacy: '/policy/privacy',
  location: '/policy/platform',
  marketing: '/policy/privacy',
};

export function renderSignupTerms() {
  const termsItems = TERMS.map(
    (term) => `
      <div class="terms-item">
        <label class="form-check">
          <input
            class="form-check__input terms-check"
            type="checkbox"
            name="${term.id}"
            data-required="${term.required}"
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
    ${TERMS_TEMP ? renderTempNotice('약관 항목·필수 여부는 SSOT 2장 §3.2 [임시] — 법무 확정 후 잠금') : ''}
    <div class="panel">
      <h1 class="auth-heading">약관 동의</h1>
      <p class="auth-subheading mb-8">우동공과 서비스 이용을 위해 약관에 동의해 주세요.</p>

      <form data-form="terms">
        <div class="terms-all">
          <label class="form-check">
            <input class="form-check__input" type="checkbox" id="terms-all" data-check-all />
            <span class="form-check__label"><strong>전체 동의</strong></span>
          </label>
          <p class="form-check__meta">선택 항목 포함 전체 동의 · 개별 선택도 가능합니다.</p>
        </div>

        <div class="terms-list mb-8">
          ${termsItems}
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
  const submitBtn = root.querySelector('[data-submit-terms]');

  function updateSubmitState() {
    const requiredChecks = [...termChecks].filter((c) => c.dataset.required === 'true');
    const allRequiredChecked = requiredChecks.every((c) => c.checked);
    submitBtn.disabled = !allRequiredChecked;
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

  root.querySelectorAll('[data-action="view-terms"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const termId = btn.getAttribute('data-term-id') || 'service';
      const path = TERM_POLICY_PATH[termId] || '/policy/terms';
      window.open(policyUiUrl(path), '_blank', 'noopener');
    });
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    markTermsAgreed();
    navigate('/signup/form');
  });
}
