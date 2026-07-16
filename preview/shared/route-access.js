/**
 * 유료상품·등록 SPA 접근 가드 — GNB 노출 규칙과 동기화
 */

import {
  canAccessPlansHub,
  canAccessRegisterRoom,
  canAccessRegisterTutor,
  homeHashUrl,
  navRoleFromAuthUser,
} from './site-nav-config.js';

/**
 * @param {{ role_type?: string } | null | undefined} user
 * @param {import('./site-nav-config.js').NavRole} [fallbackRole]
 */
export function resolveAccessNavRole(user, fallbackRole = 'guest') {
  if (user) return navRoleFromAuthUser(user);
  return fallbackRole || 'guest';
}

/** @param {import('./site-nav-config.js').NavRole} role */
function roleHomePath(role) {
  if (role === 'study_room') return '/study-room';
  if (role === 'tutor') return '/tutor';
  if (role === 'parent') return '/parent';
  return '/guest';
}

/**
 * @param {import('./site-nav-config.js').NavRole} role
 * @returns {{ ok: true } | { ok: false, redirect: string, message: string }}
 */
export function guardPlansAccess(role) {
  if (canAccessPlansHub(role)) return { ok: true };
  return {
    ok: false,
    redirect: '/support/faq',
    message: '유료상품은 공급자(공부방·과외쌤)용입니다. FAQ에서 안내를 확인하세요.',
  };
}

/**
 * @param {import('./site-nav-config.js').NavRole} role
 * @param {'room' | 'tutor'} kind
 * @returns {{ ok: true } | { ok: false, redirectUrl: string, message: string }}
 */
export function guardRegisterAccess(role, kind) {
  const allowed = kind === 'room' ? canAccessRegisterRoom(role) : canAccessRegisterTutor(role);
  if (allowed) return { ok: true };
  const label = kind === 'room' ? '공부방상세등록' : '과외쌤상세등록';
  return {
    ok: false,
    redirectUrl: homeHashUrl(roleHomePath(role)),
    message: `현재 역할에서는 ${label}을 이용할 수 없습니다. 역할 전환은 마이페이지 · 계정설정에서 진행하세요.`,
  };
}
