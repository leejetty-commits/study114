/**
 * Channel ACL — sourceBoardKey / boardKey 기준 런타임 권한
 * 정책: 우측 레일 채널 ACL 재잠금 · 23장 · 부록 레일
 * concern-family 문서키 → 실제 boardKey `concern-parent`
 */

import {
  canBoardAction,
  getBoardPolicy,
  mapNavRoleToBoardRole,
} from './board-engine-copy.js';
import { loginUrl } from '../../shared/route-access.js';

/** @typedef {import('./board-engine-copy.js').BoardRole} BoardRole */

/** 문서 `concern-family` → 구현 키 */
export function normalizeBoardKey(boardKey) {
  const key = String(boardKey || '').trim();
  if (key === 'concern-family') return 'concern-parent';
  return key;
}

/**
 * full detail read 허용 역할 (list와 분리)
 * guest는 concern 계열에서 항상 summary-only
 * @type {Record<string, BoardRole[]>}
 */
const DETAIL_ROLES = {
  'concern-parent': ['demand', 'member', 'admin'],
  'concern-director': ['supply-room', 'admin'],
  'concern-tutor': ['supply-tutor', 'admin'],
  'concern-solved': ['member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
};

/**
 * compose / comment / reaction 허용 역할
 * @type {Record<string, BoardRole[]>}
 */
const COMPOSE_ROLES = {
  'concern-parent': ['demand', 'member'],
  'concern-director': ['supply-room'],
  'concern-tutor': ['supply-tutor'],
  'concern-solved': ['member', 'demand', 'supply-room', 'supply-tutor'],
};

/** @param {string} boardKey */
export function isConcernChannel(boardKey) {
  return normalizeBoardKey(boardKey).startsWith('concern-');
}

/** @param {string} navRole @returns {BoardRole} */
export function boardRoleFromNav(navRole) {
  return mapNavRoleToBoardRole(navRole || 'guest');
}

/**
 * 목록·제목·요약 노출
 * @param {string} boardKey
 * @param {BoardRole|string} role boardRole 또는 navRole
 */
export function canListBoard(boardKey, role) {
  const key = normalizeBoardKey(boardKey);
  const boardRole = /** @type {BoardRole} */ (
    ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'verified', 'admin'].includes(role)
      ? role
      : boardRoleFromNav(role)
  );
  return canBoardAction(key, 'read', boardRole);
}

/**
 * 본문 full read
 * @param {string} boardKey
 * @param {BoardRole|string} role
 */
export function canReadBoardDetail(boardKey, role) {
  const key = normalizeBoardKey(boardKey);
  const boardRole = /** @type {BoardRole} */ (
    ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'verified', 'admin'].includes(role)
      ? role
      : boardRoleFromNav(role)
  );
  if (boardRole === 'guest' && isConcernChannel(key)) return false;
  const detail = DETAIL_ROLES[key];
  if (detail) return detail.includes(boardRole);
  return canBoardAction(key, 'read', boardRole);
}

/**
 * 글쓰기
 * @param {string} boardKey
 * @param {BoardRole|string} role
 */
export function canComposeBoard(boardKey, role) {
  const key = normalizeBoardKey(boardKey);
  const boardRole = /** @type {BoardRole} */ (
    ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'verified', 'admin'].includes(role)
      ? role
      : boardRoleFromNav(role)
  );
  if (boardRole === 'guest') return false;
  const compose = COMPOSE_ROLES[key];
  if (compose) return compose.includes(boardRole);
  return canBoardAction(key, 'write', boardRole);
}

/**
 * 댓글·반응
 * @param {string} boardKey
 * @param {BoardRole|string} role
 */
export function canCommentBoard(boardKey, role) {
  const key = normalizeBoardKey(boardKey);
  const boardRole = /** @type {BoardRole} */ (
    ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'verified', 'admin'].includes(role)
      ? role
      : boardRoleFromNav(role)
  );
  if (boardRole === 'guest') return false;
  const policy = getBoardPolicy(key);
  if (!policy?.allowComment) return false;
  if (COMPOSE_ROLES[key]) {
    // 해결후기: full read 로그인 사용자는 댓글 가능 / 역할방: compose 역할만
    if (key === 'concern-solved') return canReadBoardDetail(key, boardRole);
    return canComposeBoard(key, boardRole);
  }
  return canBoardAction(key, 'comment', boardRole);
}

/** @param {string} boardKey @param {BoardRole|string} role */
export function canDownloadBoard(boardKey, role) {
  const key = normalizeBoardKey(boardKey);
  const boardRole = /** @type {BoardRole} */ (
    ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'verified', 'admin'].includes(role)
      ? role
      : boardRoleFromNav(role)
  );
  if (boardRole === 'guest') return false;
  return canBoardAction(key, 'download', boardRole);
}

/**
 * @param {string} boardKey
 * @param {BoardRole|string} role
 * @returns {{ canList: boolean, canDetail: boolean, canCompose: boolean, canComment: boolean, canDownload: boolean, access: 'full'|'summary'|'blocked' }}
 */
export function getBoardAccess(boardKey, role) {
  const canList = canListBoard(boardKey, role);
  const canDetail = canReadBoardDetail(boardKey, role);
  const canCompose = canComposeBoard(boardKey, role);
  const canComment = canCommentBoard(boardKey, role);
  const canDownload = canDownloadBoard(boardKey, role);
  let access = 'blocked';
  if (canDetail) access = 'full';
  else if (canList) access = 'summary';
  return { canList, canDetail, canCompose, canComment, canDownload, access };
}

/** @param {string} boardKey */
export function roleGateCopy(boardKey) {
  const key = normalizeBoardKey(boardKey);
  if (key === 'concern-director') {
    return {
      title: '공부방 운영자 전용 공간',
      body: '이 공간은 공부방 운영자에게 열려 있어요. 제목·요약만 확인할 수 있습니다.',
      roleLabel: '공부방',
    };
  }
  if (key === 'concern-tutor') {
    return {
      title: '과외쌤 전용 공간',
      body: '이 공간은 과외쌤 전용이에요. 제목·요약만 확인할 수 있습니다.',
      roleLabel: '과외쌤',
    };
  }
  if (key === 'concern-parent') {
    return {
      title: '학부모·학생 공간',
      body: '이 공간의 본문은 학부모·학생 역할로 로그인한 뒤 볼 수 있어요.',
      roleLabel: '학부모/학생',
    };
  }
  if (key === 'library-guide-pdf') {
    return {
      title: '자료 다운로드',
      body: '자료 다운로드는 로그인 후 가능해요.',
      roleLabel: null,
    };
  }
  return {
    title: '로그인이 필요합니다',
    body: '로그인 후 본문을 볼 수 있어요.',
    roleLabel: null,
  };
}

/** @param {string} boardKey @param {string} navRole */
export function permissionKindForBoard(boardKey, navRole) {
  const access = getBoardAccess(boardKey, navRole);
  if (access.access === 'full') return null;
  if (navRole === 'guest' || !navRole) return 'guest';
  if (access.access === 'summary' || access.access === 'blocked') return 'role';
  return 'guest';
}

/** @param {string} [from] */
export function boardLoginHref(from = 'community') {
  return loginUrl(from);
}

/** guestFilter: allow | summary_only | block */
/** @param {string|undefined|null} value */
export function normalizeGuestFilter(value) {
  const v = String(value || '').trim();
  if (v === 'summary_only' || v === 'summary-only' || v === 'summary') return 'summary_only';
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
  if (keys.some((k) => String(k).startsWith('concern-'))) return 'summary_only';
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
 * @param {string} boardKey
 * @param {string} navRole
 * @param {{ guestFilter?: string, slotGuestFilter?: string }} [opts]
 */
export function canShowBoardInRail(boardKey, navRole, opts = {}) {
  const key = normalizeBoardKey(boardKey);
  const guestFilter = normalizeGuestFilter(opts.guestFilter || opts.slotGuestFilter) || 'allow';

  if (navRole === 'guest') {
    if (guestFilter === 'block') return false;
    if (key === 'submission' || key === 'library' || key === 'library-template') return false;
  }

  return canListBoard(key, navRole);
}
