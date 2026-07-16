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
  if (!SHOW_PREVIEW_TOOLBAR) return '';
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
        <button type="button" class="preview-toolbar__btn" data-action="dev-login" title="room-owner1@dev.local">Dev 로그인</button>
        <span class="preview-toolbar__divider"></span>
        <button type="button" class="preview-toolbar__btn ${activeScreen === 'complete' ? 'is-active' : ''}" data-nav="/register/complete">완료</button>
      </div>
    </div>
  `;
}

export function renderRegisterShell(content, options = {}) {
  const { step = 1, title = '공부방 등록', subtitle = '' } = options;
  const header = renderSiteHeader({
    user: getChromeUser(),
    loggedIn: isChromeLoggedIn(),
    role: getChromeNavRole(),
    activeGnbId: 'register_room',
  });

  return `
    ${renderPreviewToolbar(getCurrentScreen())}
    <div class="site-chrome-shell register-chrome-shell">
      ${header}
      <div class="home-body register-body register-body--no-promo">
        <div class="home-main">
          <div class="site-gate-wrap">
            <div class="register-card panel">
              ${step <= 5 ? renderStepIndicator(step) : ''}
              <h1 class="auth-heading">${title}</h1>
              ${subtitle ? `<p class="auth-subheading mb-6">${subtitle}</p>` : ''}
              ${content}
            </div>
          </div>
        </div>
      </div>
      <footer class="home-footer">
        <p>© 2026 우동공과 · study114</p>
      </footer>
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
      const user = await devLogin();
      await initChromeSession();
      alert(`로그인: ${user.email} (${user.role_type})`);
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : '로그인 실패');
    }
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
