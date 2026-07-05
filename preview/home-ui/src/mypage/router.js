import {
  isMessagesDetailPath,
  getScreenIdForPath as getMessagesScreenId,
  screenTitle as messagesScreenTitle,
  normalizeMessagesPath,
  MESSAGES_BASE,
} from '../messages/router.js';
import { isStudentRegPath, parseStudentRegPath, studentRegScreenTitle } from '../student-reg/router.js';
import {
  isStudyRoomRegPath,
  parseStudyRoomRegPath,
  studyRoomRegScreenTitle,
} from '../study-room-reg/router.js';
import {
  isTutorRegPath,
  parseTutorRegPath,
  tutorRegScreenTitle,
} from '../tutor-reg/router.js';

/** 15장 P15-xx — 논리 화면 ID · hash 경로 (부록 A, 미확정) */

/** @typedef {'P15-01'|'P15-02'|'P15-03'|'P15-04'|'P15-05'|'P15-06'|'P15-07'|'P15-08'|'P15-09'|'P15-10'|'P15-11'|'P25-S10'} MypageScreenId */

/**
 * @typedef {object} MypageNavItem
 * @property {string} path
 * @property {string} label
 * @property {MypageScreenId} screenId
 * @property {Array<'parent'|'study_room'|'tutor'>} [roles] — 미설정=전 역할
 */

/** @type {MypageNavItem[]} */
export const MYPAGE_NAV = [
  { path: '/mypage/home', label: '내 활동 홈', screenId: 'P15-01', emphasis: ['parent'] },
  { path: '/mypage/registrations', label: '내 등록', screenId: 'P15-02', emphasis: ['study_room', 'tutor'] },
  { path: '/mypage/wishlist', label: '찜', screenId: 'P15-06', emphasis: ['parent'], roles: ['parent'] },
  { path: '/mypage/recent', label: '최근열람', screenId: 'P15-07' },
  { path: '/mypage/student-review', label: '학생 검토함', screenId: 'P25-S10', emphasis: ['study_room', 'tutor'], roles: ['study_room', 'tutor'] },
  { path: '/mypage/messages', label: '쪽지', screenId: 'P15-08' },
  { path: '/mypage/plans', label: '유료서비스', screenId: 'P15-09', emphasis: ['study_room', 'tutor'] },
  { path: '/mypage/account', label: '계정/설정', screenId: 'P15-11' },
];

/** @type {Record<string, MypageScreenId>} */
export const MYPAGE_PATH_TO_SCREEN = {
  '/mypage/home': 'P15-01',
  '/mypage/registrations': 'P15-02',
  '/mypage/registrations/students': 'P15-03',
  '/mypage/registrations/study-rooms': 'P15-04',
  '/mypage/registrations/tutors': 'P15-05',
  '/mypage/wishlist': 'P15-06',
  '/mypage/recent': 'P15-07',
  '/mypage/student-review': 'P25-S10',
  '/mypage/messages': 'P15-08',
  '/mypage/plans': 'P15-09',
  '/mypage/submission-docs': 'P15-10',
  '/mypage/verification': 'P15-10',
  '/mypage/account': 'P15-11',
};

/** @deprecated 구 라우트 — P15-10 제출자료 상태 */
export const MYPAGE_LEGACY_ALIASES = {
  '/mypage/verification': '/mypage/submission-docs',
};

/** @param {string} hashPath hash without # e.g. /mypage/home */
export function normalizeMypagePath(hashPath) {
  let p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (MYPAGE_LEGACY_ALIASES[p]) p = MYPAGE_LEGACY_ALIASES[p];
  if (p === '/mypage' || p === '/mypage/') return null;
  if (isStudentRegPath(p)) return p;
  if (isStudyRoomRegPath(p)) return p;
  if (isTutorRegPath(p)) return p;
  if (normalizeMessagesPath(p)) return normalizeMessagesPath(p);
  return MYPAGE_PATH_TO_SCREEN[p] ? p : null;
}

/** @param {import('../state.js').HomeRole extends infer R ? R : never} role */
export function getDefaultMypagePath(role) {
  if (role === 'study_room') return '/mypage/registrations/study-rooms';
  if (role === 'tutor') return '/mypage/registrations/tutors';
  return '/mypage/home';
}

/** @param {string} path */
export function getScreenIdForPath(path) {
  const reg = parseStudentRegPath(path);
  if (reg) return reg.screenId;
  const sr = parseStudyRoomRegPath(path);
  if (sr) return sr.screenId;
  const tr = parseTutorRegPath(path);
  if (tr) return tr.screenId;
  if (path === MESSAGES_BASE || isMessagesDetailPath(path)) return getMessagesScreenId(path);
  return MYPAGE_PATH_TO_SCREEN[path] || 'P15-01';
}

/** @param {MypageScreenId} screenId */
export function screenTitle(screenId, path) {
  if (path) {
    const reg = parseStudentRegPath(path);
    if (reg) return studentRegScreenTitle(reg.screenId);
    const sr = parseStudyRoomRegPath(path);
    if (sr) return studyRoomRegScreenTitle(sr.screenId);
    const tr = parseTutorRegPath(path);
    if (tr) return tutorRegScreenTitle(tr.screenId);
    if (path === MESSAGES_BASE || isMessagesDetailPath(path)) {
      return messagesScreenTitle(getMessagesScreenId(path));
    }
  }
  const map = {
    'P15-01': '마이페이지 홈',
    'P15-02': '내 등록',
    'P15-03': '자녀(학생) 목록',
    'P15-04': '공부방 목록',
    'P15-05': '과외 프로필',
    'P15-06': '찜 목록',
    'P15-07': '최근열람',
    'P15-08': '쪽지',
    'P15-09': '유료서비스',
    'P15-10': '제출자료 상태',
    'P15-11': '계정/설정',
    'P25-S10': '학생 검토함',
  };
  return map[screenId] || '마이페이지';
}
