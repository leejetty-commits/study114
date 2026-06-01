import { AUTH_UI_BASE } from './data.js';
import { MENU_EXCLUDED_PHASE1 } from './policy.js';

/** @typedef {'guest' | 'parent' | 'study_room' | 'tutor'} NavRole */

/** 유틸 메뉴 — 6장 §3 */
export const UTIL_MENU = {
  guest: [
    { id: 'region', label: '지역선택', action: 'util-region' },
    { id: 'guide', label: '이용안내', action: 'util-guide' },
    { id: 'support', label: '고객센터', action: 'util-support' },
    { id: 'login', label: '로그인', href: `${AUTH_UI_BASE}/#/login`, external: true },
    { id: 'signup', label: '회원가입', href: `${AUTH_UI_BASE}/#/signup/terms`, external: true, emphasis: true },
  ],
  loggedIn: [
    { id: 'region', label: '지역선택', action: 'util-region' },
    { id: 'messages', label: '쪽지함', action: 'util-messages' },
    { id: 'recent', label: '최근열람', action: 'util-recent' },
    { id: 'mypage', label: '마이페이지', action: 'util-mypage' },
    { id: 'logout', label: '로그아웃', action: 'util-logout' },
  ],
};

/** 메인 GNB — 6장 §4 (퀵매칭·앱·자료실 제외) */
export const GNB_MAIN = [
  { id: 'find_room', label: '공부방찾기' },
  { id: 'find_tutor', label: '과외쌤찾기' },
  { id: 'student_parent', label: '학생/학부모' },
  { id: 'register_room', label: '공부방등록' },
  { id: 'register_tutor', label: '과외쌤등록' },
  { id: 'safe_tutor', label: '안전과외' },
  { id: 'support', label: '고객센터' },
];

/** 9장 §13 + 6장 역할별 노출 (○ show · △ limited · ✕ hide) */
/** @type {Record<NavRole, Record<string, 'show' | 'limited' | 'hide'>>} */
export const GNB_VISIBILITY = {
  guest: {
    find_room: 'show',
    find_tutor: 'show',
    student_parent: 'show',
    register_room: 'hide',
    register_tutor: 'hide',
    safe_tutor: 'show',
    support: 'show',
  },
  parent: {
    find_room: 'show',
    find_tutor: 'show',
    student_parent: 'show',
    register_room: 'hide',
    register_tutor: 'hide',
    safe_tutor: 'show',
    support: 'show',
  },
  study_room: {
    find_room: 'limited',
    find_tutor: 'limited',
    student_parent: 'show',
    register_room: 'show',
    register_tutor: 'hide',
    safe_tutor: 'show',
    support: 'show',
  },
  tutor: {
    find_room: 'limited',
    find_tutor: 'show',
    student_parent: 'show',
    register_room: 'hide',
    register_tutor: 'show',
    safe_tutor: 'show',
    support: 'show',
  },
};

/** 프리뷰: 공부방 등록 UI */
export const STUDY_ROOM_REGISTER_URL = 'http://localhost:5175/#/register/basic';

/** GNB id → 프리뷰 동작 */
export const GNB_ACTION_HINTS = {
  find_room: '공부방 찾기 · 지역 리스트/지도',
  find_tutor: '과외쌤 찾기',
  student_parent: '학생 의뢰·탐색 (내부 카피: 학생 중심)',
  register_room: STUDY_ROOM_REGISTER_URL,
  register_tutor: '과외쌤 등록 플로우 (추후 tutor-ui)',
  safe_tutor: '안전과외 안내',
  support: '고객센터',
};

export function isMenuExcluded(id) {
  return MENU_EXCLUDED_PHASE1.includes(id);
}
