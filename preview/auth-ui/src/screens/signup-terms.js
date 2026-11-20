import { TERMS, signupState, markTermsAgreed } from '../state.js';
import { renderAuthShell, renderBrandHero, renderStepIndicator, bindGlobalEvents, navigate } from '../layout.js';
import { AUTH_WELCOME_COPY } from '../../../shared/auth-welcome-copy.js';
import { getPolicyPage } from '../../../home-ui/src/policy-copy.js';

const TERM_POLICY_SLUG = {
  service: 'terms',
  privacy: 'privacy',
  marketing: 'marketing',
};

/** @type {HTMLElement | null} */
let openSheet = null;
/** @type {number} */
let lockedScrollY = 0;
/** @type {(() => void) | null} */
let sheetCleanup = null;

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPolicySections(page) {
  return (page.sections || [])
    .map((section) => {
      const body = (section.body || []).map((paragraph) => `<p>${esc(paragraph)}</p>`).join('');
      const bullets = section.bullets?.length
        ? `<ul>${section.bullets.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`
        : '';
      return `
        <section class="terms-sheet__section">
          <h3>${esc(section.title)}</h3>
          ${body}${bullets}
        </section>
      `;
    })
    .join('');
}

function renderPolicyBody(page) {
  if (!page) {
    return '<p class="terms-sheet__missing">약관을 불러오지 못했습니다.</p>';
  }
  return `
    <h2 id="terms-sheet-title" class="terms-sheet__title">${esc(page.title)}</h2>
    ${page.summary ? `<p class="terms-sheet__summary">${esc(page.summary)}</p>` : ''}
    ${renderPolicySections(page)}
    <div class="terms-sheet__end" data-terms-sheet-end></div>
  `;
}

function lockPageScroll() {
  lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  document.documentElement.classList.add('terms-sheet-open');
  document.body.style.top = `-${lockedScrollY}px`;
}

function unlockPageScroll() {
  document.documentElement.classList.remove('terms-sheet-open');
  document.body.style.top = '';
  window.scrollTo(0, lockedScrollY);
}

function closeTermsSheet() {
  sheetCleanup?.();
  sheetCleanup = null;
  openSheet?.remove();
  openSheet = null;
  if (document.documentElement.classList.contains('terms-sheet-open')) {
    unlockPageScroll();
  }
}

/**
 * @param {HTMLElement} root
 * @param {string} termId
 * @param {HTMLElement} opener
 * @param {() => void} updateSubmitState
 */
function openTermsSheet(root, termId, opener, updateSubmitState) {
  closeTermsSheet();
  const slug = TERM_POLICY_SLUG[termId];
  if (!slug) return;
  const page = getPolicyPage(slug);
  const required = termId === 'service' || termId === 'privacy';
  const front = root.querySelector(`.terms-check[name="${CSS.escape(termId)}"]`);
  const agreed = front instanceof HTMLInputElement && front.checked;

  openSheet = document.createElement('div');
  openSheet.className = 'terms-sheet';
  openSheet.setAttribute('data-no-drag', '');
  openSheet.innerHTML = `
    <div class="terms-sheet__backdrop" data-terms-sheet-close></div>
    <div class="terms-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="terms-sheet-title" tabindex="-1" data-no-drag>
      <div class="terms-sheet__body" data-terms-sheet-body>
        ${renderPolicyBody(page)}
      </div>
      <div class="terms-sheet__foot">
        ${
          required
            ? `<label class="form-check terms-sheet__agree">
                <input class="form-check__input" type="checkbox" data-terms-read-agree ${agreed ? 'checked' : ''} disabled />
                <span class="form-check__label">읽었고 동의합니다</span>
              </label>`
            : ''
        }
        <button type="button" class="btn btn--primary btn--block" data-terms-sheet-close>닫기</button>
      </div>
    </div>
  `;
  document.body.appendChild(openSheet);
  lockPageScroll();

  const body = openSheet.querySelector('[data-terms-sheet-body]');
  const agree = openSheet.querySelector('[data-terms-read-agree]');
  const end = openSheet.querySelector('[data-terms-sheet-end]');
  /** @type {IntersectionObserver | null} */
  let observer = null;

  const unlockAgree = () => {
    if (agree instanceof HTMLInputElement) agree.disabled = false;
  };

  if (required && page && body instanceof HTMLElement && end instanceof HTMLElement) {
    const atEnd = () => body.scrollTop + body.clientHeight >= body.scrollHeight - 2;
    const tryUnlock = () => {
      if (atEnd()) unlockAgree();
    };
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) unlockAgree();
      },
      { root: body, threshold: 1 },
    );
    observer.observe(end);
    body.addEventListener('scroll', tryUnlock, { passive: true });
    requestAnimationFrame(tryUnlock);
  }

  if (agree instanceof HTMLInputElement && front instanceof HTMLInputElement) {
    agree.addEventListener('change', () => {
      front.checked = agree.checked;
      updateSubmitState();
    });
  }

  const onKey = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeTermsSheet();
      opener.focus();
    }
  };
  document.addEventListener('keydown', onKey);

  openSheet.querySelectorAll('[data-terms-sheet-close]').forEach((el) => {
    el.addEventListener('click', () => {
      closeTermsSheet();
      opener.focus();
    });
  });

  sheetCleanup = () => {
    observer?.disconnect();
    document.removeEventListener('keydown', onKey);
  };

  const panel = openSheet.querySelector('.terms-sheet__panel');
  if (panel instanceof HTMLElement) panel.focus();
}

window.addEventListener('hashchange', () => {
  closeTermsSheet();
});

export function renderSignupTerms() {
  const checked = signupState.termsChecked || {};
  const marketing = signupState.marketingConsent;
  const marketingYes = marketing === true ? 'checked' : '';
  const marketingNo = marketing === false ? 'checked' : '';
  const termsItems = TERMS.map(
    (term) => `
      <div class="terms-item">
        <div class="form-check form-check--readonly">
          <input
            class="form-check__input terms-check"
            type="checkbox"
            name="${term.id}"
            data-required="${term.required}"
            tabindex="-1"
            aria-disabled="true"
            disabled
            ${checked[term.id] ? 'checked' : ''}
          />
          <span class="form-check__label">
            ${term.required ? '<strong>[필수]</strong>' : '[선택]'} ${term.label}
          </span>
        </div>
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
      <p class="form-hint mb-2">${AUTH_WELCOME_COPY.termsReadHint}</p>
      <p class="form-hint mb-6">${AUTH_WELCOME_COPY.termsSub}</p>

      <form data-form="terms">
        <div class="terms-list mb-8">
          ${termsItems}
          <div class="terms-item terms-item--marketing">
            <div class="terms-item__head">
              <span class="form-check__label">[선택] 마케팅 정보 수신</span>
              <button type="button" class="terms-item__view" data-action="view-terms" data-term-id="marketing">보기</button>
            </div>
            <div class="terms-marketing-choice">
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

  termChecks.forEach((check) => {
    check.addEventListener('click', (event) => {
      event.preventDefault();
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
      const termId = btn.getAttribute('data-term-id') || '';
      if (!(btn instanceof HTMLElement)) return;
      openTermsSheet(root, termId, btn, updateSubmitState);
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
