/**
 * 동네 인사. 저장 성공은 서버 API가 ok를 돌려준 뒤만.
 * 화면 목록은 그 응답과 GET 결과를 보여 준다. 랭킹 점수 필드는 없다.
 */

import { buildGreetingRecord } from './neighborhood-greeting.js';

const STORAGE_KEY = 'study114-neighborhood-greetings-v1';
const MAX_ITEMS = 40;

/** @typedef {import('./neighborhood-greeting.js').buildGreetingRecord extends (...args: any) => infer R ? R : never} Built */

/**
 * @typedef {object} GreetingHistoryItem
 * @property {string} id
 * @property {string} body
 * @property {number} updated_at
 */

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
 * @property {string} [historyId]
 * @property {GreetingHistoryItem[]} [history]
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
 * @returns {Promise<{ ok: true, record: GreetingRecord, item?: any } | { ok: false, error: string }>}
 */
export async function publishGreeting(input) {
  const built = buildGreetingRecord(input);
  if (!built.ok) return built;
  const pushed = await pushGreeting(built.record);
  if (!pushed.ok) return { ok: false, error: pushed.message };
  const history = Array.isArray(pushed.item?.history) ? pushed.item.history : built.record.history;
  const record = {
    ...built.record,
    body: pushed.item?.body || built.record.body,
    updatedAt: Number(pushed.item?.updated_at) || built.record.updatedAt,
    status: pushed.item?.status || built.record.status,
    history,
  };
  const items = readGreetings().filter((row) => row.id !== built.record.id);
  items.unshift(record);
  writeGreetings(items);
  return { ok: true, record, item: pushed.item };
}

/** @param {'study_room'|'tutor'} providerType @param {number} registrationId */
export async function unpublishGreeting(providerType, registrationId) {
  const id = `${providerType === 'tutor' ? 'tutor' : 'study_room'}:${Number(registrationId)}`;
  const current = readGreetings().find((row) => row.id === id);
  if (!current) return { ok: false, error: '올릴 인사가 없어요.' };
  const row = { ...current, status: /** @type {'down'} */ ('down'), updatedAt: Date.now() };
  const pushed = await pushGreeting(row);
  if (!pushed.ok) return { ok: false, error: pushed.message };
  const history = Array.isArray(pushed.item?.history) ? pushed.item.history : current.history;
  const nextRow = { ...row, history };
  const items = readGreetings().map((item) => (item.id === id ? nextRow : item));
  writeGreetings(items);
  return { ok: true, item: pushed.item };
}

/**
 * @param {'study_room'|'tutor'} providerType
 * @param {number} registrationId
 * @param {string} historyId
 * @returns {Promise<{ ok: true, item?: any } | { ok: false, error: string }>}
 */
export async function deleteGreeting(providerType, registrationId, historyId) {
  try {
    const res = await fetch('/api/neighborhood-greetings.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        provider_type: providerType,
        registration_id: registrationId,
        history_id: historyId,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return { ok: false, error: String(data.message || '삭제하지 못했어요.') };
    }
    const id = `${providerType === 'tutor' ? 'tutor' : 'study_room'}:${Number(registrationId)}`;
    const current = readGreetings().find((row) => row.id === id);
    if (current) {
      const updated = {
        ...current,
        status: data.item?.status || current.status,
        body: data.item?.body ?? current.body,
        history: Array.isArray(data.item?.history) ? data.item.history : [],
        updatedAt: Number(data.item?.updated_at) || Date.now(),
      };
      const items = readGreetings().map((item) => (item.id === id ? updated : item));
      writeGreetings(items);
    }
    return { ok: true, item: data.item };
  } catch {
    return { ok: false, error: '삭제하지 못했어요.' };
  }
}

/**
 * 로그인한 소유자의 본인 history/status를 조회해 로컬 캐시를 갱신한다.
 * @param {'study_room'|'tutor'} providerType
 * @param {number} registrationId
 * @returns {Promise<{ ok: true, item?: any } | { ok: false, error: string }>}
 */
export async function fetchMineGreeting(providerType, registrationId) {
  try {
    const res = await fetch(
      `/api/neighborhood-greetings.php?mine=1&provider_type=${encodeURIComponent(providerType)}&registration_id=${encodeURIComponent(registrationId)}`,
      { credentials: 'include' }
    );
    if (!res.ok) return { ok: false, error: '조회 실패' };
    const data = await res.json().catch(() => ({}));
    if (!data?.ok) return { ok: false, error: String(data?.message || '조회 실패') };
    if (data.item) {
      if (data.item.status === 'welcome') {
        return { ok: true, item: data.item };
      }
      const id = `${providerType === 'tutor' ? 'tutor' : 'study_room'}:${Number(registrationId)}`;
      const prev = readGreetings().find((row) => row.id === id);
      const record = {
        id,
        providerType,
        registrationId,
        body: String(data.item.body || ''),
        neighborhood: String(data.item.neighborhood || prev?.neighborhood || ''),
        displayName: String(data.item.display_name || prev?.displayName || ''),
        status: data.item.status === 'up' ? /** @type {'up'} */ ('up') : /** @type {'down'} */ ('down'),
        updatedAt: Number(data.item.updated_at) || Date.now(),
        origin: data.item.origin ? String(data.item.origin) : prev?.origin,
        welcome: data.item.welcome,
        history: Array.isArray(data.item.history) ? data.item.history : [],
      };
      const items = readGreetings().filter((row) => row.id !== id);
      items.unshift(record);
      writeGreetings(items);
    }
    return { ok: true, item: data.item };
  } catch {
    return { ok: false, error: '조회 실패' };
  }
}

/** @param {'study_room'|'tutor'} providerType @param {number} registrationId */
export async function turnOffWelcomeGreeting(providerType, registrationId) {
  try {
    const res = await fetch('/api/neighborhood-greetings.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider_type: providerType,
        registration_id: registrationId,
        status: 'welcome_off',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return { ok: false, error: String(data.message || '소개를 내리지 못했어요.') };
    }
    const id = `${providerType === 'tutor' ? 'tutor' : 'study_room'}:${Number(registrationId)}`;
    const current = readGreetings().find((row) => row.id === id);
    const updated = {
      ...(current || {
        id,
        providerType,
        registrationId,
        body: '',
        neighborhood: '',
        displayName: providerType === 'tutor' ? '과외쌤' : '공부방',
      }),
      status: /** @type {'down'} */ ('down'),
      origin: 'welcome_off',
      body: data.item?.body ?? (current?.body || ''),
      history: Array.isArray(data.item?.history) ? data.item.history : (current?.history || []),
      updatedAt: Number(data.item?.updated_at) || Date.now(),
    };
    const items = readGreetings().filter((row) => row.id !== id);
    items.unshift(updated);
    writeGreetings(items);
    return { ok: true, item: data.item };
  } catch {
    return { ok: false, error: '소개를 내리지 못했어요.' };
  }
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
 * @returns {Promise<{ ok: true, item?: any } | { ok: false, message: string }>}
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
        history_id: record.historyId || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return { ok: false, message: String(data.message || '저장하지 못했어요.') };
    }
    return { ok: true, item: data.item };
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
    origin: row.origin ? String(row.origin) : undefined,
    teaser: String(row.teaser || ''),
    maskedName: String(row.masked_name || ''),
    history: Array.isArray(row.history) ? row.history : undefined,
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
