import {
  AUTH_UI_BASE,
  HOME_UI_BASE,
  STUDY_ROOM_REGISTER_URL,
  TUTOR_REGISTER_URL,
  searchUiUrl,
  resolveGnbLink,
} from '../../shared/preview-links.js';
import { MENU_EXCLUDED_PHASE1 } from './policy.js';
/** @typedef {'guest' | 'parent' | 'study_room' | 'tutor'} NavRole */

/** 유틸 메뉴 — 6장 §6 */
export const UTIL_MENU = {
  guest: [
    { id: 'region', label: '지역선택', action: 'util-region' },
    { id: 'guide', label: '이용안내', action: 'util-guide' },
    { id: 'library', label: '자료실', action: 'util-library' },
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

/** 메인 GNB — 6장 §7 (퀵매칭·안전과외 독립·앱·자료실 제외) */
export const GNB_MAIN = [
  { id: 'find_room', label: '공부방찾기' },
  { id: 'find_tutor', label: '과외쌤찾기' },
  { id: 'student_parent', label: '학생/학부모' },
  { id: 'register_room', label: '공부방등록' },
  { id: 'register_tutor', label: '과외쌤등록' },
  { id: 'support', label: '고객센터' },
];

/** 9장 §13 + 6장 역할별 노출 (○ show · △ limited · ✕ hide) */
/** @type {Record<NavRole, Record<string, 'show' | 'limited' | 'hide'>>} */
export const GNB_VISIBILITY = {
  guest: {
    find_room: 'show',
    find_tutor: 'show',
    student_parent: 'hide',
    register_room: 'hide',
    register_tutor: 'hide',
    support: 'show',
  },
  parent: {
    find_room: 'show',
    find_tutor: 'show',
    student_parent: 'hide',
    register_room: 'hide',
    register_tutor: 'hide',
    support: 'show',
  },
  study_room: {
    find_room: 'show',
    find_tutor: 'hide',
    student_parent: 'show',
    register_room: 'show',
    register_tutor: 'hide',
    support: 'show',
  },
  tutor: {
    find_room: 'hide',
    find_tutor: 'show',
    student_parent: 'show',
    register_room: 'hide',
    register_tutor: 'show',
    support: 'show',
  },
};

/** 프리뷰: 검색 UI (13장) — 공부방 탭 기본 */
export const SEARCH_UI_URL = searchUiUrl('room');

export { AUTH_UI_BASE, HOME_UI_BASE, STUDY_ROOM_REGISTER_URL, TUTOR_REGISTER_URL, searchUiUrl, resolveGnbLink };
export function isMenuExcluded(id) {
  return MENU_EXCLUDED_PHASE1.includes(id);
}
