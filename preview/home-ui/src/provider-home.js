/**
 * 공급자·학생 홈 — 2모드 탭 + search-find-surface 공용
 */

import { searchUiUrl } from '../../shared/preview-links.js';
import { peekStudyRoomPromo1, studyRoomPromo1Dong } from './study-room-home-seed.js';
import { tutorHomePrimaryLabel } from './tutor-home-seed.js';
import {
  renderCompactFindForm,
  renderFindFilterBar,
  renderFindResultSection,
  tutorStudentRegionLabel,
} from '@search-ui/search-find-surface.js';
import { studentBranch } from '@search-ui/student-saved-region.js';
import { STUDENT_BRANCH_COPY } from './student-reg/student-reg-copy.js';

/** @typedef {'parent'|'study_room'|'tutor'} ProviderHomeRole */
/** @typedef {'study_room'|'tutor'|'student'} ProviderHomeTabId */
/** @typedef {{ id: ProviderHomeTabId, label: string, searchTab: import('@search-ui/state.js').SearchTab, homeSelf?: boolean }} ProviderHomeMode */

/**
 * 학생 홈 — 가입 분기(preferred_lesson_type)별 탭 2개. 첫 탭(분기 서비스 탭)이 기본.
 * @type {Record<'tutor'|'study_room', ProviderHomeMode[]>}
 */
export const PARENT_HOME_MODES = {
  tutor: [
    { id: 'tutor', label: '우리동네 과외쌤', searchTab: 'tutor' },
    { id: 'student', label: '우리동네 학생', searchTab: 'student' },
  ],
  study_room: [
    { id: 'study_room', label: '우리동네 공부방', searchTab: 'room' },
    { id: 'student', label: '우리동네 학생', searchTab: 'student' },
  ],
};

/**
 * @type {Record<'study_room'|'tutor', ProviderHomeMode[]>}
 */
export const PROVIDER_HOME_MODES = {
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

/** @param {ProviderHomeRole} role @returns {ProviderHomeMode[]} */
export function providerHomeModes(role) {
  return role === 'parent' ? PARENT_HOME_MODES[studentBranch()] : PROVIDER_HOME_MODES[role];
}

/** 학생 홈 탭. 분기에 없는 탭(이전 상태·복원 스냅샷)이면 첫 탭. @param {ProviderHomeTabId|null|undefined} tabId */
export function resolveParentHomeTab(tabId) {
  const modes = providerHomeModes('parent');
  return modes.some((m) => m.id === tabId) ? /** @type {ProviderHomeTabId} */ (tabId) : modes[0].id;
}

/**
 * @param {ProviderHomeRole} role
 * @param {ProviderHomeTabId} tabId
 */
export function getProviderHomeMode(role, tabId) {
  const modes = providerHomeModes(role);
  return modes.find((m) => m.id === tabId) || modes[0];
}

/**
 * @param {ProviderHomeRole} role
 * @param {ProviderHomeTabId} activeTabId
 * @param {string} [tabAttr]
 */
export function renderProviderHomeTabs(role, activeTabId, tabAttr = 'data-provider-tab') {
  return `
    <div class="parent-tabs provider-home-tabs" role="tablist">
      ${providerHomeModes(role)
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
 * @param {{ hideHead?: boolean, hideRegionBar?: boolean, hideSearchCrossLink?: boolean, hideSelfNote?: boolean }} [opts]
 */
export function renderProviderHomeBody(role, tabId, findState, opts = {}) {
  const mode = getProviderHomeMode(role, tabId);
  const searchTab = mode.searchTab;
  const homeSelf = mode.homeSelf === true;
  findState.homeSelf = homeSelf;

  const showMap = searchTab === 'room';
  const studentSnap = tabId === 'student' && (role === 'study_room' || role === 'tutor');
  const parentHome = role === 'parent';
  const hideSearchForm =
    parentHome ||
    studentSnap ||
    (homeSelf &&
      ((role === 'tutor' && tabId === 'tutor') || (role === 'study_room' && tabId === 'study_room')));
  const hideHead = opts.hideHead === true;
  const hideSearchCross = opts.hideSearchCrossLink === true;
  const showCross =
    !hideSearchCross && homeSelf && (role === 'tutor' || role === 'study_room');

  return `
    <div class="parent-home-body">
      ${studentSnap ? renderStudentDemandSnapshot(role, findState) : hideHead ? '' : renderProviderHomeHead(role, tabId)}
      ${showCross ? renderSearchCrossLink(role, searchTab) : ''}
      ${renderCompactFindForm(searchTab, findState, {
        showMap,
        variant: 'home',
        role,
        homeSelf,
        hideSearchForm,
        hideRegionBar: opts.hideRegionBar === true,
        hideSelfNote: opts.hideSelfNote !== false && hideHead,
      })}
      ${parentHome ? '' : renderFindFilterBar(searchTab, findState)}
      ${renderFindResultSection(searchTab, findState, role, { surfaceType: 'home' })}
      ${parentHome && searchTab !== 'tutor' ? renderParentFindMoreLink(searchTab) : ''}
    </div>`;
}

/** 학생 홈 탭 하단 — 찾기 페이지로 보내는 링크배지(공부방 홈 학생 탭과 같은 버튼). 검색은 찾기에서만. */
function renderParentFindMoreLink(searchTab) {
  const url = searchUiUrl(searchTab, 'parent');
  const label = STUDENT_BRANCH_COPY.home.findMore[searchTab];
  return `
    <p class="provider-home-search-link" data-parent-find-more="${searchTab}">
      <a href="${url}" class="btn btn--primary btn--sm" data-same-tab-href="${url}">${label}</a>
    </p>`;
}

function escSnap(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

/** 과외쌤 홈 학생 탭이 고른 활동지역(없으면 대표). @param {object} [findState] */
function tutorPrimaryPlace(findState) {
  return (findState ? tutorStudentRegionLabel(findState) : '') || tutorHomePrimaryLabel();
}

function renderStudentDemandSnapshot(role = 'study_room', findState = null) {
  const tutorSnap = role === 'tutor';
  const full = tutorSnap ? '' : peekStudyRoomPromo1();
  const dong = tutorSnap ? tutorPrimaryPlace(findState) : studyRoomPromo1Dong() || full || '우리동네';
  const place = tutorSnap ? dong : full || dong;
  const findUrl = searchUiUrl('student', tutorSnap ? 'tutor' : 'study_room');
  return `
    <header class="parent-home-head student-demand-snap">
      <p class="parent-home-head__desc">우리동네 학생 수요</p>
      <h1 class="parent-home-head__title">${escSnap(dong)} 학생</h1>
      <p class="parent-home-head__desc">${escSnap(place)}에서 지금 공개 중인 학생입니다. 조건을 바꾸려면 학생찾기에서 검색하세요.</p>
      <p class="provider-home-search-link">
        <a href="${findUrl}" class="btn btn--primary btn--sm" data-same-tab-href="${findUrl}">학생찾기에서 더 찾아보기</a>
      </p>
    </header>`;
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
