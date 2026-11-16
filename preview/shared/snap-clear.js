/** 엔트리에 두는 작은 저장소. 본문 읽기·쓰기는 session-snapshot.js 다. */

const KEY = 'study114.snap.v1';

export const SNAPSHOT_TTL_MS = 3 * 60 * 1000;

/** @type {Set<(kind: string) => void>} */
const listeners = new Set();

export function clearSnapshotStorage() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => {
    try {
      fn('all');
    } catch {
      /* ignore */
    }
  });
}

/** @param {(kind: string) => void} listener */
export function onRegistrationSnapshotInvalidated(listener) {
  listeners.add(listener);
}

/** @param {string} kind */
export function notifySnapshotInvalidated(kind) {
  listeners.forEach((fn) => {
    try {
      fn(kind);
    } catch {
      /* ignore */
    }
  });
}

export function readSnapshotStorage() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

/** @param {Record<string, unknown>} data */
export function writeSnapshotStorage(data) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* quota */
  }
}

/** @param {unknown} at @param {number} [ttl] */
export function isSnapshotFresh(at, ttl = SNAPSHOT_TTL_MS) {
  const savedAt = Number(at);
  return Number.isFinite(savedAt) && Date.now() - savedAt < ttl;
}
