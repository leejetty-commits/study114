/** 프리뷰 패키지 간 링크 SSOT (10장 GNB ↔ 검색 연동) */

export const PREVIEW_PORTS = {
  auth: 5173,
  home: 5174,
  studyRoom: 5175,
  search: 5176,
  tutor: 5177,
};

const LOCAL_ORIGIN = 'http://127.0.0.1';

/**
 * @param {string} key
 * @param {string} fallback
 */
function envBase(key, fallback) {
  const value = import.meta.env[key];
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.replace(/\/$/, '') : fallback;
}

export const AUTH_UI_BASE = envBase('VITE_AUTH_UI_BASE', `${LOCAL_ORIGIN}:${PREVIEW_PORTS.auth}`);
export const HOME_UI_BASE = envBase('VITE_HOME_UI_BASE', `${LOCAL_ORIGIN}:${PREVIEW_PORTS.home}`);
export const SEARCH_UI_BASE = envBase('VITE_SEARCH_UI_BASE', `${LOCAL_ORIGIN}:${PREVIEW_PORTS.search}`);
export const STUDY_ROOM_UI_BASE = envBase(
  'VITE_STUDY_ROOM_UI_BASE',
  `${LOCAL_ORIGIN}:${PREVIEW_PORTS.studyRoom}`,
);
export const TUTOR_UI_BASE = envBase('VITE_TUTOR_UI_BASE', `${LOCAL_ORIGIN}:${PREVIEW_PORTS.tutor}`);

export const STUDY_ROOM_REGISTER_URL = `${STUDY_ROOM_UI_BASE}/#/register/basic`;
export const TUTOR_REGISTER_URL = `${TUTOR_UI_BASE}/#/register/basic`;

/** @typedef {'guest' | 'parent' | 'study_room' | 'tutor'} NavRole */
/** @typedef {'room' | 'tutor' | 'student'} SearchTab */

/**
 * @param {SearchTab} tab
 * @param {NavRole | ''} [role]
 */
export function searchUiUrl(tab = 'room', role = '') {
  const base = `${SEARCH_UI_BASE}/#/search/${tab}`;
  return role ? `${base}?role=${encodeURIComponent(role)}` : base;
}

/** @param {'guest' | 'parent' | 'study-room' | 'tutor'} screen */
export function homeUiUrl(screen = 'guest') {
  return `${HOME_UI_BASE}/#/${screen}`;
}

export function authUiUrl(path = '/login') {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${AUTH_UI_BASE}#${p}`;
}

/** @param {string} [path] e.g. `/support`, `/support/safe`, `/support/safe/no-prepay` */
export function supportUiUrl(path = '/support') {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${HOME_UI_BASE}#${p}`;
}

/** @param {string} [path] e.g. `/policy/terms`, `/policy/privacy` */
export function policyUiUrl(path = '/policy/terms') {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${HOME_UI_BASE}#${p}`;
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
