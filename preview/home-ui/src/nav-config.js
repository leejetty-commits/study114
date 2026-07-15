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

/**
 * 유틸 메뉴
 * - 비로그인: 이용안내 · 로그인 · 회원가입 (고객센터·지역선택 제외)
 * - 로그인: 쪽지함 · 최근열람 · 마이페이지 · 로그아웃
 */
export const UTIL_MENU = {
  guest: [
    { id: 'guide', label: '이용안내', action: 'util-guide' },
    { id: 'login', label: '로그인', href: `${AUTH_UI_BASE}/#/login` },
    { id: 'signup', label: '회원가입', href: `${AUTH_UI_BASE}/#/signup/terms`, emphasis: true },
  ],
  loggedIn: [
    { id: 'messages', label: '쪽지함', action: 'util-messages' },
    { id: 'recent', label: '최근열람', action: 'util-recent' },
    { id: 'mypage', label: '마이페이지', action: 'util-mypage' },
    { id: 'logout', label: '로그아웃', action: 'util-logout' },
  ],
};

/**
 * 메인 GNB 순서 고정
 * 홈 → 공부방찾기 → 과외쌤찾기 → 학생찾기 → 공부방상세등록 → 과외쌤상세등록 → 고객센터 → 이용안내
 */
export const GNB_MAIN = [
  { id: 'home', label: '홈' },
  { id: 'find_room', label: '공부방찾기' },
  { id: 'find_tutor', label: '과외쌤찾기' },
  { id: 'student_parent', label: '학생찾기' },
  { id: 'register_room', label: '공부방상세등록' },
  { id: 'register_tutor', label: '과외쌤상세등록' },
  { id: 'support', label: '고객센터' },
  { id: 'guide', label: '이용안내' },
];

/**
 * 역할별 GNB — 노출은 유지, limited = 비활성(muted)
 * guest/parent(학생): 전체 활성
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
    guide: 'show',
  },
  parent: {
    home: 'show',
    find_room: 'show',
    find_tutor: 'show',
    student_parent: 'show',
    register_room: 'show',
    register_tutor: 'show',
    support: 'show',
    guide: 'show',
  },
  study_room: {
    home: 'show',
    find_room: 'show',
    find_tutor: 'limited',
    student_parent: 'show',
    register_room: 'show',
    register_tutor: 'limited',
    support: 'show',
    guide: 'show',
  },
  tutor: {
    home: 'show',
    find_room: 'limited',
    find_tutor: 'show',
    student_parent: 'show',
    register_room: 'limited',
    register_tutor: 'show',
    support: 'show',
    guide: 'show',
  },
};

/** 프리뷰: 검색 UI (13장) — 공부방 탭 기본 */
export const SEARCH_UI_URL = searchUiUrl('room');

export { AUTH_UI_BASE, HOME_UI_BASE, STUDY_ROOM_REGISTER_URL, TUTOR_REGISTER_URL, searchUiUrl, resolveGnbLink };

export function isMenuExcluded(id) {
  return MENU_EXCLUDED_PHASE1.includes(id);
}
