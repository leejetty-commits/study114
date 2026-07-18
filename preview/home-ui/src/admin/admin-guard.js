import { DEV_ACCOUNTS, getAuthUser, isAdminUser, isLoggedIn } from '../auth-session.js';
import {
  canAccessAdminMenu,
  getCurrentAdminLevel,
  ADMIN_LEVEL_LABELS,
  isMasterAdmin,
} from './admin-permissions.js';
import { getAdminMenuId } from './router.js';

/** @param {string} path */
export function canAccessAdminPath(path) {
  if (!isAdminUser()) return false;
  const menuId = getAdminMenuId(path);
  return canAccessAdminMenu(menuId);
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** @param {string} path */
export function renderAdminAccessGate(path) {
  const loggedIn = isLoggedIn();
  const adminAccount = DEV_ACCOUNTS.admin;
  const user = getAuthUser();
  const level = getCurrentAdminLevel();
  const menuId = getAdminMenuId(path);

  if (loggedIn && isAdminUser() && !canAccessAdminMenu(menuId)) {
    return `
      <section class="admin-state admin-state--denied">
        <h2>접근 제한</h2>
        <p><code>${esc(path)}</code> · 부마스터는 이 메뉴에 접근할 수 없습니다.</p>
        <p class="admin-state__hint">권한 설정·시스템 설정·운영값 직접 수정 메뉴는 마스터 전용입니다.</p>
        <a href="#/admin" class="btn btn--secondary btn--sm" data-a28-nav="/admin">← 운영 홈</a>
      </section>`;
  }

  return `
    <section class="admin-state admin-state--denied">
      <h2>운영자 전용</h2>
      <p><code>${esc(path)}</code> · admin 역할 세션이 필요합니다.</p>
      <p class="admin-state__hint">
        ${
          loggedIn
            ? `현재: ${esc(user?.email || '—')} · 운영자 권한 없음`
            : '로그인 후 운영자(admin) 역할이 있어야 합니다.'
        }
      </p>
      <p class="mypage-note">Dev: <code>${esc(adminAccount.email)}</code> / password · 마스터: jetty@naver.com</p>
      <button type="button" class="btn btn--primary" data-action="dev-login-admin">Dev·운영 로그인</button>
      <a href="#/admin" class="btn btn--secondary btn--sm" data-a28-nav="/admin">← 운영 홈</a>
    </section>`;
}

/** 운영 홈 상단 배지 */
export function renderAdminRoleBadge() {
  const level = getCurrentAdminLevel();
  if (!level) return '';
  const label = ADMIN_LEVEL_LABELS[level] || level;
  const cls = level === 'master' ? 'admin-role-badge--master' : 'admin-role-badge--sub';
  return `<span class="admin-role-badge ${cls}">${esc(label)}</span>`;
}

export { isMasterAdmin };
