/**
 * 유료상품 홈 v2.1 허브 마크업.
 * 라우트·권한·카탈로그 hydrate는 index/screens가 담당한다.
 * 구매 UI(기간/횟수/배지 폼/주문요약)는 넣지 않는다.
 */

import heroSoftUrl from './assets/hero-soft.svg?url';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/** 홈 전용 시네마. 상세 페이지에서 호출하지 말 것. */
export function renderPlansHubCinema() {
  return `
    <section class="plans-hub-cinema home-cinema--soft" aria-label="유료상품 안내">
      <div class="cinema-bg" aria-hidden="true">
        <img class="cinema-bg__img" src="${esc(heroSoftUrl)}" alt="" width="1280" height="280">
        <div class="cinema-bg__overlay"></div>
      </div>
      <div class="cinema-content">
        <div class="cinema-eyebrow">PAID · GUIDE HUB</div>
        <h1>무료로 시작하고,<br>필요할 때만 올린다</h1>
        <p class="cinema-lead">마이샵 꾸미기와 Basic 노출은 무료입니다. 더 자주 보이고 싶을 때는 노출상품, 먼저 연락하고 싶을 때는 쪽지권을 선택하세요.</p>
        <div class="cinema-actions">
          <a class="btn-cinema-primary" href="#/plans/positions" data-plans-nav="/plans/positions">노출상품 자세히 보기</a>
          <a class="btn-cinema-ghost" href="#/plans/access" data-plans-nav="/plans/access">쪽지권 자세히 보기</a>
        </div>
      </div>
    </section>`;
}

/**
 * 홈 우레일 안내 카드. 실제 연결은 기존 route 유지.
 * 주문요약·구매 CTA 없음.
 */
export function renderPlansHubRailCard() {
  return `
    <div class="plans-hub-rail__card">
      <h2 class="plans-hub-rail__title">이 페이지 역할</h2>
      <p class="plans-hub-rail__tip">이 페이지는 안내·진입 허브입니다. 구매 선택은 노출상품·쪽지권 상세에서 이어집니다.</p>
      <h2 class="plans-hub-rail__title">바로 가기</h2>
      <div class="plans-hub-rail__links">
        <a href="#/plans/positions" data-plans-nav="/plans/positions">노출상품 상세</a>
        <a href="#/plans/access" data-plans-nav="/plans/access">쪽지권 상세</a>
        <a href="#/mypage/plans/my" data-nav="/mypage/plans/my">이용중 내역 보기</a>
        <a href="#/support" data-nav="/support">고객센터</a>
      </div>
      <a class="plans-hub-rail__help" href="#/support/contact" data-nav="/support/contact">문의하기</a>
    </div>`;
}

/**
 * @param {{ noticesHtml?: string }} [opts]
 */
export function renderPlansHomeBody(opts = {}) {
  const notices = String(opts.noticesHtml || '').trim();
  return `
    <div class="plans-hub-page__inner" data-plans-home-hub>
      ${notices ? `<div class="plans-hub-notices">${notices}</div>` : ''}
      <div class="home-title-row">
        <h2>상품 선택</h2>
        <a class="text-link-mine" href="#/mypage/plans/my" data-nav="/mypage/plans/my">이용중 내역 보기</a>
      </div>
      <p class="home-core">유료는 필요한 때만 선택합니다. 자동연장 없이, 기간·횟수만 고르면 됩니다.</p>

      <div class="entry-grid" role="list">
        <a class="entry-card" href="#/plans/positions" data-plans-nav="/plans/positions" role="listitem">
          <span class="entry-kicker">EXPOSURE</span>
          <h3 class="entry-title">노출상품</h3>
          <p class="entry-desc">Prime·Pick으로 더 자주 발견되게 만듭니다. 홈·추천 영역에서 보이는 기회를 기간제로 올립니다.</p>
          <span class="entry-cta">상세에서 기간 선택 →</span>
        </a>
        <a class="entry-card" href="#/plans/access" data-plans-nav="/plans/access" role="listitem">
          <span class="entry-kicker">MESSAGE</span>
          <h3 class="entry-title">쪽지권</h3>
          <p class="entry-desc">학생에게 먼저 보내는 첫 쪽지 기회를 선택합니다. 같은 대화의 후속 응답은 무료입니다.</p>
          <span class="entry-cta">상세에서 횟수 선택 →</span>
        </a>
      </div>

      <aside class="badge-aux" aria-labelledby="badgeAuxTitle">
        <div class="badge-aux__inner">
          <h3 id="badgeAuxTitle" class="badge-aux__title">홍보 배지<span class="badge-aux__opt">(선택)</span></h3>
          <p class="badge-aux__desc">노출상품에 짧은 강조 표시를 더하는 선택 옵션입니다. 단독 구매가 아니라 노출상품과 함께 쓰며, 한 번에 최대 2개까지 선택합니다.</p>
          <ul class="badge-aux__chips" aria-label="핵심 조건">
            <li>짧은 강조</li>
            <li>노출상품과 함께</li>
            <li>최대 2개</li>
          </ul>
        </div>
      </aside>

      <section class="howto-block" aria-labelledby="howtoTitle">
        <h2 id="howtoTitle">언제 쓰면 되는지</h2>
        <ul>
          <li>목록·추천에서 더 자주 보이고 싶을 때 → <strong>노출상품</strong></li>
          <li>관심 학생에게 먼저 쪽지를 보내고 싶을 때 → <strong>쪽지권</strong></li>
          <li>노출상품에 짧은 강조 표시를 더하고 싶을 때 → <strong>홍보 배지</strong>(노출과 함께·최대 2개)</li>
          <li>마이샵 꾸미기·Basic 노출만으로 충분할 때는 유료 없이 이용해도 됩니다</li>
        </ul>
      </section>

      <section class="free-paid-block" aria-labelledby="fpTitle">
        <h2 id="fpTitle">무료 · 유료 한눈에</h2>
        <div class="free-paid-grid">
          <div class="fp-cell">
            <strong>무료</strong>
            <span>마이샵 꾸미기 · Basic 목록 노출 · 받은 쪽지에 답장</span>
          </div>
          <div class="fp-cell">
            <strong>선택 유료</strong>
            <span>노출상품(Prime/Pick) · 쪽지권 · 홍보 배지(노출상품과 함께)</span>
          </div>
        </div>
      </section>

      <section class="faq-cta-block" aria-labelledby="faqTitle">
        <h2 id="faqTitle">궁금한 점이 있나요?</h2>
        <p>환불·만료·이용 중인 상품은 상세·내 상품·고객센터에서 확인할 수 있습니다.</p>
        <div class="btn-row">
          <a class="plans-hub-outline" href="#/support" data-nav="/support">고객센터</a>
          <a class="plans-hub-outline" href="#/mypage/plans/my" data-nav="/mypage/plans/my">내 상품</a>
        </div>
      </section>
    </div>`;
}
