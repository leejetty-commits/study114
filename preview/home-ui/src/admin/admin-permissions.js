/**
 * A28-08 — 관리자 권한 (super_admin / sub_master)
 * 등급 정본: 세션·API의 admin_level (DB users.admin_level)
 */

import { getAuthUser } from '../auth-session.js';

export const ADMIN_LEVEL = {
  SUPER_ADMIN: 'super_admin',
  SUB_MASTER: 'sub_master',
  /** @deprecated */
  MASTER: 'super_admin',
};

/** 초기 발급 최고관리자 (시드) */
export const BOOTSTRAP_SUPER_ADMIN_EMAIL = 'jetty@naver.com';

/** @deprecated 표시용 · 등급은 DB */
export const MASTER_EMAILS = [BOOTSTRAP_SUPER_ADMIN_EMAIL];

/** 부마스터 접근 금지 메뉴 id */
export const SUB_MASTER_BLOCKED_MENUS = ['permissions', 'settings', 'system'];

/** @param {string} [adminLevel] 서버가 내려준 admin_level */
export function resolveAdminLevel(adminLevel) {
  const fromDb = String(adminLevel || '').trim().toLowerCase();
  if (fromDb === 'master') return ADMIN_LEVEL.SUPER_ADMIN;
  if (fromDb === ADMIN_LEVEL.SUPER_ADMIN || fromDb === ADMIN_LEVEL.SUB_MASTER) return fromDb;
  return null;
}

export function getCurrentAdminLevel() {
  const user = getAuthUser();
  if (!user) return null;
  const level = resolveAdminLevel(user.admin_level);
  if (level) return level;
  // 서버 AdminRoleService와 같게: admin 역할인데 등급이 비면 부마스터
  return user.role_type === 'admin' ? ADMIN_LEVEL.SUB_MASTER : null;
}

export function isSuperAdmin() {
  return getCurrentAdminLevel() === ADMIN_LEVEL.SUPER_ADMIN;
}

/** @deprecated use isSuperAdmin */
export function isMasterAdmin() {
  return isSuperAdmin();
}

/** @param {string} menuId */
export function canAccessAdminMenu(menuId) {
  const level = getCurrentAdminLevel();
  if (!level) return false;
  if (level === ADMIN_LEVEL.SUPER_ADMIN) return true;
  return !SUB_MASTER_BLOCKED_MENUS.includes(menuId);
}

/** @param {'strong'|'exposure'|string} kind */
export function canPerformAdminAction(kind) {
  const level = getCurrentAdminLevel();
  if (!level) return false;
  if (level === ADMIN_LEVEL.SUPER_ADMIN) return true;
  if (kind === 'strong') return false;
  return ['exposure', 'memo', 'view'].includes(kind);
}

export const ADMIN_LEVEL_LABELS = {
  super_admin: '최고관리자',
  sub_master: '부마스터',
  master: '최고관리자',
};
