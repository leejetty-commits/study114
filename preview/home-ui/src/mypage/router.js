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
import {
  isSubmissionBoardPath,
  normalizeSubmissionBoardPath,
  parseSubmissionBoardPath,
  submissionBoardScreenTitle,
} from '../submission-board/submission-router.js';
import { isPaidPath, parsePaidPath, paidScreenTitle } from './paid-router.js';
import { getStudyRooms } from '../study-room-reg/store.js';
import { studyRoomHubPath, BASE as STUDY_ROOM_BASE } from '../study-room-reg/router.js';

/** 15장 P15-xx — 논리 화면 ID · hash 경로 (부록 A, 미확정) */

/** @typedef {'P15-01'|'P15-02'|'P15-03'|'P15-04'|'P15-05'|'P15-06'|'P15-07'|'P15-08'|'P15-09'|'P15-10'|'P15-11'|'P18-04'|'P18-05'|'P25-S10'|'P23-04'} MypageScreenId */

/**
 * @typedef {object} MypageNavItem
 * @property {string} path
 * @property {string} label
 * @property {Partial<Record<'parent'|'study_room'|'tutor', string>>} [labels] — 역할별 표시명(공부방 1차 명칭 정리)
 * @property {MypageScreenId} screenId
 * @property {string} [icon]
 * @property {Array<'parent'|'study_room'|'tutor'>} [roles] — 미설정=전 역할
 * @property {Array<'parent'|'study_room'|'tutor'>} [emphasis]
 */

/** @param {MypageNavItem} item @param {string} role */
export function mypageNavLabel(item, role) {
  return item.labels?.[role] || item.label;
}

/**
 * 공부방 모드 좌측 메뉴 순서:
 * 내 등록 → 쪽지·후기함 → 최근열람 → 찜한학생 → 구매이력 → 계정설정
 * (과외쌤·학부모 라벨은 기존 유지)
 * @type {MypageNavItem[]}
 */
export const MYPAGE_NAV = [
  { path: '/mypage/home', label: '마이페이지 홈', icon: '⌂', screenId: 'P15-01', emphasis: ['parent'], roles: ['parent'] },
  { path: '/mypage/registrations', label: '내 등록', icon: '✎', screenId: 'P15-02', emphasis: ['study_room', 'tutor'], roles: ['study_room', 'tutor'] },
  { path: '/mypage/messages', label: '쪽지·후기함', icon: '✉', screenId: 'P15-08' },
  { path: '/mypage/recent', label: '최근열람', icon: '◷', screenId: 'P15-07' },
  {
    path: '/mypage/student-review',
    label: '학생 검토함',
    labels: { study_room: '찜한학생' },
    icon: '☆',
    screenId: 'P25-S10',
    emphasis: ['study_room', 'tutor'],
    roles: ['study_room', 'tutor'],
  },
  { path: '/mypage/wishlist', label: '찜 목록', icon: '♡', screenId: 'P15-06', emphasis: ['parent'], roles: ['parent'] },
  {
    path: '/mypage/plans',
    label: '구매상품',
    labels: { study_room: '구매이력' },
    icon: '◌',
    screenId: 'P15-09',
    emphasis: ['study_room', 'tutor'],
    roles: ['study_room', 'tutor'],
  },
  { path: '/mypage/account', label: '계정설정', icon: '⚙', screenId: 'P15-11' },
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
  '/mypage/plans/my': 'P18-04',
  '/mypage/plans/history': 'P18-05',
  '/mypage/submission-docs': 'P15-10',
  '/mypage/submission-board': 'P23-04',
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
  const subBoard = normalizeSubmissionBoardPath(p);
  if (subBoard) return subBoard;
  if (isPaidPath(p)) return p;
  return MYPAGE_PATH_TO_SCREEN[p] ? p : null;
}

/** 공부방 대표(첫) 등록 허브 경로 — 없으면 목록 */
export function getStudyRoomEntryPath() {
  const rooms = getStudyRooms();
  if (rooms.length) return studyRoomHubPath(rooms[0].id);
  return STUDY_ROOM_BASE;
}

/** @param {import('../state.js').HomeRole extends infer R ? R : never} role */
export function getDefaultMypagePath(role) {
  if (role === 'study_room') return getStudyRoomEntryPath();
  if (role === 'tutor') return '/mypage/registrations';
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
  if (isSubmissionBoardPath(path)) return parseSubmissionBoardPath(path).screenId;
  const paid = parsePaidPath(path);
  if (paid) return paid;
  return MYPAGE_PATH_TO_SCREEN[path] || 'P15-01';
}

/** @param {MypageScreenId} screenId @param {string} [path] @param {string} [role] */
export function screenTitle(screenId, path, role) {
  if (path) {
    const reg = parseStudentRegPath(path);
    if (reg) return studentRegScreenTitle(reg.screenId);
    const sr = parseStudyRoomRegPath(path);
    if (sr) {
      if (sr.roomId) {
        const room = getStudyRooms().find((r) => r.id === sr.roomId);
        if (room?.study_room_name) return room.study_room_name;
      }
      return studyRoomRegScreenTitle(sr.screenId);
    }
    const tr = parseTutorRegPath(path);
    if (tr) return tutorRegScreenTitle(tr.screenId);
    if (path === MESSAGES_BASE || isMessagesDetailPath(path)) {
      return messagesScreenTitle(getMessagesScreenId(path));
    }
    if (isSubmissionBoardPath(path)) {
      return submissionBoardScreenTitle(parseSubmissionBoardPath(path).screenId, path);
    }
    const paidId = parsePaidPath(path);
    if (paidId) return paidScreenTitle(paidId);
  }
  const map = {
    'P15-01': '마이페이지 홈',
    'P15-02': '내 등록',
    'P15-03': '자녀(학생) 목록',
    'P15-04': '공부방 목록',
    'P15-05': '과외 프로필',
    'P15-06': '찜 목록',
    'P15-07': '최근열람',
    'P15-08': '쪽지·후기함',
    'P15-09': role === 'study_room' ? '구매이력' : '구매상품',
    'P18-04': role === 'study_room' ? '구매이력' : '구매상품',
    'P18-05': '구매내역',
    'P15-10': '제출자료 상태',
    'P23-04': '제출함',
    'P23-04a': '제출 작성',
    'P23-04b': '제출 상세',
    'P15-11': '계정설정',
    'P25-S10': role === 'study_room' ? '찜한학생' : '학생 검토함',
  };
  return map[screenId] || '마이페이지';
}
