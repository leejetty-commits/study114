/**
 * 동네 인사. 저장 성공은 서버 API가 ok를 돌려준 뒤만.
 * 화면 목록은 그 응답과 GET 결과를 보여 준다. 랭킹 점수 필드는 없다.
 */

import { buildGreetingRecord } from './neighborhood-greeting.js';

const STORAGE_KEY = 'study114-neighborhood-greetings-v1';
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
}

/**
 * 서버에 반영된 뒤에만 ok.
 * @param {object} input
 * @returns {Promise<{ ok: true, record: GreetingRecord } | { ok: false, error: string }>}
 */
export async function publishGreeting(input) {
  const built = buildGreetingRecord(input);
  if (!built.ok) return built;
  const pushed = await pushGreeting(built.record);
  if (!pushed.ok) return { ok: false, error: pushed.message };
  const items = readGreetings().filter((row) => row.id !== built.record.id);
  items.unshift(built.record);
  writeGreetings(items);
  return { ok: true, record: built.record };
}

/** @param {'study_room'|'tutor'} providerType @param {number} registrationId */
export async function unpublishGreeting(providerType, registrationId) {
  const id = `${providerType === 'tutor' ? 'tutor' : 'study_room'}:${Number(registrationId)}`;
  const current = readGreetings().find((row) => row.id === id);
  if (!current) return { ok: false, error: '올릴 인사가 없어요.' };
  const row = { ...current, status: 'down', updatedAt: Date.now() };
  const pushed = await pushGreeting(row);
  if (!pushed.ok) return { ok: false, error: pushed.message };
  const items = readGreetings().map((item) => (item.id === id ? row : item));
  writeGreetings(items);
  return { ok: true };
}

/** @param {'study_room'|'tutor'} providerType @param {number} registrationId */
export function greetingForRegistration(providerType, registrationId) {
  const id = `${providerType === 'tutor' ? 'tutor' : 'study_room'}:${Number(registrationId)}`;
  return readGreetings().find((row) => row.id === id) || null;
}

/** 예전 로컬 전달 쿠키·해시는 저장으로 쓰지 않고 지운다. */
export function importGreetingHandoff() {
  document.cookie = 'study114_ng=; path=/; max-age=0; samesite=lax';
  stripHashToken();
  return false;
}

/** @returns {Promise<boolean>} */
export async function pullGreetingsFromApi() {
  try {
    const res = await fetch('/api/neighborhood-greetings.php', { credentials: 'include' });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data?.ok || !Array.isArray(data.items)) return false;
    const before = JSON.stringify(readGreetings());
    writeGreetings(data.items.map(fromApi).filter(isRecord));
    return JSON.stringify(readGreetings()) !== before;
  } catch {
    return false;
  }
}

/**
 * @param {GreetingRecord} record
 * @returns {Promise<{ ok: true } | { ok: false, message: string }>}
 */
async function pushGreeting(record) {
  try {
    const res = await fetch('/api/neighborhood-greetings.php', {
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
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return { ok: false, message: String(data.message || '저장하지 못했어요.') };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: '저장하지 못했어요.' };
  }
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
