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

const ROUTES = Object.fromEntries([
  ...STEPS.map((s) => [s.path, s.key]),
  ['/register/detail', 'detail'],
]);

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

/** 마이페이지 등에서 기본정보 수정을 위해 진입했는지 */
export function isRegisterEditMode() {
  return getHashQuery().get('edit') === '1';
}

export function getCurrentScreen() {
  const path = getCurrentPath();
  const key = path.replace(/^\/register\//, '');
  if (LEGACY_STEP_REDIRECT[key]) {
    const dest = LEGACY_STEP_REDIRECT[key];
    navigate(dest);
    return ROUTES[dest] || 'basic';
  }
  return ROUTES[path] || 'basic';
}

export function renderPreviewToolbar(activeScreen) {
  if (!SHOW_PREVIEW_TOOLBAR) return '';
  return `
    <div class="preview-toolbar">
      <span class="preview-toolbar__label">우동공과 · 과외쌤 등록</span>
      <div class="preview-toolbar__group">
        ${STEPS.filter((s) => s.key !== 'complete' && s.key !== 'regions')
          .map((s) => {
            const isActive = s.key === activeScreen || (activeScreen === 'regions' && s.key === 'basic');
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
  const { stepKey = 'basic', title = '과외쌤 등록', subtitle = '' } = options;
  const showPromo = isChromeLoggedIn();
  const header = renderSiteHeader({
    user: getChromeUser(),
    loggedIn: showPromo,
    role: getChromeNavRole(),
    activeGnbId: 'register_tutor',
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
    : STEPS.filter((s) => s.phase && s.key !== 'regions');
  const normalizedKey = stepKey === 'regions' ? 'basic' : stepKey;
  const current = visible.findIndex((s) => s.key === normalizedKey);
  const phase = STEPS.find((s) => s.key === normalizedKey)?.phase || 'detail';
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

/** 안내 문구 (구 '임시' 배너 대체) */
export function renderGuideNotice(message) {
  return `<div class="register-guide" role="note"><span class="register-guide__mark" aria-hidden="true">i</span><p class="register-guide__text">${message}</p></div>`;
}

export function renderSectionTitle(text) {
  return `<h2 class="register-section-title">${text}</h2>`;
}

export function mypageRegistrationsUrl() {
  return `${HOME_UI_BASE}/#/mypage/registrations`;
}

export function mypageSubmissionBoardUrl() {
  return `${HOME_UI_BASE}/#/mypage/submission-board`;
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
      const user = await devLogin('tutor-owner1@dev.local', 'password');
      await initChromeSession();
      alert(`로그인: ${user.email} (${user.role_type})`);
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : '로그인 실패');
    }
  });
}

/**
 * @param {string|null} prevPath
 * @param {string} nextLabel
 * @param {{ showSkip?: boolean, skipLabel?: string }} [opts]
 */
export function renderNavButtons(prevPath, nextLabel = '다음', opts = {}) {
  const showSkip = opts.showSkip !== false;
  const skipLabel = opts.skipLabel || '나중에 하기';
  return `
    <div class="register-nav">
      <div class="register-nav__start">
        ${prevPath ? `<button type="button" class="btn btn--secondary" data-action="prev">이전</button>` : ''}
        ${showSkip ? `<button type="button" class="btn btn--ghost" data-action="skip-detail">${skipLabel}</button>` : ''}
      </div>
      <button type="button" class="btn btn--primary" data-action="next">${nextLabel}</button>
    </div>
  `;
}

/** 상세등록 나중에 — 기본등록만으로도 가입·이용 가능 */
export function skipDetailRegistration() {
  const ok = window.confirm(
    '상세등록을 나중에 할까요?\n기본등록만으로도 가입은 완료된 상태입니다. 마이페이지에서 언제든 이어서 작성할 수 있습니다.',
  );
  if (!ok) return;
  window.location.assign(mypageRegistrationsUrl());
}
