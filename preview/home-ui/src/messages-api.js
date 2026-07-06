/**
 * 16장 P16 — Messages REST client (PHP 엔드포인트)
 * 배선: public/api/messages/threads.php
 */

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const CREDENTIALS = { credentials: 'include' };

export const MESSAGES_ENDPOINTS = {
  threads: '/api/messages/threads.php',
  entitlements: '/api/messages/entitlements.php',
};

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.code = data.error;
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function listThreads() {
  const res = await fetch(MESSAGES_ENDPOINTS.threads, { ...CREDENTIALS });
  return parseJson(res);
}

export async function getThread(threadId) {
  const qs = `?thread_id=${threadId}`;
  const res = await fetch(`${MESSAGES_ENDPOINTS.threads}${qs}`, { ...CREDENTIALS });
  return parseJson(res);
}

export async function getSummaryCounts() {
  const res = await fetch(`${MESSAGES_ENDPOINTS.threads}?counts=1`, { ...CREDENTIALS });
  return parseJson(res);
}

/**
 * @param {object} payload
 * @returns {Promise<{ thread: object }>}
 */
export async function composeMessage(payload) {
  const res = await fetch(MESSAGES_ENDPOINTS.threads, {
    method: 'POST',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({ action: 'compose', ...payload }),
  });
  return parseJson(res);
}

export async function replyMessage(threadId, body) {
  const res = await fetch(MESSAGES_ENDPOINTS.threads, {
    method: 'POST',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({ action: 'reply', thread_id: threadId, body }),
  });
  return parseJson(res);
}

export async function markThreadReadApi(threadId) {
  const res = await fetch(MESSAGES_ENDPOINTS.threads, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({ action: 'mark_read', thread_id: threadId }),
  });
  return parseJson(res);
}

export async function fetchEntitlements() {
  const res = await fetch(MESSAGES_ENDPOINTS.entitlements, { ...CREDENTIALS });
  return parseJson(res);
}

export async function patchThreadAction(threadId, action, extra = {}) {
  const res = await fetch(MESSAGES_ENDPOINTS.threads, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({ action, thread_id: threadId, ...extra }),
  });
  return parseJson(res);
}
