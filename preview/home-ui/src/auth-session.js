/**
 * 2장 — 세션 연동 (PHP @ :8080 via Vite proxy)
 * handoff store API 모드 진입점
 */

import { activateHandoffApi, deactivateHandoffApi } from './handoff-backend.js';
import { deactivatePaidRoiApi } from './paid-backend.js';
import { activateMessagesApi, deactivateMessagesApi } from './messages-backend.js';
import { hydrateProviderStatus, resetProviderStatus } from './provider-status.js';
import { hydrateProviderNotices, resetProviderNotices } from './provider-notices.js';
import { hydrateExposureBridge, resetExposureBridge } from './exposure-bridge.js';
import { activateRegistrationsApi, deactivateRegistrationsApi } from './registrations-backend.js';
import { navigate, setActiveRole } from './state.js';
import { oauthRoleSelectionUrl } from '../../shared/auth-redirect.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const CREDENTIALS = { credentials: 'include' };

/** @typedef {{ user_id: number, email: string, role_type: string, name: string, email_verified?: boolean }} AuthUser */

/** @type {AuthUser|null} */
let currentUser = null;

export const DEV_ACCOUNTS = {
  parent: { email: 'guardian1@dev.local', password: 'password', label: '학부모' },
  study_room: { email: 'room-owner1@dev.local', password: 'password', label: '공부방' },
  tutor: { email: 'tutor-owner1@dev.local', password: 'password', label: '과외' },
  admin: { email: 'ops@dev.local', password: 'password', label: '운영' },
};

const ROLE_HOME = {
  guardian_student: '/parent',
  study_room_owner: '/study-room',
  tutor: '/tutor',
  admin: '/admin',
};

const ROLE_ACTIVE = {
  guardian_student: 'parent',
  study_room_owner: 'study_room',
  tutor: 'tutor',
};

const PROVIDER_ROLES = new Set(['study_room_owner', 'tutor']);

async function activateProviderApis(roleType) {
  await activateHandoffApi();
  if (PROVIDER_ROLES.has(roleType)) {
    await hydrateProviderStatus();
    await hydrateProviderNotices();
  } else {
    deactivatePaidRoiApi();
  }
}

function deactivateProviderApis() {
  deactivateHandoffApi();
  deactivatePaidRoiApi();
}

/** @returns {AuthUser|null} */
export function getAuthUser() {
  return currentUser;
}

export function isLoggedIn() {
  return currentUser !== null;
}

export function isAdminUser() {
  return currentUser?.role_type === 'admin';
}

/** @returns {Promise<AuthUser|null>} */
export async function fetchSession() {
  const res = await fetch('/api/auth/me.php', CREDENTIALS);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok || !data.authenticated) {
    return null;
  }
  if (data.oauth_role_pending) {
    window.location.href = oauthRoleSelectionUrl();
    return null;
  }
  return {
    user_id: data.user_id,
    email: data.email,
    role_type: data.role_type,
    name: data.name,
    email_verified: Boolean(data.email_verified),
  };
}

export function isEmailVerified() {
  return Boolean(currentUser?.email_verified);
}

function applyRoleContext(roleType) {
  const active = ROLE_ACTIVE[roleType];
  if (active) setActiveRole(active);
}

/** @param {boolean} [navigateHome] */
export async function initAuthSession(navigateHome = false) {
  try {
    const user = await fetchSession();
    if (!user) {
      currentUser = null;
      deactivateProviderApis();
      deactivateMessagesApi();
      deactivateRegistrationsApi();
      resetProviderStatus();
      resetProviderNotices();
      resetExposureBridge();
      return null;
    }
    currentUser = user;
    applyRoleContext(user.role_type);
    await activateProviderApis(user.role_type);
    await activateMessagesApi();
    await activateRegistrationsApi();
    await hydrateExposureBridge();
    if (navigateHome && ROLE_HOME[user.role_type]) {
      navigate(ROLE_HOME[user.role_type]);
    }
    return user;
  } catch (err) {
    console.warn('[auth] session check skipped — sessionStorage fallback', err);
    currentUser = null;
    deactivateProviderApis();
    deactivateMessagesApi();
    deactivateRegistrationsApi();
    resetProviderStatus();
    resetProviderNotices();
    resetExposureBridge();
    return null;
  }
}

/**
 * @param {string} email
 * @param {string} [password]
 * @returns {Promise<AuthUser>}
 */
export async function devLogin(email, password = 'password') {
  const res = await fetch('/api/auth/login.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || '로그인 실패');
  }
  currentUser = {
    user_id: data.user_id,
    email: data.email,
    role_type: data.role_type,
    name: data.name,
    email_verified: false,
  };
  try {
    const me = await fetch('/api/auth/me.php', CREDENTIALS);
    const meData = await me.json().catch(() => ({}));
    if (meData.ok && meData.authenticated) {
      currentUser.email_verified = Boolean(meData.email_verified);
    }
  } catch {
    /* ignore */
  }
  applyRoleContext(currentUser.role_type);
  await activateHandoffApi();
  await activateMessagesApi();
  await activateRegistrationsApi();
  await activateProviderApis(currentUser.role_type);
  await hydrateExposureBridge();
  window.dispatchEvent(new CustomEvent('auth:login', { detail: currentUser }));
  return currentUser;
}

/** @param {'parent'|'study_room'|'tutor'|'admin'} key */
export async function devLoginAs(key) {
  const account = DEV_ACCOUNTS[key];
  if (!account) throw new Error('알 수 없는 dev 계정');
  const user = await devLogin(account.email, account.password);
  const home =
    key === 'parent'
      ? '/parent'
      : key === 'study_room'
        ? '/study-room'
        : key === 'admin'
          ? '/admin'
          : '/tutor';
  navigate(home);
  return user;
}

export async function logout() {
  try {
    await fetch('/api/auth/logout.php', { method: 'POST', ...CREDENTIALS });
  } catch (err) {
    console.warn('[auth] logout', err);
  }
  currentUser = null;
  deactivateProviderApis();
  deactivateMessagesApi();
  deactivateRegistrationsApi();
  resetProviderStatus();
  resetProviderNotices();
  resetExposureBridge();
  window.dispatchEvent(new CustomEvent('auth:logout'));
}
