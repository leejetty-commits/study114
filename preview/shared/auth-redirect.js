/** 로그인 성공 후 home-ui 복귀 — 프리뷰·실서비스 공용 */

import { AUTH_UI_BASE, HOME_UI_BASE, SEARCH_UI_BASE } from './preview-links.js';

/** @type {Record<string, string>} */
export const ROLE_HOME_HASH = {
  guardian_student: '/parent',
  study_room_owner: '/study-room',
  tutor: '/tutor',
};

/**
 * @param {string} [hashQuery] location.hash query e.g. ?return_to=...
 */
export function getLoginReturnTo(hashQuery = '') {
  const raw = hashQuery || window.location.hash;
  const qIdx = raw.indexOf('?');
  if (qIdx === -1) return '';
  const params = new URLSearchParams(raw.slice(qIdx + 1));
  return params.get('return_to') || '';
}

const ALLOWED_RETURN_ORIGINS = new Set([
  'https://study114.net',
  'https://www.study114.net',
  'https://study114.dothome.co.kr',
]);

/**
 * @param {string} target
 * @returns {boolean}
 */
export function isSafeReturnTo(target) {
  if (!target || typeof target !== 'string') return false;
  const trimmed = target.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return !trimmed.includes('://');
  }
  try {
    const url = new URL(trimmed);
    if (HOME_UI_BASE) {
      const home = new URL(HOME_UI_BASE);
      if (url.origin === home.origin) return true;
    }
    if (SEARCH_UI_BASE) {
      const search = new URL(SEARCH_UI_BASE);
      if (url.origin === search.origin) return true;
    }
    return ALLOWED_RETURN_ORIGINS.has(url.origin);
  } catch {
    return false;
  }
}

/**
 * @param {string} roleType
 * @param {string} [returnTo]
 */
export function resolvePostLoginUrl(roleType, returnTo = '') {
  if (returnTo && isSafeReturnTo(returnTo)) {
    if (returnTo.startsWith('/')) {
      return `${HOME_UI_BASE}#${returnTo.startsWith('#') ? returnTo.slice(1) : returnTo}`;
    }
    return returnTo;
  }
  const hash = ROLE_HOME_HASH[roleType] || ROLE_HOME_HASH.guardian_student;
  return `${HOME_UI_BASE}#${hash}`;
}

/**
 * @param {string} provider naver | kakao | google
 * @param {string} [returnTo]
 */
export function oauthStartUrl(provider, returnTo = '') {
  const params = new URLSearchParams({ provider });
  if (returnTo && isSafeReturnTo(returnTo)) {
    params.set('return_to', returnTo);
  }
  return `/api/auth/oauth/start.php?${params.toString()}`;
}

/**
 * 소셜 신규 가입 — 회원구분 선택 화면
 * @param {string} [returnTo]
 */
function authUiHref(hashPathAndQuery) {
  const hash = hashPathAndQuery.startsWith('#')
    ? hashPathAndQuery
    : `#${hashPathAndQuery.startsWith('/') ? hashPathAndQuery : `/${hashPathAndQuery}`}`;
  // /auth 와 /auth/ 왕복 시 해시가 떨어져 깜박임이 생긴다. 슬래시를 고정한다.
  return `${String(AUTH_UI_BASE).replace(/\/$/, '')}/${hash}`;
}

export function oauthRoleSelectionUrl(returnTo = '') {
  const params = new URLSearchParams({ from: 'oauth' });
  if (returnTo && isSafeReturnTo(returnTo)) {
    params.set('return_to', returnTo);
  }
  return authUiHref(`/signup/role?${params.toString()}`);
}

/**
 * DB role_type → auth-ui 회원구분 (기본등록 라우트 정본)
 * @param {string} [roleType]
 * @returns {'student'|'study_room'|'tutor'|''}
 */
export function uiRoleFromRoleType(roleType) {
  const t = String(roleType || '');
  if (t === 'tutor') return 'tutor';
  if (t === 'study_room_owner') return 'study_room';
  if (t === 'guardian_student' || t === 'student') return 'student';
  return '';
}

const POST_VERIFY_ROLE_KEY = 'study114_post_verify_role';
const POST_VERIFY_TARGET_KEY = 'study114_post_verify';
const ALLOWED_UI_ROLES = new Set(['student', 'study_room', 'tutor']);
const PRESERVED_POST_VERIFY_TARGETS = new Set(['basic', 'role', 'home']);

/**
 * @param {string} [target] basic | role | home
 * @param {string} [roleUi] student | study_room | tutor — basic 목표일 때만 저장
 */
export function setPostVerifyTarget(target, roleUi = '') {
  try {
    const t = target || 'home';
    sessionStorage.setItem(POST_VERIFY_TARGET_KEY, t);
    if (t === 'basic' && ALLOWED_UI_ROLES.has(roleUi)) {
      sessionStorage.setItem(POST_VERIFY_ROLE_KEY, roleUi);
    } else {
      sessionStorage.removeItem(POST_VERIFY_ROLE_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function peekPostVerifyTarget() {
  try {
    return sessionStorage.getItem(POST_VERIFY_TARGET_KEY) || '';
  } catch {
    return '';
  }
}

export function peekPostVerifyRole() {
  try {
    const r = sessionStorage.getItem(POST_VERIFY_ROLE_KEY) || '';
    return ALLOWED_UI_ROLES.has(r) ? r : '';
  } catch {
    return '';
  }
}

export function consumePostVerifyTarget() {
  try {
    const t = sessionStorage.getItem(POST_VERIFY_TARGET_KEY) || 'home';
    sessionStorage.removeItem(POST_VERIFY_TARGET_KEY);
    return t;
  } catch {
    return 'home';
  }
}

export function consumePostVerifyRole() {
  try {
    const r = peekPostVerifyRole();
    sessionStorage.removeItem(POST_VERIFY_ROLE_KEY);
    return r;
  } catch {
    return '';
  }
}

/**
 * 미확인 재로그인: basic | role | home 기존 목표를 덮지 않음.
 * 목표가 비어 있으면 basic(역할은 me.role_type으로 복원). home을 basic으로 바꾸지 않음.
 */
export function ensurePostVerifyTargetForUnverifiedLogin() {
  try {
    const cur = sessionStorage.getItem(POST_VERIFY_TARGET_KEY) || '';
    if (PRESERVED_POST_VERIFY_TARGETS.has(cur)) {
      return;
    }
    sessionStorage.setItem(POST_VERIFY_TARGET_KEY, 'basic');
  } catch {
    /* ignore */
  }
}

/**
 * 확인 후 기본등록 경로 — 서버 role_type 정본. URL/hint와 불일치해도 서버 역할만 사용.
 * @param {{ role_type?: string }} me
 * @returns {string} hash path e.g. /signup/basic?role=tutor
 */
export function basicRegisterPathForMe(me) {
  const role = uiRoleFromRoleType(me?.role_type);
  if (!role) {
    return '/signup/basic';
  }
  return `/signup/basic?role=${encodeURIComponent(role)}`;
}

/**
 * @param {string} hintRole
 * @param {{ role_type?: string }} me
 * @returns {'student'|'study_room'|'tutor'|''}
 */
export function resolveUiRoleForBasicRegister(hintRole, me) {
  const server = uiRoleFromRoleType(me?.role_type);
  if (!server) {
    return '';
  }
  if (hintRole && hintRole !== server) {
    return server;
  }
  return server;
}

const UNVERIFIED_AUTH_PATHS = new Set([
  '/login',
  '/signup/terms',
  '/signup/role',
  '/signup/form',
  '/signup/verify-email',
  '/signup/account-contact',
  '/find-id',
  '/find-password',
  '/reset-password',
]);

let authRedirectPending = false;

export function isAuthRedirectPending() {
  return authRedirectPending;
}

export function isOnAuthUi() {
  try {
    const path = (window.location.pathname || '').replace(/\/+$/, '');
    return path === '/auth' || path.endsWith('/auth');
  } catch {
    return false;
  }
}

export function currentAuthHashPath() {
  const raw = (window.location.hash || '').replace(/^#/, '') || '/login';
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  const qIdx = path.indexOf('?');
  return qIdx === -1 ? path : path.slice(0, qIdx);
}

export function isGuidePublicPath() {
  try {
    const path = (window.location.pathname || '').replace(/\/$/, '') || '';
    if (path === '/guide' || path.startsWith('/guide/')) return true;
    const raw = (window.location.hash || '').replace(/^#/, '');
    const hash = (raw.startsWith('/') ? raw : `/${raw}`).split('?')[0];
    return hash === '/guide' || hash.startsWith('/guide/');
  } catch {
    return false;
  }
}
export function isOnEmailVerifyWait() {
  return isOnAuthUi() && currentAuthHashPath() === '/signup/verify-email';
}

export function isUnverifiedAllowedAuthPath() {
  return isOnAuthUi() && UNVERIFIED_AUTH_PATHS.has(currentAuthHashPath());
}

export function emailVerifyWaitUrl(query = '') {
  const q = query ? (query.startsWith('?') ? query : `?${query}`) : '';
  return authUiHref(`/signup/verify-email${q}`);
}

/** @returns {boolean} 실제 이동을 걸었으면 true */
export function redirectToEmailVerifyWait() {
  if (isOnEmailVerifyWait()) {
    return false;
  }
  authRedirectPending = true;
  if (isOnAuthUi()) {
    window.location.hash = '#/signup/verify-email';
    return true;
  }
  window.location.replace(emailVerifyWaitUrl());
  return true;
}

/**
 * @param {{ authenticated?: boolean, email_verified?: boolean, needs_account_contact?: boolean, oauth_role_pending?: boolean, needs_basic_register?: boolean, role_type?: string, admin_level?: string|null }} me
 * @param {string} [returnTo]
 */
export function resolveAfterAuthUrl(me, returnTo = '') {
  if (!me?.authenticated) {
    return authUiHref('/login');
  }
  // admin_level은 콘솔 RBAC 전용. 가입완료 우회가 아니다.
  if (me.needs_account_contact) {
    const params = new URLSearchParams();
    if (me.oauth_role_pending) params.set('from', 'oauth');
    if (returnTo && isSafeReturnTo(returnTo)) params.set('return_to', returnTo);
    const q = params.toString();
    return authUiHref(`/signup/account-contact${q ? `?${q}` : ''}`);
  }
  if (!me.email_verified) {
    return emailVerifyWaitUrl();
  }
  if (me.oauth_role_pending) {
    return oauthRoleSelectionUrl(returnTo);
  }
  // 기본등록 완료 여부는 서버 행 존재(needs_basic_register). 빈 postVerify로 추정하지 않음.
  if (me.needs_basic_register) {
    return authUiHref(basicRegisterPathForMe(me));
  }
  return resolvePostLoginUrl(me.role_type, returnTo);
}
