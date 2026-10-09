/**
 * 13장 ↔ 24·25장 handoff 브리지 — search-ui 결과행 · compare · P24 상세
 */

import { isLoggedIn } from '@home-ui/auth-session.js';

/** @param {import('../state.js').SearchTab} tab */
export function tabToKind(tab) {
  if (tab === 'room') return 'study_room';
  if (tab === 'tutor') return 'tutor';
  return 'student';
}

/** @param {import('../state.js').SearchTab} tab @param {import('../state.js').ViewerRole} role @param {boolean} [homeSelf] */
export function canUseCompare(tab, role, _homeSelf = false) {
  if (role === 'guest') return false;
  return tab === 'room' || tab === 'tutor';
}

/** @param {import('../state.js').ViewerRole} role */
export function resolveSearchViewer(role) {
  if (role === 'guest') return 'guest';
  return role;
}

export function isSearchLoggedIn() {
  return isLoggedIn();
}
