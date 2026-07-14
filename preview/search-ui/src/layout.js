import { getCurrentTab, previewState } from './state.js';
import { AUTH_UI_BASE, homeUiUrl } from '../../shared/preview-links.js';
import { SHOW_PREVIEW_TOOLBAR } from '../../shared/preview-flags.js';
import { getVisibleSearchTabs, getSearchTabLabel } from './search-role-access.js';
import { SEARCH_TABS } from './search-schema.js';

function homeLinkForRole(role) {
  switch (role) {
    case 'parent':
      return homeUiUrl('parent');
    case 'study_room':
      return homeUiUrl('study-room');
    case 'tutor':
      return homeUiUrl('tutor');
    default:
      return homeUiUrl('guest');
  }
}

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
        <a href="${homeLinkForRole(role)}" class="preview-toolbar__btn" target="_blank" rel="noopener">메인 ↗</a>
        <a href="${AUTH_UI_BASE}/#/login" class="preview-toolbar__btn" target="_blank" rel="noopener">인증 ↗</a>
      </div>
    </div>
  `;
}

export function renderSearchShell(content) {
  return `
    ${renderPreviewToolbar(getCurrentTab())}
    <div class="auth-shell search-shell">
      <header class="auth-shell__header">
        <a href="#/search/room" class="auth-shell__logo" data-nav="/search/room" aria-label="우동공과">
          <img class="auth-shell__logo-img" src="/assets/brand/logo-wordmark.png" alt="우동공과" width="120" height="32" />
        </a>
      </header>
      <main class="auth-shell__main">
        <div class="auth-shell__card auth-shell__card--wide search-card">
          ${content}
        </div>
      </main>
      <footer class="auth-shell__footer">© 2026 우동공과 · study114 · 검색 프리뷰</footer>
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
}
