/**
 * Study114 / 우동공과 — 유틸·메인 GNB SSOT
 * home-ui / search-ui / study-room-ui / tutor-ui 공통
 */

import {
  AUTH_UI_BASE,
  HOME_UI_BASE,
  STUDY_ROOM_REGISTER_URL,
  TUTOR_REGISTER_URL,
  searchUiUrl,
  supportUiUrl,
  resolveGnbLink,
} from './preview-links.js';

/** @typedef {'guest' | 'parent' | 'study_room' | 'tutor'} NavRole */

/**
 * 유틸 메뉴
 * - 비로그인: 이용안내 · 로그인 · 회원가입
 * - 로그인: 이용안내 · 쪽지함 · 최근열람 · 마이페이지 · 로그아웃
 * 지역선택·고객센터는 유틸에 두지 않음
 */
export const UTIL_MENU = {
  guest: [
    { id: 'guide', label: '이용안내', action: 'util-guide' },
    { id: 'login', label: '로그인', href: `${AUTH_UI_BASE}/#/login` },
    { id: 'signup', label: '회원가입', href: `${AUTH_UI_BASE}/#/signup/terms`, emphasis: true },
  ],
  loggedIn: [
    { id: 'guide', label: '이용안내', action: 'util-guide' },
    { id: 'messages', label: '쪽지함', action: 'util-messages' },
    { id: 'recent', label: '최근열람', action: 'util-recent' },
    { id: 'mypage', label: '마이페이지', action: 'util-mypage' },
    { id: 'logout', label: '로그아웃', action: 'util-logout' },
  ],
};

/**
 * 메인 GNB 순서 고정 (이용안내는 GNB에서 제외 → 유틸만)
 */
export const GNB_MAIN = [
  { id: 'home', label: '홈' },
  { id: 'find_room', label: '공부방찾기' },
  { id: 'find_tutor', label: '과외쌤찾기' },
  { id: 'student_parent', label: '학생찾기' },
  { id: 'register_room', label: '공부방상세등록' },
  { id: 'register_tutor', label: '과외쌤상세등록' },
  { id: 'support', label: '고객센터' },
];

/**
 * 역할별 GNB — 노출 유지, limited = 비활성(muted)
 * guest/parent: 전체 활성
 * study_room: 과외쌤찾기·과외쌤상세등록 limited
 * tutor: 공부방찾기·공부방상세등록 limited
 *
 * @type {Record<NavRole, Record<string, 'show' | 'limited' | 'hide'>>}
 */
export const GNB_VISIBILITY = {
  guest: {
    home: 'show',
    find_room: 'show',
    find_tutor: 'show',
    student_parent: 'show',
    register_room: 'show',
    register_tutor: 'show',
    support: 'show',
  },
  parent: {
    home: 'show',
    find_room: 'show',
    find_tutor: 'show',
    student_parent: 'show',
    register_room: 'show',
    register_tutor: 'show',
    support: 'show',
  },
  study_room: {
    home: 'show',
    find_room: 'show',
    find_tutor: 'limited',
    student_parent: 'show',
    register_room: 'show',
    register_tutor: 'limited',
    support: 'show',
  },
  tutor: {
    home: 'show',
    find_room: 'limited',
    find_tutor: 'show',
    student_parent: 'show',
    register_room: 'limited',
    register_tutor: 'show',
    support: 'show',
  },
};

export const GNB_MUTED_TITLE = '현재 역할에서는 이용할 수 없습니다';

/**
 * @param {{ role_type?: string } | null | undefined} user
 * @returns {NavRole}
 */
export function navRoleFromAuthUser(user) {
  if (!user) return 'guest';
  if (user.role_type === 'study_room_owner') return 'study_room';
  if (user.role_type === 'tutor') return 'tutor';
  if (user.role_type === 'admin') return 'parent';
  return 'parent';
}

/**
 * @param {{ role_type?: string } | null | undefined} user
 * @returns {string} home hash path
 */
export function roleHomeHashPath(user) {
  if (!user) return '/guest';
  if (user.role_type === 'study_room_owner') return '/study-room';
  if (user.role_type === 'tutor') return '/tutor';
  if (user.role_type === 'admin') return '/admin';
  return '/parent';
}

/**
 * home-ui 딥링크 URL.
 * 고객센터·마이페이지 등은 pathname으로 연다 — 등록/검색 SPA에서 `/#/path`로 이동 시
 * 리다이렉트 때문에 fragment가 떨어져 `#/guest`로 떨어지는 문제를 막는다.
 * (home-ui bootstrap*Route가 pathname → hash로 정규화)
 *
 * @param {string} hashPath e.g. `/support/guide`
 */
export function homeHashUrl(hashPath) {
  const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  const pathDeep =
    p === '/support' ||
    p.startsWith('/support/') ||
    p === '/mypage' ||
    p.startsWith('/mypage/') ||
    p === '/messages' ||
    p.startsWith('/messages/') ||
    p === '/policy' ||
    p.startsWith('/policy/') ||
    p === '/library' ||
    p.startsWith('/library/') ||
    p === '/admin' ||
    p.startsWith('/admin/');
  if (pathDeep) {
    return `${HOME_UI_BASE}${p}`;
  }
  return `${HOME_UI_BASE}/#${p}`;
}

export {
  AUTH_UI_BASE,
  HOME_UI_BASE,
  STUDY_ROOM_REGISTER_URL,
  TUTOR_REGISTER_URL,
  searchUiUrl,
  supportUiUrl,
  resolveGnbLink,
};
