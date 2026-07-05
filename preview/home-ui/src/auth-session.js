/**
 * 2장 — 세션 연동 (PHP @ :8080 via Vite proxy)
 * handoff store API 모드 진입점
 */

import { activateHandoffApi, deactivateHandoffApi } from './handoff-backend.js';
import { navigate, setActiveRole } from './state.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const CREDENTIALS = { credentials: 'include' };

/** @typedef {{ user_id: number, email: string, role_type: string, name: string }} AuthUser */

/** @type {AuthUser|null} */
let currentUser = null;

export const DEV_ACCOUNTS = {
  parent: { email: 'guardian1@dev.local', password: 'password', label: '학부모' },
  study_room: { email: 'room-owner1@dev.local', password: 'password', label: '공부방' },
  tutor: { email: 'tutor-owner1@dev.local', password: 'password', label: '과외' },
};

const ROLE_HOME = {
  guardian_student: '/parent',
  study_room_owner: '/study-room',
  tutor: '/tutor',
};

const ROLE_ACTIVE = {
  guardian_student: 'parent',
  study_room_owner: 'study_room',
  tutor: 'tutor',
};

/** @returns {AuthUser|null} */
export function getAuthUser() {
  return currentUser;
}

export function isLoggedIn() {
  return currentUser !== null;
}

/** @returns {Promise<AuthUser|null>} */
export async function fetchSession() {
  const res = await fetch('/api/auth/me.php', CREDENTIALS);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok || !data.authenticated) {
    return null;
  }
  return {
    user_id: data.user_id,
    email: data.email,
    role_type: data.role_type,
    name: data.name,
  };
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
      deactivateHandoffApi();
      return null;
    }
    currentUser = user;
    applyRoleContext(user.role_type);
    await activateHandoffApi();
    if (navigateHome && ROLE_HOME[user.role_type]) {
      navigate(ROLE_HOME[user.role_type]);
    }
    return user;
  } catch (err) {
    console.warn('[auth] session check skipped — sessionStorage fallback', err);
    currentUser = null;
    deactivateHandoffApi();
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
  };
  applyRoleContext(currentUser.role_type);
  await activateHandoffApi();
  window.dispatchEvent(new CustomEvent('auth:login', { detail: currentUser }));
  return currentUser;
}

/** @param {'parent'|'study_room'|'tutor'} key */
export async function devLoginAs(key) {
  const account = DEV_ACCOUNTS[key];
  if (!account) throw new Error('알 수 없는 dev 계정');
  const user = await devLogin(account.email, account.password);
  const home = key === 'parent' ? '/parent' : key === 'study_room' ? '/study-room' : '/tutor';
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
  deactivateHandoffApi();
  window.dispatchEvent(new CustomEvent('auth:logout'));
}
