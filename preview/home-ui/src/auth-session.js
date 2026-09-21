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
import { deactivateBoardApi } from './board/board-backend.js';
import { resetConcernPreviewData } from './concern/store.js';
import { navigate, setActiveRole } from './state.js';
import { oauthRoleSelectionUrl, redirectToEmailVerifyWait, isGuidePublicPath } from '../../shared/auth-redirect.js';
import { AUTH_UI_BASE } from '../../shared/preview-links.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const CREDENTIALS = { credentials: 'include' };

/** @typedef {{ user_id: number, email: string, role_type: string, name: string, email_verified?: boolean, phone_verified?: boolean, admin_level?: string|null, must_change_password?: boolean, oauth_providers?: string[], oauth_provider_labels?: string[] }} AuthUser */

/** @type {AuthUser|null} */
let currentUser = null;

export const DEV_ACCOUNTS = {
  parent: { email: 'guardian1@dev.local', password: 'password', label: '학부모' },
  study_room: { email: 'room-owner1@dev.local', password: 'password', label: '공부방' },
  tutor: { email: 'tutor-owner1@dev.local', password: 'password', label: '과외' },
  admin: { email: 'ops@dev.local', password: 'password', label: '운영' },
};

export const ROLE_HOME = {
  guardian_student: '/parent',
  study_room_owner: '/study-room',
  tutor: '/tutor',
  // admin: 사이트 기본 랜딩이 아님 — #/admin은 명시 진입만
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
  return Boolean(currentUser?.admin_level) || currentUser?.role_type === 'admin';
}

/** @returns {Promise<AuthUser|null>} */
export async function fetchSession() {
  const res = await fetch('/api/auth/me.php', CREDENTIALS);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok || !data.authenticated) {
    return null;
  }
  if (data.needs_account_contact) {
    window.location.replace(`${String(AUTH_UI_BASE).replace(/\/$/, '')}/#/signup/account-contact`);
    return null;
  }
  // admin_level은 콘솔 RBAC 전용. 가입완료(email_verified) 예외가 아니다.
  if (!data.email_verified) {
    if (isGuidePublicPath()) {
      return {
        user_id: data.user_id,
        email: data.email,
        role_type: data.role_type,
        name: data.name,
        email_verified: false,
        admin_level: data.admin_level ?? null,
        must_change_password: Boolean(data.must_change_password),
        oauth_providers: Array.isArray(data.oauth_providers) ? data.oauth_providers : [],
        oauth_provider_labels: Array.isArray(data.oauth_provider_labels) ? data.oauth_provider_labels : [],
        phone_verified: Boolean(data.phone_verified),
      };
    }
    redirectToEmailVerifyWait();
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
    admin_level: data.admin_level ?? null,
    must_change_password: Boolean(data.must_change_password),
    oauth_providers: Array.isArray(data.oauth_providers) ? data.oauth_providers : [],
    oauth_provider_labels: Array.isArray(data.oauth_provider_labels) ? data.oauth_provider_labels : [],
    phone_verified: Boolean(data.phone_verified),
  };
}

export function isEmailVerified() {
  return Boolean(currentUser?.email_verified);
}

/** 사이트 표시명 세션 동기화 (auth email 불변) */
export function setAuthDisplayName(name) {
  if (!currentUser) return;
  currentUser = { ...currentUser, name: String(name || '').trim() };
  window.dispatchEvent(new CustomEvent('auth:profile', { detail: currentUser }));
}

function applyRoleContext(roleType) {
  const active = ROLE_ACTIVE[roleType];
  if (active) setActiveRole(active);
}

/** 쪽지·등록 등 부가 API 실패가 로그인 세션을 지우지 않게 격리 */
async function hydrateSessionDependencies() {
  await activateProviderApis(currentUser.role_type).catch((err) => {
    console.warn('[auth] provider hydrate skipped', err);
  });
  await activateMessagesApi().catch((err) => {
    console.warn('[auth] messages hydrate skipped', err);
  });
  await activateRegistrationsApi().catch((err) => {
    console.warn('[auth] registrations hydrate skipped', err);
  });
  await hydrateExposureBridge().catch((err) => {
    console.warn('[auth] exposure hydrate skipped', err);
  });
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
    await hydrateSessionDependencies();
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
    admin_level: data.admin_level ?? null,
    must_change_password: Boolean(data.must_change_password),
  };
  try {
    const me = await fetch('/api/auth/me.php', CREDENTIALS);
    const meData = await me.json().catch(() => ({}));
    if (meData.ok && meData.authenticated) {
      currentUser.email_verified = Boolean(meData.email_verified);
      currentUser.admin_level = meData.admin_level ?? currentUser.admin_level;
      currentUser.must_change_password = Boolean(meData.must_change_password);
      currentUser.phone_verified = Boolean(meData.phone_verified);
    }
  } catch {
    /* ignore */
  }
  applyRoleContext(currentUser.role_type);
  await hydrateSessionDependencies();
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
  deactivateBoardApi();
  resetConcernPreviewData();
  window.dispatchEvent(new CustomEvent('auth:logout'));
}
