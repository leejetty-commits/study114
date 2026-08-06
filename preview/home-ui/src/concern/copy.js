/**
 * 커뮤니티 SSOT — 노션 상위메뉴·고민방·해결후기 결정문
 * path: /community/* (legacy /concern → redirect)
 */

/** @typedef {'worry'|'advice'|'solved'|'request'|'community_alert'} CommunityPostType */
/** @typedef {'empathy'|'helpful'|'surprise'|'worry'} CommunityReaction */

export const COMMUNITY_HUB_TITLE = '커뮤니티';
export const COMMUNITY_HUB_LEAD =
  '원장·과외쌤·학부모/학생의 실제 고민과 짧은 조언, 해결후기, 댓글 반응이 쌓이는 현장형 공간입니다.';

/** @deprecated alias */
export const CONCERN_HUB_TITLE = COMMUNITY_HUB_TITLE;
export const CONCERN_HUB_LEAD = COMMUNITY_HUB_LEAD;

/** @type {{ id: string; boardKey: string; slug: string; label: string; roleHint: string; path: string; defaultTypes?: string[] }[]} */
export const COMMUNITY_BOARDS = [
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

/** @deprecated alias */
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
  if (navRole === 'study_room') return 'director';
  if (navRole === 'tutor') return 'tutor';
  if (navRole === 'parent') return 'parent';
  return 'parent';
}

export const preferredConcernBoardId = preferredCommunityBoardId;

export function getCommunityBoardBySlug(slug) {
  return COMMUNITY_BOARDS.find((b) => b.slug === slug) || null;
}

export function getCommunityBoardByKey(boardKey) {
  return COMMUNITY_BOARDS.find((b) => b.boardKey === boardKey) || null;
}

export const getConcernBoardBySlug = getCommunityBoardBySlug;
export const getConcernBoardByKey = getCommunityBoardByKey;
