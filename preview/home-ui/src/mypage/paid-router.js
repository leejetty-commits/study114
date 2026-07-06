/** 18장 P18-xx — 유료서비스 본체 hash (P15-09 허브와 분리) */

/** @typedef {'P18-01'|'P18-02'} PaidScreenId */

export const PAID_BASE = '/mypage/paid';

/** @type {Record<string, PaidScreenId>} */
export const PAID_PATH_TO_SCREEN = {
  '/mypage/paid': 'P18-01',
  '/mypage/paid/usage': 'P18-02',
};

/**
 * @param {string} hashPath
 * @returns {PaidScreenId | null}
 */
export function parsePaidPath(hashPath) {
  const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  return PAID_PATH_TO_SCREEN[p] ?? null;
}

/** @param {string} hashPath */
export function isPaidPath(hashPath) {
  return parsePaidPath(hashPath) != null;
}

/** @param {PaidScreenId} screenId */
export function paidScreenTitle(screenId) {
  const map = {
    'P18-01': '유료 서비스 안내',
    'P18-02': '이용중·반응 요약',
  };
  return map[screenId] || '유료 서비스';
}
