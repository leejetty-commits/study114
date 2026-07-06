import { DEV_ACCOUNTS, isAdminUser, isLoggedIn } from '../auth-session.js';

/** @type {readonly string[]} */
export const PROTECTED_ADMIN_PATHS = ['/admin/reports', '/admin/submission-docs', '/admin/exposure', '/admin/logs'];

/** @param {string} path */
export function isProtectedAdminPath(path) {
  return PROTECTED_ADMIN_PATHS.includes(path);
}

/** @param {string} path */
export function canAccessAdminPath(path) {
  if (!isProtectedAdminPath(path)) return true;
  return isAdminUser();
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** @param {string} path */
export function renderAdminAccessGate(path) {
  const loggedIn = isLoggedIn();
  const adminAccount = DEV_ACCOUNTS.admin;

  return `
    <section class="sup-panel-card sup-panel-card--admin a28-panel">
      <header class="sup-panel-card__head">
        <div>
          <h2 class="sup-panel-card__title">운영자 전용</h2>
          <p class="sup-panel-card__lead">${esc(path)} · admin 역할 세션이 필요합니다.</p>
        </div>
      </header>
      <div class="sup-panel-card__body">
        <p class="a28-gate__msg">
          ${
            loggedIn
              ? '현재 계정에는 운영자 권한이 없습니다. Dev·운영 계정으로 다시 로그인하세요.'
              : '로그인 후 운영자(admin) 역할이 있어야 이 화면을 볼 수 있습니다.'
          }
        </p>
        <p class="mypage-note">Dev 계정: <code>${esc(adminAccount.email)}</code> / password</p>
        <button type="button" class="btn btn--primary" data-action="dev-login-admin">Dev·운영 로그인</button>
        <a href="#/admin" class="btn btn--secondary" data-a28-nav="/admin">← A28 허브</a>
      </div>
    </section>`;
}
