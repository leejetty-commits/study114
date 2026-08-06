/**
 * 커뮤니티 SSOT — 노션 상위메뉴·고민방·해결후기 결정문
 * path: /community/* (legacy /concern → redirect)
 * 보드 목록: 시드 + 관리자 채널(프리셋 concern) 병합
 */

import { listBoardChannels } from '../board-channel-store.js';

/** @typedef {'worry'|'advice'|'solved'|'request'|'community_alert'} CommunityPostType */
/** @typedef {'empathy'|'helpful'|'surprise'|'worry'} CommunityReaction */

export const COMMUNITY_HUB_TITLE = '커뮤니티';
export const COMMUNITY_HUB_LEAD =
  '원장·과외쌤·학부모/학생의 실제 고민과 짧은 조언, 해결후기, 댓글 반응이 쌓이는 현장형 공간입니다.';

/** @deprecated alias */
export const CONCERN_HUB_TITLE = COMMUNITY_HUB_TITLE;
export const CONCERN_HUB_LEAD = COMMUNITY_HUB_LEAD;

/** @type {{ id: string; boardKey: string; slug: string; label: string; roleHint: string; path: string; defaultTypes?: string[] }[]} */
export const SEED_COMMUNITY_BOARDS = [
  {
    id: 'director',
    boardKey: 'concern-director',
    slug: 'director',
    label: '원장 고민방',
    roleHint: '공부방 운영·모집·학부모 응대',
    path: '/community/director',
  },
  {
    id: 'tutor',
    boardKey: 'concern-tutor',
    slug: 'tutor',
    label: '과외쌤 고민방',
    roleHint: '프로필·첫 상담·수업 전환',
    path: '/community/tutor',
  },
  {
    id: 'parent',
    boardKey: 'concern-parent',
    slug: 'parent',
    label: '학부모/학생 고민방',
    roleHint: '공부방·과외 선택·루틴·안전',
    path: '/community/parent',
  },
  {
    id: 'solved',
    boardKey: 'concern-solved',
    slug: 'solved',
    label: '해결후기',
    roleHint: '바꿔보니 효과 있었던 경험·운영 노하우',
    path: '/community/solved',
    defaultTypes: ['solved'],
  },
];

function slugFromChannel(channel) {
  const route = String(channel.routeSlug || '')
    .replace(/^#/, '')
    .replace(/^\//, '');
  const m = route.match(/^community\/([^/]+)/);
  if (m?.[1]) return m[1];
  const key = String(channel.boardKey || '');
  if (key.startsWith('concern-')) return key.slice('concern-'.length);
  return key;
}

function roleHintFor(channel, slug) {
  const seed = SEED_COMMUNITY_BOARDS.find((b) => b.boardKey === channel.boardKey || b.slug === slug);
  if (seed) return seed.roleHint;
  return '현장 고민 · 짧은 조언 · 댓글 반응';
}

function channelToBoard(channel) {
  const slug = slugFromChannel(channel);
  const seed = SEED_COMMUNITY_BOARDS.find((b) => b.boardKey === channel.boardKey || b.slug === slug);
  const isSolved = slug === 'solved' || channel.boardKey.includes('solved');
  return {
    id: slug,
    boardKey: channel.boardKey,
    slug,
    label: channel.menuLabel || seed?.label || channel.boardKey,
    roleHint: roleHintFor(channel, slug),
    path: `/community/${slug}`,
    ...(isSolved || seed?.defaultTypes ? { defaultTypes: seed?.defaultTypes || ['solved'] } : {}),
  };
}

/**
 * 활성 커뮤니티 보드 = 관리자 채널(preset concern) ∪ 시드 보정
 * @returns {typeof SEED_COMMUNITY_BOARDS}
 */
export function listCommunityBoards() {
  const channels = listBoardChannels().filter(
    (ch) =>
      ch.presetId === 'concern' &&
      ch.status !== 'archived' &&
      ch.status !== 'hidden' &&
      ch.enabled !== false,
  );
  if (!channels.length) return SEED_COMMUNITY_BOARDS.map((b) => ({ ...b }));

  const byKey = new Map();
  SEED_COMMUNITY_BOARDS.forEach((seed) => {
    const live = channels.find((ch) => ch.boardKey === seed.boardKey);
    if (live) byKey.set(seed.boardKey, channelToBoard(live));
    else byKey.set(seed.boardKey, { ...seed });
  });
  channels.forEach((ch) => {
    if (!byKey.has(ch.boardKey)) byKey.set(ch.boardKey, channelToBoard(ch));
  });
  return [...byKey.values()];
}

/** @deprecated 시드 스냅샷 — 런타임은 listCommunityBoards() 사용 */
export const COMMUNITY_BOARDS = SEED_COMMUNITY_BOARDS;
export const CONCERN_BOARDS = COMMUNITY_BOARDS;

/** @type {Record<CommunityPostType, { label: string }>} */
export const COMMUNITY_POST_TYPES = {
  worry: { label: '고민' },
  advice: { label: '한줄조언' },
  solved: { label: '해결후기' },
  request: { label: '요청/모집' },
  community_alert: { label: '알림' },
};

export const CONCERN_POST_TYPES = COMMUNITY_POST_TYPES;

/** @type {Record<CommunityReaction, { emoji: string; label: string }>} */
export const COMMUNITY_REACTIONS = {
  empathy: { emoji: '❤️', label: '공감해요' },
  helpful: { emoji: '👍', label: '도움됐어요' },
  surprise: { emoji: '😮', label: '몰랐어요' },
  worry: { emoji: '😢', label: '걱정돼요' },
};

export const CONCERN_REACTIONS = COMMUNITY_REACTIONS;

export const COMMUNITY_COMPOSE_HINT =
  '제목은 생동감 있게, 본문은 부담 없이. 이미지 1~3장까지 가능 · 개인정보·얼굴·실명·연락처는 올리지 마세요.';

export const CONCERN_COMPOSE_HINT = COMMUNITY_COMPOSE_HINT;

export const COMMUNITY_IMAGE_MAX = 3;
export const CONCERN_IMAGE_MAX = COMMUNITY_IMAGE_MAX;

export function preferredCommunityBoardId(navRole) {
  const boards = listCommunityBoards();
  if (navRole === 'study_room') {
    return boards.find((b) => b.slug === 'director')?.id || boards[0]?.id || 'director';
  }
  if (navRole === 'tutor') {
    return boards.find((b) => b.slug === 'tutor')?.id || boards[0]?.id || 'tutor';
  }
  if (navRole === 'parent') {
    return boards.find((b) => b.slug === 'parent')?.id || boards[0]?.id || 'parent';
  }
  return boards.find((b) => b.slug === 'parent')?.id || boards[0]?.id || 'parent';
}

export const preferredConcernBoardId = preferredCommunityBoardId;

export function getCommunityBoardBySlug(slug) {
  return listCommunityBoards().find((b) => b.slug === slug) || null;
}

export function getCommunityBoardByKey(boardKey) {
  return listCommunityBoards().find((b) => b.boardKey === boardKey) || null;
}

export const getConcernBoardBySlug = getCommunityBoardBySlug;
export const getConcernBoardByKey = getCommunityBoardByKey;

/** 커뮤니티형 채널 식별값 → 권장 경로 */
export function suggestCommunityRouteSlug(boardKey) {
  const key = String(boardKey || '').trim();
  const slug = key.startsWith('concern-') ? key.slice('concern-'.length) : key;
  return slug ? `#/community/${slug}` : '#/community';
}

export function isConcernChannelKey(boardKey) {
  const key = String(boardKey || '');
  if (key.startsWith('concern-')) return true;
  const ch = listBoardChannels().find((row) => row.boardKey === key);
  return ch?.presetId === 'concern';
}
