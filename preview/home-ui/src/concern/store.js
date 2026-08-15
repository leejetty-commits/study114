/**
 * 고민방 프리뷰 스토어 — localStorage
 * 1차: 본체 미리보기 (댓글·공감·글쓰기). API 연동은 후속.
 */

import {
  listCommunityBoards,
  CONCERN_POST_TYPES,
  CONCERN_REACTIONS,
} from './copy.js';

const STORAGE_KEY = 'study114.community.v2';

/** @typedef {{
 *   id: string;
 *   boardKey: string;
 *   type: string;
 *   title: string;
 *   body: string;
 *   authorName: string;
 *   authorRoleLabel: string;
 *   createdAt: string;
 *   reactions: Record<string, number>;
 *   comments: { id: string; authorName: string; body: string; createdAt: string }[];
 *   pinned?: boolean;
 *   imageCount?: number;
 * }} ConcernPost */

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** @returns {ConcernPost[]} */
function seedPosts() {
  const t = Date.now();
  const ago = (h) => new Date(t - h * 3600_000).toISOString();
  return [
    {
      id: 'cd1',
      boardKey: 'concern-director',
      type: 'worry',
      title: '문의는 오는데 등록까지 이어지지 않아요',
      body: '상담 문의는 꾸준한데 마지막에 다 빠져요. 원장님들은 어디서부터 손보시나요?',
      authorName: '대치동원장',
      authorRoleLabel: '공부방',
      createdAt: ago(2),
      reactions: { empathy: 27, helpful: 8, surprise: 3, worry: 5 },
      comments: [
        { id: 'c1', authorName: '분당원장', body: '소개문 첫 문장에 대상·과목을 명확히 하니 달라졌어요.', createdAt: ago(1) },
        { id: 'c2', authorName: '송파원장', body: '상담 후 쪽지로 체크리스트를 보내보니 이탈이 줄었습니다.', createdAt: ago(0.5) },
      ],
      pinned: false,
      imageCount: 0,
    },
    {
      id: 'cd2',
      boardKey: 'concern-director',
      type: 'worry',
      title: '방학 모집, 어디서부터 손봐야 할까요',
      body: '사진과 소개문은 있는데 시즌 톤이 약해 보여요. 체크 포인트 공유 부탁드려요.',
      authorName: '목동원장',
      authorRoleLabel: '공부방',
      createdAt: ago(8),
      reactions: { empathy: 14, helpful: 11, surprise: 1, worry: 2 },
      comments: [{ id: 'c3', authorName: '중계원장', body: '방학 특화 한 줄 + 상담 가능 시간을 먼저 올려보세요.', createdAt: ago(6) }],
    },
    {
      id: 'cd3',
      boardKey: 'concern-director',
      type: 'solved',
      title: '소개글 한 줄 바꿨더니 상담 톤이 달라졌어요',
      body: '학부모가 먼저 보는 정보 순서로 소개문을 다시 썼더니 문의 질문이 구체화됐습니다.',
      authorName: '일산원장',
      authorRoleLabel: '공부방',
      createdAt: ago(20),
      reactions: { empathy: 9, helpful: 22, surprise: 4, worry: 0 },
      comments: [],
    },
    {
      id: 'ct1',
      boardKey: 'concern-tutor',
      type: 'worry',
      title: '프로필은 있는데 왜 반응이 없을까요',
      body: '활동 지역·과목은 넣었는데 조회만 있고 쪽지가 없어요. 어디를 먼저 보완할까요?',
      authorName: '수학튜터K',
      authorRoleLabel: '과외쌤',
      createdAt: ago(3),
      reactions: { empathy: 18, helpful: 6, surprise: 2, worry: 4 },
      comments: [
        { id: 'c4', authorName: '영어튜터M', body: '첫 문단에 “누구를 돕는지”를 쓰면 전환이 나아졌어요.', createdAt: ago(2) },
      ],
    },
    {
      id: 'ct2',
      boardKey: 'concern-tutor',
      type: 'advice',
      title: '첫 수업 전 상담에서 꼭 물어봐야 할 것',
      body: '목표 성적보다 현재 루틴·숙제 습관·학부모 기대치를 먼저 맞춰보세요.',
      authorName: '국어튜터S',
      authorRoleLabel: '과외쌤',
      createdAt: ago(12),
      reactions: { empathy: 7, helpful: 31, surprise: 5, worry: 1 },
      comments: [
        { id: 'c5', authorName: '과학튜터J', body: '시범수업 가능 여부와 교재 범위도 초반에 확인하면 좋아요.', createdAt: ago(10) },
        { id: 'c6', authorName: '수학튜터K', body: '쪽지로 체크리스트 공유하니 상담이 짧아졌어요.', createdAt: ago(9) },
      ],
    },
    {
      id: 'ct3',
      boardKey: 'concern-tutor',
      type: 'worry',
      title: '시범수업 뒤에 끊기는 이유가 뭘까요',
      body: '시범은 괜찮다는 반응인데 이후 연락이 없어요. 비슷한 경험 있으신가요?',
      authorName: '사회튜터H',
      authorRoleLabel: '과외쌤',
      createdAt: ago(28),
      reactions: { empathy: 21, helpful: 9, surprise: 2, worry: 6 },
      comments: [],
    },
    {
      id: 'cp1',
      boardKey: 'concern-parent',
      type: 'worry',
      title: '공부방이 맞을지 과외가 맞을지 모르겠어요',
      body: '초5 아이인데 숙제 루틴이 약해요. 공부방 관리형과 1:1 과외 중 어디서부터 보면 좋을까요?',
      authorName: '강남학부모',
      authorRoleLabel: '학부모',
      createdAt: ago(4),
      reactions: { empathy: 33, helpful: 12, surprise: 1, worry: 8 },
      comments: [
        { id: 'c7', authorName: '분당학부모', body: '루틴이 약하면 관리형부터 보고, 과목만 무너지면 과외를 봤어요.', createdAt: ago(3) },
      ],
    },
    {
      id: 'cp2',
      boardKey: 'concern-parent',
      type: 'worry',
      title: '초등 고학년부터 갑자기 수학이 무너져요',
      body: '초6인데 개념은 되는데 응용에서 막혀요. 비슷한 시기 어떻게 보셨나요?',
      authorName: '마포학부모',
      authorRoleLabel: '학부모',
      createdAt: ago(7),
      reactions: { empathy: 25, helpful: 14, surprise: 3, worry: 7 },
      comments: [
        { id: 'c8', authorName: '서초학부모', body: '숙제량보다 오답 루틴부터 잡으니 안정됐어요.', createdAt: ago(5) },
        { id: 'c9', authorName: '양천학부모', body: '찜해둔 후보를 비교로 2~3개로 줄인 뒤 쪽지했어요.', createdAt: ago(4.5) },
      ],
    },
    {
      id: 'cp3',
      boardKey: 'concern-parent',
      type: 'advice',
      title: '첫 연락은 쪽지로 시작하는 편이 안전합니다',
      body: '개인 연락처보다 플랫폼 쪽지로 조건을 먼저 정리해 보세요. 안전과외 가이드도 함께 보면 좋아요.',
      authorName: '우동공과',
      authorRoleLabel: '운영',
      createdAt: ago(40),
      reactions: { empathy: 11, helpful: 28, surprise: 2, worry: 0 },
      comments: [],
    },
    {
      id: 'ca1',
      boardKey: 'concern-director',
      type: 'community_alert',
      title: '댓글·글쓰기는 짧게, 개인정보는 빼 주세요',
      body: '커뮤니티는 현장 고민과 짧은 조언이 오가는 공간입니다. 실명·연락처·얼굴 사진은 올리지 말아 주세요.',
      authorName: '우동공과',
      authorRoleLabel: '운영',
      createdAt: ago(1),
      reactions: { empathy: 3, helpful: 12, surprise: 0, worry: 0 },
      comments: [],
      pinned: true,
    },
    {
      id: 'cs1',
      boardKey: 'concern-solved',
      type: 'solved',
      title: '소개문 첫 줄만 바꿨는데 상담 질문이 구체화됐어요',
      body: '학부모가 먼저 보는 정보 순서로 소개문을 다시 썼더니 “몇 학년·어떤 과목” 문의가 늘었습니다.',
      authorName: '일산원장',
      authorRoleLabel: '공부방',
      createdAt: ago(5),
      reactions: { empathy: 11, helpful: 24, surprise: 2, worry: 0 },
      comments: [
        { id: 'c10', authorName: '분당원장', body: '가격·대상·시간대를 한 줄에 넣으니 좋았어요.', createdAt: ago(4) },
      ],
    },
    {
      id: 'cs2',
      boardKey: 'concern-solved',
      type: 'solved',
      title: '쪽지로 조건 정리하고 첫 연락하니 부담이 줄었어요',
      body: '학부모 입장에서도 쪽지로 과목·거리·희망 시간을 먼저 정리하니 대화가 빨리 좁혀졌습니다.',
      authorName: '강남학부모',
      authorRoleLabel: '학부모',
      createdAt: ago(9),
      reactions: { empathy: 19, helpful: 17, surprise: 1, worry: 0 },
      comments: [],
    },
  ];
}

function emptyReactions() {
  return Object.keys(CONCERN_REACTIONS).reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, /** @type {Record<string, number>} */ ({}));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.posts) && parsed.posts.length) return parsed;
    }
  } catch {
    /* seed */
  }
  return { posts: seedPosts(), myReactions: {} };
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

let state = loadState();

export function listConcernPosts(boardKey, { type = 'all', sort = 'recent' } = {}) {
  let rows = state.posts.filter((p) => p.boardKey === boardKey);
  if (type && type !== 'all' && CONCERN_POST_TYPES[type]) {
    rows = rows.filter((p) => p.type === type);
  }
  const score = (p) =>
    Object.values(p.reactions || {}).reduce((a, n) => a + Number(n || 0), 0) + (p.comments?.length || 0) * 2;
  if (sort === 'hot') {
    rows = [...rows].sort((a, b) => score(b) - score(a) || b.createdAt.localeCompare(a.createdAt));
  } else if (sort === 'comments') {
    rows = [...rows].sort(
      (a, b) => (b.comments?.length || 0) - (a.comments?.length || 0) || b.createdAt.localeCompare(a.createdAt),
    );
  } else {
    rows = [...rows].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }
  return rows;
}

export function listAllConcernPosts(opts = {}) {
  return listCommunityBoards().flatMap((b) => listConcernPosts(b.boardKey, opts));
}

export function getConcernPost(id) {
  return state.posts.find((p) => p.id === id) || null;
}

export function getHotConcernSamples({ limit = 3, preferBoardKey, boardKeys } = {}) {
  const allowed = Array.isArray(boardKeys) && boardKeys.length ? new Set(boardKeys) : null;
  const all = listAllConcernPosts({ sort: 'hot' })
    .filter((p) => p.type !== 'community_alert')
    .filter((p) => !allowed || allowed.has(p.boardKey));
  const boards = allowed
    ? listCommunityBoards().filter((b) => allowed.has(b.boardKey))
    : listCommunityBoards();
  const ordered = preferBoardKey
    ? [...boards.filter((b) => b.boardKey === preferBoardKey), ...boards.filter((b) => b.boardKey !== preferBoardKey)]
    : boards;
  const picked = [];
  for (const board of ordered) {
    if (picked.length >= limit) break;
    const hit = all.find((p) => p.boardKey === board.boardKey);
    if (hit) picked.push(hit);
  }
  for (const p of all) {
    if (picked.length >= limit) break;
    if (!picked.includes(p)) picked.push(p);
  }
  return picked.slice(0, limit);
}

export function createConcernPost({ boardKey, type, title, body, authorName, authorRoleLabel }) {
  const post = {
    id: uid('post'),
    boardKey,
    type: CONCERN_POST_TYPES[type] ? type : 'worry',
    title: String(title || '').trim(),
    body: String(body || '').trim(),
    authorName: authorName || '회원',
    authorRoleLabel: authorRoleLabel || '회원',
    createdAt: nowIso(),
    reactions: emptyReactions(),
    comments: [],
    imageCount: 0,
  };
  state.posts.unshift(post);
  saveState(state);
  return post;
}

export function addConcernComment(postId, { authorName, body }) {
  const post = getConcernPost(postId);
  if (!post) return null;
  const comment = {
    id: uid('cmt'),
    authorName: authorName || '회원',
    body: String(body || '').trim(),
    createdAt: nowIso(),
  };
  if (!comment.body) return null;
  post.comments = [...(post.comments || []), comment];
  saveState(state);
  return comment;
}

export function toggleConcernReaction(postId, reactionKey) {
  if (!CONCERN_REACTIONS[reactionKey]) return null;
  const post = getConcernPost(postId);
  if (!post) return null;
  const myKey = `${postId}:${reactionKey}`;
  const mine = { ...(state.myReactions || {}) };
  post.reactions = { ...emptyReactions(), ...(post.reactions || {}) };
  if (mine[myKey]) {
    post.reactions[reactionKey] = Math.max(0, Number(post.reactions[reactionKey] || 0) - 1);
    delete mine[myKey];
  } else {
    post.reactions[reactionKey] = Number(post.reactions[reactionKey] || 0) + 1;
    mine[myKey] = true;
  }
  state.myReactions = mine;
  saveState(state);
  return post;
}

export function hasMyReaction(postId, reactionKey) {
  return Boolean(state.myReactions?.[`${postId}:${reactionKey}`]);
}

export function reactionTotal(post) {
  return Object.values(post?.reactions || {}).reduce((a, n) => a + Number(n || 0), 0);
}

export function resetConcernPreviewData() {
  state = { posts: seedPosts(), myReactions: {} };
  saveState(state);
}
