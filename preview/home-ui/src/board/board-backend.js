import {
  fetchBoardPosts,
  removeBoardPost,
  saveBoardPost,
  uploadSubmissionAttachment,
  requestAttachmentDownloadToken,
  attachmentDownloadUrl,
} from './board-api.js';
import { getBoardAccess } from '../board-channel-acl.js';
import { authRoleType } from '../auth-role.js';

const OPERATIONAL_BOARD_KEYS = ['notice', 'faq', 'safe-guide'];
const SUBMISSION_BOARD_KEY = 'submission';

let apiMode = false;
/** @type {Map<string, any[]>} */
const postsByBoard = new Map();

/** 고객센터·홈용 세션 역할 필터 캐시 (board API view 파라미터) */
/** @type {any[]} */
let noticeCenterPosts = [];
/** @type {any[]} */
let noticeHomePosts = [];

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

/**
 * @param {{ navRole?: string }} [opts]
 * navRole을 주면 ACL상 blocked 보드는 요청하지 않는다.
 * 게스트 첫 부트에서 submission 401을 만들지 않기 위한 옵션.
 * 인자 없이 호출하면 기존과 같이 전 보드를 가져온다.
 */
export async function activateBoardApi(opts = {}) {
  apiMode = true;
  await hydrateBoardCache(opts);
}

export function deactivateBoardApi() {
  apiMode = false;
  resetCaches();
  resetNoticeCaches();
}

const HYDRATE_BOARD_KEYS = [
  SUBMISSION_BOARD_KEY,
  ...OPERATIONAL_BOARD_KEYS,
];

/** @param {string} navRole */
export function boardKeysBlockedForRole(navRole) {
  return HYDRATE_BOARD_KEYS.filter((key) => getBoardAccess(key, navRole).access === 'blocked');
}

/**
 * 명시 navRole이 없으면 세션 role_type. 비로그인은 guest.
 * blocked 보드(submission 은 과외쌤·운영만)는 GET 하지 않는다.
 * @param {string} [explicit]
 */
function resolveHydrateNavRole(explicit) {
  const given = String(explicit || '').trim();
  if (given) return given;
  return authRoleType() || 'guest';
}

/**
 * @param {{ navRole?: string, onlyKeys?: string[] }} [opts]
 * navRole(또는 세션 역할)에서 blocked인 보드는 요청하지 않는다.
 * onlyKeys가 있으면 그 키만 갱신한다.
 */
export async function hydrateBoardCache(opts = {}) {
  const navRole = resolveHydrateNavRole(opts.navRole);
  const only = Array.isArray(opts.onlyKeys) ? new Set(opts.onlyKeys) : null;
  const keys = HYDRATE_BOARD_KEYS.filter((key) => !only || only.has(key));
  const pairs = await Promise.all(keys.map(async (key) => {
    if (getBoardAccess(key, navRole).access === 'blocked') {
      return [key, []];
    }
    const data = await fetchBoardPosts(key).catch(() => ({ posts: [] }));
    return [key, data.posts ?? []];
  }));
  pairs.forEach(([key, posts]) => {
    setBoardCache(key, posts);
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
  if (boardKey === 'notice') resetNoticeCaches();
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
  if (boardKey === 'notice') resetNoticeCaches();
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

export function resetNoticeCaches() {
  noticeCenterPosts = [];
  noticeHomePosts = [];
}

export async function hydrateNoticeCenter() {
  try {
    const data = await fetchBoardPosts('notice', { view: 'center' });
    noticeCenterPosts = (data.posts ?? []).map((p) => ({ ...p }));
  } catch {
    noticeCenterPosts = [];
  }
}

export async function hydrateNoticeHome() {
  try {
    const data = await fetchBoardPosts('notice', { view: 'home', limit: 3 });
    noticeHomePosts = (data.posts ?? []).map((p) => ({ ...p }));
  } catch {
    noticeHomePosts = [];
  }
}

export function getNoticeCenterPosts() {
  return noticeCenterPosts.map((p) => ({ ...p }));
}

export function getNoticeHomePosts() {
  return noticeHomePosts.map((p) => ({ ...p }));
}
