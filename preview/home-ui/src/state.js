/** @typedef {'guest' | 'parent' | 'study_room' | 'tutor'} HomeRole */
/** @typedef {'study_room' | 'tutor'} ParentTab */
/** @typedef {'free' | 'paid'} ProviderSubscription */

import { getDefaultMypagePath, normalizeMypagePath } from './mypage/router.js';
import { getDefaultMessagesPath, normalizeMessagesPath, isMessagesDetailPath } from './messages/router.js';
import { getDefaultSupportPath, normalizeSupportPath } from './support/router.js';

const ACTIVE_ROLE_KEY = 'study114-preview-active-role';
const SUPPORT_CTX_KEY = 'study114-preview-support-context';

/** @type {{ parentTab: ParentTab, regionKey: 'complex' | 'dong', guestListPages: Record<string, number>, providerSubscription: ProviderSubscription }} */
export const previewState = {
  parentTab: 'study_room',
  regionKey: 'dong',
  guestListPages: {
    study_room: 1,
    tutor: 1,
    student: 1,
    pick_study_room: 1,
    pick_tutor: 1,
  },
  providerSubscription: 'free',
};

export const ROUTES = {
  '/guest': 'guest',
  '/parent': 'parent',
  '/study-room': 'studyRoom',
  '/tutor': 'tutor',
};

export const SCREEN_META = {
  guest: { label: '비회원', role: 'guest' },
  parent: { label: '학부모', role: 'parent' },
  studyRoom: { label: '공부방', role: 'study_room' },
  tutor: { label: '과외쌤', role: 'tutor' },
  mypage: { label: '마이페이지', role: 'parent' },
  messages: { label: '쪽지함', role: 'parent' },
  support: { label: '고객센터', role: 'guest' },
};

export function setParentTab(tab) {
  previewState.parentTab = tab;
}

export function setRegionKey(key) {
  previewState.regionKey = key;
}

/** @param {'study_room'|'tutor'|'student'} listId */
export function setGuestListPage(listId, page) {
  previewState.guestListPages[listId] = Math.max(1, page);
}

/** @param {'study_room'|'tutor'|'student'} listId */
export function getGuestListPage(listId) {
  return previewState.guestListPages[listId] || 1;
}

export function getNavRole() {
  if (isMypageRoute() || isMessagesRoute()) {
    return getActiveRole();
  }
  if (isSupportRoute()) {
    return getSupportContextRole();
  }
  const screen = getCurrentScreen();
  const role = SCREEN_META[screen]?.role ?? 'guest';
  if (role !== 'guest') setActiveRole(role);
  return role;
}

export function navigate(path) {
  window.location.hash = path;
}

export function isMessagesRoute() {
  const hash = window.location.hash.slice(1) || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  return path === '/messages' || (path.startsWith('/messages/') && !path.startsWith('/mypage/'));
}

export function isSupportRoute() {
  const hash = window.location.hash.slice(1) || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  return path === '/support' || path.startsWith('/support/');
}

export function isMypageRoute() {
  const hash = window.location.hash.slice(1) || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  return path === '/mypage' || path.startsWith('/mypage/');
}

/** @param {HomeRole} role */
export function setActiveRole(role) {
  if (role && role !== 'guest') {
    sessionStorage.setItem(ACTIVE_ROLE_KEY, role);
  }
}

export function getActiveRole() {
  const stored = sessionStorage.getItem(ACTIVE_ROLE_KEY);
  if (stored === 'parent' || stored === 'study_room' || stored === 'tutor') {
    return stored;
  }
  return 'parent';
}

/** @returns {'guest' | 'parent' | 'study_room' | 'tutor'} */
export function getSupportContextRole() {
  const stored = sessionStorage.getItem(SUPPORT_CTX_KEY);
  if (stored === 'guest' || stored === 'parent' || stored === 'study_room' || stored === 'tutor') {
    return stored;
  }
  return 'guest';
}

/** 진입 직전 역할을 고객센터 CTA·헤더에 반영 */
export function captureSupportContextRole() {
  let role = 'guest';
  if (isMypageRoute() || isMessagesRoute()) {
    role = getActiveRole();
  } else if (!isSupportRoute()) {
    const screen = getCurrentScreen();
    role = SCREEN_META[screen]?.role ?? 'guest';
    if (role !== 'guest') setActiveRole(role);
  } else {
    role = getSupportContextRole();
  }
  sessionStorage.setItem(SUPPORT_CTX_KEY, role);
  return role;
}

export function navigateToSupport(path = getDefaultSupportPath()) {
  captureSupportContextRole();
  navigate(path);
}

export function bootstrapMessagesRoute() {
  const { pathname, hash, origin, search } = window.location;

  if (!hash && pathname.startsWith('/messages')) {
    const bare = pathname === '/messages' || pathname === '/messages/';
    const target = bare ? getDefaultMessagesPath() : mapPathnameToMypageMessages(pathname);
    window.location.replace(`${origin}/${search}#${target}`);
    return true;
  }

  if (!hash) return false;

  const hashPath = hash.slice(1);
  const path = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  const normalized = normalizeMessagesPath(path);
  if (path === '/messages' || path === '/messages/' || path.startsWith('/messages/')) {
    window.location.replace(`#${normalized || getDefaultMessagesPath()}`);
    return true;
  }

  return false;
}

/** @param {string} pathname */
function mapPathnameToMypageMessages(pathname) {
  const normalized = normalizeMessagesPath(pathname);
  return normalized || getDefaultMessagesPath();
}

export function bootstrapSupportRoute() {
  const { pathname, hash, origin, search } = window.location;

  if (!hash && pathname.startsWith('/support')) {
    const bare = pathname === '/support' || pathname === '/support/';
    const target = bare ? getDefaultSupportPath() : pathname;
    window.location.replace(`${origin}/${search}#${target}`);
    return true;
  }

  if (!hash) return false;

  const hashPath = hash.slice(1);
  const path = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (path === '/support' || path === '/support/') {
    window.location.replace(`#${getDefaultSupportPath()}`);
    return true;
  }

  if (path.startsWith('/support/') && !normalizeSupportPath(path)) {
    window.location.replace(`#${getDefaultSupportPath()}`);
    return true;
  }

  return false;
}

/**
 * Path URL(`/mypage/...`) 또는 bare `#/mypage`를 hash 라우트로 정규화.
 * SSOT 부록 A의 PHP 경로로 접속해도 프리뷰가 열리도록 한다.
 * @returns {boolean} location.replace를 호출했으면 true
 */
export function bootstrapMypageRoute() {
  const { pathname, hash, origin, search } = window.location;

  if (!hash && pathname.startsWith('/mypage')) {
    const bare = pathname === '/mypage' || pathname === '/mypage/';
    const target = bare ? getDefaultMypagePath(getActiveRole()) : pathname;
    window.location.replace(`${origin}/${search}#${target}`);
    return true;
  }

  if (!hash) return false;

  const hashPath = hash.slice(1);
  const path = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (path === '/mypage' || path === '/mypage/') {
    window.location.replace(`#${getDefaultMypagePath(getNavRole())}`);
    return true;
  }

  if (path.startsWith('/mypage/') && !normalizeMypagePath(path)) {
    window.location.replace(`#${getDefaultMypagePath(getNavRole())}`);
    return true;
  }

  return false;
}

export function getMessagesPath() {
  const hash = window.location.hash.slice(1) || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  const normalized = normalizeMessagesPath(path);
  if (normalized && isMessagesDetailPath(path)) return normalized;
  return getDefaultMessagesPath();
}

export function getSupportPath() {
  const hash = window.location.hash.slice(1) || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  const normalized = normalizeSupportPath(path);
  if (normalized) return normalized;
  return getDefaultSupportPath();
}

export function getMypagePath() {
  const hash = window.location.hash.slice(1) || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  const normalized = normalizeMypagePath(path);
  if (normalized) return normalized;
  return getDefaultMypagePath(getNavRole());
}

export function getCurrentScreen() {
  if (isMypageRoute()) return 'mypage';
  if (isMessagesRoute()) return 'messages';
  if (isSupportRoute()) return 'support';
  const hash = window.location.hash.slice(1) || '/guest';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  return ROUTES[path] || 'guest';
}
