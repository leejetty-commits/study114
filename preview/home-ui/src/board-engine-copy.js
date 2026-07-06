/**
 * 23장 — 게시판 엔진 정책 copy (Board Engine SSOT)
 * Notion: 23장-게시판 엔진·GNU 커뮤니티·SSO (2026-07-07 확장)
 * 로컬: docs/internal/23-board-community-integration-draft.md
 *
 * 상위 개념 = 게시판 엔진. `library` 는 하위 다운로드형 boardKey.
 */

/** @typedef {'operational'|'download'|'upload'|'curation'|'external'} BoardType */
/** @typedef {'read'|'download'|'write'|'comment'|'upload'|'edit_own'|'delete_own'|'moderate'} BoardAction */
/** @typedef {'guest'|'member'|'demand'|'supply-room'|'supply-tutor'|'verified'|'admin'} BoardRole */
/** @typedef {'public'|'login'|'role'} BoardVisibility */

export const BOARD_ENGINE_LOCK = {
  oneLiner:
    'Study114 안의 게시판 엔진은 공지·FAQ·가이드·다운로드·제출·공유를 boardKey별 권한으로 운영한다. GNU 커뮤니티와 콘텐츠는 공유하지 않는다.',
  topConcept: '게시판 엔진',
  libraryPosition: '「자료실」은 게시판 엔진 안의 다운로드형 boardKey 묶음에 대한 사용자-facing 명칭 후보다.',
};

/** @type {Record<BoardType, { label: string; desc: string }>} */
export const BOARD_TYPES = {
  operational: { label: '운영형', desc: '운영자 발행 · 공지·FAQ·가이드' },
  download: { label: '다운로드형', desc: 'PDF·양식·체크리스트 · 썸네일·다운로드' },
  upload: { label: '권한형 업로드', desc: '특정 역할 write/upload · 제출·사례 공유' },
  curation: { label: '큐레이션형', desc: '운영 선별 노출 · 추천 팁' },
  external: { label: '외부 커뮤니티', desc: 'GNU · 별도 DB · SSO만 연결' },
};

/** @type {BoardAction[]} */
export const BOARD_PERMISSION_AXES = [
  'read',
  'download',
  'write',
  'comment',
  'upload',
  'edit_own',
  'delete_own',
  'moderate',
];

/**
 * 프리뷰 nav role → 23장 board role
 * @param {string} navRole guest|parent|study_room|tutor
 * @returns {BoardRole}
 */
export function mapNavRoleToBoardRole(navRole) {
  if (navRole === 'parent') return 'demand';
  if (navRole === 'study_room') return 'supply-room';
  if (navRole === 'tutor') return 'supply-tutor';
  if (navRole === 'guest') return 'guest';
  return 'member';
}

/**
 * @typedef {Object} BoardPolicy
 * @property {string} boardKey
 * @property {string} label
 * @property {BoardType} boardType
 * @property {string} [userFacingMenu] 사용자-facing 메뉴명 후보
 * @property {BoardVisibility} visibility
 * @property {BoardRole[]} readRoles
 * @property {BoardRole[]} downloadRoles
 * @property {BoardRole[]} writeRoles
 * @property {boolean} allowComment
 * @property {boolean} allowUpload
 * @property {boolean} requireReview
 * @property {'phase1'|'phase2'} phase
 * @property {string} [routeHint]
 * @property {string} [ownerChapter]
 */

/** @type {BoardPolicy[]} */
export const BOARD_REGISTRY = [
  {
    boardKey: 'notice',
    label: '공지',
    boardType: 'operational',
    userFacingMenu: '고객센터',
    visibility: 'public',
    readRoles: ['guest', 'member', 'demand', 'supply-room', 'supply-tutor'],
    downloadRoles: [],
    writeRoles: ['admin'],
    allowComment: false,
    allowUpload: false,
    requireReview: false,
    phase: 'phase1',
    routeHint: '#/support/notice',
    ownerChapter: '17',
  },
  {
    boardKey: 'faq',
    label: 'FAQ',
    boardType: 'operational',
    userFacingMenu: '고객센터',
    visibility: 'public',
    readRoles: ['guest', 'member', 'demand', 'supply-room', 'supply-tutor'],
    downloadRoles: [],
    writeRoles: ['admin'],
    allowComment: false,
    allowUpload: false,
    requireReview: false,
    phase: 'phase1',
    routeHint: '#/support/faq',
    ownerChapter: '17',
  },
  {
    boardKey: 'safe-guide',
    label: '안전 가이드',
    boardType: 'operational',
    userFacingMenu: '안전과외',
    visibility: 'public',
    readRoles: ['guest', 'member', 'demand', 'supply-room', 'supply-tutor'],
    downloadRoles: [],
    writeRoles: ['admin'],
    allowComment: false,
    allowUpload: false,
    requireReview: false,
    phase: 'phase1',
    routeHint: '#/support/safe',
    ownerChapter: '17',
  },
  {
    boardKey: 'policy-log',
    label: '정책 변경 이력',
    boardType: 'operational',
    userFacingMenu: '정책',
    visibility: 'public',
    readRoles: ['guest', 'member', 'demand', 'supply-room', 'supply-tutor'],
    downloadRoles: [],
    writeRoles: ['admin'],
    allowComment: false,
    allowUpload: false,
    requireReview: false,
    phase: 'phase2',
    routeHint: '#/policy/*',
    ownerChapter: '26',
  },
  {
    boardKey: 'library',
    label: '자료·다운로드',
    boardType: 'download',
    userFacingMenu: '자료실',
    visibility: 'login',
    readRoles: ['member', 'demand', 'supply-room', 'supply-tutor'],
    downloadRoles: ['member', 'demand', 'supply-room', 'supply-tutor'],
    writeRoles: ['admin'],
    allowComment: false,
    allowUpload: false,
    requireReview: false,
    phase: 'phase1',
    routeHint: '#/library',
    ownerChapter: '23',
  },
  {
    boardKey: 'library-template',
    label: '양식·체크리스트',
    boardType: 'download',
    userFacingMenu: '자료실',
    visibility: 'login',
    readRoles: ['member', 'demand', 'supply-room', 'supply-tutor'],
    downloadRoles: ['member', 'demand', 'supply-room', 'supply-tutor'],
    writeRoles: ['admin'],
    allowComment: false,
    allowUpload: false,
    requireReview: false,
    phase: 'phase1',
    routeHint: '#/library/templates',
    ownerChapter: '23',
  },
  {
    boardKey: 'library-guide-pdf',
    label: '가이드 PDF',
    boardType: 'download',
    userFacingMenu: '자료실',
    visibility: 'public',
    readRoles: ['guest', 'member', 'demand', 'supply-room', 'supply-tutor'],
    downloadRoles: ['member', 'demand', 'supply-room', 'supply-tutor'],
    writeRoles: ['admin'],
    allowComment: false,
    allowUpload: false,
    requireReview: false,
    phase: 'phase1',
    routeHint: '#/library/guides',
    ownerChapter: '23',
  },
  {
    boardKey: 'submission',
    label: '제출·업로드',
    boardType: 'upload',
    userFacingMenu: '제출함',
    visibility: 'role',
    readRoles: ['demand', 'supply-room', 'supply-tutor', 'admin'],
    downloadRoles: ['admin'],
    writeRoles: ['demand', 'supply-room', 'supply-tutor'],
    allowComment: false,
    allowUpload: true,
    requireReview: true,
    phase: 'phase1',
    routeHint: '#/mypage/submission-board',
    ownerChapter: '23',
  },
  {
    boardKey: 'showcase',
    label: '사례 공유',
    boardType: 'curation',
    userFacingMenu: '사례',
    visibility: 'role',
    readRoles: ['member', 'demand', 'supply-room', 'supply-tutor'],
    downloadRoles: ['member', 'demand', 'supply-room', 'supply-tutor'],
    writeRoles: ['supply-room', 'supply-tutor'],
    allowComment: true,
    allowUpload: true,
    requireReview: true,
    phase: 'phase2',
    routeHint: '후순위',
    ownerChapter: '23',
  },
];

/** @param {string} boardKey */
export function getBoardPolicy(boardKey) {
  return BOARD_REGISTRY.find((b) => b.boardKey === boardKey) || null;
}

/** @param {BoardType} type */
export function listBoardsByType(type) {
  return BOARD_REGISTRY.filter((b) => b.boardType === type);
}

/**
 * @param {string} boardKey
 * @param {BoardAction} action
 * @param {BoardRole} role
 */
export function canBoardAction(boardKey, action, role) {
  const policy = getBoardPolicy(boardKey);
  if (!policy) return false;
  if (action === 'read') return policy.readRoles.includes(role);
  if (action === 'download') return policy.downloadRoles.includes(role);
  if (action === 'write' || action === 'upload') return policy.writeRoles.includes(role);
  if (action === 'comment') return policy.allowComment && policy.readRoles.includes(role);
  if (action === 'moderate') return role === 'admin';
  return false;
}

/** @param {BoardPolicy} policy @param {BoardRole} role */
export function getBoardVisibilityBadge(policy, role) {
  if (policy.visibility === 'public') return '공개';
  if (policy.visibility === 'login' && role === 'guest') return '로그인 필요';
  if (policy.visibility === 'role' && !policy.readRoles.includes(role)) return '역할 제한';
  return null;
}
