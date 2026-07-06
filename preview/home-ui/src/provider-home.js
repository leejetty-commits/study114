/**
 * 공급자·학부모 홈 — 2모드 탭 + search-find-surface 공용
 */

import { searchUiUrl } from '../../shared/preview-links.js';
import {
  renderCompactFindForm,
  renderFindFilterBar,
  renderFindResultSection,
} from '@search-ui/search-find-surface.js';

/** @typedef {'parent'|'study_room'|'tutor'} ProviderHomeRole */
/** @typedef {'study_room'|'tutor'|'student'} ProviderHomeTabId */

/**
 * @type {Record<ProviderHomeRole, Array<{ id: ProviderHomeTabId, label: string, searchTab: import('@search-ui/state.js').SearchTab, homeSelf?: boolean }>>}
 */
export const PROVIDER_HOME_MODES = {
  parent: [
    { id: 'study_room', label: '우리동네 공부방', searchTab: 'room' },
    { id: 'tutor', label: '우리동네 과외쌤', searchTab: 'tutor' },
  ],
  study_room: [
    { id: 'study_room', label: '우리동네 공부방', searchTab: 'room', homeSelf: true },
    { id: 'student', label: '우리동네 학생', searchTab: 'student' },
  ],
  tutor: [
    { id: 'tutor', label: '우리동네 과외쌤', searchTab: 'tutor', homeSelf: true },
    { id: 'student', label: '우리동네 학생', searchTab: 'student' },
  ],
};

/** @type {Record<ProviderHomeRole, Record<ProviderHomeTabId, { title: string, desc: string }>>} */
const HOME_HEAD_COPY = {
  parent: {
    study_room: {
      title: '우리동네 공부방',
      desc: '집 근처 공부방을 지도와 목록으로 살펴보고, 마음에 드는 곳을 찜하거나 비교해 보세요.',
    },
    tutor: {
      title: '우리동네 과외쌤',
      desc: '등록해 둔 희망 지역(최대 3)을 탭으로 바꿔가며 과외 선생님을 살펴보세요.',
    },
  },
  study_room: {
    study_room: {
      title: '우리동네 공부방',
      desc: '내 공부방이 학부모에게 어떻게 보이는지 미리 확인하세요. 경쟁 공부방 비교는 검색 메뉴에서 할 수 있습니다.',
    },
    student: {
      title: '우리동네 학생',
      desc: '내 영업 지역의 학습 요청을 살펴보고, 조건에 맞는 학생에게 쪽지를 보내 보세요.',
    },
  },
  tutor: {
    tutor: {
      title: '우리동네 과외쌤',
      desc: '등록한 활동 지역별로 내 노출 상태를 확인하세요. 경쟁 과외쌤 비교는 검색 메뉴에서 할 수 있습니다.',
    },
    student: {
      title: '우리동네 학생',
      desc: '활동 지역의 학습 요청을 살펴보고, 조건에 맞는 학생에게 쪽지를 보내 보세요.',
    },
  },
};

/**
 * @param {ProviderHomeRole} role
 * @param {ProviderHomeTabId} tabId
 */
export function getProviderHomeMode(role, tabId) {
  return PROVIDER_HOME_MODES[role].find((m) => m.id === tabId) || PROVIDER_HOME_MODES[role][0];
}

/**
 * @param {ProviderHomeRole} role
 * @param {ProviderHomeTabId} activeTabId
 * @param {string} [tabAttr]
 */
export function renderProviderHomeTabs(role, activeTabId, tabAttr = 'data-provider-tab') {
  return `
    <div class="parent-tabs provider-home-tabs" role="tablist">
      ${PROVIDER_HOME_MODES[role]
        .map(
          (m) => `
        <button type="button" class="parent-tabs__btn ${m.id === activeTabId ? 'is-active' : ''}" ${tabAttr}="${m.id}" role="tab">${m.label}</button>`,
        )
        .join('')}
    </div>`;
}

/**
 * @param {ProviderHomeRole} role
 * @param {ProviderHomeTabId} tabId
 */
export function renderProviderHomeHead(role, tabId) {
  const copy = HOME_HEAD_COPY[role][tabId];
  return `
    <header class="parent-home-head">
      <h1 class="parent-home-head__title">${copy.title}</h1>
      <p class="parent-home-head__desc">${copy.desc}</p>
    </header>`;
}

/**
 * @param {ProviderHomeRole} role
 * @param {import('@search-ui/state.js').SearchTab} searchTab
 */
export function renderSearchCrossLink(role, searchTab) {
  const label =
    role === 'tutor' && searchTab === 'tutor'
      ? '경쟁 과외쌤 찾기 (검색)'
      : role === 'study_room' && searchTab === 'room'
        ? '경쟁 공부방 찾기 (검색)'
        : '전체 검색 열기';
  const url = searchUiUrl(searchTab, role);
  return `
    <p class="provider-home-search-link">
      <a href="${url}" target="_blank" rel="noopener" class="btn btn--secondary btn--sm">${label} ↗</a>
    </p>`;
}

/**
 * @param {ProviderHomeRole} role
 * @param {ProviderHomeTabId} tabId
 * @param {import('@search-ui/search-find-surface.js').FindSurfaceState} findState
 */
export function renderProviderHomeBody(role, tabId, findState) {
  const mode = getProviderHomeMode(role, tabId);
  const searchTab = mode.searchTab;
  const homeSelf = mode.homeSelf === true;
  findState.homeSelf = homeSelf;

  const showMap = searchTab === 'room';
  const hideSearchForm = homeSelf && role === 'tutor' && tabId === 'tutor';

  return `
    <div class="parent-home-body">
      ${renderProviderHomeHead(role, tabId)}
      ${homeSelf && (role === 'tutor' || role === 'study_room') ? renderSearchCrossLink(role, searchTab) : ''}
      ${renderCompactFindForm(searchTab, findState, {
        showMap,
        variant: 'home',
        role,
        homeSelf,
        hideSearchForm,
      })}
      ${renderFindFilterBar(searchTab, findState)}
      ${renderFindResultSection(searchTab, findState, role)}
    </div>`;
}

export { createFindState, resetFindState } from './find-state.js';

/** @param {'parent'|'study_room'|'tutor'} role @param {ProviderHomeTabId} tabId */
export function isProviderHomeSelfTab(role, tabId) {
  const mode = getProviderHomeMode(role, tabId);
  return mode.homeSelf === true;
}

/**
 * @param {HTMLElement} root
 * @param {() => void} rerender
 * @param {{ role: ProviderHomeRole, getTab: () => ProviderHomeTabId, setTab: (tab: ProviderHomeTabId) => void, resetFind: () => void, tabAttr?: string }} ctx
 */
export function bindProviderHomeTabEvents(root, rerender, ctx) {
  const tabAttr = ctx.tabAttr || 'data-provider-tab';
  root.querySelectorAll(`[${tabAttr}]`).forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute(tabAttr);
      if (!tabId || ctx.getTab() === tabId) return;
      ctx.setTab(/** @type {ProviderHomeTabId} */ (tabId));
      ctx.resetFind();
      rerender();
    });
  });
}
