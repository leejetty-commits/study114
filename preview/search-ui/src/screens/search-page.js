import { PAID_GATE_MESSAGE } from '@home-visibility';
import {
  canShowSearchTab,
  resolveAllowedTab,
  getSearchTabLabel,
} from '../search-role-access.js';
import { SEARCH_TABS } from '../search-schema.js';
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
import { isEmailVerified } from '@home-ui/auth-session.js';
import { bindGuestListPagination } from '@home-ui/list-pagination.js';
import { bindProtectedGuestActions, bindGuestEmptyCardLoginGate, openDeepAccessLoginGate } from '../../../shared/guest-gate-ui.js';
import { redirectToEmailVerifyWait } from '../../../shared/auth-redirect.js';
import { isSafeReturnTo } from '../../../shared/auth-redirect.js';
import { SHOW_PREVIEW_TOOLBAR } from '../../../shared/preview-flags.js';
import { renderSearchMarketingBanner } from '@home-ui/home-marketing-banner.js';
import {
  esc,
  resetFindSurface,
  renderCompactFindForm,
  renderFindFilterBar,
  renderFindResultSection,
  bindFindSurfaceEvents,
  hydrateFindStateFromHash,
  resolveActiveRegionLabel,
  studentCurrentPlace,
  tutorRepresentativeRegionLabel,
  refreshActiveResultItems,
  runFindSearchWithFilters,
  whenFindCitiesReady,
  bootFindGpsIfNeeded,
  bootGuestFindSurface,
} from '../search-find-surface.js';
import { bindSearchMapPinLinks } from '../search-map.js';
import { studentBranch } from '../student-saved-region.js';
import { guardParentFindTab } from '../../../shared/route-access.js';
import { bootStudyRoomHome, bootStudyRoomStudentDemand } from '@home-ui/study-room-home-seed.js';
import { renderBrowseList } from '@home-ui/exposure-render.js';
import { getStudentDemandForRegion } from '../search-region-feed.js';
import { renderListSortSelect } from '../../../shared/list-sort.js';
import {
  placeCaption,
  STUDENT_PLACE_PROMPT,
  readGuestBaseline,
  loadGuestBaseline,
  readGuestAxisCounts,
} from '../../../shared/location-display.js';

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
      ? '유료 공급자 — 유료 전용 요청문과 특이요청은 상세 화면에서만 열람'
      : `무료 공급자 — 메모 접근 시 ${PAID_GATE_MESSAGE}`;
  return `<p class="search-note">${esc(msg)}</p>`;
}

function syncHomeSubscription() {
  homePreviewState.providerSubscription = previewState.subscription;
}

function visibleCurrentPlace(tab, role, regionLabel) {
  if (previewState.searchExecuted && role !== 'guest') return regionLabel || '';
  if (role === 'guest') {
    const base = readGuestBaseline();
    return tab === 'room' ? base.room : base.tutor;
  }
  // 학생: 서버 저장 지역 라벨(또는 직접 고른 위치) 그대로. 동만 잘라 보이지 않는다.
  if (role === 'parent') return regionLabel || STUDENT_PLACE_PROMPT;
  if (tab === 'student' && role === 'study_room') {
    return studentCurrentPlace(regionLabel) || placeCaption(regionLabel, 'room') || '';
  }
  if (tab === 'student' && role === 'tutor') {
    const saved = tutorRepresentativeRegionLabel();
    return placeCaption(saved || regionLabel, 'tutor') || '';
  }
  if (tab === 'student') {
    const axis = previewState.studentHopeType === 'study_room' ? 'room' : 'tutor';
    return placeCaption(regionLabel, axis) || '';
  }
  if (tab === 'room') return placeCaption(regionLabel, 'room') || '';
  return placeCaption(regionLabel, 'tutor') || '';
}

/** 기준 위치와 같은 region-stats 응답의 실수만 넣는다. 실패하면 대시 유지. */
function fillGuestMapStats(root) {
  if (!root.querySelector('[data-guest-axis-count]')) return;
  loadGuestBaseline().then(() => {
    const counts = readGuestAxisCounts();
    if (!counts) return;
    for (const key of ['studyRooms', 'tutors', 'studentRequests']) {
      const el = root.querySelector(`[data-guest-axis-count="${key}"]`);
      if (el) el.textContent = String(counts[key]);
    }
  });
}

function renderSearchForm(tab) {
  const heading = SEARCH_TABS[tab]?.label || getSearchTabLabel(tab, previewState.role);
  // 헤더·지도·리스트가 같은 CanonicalLocation 을 쓰도록 먼저 정규화
  refreshActiveResultItems(tab, previewState, previewState.role);
  const regionLabel = resolveActiveRegionLabel(tab, previewState, previewState.role);
  const locationText = visibleCurrentPlace(tab, previewState.role, regionLabel);
  const locationLine =
    tab === 'room' || tab === 'tutor' || tab === 'student'
      ? `<p class="search-header__location" data-search-current-location aria-live="polite">현재위치 <strong>${esc(locationText)}</strong></p>`
      : '';

  return `
    ${renderSearchMarketingBanner(tab, previewState.role)}
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
    ${renderGuestListSort(tab)}
    ${canUseCompare(tab, previewState.role) ? renderCompareBar() : ''}
    ${renderFindResultSection(tab, previewState, previewState.role, { surfaceType: 'search' })}
    ${renderGuestStudentStrip(tab)}`;
}

/** 비로그인 구경 목록의 정렬. 값을 바꾸면 검색 대신 로그인 팝업. */
function renderGuestListSort(tab) {
  if (isSearchLoggedIn()) return '';
  const kind = tab === 'tutor' ? 'tutor' : tab === 'student' ? 'student' : 'study_room';
  return renderListSortSelect(kind, 'latest', { mode: 'search' });
}

/** 비로그인 구경: 검색 전 지역 피드 아래에 학생 카드를 블라인드 이름으로만 붙인다. */
function renderGuestStudentStrip(tab) {
  if (isSearchLoggedIn()) return '';
  if (tab !== 'room' && tab !== 'tutor') return '';
  const regionLabel = resolveActiveRegionLabel(tab, previewState, 'guest');
  const items = getStudentDemandForRegion(regionLabel, {
    hopeType: tab === 'tutor' ? 'tutor' : 'study_room',
    limit: 6,
  });
  if (!items.length) return '';
  return `
    <section class="content-section search-student-demand" data-surface="student-demand" aria-label="학생">
      ${renderBrowseList('student', items, { guest: true, viewerRole: 'guest', sourceRoute: 'search' })}
    </section>`;
}

/** 로그인했고 이메일 인증까지 끝난 회원만 찾기를 연다. role 쿼리는 보지 않는다. */
function canUseFind() {
  return isSearchLoggedIn() && isEmailVerified();
}

/** 상세 게이트와 같이, 현재 찾기 주소 전체를 return_to 로 넣는다. */
function searchLoginReturnTo() {
  try {
    const hashRaw = (window.location.hash || '').replace(/^#/, '') || '/search/room';
    const hash = hashRaw.startsWith('/') ? hashRaw : `/${hashRaw}`;
    const target = `${window.location.origin}${window.location.pathname}${window.location.search}#${hash}`;
    return isSafeReturnTo(target) ? target : '';
  } catch {
    return '';
  }
}

/**
 * @param {{ sessionReady?: boolean }} [opts]
 * sessionReady 전: 헤더·푸터·레일만.
 * 로그인했지만 이메일 미인증: 인증 대기 화면으로 이동.
 * 비로그인: 검색 폼·결과. 조작은 로그인 팝업.
 */
export function renderSearchPage(opts = {}) {
  syncRoleFromHash();
  if (!opts.sessionReady) return renderSearchShell('');
  if (isSearchLoggedIn() && !isEmailVerified()) {
    redirectToEmailVerifyWait();
    return '';
  }
  if (!isSearchLoggedIn()) previewState.role = 'guest';
  const rawTab = getCurrentTab();
  if (previewState.role === 'parent') {
    const branchGuard = guardParentFindTab(rawTab, studentBranch());
    if (!branchGuard.ok) {
      resetFindSurface(previewState);
      navigateTab(branchGuard.redirectTab);
      return '';
    }
  }
  const tab = resolveAllowedTab(rawTab, previewState.role);
  if (tab !== rawTab) {
    navigateTab(tab);
    return '';
  }
  hydrateFindStateFromHash(previewState, tab);
  return renderSearchShell(renderSearchForm(tab));
}

/**
 * searched=1 복원 재검색 + GPS 부트 (렌더 후 1회).
 * 세션 전·비로그인·미인증이면 검색 API를 호출하지 않는다.
 * @param {() => void} rerender
 * @param {{ allowFindBoot?: boolean }} [opts]
 */
export function afterSearchPageMount(rerender, opts = {}) {
  if (opts.allowFindBoot === false || !canUseFind()) return;
  const tab = getCurrentTab();
  if (previewState.role === 'study_room' && tab === 'room') {
    bootStudyRoomHome(rerender);
  }
  if (previewState.role === 'study_room' && tab === 'student') {
    bootStudyRoomStudentDemand(rerender);
  }
  if (previewState._needsSearchRestore && previewState.lastSearchFilters) {
    const filters = /** @type {Record<string, string|string[]>} */ ({
      ...previewState.lastSearchFilters,
    });
    previewState._needsSearchRestore = false;
    queueMicrotask(() => {
      whenFindCitiesReady().then(() => {
        runFindSearchWithFilters(tab, filters, previewState, previewState.role, rerender);
      });
    });
    return;
  }
  queueMicrotask(() => {
    bootFindGpsIfNeeded(previewState, tab, rerender).catch(() => {});
  });
}

function openFindGuestLogin() {
  openDeepAccessLoginGate({
    from: 'search',
    source: 'search',
    returnTo: searchLoginReturnTo(),
  });
}

/**
 * 비로그인 찾기: 목록 클릭은 기존 상세 가드, 검색·필터·정렬·학생 카드는 로그인 팝업.
 * 검색 API를 부르는 bindFindSurfaceEvents / afterSearchPageMount 는 붙이지 않는다.
 * @param {HTMLElement} root
 * @param {() => void} rerender
 */
function bindGuestFindBrowse(root, rerender) {
  syncHomeSubscription();
  bindUserActionEvents(root, rerender, { sourceRoute: 'search' });
  bindCompareEvents(root, false);
  bindDetailDecisionEvents(root, {
    onRerender: rerender,
    viewer: 'guest',
    sourceRoute: 'search',
    getStudentItem: (id) => previewState.searchExposureItems.find((x) => x.id === id),
  });
  bindProtectedGuestActions(root);
  bindGuestEmptyCardLoginGate(root);
  bootGuestFindSurface(getCurrentTab(), rerender);
  if (getCurrentTab() === 'room') {
    bindSearchMapPinLinks(root, refreshActiveResultItems('room', previewState, 'guest'));
  }
  fillGuestMapStats(root);
  bindGuestListPagination(root, rerender);

  const form = root.querySelector('[data-search-form]');
  if (form) {
    const gate = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openFindGuestLogin();
    };
    form.addEventListener(
      'focusin',
      (e) => {
        const field = e.target instanceof Element ? e.target.closest('input, textarea, select') : null;
        if (!field || !form.contains(field)) return;
        gate(e);
      },
      true,
    );
    form.addEventListener('input', gate, true);
    form.addEventListener('change', gate, true);
    form.addEventListener('submit', gate, true);
    form.addEventListener('reset', gate, true);
    form.addEventListener(
      'click',
      (e) => {
        const btn = e.target instanceof Element ? e.target.closest('button') : null;
        if (!btn || !form.contains(btn)) return;
        if (btn.getAttribute('data-action') === 'toggle-expanded') return;
        gate(e);
      },
      true,
    );
  }

  root.querySelector('[data-action="toggle-expanded"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    previewState.expanded = !previewState.expanded;
    rerender();
  });

  root.addEventListener(
    'click',
    (e) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el) return;
      if (el.closest('[data-action="reset-filters"], [data-action="pick-hope-type"], [data-action="change-region"], [data-tutor-region], [data-action="apply-expanded"]')) {
        e.preventDefault();
        e.stopPropagation();
        openFindGuestLogin();
        return;
      }
      if (el.closest('[data-action="open-student-detail"], [data-student-id]')) {
        e.preventDefault();
        e.stopPropagation();
        openFindGuestLogin();
      }
    },
    true,
  );

  root.addEventListener(
    'change',
    (e) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el?.closest('[data-list-sort], [data-preferred-lesson-type], [data-lesson-format-select]')) return;
      e.preventDefault();
      e.stopPropagation();
      openFindGuestLogin();
    },
    true,
  );

  root.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextTab = /** @type {import('../state.js').SearchTab} */ (btn.dataset.tab);
      if (!canShowSearchTab(nextTab, previewState.role)) return;
      resetFindSurface(previewState);
      navigateTab(nextTab);
    });
  });
}

/**
 * @param {HTMLElement} root
 * @param {() => void} rerender
 * @param {{ allowFindBoot?: boolean }} [opts]
 * allowFindBoot false면 GPS·복원 검색을 돌리지 않는다.
 * 세션 전 게스트 셸은 껍데기만 그리고, 부트는 세션 확정 후 1회만 한다.
 */
export function bindSearchPageEvents(root, rerender, opts = {}) {
  bindGlobalEvents(root);
  if (opts.allowFindBoot !== true) return;
  if (!isSearchLoggedIn()) {
    bindGuestFindBrowse(root, rerender);
    return;
  }
  if (!isEmailVerified()) return;
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

  afterSearchPageMount(rerender, opts);
}
