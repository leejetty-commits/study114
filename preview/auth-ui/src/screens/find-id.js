import {
  renderRecoveryStage,
  renderRecoveryLinks,
} from '../recovery-stage.js';
import { bindGlobalEvents } from '../layout.js';
import { findIdApi } from '../find-id-api.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function loginHint(account) {
  const labels = account.provider_labels || [];
  if (labels.length > 0) {
    return `${labels.join(' · ')} 로그인으로 이용하세요.`;
  }
  return '이메일과 비밀번호로 로그인해 주세요.';
}

function renderRequestStep() {
  return `
    <div data-step="request">
      <h1 class="auth-heading">아이디 찾기</h1>
      <p class="auth-subheading recovery-stage__desc">
        가입 시 등록한 이름과 휴대폰 번호로 이메일(ID)을 확인합니다.
      </p>
      <form data-form="find-id">
        <div class="form-group">
          <label class="form-label form-label--required" for="find-id-name">이름</label>
          <input
            class="form-input"
            type="text"
            id="find-id-name"
            name="name"
            placeholder="가입 시 입력한 이름"
            autocomplete="name"
            required
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
            autocomplete="tel"
            inputmode="numeric"
            required
          />
          <p class="form-error" data-form-error hidden role="alert"></p>
        </div>
        <button type="submit" class="btn btn--primary btn--block">아이디 찾기</button>
      </form>
      ${renderRecoveryLinks({ findPassword: true })}
    </div>`;
}

function renderResultStep(accounts) {
  if (!accounts.length) {
    return `
      <div data-step="result">
        <h1 class="auth-heading">아이디 찾기</h1>
        <p class="auth-subheading recovery-stage__desc">
          일치하는 회원을 찾지 못했습니다. 입력 정보를 다시 확인해 주세요.
        </p>
        <button type="button" class="btn btn--secondary btn--block" data-action="re-enter">다시 입력</button>
        ${renderRecoveryLinks({ findPassword: true })}
      </div>`;
  }

  const items = accounts
    .map(
      (a) => `
      <li class="find-id-list__item">
        <p class="find-id-list__email">${esc(a.masked_email)}</p>
        <p class="find-id-list__hint">${esc(loginHint(a))}</p>
      </li>`,
    )
    .join('');

  return `
    <div data-step="result">
      <h1 class="auth-heading">아이디를 확인하세요</h1>
      <p class="auth-subheading recovery-stage__desc">
        보안을 위해 이메일 일부가 마스킹됩니다. 소셜 가입이면 해당 서비스로 로그인해 주세요.
      </p>
      <ul class="find-id-list" role="list">${items}</ul>
      <div class="recovery-actions">
        <a href="#/login" class="btn btn--primary btn--block" data-nav="/login">로그인하기</a>
        <button type="button" class="btn btn--ghost btn--block" data-action="re-enter">다시 찾기</button>
      </div>
      ${renderRecoveryLinks({ signup: false })}
    </div>`;
}

export function renderFindId() {
  return renderRecoveryStage(renderRequestStep());
}

function showStep(root, html) {
  const card = root.querySelector('.recovery-stage__card');
  if (card) card.innerHTML = html;
  bindFindIdEvents(root);
}

export function bindFindIdEvents(root) {
  bindGlobalEvents(root);

  const form = root.querySelector('[data-form="find-id"]');
  const formError = root.querySelector('[data-form-error]');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get('name') ?? '').trim();
    const phone = String(fd.get('phone') ?? '').trim();

    if (!name || !phone) {
      if (formError) {
        formError.hidden = false;
        formError.textContent = '이름과 휴대폰 번호를 입력해 주세요.';
      }
      return;
    }
    if (formError) formError.hidden = true;

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '조회 중…';
    }

    try {
      const data = await findIdApi({ name, phone });
      showStep(root, renderResultStep(data.accounts || []));
    } catch (err) {
      if (formError) {
        formError.hidden = false;
        formError.textContent = err instanceof Error ? err.message : '조회에 실패했습니다.';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '아이디 찾기';
      }
    }
  });

  root.querySelector('[data-action="re-enter"]')?.addEventListener('click', () => {
    showStep(root, renderRequestStep());
  });
}
