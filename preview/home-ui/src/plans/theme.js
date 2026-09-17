/**
 * 유료상품 storefront / hub theme helper
 * 기능 로직·API와 무관.
 * 전역 body / GNB / 공통 버튼 정의에 올리지 말 것.
 * ivory: storefront는 .plans-sf-page, hub는 좌 gutter+nav+gap+body(1016).
 */

export const PAID_STOREFRONT_PATHS = ['/plans/positions', '/plans/access'];
export const PAID_HUB_PATHS = ['/plans'];

/** @param {string} [path] */
export function isPaidStorefrontPath(path) {
  const p = String(path || '').split('?')[0];
  return PAID_STOREFRONT_PATHS.includes(p);
}

/** 유료상품 홈(안내 허브). 시네마·warm canvas는 여기만. */
export function isPaidHubPath(path) {
  const p = String(path || '').split('?')[0];
  return PAID_HUB_PATHS.includes(p);
}

/** @param {string} innerHtml */
export function wrapPaidStorefront(innerHtml) {
  return `<div class="plans-theme" data-theme="plans">${innerHtml}</div>`;
}
