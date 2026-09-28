/**
 * 동네 인사 저장. 같은 브라우저의 프리뷰 포트는 쿠키로 맞추고,
 * API가 있으면 그 목록을 합친다. 랭킹 점수 필드는 두지 않는다.
 */

import { buildGreetingRecord, greetingTeaser, maskGreetingName } from './neighborhood-greeting.js';

const STORAGE_KEY = 'study114-neighborhood-greetings-v1';
const COOKIE = 'study114_ng';
const MAX_ITEMS = 40;

/** @typedef {import('./neighborhood-greeting.js').buildGreetingRecord extends (...args: any) => infer R ? R : never} Built */

/**
 * @typedef {object} GreetingRecord
 * @property {string} id
 * @property {'study_room'|'tutor'} providerType
 * @property {number} registrationId
 * @property {string} body
 * @property {string} neighborhood
 * @property {string} displayName
 * @property {'up'|'down'} status
 * @property {number} updatedAt
 * @property {string} [teaser]
 * @property {string} [maskedName]
 */

/** @returns {GreetingRecord[]} */
export function readGreetings() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter(isRecord) : [];
  } catch {
    return [];
  }
}

/** @param {GreetingRecord[]} items */
function writeGreetings(items) {
  const next = items
    .filter(isRecord)
    .sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt))
    .slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  writeCookie(next);
}

/**
 * @param {object} input
 * @returns {{ ok: true, record: GreetingRecord } | { ok: false, error: string }}
 */
export function publishGreeting(input) {
  const built = buildGreetingRecord(input);
  if (!built.ok) return built;
  const items = readGreetings().filter((row) => row.id !== built.record.id);
  items.unshift(built.record);
  writeGreetings(items);
  void pushGreeting(built.record);
  return { ok: true, record: built.record };
}

/** @param {'study_room'|'tutor'} providerType @param {number} registrationId */
export function unpublishGreeting(providerType, registrationId) {
  const id = `${providerType === 'tutor' ? 'tutor' : 'study_room'}:${Number(registrationId)}`;
  const items = readGreetings().map((row) =>
    row.id === id ? { ...row, status: 'down', updatedAt: Date.now() } : row,
  );
  writeGreetings(items);
  const row = items.find((item) => item.id === id);
  if (row) void pushGreeting(row);
}

/** @param {'study_room'|'tutor'} providerType @param {number} registrationId */
export function greetingForRegistration(providerType, registrationId) {
  const id = `${providerType === 'tutor' ? 'tutor' : 'study_room'}:${Number(registrationId)}`;
  return readGreetings().find((row) => row.id === id) || null;
}

/** 가입 화면이 다른 포트여도 홈이 읽을 수 있게 쿠키·해시 토큰을 남긴다. */
export function importGreetingHandoff() {
  let changed = false;
  const fromCookie = readCookie();
  if (fromCookie.length) {
    mergeItems(fromCookie);
    clearCookie();
    changed = true;
  }
  const fromHash = readHashToken();
  if (fromHash) {
    mergeItems([fromHash]);
    stripHashToken();
    changed = true;
  }
  return changed;
}

/** @returns {Promise<boolean>} */
export async function pullGreetingsFromApi() {
  try {
    const res = await fetch('/api/neighborhood-greetings.php', { credentials: 'include' });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data?.ok || !Array.isArray(data.items)) return false;
    const before = JSON.stringify(readGreetings());
    mergeItems(data.items.map(fromApi));
    return JSON.stringify(readGreetings()) !== before;
  } catch {
    return false;
  }
}

/** @param {GreetingRecord} record */
export function encodeGreetingHandoff(record) {
  const json = JSON.stringify({
    providerType: record.providerType,
    registrationId: record.registrationId,
    body: record.body,
    neighborhood: record.neighborhood,
    displayName: record.displayName,
    status: record.status,
    updatedAt: record.updatedAt,
  });
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/** @param {string} url @param {GreetingRecord | null} record */
export function withGreetingHandoff(url, record) {
  if (!record) return url;
  const token = encodeGreetingHandoff(record);
  const hashIdx = url.indexOf('#');
  if (hashIdx === -1) return `${url}#/?ng=${token}`;
  const base = url.slice(0, hashIdx);
  const hash = url.slice(hashIdx + 1);
  const join = hash.includes('?') ? '&' : '?';
  return `${base}#${hash}${join}ng=${encodeURIComponent(token)}`;
}

/** @param {GreetingRecord} record */
async function pushGreeting(record) {
  try {
    await fetch('/api/neighborhood-greetings.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider_type: record.providerType,
        registration_id: record.registrationId,
        body: record.body,
        neighborhood: record.neighborhood,
        display_name: record.displayName,
        status: record.status,
      }),
    });
  } catch {
    /* 로컬 목록으로 충분 */
  }
}

/** @param {GreetingRecord[]} incoming */
function mergeItems(incoming) {
  const map = new Map(readGreetings().map((row) => [row.id, row]));
  incoming.filter(isRecord).forEach((row) => {
    const prev = map.get(row.id);
    map.set(row.id, {
      ...(prev || {}),
      ...row,
      body: row.body || prev?.body || '',
      displayName: row.displayName || prev?.displayName || '',
      teaser: row.teaser || greetingTeaser(row.body || prev?.body || ''),
      maskedName: row.maskedName || maskGreetingName(row.displayName || prev?.displayName || ''),
    });
  });
  writeGreetings([...map.values()]);
}

/** @param {unknown} row @returns {row is GreetingRecord} */
function isRecord(row) {
  if (!row || typeof row !== 'object') return false;
  const item = /** @type {GreetingRecord} */ (row);
  return (
    (item.providerType === 'study_room' || item.providerType === 'tutor') &&
    Number(item.registrationId) > 0 &&
    (item.status === 'up' || item.status === 'down')
  );
}

/** @param {Record<string, unknown>} row @returns {GreetingRecord} */
function fromApi(row) {
  const providerType = row.provider_type === 'tutor' ? 'tutor' : 'study_room';
  const registrationId = Number(row.registration_id);
  return {
    id: `${providerType}:${registrationId}`,
    providerType,
    registrationId,
    body: String(row.body || ''),
    neighborhood: String(row.neighborhood || ''),
    displayName: String(row.display_name || ''),
    status: row.status === 'down' ? 'down' : 'up',
    updatedAt: Number(row.updated_at) || Date.now(),
    teaser: String(row.teaser || ''),
    maskedName: String(row.masked_name || ''),
  };
}

/** @param {GreetingRecord[]} items */
function writeCookie(items) {
  try {
    const payload = encodeURIComponent(JSON.stringify(items.slice(0, 20)));
    document.cookie = `${COOKIE}=${payload}; path=/; max-age=86400; samesite=lax`;
  } catch {
    /* ignore */
  }
}

function clearCookie() {
  document.cookie = `${COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/** @returns {GreetingRecord[]} */
function readCookie() {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
    if (!match) return [];
    const raw = JSON.parse(decodeURIComponent(match[1]));
    return Array.isArray(raw) ? raw.filter(isRecord) : [];
  } catch {
    return [];
  }
}

/** @returns {GreetingRecord | null} */
function readHashToken() {
  try {
    const hash = window.location.hash || '';
    const q = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
    const token = new URLSearchParams(q).get('ng');
    if (!token) return null;
    const json = decodeURIComponent(escape(atob(token.replace(/-/g, '+').replace(/_/g, '/'))));
    const row = JSON.parse(json);
    return isRecord(row) ? row : null;
  } catch {
    return null;
  }
}

function stripHashToken() {
  const hash = window.location.hash || '';
  const qIdx = hash.indexOf('?');
  if (qIdx < 0) return;
  const path = hash.slice(0, qIdx);
  const params = new URLSearchParams(hash.slice(qIdx + 1));
  params.delete('ng');
  const rest = params.toString();
  const next = rest ? `${path}?${rest}` : path;
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}${next}`);
}
