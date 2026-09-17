/**
 * 유료상품 storefront theme helper
 * positions / access 전용. 기능 로직·API와 무관.
 * 전역 body / GNB / 공통 버튼 정의에 올리지 말 것.
 * ivory 캔버스는 .plans-sf-page에만 적용 (좌메뉴·우레일 비오염).
 */

export const PAID_STOREFRONT_PATHS = ['/plans/positions', '/plans/access'];

/** @param {string} [path] */
export function isPaidStorefrontPath(path) {
  const p = String(path || '').split('?')[0];
  return PAID_STOREFRONT_PATHS.includes(p);
}

/** @param {string} innerHtml */
export function wrapPaidStorefront(innerHtml) {
  return `<div class="plans-theme" data-theme="plans">${innerHtml}</div>`;
}
