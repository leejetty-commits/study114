/**

 * 13장 · 9장 — 로그인 역할별 검색 탭 노출 (백화점식 ✕)

 *

 * 공급자 2모드:

 * - 공부방: 공부방찾기(내 노출) + 학생찾기

 * - 과외쌤: 과외쌤찾기(경쟁 확인 · 등록 3지역 탭) + 학생찾기

 */



import { SEARCH_TABS } from './search-schema.js';



/** @typedef {import('./state.js').SearchTab} SearchTab */

/** @typedef {import('./state.js').ViewerRole} ViewerRole */



/** @type {Record<ViewerRole, SearchTab[]>} */

export const ROLE_SEARCH_TABS = {

  guest: ['room', 'tutor'],

  parent: ['room', 'tutor'],

  study_room: ['room', 'student'],

  tutor: ['tutor', 'student'],

};



/** @type {Record<ViewerRole, string>} */

export const ROLE_SEARCH_HEADING = {

  guest: '공부방·과외 찾기',

  parent: '공부방·과외 찾기',

  study_room: '공부방 · 학생찾기',

  tutor: '과외쌤 · 학생찾기',

};



/** @type {Partial<Record<ViewerRole, Partial<Record<SearchTab, string>>>>} */

export const ROLE_SEARCH_TAB_LABELS = {

  study_room: {

    room: '공부방찾기',

    student: '학생찾기',

  },

  tutor: {

    tutor: '과외쌤찾기',

    student: '학생찾기',

  },

};



/**

 * @param {SearchTab} tab

 * @param {ViewerRole} role

 */

export function getSearchTabLabel(tab, role) {

  return ROLE_SEARCH_TAB_LABELS[role]?.[tab] || SEARCH_TABS[tab].label;

}



/**
 * 공급자 자기 노출 미리보기
 * - 검색 UI: 공부방 + room 탭
 * - 홈 UI: 과외쌤 + tutor 탭 (homeSelf)
 * @param {SearchTab} tab
 * @param {ViewerRole} role
 * @param {boolean} [homeSelf]
 */
export function isProviderSelfPreviewMode(tab, role, homeSelf = false) {
  if (role === 'study_room' && tab === 'room') return true;
  return homeSelf === true && role === 'tutor' && tab === 'tutor';
}



/**

 * @param {SearchTab} tab

 * @param {ViewerRole} role

 */

export function canShowSearchTab(tab, role) {

  return (ROLE_SEARCH_TABS[role] || []).includes(tab);

}



/** @param {ViewerRole} role @returns {SearchTab[]} */

export function getVisibleSearchTabs(role) {

  return ROLE_SEARCH_TABS[role] || ['room'];

}



/** @param {ViewerRole} role @returns {SearchTab} */

export function defaultSearchTabForRole(role) {

  const tabs = getVisibleSearchTabs(role);

  return tabs[0] || 'room';

}



/**

 * @param {SearchTab} tab

 * @param {ViewerRole} role

 * @returns {SearchTab}

 */

export function resolveAllowedTab(tab, role) {

  return canShowSearchTab(tab, role) ? tab : defaultSearchTabForRole(role);

}


