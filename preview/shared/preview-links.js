/** 프리뷰 패키지 간 링크 SSOT (10장 GNB ↔ 검색 연동) */

export const PREVIEW_PORTS = {
  auth: 5173,
  home: 5174,
  studyRoom: 5175,
  search: 5176,
  tutor: 5177,
};

export const AUTH_UI_BASE = `http://127.0.0.1:${PREVIEW_PORTS.auth}`;
export const HOME_UI_BASE = `http://127.0.0.1:${PREVIEW_PORTS.home}`;
export const STUDY_ROOM_REGISTER_URL = `http://127.0.0.1:${PREVIEW_PORTS.studyRoom}/#/register/basic`;
export const TUTOR_REGISTER_URL = `http://127.0.0.1:${PREVIEW_PORTS.tutor}/#/register/basic`;

/** @typedef {'guest' | 'parent' | 'study_room' | 'tutor'} NavRole */
/** @typedef {'room' | 'tutor' | 'student'} SearchTab */

/**
 * @param {SearchTab} tab
 * @param {NavRole | ''} [role]
 */
export function searchUiUrl(tab = 'room', role = '') {
  const base = `http://127.0.0.1:${PREVIEW_PORTS.search}/#/search/${tab}`;
  return role ? `${base}?role=${encodeURIComponent(role)}` : base;
}

/** @param {'guest' | 'parent' | 'study-room' | 'tutor'} screen */
export function homeUiUrl(screen = 'guest') {
  return `${HOME_UI_BASE}/#/${screen}`;
}

/** @returns {Record<string, string>} */
export function parseHashQuery() {
  const hash = window.location.hash.slice(1);
  const qIdx = hash.indexOf('?');
  if (qIdx === -1) return {};
  return Object.fromEntries(new URLSearchParams(hash.slice(qIdx + 1)).entries());
}

/** @param {string | undefined} raw @returns {NavRole | null} */
export function parseNavRole(raw) {
  if (raw === 'guest' || raw === 'parent' || raw === 'study_room' || raw === 'tutor') {
    return raw;
  }
  return null;
}

/**
 * @param {string} gnbId
 * @param {NavRole} role
 * @returns {{ external: boolean, url: string } | null}
 */
export function resolveGnbLink(gnbId, role) {
  switch (gnbId) {
    case 'find_room':
      return { external: true, url: searchUiUrl('room', role) };
    case 'find_tutor':
      return { external: true, url: searchUiUrl('tutor', role) };
    case 'student_parent':
      if (role === 'study_room' || role === 'tutor') {
        return { external: true, url: searchUiUrl('student', role) };
      }
      return { external: false, url: '/parent' };
    case 'register_room':
      return { external: true, url: STUDY_ROOM_REGISTER_URL };
    case 'register_tutor':
      return { external: true, url: TUTOR_REGISTER_URL };
    case 'support':
      return { external: false, url: '/support' };
    default:
      return null;
  }
}
