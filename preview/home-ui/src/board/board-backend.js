import {
  fetchBoardPosts,
  removeBoardPost,
  saveBoardPost,
  uploadSubmissionAttachment,
  requestAttachmentDownloadToken,
  attachmentDownloadUrl,
} from './board-api.js';

const LIBRARY_BOARD_KEYS = ['library', 'library-template', 'library-guide-pdf'];
const OPERATIONAL_BOARD_KEYS = ['notice', 'faq', 'safe-guide'];
const SUBMISSION_BOARD_KEY = 'submission';

let apiMode = false;
/** @type {Map<string, any[]>} */
const postsByBoard = new Map();

export function isBoardApiMode() {
  return apiMode;
}

function resetCaches() {
  postsByBoard.clear();
}

function setBoardCache(boardKey, posts) {
  postsByBoard.set(boardKey, posts.map((p) => ({ ...p })));
}

export function getBoardPostsCache(boardKey) {
  return (postsByBoard.get(boardKey) ?? []).map((p) => ({ ...p }));
}

export function getOperationalPostsCache(boardKey) {
  return getBoardPostsCache(boardKey);
}

export function getSubmissionPostsCache(authorRole) {
  return getBoardPostsCache(SUBMISSION_BOARD_KEY).filter((p) => p.authorRole === authorRole);
}

export function getLibraryPostsCache() {
  return LIBRARY_BOARD_KEYS.flatMap((key) => getBoardPostsCache(key));
}

function upsertPostCache(boardKey, row) {
  const list = getBoardPostsCache(boardKey);
  const idx = list.findIndex((p) => p.id === row.id);
  const copy = { ...row };
  if (idx >= 0) list[idx] = copy;
  else list.unshift(copy);
  list.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)) || String(b.id).localeCompare(String(a.id)));
  setBoardCache(boardKey, list);
  return copy;
}

function removePostCache(boardKey, postKey) {
  setBoardCache(boardKey, getBoardPostsCache(boardKey).filter((p) => p.id !== postKey));
}

export async function activateBoardApi() {
  apiMode = true;
  await hydrateBoardCache();
}

export function deactivateBoardApi() {
  apiMode = false;
  resetCaches();
}

export async function hydrateBoardCache() {
  const results = await Promise.all([
    ...LIBRARY_BOARD_KEYS.map((key) => fetchBoardPosts(key).catch(() => ({ posts: [] }))),
    fetchBoardPosts(SUBMISSION_BOARD_KEY).catch(() => ({ posts: [] })),
    ...OPERATIONAL_BOARD_KEYS.map((key) => fetchBoardPosts(key).catch(() => ({ posts: [] }))),
  ]);
  LIBRARY_BOARD_KEYS.forEach((key, i) => {
    setBoardCache(key, results[i].posts ?? []);
  });
  setBoardCache(SUBMISSION_BOARD_KEY, results[LIBRARY_BOARD_KEYS.length].posts ?? []);
  OPERATIONAL_BOARD_KEYS.forEach((key, i) => {
    setBoardCache(key, results[LIBRARY_BOARD_KEYS.length + 1 + i].posts ?? []);
  });
}

/** @param {Record<string, unknown>} input */
export async function apiSaveSubmissionPost(input) {
  const payload = { board_key: SUBMISSION_BOARD_KEY, ...input, boardKey: undefined };
  const data = await saveBoardPost(payload);
  if (data.post) upsertPostCache(SUBMISSION_BOARD_KEY, data.post);
  return data.post;
}

/** @param {string} boardKey @param {Record<string, unknown>} input */
export async function apiSaveOperationalPost(boardKey, input) {
  const payload = { board_key: boardKey, author_role: 'admin', ...input, boardKey: undefined };
  const data = await saveBoardPost(payload);
  if (data.post) upsertPostCache(boardKey, data.post);
  return data.post;
}

/** @param {string} postKey @param {string} authorRole */
export async function apiDeleteSubmissionPost(postKey, authorRole) {
  await removeBoardPost(SUBMISSION_BOARD_KEY, postKey, authorRole);
  removePostCache(SUBMISSION_BOARD_KEY, postKey);
}

/** @param {string} boardKey @param {string} postKey @param {string} authorRole */
export async function apiDeleteOperationalPost(boardKey, postKey, authorRole = 'admin') {
  await removeBoardPost(boardKey, postKey, authorRole);
  removePostCache(boardKey, postKey);
}

/** @param {string} postKey @param {string} authorRole @param {File} file */
export async function apiUploadSubmissionAttachment(postKey, authorRole, file) {
  const data = await uploadSubmissionAttachment(postKey, authorRole, file);
  await hydrateBoardCache();
  return data.attachment;
}

/**
 * @param {string} postKey
 * @param {{ authorRole?: string, audience?: 'owner'|'admin' }} [opts]
 */
export async function apiOpenSubmissionAttachment(postKey, opts = {}) {
  const data = await requestAttachmentDownloadToken(postKey, opts);
  window.open(attachmentDownloadUrl(data.token), '_blank', 'noopener,noreferrer');
}
