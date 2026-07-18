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
import {
  renderSitePromoSidebar,
  bindSitePromoSidebarEvents,
} from '../../shared/promo-sidebar.js';
import { renderRightRailSidebar } from '@home-ui/right-rail.js';
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
        ${renderRightRailSidebar('search_right_rail')}
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

  bindSitePromoSidebarEvents(root, {
    plansHash: `${HOME_UI_BASE}/#/plans/positions`,
  });

  bindGuestGateLinks(root);

  ensureSiteHeaderOffsetListeners();
  syncSiteHeaderOffset(root);
  requestAnimationFrame(() => syncSiteHeaderOffset(root));
}
