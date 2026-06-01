import { STEPS, REGISTER_PHASES } from './state.js';

const ROUTES = Object.fromEntries(STEPS.map((s) => [s.path, s.key]));

const STEP_LABELS = Object.fromEntries(STEPS.map((s) => [s.key, s.label]));

/** @param {string} path */
export function navigate(path) {
  window.location.hash = path;
}

/** @returns {string} */
export function getCurrentPath() {
  const hash = window.location.hash.slice(1) || '/register/basic';
  return hash.startsWith('/') ? hash : `/${hash}`;
}

/** @returns {string} */
export function getCurrentScreen() {
  return ROUTES[getCurrentPath()] || 'basic';
}

export function getStepMeta(key) {
  return STEPS.find((s) => s.key === key) || STEPS[0];
}

export function renderPreviewToolbar(activeScreen) {
  return `
    <div class="preview-toolbar">
      <span class="preview-toolbar__label">우동공과 · 공부방 등록 UI (5장)</span>
      <div class="preview-toolbar__group">
        ${STEPS.filter((s) => s.key !== 'complete')
          .map((s) => {
            const isActive = s.key === activeScreen;
            return `<button type="button" class="preview-toolbar__btn ${isActive ? 'is-active' : ''}" data-nav="${s.path}">${s.label}</button>`;
          })
          .join('')}
        <span class="preview-toolbar__divider"></span>
        <button type="button" class="preview-toolbar__btn ${activeScreen === 'complete' ? 'is-active' : ''}" data-nav="/register/complete">완료</button>
        <a href="http://localhost:5174/#/study-room" class="preview-toolbar__btn" target="_blank" rel="noopener">메인 프리뷰 ↗</a>
      </div>
    </div>
  `;
}

export function renderRegisterShell(content, options = {}) {
  const { step = 1, title = '공부방 등록', subtitle = '' } = options;

  return `
    ${renderPreviewToolbar(getCurrentScreen())}
    <div class="auth-shell">
      <header class="auth-shell__header">
        <a href="#/register/basic" class="auth-shell__logo" data-nav="/register/basic" aria-label="우동공과">
          <img class="auth-shell__logo-img" src="/assets/brand/logo-wordmark.png" alt="우동공과" width="120" height="32" />
        </a>
      </header>
      <main class="auth-shell__main">
        <div class="auth-shell__card auth-shell__card--wide register-card">
          ${step <= 5 ? renderStepIndicator(step) : ''}
          <h1 class="auth-heading">${title}</h1>
          ${subtitle ? `<p class="auth-subheading mb-6">${subtitle}</p>` : ''}
          ${content}
        </div>
      </main>
      <footer class="auth-shell__footer">© 2026 우동공과 · study114 · 공부방 등록 프리뷰</footer>
    </div>
  `;
}

export function renderStepIndicator(currentStep) {
  const steps = [1, 2, 3, 4, 5];
  const phase =
    currentStep <= 2 ? 'basic' : 'detail';
  const phaseMeta = REGISTER_PHASES[phase];
  return `
    <div class="register-phase" aria-label="등록 단계">
      <div class="register-phase__labels">
        <span class="register-phase__tag ${phase === 'basic' ? 'is-active' : currentStep > 2 ? 'is-done' : ''}">${REGISTER_PHASES.basic.label}</span>
        <span class="register-phase__arrow">→</span>
        <span class="register-phase__tag ${phase === 'detail' ? 'is-active' : ''}">${REGISTER_PHASES.detail.label}</span>
      </div>
      <p class="register-phase__hint">${phaseMeta.hint}</p>
    </div>
    <div class="step-indicator" aria-label="등록 단계 ${currentStep}/5">
      ${steps
        .map((n) => {
          let cls = 'step-indicator__dot';
          if (n === currentStep) cls += ' is-active';
          else if (n < currentStep) cls += ' is-done';
          if (n === 2) cls += ' step-indicator__dot--phase-end';
          return `<span class="${cls}" title="${n <= 2 ? REGISTER_PHASES.basic.label : REGISTER_PHASES.detail.label}"></span>`;
        })
        .join('')}
    </div>
  `;
}

export function renderTempNotice(message) {
  return `
    <div class="temp-notice" role="note">
      <span class="temp-notice__badge">임시</span>
      <span class="temp-notice__text">${message}</span>
    </div>
  `;
}

export function renderSectionTitle(text) {
  return `<h2 class="register-section-title">${text}</h2>`;
}

export function bindGlobalEvents(root) {
  root.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.dataset.nav);
    });
  });
}

export function bindFormNav(root, prevPath, nextPath) {
  const prev = root.querySelector('[data-action="prev"]');
  const next = root.querySelector('[data-action="next"]');
  if (prev && prevPath) {
    prev.addEventListener('click', () => navigate(prevPath));
  }
  if (next && nextPath) {
    next.addEventListener('click', () => navigate(nextPath));
  }
}

export function renderNavButtons(prevPath, nextLabel = '다음') {
  return `
    <div class="register-nav">
      ${prevPath ? `<button type="button" class="btn btn--secondary" data-action="prev">이전</button>` : '<span></span>'}
      <button type="button" class="btn btn--primary" data-action="next">${nextLabel}</button>
    </div>
  `;
}
