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

/** @deprecated 개발 시드 표시용 */
export const SUB_MASTER_EMAILS = ['ops@dev.local', 'ops2@dev.local', 'ops3@dev.local'];

/** 부마스터 접근 금지 메뉴 id */
export const SUB_MASTER_BLOCKED_MENUS = ['permissions', 'settings', 'system'];

/** @param {string} [email] @param {string} [adminLevel] */
export function resolveAdminLevel(email, adminLevel) {
  const fromDb = String(adminLevel || '').trim().toLowerCase();
  if (fromDb === 'master') return ADMIN_LEVEL.SUPER_ADMIN;
  if (fromDb === ADMIN_LEVEL.SUPER_ADMIN || fromDb === ADMIN_LEVEL.SUB_MASTER) return fromDb;

  const e = String(email || '')
    .trim()
    .toLowerCase();
  if (!e) return null;
  if (e === BOOTSTRAP_SUPER_ADMIN_EMAIL) return ADMIN_LEVEL.SUPER_ADMIN;
  if (SUB_MASTER_EMAILS.includes(e) || e.endsWith('@dev.local')) return ADMIN_LEVEL.SUB_MASTER;
  return ADMIN_LEVEL.SUB_MASTER;
}

export function getCurrentAdminLevel() {
  const user = getAuthUser();
  if (!user || user.role_type !== 'admin') return null;
  return resolveAdminLevel(user.email, user.admin_level);
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
