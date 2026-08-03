/**
 * SPA 간 이동 시 hash/pathname이 유실돼도 목적 경로를 복구하기 위한 보험.
 * (등록·검색 → 홈 이동 시 fragment 탈락, /plans 딥링크 실패 등)
 */

const KEY = 'study114:pending-route';

/** @param {string} path e.g. `/plans` · `/support` */
export function setPendingRoute(path) {
  const raw = String(path || '').trim();
  if (!raw) return;
  const normalized = (raw.startsWith('/') ? raw : `/${raw}`).split('?')[0];
  try {
    sessionStorage.setItem(KEY, normalized);
  } catch {
    /* private mode 등 */
  }
}

/** @returns {string | null} */
export function peekPendingRoute() {
  try {
    const v = sessionStorage.getItem(KEY);
    return v && v.startsWith('/') ? v : null;
  } catch {
    return null;
  }
}

/** 읽고 즉시 제거 · 없으면 null */
export function consumePendingRoute() {
  const v = peekPendingRoute();
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return v;
}

export function clearPendingRoute() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
