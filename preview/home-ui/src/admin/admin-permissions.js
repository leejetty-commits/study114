/**
 * A28-08 — 관리자 권한 (마스터/부마스터)
 * PHP AdminRoleService와 이메일 목록 동기화
 */

import { getAuthUser } from '../auth-session.js';

export const ADMIN_LEVEL = {
  MASTER: 'master',
  SUB_MASTER: 'sub_master',
};

/** @type {readonly string[]} */
export const MASTER_EMAILS = ['jetty@naver.com'];

/** @type {readonly string[]} */
export const SUB_MASTER_EMAILS = ['ops@dev.local', 'ops2@dev.local', 'ops3@dev.local'];

/** 부마스터 접근 금지 메뉴 id */
export const SUB_MASTER_BLOCKED_MENUS = ['permissions', 'settings', 'system'];

/** @param {string} [email] */
export function resolveAdminLevel(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return null;
  if (MASTER_EMAILS.includes(e)) return ADMIN_LEVEL.MASTER;
  if (SUB_MASTER_EMAILS.includes(e) || e.endsWith('@dev.local')) return ADMIN_LEVEL.SUB_MASTER;
  return ADMIN_LEVEL.SUB_MASTER;
}

export function getCurrentAdminLevel() {
  const user = getAuthUser();
  if (!user || user.role_type !== 'admin') return null;
  return resolveAdminLevel(user.email);
}

export function isMasterAdmin() {
  return getCurrentAdminLevel() === ADMIN_LEVEL.MASTER;
}

/** @param {string} menuId */
export function canAccessAdminMenu(menuId) {
  const level = getCurrentAdminLevel();
  if (!level) return false;
  if (level === ADMIN_LEVEL.MASTER) return true;
  return !SUB_MASTER_BLOCKED_MENUS.includes(menuId);
}

/** @param {'strong'|'exposure'|string} kind */
export function canPerformAdminAction(kind) {
  const level = getCurrentAdminLevel();
  if (!level) return false;
  if (level === ADMIN_LEVEL.MASTER) return true;
  if (kind === 'strong') return false;
  return ['exposure', 'memo', 'view'].includes(kind);
}

export const ADMIN_LEVEL_LABELS = {
  master: '마스터',
  sub_master: '부마스터',
};
