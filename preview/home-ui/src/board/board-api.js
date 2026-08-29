import {
  getBoardAccess,
  getBoardIntroPayload,
  isAccessFailClosed,
  normalizeBoardKey,
} from '../board-channel-acl.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const CREDENTIALS = { credentials: 'include' };

/**
 * GET /api/board/posts.php 공통 정규화.
 * 서버 access=intro|blocked 이면 무조건 posts=[].
 * 로컬 ACL 이 full 이 아니면 무조건 posts=[].
 * 보호 채널에서 access 필드가 없으면 full 로 추정하지 않고 fail closed.
 * intro 는 서버 값을 쓰지 않고 로컬에서 다시 만든다. 구형 서버가 소개문에 글 정보를 실어도 버린다.
 *
 * @param {unknown} data
 * @param {{ boardKey?: string, navRole?: string }} [ctx]
 * @returns {{ posts: any[], access: 'full'|'intro'|'blocked', intro: object|null }}
 */
export function normalizeBoardListResponse(data, ctx = {}) {
  const boardKey = normalizeBoardKey(ctx.boardKey || '');
  const navRole = ctx.navRole || 'guest';
  const local = boardKey ? getBoardAccess(boardKey, navRole) : null;
  const localIntro = boardKey ? getBoardIntroPayload(boardKey, navRole) : null;

  const empty = (access) => ({ posts: [], access, intro: localIntro });

  let posts = [];
  let serverAccess = null;
  if (Array.isArray(data)) {
    posts = data;
  } else {
    const raw = data && typeof data === 'object' ? data : {};
    const accessRaw = String(raw.access || '');
    if (accessRaw === 'intro' || accessRaw === 'blocked' || accessRaw === 'full') {
      serverAccess = accessRaw;
    }
    posts = Array.isArray(raw.posts) ? raw.posts : [];
  }

  if (serverAccess === 'intro' || serverAccess === 'blocked') {
    return empty(serverAccess);
  }

  if (local && local.access !== 'full') {
    return empty(local.access);
  }

  const legacy = serverAccess === null;
  if (legacy) {
    if (!boardKey || isAccessFailClosed(boardKey) || !local || local.access !== 'full') {
      const access = local?.access && local.access !== 'full' ? local.access : 'blocked';
      return empty(access);
    }
    return { posts, access: 'full', intro: null };
  }

  if (!local || local.access !== 'full') {
    return empty(local?.access || 'blocked');
  }
  return { posts, access: 'full', intro: null };
}

async function readJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || 'board api error');
  }
  return data;
}

/** @param {string} boardKey @param {{ authorRole?: string, postKey?: string, id?: string, navRole?: string }} [opts] */
export async function fetchBoardPosts(boardKey, opts = {}) {
  const params = new URLSearchParams({ board_key: boardKey });
  if (opts.authorRole) params.set('author_role', opts.authorRole);
  const postKey = opts.postKey || opts.id;
  if (postKey) {
    params.set('post_key', postKey);
    params.set('id', postKey);
  }
  const res = await fetch(`/api/board/posts.php?${params}`);
  const data = await readJson(res);
  let navRole = opts.navRole;
  if (!navRole) {
    const { getNavRole } = await import('../state.js');
    navRole = getNavRole();
  }
  return normalizeBoardListResponse(data, {
    boardKey,
    navRole,
  });
}

/** @param {Record<string, unknown>} input */
export async function saveBoardPost(input) {
  const res = await fetch('/api/board/posts.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  return readJson(res);
}

/** @param {string} boardKey @param {string} postKey @param {string} authorRole */
export async function removeBoardPost(boardKey, postKey, authorRole) {
  const params = new URLSearchParams({
    board_key: boardKey,
    post_key: postKey,
    author_role: authorRole,
  });
  const res = await fetch(`/api/board/posts.php?${params}`, { method: 'DELETE' });
  return readJson(res);
}

/** @param {string} postKey @param {string} authorRole @param {File} file */
export async function uploadSubmissionAttachment(postKey, authorRole, file) {
  const fd = new FormData();
  fd.append('post_key', postKey);
  fd.append('author_role', authorRole);
  fd.append('file', file);
  const res = await fetch('/api/board/submission-attachments.php', { method: 'POST', body: fd });
  return readJson(res);
}

/**
 * @param {string} postKey
 * @param {{ authorRole?: string, audience?: 'owner'|'admin' }} [opts]
 */
export async function requestAttachmentDownloadToken(postKey, opts = {}) {
  const res = await fetch('/api/board/attachments/token.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({
      post_key: postKey,
      audience: opts.audience || 'owner',
      author_role: opts.authorRole,
    }),
  });
  return readJson(res);
}

/** @param {string} token */
export function attachmentDownloadUrl(token) {
  return `/api/board/attachments/download.php?token=${encodeURIComponent(token)}`;
}
