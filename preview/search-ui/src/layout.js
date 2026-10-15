import { getCurrentTab, previewState } from './state.js';
import { AUTH_UI_BASE, HOME_UI_BASE } from '../../shared/preview-links.js';
import { SHOW_PREVIEW_TOOLBAR } from '../../shared/preview-flags.js';
import { getVisibleSearchTabs, getSearchTabLabel } from './search-role-access.js';
import {
  renderSiteHeader,
  bindSiteChrome,
  syncSiteHeaderOffset,
  ensureSiteHeaderOffsetListeners,
} from '../../shared/site-chrome.js';
import { navRoleFromAuthUser } from '../../shared/site-nav-config.js';
import { getAuthUser, isLoggedIn, logout } from '@home-ui/auth-session.js';
import { renderRightRailSidebar, bindRightRailEvents } from '@home-ui/right-rail.js';
import { renderSiteFooter } from '../../shared/site-footer.js';
import { bindGuestGateLinks } from '../../shared/guest-gate-ui.js';

export function renderPreviewToolbar(activeTab) {
  if (!SHOW_PREVIEW_TOOLBAR) return '';
  const role = previewState.role;
  const roleQs = role ? `?role=${encodeURIComponent(role)}` : '';
  const tabs = getVisibleSearchTabs(role).map((id) => ({
    id,
    path: `/search/${id}${roleQs}`,
    label: getSearchTabLabel(id, role).replace('찾기', ''),
  }));

  return `
    <div class="preview-toolbar">
      <span class="preview-toolbar__label">우동공과 · 검색 UI (13장)</span>
      <div class="preview-toolbar__group">
        ${tabs
          .map((t) => {
            const isActive = t.id === activeTab;
            return `<button type="button" class="preview-toolbar__btn ${isActive ? 'is-active' : ''}" data-nav="${t.path}">${t.label}</button>`;
          })
          .join('')}
        <span class="preview-toolbar__divider"></span>
        <a href="${AUTH_UI_BASE}/#/login" class="preview-toolbar__btn" data-util-href="${AUTH_UI_BASE}/#/login">인증</a>
      </div>
    </div>
  `;
}

function resolveChromeRole() {
  const user = getAuthUser();
  if (user) return navRoleFromAuthUser(user);
  const r = previewState.role;
  if (r === 'parent' || r === 'study_room' || r === 'tutor' || r === 'guest') return r;
  return 'guest';
}

function activeGnbForTab(tab) {
  if (tab === 'tutor') return 'find_tutor';
  if (tab === 'student') return 'student_parent';
  return 'find_room';
}

/** 찾기 우측 레일. 그리는 순간의 resolveChromeRole() 을 쓴다. */
export function renderSearchRightRail() {
  return renderRightRailSidebar('search_right_rail', {
    navRole: resolveChromeRole(),
    homeBase: HOME_UI_BASE,
  });
}

const SEARCH_RAIL_MARKUP_RE = /<aside\b[^>]*\bdata-right-rail-slot="search_right_rail"[^>]*>[\s\S]*?<\/aside>/;

/**
 * 이미 그린 페이지 HTML에서 우측 레일만 지금 세션 역할로 바꾼다.
 * @param {string} pageHtml
 * @returns {{ html: string, swapped: boolean }}
 */
export function swapSearchRailMarkup(pageHtml) {
  const next = renderSearchRightRail().trim();
  if (!SEARCH_RAIL_MARKUP_RE.test(String(pageHtml || ''))) return { html: String(pageHtml || ''), swapped: false };
  return { html: String(pageHtml).replace(SEARCH_RAIL_MARKUP_RE, next), swapped: true };
}

/**
 * 전체 페이지를 못 바꿔도 우측 레일 노드만 지금 역할로 갈아끼운다.
 * @param {ParentNode|null|undefined} root
 * @returns {boolean}
 */
export function replaceSearchRightRail(root) {
  if (!root || typeof root.querySelector !== 'function') return false;
  const current = root.querySelector('[data-right-rail-slot="search_right_rail"]');
  if (!current || typeof current.replaceWith !== 'function') return false;
  const doc = current.ownerDocument;
  if (!doc || typeof doc.createElement !== 'function') return false;
  const tpl = doc.createElement('template');
  tpl.innerHTML = renderSearchRightRail().trim();
  const next = tpl.content && tpl.content.firstElementChild;
  if (!next) return false;
  current.replaceWith(next);
  bindRightRailEvents(next);
  return true;
}

export function renderSearchShell(content) {
  const user = getAuthUser();
  const header = renderSiteHeader({
    user,
    loggedIn: isLoggedIn(),
    role: resolveChromeRole(),
    activeGnbId: activeGnbForTab(getCurrentTab()),
  });

  return `
    ${renderPreviewToolbar(getCurrentTab())}
    <div class="site-chrome-shell search-chrome-shell">
      ${header}
      <div class="home-body search-body home-body--with-promo">
        <div class="home-main search-main">
          ${content}
        </div>
        ${renderSearchRightRail()}
      </div>
      ${renderSiteFooter({ linkMode: 'absolute', homeBase: HOME_UI_BASE })}
    </div>
  `;
}

export function bindGlobalEvents(root) {
  root.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.dataset.nav;
    });
  });

  bindSiteChrome(root, {
    getRole: resolveChromeRole,
    logout: () => logout(),
  });

  bindGuestGateLinks(root);

  bindRightRailEvents(root);

  ensureSiteHeaderOffsetListeners();
  syncSiteHeaderOffset(root);
  requestAnimationFrame(() => syncSiteHeaderOffset(root));
}
