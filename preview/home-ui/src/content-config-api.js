import { adminFetch } from './admin/admin-fetch.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function readJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || 'content config api error');
  }
  return data;
}

export async function fetchBoardChannels() {
  const res = await adminFetch('/api/admin/content/channels.php');
  return readJson(res);
}

/** @param {Record<string, unknown>} input */
export async function saveBoardChannelApi(input) {
  const res = await adminFetch('/api/admin/content/channels.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  return readJson(res);
}

export async function fetchRightRailSlots() {
  const res = await adminFetch('/api/admin/content/right-rails.php');
  return readJson(res);
}

/** @param {Record<string, unknown>} input */
export async function saveRightRailSlotApi(input) {
  const res = await adminFetch('/api/admin/content/right-rails.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  return readJson(res);
}
