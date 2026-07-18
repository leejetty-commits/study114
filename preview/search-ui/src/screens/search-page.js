import { PAID_GATE_MESSAGE } from '@home-visibility';
import {
  canShowSearchTab,
  resolveAllowedTab,
  getSearchTabLabel,
} from '../search-role-access.js';
import { MOCK_REGIONS, SEARCH_TABS } from '../search-schema.js';
import {
  getCurrentTab,
  navigateTab,
  previewState,
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
import { bindProtectedGuestActions } from '../../../shared/guest-gate-ui.js';
import { SHOW_PREVIEW_TOOLBAR } from '../../../shared/preview-flags.js';
import {
  esc,
  resetFindSurface,
  renderCompactFindForm,
  renderFindFilterBar,
  renderFindResultSection,
  bindFindSurfaceEvents,
} from '../search-find-surface.js';

/**
 * 찾기 페이지 바디 탭·역할 셀렉트 제거 — 이동은 GNB만.
 * DEV 전용 역할/구독 토글은 프리뷰 툴바와 동일 플래그로만 노출.
 */
function renderDevPreviewControls() {
  if (!SHOW_PREVIEW_TOOLBAR || isSearchLoggedIn()) return '';
  return `
    <div class="search-preview-controls search-preview-controls--dev" hidden data-dev-only>
      <p class="search-note">개발용 — 운영 빌드 비노출</p>
    </div>`;
}

function renderSubscriptionNote(tab) {
  if (tab !== 'student') return '';
  if (previewState.role !== 'study_room' && previewState.role !== 'tutor') return '';
  const msg =
    previewState.subscription === 'paid'
      ? '유료 공급자 — 요청문/특이요청은 학생이 paid_only일 때 상세에서만 열람'
      : `무료 공급자 — 메모 접근 시 ${PAID_GATE_MESSAGE}`;
  return `<p class="search-note">${esc(msg)}</p>`;
}

function syncHomeSubscription() {
  homePreviewState.providerSubscription = previewState.subscription;
}

function renderSearchForm(tab) {
  const heading = SEARCH_TABS[tab]?.label || getSearchTabLabel(tab, previewState.role);
  const regionLabel =
    previewState.activeRegionLabel ||
    (tab === 'room'
      ? MOCK_REGIONS.room
      : tab === 'tutor'
        ? MOCK_REGIONS.tutor
        : MOCK_REGIONS.student);
  const locationLine =
    tab === 'room' || tab === 'tutor' || tab === 'student'
      ? `<p class="search-header__location" data-search-current-location aria-live="polite">현재위치 <strong>${esc(regionLabel)}</strong></p>`
      : '';

  return `
    ${renderDevPreviewControls()}
    <header class="search-header search-header--compact">
      <div class="search-header__title-row">
        <h1 class="auth-heading">${esc(heading)}</h1>
        ${locationLine}
      </div>
    </header>
    ${renderSubscriptionNote(tab)}
    ${renderCompactFindForm(tab, previewState, {
      showMap: tab === 'room',
      role: previewState.role,
      hideRegionBar: true,
    })}
    ${renderFindFilterBar(tab, previewState)}
    ${canUseCompare(tab, previewState.role) ? renderCompareBar() : ''}
    ${renderFindResultSection(tab, previewState, previewState.role, { surfaceType: 'search' })}`;
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
  const sessionLoggedIn = isSearchLoggedIn();
  const loggedIn = sessionLoggedIn;

  syncHomeSubscription();

  bindUserActionEvents(root, rerender, { sourceRoute: 'search' });
  bindCompareEvents(root, loggedIn);
  bindDetailDecisionEvents(root, {
    onRerender: rerender,
    viewer: sessionLoggedIn ? viewer : 'guest',
    sourceRoute: 'search',
    getStudentItem: (id) => previewState.searchExposureItems.find((x) => x.id === id),
  });

  if (!sessionLoggedIn) {
    bindProtectedGuestActions(root);
  }

  bindFindSurfaceEvents(root, rerender, {
    getTab: getCurrentTab,
    getState: () => previewState,
    role: previewState.role,
  });

  bindGuestListPagination(root, rerender);

  // 바디 내 탭 이동은 제거 — GNB만 사용. 잔존 data-tab 방어.
  root.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextTab = /** @type {import('../state.js').SearchTab} */ (btn.dataset.tab);
      if (!canShowSearchTab(nextTab, previewState.role)) return;
      resetFindSurface(previewState);
      navigateTab(nextTab);
    });
  });
}
