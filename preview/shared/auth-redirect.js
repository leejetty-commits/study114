/** 로그인 성공 후 home-ui 복귀 — 프리뷰·실서비스 공용 */

import { AUTH_UI_BASE, HOME_UI_BASE } from './preview-links.js';

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
export function oauthRoleSelectionUrl(returnTo = '') {
  const params = new URLSearchParams({ from: 'oauth' });
  if (returnTo && isSafeReturnTo(returnTo)) {
    params.set('return_to', returnTo);
  }
  return `${AUTH_UI_BASE}#/signup/role?${params.toString()}`;
}

/**
 * @param {string} [target] basic | role | home
 */
export function setPostVerifyTarget(target) {
  try {
    sessionStorage.setItem('study114_post_verify', target || 'home');
  } catch {
    /* ignore */
  }
}

export function consumePostVerifyTarget() {
  try {
    const t = sessionStorage.getItem('study114_post_verify') || 'home';
    sessionStorage.removeItem('study114_post_verify');
    return t;
  } catch {
    return 'home';
  }
}

export function emailVerifyWaitUrl(query = '') {
  const q = query ? (query.startsWith('?') ? query : `?${query}`) : '';
  return `${AUTH_UI_BASE}#/signup/verify-email${q}`;
}

/**
 * @param {{ authenticated?: boolean, email_verified?: boolean, needs_account_contact?: boolean, oauth_role_pending?: boolean, role_type?: string, admin_level?: string|null }} me
 * @param {string} [returnTo]
 */
export function resolveAfterAuthUrl(me, returnTo = '') {
  if (!me?.authenticated) {
    return `${AUTH_UI_BASE}#/login`;
  }
  if (me.admin_level) {
    return resolvePostLoginUrl(me.role_type, returnTo);
  }
  if (me.needs_account_contact) {
    const params = new URLSearchParams();
    if (me.oauth_role_pending) params.set('from', 'oauth');
    if (returnTo && isSafeReturnTo(returnTo)) params.set('return_to', returnTo);
    const q = params.toString();
    return `${AUTH_UI_BASE}#/signup/account-contact${q ? `?${q}` : ''}`;
  }
  if (!me.email_verified && !(Array.isArray(me.oauth_providers) && me.oauth_providers.length)) {
    return emailVerifyWaitUrl();
  }
  if (me.oauth_role_pending) {
    return oauthRoleSelectionUrl(returnTo);
  }
  return resolvePostLoginUrl(me.role_type, returnTo);
}
