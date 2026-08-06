/** 홍보 랜딩 라우터 — #/promo/* */

import { PROMO_LANDINGS } from './catalog.js';

const LIVE_IDS = PROMO_LANDINGS.filter((p) => p.status === 'live').map((p) => p.id);

export function getDefaultPromoPath() {
  return '/promo/study-room';
}

export function normalizePromoPath(hashPath) {
  const p = (hashPath.startsWith('/') ? hashPath : `/${hashPath}`).split('?')[0];
  if (p === '/promo' || p === '/promo/') return getDefaultPromoPath();
  const m = p.match(/^\/promo\/([a-z0-9-]+)$/);
  if (!m) return null;
  if (LIVE_IDS.includes(m[1])) return `/promo/${m[1]}`;
  const planned = PROMO_LANDINGS.find((row) => row.id === m[1]);
  if (planned) return `/promo/${m[1]}`;
  return null;
}

export function getPromoView(path) {
  const normalized = normalizePromoPath(path) || getDefaultPromoPath();
  const id = normalized.replace(/^\/promo\//, '');
  return { id, path: normalized };
}
