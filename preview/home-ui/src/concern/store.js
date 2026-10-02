/**
 * 고민방 서버 연동 스토어.
 * 모든 데이터는 서버 API를 통해 읽고 쓴다.
 * localStorage·시드·로컬 저장 없음.
 * 서버 글 항목(목록·단건·인기·베스트)은 normalizeConcernItem() 한 곳만 거친다.
 */

import { fetchBoardPosts } from '../board/board-api.js';
import { getNavRole } from '../state.js';
import { CONCERN_POST_TYPE_KEYS, CONCERN_DEFAULT_POST_TYPE } from './copy.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const CONCERN_PAGE_SIZE = 20;
export const CONCERN_SORTS = ['recent', 'hot', 'comments'];

/** 방별 목록 캐시 { query, posts, access, total, hasMore } — 한 방에 지금 보는 정렬·종류 한 벌만 */
const _lists = new Map();
/** 단건 캐시 `${boardKey}\n${postId}` → { post|null, access } */
const _details = new Map();

/** 레일·베스트 캐시를 다시 받기 전까지 쓰는 시간 */
const RAIL_CACHE_TTL_MS = 3 * 60 * 1000;
export const RAIL_LATEST_LIMIT = 3;
export const RAIL_HOT_LIMIT = 10;

/** @typedef {'loading'|'ready'|'failed'} RailLoadStatus 받는 중 · 받음(0건 포함) · 실패 */

/**
 * concern-hot.php 한 갈래(hot·latest·best) 캐시.
 * 진행 중 요청은 하나만 두고 같이 기다린다. 다른 역할·계정으로 받은 값은 없는 것으로 본다.
 * 실패는 emptyValue 를 담되 failed 로 따로 표시해 0건과 구분한다. 실패한 값은 다음 그리기 때 다시 받는다.
 * @template T
 * @param {() => Promise<T>} load
 * @param {T} emptyValue 실패했을 때 담는 값
 */
function createRailLoader(load, emptyValue) {
  let data = null;
  let owner = '';
  let loadedAt = 0;
  let failed = false;
  let pending = null;
  let pendingOwner = '';
  let generation = 0;
  return {
    /** @param {string} who */
    peek(who) {
      return data !== null && owner === who ? data : null;
    },
    /** @param {string} who */
    isFresh(who) {
      return data !== null && owner === who && !failed && Date.now() - loadedAt < RAIL_CACHE_TTL_MS;
    },
    /** @param {string} who @returns {RailLoadStatus} */
    status(who) {
      if (data === null || owner !== who) return 'loading';
      return failed ? 'failed' : 'ready';
    },
    /** @param {string} who @returns {Promise<T>} */
    ensure(who) {
      if (this.isFresh(who)) return Promise.resolve(data);
      if (pending && pendingOwner === who) return pending;
      const gen = ++generation;
      pendingOwner = who;
      pending = load()
        .then(
          (result) => ({ ok: true, result }),
          () => ({ ok: false, result: emptyValue }),
        )
        .then(({ ok, result }) => {
          if (gen === generation) {
            data = result;
            owner = who;
            loadedAt = Date.now();
            failed = !ok;
            pending = null;
          }
          return result;
        });
      return pending;
    },
    reset() {
      data = null;
      owner = '';
      loadedAt = 0;
      failed = false;
      pending = null;
      pendingOwner = '';
      generation += 1;
    },
  };
}

/* ── 정규화 ── */

/**
 * 목록 조건 정규화. 서버가 받지 않는 값은 기본값으로 돌린다.
 * @param {{ sort?: string|null, type?: string|null }} [q]
 * @returns {{ sort: string, type: string }}
 */
export function normalizeListQuery(q = {}) {
  const sort = CONCERN_SORTS.includes(String(q.sort || '')) ? String(q.sort) : 'recent';
  const type = CONCERN_POST_TYPE_KEYS.includes(String(q.type || '')) ? String(q.type) : '';
  return { sort, type };
}

function sameQuery(a, b) {
  return a.sort === b.sort && a.type === b.type;
}

function toReactions(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    empathy: Number(r.empathy) || 0,
    helpful: Number(r.helpful) || 0,
    cheer: Number(r.cheer) || 0,
    score: Number(r.score) || 0,
  };
}

/**
 * 서버 글 항목 → 화면용 글. 제목 목록(titles) 항목에는 본문·작성자 필드를 만들지 않는다.
 * @param {any} raw
 * @param {string} [access] 응답 access. 모르면 _numericId 유무로 판단.
 */
export function normalizeConcernItem(raw, access) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const titlesOnly = access === 'titles' || src._numericId == null;
  const base = {
    id: String(src.id ?? ''),
    boardKey: String(src.boardKey || ''),
    boardLabel: String(src.boardLabel || ''),
    title: String(src.title || ''),
    type: CONCERN_POST_TYPE_KEYS.includes(src.type) ? src.type : CONCERN_DEFAULT_POST_TYPE,
    createdAt: String(src.createdAt || ''),
    reactionTotal: Number(src.reactionTotal) || 0,
    commentCount: Number(src.commentCount) || 0,
    titlesOnly,
  };
  if (titlesOnly) return base;
  const reactions = toReactions(src.reactions);
  return {
    ...base,
    _numericId: Number(src._numericId) || 0,
    description: String(src.description || ''),
    status: String(src.status || ''),
    authorDisplayName: String(src.authorDisplayName || ''),
    authorUserId: Number(src.authorUserId) || 0,
    reactions,
    myReaction: src.myReaction || null,
    updatedAt: String(src.updatedAt || src.createdAt || ''),
    edited: Boolean(src.edited),
  };
}

/* ── 캐시 ── */

export function resetConcernData() {
  _lists.clear();
  _details.clear();
  _hotLoader.reset();
  _latestLoader.reset();
  _bestLoader.reset();
}

function detailKey(boardKey, postId) {
  return `${boardKey}\n${postId}`;
}

/**
 * 지금 조건(sort·type)과 같은 목록 캐시만 돌려준다. 없으면 null.
 * @returns {{ query: {sort:string,type:string}, posts: any[], access: string, total: number, hasMore: boolean }|null}
 */
export function getConcernList(boardKey, query) {
  const entry = _lists.get(boardKey);
  if (!entry) return null;
  return sameQuery(entry.query, normalizeListQuery(query)) ? entry : null;
}

/** 목록 캐시 버리기 (댓글 수·새 글 반영용). 다음 방문 때 서버에서 다시 읽는다. */
export function invalidateConcernList(boardKey) {
  _lists.delete(boardKey);
}

function replaceInCaches(boardKey, post) {
  const entry = _lists.get(boardKey);
  if (entry) {
    const posts = entry.posts.map((p) => (p.id === post.id ? { ...p, ...post } : p));
    _lists.set(boardKey, { ...entry, posts });
  }
  const dk = detailKey(boardKey, post.id);
  const detail = _details.get(dk);
  if (detail?.post) _details.set(dk, { ...detail, post: { ...detail.post, ...post } });
}

/* ── 목록 (GET /api/board/posts.php?sort&type&limit&offset) ── */

function toListEntry(data, query, prevPosts = []) {
  const access = data.access || 'full';
  const fresh = (data.posts ?? []).map((p) => normalizeConcernItem(p, access));
  const seen = new Set(prevPosts.map((p) => p.id));
  const posts = [...prevPosts, ...fresh.filter((p) => !seen.has(p.id))];
  const total = Number.isFinite(data.total) ? data.total : posts.length;
  const hasMore = typeof data.hasMore === 'boolean' ? data.hasMore : posts.length < total;
  return { query, posts, access, total, hasMore };
}

/**
 * 첫 페이지를 서버에서 가져와 캐시에 저장한다.
 * @param {string} boardKey
 * @param {{ sort?: string, type?: string }} [query]
 */
export async function fetchConcernPosts(boardKey, query = {}) {
  const q = normalizeListQuery(query);
  const data = await fetchBoardPosts(boardKey, {
    navRole: getNavRole(),
    sort: q.sort,
    type: q.type || undefined,
    limit: CONCERN_PAGE_SIZE,
  });
  const entry = toListEntry(data, q);
  _lists.set(boardKey, entry);
  return entry;
}

/** 「더 보기」: 지금 목록 조건 그대로 다음 페이지를 붙인다. */
export async function fetchMoreConcernPosts(boardKey) {
  const entry = _lists.get(boardKey);
  if (!entry || !entry.hasMore) return entry ?? null;
  const data = await fetchBoardPosts(boardKey, {
    navRole: getNavRole(),
    sort: entry.query.sort,
    type: entry.query.type || undefined,
    limit: CONCERN_PAGE_SIZE,
    offset: entry.posts.length,
  });
  if (_lists.get(boardKey) !== entry) return _lists.get(boardKey) ?? null;
  const next = toListEntry(data, entry.query, entry.posts);
  _lists.set(boardKey, next);
  return next;
}

/**
 * 레일 읽기 팝업 목록 한 페이지(서버 최신순). 방 목록 캐시는 건드리지 않는다.
 * 읽기 권한이 없는 역할·게스트는 서버가 제목 항목(access=titles)만 준다.
 * @param {string} boardKey
 * @param {number} offset
 * @param {number} limit
 * @param {string} navRole
 * @returns {Promise<{ posts: any[], access: string, total: number }>}
 */
export async function fetchConcernRailPage(boardKey, offset, limit, navRole) {
  const data = await fetchBoardPosts(boardKey, { navRole, sort: 'recent', limit, offset });
  const access = data.access || 'full';
  const posts = (data.posts ?? []).map((p) => normalizeConcernItem(p, access)).filter((p) => p.id && p.title);
  const total = Number.isFinite(data.total) ? Number(data.total) : posts.length;
  return { posts, access, total };
}

/**
 * 레일 읽기 팝업 본문용 글 하나. 단건 캐시에 넣지 않는다(로그인 전후로 다른 응답이 섞이지 않게).
 * @returns {Promise<{ post: any|null, access: string }>}
 */
export async function fetchConcernRailPost(boardKey, postId, navRole) {
  const data = await fetchBoardPosts(boardKey, { navRole, postKey: postId, limit: 1 });
  const access = data.access || 'full';
  const raw = (data.posts ?? []).find((p) => String(p.id) === String(postId)) ?? null;
  return { post: raw ? normalizeConcernItem(raw, access) : null, access };
}

/* ── 단건 (GET /api/board/posts.php?post_key) ── */

/** 서버에서 글 하나를 가져온다. 없으면 post=null 로 캐시해 다시 묻지 않는다. */
export async function fetchConcernPost(boardKey, postId) {
  const data = await fetchBoardPosts(boardKey, { navRole: getNavRole(), postKey: postId, limit: 1 });
  const access = data.access || 'full';
  const raw = (data.posts ?? []).find((p) => String(p.id) === String(postId)) ?? null;
  const entry = { post: raw ? normalizeConcernItem(raw, access) : null, access };
  _details.set(detailKey(boardKey, postId), entry);
  return entry;
}

/**
 * 단건 캐시 → 목록 캐시 순으로 찾는다.
 * @returns {{ post: any|null, access: string }|null}
 */
export function findConcernPost(boardKey, postId) {
  const detail = _details.get(detailKey(boardKey, postId));
  if (detail) return detail;
  const entry = _lists.get(boardKey);
  const post = entry?.posts.find((p) => p.id === postId);
  return post ? { post, access: entry.access } : null;
}

/* ── 글쓰기·수정 (POST /api/board/posts.php) ── */

/**
 * postKey 가 있으면 본인 글 수정, 없으면 새 글.
 * @param {{ boardKey: string, postKey?: string, title: string, body: string, type?: string }} input
 * @returns {Promise<object>} 서버가 돌려준 글(정규화)
 */
export async function saveConcernPost(input) {
  const payload = {
    board_key: input.boardKey,
    title: input.title,
    body: input.body,
  };
  if (input.postKey) payload.post_key = input.postKey;
  if (input.type) payload.type = input.type;
  const res = await fetch('/api/board/posts.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || '글 저장에 실패했습니다.');
  }
  const post = normalizeConcernItem(data.post, 'full');
  _details.set(detailKey(input.boardKey, post.id), { post, access: 'full' });
  if (input.postKey) replaceInCaches(input.boardKey, post);
  else invalidateConcernList(input.boardKey);
  return post;
}

/* ── 글 삭제 (DELETE /api/board/posts.php) ── */

/**
 * @param {string} boardKey
 * @param {string} postKey
 * @returns {Promise<void>}
 */
export async function deleteConcernPost(boardKey, postKey) {
  const params = new URLSearchParams({ board_key: boardKey, post_key: postKey });
  const res = await fetch(`/api/board/posts.php?${params}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || '삭제에 실패했습니다.');
  }
  _details.delete(detailKey(boardKey, postKey));
  invalidateConcernList(boardKey);
}

/** 반응 토글 결과를 캐시에 반영 (다시 읽지 않음) */
export function applyPostReaction(boardKey, postKey, result) {
  const reactions = toReactions(result?.reactions);
  replaceInCaches(boardKey, {
    id: postKey,
    reactions,
    myReaction: result?.kind || null,
    reactionTotal: reactions.empathy + reactions.helpful + reactions.cheer,
  });
}

/* ── 댓글 (GET/POST/DELETE /api/board/comments.php) ── */

/**
 * @param {number} postId (_numericId)
 * @returns {Promise<any[]>} 2단계 트리
 */
export async function fetchComments(postId) {
  const params = new URLSearchParams({ post_id: String(postId) });
  const res = await fetch(`/api/board/comments.php?${params}`, { credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || '댓글을 불러오지 못했습니다.');
  }
  return data.comments ?? [];
}

/**
 * @param {number} postId
 * @param {{ body: string, parentCommentId?: number }} input
 * @returns {Promise<object>}
 */
export async function addComment(postId, input) {
  const res = await fetch('/api/board/comments.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({
      post_id: postId,
      body: input.body,
      ...(input.parentCommentId ? { parent_comment_id: input.parentCommentId } : {}),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || '댓글 작성에 실패했습니다.');
  }
  return data.comment;
}

/**
 * @param {number} commentId
 * @returns {Promise<void>}
 */
export async function deleteComment(commentId) {
  const params = new URLSearchParams({ comment_id: String(commentId) });
  const res = await fetch(`/api/board/comments.php?${params}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || '댓글 삭제에 실패했습니다.');
  }
}

/* ── 반응 (POST /api/board/reactions.php) ── */

/**
 * @param {number} postId
 * @param {string} kind  empathy|helpful|cheer
 * @param {number|null} [commentId]
 * @returns {Promise<{ action: string, kind: string|null, reactions: object }>}
 */
export async function toggleReaction(postId, kind, commentId = null) {
  const body = { post_id: postId, kind };
  if (commentId) body.comment_id = commentId;
  const res = await fetch('/api/board/reactions.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || '반응 처리에 실패했습니다.');
  }
  return data;
}

/* ── 신고 (POST /api/board/reports.php) ── */

/**
 * @param {number} postId
 * @param {string} reason
 * @param {number|null} [commentId]
 * @returns {Promise<{ reported: boolean, autoHidden: boolean }>}
 */
export async function reportContent(postId, reason, commentId = null) {
  const body = { post_id: postId, reason };
  if (commentId) body.comment_id = commentId;
  const res = await fetch('/api/board/reports.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || '신고 처리에 실패했습니다.');
  }
  return data;
}

/* ── 인기·베스트 (GET /api/board/concern-hot.php) ── */

async function fetchConcernHotView(params) {
  const res = await fetch(`/api/board/concern-hot.php?${new URLSearchParams(params)}`, {
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.message || 'concern-hot');
  return data;
}

function normalizeItemList(list) {
  return (Array.isArray(list) ? list : []).map((p) => normalizeConcernItem(p)).filter((p) => p.id && p.title);
}

export async function fetchHotPosts(limit = RAIL_HOT_LIMIT) {
  const data = await fetchConcernHotView({ view: 'hot', limit: String(limit) });
  return normalizeItemList(data.posts);
}

export async function fetchLatestPosts(limit = RAIL_LATEST_LIMIT) {
  const data = await fetchConcernHotView({ view: 'latest', limit: String(limit) });
  return normalizeItemList(data.posts);
}

export async function fetchBestPosts() {
  const data = await fetchConcernHotView({ view: 'best' });
  /** @type {Record<string, any[]>} */
  const boards = {};
  Object.entries(data.boards ?? {}).forEach(([boardKey, posts]) => {
    const items = normalizeItemList(posts);
    if (items.length) boards[boardKey] = items;
  });
  return boards;
}

const _hotLoader = createRailLoader(() => fetchHotPosts(RAIL_HOT_LIMIT), []);
const _latestLoader = createRailLoader(() => fetchLatestPosts(RAIL_LATEST_LIMIT), []);
const _bestLoader = createRailLoader(() => fetchBestPosts(), {});

/* ── 레일·베스트 띠용 helper ── */

/** @type {() => string} */
let railOwnerResolver = () => 'guest';

/**
 * 세션 주인(계정·역할) 키를 알려 주는 함수를 건다. 서버 응답은 세션 기준이라
 * 이 값이 바뀌면 받은 값을 버리고 다시 받는다. 이 모듈은 auth-session을 직접 부르지 않는다.
 * @param {() => string} resolver
 */
export function setConcernRailOwnerResolver(resolver) {
  if (typeof resolver === 'function') railOwnerResolver = resolver;
}

function railOwnerKey() {
  try {
    return String(railOwnerResolver() || 'guest');
  } catch {
    return 'guest';
  }
}

/** @param {'hot'|'latest'} mode */
function railLoader(mode) {
  return mode === 'latest' ? _latestLoader : _hotLoader;
}

/** 레일 칸 데이터를 받은 적이 있는지(0건도 받은 것). @param {'hot'|'latest'} mode */
export function isRailConcernReady(mode) {
  return railLoader(mode).peek(railOwnerKey()) !== null;
}

/** 다시 받을 때가 됐는지. @param {'hot'|'latest'} mode */
export function isRailConcernFresh(mode) {
  return railLoader(mode).isFresh(railOwnerKey());
}

/** 레일 칸 상태(받는 중·받음·실패). @param {'hot'|'latest'} mode @returns {RailLoadStatus} */
export function getRailConcernStatus(mode) {
  return railLoader(mode).status(railOwnerKey());
}

/** 레일 방 배너용. 서버 최신순 응답에서 그 방 글만 limit 개. 받은 값만 동기로 돌려준다. */
export function getLatestConcernPostsForBoard(boardKey, limit = RAIL_LATEST_LIMIT) {
  const posts = _latestLoader.peek(railOwnerKey()) || [];
  return posts.filter((p) => p.boardKey === boardKey).slice(0, limit);
}

/**
 * 레일 칸 데이터를 받는다. 진행 중 요청이 있으면 그 요청을 같이 기다린다.
 * @param {'hot'|'latest'} mode
 */
export function ensureRailConcernPosts(mode) {
  return railLoader(mode).ensure(railOwnerKey());
}

/** 레일 HOT 카드용. 받은 값만 동기로 돌려준다. */
export function getHotConcernSamples({ limit = 3, boardKeys } = {}) {
  if (Array.isArray(boardKeys) && !boardKeys.length) return [];
  let posts = _hotLoader.peek(railOwnerKey()) || [];
  if (Array.isArray(boardKeys)) {
    const set = new Set(boardKeys);
    posts = posts.filter((p) => set.has(p.boardKey));
  }
  return posts.slice(0, limit);
}

/** 레일 최신 카드용. 서버 최신순 응답에서 방마다 가장 새 글 하나씩, boardKeys 순서로. */
export function getLatestConcernSamples({ limit = 3, boardKeys } = {}) {
  if (Array.isArray(boardKeys) && !boardKeys.length) return [];
  const posts = _latestLoader.peek(railOwnerKey()) || [];
  const allowed = Array.isArray(boardKeys) ? boardKeys : ['concern-director', 'concern-tutor', 'concern-parent'];
  const picked = [];
  for (const bk of allowed) {
    if (picked.length >= limit) break;
    const first = posts.find((p) => p.boardKey === bk);
    if (first) picked.push(first);
  }
  return picked;
}

export function isBestConcernReady() {
  return _bestLoader.peek(railOwnerKey()) !== null;
}

export function isBestConcernFresh() {
  return _bestLoader.isFresh(railOwnerKey());
}

/** @returns {RailLoadStatus} */
export function getBestConcernStatus() {
  return _bestLoader.status(railOwnerKey());
}

export function ensureBestConcernPosts() {
  return _bestLoader.ensure(railOwnerKey());
}

/** 이달의 베스트. 받은 적 없으면 null, 0건이면 {}. @returns {Record<string, any[]>|null} */
export function getBestConcernBoards() {
  return _bestLoader.peek(railOwnerKey());
}

/** 글 반응 합계 */
export function reactionTotal(post) {
  if (post?.reactionTotal != null) return Number(post.reactionTotal) || 0;
  const r = post?.reactions;
  if (!r) return 0;
  return (Number(r.empathy) || 0) + (Number(r.helpful) || 0) + (Number(r.cheer) || 0);
}
