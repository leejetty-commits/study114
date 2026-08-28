/**
 * Channel ACL — sourceBoardKey / boardKey 기준 런타임 권한
 * 정책: 소개(discover) · 글 목록 · 상세 · 작성 · 댓글 · 반응 · 다운로드 분리
 * concern-family 문서키 → 실제 boardKey `concern-parent`
 *
 * 자료실 파일 다운로드는 미구현. canDownload(library*) 는 항상 false.
 */

import {
  canBoardAction,
  getBoardPolicy,
  mapNavRoleToBoardRole,
} from './board-engine-copy.js';
import { loginUrl } from '../../shared/route-access.js';

/** @typedef {import('./board-engine-copy.js').BoardRole} BoardRole */

export const LIBRARY_FILE_DOWNLOAD_IMPLEMENTED = false;

/** @type {BoardRole[]} */
const ALL_ROLES = ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'admin'];
const LOGGED_IN = ['member', 'demand', 'supply-room', 'supply-tutor', 'admin'];
const PROVIDERS = ['supply-room', 'supply-tutor', 'admin'];
const DEMAND = ['demand', 'member', 'admin'];

/** 내부 정본. `concern-family`는 호환 별칭만. 별도 채널로 생성 금지. */
export const CANONICAL_CONCERN_PARENT = 'concern-parent';
export const BOARD_KEY_ALIASES = Object.freeze({ 'concern-family': CANONICAL_CONCERN_PARENT });

/** 문서 `concern-family` → 구현 키 `concern-parent` */
export function normalizeBoardKey(boardKey) {
  const key = String(boardKey || '').trim();
  return BOARD_KEY_ALIASES[key] || key;
}

/**
 * 채널명·공간 소개만 노출 (게시글 파생 정보 없음)
 * @type {Record<string, BoardRole[]>}
 */
const DISCOVER_ROLES = {
  notice: ALL_ROLES,
  faq: ALL_ROLES,
  'safe-guide': ALL_ROLES,
  library: LOGGED_IN,
  'library-template': LOGGED_IN,
  'library-guide-pdf': ALL_ROLES,
  submission: ['supply-tutor', 'admin'],
  'concern-director': ALL_ROLES,
  'concern-tutor': ALL_ROLES,
  'concern-parent': ALL_ROLES,
  'concern-solved': ALL_ROLES,
};

/**
 * 실제 글 목록(제목·요약·작성자·시각·ID)
 * @type {Record<string, BoardRole[]>}
 */
const LIST_ROLES = {
  notice: ALL_ROLES,
  faq: ALL_ROLES,
  'safe-guide': ALL_ROLES,
  library: LOGGED_IN,
  'library-template': LOGGED_IN,
  'library-guide-pdf': ALL_ROLES,
  submission: ['supply-tutor', 'admin'],
  'concern-director': PROVIDERS,
  'concern-tutor': PROVIDERS,
  'concern-parent': [...DEMAND, 'supply-room', 'supply-tutor'],
  'concern-solved': LOGGED_IN,
};

/**
 * 글 상세 본문
 * @type {Record<string, BoardRole[]>}
 */
const DETAIL_ROLES = {
  notice: ALL_ROLES,
  faq: ALL_ROLES,
  'safe-guide': ALL_ROLES,
  library: LOGGED_IN,
  'library-template': LOGGED_IN,
  'library-guide-pdf': ALL_ROLES,
  submission: ['supply-tutor', 'admin'],
  'concern-director': PROVIDERS,
  'concern-tutor': PROVIDERS,
  'concern-parent': [...DEMAND, 'supply-room', 'supply-tutor'],
  'concern-solved': LOGGED_IN,
};

/**
 * 새 글 작성
 * @type {Record<string, BoardRole[]>}
 */
const COMPOSE_ROLES = {
  notice: ['admin'],
  faq: ['admin'],
  'safe-guide': ['admin'],
  library: ['admin'],
  'library-template': ['admin'],
  'library-guide-pdf': ['admin'],
  submission: ['supply-tutor', 'admin'],
  'concern-director': ['supply-room'],
  'concern-tutor': ['supply-tutor'],
  'concern-parent': ['demand', 'member'],
  // 해결후기 작성·댓글: 기존값 유지 · 별도 최종 정책 확인 대상. 이번 작업에서 확대·축소 금지.
  'concern-solved': ['member', 'demand', 'supply-room', 'supply-tutor'],
};

/** 실파일 연결 전 library 계열 다운로드 역할 없음 */
const DOWNLOAD_ROLES = {
  submission: ['supply-tutor', 'admin'],
};

const CHANNEL_INTRO = {
  'concern-parent': {
    title: '학생/학부모 고민방',
    body: '공부방·과외 선택, 학습 루틴, 안전에 대한 고민을 나누는 공간입니다.',
    allowedRolesLabel: '학생·학부모',
  },
  'concern-director': {
    title: '공부방 고민방',
    body: '공부방 운영·모집·학부모 응대에 대한 고민을 나누는 공간입니다.',
    allowedRolesLabel: '공부방',
  },
  'concern-tutor': {
    title: '과외쌤 고민방',
    body: '프로필·첫 상담·수업 전환에 대한 고민을 나누는 공간입니다.',
    allowedRolesLabel: '과외쌤',
  },
  'concern-solved': {
    title: '해결후기',
    body: '바꿔보니 효과 있었던 경험과 운영 노하우를 나누는 공간입니다.',
    allowedRolesLabel: '로그인한 회원',
  },
  notice: {
    title: '공지사항',
    body: '우동공과 운영 공지를 안내하는 공간입니다.',
    allowedRolesLabel: '전체',
  },
  faq: {
    title: '자주 묻는 질문',
    body: '이용 중 자주 묻는 질문을 모아 둔 공간입니다.',
    allowedRolesLabel: '전체',
  },
  'safe-guide': {
    title: '안전과외 가이드',
    body: '선입금 주의·분쟁 예방 등 이용 안내를 제공하는 공간입니다.',
    allowedRolesLabel: '전체',
  },
  library: {
    title: '자료실',
    body: '학습·운영 참고 자료 목록을 안내하는 공간입니다. 실제 파일 다운로드는 아직 없습니다.',
    allowedRolesLabel: '로그인한 회원',
  },
  'library-template': {
    title: '양식·체크리스트',
    body: '양식·체크리스트 목록을 안내하는 공간입니다. 실제 파일 다운로드는 아직 없습니다.',
    allowedRolesLabel: '로그인한 회원',
  },
  'library-guide-pdf': {
    title: '가이드 PDF',
    body: '가이드 자료 목록을 안내하는 공간입니다. 실제 파일 다운로드는 아직 없습니다.',
    allowedRolesLabel: '전체 열람 · 다운로드 미구현',
  },
  submission: {
    title: '신뢰·증빙자료 제출',
    body: '과외쌤이 학력·경력 등 신뢰 증빙자료를 제출하는 공간입니다. 공개 자료실과는 다릅니다.',
    allowedRolesLabel: '과외쌤',
  },
};

/** @param {string} boardKey */
export function isConcernChannel(boardKey) {
  return normalizeBoardKey(boardKey).startsWith('concern-');
}

/** @param {string} navRole @returns {BoardRole} */
export function boardRoleFromNav(navRole) {
  if (navRole === 'admin') return 'admin';
  return mapNavRoleToBoardRole(navRole || 'guest');
}

/**
 * @param {BoardRole|string} role
 * @returns {BoardRole}
 */
export function resolveBoardRole(role) {
  const known = ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'verified', 'admin'];
  if (known.includes(role)) {
    return role === 'verified' ? 'member' : /** @type {BoardRole} */ (role);
  }
  return boardRoleFromNav(role);
}

/** @param {BoardRole[]} roles @param {BoardRole} boardRole */
function allows(roles, boardRole) {
  if (!roles) return false;
  return roles.includes(boardRole);
}

/** @param {string} boardKey */
export function getChannelIntro(boardKey) {
  const key = normalizeBoardKey(boardKey);
  return (
    CHANNEL_INTRO[key] || {
      title: key,
      body: '이 공간의 소개만 볼 수 있어요.',
      allowedRolesLabel: '',
    }
  );
}

/** @param {string} boardKey @param {BoardRole|string} role */
export function canDiscoverBoard(boardKey, role) {
  const key = normalizeBoardKey(boardKey);
  const boardRole = resolveBoardRole(role);
  const roles = DISCOVER_ROLES[key];
  if (roles) return allows(roles, boardRole);
  return canBoardAction(key, 'read', boardRole) || boardRole === 'guest';
}

/**
 * 실제 글 목록 권한 (제목·작성자 등 게시글 파생 정보)
 * @param {string} boardKey
 * @param {BoardRole|string} role
 */
export function canListBoard(boardKey, role) {
  const key = normalizeBoardKey(boardKey);
  const boardRole = resolveBoardRole(role);
  const roles = LIST_ROLES[key];
  if (roles) return allows(roles, boardRole);
  return canBoardAction(key, 'read', boardRole);
}

/**
 * 본문 full read
 * @param {string} boardKey
 * @param {BoardRole|string} role
 */
export function canReadBoardDetail(boardKey, role) {
  const key = normalizeBoardKey(boardKey);
  const boardRole = resolveBoardRole(role);
  const roles = DETAIL_ROLES[key];
  if (roles) return allows(roles, boardRole);
  return canBoardAction(key, 'read', boardRole);
}

/**
 * 글쓰기
 * @param {string} boardKey
 * @param {BoardRole|string} role
 */
export function canComposeBoard(boardKey, role) {
  const key = normalizeBoardKey(boardKey);
  const boardRole = resolveBoardRole(role);
  if (boardRole === 'guest') return false;
  const compose = COMPOSE_ROLES[key];
  if (compose) return allows(compose, boardRole);
  return canBoardAction(key, 'write', boardRole);
}

/**
 * 댓글
 * @param {string} boardKey
 * @param {BoardRole|string} role
 */
export function canCommentBoard(boardKey, role) {
  const key = normalizeBoardKey(boardKey);
  const boardRole = resolveBoardRole(role);
  if (boardRole === 'guest') return false;
  const policy = getBoardPolicy(key);
  if (policy && policy.allowComment === false) return false;
  if (COMPOSE_ROLES[key]) {
    if (key === 'concern-solved') {
      return canReadBoardDetail(key, boardRole) && canComposeBoard(key, boardRole);
    }
    return canComposeBoard(key, boardRole);
  }
  return canBoardAction(key, 'comment', boardRole);
}

/** 반응 — 댓글과 동일 축 */
export function canReactBoard(boardKey, role) {
  return canCommentBoard(boardKey, role);
}

/** 첨부 업로드 — submission 만. 자료실 실파일은 미구현. */
export function canUploadBoard(boardKey, role) {
  const key = normalizeBoardKey(boardKey);
  if (key !== 'submission') return false;
  return canComposeBoard(key, role);
}

/**
 * 채널 단위 삭제. concern 서버 삭제는 미구현.
 * 운영형(notice/faq/safe-guide)은 admin 만. 일반 댓글과 혼동하지 않음.
 */
export function canDeleteBoard(boardKey, role) {
  const key = normalizeBoardKey(boardKey);
  const boardRole = resolveBoardRole(role);
  if (boardRole === 'guest') return false;
  if (key === 'notice' || key === 'faq' || key === 'safe-guide') return boardRole === 'admin';
  if (key === 'submission') return canComposeBoard(key, role);
  return false;
}

/** 운영 검수·큐. 일반 댓글 작성과 별개. */
export function canModerateBoard(boardKey, role) {
  void boardKey;
  return resolveBoardRole(role) === 'admin';
}

/** 레거시 API 응답을 full 로 추정하면 안 되는 채널 */
export function isAccessFailClosed(boardKey) {
  const key = normalizeBoardKey(boardKey);
  return key.startsWith('concern-') || key === 'submission' || key === 'library' || key === 'library-template';
}

/** @param {string} boardKey @param {BoardRole|string} role */
export function canDownloadBoard(boardKey, role) {
  const key = normalizeBoardKey(boardKey);
  const boardRole = resolveBoardRole(role);
  if (boardRole === 'guest') return false;
  if (key === 'library' || key === 'library-template' || key === 'library-guide-pdf') {
    return LIBRARY_FILE_DOWNLOAD_IMPLEMENTED;
  }
  const roles = DOWNLOAD_ROLES[key];
  if (roles) return allows(roles, boardRole);
  return canBoardAction(key, 'download', boardRole);
}

/**
 * @param {string} boardKey
 * @param {BoardRole|string} role
 * @returns {{
 *   canDiscover: boolean,
 *   canList: boolean,
 *   canDetail: boolean,
 *   canCompose: boolean,
 *   canComment: boolean,
 *   canReact: boolean,
 *   canDownload: boolean,
 *   canUpload: boolean,
 *   canDelete: boolean,
 *   canModerate: boolean,
 *   access: 'full'|'intro'|'blocked'
 * }}
 */
export function getBoardAccess(boardKey, role) {
  const canDiscover = canDiscoverBoard(boardKey, role);
  const canList = canListBoard(boardKey, role);
  const canDetail = canReadBoardDetail(boardKey, role);
  const canCompose = canComposeBoard(boardKey, role);
  const canComment = canCommentBoard(boardKey, role);
  const canReact = canReactBoard(boardKey, role);
  const canDownload = canDownloadBoard(boardKey, role);
  const canUpload = canUploadBoard(boardKey, role);
  const canDelete = canDeleteBoard(boardKey, role);
  const canModerate = canModerateBoard(boardKey, role);
  let access = 'blocked';
  if (canList && canDetail) access = 'full';
  else if (canDiscover) access = 'intro';
  return {
    canDiscover,
    canList,
    canDetail,
    canCompose,
    canComment,
    canReact,
    canDownload,
    canUpload,
    canDelete,
    canModerate,
    access,
  };
}

/**
 * @param {string} boardKey
 * @param {string} [navRole]
 */
export function roleGateCopy(boardKey, navRole = 'guest') {
  const key = normalizeBoardKey(boardKey);
  const intro = getChannelIntro(key);
  const access = getBoardAccess(key, navRole);
  const boardRole = resolveBoardRole(navRole);

  if (boardRole === 'guest' || !navRole) {
    return {
      kind: 'guest',
      title: intro.title,
      body: `${intro.body} 이 공간의 소개만 볼 수 있어요. 로그인하면 역할에 맞는 글을 볼 수 있어요.`,
      roleLabel: intro.allowedRolesLabel,
    };
  }

  if (access.canDetail && !access.canCompose && isConcernChannel(key) && key !== 'concern-solved') {
    return {
      kind: 'readonly',
      title: intro.title,
      body: `${intro.body} 글은 읽을 수 있어요. 새 글·댓글·반응은 자기 역할 고민방에서만 남길 수 있어요.`,
      roleLabel: intro.allowedRolesLabel,
    };
  }

  if (access.access === 'intro') {
    return {
      kind: 'role',
      title: intro.title,
      body: `${intro.body} 이 공간의 소개만 볼 수 있어요. ${intro.allowedRolesLabel} 역할의 고민방을 이용해 주세요.`,
      roleLabel: intro.allowedRolesLabel,
    };
  }

  return {
    kind: 'role',
    title: intro.title,
    body: intro.body,
    roleLabel: intro.allowedRolesLabel,
  };
}

/** @param {string} boardKey @param {string} navRole */
export function permissionKindForBoard(boardKey, navRole) {
  const access = getBoardAccess(boardKey, navRole);
  if (access.access === 'full') {
    if (!access.canCompose && isConcernChannel(boardKey)) return 'readonly';
    return null;
  }
  if (navRole === 'guest' || !navRole) return 'guest';
  if (access.access === 'intro') return 'role';
  return navRole === 'guest' ? 'guest' : 'role';
}

/** @param {string} [from] */
export function boardLoginHref(from = 'community') {
  return loginUrl(from);
}

/**
 * guestFilter 정본: allow | intro_only | block
 * `summary_only` 는 DB·옛 seed 호환 별칭일 뿐이며 **게시글 제목·요약 공개가 아니다**.
 * 런타임은 항상 intro_only 로 정규화한다. (채널명·공간 소개만)
 */
export const GUEST_FILTER_INTRO_ONLY = 'intro_only';

/** @param {string|undefined|null} value */
export function normalizeGuestFilter(value) {
  const v = String(value || '').trim();
  if (
    v === 'intro_only' ||
    v === 'intro' ||
    v === 'summary_only' ||
    v === 'summary-only' ||
    v === 'summary'
  ) {
    return GUEST_FILTER_INTRO_ONLY;
  }
  if (v === 'block' || v === 'blocked' || v === 'deny') return 'block';
  if (v === 'allow' || v === 'allowed' || v === 'true' || v === '1') return 'allow';
  if (v === 'false' || v === '0') return 'block';
  return '';
}

/**
 * 슬롯 guestFilter 확정 — seed 명시값 우선, 없으면 정책 추론
 * @param {{ guestFilter?: string, visibilityRule?: string, roleTarget?: string, sourceBoardKeys?: string[] }} slot
 */
export function resolveSlotGuestFilter(slot) {
  const explicit = normalizeGuestFilter(slot?.guestFilter);
  if (explicit) return explicit;
  if (slot?.visibilityRule === 'login') return 'block';
  if (slot?.roleTarget === 'provider' || slot?.roleTarget === 'study_room' || slot?.roleTarget === 'tutor') {
    return 'block';
  }
  const keys = Array.isArray(slot?.sourceBoardKeys) ? slot.sourceBoardKeys : [];
  if (keys.some((k) => String(k).startsWith('concern-'))) return GUEST_FILTER_INTRO_ONLY;
  return 'allow';
}

/**
 * 우측 레일 슬롯 노출 (visibilityRule · roleTarget · guestFilter)
 * @param {{ visibilityRule?: string, roleTarget?: string, guestFilter?: string, sourceBoardKeys?: string[], enabled?: boolean, status?: string }|null|undefined} slot
 * @param {string} navRole
 */
export function isRailSlotVisible(slot, navRole) {
  if (!slot || slot.enabled === false || (slot.status && slot.status !== 'active')) return false;
  const rule = String(slot.visibilityRule || 'public');
  const target = String(slot.roleTarget || 'all');
  const guestFilter = resolveSlotGuestFilter(slot);

  if (navRole === 'guest') {
    if (guestFilter === 'block') return false;
    if (rule === 'login') return false;
  }

  if (rule === 'login' && navRole === 'guest') return false;
  if (rule === 'role' || target === 'provider' || target === 'study_room' || target === 'tutor' || target === 'parent') {
    if (target === 'all') return true;
    if (target === 'provider') return navRole === 'study_room' || navRole === 'tutor';
    if (target === 'study_room' || target === 'room') return navRole === 'study_room';
    if (target === 'tutor') return navRole === 'tutor';
    if (target === 'parent' || target === 'demand' || target === 'student') return navRole === 'parent';
    if (target === 'guest') return navRole === 'guest';
  }
  return true;
}

/**
 * 레일 카드용 — sourceBoardKey + guestFilter + channel ACL
 * 소개 권한이 있으면 슬롯에 올리고, 글 카드 vs 소개 CTA는 렌더러가 구분한다.
 * @param {string} boardKey
 * @param {string} navRole
 * @param {{ guestFilter?: string, slotGuestFilter?: string }} [opts]
 */
export function canShowBoardInRail(boardKey, navRole, opts = {}) {
  const key = normalizeBoardKey(boardKey);
  const guestFilter = normalizeGuestFilter(opts.guestFilter || opts.slotGuestFilter) || 'allow';

  if (navRole === 'guest' && guestFilter === 'block') return false;

  return canListBoard(key, navRole) || canDiscoverBoard(key, navRole);
}

/**
 * 레일에 게시글 행을 넣을 수 있는지 (제목 노출)
 * @param {string} boardKey
 * @param {string} navRole
 */
export function canShowBoardPostsInRail(boardKey, navRole) {
  return canListBoard(boardKey, navRole);
}

/** JS↔PHP 비교용. 역할은 board role. concern-family는 parent와 동일 행이어야 한다. */
export const ACL_MATRIX_CHANNELS = [
  'concern-parent',
  'concern-family',
  'concern-director',
  'concern-tutor',
  'concern-solved',
  'notice',
  'faq',
  'safe-guide',
  'library',
  'library-template',
  'library-guide-pdf',
  'submission',
];

export const ACL_MATRIX_ROLES = ['guest', 'demand', 'supply-room', 'supply-tutor', 'admin'];

/** @returns {list<{role: string, channel: string, alias: string, discover: boolean, list: boolean, detail: boolean, compose: boolean, comment: boolean, react: boolean, download: boolean, access: string}>} */
export function dumpBoardAclMatrix() {
  return ACL_MATRIX_ROLES.flatMap((role) =>
    ACL_MATRIX_CHANNELS.map((alias) => {
      const access = getBoardAccess(alias, role);
      return {
        role,
        channel: normalizeBoardKey(alias),
        alias,
        discover: access.canDiscover,
        list: access.canList,
        detail: access.canDetail,
        compose: access.canCompose,
        comment: access.canComment,
        react: access.canReact,
        download: access.canDownload,
        upload: access.canUpload,
        delete: access.canDelete,
        moderate: access.canModerate,
        access: access.access,
      };
    }),
  );
}
