import { adminFetch, adminHttpStatus } from './admin-fetch.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const CREDENTIALS = { credentials: 'include' };
const ENDPOINT = '/api/admin/member-mail.php';

async function readJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data.message || 'admin api error');
    err.code = data.error || '';
    err.status = adminHttpStatus(res, data);
    throw err;
  }
  return data;
}

export async function fetchMemberMail() {
  return readJson(await adminFetch(ENDPOINT, CREDENTIALS));
}

/** @param {string} kind @param {boolean} enabled */
export async function patchMemberMail(kind, enabled) {
  return readJson(
    await adminFetch(ENDPOINT, { method: 'PATCH', headers: JSON_HEADERS, ...CREDENTIALS, body: JSON.stringify({ kind, enabled }) }),
  );
}

/** @param {'preview'|'test'} action @param {string} kind @param {string} variant */
export async function postMemberMail(action, kind, variant) {
  return readJson(
    await adminFetch(ENDPOINT, { method: 'POST', headers: JSON_HEADERS, ...CREDENTIALS, body: JSON.stringify({ action, kind, variant }) }),
  );
}
