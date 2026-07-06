const JSON_HEADERS = { 'Content-Type': 'application/json' };
const CREDENTIALS = { credentials: 'include' };

async function readJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || 'board api error');
  }
  return data;
}

/** @param {string} boardKey @param {{ authorRole?: string, postKey?: string }} [opts] */
export async function fetchBoardPosts(boardKey, opts = {}) {
  const params = new URLSearchParams({ board_key: boardKey });
  if (opts.authorRole) params.set('author_role', opts.authorRole);
  if (opts.postKey) params.set('post_key', opts.postKey);
  const res = await fetch(`/api/board/posts.php?${params}`);
  return readJson(res);
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
