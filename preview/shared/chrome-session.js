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
    if (res.ok && data.ok && data.authenticated) {
      // me.php는 사용자 필드를 최상위로 반환한다. 과거 형태(data.user)도 함께 지원.
      const src = data.user && typeof data.user === 'object' ? data.user : data;
      if (src.role_type) {
        currentUser = {
          user_id: src.user_id,
          email: src.email,
          role_type: src.role_type,
          name: src.name,
        };
        return currentUser;
      }
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
