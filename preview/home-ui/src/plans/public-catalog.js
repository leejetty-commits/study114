/**
 * 비로그인 노출상품·쪽지권 가격표.
 * 이름·기간·가격은 서버 카탈로그(getCatalogByFamily)만 쓴다.
 * 설명 문장은 로그인 구매 화면과 같은 카피이다.
 */

import { getCatalogByFamily, formatKrw } from './runtime-config.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

const ROLE_LABEL = {
  study_room: '공부방',
  tutor: '과외쌤',
};

/** 로그인 노출상품 화면의 상품 설명과 같은 문장 */
const POSITION_LEAD = {
  study_room: {
    prime: '선택한 단지·행정동의 프라임 대표 자리를 확보하세요. 프라임은 선택 지역에서 3개만 운영하는 한정 대표 노출입니다.',
    pick: '선택한 지역의 추천 영역에서 고르게 발견되세요. 한 페이지에 10개씩 노출되며, 15분마다 공정하게 순환합니다.',
  },
  tutor: {
    prime: '선택한 시와 주력과목의 프라임 영역에 페이지당 3명씩 노출되며, 15분마다 공정하게 순환합니다.',
    pick: '한 페이지에 10명씩 노출되며, 15분마다 공정하게 순환합니다.',
  },
};

function periodText(option) {
  const label = option.label || option.apiVariant || '';
  if (option.expireDays) return `${label} · 구매일부터 ${option.expireDays}일`;
  if (option.ticketKind === 'immediate' || option.apiVariant === '1회') return `${label} · 결제 후 바로 발송`;
  if (
    option.durationType === 'day' &&
    option.durationValue &&
    !String(label).includes(String(option.durationValue))
  ) {
    return `${label} · ${option.durationValue}일`;
  }
  return label;
}

function priceRows(options) {
  return (options || [])
    .map((o) => {
      const list =
        Number(o.discountKrw) > 0 && Number(o.listPriceKrw) > 0
          ? `<span class="plans-public__list">${esc(formatKrw(o.listPriceKrw))}</span>`
          : '';
      const off = o.discountLabel ? `<span class="plans-public__off">${esc(o.discountLabel)}</span>` : '';
      return `
        <li class="plans-public__price">
          <span class="plans-public__period">${esc(periodText(o))}</span>
          <span class="plans-public__amount">${list}<strong>${esc(formatKrw(o.priceKrw))}</strong>${off}</span>
        </li>`;
    })
    .join('');
}

function buyButton(returnPath) {
  return `<button type="button" class="btn btn--primary plans-public__cta" data-plans-public-login data-plans-return="${esc(returnPath)}">로그인하고 구매하기</button>`;
}

function refundLink() {
  return `
    <p class="plans-public__refund">
      <a href="#/support/faq/plans" data-nav="/support/faq/plans">환불 규정은 결제·상품 자주 묻는 질문에서 확인합니다.</a>
    </p>`;
}

function productBlock(product, lead, returnPath) {
  const checks = (product.bullets || [])
    .filter(Boolean)
    .map((b) => `<li>${esc(b)}</li>`)
    .join('');
  return `
    <article class="plans-sf-panel plans-public__product" data-product-code="${esc(product.productCode)}" data-provider-type="${esc(product.providerType)}">
      <header class="plans-sf-panel__head">
        <h3 class="plans-sf-panel__title">${esc(product.name)}</h3>
        <p class="plans-sf-panel__lead">${esc(lead || product.tagline || '')}</p>
      </header>
      ${product.tagline ? `<p class="plans-public__tagline">${esc(product.tagline)}</p>` : ''}
      ${checks ? `<ul class="plans-card__checks">${checks}</ul>` : ''}
      <ul class="plans-public__prices">${priceRows(product.options)}</ul>
      ${buyButton(returnPath)}
    </article>`;
}

/**
 * @param {string} path
 */
export function renderPublicPlansCatalog(path) {
  const base = String(path || '').split('?')[0];
  if (base === '/plans/access') return renderPublicAccess(path);
  return renderPublicPositions(path);
}

function renderPublicPositions(path) {
  const returnPath = path.split('?')[0] === '/plans/positions' ? path : '/plans/positions';
  const groups = ['study_room', 'tutor']
    .map((role) => {
      const products = getCatalogByFamily('position', role).filter(
        (p) => p.productCode === 'prime' || p.productCode === 'pick',
      );
      if (!products.length) return '';
      const cards = products
        .map((p) => productBlock(p, POSITION_LEAD[role]?.[p.productCode] || p.tagline, returnPath))
        .join('');
      return `
        <section class="plans-public__group" aria-label="${esc(ROLE_LABEL[role])} 노출상품">
          <h2 class="plans-public__role-name">${esc(ROLE_LABEL[role])}</h2>
          ${cards}
        </section>`;
    })
    .join('');

  return `
    <section class="plans-store plans-public" data-plans-public="positions">
      <header class="plans-sf-hero">
        <p class="plans-public__eyebrow">유료 안내</p>
        <h1 class="plans-public__title">노출상품</h1>
        <p class="plans-public__role">프라임·픽은 공부방·과외쌤 전용입니다.</p>
      </header>
      ${groups || '<p class="plans-sf-empty" role="status">상품 정보를 다시 불러와 주세요.</p>'}
      ${refundLink()}
    </section>`;
}

function renderPublicAccess(path) {
  const returnPath = path.split('?')[0] === '/plans/access' ? path : '/plans/access';
  const products = getCatalogByFamily('access').filter((p) => p.productCode === 'memo_ticket');
  const cards = products
    .map((p) =>
      productBlock(
        p,
        '학생에게 먼저 보내는 첫 쪽지만 차감됩니다. 같은 대화방의 후속 쪽지와, 학생·학부모가 먼저 보낸 쪽지에 대한 답장은 무료입니다.',
        returnPath,
      ),
    )
    .join('');

  return `
    <section class="plans-store plans-public" data-plans-public="access">
      <header class="plans-sf-hero">
        <p class="plans-public__eyebrow">유료 안내</p>
        <h1 class="plans-public__title">쪽지권</h1>
        <p class="plans-public__role">쪽지권은 공부방·과외쌤 전용입니다.</p>
      </header>
      ${cards || '<p class="plans-sf-empty" role="status">상품 정보를 다시 불러와 주세요.</p>'}
      ${refundLink()}
    </section>`;
}

/**
 * 둘 다 있어야 비로그인 가격표가 역할별로 완성된 것이다.
 * @param {string} path
 * @param {Array<{ family?: string, provider_type?: string, product_code?: string }> | undefined} products
 */
export function publicCatalogComplete(path, products) {
  const list = Array.isArray(products) ? products : [];
  const base = String(path || '').split('?')[0];
  if (base === '/plans/access') {
    return list.some((p) => p.family === 'access' && p.product_code === 'memo_ticket');
  }
  const roles = new Set(
    list
      .filter((p) => p.family === 'position' && (p.product_code === 'prime' || p.product_code === 'pick'))
      .map((p) => p.provider_type),
  );
  return roles.has('study_room') && roles.has('tutor');
}
