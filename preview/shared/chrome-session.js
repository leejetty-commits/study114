/**
 * study-room-ui / tutor-ui 공통 크롬 세션 (home-ui state 비의존)
 */
import { navRoleFromAuthUser } from './site-nav-config.js';

/** @typedef {{ user_id: number, email: string, role_type: string, name: string }} AuthUser */

/** @type {AuthUser|null} */
let currentUser = null;

export function getChromeUser() {
  return currentUser;
}

export function isChromeLoggedIn() {
  return currentUser !== null;
}

export function getChromeNavRole() {
  return navRoleFromAuthUser(currentUser);
}

export async function initChromeSession() {
  try {
    const res = await fetch('/api/auth/me.php', { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok && data.authenticated && data.user) {
      currentUser = data.user;
      return currentUser;
    }
  } catch {
    /* ignore */
  }
  currentUser = null;
  return null;
}

export async function chromeLogout() {
  try {
    await fetch('/api/auth/logout.php', { method: 'POST', credentials: 'include' });
  } catch {
    /* ignore */
  }
  currentUser = null;
}
