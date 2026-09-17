/**
 * 유료상품 storefront / hub theme helper
 * 기능 로직·API와 무관.
 * 전역 body / GNB / 공통 버튼 정의에 올리지 말 것.
 * warm canvas: left gutter+nav+gap+body (1016). hero도 이 트랙만. rail/footer 제외.
 * hub cinema 높이 280/240/208, hero→body 간격 24/20/16. 상세 nav outer top = intro outer top.
 */

export const PAID_STOREFRONT_PATHS = ['/plans/positions', '/plans/access'];
export const PAID_HUB_PATHS = ['/plans'];
export const PAID_TRACK_PATHS = ['/plans', '/plans/positions', '/plans/access'];

/** @param {string} [path] */
export function isPaidStorefrontPath(path) {
  const p = String(path || '').split('?')[0];
  return PAID_STOREFRONT_PATHS.includes(p);
}

/** 유료상품 홈(안내 허브). 시네마는 여기만. */
export function isPaidHubPath(path) {
  const p = String(path || '').split('?')[0];
  return PAID_HUB_PATHS.includes(p);
}

/** 홈·노출·쪽지권 공통 paid 트랙 (warm 1016 + white rail). */
export function isPaidTrackPath(path) {
  const p = String(path || '').split('?')[0];
  return PAID_TRACK_PATHS.includes(p);
}

/** @param {string} innerHtml */
export function wrapPaidStorefront(innerHtml) {
  return `<div class="plans-theme" data-theme="plans">${innerHtml}</div>`;
}
