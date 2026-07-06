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
    const home = new URL(HOME_UI_BASE);
    return url.origin === home.origin;
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
