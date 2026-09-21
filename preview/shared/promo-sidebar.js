/**
 * @deprecated 2026-09-21 실렌더 퇴출.
 * 우측 영역 정본은 `preview/home-ui/src/right-rail.js` Quiet Rails.
 * 이 모듈을 레이아웃 렌더 경로에 다시 연결하지 말 것.
 */

/** @deprecated Quiet Rails로 대체. 구 광고 카드 데이터는 보관만. */
export const SITE_PROMO_ITEMS = {};

/** @deprecated 빈 문자열. 실사용 금지. */
export function renderPromoCard() {
  return '';
}

/** @deprecated 빈 문자열. `renderRightRailSidebar` 사용. */
export function renderSitePromoSidebar() {
  return '';
}

/** @deprecated 빈 문자열. 레일 인라인은 `renderRightRailBlock`. */
export function renderSitePromoInline() {
  return '';
}

/** @deprecated 본문만 반환. `renderAppShellWithPromo` / live-rail 사용. */
export function wrapMainWithPromoSidebar(mainHtml) {
  return `<div class="home-body"><div class="home-main">${mainHtml || ''}</div></div>`;
}

/** @deprecated no-op. 구 `data-action="ad-*"` 배너는 제거됨. */
export function bindSitePromoSidebarEvents() {}
