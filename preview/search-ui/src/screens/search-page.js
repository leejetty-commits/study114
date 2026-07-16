import { PAID_GATE_MESSAGE } from '@home-visibility';
import {
  canShowSearchTab,
  getVisibleSearchTabs,
  defaultSearchTabForRole,
  resolveAllowedTab,
  ROLE_SEARCH_HEADING,
  getSearchTabLabel,
} from '../search-role-access.js';
import {
  getCurrentTab,
  navigateTab,
  previewState,
  VIEWER_ROLE_LABELS,
  syncRoleFromHash,
} from '../state.js';
import { bindGlobalEvents, renderSearchShell } from '../layout.js';
import { renderCompareBar, bindUserActionEvents } from '@home-ui/user-actions-ui.js';
import { bindCompareEvents } from '@home-ui/compare-modal.js';
import { bindDetailDecisionEvents } from '@home-ui/detail-decision/index.js';
import { previewState as homePreviewState } from '@home-ui/state.js';
import {
  canUseCompare,
  resolveSearchViewer,
  isSearchLoggedIn,
} from '../search-handoff.js';
import { bindGuestListPagination } from '@home-ui/list-pagination.js';
import {
  esc,
  resetFindSurface,
  renderCompactFindForm,
  renderFindFilterBar,
  renderFindResultSection,
  bindFindSurfaceEvents,
} from '../search-find-surface.js';

function renderTabButtons(activeTab) {
  const visible = getVisibleSearchTabs(previewState.role);
  if (visible.length <= 1) return '';
  return visible
    .map((id) => {
      const label = getSearchTabLabel(id, previewState.role);
      const cls = ['search-tab', id === activeTab ? 'is-active' : ''].filter(Boolean).join(' ');
      return `<button type="button" class="${cls}" data-tab="${id}">${esc(label)}</button>`;
    })
    .join('');
}

function renderSubscriptionNote(tab) {
  if (tab !== 'student') return '';
  const msg =
    previewState.subscription === 'paid'
      ? '유료 공급자 — 요청문/특이요청은 학생이 paid_only일 때 상세에서만 열람'
      : `무료 공급자 — 메모 접근 시 ${PAID_GATE_MESSAGE}`;
  return `<p class="search-note">${esc(msg)}</p>`;
}

function renderPreviewControls() {
  return `
    <div class="search-preview-controls">
      <label>
        <span>열람 역할</span>
        <select data-preview="role">
          ${Object.entries(VIEWER_ROLE_LABELS)
            .map(
              ([value, label]) =>
                `<option value="${value}" ${previewState.role === value ? 'selected' : ''}>${esc(label)}</option>`,
            )
            .join('')}
        </select>
      </label>
      <label>
        <span>공급자 등록</span>
        <select data-preview="subscription">
          <option value="free" ${previewState.subscription === 'free' ? 'selected' : ''}>무료</option>
          <option value="paid" ${previewState.subscription === 'paid' ? 'selected' : ''}>유료</option>
        </select>
      </label>
    </div>`;
}

function syncHomeSubscription() {
  homePreviewState.providerSubscription = previewState.subscription;
}

function renderSearchForm(tab) {
  const heading = ROLE_SEARCH_HEADING[previewState.role] || '찾기';
  const tabNav = renderTabButtons(tab);

  return `
    ${renderPreviewControls()}
    <header class="search-header search-header--compact">
      <h1 class="auth-heading">${esc(heading)}</h1>
    </header>
    ${tabNav ? `<nav class="search-tabs" aria-label="검색 탭">${tabNav}</nav>` : ''}
    ${renderSubscriptionNote(tab)}
    ${renderCompactFindForm(tab, previewState, { showMap: tab === 'room', role: previewState.role })}
    ${renderFindFilterBar(tab, previewState)}
    ${canUseCompare(tab, previewState.role) ? renderCompareBar() : ''}
    ${renderFindResultSection(tab, previewState, previewState.role)}`;
}

export function renderSearchPage() {
  syncRoleFromHash();
  const rawTab = getCurrentTab();
  const tab = resolveAllowedTab(rawTab, previewState.role);
  if (tab !== rawTab) {
    navigateTab(tab);
    return '';
  }
  return renderSearchShell(renderSearchForm(tab));
}

export function bindSearchPageEvents(root, rerender) {
  bindGlobalEvents(root);
  const viewer = resolveSearchViewer(previewState.role);
  const loggedIn = isSearchLoggedIn() || previewState.role !== 'guest';

  syncHomeSubscription();

  bindUserActionEvents(root, rerender, { sourceRoute: 'search' });
  bindCompareEvents(root, loggedIn);
  bindDetailDecisionEvents(root, {
    onRerender: rerender,
    viewer,
    sourceRoute: 'search',
    getStudentItem: (id) => previewState.searchExposureItems.find((x) => x.id === id),
  });

  bindFindSurfaceEvents(root, rerender, {
    getTab: getCurrentTab,
    getState: () => previewState,
    role: previewState.role,
  });

  bindGuestListPagination(root, rerender);

  root.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextTab = /** @type {import('../state.js').SearchTab} */ (btn.dataset.tab);
      if (!canShowSearchTab(nextTab, previewState.role)) return;
      resetFindSurface(previewState);
      navigateTab(nextTab);
    });
  });

  const roleSelect = root.querySelector('[data-preview="role"]');
  if (roleSelect) {
    roleSelect.addEventListener('change', () => {
      previewState.role = /** @type {import('../state.js').ViewerRole} */ (roleSelect.value);
      resetFindSurface(previewState);
      const tab = resolveAllowedTab(getCurrentTab(), previewState.role);
      if (tab !== getCurrentTab()) {
        navigateTab(tab);
        return;
      }
      rerender();
    });
  }

  const subSelect = root.querySelector('[data-preview="subscription"]');
  if (subSelect) {
    subSelect.addEventListener('change', () => {
      previewState.subscription = /** @type {import('../state.js').ProviderSubscription} */ (subSelect.value);
      syncHomeSubscription();
      rerender();
    });
  }
}
