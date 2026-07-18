import { DEV_ACCOUNTS, getAuthUser, isAdminUser, isLoggedIn } from '../auth-session.js';
import {
  canAccessAdminMenu,
  getCurrentAdminLevel,
  ADMIN_LEVEL,
  ADMIN_LEVEL_LABELS,
  isMasterAdmin,
  isSuperAdmin,
} from './admin-permissions.js';
import { getAdminMenuId } from './router.js';

/** @param {string} path */
export function canAccessAdminPath(path) {
  if (!isAdminUser()) return false;
  const user = getAuthUser();
  if (user?.must_change_password) return true; // gate 화면은 shell에서 처리
  const menuId = getAdminMenuId(path);
  return canAccessAdminMenu(menuId);
}

export function mustChangeAdminPassword() {
  const user = getAuthUser();
  return Boolean(isAdminUser() && user?.must_change_password);
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
  const cls =
    level === ADMIN_LEVEL.SUPER_ADMIN ? 'admin-role-badge--master' : 'admin-role-badge--sub';
  return `<span class="admin-role-badge ${cls}">${esc(label)}</span>`;
}

/** 임시 비밀번호 강제 변경 */
export function renderMustChangePasswordGate() {
  return `
    <section class="admin-state admin-state--must-change">
      <h2>비밀번호 변경 필요</h2>
      <p>임시 비밀번호로 발급된 계정입니다. 새 비밀번호를 설정한 뒤 운영 콘솔을 이용할 수 있습니다.</p>
      <form class="admin-must-change-form" data-form="admin-must-change-password" autocomplete="off">
        <label>현재(임시) 비밀번호
          <input type="password" name="current_password" required autocomplete="current-password" />
        </label>
        <label>새 비밀번호
          <input type="password" name="password" required autocomplete="new-password" />
        </label>
        <label>새 비밀번호 확인
          <input type="password" name="password_confirm" required autocomplete="new-password" />
        </label>
        <p class="a28-help">8~14자 · 영문+숫자+특수문자</p>
        <p class="admin-must-change-error" data-pw-error hidden></p>
        <button type="submit" class="btn btn--primary">비밀번호 변경</button>
      </form>
    </section>`;
}

export { isMasterAdmin, isSuperAdmin };
