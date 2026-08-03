import { STEPS, REGISTER_PHASES, LEGACY_STEP_REDIRECT, registerState } from './state.js';
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
import { HOME_UI_BASE } from '../../shared/preview-links.js';
import {
  renderSitePromoSidebar,
  bindSitePromoSidebarEvents,
} from '../../shared/promo-sidebar.js';
import { renderSiteFooter } from '../../shared/site-footer.js';
import { bindGuestGateLinks } from '../../shared/guest-gate-ui.js';

const ROUTES = Object.fromEntries(STEPS.map((s) => [s.path, s.key]));

export function navigate(path) {
  window.location.hash = path;
}

export function getCurrentPath() {
  const hash = window.location.hash.slice(1) || '/register/basic';
  const raw = hash.startsWith('/') ? hash : `/${hash}`;
  return raw.split('?')[0];
}

/** @returns {URLSearchParams} */
export function getHashQuery() {
  const hash = window.location.hash.slice(1);
  const q = hash.indexOf('?');
  return new URLSearchParams(q >= 0 ? hash.slice(q + 1) : '');
}

export function isRegisterEditMode() {
  return getHashQuery().get('edit') === '1';
}

export function getCurrentScreen() {
  const path = getCurrentPath();
  const key = path.replace(/^\/register\//, '');
  if (LEGACY_STEP_REDIRECT[key]) {
    navigate(LEGACY_STEP_REDIRECT[key]);
    return 'lesson';
  }
  return ROUTES[path] || 'basic';
}

export function getStepMeta(key) {
  return STEPS.find((s) => s.key === key) || STEPS[0];
}

export function renderPreviewToolbar(activeScreen) {
  if (!SHOW_PREVIEW_TOOLBAR) return '';
  return `
    <div class="preview-toolbar">
      <span class="preview-toolbar__label">우동공과 · 공부방 등록</span>
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
  const { stepKey = 'basic', title = '공부방 등록', subtitle = '' } = options;
  const showPromo = isChromeLoggedIn();
  const header = renderSiteHeader({
    user: getChromeUser(),
    loggedIn: showPromo,
    role: getChromeNavRole(),
    activeGnbId: 'register_room',
  });
  const meta = STEPS.find((s) => s.key === stepKey);
  const showSteps = Boolean(meta && meta.phase);

  return `
    ${renderPreviewToolbar(getCurrentScreen())}
    <div class="site-chrome-shell register-chrome-shell">
      ${header}
      <div class="home-body register-body${showPromo ? ' home-body--with-promo' : ' register-body--no-promo'}">
        <div class="home-main">
          <div class="site-gate-wrap">
            <div class="register-card register-card--wide panel register-flow">
              ${showSteps ? renderStepIndicator(stepKey) : ''}
              <h1 class="auth-heading">${title}</h1>
              ${subtitle ? `<p class="auth-subheading">${subtitle}</p>` : ''}
              ${content}
            </div>
          </div>
        </div>
        ${showPromo ? renderSitePromoSidebar() : ''}
      </div>
      ${renderSiteFooter({ linkMode: 'absolute', homeBase: HOME_UI_BASE })}
    </div>
  `;
}

export function renderStepIndicator(stepKey) {
  const basicDone = Boolean(registerState.basicComplete);
  const visible = basicDone
    ? STEPS.filter((s) => s.phase === 'detail')
    : STEPS.filter((s) => s.phase);
  const current = visible.findIndex((s) => s.key === stepKey);
  const phase = STEPS.find((s) => s.key === stepKey)?.phase || 'detail';
  const phaseMeta = REGISTER_PHASES[phase];
  return `
    <div class="register-phase" aria-label="등록 단계">
      <div class="register-phase__labels">
        ${
          basicDone
            ? ''
            : `<span class="register-phase__tag ${phase === 'basic' ? 'is-active' : 'is-done'}">${REGISTER_PHASES.basic.label}</span>
        <span class="register-phase__arrow">→</span>`
        }
        <span class="register-phase__tag ${phase === 'detail' ? 'is-active' : ''}">${REGISTER_PHASES.detail.label}</span>
      </div>
      <p class="register-phase__hint">${phaseMeta?.hint || ''}</p>
    </div>
    <div class="step-indicator" aria-label="등록 단계 ${Math.max(current, 0) + 1}/${visible.length}">
      ${visible
        .map((s, i) => {
          let cls = 'step-indicator__dot';
          if (i === current) cls += ' is-active';
          else if (i < current) cls += ' is-done';
          return `<span class="${cls}" title="${s.label}"></span>`;
        })
        .join('')}
    </div>
  `;
}

export function renderGuideNotice(message) {
  return `<div class="register-guide" role="note"><span class="register-guide__mark" aria-hidden="true">i</span><p class="register-guide__text">${message}</p></div>`;
}

/** @deprecated use renderGuideNotice */
export function renderTempNotice(message) {
  return renderGuideNotice(message);
}

export function renderSectionTitle(text) {
  return `<h2 class="register-section-title">${text}</h2>`;
}

export function mypageRegistrationsUrl() {
  return `${HOME_UI_BASE}/#/mypage/registrations`;
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
  bindSitePromoSidebarEvents(root, {
    plansHash: `${HOME_UI_BASE}/#/plans/positions`,
  });
  bindGuestGateLinks(root);
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
