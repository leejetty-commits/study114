/** 34장 — `#/plans/*` 상품센터 라우트 */

/** @typedef {'P18-01'|'P18-02'|'P18-03'|'P18-04'|'P18-05'|'P18-06'|'P18-07'} PlansScreenId */

export const PLANS_BASE = '/plans';

/** 레거시·상품센터 운영 경로 → 마이페이지 운영 허브 */
export const PLANS_REDIRECTS = {
  '/mypage/paid': '/mypage/plans',
  '/mypage/paid/usage': '/mypage/plans/my',
  '/plans/my': '/mypage/plans/my',
  '/plans/history': '/mypage/plans/history',
};

/** @type {Record<string, PlansScreenId>} */
export const PLANS_PATH_TO_SCREEN = {
  '/plans': 'P18-01',
  '/plans/positions': 'P18-02',
  '/plans/access': 'P18-03',
  '/plans/my': 'P18-04',
  '/plans/history': 'P18-05',
  '/plans/checkout': 'P18-06',
  '/plans/result': 'P18-07',
};

/**
 * @param {string} hashPath
 * @returns {string | null}
 */
export function normalizePlansPath(hashPath) {
  const raw = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  const p = raw.split('?')[0];
  if (p === '/plans' || p === '/plans/') return '/plans';
  if (PLANS_PATH_TO_SCREEN[p]) return p;
  return null;
}

/** @param {string} hashPath */
export function isPlansPath(hashPath) {
  return normalizePlansPath(hashPath) != null;
}

/** @param {string} path */
export function getPlansScreenId(path) {
  const n = normalizePlansPath(path);
  return n ? PLANS_PATH_TO_SCREEN[n] : null;
}

export function getDefaultPlansPath() {
  return '/plans';
}

/** @param {PlansScreenId | string} screenId */
export function plansScreenTitle(screenId) {
  const map = {
    'P18-01': '상품홈',
    'P18-02': '노출상품',
    'P18-03': '접근권상품',
    'P18-04': '내 상품',
    'P18-05': '결제내역',
    'P18-06': '결제',
    'P18-07': '결제 결과',
  };
  return map[screenId] || '유료상품';
}

/**
 * hash query 파싱 (#/plans/positions?provider_type=tutor&provider_id=1)
 * @returns {Record<string, string>}
 */
export function parsePlansQuery() {
  const hash = window.location.hash || '';
  const qIdx = hash.indexOf('?');
  if (qIdx < 0) return {};
  const params = new URLSearchParams(hash.slice(qIdx + 1));
  /** @type {Record<string, string>} */
  const out = {};
  params.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

/**
 * @param {string} path
 * @param {Record<string, string|number|undefined|null>} [query]
 */
export function buildPlansHref(path, query = {}) {
  const base = path.startsWith('/') ? path : `/${path}`;
  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v == null || v === '') return;
    qs.set(k, String(v));
  });
  const q = qs.toString();
  return q ? `#${base}?${q}` : `#${base}`;
}
