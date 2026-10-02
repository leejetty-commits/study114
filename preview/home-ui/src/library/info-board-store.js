/**
 * 정보 게시판(info-room · info-tutor · info-student) 서버 연동 스토어.
 * 읽기·쓰기·삭제는 모두 /api/board/posts.php, info-student 응원(cheer)은 /api/board/reactions.php 로만 한다. 로컬 저장·시드 없음.
 * 캐시는 세션 주인(계정·역할) 하나에만 붙는다. 주인이 바뀌면 받은 값을 모두 버린다(고민방 store.js 와 같은 방식).
 */

import { getAuthUser, isAdminUser } from '../auth-session.js';
import { mapNavRoleToBoardRole } from '../board-engine-copy.js';
import { getBoardAccess } from '../board-channel-acl.js';

const API = '/api/board/posts.php';
const REACTION_API = '/api/board/reactions.php';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** @typedef {{ boardRole: string, ownerKey: string }} InfoViewer */

/**
 * 지금 세션 기준 열람자. 미인증·역할 미정은 게스트로 본다(서버 optionalVerifiedAuth 와 같은 기준).
 * @returns {InfoViewer}
 */
export function currentInfoViewer() {
  const user = getAuthUser();
  if (!user || user.oauth_role_pending === true || user.email_verified === false) {
    return { boardRole: 'guest', ownerKey: 'guest' };
  }
  const boardRole = isAdminUser() ? 'admin' : mapNavRoleToBoardRole(user.role_type || '');
  return { boardRole, ownerKey: `${user.user_id ?? ''}:${user.role_type || ''}:${user.admin_level || ''}` };
}

/** @param {InfoViewer} viewer @param {string} boardKey */
export function infoAccessFor(viewer, boardKey) {
  return getBoardAccess(boardKey, viewer?.boardRole || 'guest').access;
}

/* ── 캐시 (세션 주인 하나) ── */

let _owner = '';
/** boardKey → { status, access, category, posts, total, hasMore, canCompose } */
const _lists = new Map();
/** `${boardKey}\n${postKey}` → { status, access, post } */
const _details = new Map();
/** 우측 레일 배너용 boardKey → { status: 'ready'|'failed', posts, loadedAt } */
const _rail = new Map();
/** 우측 레일 진행 중 요청 boardKey → Promise. 버린 요청은 여기서 빠져 있어 결과를 담지 않는다. */
const _railPending = new Map();

export function resetInfoBoardData() {
  _owner = '';
  _lists.clear();
  _details.clear();
  _rail.clear();
  _railPending.clear();
}

/** @param {InfoViewer} viewer */
function claim(viewer) {
  const who = String(viewer?.ownerKey || 'guest');
  if (who !== _owner) {
    _lists.clear();
    _details.clear();
    _rail.clear();
    _railPending.clear();
    _owner = who;
  }
  return who;
}

function detailKey(boardKey, postKey) {
  return `${boardKey}\n${postKey}`;
}

/* ── 정규화: 제목 항목(titles)에는 본문·작성자 필드를 만들지 않는다 ── */

/** @param {any} raw @param {string} access */
export function normalizeInfoPost(raw, access) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const base = {
    id: String(src.id ?? ''),
    title: String(src.title || ''),
    categoryId: String(src.categoryId || ''),
    createdAt: String(src.createdAt || ''),
  };
  if (access !== 'full') return base;
  const full = {
    ...base,
    body: String(src.body || ''),
    authorLabel: String(src.authorLabel || ''),
    updatedAt: String(src.updatedAt || src.createdAt || ''),
    edited: Boolean(src.edited),
    canEdit: Boolean(src.canEdit),
    canDelete: Boolean(src.canDelete),
  };
  if (!('cheerCount' in src)) return full;
  return {
    ...full,
    cheerCount: Number.isFinite(src.cheerCount) ? Math.max(0, src.cheerCount) : 0,
    cheered: src.cheered === true,
    canCheer: src.canCheer === true,
  };
}

async function request(url, init = {}) {
  const res = await fetch(url, { credentials: 'include', ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data.message || 'board api error');
    err.status = res.status;
    throw err;
  }
  return data;
}

function listUrl(boardKey, category, offset) {
  const params = new URLSearchParams({ board_key: boardKey });
  if (category) params.set('category', category);
  if (offset) params.set('offset', String(offset));
  return `${API}?${params}`;
}

function toListEntry(data, category, prevPosts = []) {
  const access = data.access === 'full' ? 'full' : 'titles';
  const fresh = (Array.isArray(data.posts) ? data.posts : []).map((p) => normalizeInfoPost(p, access));
  const seen = new Set(prevPosts.map((p) => p.id));
  const posts = [...prevPosts, ...fresh.filter((p) => p.id && !seen.has(p.id))];
  const total = Number.isFinite(data.total) ? data.total : posts.length;
  return {
    status: 'ready',
    access,
    category,
    posts,
    total,
    hasMore: typeof data.hasMore === 'boolean' ? data.hasMore : posts.length < total,
    canCompose: access === 'full' && data.canCompose === true,
  };
}

/* ── 목록 ── */

/** 받은 목록. 다른 세션 주인 것이면 null. */
export function getInfoList(viewer, boardKey) {
  claim(viewer);
  return _lists.get(boardKey) ?? null;
}

/**
 * 첫 페이지(최신순 20개). 실패는 status 'failed' 로 담고 던지지 않는다. 학생·member 는 서버에 묻지 않는다.
 * @param {InfoViewer} viewer @param {string} boardKey @param {string} [category]
 */
export async function loadInfoList(viewer, boardKey, category = '') {
  const who = claim(viewer);
  if (infoAccessFor(viewer, boardKey) === 'blocked') {
    const entry = { status: 'blocked', access: 'blocked', category, posts: [], total: 0, hasMore: false, canCompose: false };
    _lists.set(boardKey, entry);
    return entry;
  }
  let entry;
  try {
    entry = toListEntry(await request(listUrl(boardKey, category, 0)), category);
  } catch {
    entry = { status: 'failed', access: '', category, posts: [], total: 0, hasMore: false, canCompose: false };
  }
  if (who === _owner) _lists.set(boardKey, entry);
  return entry;
}

/** 「더 보기」: 지금 분류 그대로 다음 페이지를 붙인다. 실패는 던진다. */
export async function loadMoreInfoList(viewer, boardKey) {
  const who = claim(viewer);
  const entry = _lists.get(boardKey);
  if (!entry || entry.status !== 'ready' || !entry.hasMore) return entry ?? null;
  const data = await request(listUrl(boardKey, entry.category, entry.posts.length));
  if (who !== _owner || _lists.get(boardKey) !== entry) return _lists.get(boardKey) ?? null;
  const next = toListEntry(data, entry.category, entry.posts);
  _lists.set(boardKey, next);
  return next;
}

/* ── 글 하나 ── */

/** 받은 글(단건 캐시 → 목록 캐시). 없으면 null. */
export function getInfoPost(viewer, boardKey, postKey) {
  claim(viewer);
  const detail = _details.get(detailKey(boardKey, postKey));
  if (detail) return detail;
  const entry = _lists.get(boardKey);
  const post = entry?.status === 'ready' ? entry.posts.find((p) => p.id === postKey) : null;
  return post ? { status: 'ready', access: entry.access, post } : null;
}

/** 서버에서 글 하나. 없으면 status 'not_found', 실패는 'failed'. 던지지 않는다. */
export async function loadInfoPost(viewer, boardKey, postKey) {
  const who = claim(viewer);
  if (infoAccessFor(viewer, boardKey) === 'blocked') {
    return { status: 'blocked', access: 'blocked', post: null };
  }
  let entry;
  try {
    const params = new URLSearchParams({ board_key: boardKey, post_key: postKey });
    const data = await request(`${API}?${params}`);
    const access = data.access === 'full' ? 'full' : 'titles';
    entry = { status: 'ready', access, post: normalizeInfoPost(data.post, access) };
  } catch (err) {
    entry = { status: err?.status === 404 ? 'not_found' : 'failed', access: '', post: null };
  }
  if (who === _owner) _details.set(detailKey(boardKey, postKey), entry);
  return entry;
}

/* ── 글쓰기·수정 (POST) ── */

/**
 * postKey 가 있으면 수정, 없으면 새 글. 작성자·역할은 보내지 않는다(서버가 세션에서 정한다).
 * 성공하면 목록 캐시에 바로 반영한다. 실패는 서버 메시지로 던진다.
 * @param {InfoViewer} viewer
 * @param {{ boardKey: string, postKey?: string, title: string, body: string, category: string }} input
 */
export async function saveInfoPost(viewer, input) {
  const who = claim(viewer);
  const payload = { board_key: input.boardKey, title: input.title, body: input.body, category: input.category };
  if (input.postKey) payload.post_key = input.postKey;
  const data = await request(API, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(payload) });
  const post = normalizeInfoPost(data.post, 'full');
  invalidateInfoRail(input.boardKey);
  if (who !== _owner) return post;
  _details.set(detailKey(input.boardKey, post.id), { status: 'ready', access: 'full', post });
  const entry = _lists.get(input.boardKey);
  if (entry?.status === 'ready') {
    if (input.postKey) {
      _lists.set(input.boardKey, { ...entry, posts: entry.posts.map((p) => (p.id === post.id ? post : p)) });
    } else if (!entry.category || entry.category === post.categoryId) {
      _lists.set(input.boardKey, { ...entry, posts: [post, ...entry.posts], total: entry.total + 1 });
    } else {
      _lists.delete(input.boardKey);
    }
  }
  return post;
}

/* ── 삭제 (DELETE) ── */

/** 실패는 서버 메시지로 던진다. 성공하면 캐시에서 뺀다. */
export async function deleteInfoPost(viewer, boardKey, postKey) {
  const who = claim(viewer);
  const params = new URLSearchParams({ board_key: boardKey, post_key: postKey });
  await request(`${API}?${params}`, { method: 'DELETE' });
  invalidateInfoRail(boardKey);
  if (who !== _owner) return;
  _details.delete(detailKey(boardKey, postKey));
  const entry = _lists.get(boardKey);
  if (entry?.status === 'ready') {
    _lists.set(boardKey, {
      ...entry,
      posts: entry.posts.filter((p) => p.id !== postKey),
      total: Math.max(0, entry.total - 1),
    });
  }
}

/* ── info-student 응원(cheer) (POST reactions.php) ── */

/**
 * 계정당 글마다 1회 토글. 결과(cheered·cheerCount)는 서버 응답으로만 바꾼다. 실패는 서버 메시지로 던진다.
 * @param {InfoViewer} viewer @param {string} boardKey @param {string} postKey
 */
export async function toggleInfoCheer(viewer, boardKey, postKey) {
  const who = claim(viewer);
  const data = await request(REACTION_API, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ board_key: boardKey, post_key: postKey }),
  });
  const result = {
    cheered: data.cheered === true,
    cheerCount: Number.isFinite(data.cheerCount) ? Math.max(0, data.cheerCount) : 0,
  };
  if (who !== _owner) return result;
  const patch = (p) => (p && p.id === postKey && 'cheerCount' in p ? { ...p, ...result } : p);
  const dk = detailKey(boardKey, postKey);
  const detail = _details.get(dk);
  if (detail?.post) _details.set(dk, { ...detail, post: patch(detail.post) });
  const entry = _lists.get(boardKey);
  if (entry?.status === 'ready') _lists.set(boardKey, { ...entry, posts: entry.posts.map(patch) });
  return result;
}

/* ── 우측 레일 배너(최신 3개) · 레일 읽기 팝업 목록 ── */

export const INFO_RAIL_LIMIT = 3;
export const INFO_POPUP_PAGE_SIZE = 10;
/** 레일 배너 목록을 다시 받기 전까지 쓰는 시간 */
const INFO_RAIL_TTL_MS = 3 * 60 * 1000;

/** 저장·삭제 뒤 그 게시판 레일 목록을 버린다. 다음 렌더에서 서버로 다시 받는다. */
export function invalidateInfoRail(boardKey) {
  _rail.delete(boardKey);
  _railPending.delete(boardKey);
}

/** 받은 레일 목록. 받는 중(받은 적 없음)이면 null. 실패는 status 'failed'(0건과 구분). */
export function getInfoRailList(viewer, boardKey) {
  claim(viewer);
  return _rail.get(boardKey) ?? null;
}

/** 받은 값이 있고 실패가 아니며 오래되지 않았는지. */
export function isInfoRailFresh(viewer, boardKey) {
  claim(viewer);
  const entry = _rail.get(boardKey);
  return Boolean(entry && entry.status === 'ready' && Date.now() - entry.loadedAt < INFO_RAIL_TTL_MS);
}

/**
 * 레일 배너 목록: GET posts.php?board_key&limit=3 (분류 없음, 서버 최신순). 던지지 않는다.
 * 같은 게시판 진행 중 요청은 하나만 둔다. 학생·member 는 서버에 묻지 않는다.
 * 레일은 제목·분류·날짜·id 만 쓰므로 응답 access 와 상관없이 제목 항목으로 담는다.
 * @param {InfoViewer} viewer @param {string} boardKey
 */
export function loadInfoRailList(viewer, boardKey) {
  claim(viewer);
  if (infoAccessFor(viewer, boardKey) === 'blocked') return Promise.resolve(null);
  const pending = _railPending.get(boardKey);
  if (pending) return pending;
  const params = new URLSearchParams({ board_key: boardKey, limit: String(INFO_RAIL_LIMIT) });
  const task = request(`${API}?${params}`)
    .then(
      (data) => ({
        status: 'ready',
        posts: (Array.isArray(data.posts) ? data.posts : [])
          .map((p) => normalizeInfoPost(p, 'titles'))
          .filter((p) => p.id && p.title)
          .slice(0, INFO_RAIL_LIMIT),
      }),
      () => ({ status: 'failed', posts: [] }),
    )
    .then((entry) => {
      if (_railPending.get(boardKey) === task) {
        _railPending.delete(boardKey);
        _rail.set(boardKey, { ...entry, loadedAt: Date.now() });
      }
      return entry;
    });
  _railPending.set(boardKey, task);
  return task;
}

/**
 * 레일 팝업 목록 한 페이지(최신순). 캐시하지 않고 매번 서버(offset·limit·total)에서 받는다. 던지지 않는다.
 * @param {InfoViewer} viewer @param {string} boardKey @param {number} offset @param {number} [limit]
 */
export async function loadInfoPage(viewer, boardKey, offset, limit = INFO_POPUP_PAGE_SIZE) {
  claim(viewer);
  const empty = { access: '', posts: [], total: 0, offset, limit };
  if (infoAccessFor(viewer, boardKey) === 'blocked') return { ...empty, status: 'blocked', access: 'blocked' };
  try {
    const params = new URLSearchParams({ board_key: boardKey, limit: String(limit), offset: String(offset) });
    const data = await request(`${API}?${params}`);
    const access = data.access === 'full' ? 'full' : 'titles';
    const posts = (Array.isArray(data.posts) ? data.posts : []).map((p) => normalizeInfoPost(p, access)).filter((p) => p.id);
    return {
      status: 'ready',
      access,
      posts,
      total: Number.isFinite(data.total) ? data.total : offset + posts.length,
      offset: Number.isFinite(data.offset) ? data.offset : offset,
      limit,
    };
  } catch {
    return { ...empty, status: 'failed' };
  }
}
