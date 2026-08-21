/**
 * 쇼케이스 후기 티저 마운트 마크업.
 * store/API를 가져오지 않는다 (ShopPage verify는 Node에서 render만 로드한다).
 */

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/**
 * @param {{ providerType?: string, providerId?: number }} opts
 */
export function shopReviewTeaserMountHtml(opts = {}) {
  const providerType = opts.providerType === 'tutor' ? 'tutor' : 'study_room';
  const providerId = Number(opts.providerId) || 0;
  return `<div class="shop-review-teaser" data-shop-review-teaser data-provider-type="${esc(providerType)}" data-provider-id="${providerId}"></div>`;
}
