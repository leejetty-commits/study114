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
    { id: 'student', label: '우리동네 학생', searchTab: 'student' },
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
      desc: '',
    },
    tutor: {
      title: '우리동네 과외쌤',
      desc: '',
    },
    student: {
      title: '우리동네 학생',
      desc: '',
    },
  },
  study_room: {
    study_room: {
      title: '우리동네 공부방',
      desc: '',
    },
    student: {
      title: '우리동네 학생',
      desc: '',
    },
  },
  tutor: {
    tutor: {
      title: '우리동네 과외쌤',
      desc: '',
    },
    student: {
      title: '우리동네 학생',
      desc: '',
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
  const desc = copy.desc
    ? `<p class="parent-home-head__desc">${copy.desc}</p>`
    : '';
  return `
    <header class="parent-home-head">
      <h1 class="parent-home-head__title">${copy.title}</h1>
      ${desc}
    </header>`;
}

/**
 * @param {ProviderHomeRole} role
 * @param {import('@search-ui/state.js').SearchTab} searchTab
 * @param {{ inline?: boolean }} [opts]
 */
export function renderSearchCrossLink(role, searchTab, opts = {}) {
  const label =
    role === 'tutor' && searchTab === 'tutor'
      ? '경쟁 과외쌤 찾기'
      : role === 'study_room' && searchTab === 'room'
        ? '경쟁 공부방 찾기'
        : '전체 검색 열기';
  const url = searchUiUrl(searchTab, role);
  const btn = `<a href="${url}" class="btn btn--secondary btn--sm" data-same-tab-href="${url}">${label}</a>`;
  if (opts.inline) return btn;
  return `
    <p class="provider-home-search-link">
      ${btn}
    </p>`;
}

/**
 * @param {ProviderHomeRole} role
 * @param {ProviderHomeTabId} tabId
 * @param {import('@search-ui/search-find-surface.js').FindSurfaceState} findState
 * @param {{ hideHead?: boolean, hideRegionBar?: boolean, hideSearchCrossLink?: boolean, hideSelfNote?: boolean, hideFindLead?: boolean }} [opts]
 */
export function renderProviderHomeBody(role, tabId, findState, opts = {}) {
  const mode = getProviderHomeMode(role, tabId);
  const searchTab = mode.searchTab;
  const homeSelf = mode.homeSelf === true;
  findState.homeSelf = homeSelf;

  const showMap = searchTab === 'room';
  const hideSearchForm = homeSelf && role === 'tutor' && tabId === 'tutor';
  const hideHead = opts.hideHead === true;
  const hideSearchCross = opts.hideSearchCrossLink === true;
  const showCross =
    !hideSearchCross && homeSelf && (role === 'tutor' || role === 'study_room');

  return `
    <div class="parent-home-body">
      ${hideHead ? '' : renderProviderHomeHead(role, tabId)}
      ${showCross ? renderSearchCrossLink(role, searchTab) : ''}
      ${renderCompactFindForm(searchTab, findState, {
        showMap,
        variant: 'home',
        role,
        homeSelf,
        hideSearchForm,
        hideRegionBar: opts.hideRegionBar === true,
        hideSelfNote: opts.hideSelfNote !== false && hideHead,
        hideFindLead: opts.hideFindLead === true,
      })}
      ${renderFindFilterBar(searchTab, findState)}
      ${renderFindResultSection(searchTab, findState, role, { surfaceType: 'home' })}
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
