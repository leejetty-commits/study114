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
import { HOME_UI_BASE, homeUiUrl } from '../../shared/preview-links.js';
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
  const edit = getHashQuery().get('edit');
  return edit === '1' || edit === 'basic' || edit === 'location';
}

/** 해시 경로에 현재 room_id 쿼리를 붙인다. */
export function withRoomId(path) {
  const roomId =
    getHashQuery().get('room_id') ||
    (registerState.study_room_id ? String(registerState.study_room_id) : '') ||
    sessionStorage.getItem('study114_study_room_id') ||
    '';
  if (!roomId) return path;
  const qIndex = path.indexOf('?');
  const base = qIndex >= 0 ? path.slice(0, qIndex) : path;
  const q = new URLSearchParams(qIndex >= 0 ? path.slice(qIndex + 1) : '');
  if (!q.has('room_id')) q.set('room_id', roomId);
  return `${base}?${q}`;
}

/** 기본정보 현황 해시. room_id 쿼리는 유지한다. */
export function basicOverviewPath() {
  return withRoomId('/register/basic');
}

export function getCurrentScreen() {
  const path = getCurrentPath();
  const key = path.replace(/^\/register\//, '');
  if (LEGACY_STEP_REDIRECT[key]) {
    navigate(withRoomId(LEGACY_STEP_REDIRECT[key]));
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
  const { stepKey = 'basic', title = '공부방 등록', subtitle = '', headingActions = '' } = options;
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
              ${
                headingActions
                  ? `<div class="register-heading-row">
              <h1 class="auth-heading">${title}</h1>
              <div class="register-heading-row__actions">${headingActions}</div>
            </div>`
                  : `<h1 class="auth-heading">${title}</h1>`
              }
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
  const onBasicOverview = stepKey === 'basic';
  const basicDone = Boolean(registerState.basicComplete) && !onBasicOverview;
  const visible = basicDone
    ? STEPS.filter((s) => s.phase === 'detail')
    : onBasicOverview
      ? STEPS.filter((s) => s.key === 'basic')
      : STEPS.filter((s) => s.phase);
  const current = visible.findIndex((s) => s.key === stepKey);
  const phase = onBasicOverview ? 'basic' : STEPS.find((s) => s.key === stepKey)?.phase || 'detail';
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
        <p class="register-phase__hint">${phaseMeta?.hint || ''}</p>
      </div>
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
  return `<h2 class="register-section-title register-section-title--bar">${text}</h2>`;
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

/**
 * 상세정보 단계 — 저장 / 이전 / 다음
 * @param {{ prevPath: string, nextLabel: string, nextEnabled?: boolean }} opts
 */
export function renderDetailStepNav(opts) {
  const nextEnabled = opts.nextEnabled !== false;
  return `
    <div class="register-nav register-nav--detail">
      <div class="register-nav__start">
        <button type="button" class="btn btn--secondary" data-action="prev">이전</button>
        <button type="button" class="btn btn--secondary" data-action="save">저장</button>
      </div>
      <button type="button" class="btn btn--primary" data-action="next" ${nextEnabled ? '' : 'disabled'}>${opts.nextLabel}</button>
    </div>
  `;
}

/** @param {'home'|'basic'|'lesson'|'facility'} activeKey */
export function renderRegisterWorkTabs(activeKey) {
  const tabs = [
    { key: 'home', label: '홈', href: homeUiUrl('study-room') },
    { key: 'basic', label: '기본정보', path: '/register/basic' },
    { key: 'lesson', label: '상세정보1단계', path: '/register/lesson' },
    { key: 'facility', label: '상세정보2단계', path: '/register/facility' },
  ];
  return `
    <nav class="register-work-tabs" aria-label="등록 단계 이동">
      ${tabs
        .map((tab) => {
          const active = tab.key === activeKey ? ' is-active' : '';
          if (tab.href) {
            return `<a class="register-work-tabs__tab${active}" href="${tab.href}">${tab.label}</a>`;
          }
          return `<button type="button" class="register-work-tabs__tab${active}" data-nav="${withRoomId(tab.path)}">${tab.label}</button>`;
        })
        .join('')}
    </nav>
  `;
}

export const MESSAGE_INQUIRY_PAGE_TITLE = '쪽지와 문의';

/** @param {number|string|null|undefined} roomId */
export function messageInquiryPageUrl(roomId) {
  const id = Number(roomId);
  if (!id) return '';
  return `${HOME_UI_BASE}/#/mypage/registrations/study-rooms/${id}/exposure`;
}

export function renderMessageInquiryNotice() {
  return `
    <aside class="register-message-notice" role="note">
      <p class="register-message-notice__strong">사용자간의 연락은 쪽지로만 가능합니다. 쪽지 가능 여부를 꼭 설정해 주세요.</p>
      <p class="register-message-notice__where">설정 위치: 마이페이지 → 공부방 운영홈 → <strong>${MESSAGE_INQUIRY_PAGE_TITLE}</strong></p>
    </aside>
  `;
}

/** @param {number|string|null|undefined} roomId @returns {boolean} 이동했으면 true */
export function offerGoToMessageInquiry(roomId) {
  const url = messageInquiryPageUrl(roomId);
  if (!url) return false;
  const go = window.confirm(
    '사용자간의 연락은 쪽지로만 가능합니다. 쪽지 가능 여부를 꼭 설정해 주세요.\n\n지금 「쪽지와 문의」로 이동할까요?\n(마이페이지 → 공부방 운영홈 → 쪽지와 문의)',
  );
  if (!go) return false;
  window.location.assign(url);
  return true;
}

export function renderPublishStatusBlock(status, opts = {}) {
  const v = String(status || 'draft');
  const lead =
    opts.lead ||
    '항목을 채운 뒤, 학부모 검색에 이 공부방을 공개할지 여기서 정합니다. 저장만 하면 검색·목록에 나오지 않습니다.';
  return `
    <section class="register-publish-block" data-publish-block>
      <h3 class="register-publish-block__title">공개 상태</h3>
      <p class="register-publish-block__lead">${lead}</p>
      <div class="form-group">
        <label class="form-label" for="${opts.inputId || 'profile_status'}">지금 상태를 고르세요</label>
        <select class="form-input" id="${opts.inputId || 'profile_status'}" name="profile_status">
          <option value="draft" ${v === 'draft' || v === 'pending' ? 'selected' : ''}>저장만 (아직 비공개)</option>
          <option value="published" ${v === 'published' ? 'selected' : ''}>공개</option>
        </select>
      </div>
      ${opts.extraHtml || ''}
    </section>
  `;
}

/** 상세정보 건너뜀 — DB에 저장된 값 요약 화면으로 */
export function skipToSummary() {
  registerState.completeNeedsHydrate = true;
  navigate(withRoomId('/register/complete'));
}
