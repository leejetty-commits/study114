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

/** @type {import('./messages/thread-store.js').MessageThread[]} */
let threadsCache = [];

/** @type {Map<number, import('./messages/thread-store.js').MessageThread>} */
const threadDetailCache = new Map();

export function isMessagesApiMode() {
  return apiMode;
}

function resetCache() {
  threadsCache = [];
  threadDetailCache.clear();
}

export async function activateMessagesApi() {
  apiMode = true;
  await hydrateMessagesCache();
}

export function deactivateMessagesApi() {
  apiMode = false;
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
  const detailed = threadDetailCache.get(id);
  if (detailed) {
    return { ...detailed, messages: [...detailed.messages] };
  }
  const summary = threadsCache.find((t) => t.id === id);
  if (!summary) return null;
  return { ...summary, messages: [...(summary.messages ?? [])] };
}

/** @param {import('./messages/thread-store.js').MessageThread} thread */
function upsertThreadInCache(thread) {
  const idx = threadsCache.findIndex((t) => t.id === thread.id);
  const copy = { ...thread, messages: [...(thread.messages ?? [])] };
  if (idx >= 0) {
    threadsCache[idx] = copy;
  } else {
    threadsCache.unshift(copy);
  }
  threadDetailCache.set(thread.id, copy);
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
  const data = await composeMessage(payload);
  const thread = data.thread;
  upsertThreadInCache(thread);
  if (input.contextKind === 'student') {
    hydrateProviderStatus().catch(warnMessages);
  }
  return { ...thread, messages: [...(thread.messages ?? [])] };
}

/** @param {number} id @param {string} body */
export async function apiAppendMessage(id, body) {
  const data = await replyMessage(id, body);
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

/** @param {number} id @param {'archive'|'unarchive'|'block'|'report'} action @param {object} [extra] */
export async function apiThreadModeration(id, action, extra = {}) {
  const data = await patchThreadAction(id, action, extra);
  if (data.thread) upsertThreadInCache(data.thread);
  return data;
}
