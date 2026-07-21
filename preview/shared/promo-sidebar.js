/**
 * 사이트 공통 우측 프로모 배너 — 홈(게스트)과 동일 마크업.
 * 배너 없는 페이지: 로그인·회원가입·공부방/과외쌤 상세등록.
 */

export const SITE_PROMO_ITEMS = {
  premium: {
    tag: '프리미엄',
    title: '우리동네 상단 노출',
    desc: '대표·추천 노출 — 상세등록 완료 후 이용',
    cta: '상품 안내',
    action: 'ad-premium',
  },
  partner: {
    tag: '제휴',
    title: '지역 학원·교육 브랜드',
    desc: '광고 슬롯',
    cta: '광고 문의',
    action: 'ad-inquiry',
  },
  public: {
    tag: '안내',
    title: '우동공과 이용 가이드',
    desc: '등록·비교검색 안내',
    cta: '이용 안내',
    action: 'ad-guide',
  },
};

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

/** @param {typeof SITE_PROMO_ITEMS.premium} item @param {'tall'|'compact'|''} [variant] */
export function renderPromoCard(item, variant = '') {
  const tall = variant === 'tall' ? ' promo-card--tall' : variant === 'compact' ? ' promo-card--compact' : '';
  return `
    <div class="promo-card${tall}" data-action="${esc(item.action)}">
      <span class="promo-card__tag">${esc(item.tag)}</span>
      <strong class="promo-card__title">${esc(item.title)}</strong>
      <p class="promo-card__desc">${esc(item.desc)}</p>
      <button type="button" class="promo-card__cta">${esc(item.cta)} →</button>
    </div>
  `;
}

/** 홈과 동일한 우측 배너 */
export function renderSitePromoSidebar() {
  return `
    <aside class="home-sidebar home-sidebar--guest home-sidebar--promo" aria-label="프로모션">
      ${renderPromoCard(SITE_PROMO_ITEMS.premium, 'tall')}
      ${renderPromoCard(SITE_PROMO_ITEMS.partner)}
      ${renderPromoCard(SITE_PROMO_ITEMS.public)}
    </aside>
  `;
}

export function renderSitePromoInline() {
  return `<div class="guest-ad-inline">${renderPromoCard(SITE_PROMO_ITEMS.premium, 'compact')}</div>`;
}

/**
 * home-app / search 등 본문 + 우측 배너 2열 래퍼
 * @param {string} mainHtml
 */
export function wrapMainWithPromoSidebar(mainHtml) {
  return `
    <div class="home-body home-body--with-promo">
      <div class="home-main">${mainHtml}</div>
      ${renderSitePromoSidebar()}
    </div>
  `;
}

/** @param {ParentNode} root @param {{ plansHash?: string }} [opts] */
export function bindSitePromoSidebarEvents(root, opts = {}) {
  const plansHash = opts.plansHash || '#/plans/positions';
  root.querySelectorAll('[data-action^="ad-"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      if (plansHash.startsWith('http') || plansHash.startsWith('/')) {
        window.location.assign(plansHash);
      } else {
        window.location.hash = plansHash;
      }
    });
  });
}
