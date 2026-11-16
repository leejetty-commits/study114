/**
 * 16장 P16 — 쪽지 영속 레이어 (API 캐시 · sessionStorage fallback)
 */

import {
  listThreads,
  getThread,
  composeMessage,
  replyMessage,
  markThreadReadApi,
  patchThreadAction,
} from './messages-api.js';
import { hydrateProviderStatus } from './provider-status.js';

let apiMode = false;

/** 스냅샷에 적어 둔 미확인 수. 목록이 도착하기 전 홈 칸이 이 값을 쓴다. */
let unreadHold = null;

let threadsReady = true;

/** @type {import('./messages/thread-store.js').MessageThread[]} */
let threadsCache = [];

/** @type {Map<number, import('./messages/thread-store.js').MessageThread>} */
const threadDetailCache = new Map();

export function isMessagesApiMode() {
  return apiMode;
}

/** @param {number} count */
export function seedUnreadHold(count) {
  const n = Number(count);
  if (!Number.isFinite(n) || n < 0) return;
  unreadHold = Math.floor(n);
  threadsReady = false;
}

/** 목록을 받기 전에만 스냅샷 수를 돌려준다. */
export function peekUnreadHold() {
  return unreadHold != null && !threadsReady ? unreadHold : null;
}

function releaseUnreadHold() {
  unreadHold = null;
  threadsReady = true;
}

/** 화면을 다시 그릴지 판정할 미확인 수. 쪽지 본문은 세지 않는다. */
export function sessionUnreadCount() {
  const held = peekUnreadHold();
  if (held != null) return held;
  if (!apiMode) return 0;
  return threadsCache.filter((thread) => thread.unread).length;
}

function resetCache() {
  threadsCache = [];
  threadDetailCache.clear();
}

export async function activateMessagesApi() {
  apiMode = true;
  try {
    await hydrateMessagesCache();
  } catch (err) {
    warnMessages(err);
    resetCache();
  } finally {
    releaseUnreadHold();
  }
}

export function deactivateMessagesApi() {
  apiMode = false;
  releaseUnreadHold();
  resetCache();
}

export async function hydrateMessagesCache() {
  const data = await listThreads();
  threadsCache = (data.threads ?? []).map((t) => ({ ...t }));
  threadDetailCache.clear();
}

/** @returns {import('./messages/thread-store.js').MessageThread[]} */
export function getThreadsCache() {
  return threadsCache.map((t) => ({ ...t, messages: [...(t.messages ?? [])] }));
}

/**
 * @param {number} id
 * @returns {import('./messages/thread-store.js').MessageThread|null}
 */
export function getThreadFromCache(id) {
  const numId = Number(id);
  const detailed = threadDetailCache.get(numId);
  if (detailed) {
    return { ...detailed, messages: [...detailed.messages] };
  }
  const summary = threadsCache.find((t) => Number(t.id) === numId);
  if (!summary) return null;
  return { ...summary, messages: [...(summary.messages ?? [])] };
}

/** @param {import('./messages/thread-store.js').MessageThread} thread */
function upsertThreadInCache(thread) {
  const id = Number(thread.id);
  const idx = threadsCache.findIndex((t) => Number(t.id) === id);
  const copy = { ...thread, id, messages: [...(thread.messages ?? [])] };
  if (idx >= 0) {
    threadsCache[idx] = copy;
  } else {
    threadsCache.unshift(copy);
  }
  threadDetailCache.set(id, copy);
}

function warnMessages(err) {
  console.warn('[messages-api]', err instanceof Error ? err.message : err);
}

/**
 * @param {object} input
 * @returns {Promise<import('./messages/thread-store.js').MessageThread>}
 */
export async function apiFindOrCreateThread(input) {
  const payload = {
    context_kind: input.contextKind,
    context_id: input.contextId,
    context_label: input.contextLabel,
    peer_display_name: input.peerDisplayName,
    scope_badge: input.scopeBadge,
    scope_hint: input.scopeHint,
    show_request_in_panel: input.showRequestInPanel,
    request_summary: input.requestSummary,
    structured_line: input.structuredLine,
    body: input.body,
  };
  const files = Array.isArray(input.files) ? input.files : [];
  const data = await composeMessage(payload, files);
  const thread = data.thread;
  upsertThreadInCache(thread);
  if (input.contextKind === 'student') {
    hydrateProviderStatus().catch(warnMessages);
  }
  return { ...thread, messages: [...(thread.messages ?? [])] };
}

/** @param {number} id @param {string} body @param {File[]} [files] */
export async function apiAppendMessage(id, body, files = []) {
  const data = await replyMessage(id, body, files);
  const thread = data.thread;
  upsertThreadInCache(thread);
  return { ...thread, messages: [...(thread.messages ?? [])] };
}

/** @param {number} id */
export async function apiMarkThreadRead(id) {
  const t = threadsCache.find((x) => x.id === id);
  if (t) t.unread = false;
  const detailed = threadDetailCache.get(id);
  if (detailed) detailed.unread = false;
  markThreadReadApi(id).catch(warnMessages);
}

/** @param {number} id */
export async function apiHydrateThreadDetail(id) {
  const data = await getThread(id);
  const thread = data.thread;
  upsertThreadInCache(thread);
  return { ...thread, messages: [...(thread.messages ?? [])] };
}

/** @param {number} id @param {'archive'|'unarchive'|'block'|'report'|'important'|'unimportant'} action @param {object} [extra] */
export async function apiThreadModeration(id, action, extra = {}) {
  const data = await patchThreadAction(id, action, extra);
  if (data.thread) upsertThreadInCache(data.thread);
  return data;
}
