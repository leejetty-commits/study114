/** @typedef {'room' | 'tutor' | 'student'} SearchTab */
/** @typedef {'guest' | 'parent' | 'study_room' | 'tutor'} ViewerRole */
/** @typedef {'free' | 'paid'} ProviderSubscription */

import { parseHashQuery, parseNavRole } from '../../shared/preview-links.js';

/** @type {{ tab: SearchTab, expanded: boolean, role: ViewerRole, subscription: ProviderSubscription, searchExecuted: boolean, searchLoading: boolean, searchError: string | null, searchTotal: number, searchRows: Array<{ left: string, center: string, right: string }>, searchItems: Array<Record<string, unknown>> }} */
export const previewState = {
  tab: 'room',
  expanded: false,
  searchExecuted: false,
  searchLoading: false,
  searchError: null,
  searchTotal: 0,
  searchRows: [],
  searchItems: [],
  searchExposureItems: [],
  activeResultItems: [],
  activeResultSource: null,
  activeRegionLabel: '',
  role: 'study_room',
  subscription: 'free',
  studentLessonFormat: 'one_on_one',
  tutorRegionIndex: 0,
};

const TAB_FROM_HASH = {
  '/search/room': 'room',
  '/search/tutor': 'tutor',
  '/search/student': 'student',
};

const HASH_FROM_TAB = {
  room: '/search/room',
  tutor: '/search/tutor',
  student: '/search/student',
};

/** @returns {string} */
function hashPathOnly() {
  const hash = window.location.hash.slice(1) || '/search/room';
  const qIdx = hash.indexOf('?');
  const path = qIdx === -1 ? hash : hash.slice(0, qIdx);
  return path.startsWith('/') ? path : `/${path}`;
}

/** @returns {SearchTab} */
export function getCurrentTab() {
  return TAB_FROM_HASH[hashPathOnly()] || 'room';
}

/** GNB·home-ui에서 넘어온 ?role= 동기화 */
export function syncRoleFromHash() {
  const role = parseNavRole(parseHashQuery().role);
  if (role) {
    previewState.role = role;
  }
}

/** @param {SearchTab} tab */
export function navigateTab(tab) {
  const base = HASH_FROM_TAB[tab] || HASH_FROM_TAB.room;
  const role = parseNavRole(parseHashQuery().role) || previewState.role;
  window.location.hash = role ? `${base}?role=${encodeURIComponent(role)}` : base;
}

export const VIEWER_ROLE_LABELS = {
  guest: '비회원',
  parent: '학부모',
  study_room: '공부방',
  tutor: '과외쌤',
};

export {
  canShowSearchTab,
  getVisibleSearchTabs,
  defaultSearchTabForRole,
  resolveAllowedTab,
  ROLE_SEARCH_HEADING,
  getSearchTabLabel,
  isProviderSelfPreviewMode,
} from './search-role-access.js';

/** @deprecated use canShowSearchTab('student', role) */
export function canShowStudentTab(role) {
  return role === 'study_room' || role === 'tutor';
}
