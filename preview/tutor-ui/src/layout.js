import { STEPS, REGISTER_PHASES } from './state.js';
import { SHOW_PREVIEW_TOOLBAR } from '../../shared/preview-flags.js';
import {
  renderSiteHeader,
  bindSiteChrome,
  syncSiteHeaderOffset,
  ensureSiteHeaderOffsetListeners,
} from '../../shared/site-chrome.js';
import {
  getChromeUser,
  isChromeLoggedIn,
  getChromeNavRole,
  chromeLogout,
  initChromeSession,
} from '../../shared/chrome-session.js';

const ROUTES = Object.fromEntries(STEPS.map((s) => [s.path, s.key]));

export function navigate(path) {
  window.location.hash = path;
}

export function getCurrentPath() {
  const hash = window.location.hash.slice(1) || '/register/basic';
  return hash.startsWith('/') ? hash : `/${hash}`;
}

export function getCurrentScreen() {
  return ROUTES[getCurrentPath()] || 'basic';
}

export function renderPreviewToolbar(activeScreen) {
  if (!SHOW_PREVIEW_TOOLBAR) return '';
  return `
    <div class="preview-toolbar">
      <span class="preview-toolbar__label">우동공과 · 과외쌤 등록 UI (8장)</span>
      <div class="preview-toolbar__group">
        ${STEPS.filter((s) => s.key !== 'complete')
          .map((s) => {
            const isActive = s.key === activeScreen;
            return `<button type="button" class="preview-toolbar__btn ${isActive ? 'is-active' : ''}" data-nav="${s.path}">${s.label}</button>`;
          })
          .join('')}
        <span class="preview-toolbar__divider"></span>
        <button type="button" class="preview-toolbar__btn" data-action="dev-login" title="tutor-owner1@dev.local">Dev 로그인</button>
        <span class="preview-toolbar__divider"></span>
        <button type="button" class="preview-toolbar__btn ${activeScreen === 'complete' ? 'is-active' : ''}" data-nav="/register/complete">완료</button>
      </div>
    </div>
  `;
}

export function renderRegisterShell(content, options = {}) {
  const { step = 1, title = '과외쌤 등록', subtitle = '' } = options;
  const header = renderSiteHeader({
    user: getChromeUser(),
    loggedIn: isChromeLoggedIn(),
    role: getChromeNavRole(),
    activeGnbId: 'register_tutor',
  });
  return `
    ${renderPreviewToolbar(getCurrentScreen())}
    <div class="site-chrome-shell register-chrome-shell">
      ${header}
      <main class="auth-shell__main">
        <div class="auth-shell__card auth-shell__card--wide register-card">
          ${step <= 5 ? renderStepIndicator(step) : ''}
          <h1 class="auth-heading">${title}</h1>
          ${subtitle ? `<p class="auth-subheading mb-6">${subtitle}</p>` : ''}
          ${content}
        </div>
      </main>
      <footer class="auth-shell__footer">© 2026 우동공과 · study114 · 과외쌤 등록</footer>
    </div>
  `;
}

export function renderStepIndicator(currentStep) {
  const steps = [1, 2, 3, 4, 5];
  const phase = currentStep <= 2 ? 'basic' : 'detail';
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
          return `<span class="${cls}"></span>`;
        })
        .join('')}
    </div>
  `;
}

export function renderTempNotice(message) {
  return `<div class="temp-notice" role="note"><span class="temp-notice__badge">임시</span><span class="temp-notice__text">${message}</span></div>`;
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

  bindSiteChrome(root, {
    getRole: getChromeNavRole,
    logout: () => chromeLogout(),
  });
  ensureSiteHeaderOffsetListeners();
  syncSiteHeaderOffset(root);
  requestAnimationFrame(() => syncSiteHeaderOffset(root));

  root.querySelector('[data-action="dev-login"]')?.addEventListener('click', async () => {
    try {
      const { devLogin } = await import('./register-api.js');
      const user = await devLogin('tutor-owner1@dev.local', 'password');
      await initChromeSession();
      alert(`로그인: ${user.email} (${user.role_type})`);
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : '로그인 실패');
    }
  });
}

export function renderNavButtons(prevPath, nextLabel = '다음') {
  return `
    <div class="register-nav">
      ${prevPath ? `<button type="button" class="btn btn--secondary" data-action="prev">이전</button>` : '<span></span>'}
      <button type="button" class="btn btn--primary" data-action="next">${nextLabel}</button>
    </div>
  `;
}
