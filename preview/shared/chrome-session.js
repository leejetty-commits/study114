/**
 * study-room-ui / tutor-ui 공통 크롬 세션 (home-ui state 비의존)
 */
import { navRoleFromAuthUser } from './site-nav-config.js';
import { AUTH_UI_BASE } from './preview-links.js';
import { emailVerifyWaitUrl } from './auth-redirect.js';

/** @typedef {{ user_id: number, email: string, role_type: string, name: string, admin_level?: string|null, oauth_provider_labels?: string[], email_verified?: boolean }} AuthUser */

/** @type {AuthUser|null} */
let currentUser = null;

export function getChromeUser() {
  return currentUser;
}

export function isChromeLoggedIn() {
  return currentUser !== null;
}

export function isChromeAdmin() {
  return Boolean(currentUser?.admin_level) || currentUser?.role_type === 'admin';
}

export function getChromeNavRole() {
  return navRoleFromAuthUser(currentUser);
}

export async function initChromeSession() {
  try {
    const res = await fetch('/api/auth/me.php', { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok && data.authenticated) {
      const src = data.user && typeof data.user === 'object' ? data.user : data;
      if (src.role_type) {
        if (src.needs_account_contact) {
          window.location.href = `${AUTH_UI_BASE}#/signup/account-contact`;
          currentUser = null;
          return null;
        }
        if (!src.email_verified && !src.admin_level) {
          window.location.href = emailVerifyWaitUrl();
          currentUser = null;
          return null;
        }
        currentUser = {
          user_id: src.user_id,
          email: src.email,
          role_type: src.role_type,
          name: src.name,
          admin_level: src.admin_level ?? null,
          email_verified: Boolean(src.email_verified),
          oauth_provider_labels: Array.isArray(src.oauth_provider_labels)
            ? src.oauth_provider_labels
            : [],
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
