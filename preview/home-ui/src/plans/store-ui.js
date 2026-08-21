/**
 * Visily 톤 — 상품센터 공통 UI 조각
 * (히어로 · 안내박스 · 비교표 · CTA · 부가배지 안내)
 */

import { FREE_TIER_COPY, PAID_TIER_COPY } from '../mypage/plans-catalog.js';
import { formatKrw, resolveCheckoutAmount } from './runtime-config.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/**
 * @param {{ title: string, lead?: string, chips?: Array<{ label: string, href?: string, active?: boolean }> }} opts
 */
export function renderPlansHero(opts) {
  const chips = opts.chips?.length
    ? `<div class="plans-hero__chips">
        ${opts.chips
          .map((c) => {
            if (c.href) {
              return `<a class="plans-chip${c.active ? ' is-active' : ''}" href="#${esc(c.href)}" data-plans-nav="${esc(c.href)}">${esc(c.label)}</a>`;
            }
            return `<span class="plans-chip${c.active ? ' is-active' : ''}">${esc(c.label)}</span>`;
          })
          .join('')}
      </div>`
    : '';
  return `
    <div class="plans-hero">
      <h2 class="plans-hero__title">${esc(opts.title)}</h2>
      ${opts.lead ? `<p class="plans-hero__lead">${esc(opts.lead)}</p>` : ''}
      ${chips}
    </div>`;
}

/**
 * @param {{
 *   title: string,
 *   icon?: string,
 *   items: Array<{ icon?: string, text: string }>,
 *   linkLabel?: string,
 *   linkHref?: string,
 *   linkNav?: string,
 *   variant?: 'guide'|'policy'|'slot'
 * }} opts
 */
export function renderGuideBox(opts) {
  const variant = opts.variant || 'guide';
  const items = opts.items
    .map(
      (it) => `
      <li class="plans-guide__item">
        <span class="plans-guide__ico" aria-hidden="true">${esc(it.icon || '•')}</span>
        <span>${esc(it.text)}</span>
      </li>`,
    )
    .join('');
  const link =
    opts.linkLabel && (opts.linkHref || opts.linkNav)
      ? opts.linkNav
        ? `<a class="plans-guide__link" href="#${esc(opts.linkNav)}" data-nav="${esc(opts.linkNav)}">${esc(opts.linkLabel)} <span aria-hidden="true">›</span></a>`
        : `<a class="plans-guide__link" href="${esc(opts.linkHref)}">${esc(opts.linkLabel)} <span aria-hidden="true">›</span></a>`
      : '';
  return `
    <aside class="plans-guide plans-guide--${variant}">
      <div class="plans-guide__head">
        ${opts.icon ? `<span class="plans-guide__head-ico" aria-hidden="true">${esc(opts.icon)}</span>` : ''}
        <strong class="plans-guide__title">${esc(opts.title)}</strong>
      </div>
      <ul class="plans-guide__list">${items}</ul>
      ${link}
    </aside>`;
}

/**
 * @param {{ title: string, cols: string[], rows: Array<{ label: string, cells: string[] }> }} opts
 */
export function renderCompareTable(opts) {
  return `
    <div class="plans-compare">
      <h3 class="plans-section__title">${esc(opts.title)}</h3>
      <div class="plans-compare__wrap">
        <table class="plans-compare__table" aria-label="${esc(opts.title)}">
          <thead>
            <tr>
              <th scope="col">구분</th>
              ${opts.cols.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${opts.rows
              .map(
                (r) => `
              <tr>
                <th scope="row">${esc(r.label)}</th>
                ${r.cells.map((c, i) => `<td class="${i === r.cells.length - 1 ? 'is-paid' : ''}">${esc(c)}</td>`).join('')}
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

/** 무료 vs 유료 비교 (상품홈) */
export function renderFreePaidCompare() {
  return renderCompareTable({
    title: '무료 vs 유료 혜택 비교',
    cols: ['기본 노출 (무료)', '유료 이용'],
    rows: [
      { label: '가게 꾸미기 · 상세', cells: ['포함', '포함'] },
      { label: '기본 목록 노출', cells: ['포함', '포함'] },
      { label: '조회 · 찜 · 비교 담김', cells: ['포함', '포함'] },
      { label: '학부모 선연락 · 답장', cells: ['무료', '무료'] },
      { label: '대표 · 추천 노출', cells: ['—', '기간형 구매'] },
      { label: '공급자→학생 선제 쪽지', cells: ['차단', '쪽지권'] },
      { label: '요청문 상세 열람', cells: ['제한', '열람권'] },
      { label: '광고성 주목 배지', cells: ['—', '노출 상품과 함께'] },
    ],
  });
}

/** 접근권 비교 */
export function renderAccessCompare() {
  return renderCompareTable({
    title: '접근권별 서비스 비교',
    cols: ['기본', '쪽지권', '요청문 열람권'],
    rows: [
      { label: '학생 요약 정보', cells: ['○', '○', '○'] },
      { label: '학부모 문의 수신 · 답장', cells: ['○', '○', '○'] },
      { label: '학생에게 먼저 쪽지', cells: ['—', '○', '—'] },
      { label: '요청문 상세 열람', cells: ['—', '—', '○'] },
      { label: '사용 단위', cells: ['—', '횟수권', '횟수권'] },
    ],
  });
}

/**
 * @param {{ title: string, lead?: string, primary?: { label: string, href: string, nav?: boolean }, secondary?: { label: string, href: string, nav?: boolean } }} opts
 */
export function renderPlansCtaBanner(opts) {
  const btn = (spec, solid) => {
    if (!spec) return '';
    const cls = solid ? 'plans-cta__btn plans-cta__btn--solid' : 'plans-cta__btn plans-cta__btn--ghost';
    const attr = spec.nav ? `data-nav="${esc(spec.href)}"` : `data-plans-nav="${esc(spec.href)}"`;
    return `<a class="${cls}" href="#${esc(spec.href)}" ${attr}>${esc(spec.label)}</a>`;
  };
  return `
    <div class="plans-cta">
      <div class="plans-cta__copy">
        <p class="plans-cta__title">${esc(opts.title)}</p>
        ${opts.lead ? `<p class="plans-cta__lead">${esc(opts.lead)}</p>` : ''}
      </div>
      <div class="plans-cta__actions">
        ${btn(opts.secondary, false)}
        ${btn(opts.primary, true)}
      </div>
    </div>`;
}

/**
 * @param {Array<{ icon: string, title: string, body: string }>} items
 */
export function renderFeatureHighlights(items) {
  return `
    <ul class="plans-highlights">
      ${items
        .map(
          (it) => `
        <li class="plans-highlight">
          <span class="plans-highlight__ico" aria-hidden="true">${esc(it.icon)}</span>
          <div>
            <strong class="plans-highlight__title">${esc(it.title)}</strong>
            <p class="plans-highlight__body">${esc(it.body)}</p>
          </div>
        </li>`,
        )
        .join('')}
    </ul>`;
}

/**
 * @param {Array<{ q: string, href?: string }>} items
 */
export function renderPlansFaqList(items) {
  return `
    <ul class="plans-faq">
      ${items
        .map(
          (it) => `
        <li>
          <a class="plans-faq__row" href="#${esc(it.href || '/support/faq')}" data-nav="${esc(it.href || '/support/faq')}">
            <span class="plans-faq__q">Q</span>
            <span class="plans-faq__text">${esc(it.q)}</span>
            <span class="plans-faq__chev" aria-hidden="true">›</span>
          </a>
        </li>`,
        )
        .join('')}
    </ul>`;
}

/** 노출 종속 광고배지 안내 (단독 판매 ✕) */
export function renderBadgeAddonSection() {
  const badges = [
    { id: 'hot', name: 'Hot', desc: '광고성 주목 배지 · 추천·대표 노출 기간에 함께 적용' },
    { id: 'subject_track', name: '단과', desc: '공부방 전용 유료 아이콘 · 「전문」아이콘 금지' },
    { id: 'picked', name: '쪽집게', desc: '과외쌤 광고성 자기선언 · 학력 등 사실표시와 구분' },
    { id: 'sky', name: 'SKY', desc: '과외쌤 유료 광고축 · 대학명 자동추론 아님' },
  ];
  // New=자동부여 · 추천=통계 — 판매 배지 목록에서 제외 (2026-08-21)
  return `
    <section class="plans-section">
      <div class="plans-section__head">
        <h3 class="plans-section__title">광고 부가 배지</h3>
        <p class="plans-section__lead">단독 구매 상품이 아닙니다. 대표·추천 노출 이용 기간에 함께 적용됩니다.</p>
      </div>
      <ul class="plans-addon-grid">
        ${badges
          .map(
            (b) => `
          <li class="plans-addon-card">
            <span class="plans-addon-card__mark plans-addon-card__mark--${esc(b.id)}" aria-hidden="true"></span>
            <strong>${esc(b.name)}</strong>
            <p>${esc(b.desc)}</p>
          </li>`,
          )
          .join('')}
      </ul>
      ${renderGuideBox({
        title: '광고 정책 및 안전 가이드',
        icon: '🛡',
        variant: 'policy',
        items: [
          { icon: '①', text: '적용 범위: 대표·추천 노출 이용 중인 프로필에만 표시됩니다.' },
          { icon: '②', text: '신뢰·사실표시(SKY 등)와 UI를 분리해, 유료 배지가 인증처럼 보이지 않게 합니다.' },
          { icon: '③', text: '노출 만료 시 광고 배지만 내려가고 프로필·기본 노출은 유지됩니다.' },
        ],
        linkLabel: '이용 가이드 확인',
        linkNav: '/support/faq',
      })}
    </section>`;
}

/**
 * @param {object} product
 * @returns {{ display: string, unit: string, note: string }}
 */
export function formatCardPrice(product) {
  const opts = product.options || [];
  const first = opts[0];
  if (!first) return { display: '—', unit: '', note: '' };
  const amt = resolveCheckoutAmount(first.priceKrw);
  const display = formatKrw(amt.displayKrw);
  const unit =
    first.durationType != null || first.durationDays != null
      ? `/ ${first.label}`
      : first.creditCount != null
        ? `/ ${first.label}`
        : '';
  const note = amt.testMode ? `시험 결제 ${formatKrw(amt.chargeKrw)}` : '표시가 · VAT 포함 예정';
  return { display, unit, note };
}

export function productMediaClass(code) {
  if (code === 'prime') return 'plans-card__media--prime';
  if (code === 'pick') return 'plans-card__media--pick';
  if (code === 'memo_ticket') return 'plans-card__media--memo';
  if (code === 'request_view') return 'plans-card__media--view';
  return 'plans-card__media--default';
}

export function productIcon(code) {
  if (code === 'prime') return '◆';
  if (code === 'pick') return '★';
  if (code === 'memo_ticket') return '✉';
  if (code === 'request_view') return '📄';
  return '○';
}

export { FREE_TIER_COPY, PAID_TIER_COPY };
