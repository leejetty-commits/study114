/**
 * 유료상품·등록·마이페이지 접근 가드
 * — GNB 노출(메뉴 보임)과 실사용(폼/결제/운영)을 분리한다.
 */

import {
  canAccessPlansHub,
  canAccessPlansAccountRoutes,
  canAccessRegisterRoom,
  canAccessRegisterTutor,
  canAccessRegisterForms,
  homeHashUrl,
  navRoleFromAuthUser,
  AUTH_UI_BASE,
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
  if (role === 'admin') return '/guest';
  return '/guest';
}

/**
 * @param {string} [from]
 * @param {string} [action]
 */
export function loginUrl(from = 'site', action = '') {
  const q = new URLSearchParams({ from });
  if (action) q.set('action', action);
  return `${AUTH_UI_BASE}/#/login?${q}`;
}

export function signupUrl() {
  return `${AUTH_UI_BASE}/#/signup/terms`;
}

/**
 * 유료상품 허브 — guest는 메뉴만 보이고 실사용은 로그인 게이트.
 * parent 등은 FAQ로.
 * @param {import('./site-nav-config.js').NavRole} role
 * @returns {{ ok: true } | { ok: false, redirect?: string, message: string, mode?: 'login_gate'|'role_blocked' }}
 */
export function guardPlansAccess(role) {
  if (role === 'guest') {
    return {
      ok: false,
      message: '유료상품은 로그인 후 이용할 수 있습니다. 공부방·과외쌤 계정으로 로그인해 주세요.',
      mode: 'login_gate',
    };
  }
  if (canAccessPlansHub(role)) return { ok: true };
  return {
    ok: false,
    redirect: '/support/faq',
    message: '유료상품은 공급자(공부방·과외쌤)용입니다. FAQ에서 안내를 확인하세요.',
    mode: 'role_blocked',
  };
}

/**
 * 유료상품 path별 — guest 전 구간 잠금, 계정/결제는 공급자만.
 * @param {import('./site-nav-config.js').NavRole} role
 * @param {string} path
 * @returns {{ ok: true } | { ok: false, redirect?: string, message: string, mode?: 'login_gate'|'role_blocked' }}
 */
export function guardPlansPath(role, path) {
  const hub = guardPlansAccess(role);
  if (!hub.ok) return hub;

  const p = String(path || '/plans').split('?')[0];
  const accountPaths = new Set([
    '/plans/my',
    '/plans/history',
    '/plans/checkout',
    '/plans/result',
  ]);
  if (accountPaths.has(p) && !canAccessPlansAccountRoutes(role)) {
    return {
      ok: false,
      redirect: '/plans',
      message: '이 메뉴는 공급자(공부방·과외쌤) 로그인 후 이용할 수 있습니다.',
      mode: 'login_gate',
    };
  }
  return { ok: true };
}

/**
 * 등록 SPA — GNB 노출과 폼 실사용 분리.
 * guest: mode 'intro' (입력 폼 대신 소개/로그인 유도)
 * 공급자: mode 'form'
 * @param {import('./site-nav-config.js').NavRole} role
 * @param {'room' | 'tutor'} kind
 * @returns {{ ok: true, mode: 'form'|'intro' } | { ok: false, redirectUrl: string, message: string }}
 */
export function guardRegisterAccess(role, kind) {
  const menuOk = kind === 'room' ? canAccessRegisterRoom(role) : canAccessRegisterTutor(role);
  const label = kind === 'room' ? '공부방상세등록' : '과외쌤상세등록';

  if (!menuOk) {
    return {
      ok: false,
      redirectUrl: homeHashUrl(roleHomePath(role)),
      message: `현재 역할에서는 ${label}을 이용할 수 없습니다. 역할 전환은 마이페이지 · 계정설정에서 진행하세요.`,
    };
  }

  if (!canAccessRegisterForms(role, kind)) {
    return { ok: true, mode: 'intro' };
  }

  return { ok: true, mode: 'form' };
}

/**
 * 마이페이지·쪽지·등록관리 — 로그인 필수.
 * @param {boolean} loggedIn
 * @returns {{ ok: true } | { ok: false, loginHref: string, message: string }}
 */
export function guardMypageAccess(loggedIn) {
  if (loggedIn) return { ok: true };
  return {
    ok: false,
    loginHref: loginUrl('mypage'),
    message: '마이페이지·쪽지·등록관리는 로그인 후 이용할 수 있습니다.',
  };
}

/**
 * 역할 홈(#/parent|#/study-room|#/tutor) — 비로그인은 guest 홈만.
 * @param {'guest'|'parent'|'studyRoom'|'tutor'} screenKey
 * @param {boolean} loggedIn
 */
export function guardRoleHomeAccess(screenKey, loggedIn) {
  if (screenKey === 'guest') return { ok: true };
  if (loggedIn) return { ok: true };
  return { ok: false, redirectHash: '#/guest' };
}

/**
 * 비로그인(guest)이 카드·레일에서 바로 열 수 있는 공개 path.
 * 마이페이지·쪽지·제출함·유료계정 등은 false → 로그인 게이트.
 * @param {string} [pathOrHash]
 */
export function isGuestPublicPath(pathOrHash) {
  let p = String(pathOrHash || '').trim();
  if (!p) return false;
  if (p.startsWith('http')) {
    try {
      p = new URL(p).hash || new URL(p).pathname;
    } catch {
      return false;
    }
  }
  p = p.replace(/^#/, '').split('?')[0];
  if (!p.startsWith('/')) p = `/${p}`;

  if (p === '/' || p === '/guest') return true;
  if (p.startsWith('/support')) return true;
  if (p.startsWith('/library')) return true;
  if (p.startsWith('/search')) return true;
  if (p.startsWith('/mypage') || p.startsWith('/messages') || p.startsWith('/admin')) return false;
  if (p.startsWith('/plans')) return false;
  if (p.startsWith('/parent') || p.startsWith('/study-room') || p.startsWith('/tutor')) return false;
  return false;
}
