/**
 * 23장 — 게시판 엔진 정책 copy (Board Engine SSOT)
 * Notion: 23장-게시판 엔진·GNU 커뮤니티·SSO (2026-07-07 확장 · §20 메뉴 기준)
 * 로컬: docs/internal/23-board-community-integration-draft.md
 * 관리자 생성: 33장 §12 프리셋 기반 · docs/internal/23-board-menu-boundary-audit.md
 *
 * 상위 개념 = 게시판 엔진. `library` 는 하위 다운로드형 boardKey.
 * 정적 정책(P26) · 서비스 화면 · GNU 커뮤니티와 경계를 섞지 않는다.
 */

/** @typedef {'operational'|'download'|'upload'|'curation'|'external'} BoardType */
/** @typedef {'read'|'download'|'write'|'comment'|'upload'|'edit_own'|'delete_own'|'moderate'} BoardAction */
/** @typedef {'guest'|'member'|'demand'|'supply-room'|'supply-tutor'|'verified'|'admin'} BoardRole */
/** @typedef {'public'|'login'|'role'} BoardVisibility */
/** @typedef {'support'|'library'|'policy-log'|'mypage-submission'|'phase2'} SectionOwner */
/** @typedef {'notice'|'faq'|'guide'|'library'|'submission'|'curation'} BoardPresetId */

export const BOARD_ENGINE_LOCK = {
  oneLiner:
    '우동공과 게시판은 공지·자주 묻는 질문·가이드·자료받기·제출·공유를 채널별 권한으로 운영합니다. 외부 커뮤니티와 콘텐츠를 공유하지 않습니다.',
  topConcept: '게시판 엔진',
  libraryPosition: '「자료실」은 게시판 안에서 파일을 내려받는 채널을 묶어 부르는 사용자용 이름입니다.',
  boundary:
    '운영·자료·제출 콘텐츠는 게시판에서, 약관은 정책 페이지에서, 탐색·입력·결제·쪽지는 각 서비스 화면에서 관리합니다. 회원 자유 게시글은 외부 커뮤니티와 분리합니다.',
};

/** 26장 정적 정책 slug — 게시판 생성으로 대체 금지 (33장 §12-4·12-5) */
export const STATIC_POLICY_RESERVED_SLUGS = [
  'terms',
  'privacy',
  'platform',
  'trust',
  'safety',
  'student-privacy',
  'reporting',
];

/** @type {Record<BoardType, { label: string; desc: string }>} */
export const BOARD_TYPES = {
  operational: { label: '운영형', desc: '운영자 발행 · 공지·자주 묻는 질문·가이드' },
  download: { label: '다운로드형', desc: 'PDF·양식·체크리스트 · 썸네일·다운로드' },
  upload: { label: '권한형 업로드', desc: '특정 역할 write/upload · 제출·사례 공유' },
  curation: { label: '큐레이션형', desc: '운영 선별 노출 · 추천 팁' },
  external: { label: '외부 커뮤니티', desc: 'GNU · 별도 DB · SSO만 연결' },
};

/**
 * 33장 §12 — 관리자 「채널 추가」프리셋 (자유 생성형 금지)
 * @type {Record<BoardPresetId, {
 *   label: string;
 *   boardType: BoardType;
 *   sectionOwners: SectionOwner[];
 *   defaultVisibility: BoardVisibility;
 *   allowWriteDefault: boolean;
 *   allowCommentDefault: boolean;
 *   allowUploadDefault: boolean;
 *   requireReviewDefault: boolean;
 *   guestWriteForbidden: boolean;
 *   lockedBoardKeys?: string[];
 * }>}
 */
export const BOARD_CREATE_PRESETS = {
  notice: {
    label: '운영 공지형',
    boardType: 'operational',
    sectionOwners: ['support'],
    defaultVisibility: 'public',
    allowWriteDefault: false,
    allowCommentDefault: false,
    allowUploadDefault: false,
    requireReviewDefault: false,
    guestWriteForbidden: true,
    lockedBoardKeys: ['notice'],
  },
  faq: {
    label: '자주 묻는 질문형',
    boardType: 'operational',
    sectionOwners: ['support'],
    defaultVisibility: 'public',
    allowWriteDefault: false,
    allowCommentDefault: false,
    allowUploadDefault: false,
    requireReviewDefault: false,
    guestWriteForbidden: true,
    lockedBoardKeys: ['faq'],
  },
  guide: {
    label: '가이드형',
    boardType: 'operational',
    sectionOwners: ['support', 'policy-log'],
    defaultVisibility: 'public',
    allowWriteDefault: false,
    allowCommentDefault: false,
    allowUploadDefault: false,
    requireReviewDefault: false,
    guestWriteForbidden: true,
    lockedBoardKeys: ['safe-guide', 'policy-log'],
  },
  library: {
    label: '자료실형',
    boardType: 'download',
    sectionOwners: ['library'],
    defaultVisibility: 'login',
    allowWriteDefault: false,
    allowCommentDefault: false,
    allowUploadDefault: false,
    requireReviewDefault: false,
    guestWriteForbidden: true,
    lockedBoardKeys: ['library', 'library-template', 'library-guide-pdf'],
  },
  submission: {
    label: '제출형',
    boardType: 'upload',
    sectionOwners: ['mypage-submission'],
    defaultVisibility: 'role',
    allowWriteDefault: true,
    allowCommentDefault: false,
    allowUploadDefault: true,
    requireReviewDefault: true,
    guestWriteForbidden: true,
    lockedBoardKeys: ['submission'],
  },
  curation: {
    label: '큐레이션형',
    boardType: 'curation',
    sectionOwners: ['phase2'],
    defaultVisibility: 'role',
    allowWriteDefault: true,
    allowCommentDefault: true,
    allowUploadDefault: true,
    requireReviewDefault: true,
    guestWriteForbidden: true,
    lockedBoardKeys: ['showcase'],
  },
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
 * @property {BoardPresetId} presetId
 * @property {SectionOwner} sectionOwner
 * @property {string} [userFacingMenu] 사용자-facing 메뉴명 후보
 * @property {BoardVisibility} visibility
 * @property {BoardRole[]} readRoles
 * @property {BoardRole[]} downloadRoles
 * @property {BoardRole[]} writeRoles
 * @property {boolean} allowComment
 * @property {boolean} allowUpload
 * @property {boolean} requireReview
 * @property {boolean} isGnuSeparated Study114 본체 보드 (GNU와 분리)
 * @property {boolean} [enabled] false면 2차 전까지 비활성
 * @property {'phase1'|'phase2'} phase
 * @property {string} routeSlug 실제 hash route (정적 /policy/{terms…} 와 충돌 금지)
 * @property {string} [routeHint] @deprecated routeSlug 별칭
 * @property {string} [ownerChapter]
 */

/** @type {BoardPolicy[]} */
export const BOARD_REGISTRY = [
  {
    boardKey: 'notice',
    label: '공지',
    boardType: 'operational',
    presetId: 'notice',
    sectionOwner: 'support',
    userFacingMenu: '공지사항',
    visibility: 'public',
    readRoles: ['guest', 'member', 'demand', 'supply-room', 'supply-tutor'],
    downloadRoles: [],
    writeRoles: ['admin'],
    allowComment: false,
    allowUpload: false,
    requireReview: false,
    isGnuSeparated: true,
    enabled: true,
    phase: 'phase1',
    routeSlug: '#/support/notice',
    routeHint: '#/support/notice',
    ownerChapter: '17',
  },
  {
    boardKey: 'faq',
    label: '자주 묻는 질문',
    boardType: 'operational',
    presetId: 'faq',
    sectionOwner: 'support',
    userFacingMenu: '자주 묻는 질문',
    visibility: 'public',
    readRoles: ['guest', 'member', 'demand', 'supply-room', 'supply-tutor'],
    downloadRoles: [],
    writeRoles: ['admin'],
    allowComment: false,
    allowUpload: false,
    requireReview: false,
    isGnuSeparated: true,
    enabled: true,
    phase: 'phase1',
    routeSlug: '#/support/faq',
    routeHint: '#/support/faq',
    ownerChapter: '17',
  },
  {
    boardKey: 'safe-guide',
    label: '안전 가이드',
    boardType: 'operational',
    presetId: 'guide',
    sectionOwner: 'support',
    userFacingMenu: '안전과외 가이드',
    visibility: 'public',
    readRoles: ['guest', 'member', 'demand', 'supply-room', 'supply-tutor'],
    downloadRoles: [],
    writeRoles: ['admin'],
    allowComment: false,
    allowUpload: false,
    requireReview: false,
    isGnuSeparated: true,
    enabled: true,
    phase: 'phase1',
    routeSlug: '#/support/safe',
    routeHint: '#/support/safe',
    ownerChapter: '17',
  },
  {
    boardKey: 'policy-log',
    label: '정책 변경 이력',
    boardType: 'operational',
    presetId: 'guide',
    sectionOwner: 'policy-log',
    userFacingMenu: '정책 변경 안내',
    visibility: 'public',
    readRoles: ['guest', 'member', 'demand', 'supply-room', 'supply-tutor'],
    downloadRoles: [],
    writeRoles: ['admin'],
    allowComment: false,
    allowUpload: false,
    requireReview: false,
    isGnuSeparated: true,
    enabled: true,
    phase: 'phase2',
    // 정적 P26 slug(terms/privacy/…)와 분리 — `#/policy/*` 와일드카드 금지
    routeSlug: '#/policy/changelog',
    routeHint: '#/policy/changelog',
    ownerChapter: '26',
  },
  {
    boardKey: 'library',
    label: '자료·다운로드',
    boardType: 'download',
    presetId: 'library',
    sectionOwner: 'library',
    userFacingMenu: '자료실',
    visibility: 'login',
    readRoles: ['member', 'demand', 'supply-room', 'supply-tutor'],
    downloadRoles: ['member', 'demand', 'supply-room', 'supply-tutor'],
    writeRoles: ['admin'],
    allowComment: false,
    allowUpload: false,
    requireReview: false,
    isGnuSeparated: true,
    enabled: true,
    phase: 'phase1',
    routeSlug: '#/library',
    routeHint: '#/library',
    ownerChapter: '23',
  },
  {
    boardKey: 'library-template',
    label: '양식·체크리스트',
    boardType: 'download',
    presetId: 'library',
    sectionOwner: 'library',
    userFacingMenu: '자료실',
    visibility: 'login',
    readRoles: ['member', 'demand', 'supply-room', 'supply-tutor'],
    downloadRoles: ['member', 'demand', 'supply-room', 'supply-tutor'],
    writeRoles: ['admin'],
    allowComment: false,
    allowUpload: false,
    requireReview: false,
    isGnuSeparated: true,
    enabled: true,
    phase: 'phase1',
    routeSlug: '#/library/templates',
    routeHint: '#/library/templates',
    ownerChapter: '23',
  },
  {
    boardKey: 'library-guide-pdf',
    label: '가이드 PDF',
    boardType: 'download',
    presetId: 'library',
    sectionOwner: 'library',
    userFacingMenu: '자료실',
    visibility: 'public',
    readRoles: ['guest', 'member', 'demand', 'supply-room', 'supply-tutor'],
    downloadRoles: ['member', 'demand', 'supply-room', 'supply-tutor'],
    writeRoles: ['admin'],
    allowComment: false,
    allowUpload: false,
    requireReview: false,
    isGnuSeparated: true,
    enabled: true,
    phase: 'phase1',
    routeSlug: '#/library/guides',
    routeHint: '#/library/guides',
    ownerChapter: '23',
  },
  {
    boardKey: 'submission',
    label: '제출·업로드',
    boardType: 'upload',
    presetId: 'submission',
    sectionOwner: 'mypage-submission',
    userFacingMenu: '제출함',
    visibility: 'role',
    // 수요자(parent)는 P15-10 상태 안내용 — 제출함 write/upload 대상 아님 (마이페이지 UX와 정합)
    readRoles: ['supply-room', 'supply-tutor', 'admin'],
    downloadRoles: ['admin'],
    writeRoles: ['supply-room', 'supply-tutor'],
    allowComment: false,
    allowUpload: true,
    requireReview: true,
    isGnuSeparated: true,
    enabled: true,
    phase: 'phase1',
    routeSlug: '#/mypage/submission-board',
    routeHint: '#/mypage/submission-board',
    ownerChapter: '23',
  },
  {
    boardKey: 'showcase',
    label: '사례 공유',
    boardType: 'curation',
    presetId: 'curation',
    sectionOwner: 'phase2',
    userFacingMenu: '사례',
    visibility: 'role',
    readRoles: ['member', 'demand', 'supply-room', 'supply-tutor'],
    downloadRoles: ['member', 'demand', 'supply-room', 'supply-tutor'],
    writeRoles: ['supply-room', 'supply-tutor'],
    allowComment: true,
    allowUpload: true,
    requireReview: true,
    isGnuSeparated: true,
    enabled: false,
    phase: 'phase2',
    routeSlug: '',
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

/** @param {SectionOwner} owner */
export function listBoardsBySection(owner) {
  return BOARD_REGISTRY.filter((b) => b.sectionOwner === owner);
}

/**
 * @param {string} boardKey
 * @param {BoardAction} action
 * @param {BoardRole} role
 */
export function canBoardAction(boardKey, action, role) {
  const policy = getBoardPolicy(boardKey);
  if (!policy || policy.enabled === false) return false;
  if (action === 'read') return policy.readRoles.includes(role);
  if (action === 'download') return policy.downloadRoles.includes(role);
  if (action === 'write' || action === 'upload') {
    if (role === 'guest') return false;
    return policy.writeRoles.includes(role);
  }
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

/**
 * 관리자 채널 생성 전 충돌 검사 (33장 §12-4)
 * @param {{ boardKey: string; routeSlug?: string; sectionOwner?: string }} input
 * @returns {{ ok: boolean; errors: string[] }}
 */
export function validateBoardChannelCreate(input) {
  const errors = [];
  const key = String(input.boardKey || '').trim();
  if (!key) errors.push('채널 식별값이 필요합니다.');
  if (BOARD_REGISTRY.some((b) => b.boardKey === key)) {
    errors.push(`채널 식별값 중복: ${key}`);
  }
  const slug = String(input.routeSlug || '')
    .replace(/^#/, '')
    .replace(/^\//, '');
  if (slug.startsWith('policy/')) {
    const policySlug = slug.split('/')[1];
    if (STATIC_POLICY_RESERVED_SLUGS.includes(policySlug)) {
      errors.push(`정적 정책 페이지와 충돌: /policy/${policySlug}`);
    }
  }
  if (!input.sectionOwner) {
    errors.push('소속 그룹 선택이 필요합니다.');
  }
  return { ok: errors.length === 0, errors };
}
