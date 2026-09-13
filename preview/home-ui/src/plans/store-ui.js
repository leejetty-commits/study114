/**
 * Visily 톤 — 상품센터 공통 UI 조각
 * (히어로 · 안내박스 · 비교표 · CTA · 부가배지 안내)
 */

import { FREE_TIER_COPY, PAID_TIER_COPY } from '../mypage/plans-catalog.js';
import { formatKrw, resolveCheckoutAmount, badgePriceKrw, positionDurationMonths } from './runtime-config.js';

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
      { label: 'Prime · Pick 노출', cells: ['—', '기간형 구매'] },
      { label: '공급자→학생 선제 쪽지', cells: ['차단', '쪽지권'] },
      { label: '요청문 상세 열람', cells: ['포함', '포함'] },
      { label: '광고성 주목 배지', cells: ['—', '노출 상품과 함께'] },
    ],
  });
}

/** 접근권 비교 */
export function renderAccessCompare() {
  return renderCompareTable({
    title: '쪽지권 이용 안내',
    cols: ['기본', '쪽지권'],
    rows: [
      { label: '학생 요약·요청문 열람', cells: ['○', '○'] },
      { label: '학부모 문의 수신 · 답장', cells: ['○', '○'] },
      { label: '학생에게 먼저 쪽지', cells: ['—', '○'] },
      { label: '사용 단위', cells: ['—', '횟수권'] },
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

/**
 * 홍보 배지 장착 — Prime/Pick 종속 · 최대 2 · 단독 구매 CTA 없음
 * @param {string} role
 * @param {object|null} ops
 * @param {{ selected?: string[], periodLabel?: string, selectable?: boolean }} [opts]
 */
export function renderBadgeAddonSection(role, ops, opts = {}) {
  const providerType = role === 'tutor' ? 'tutor' : 'study_room';
  const selectable = opts.selectable !== false && (role === 'study_room' || role === 'tutor');
  const selected = Array.isArray(opts.selected) ? opts.selected.map(String) : [];
  const periodLabel = opts.periodLabel || '1개월';
  const periodPrice = badgePriceKrw(
    providerType,
    undefined,
    'hot',
    periodLabel,
  );
  const priceLine =
    periodPrice != null ? `${periodLabel} ${formatKrw(periodPrice)}` : '가격표 로드 후 표시';
  const badges =
    providerType === 'tutor'
      ? [
          { id: 'hot', name: 'Hot', desc: `과외쌤 주목 배지 · ${priceLine}` },
          { id: 'jjokjipge', name: '쪽집게', desc: `과외쌤 광고성 자기선언 · ${priceLine}` },
          { id: 'sky', name: 'SKY', desc: `SKY는 학교정보 기반 광고 표현이며 플랫폼 인증이 아닙니다 · ${priceLine}` },
        ]
      : [
          { id: 'hot', name: 'Hot', desc: `공부방 주목 배지 · ${priceLine}` },
          { id: 'subject_track', name: '단과', desc: `공부방 전용 · ${priceLine}` },
        ];
  const atMax = selected.length >= 2;

  return `
    <section class="plans-section plans-badge-select" data-plans-badge-section>
      <div class="plans-section__head">
        <h3 class="plans-section__title">홍보 배지 장착</h3>
        <p class="plans-section__lead">선택한 Prime 노출 또는 Pick 노출에 배지를 추가할 수 있습니다. 배지는 선택한 노출상품과 같은 기간 동안 적용됩니다. 서로 다른 배지를 최대 2개까지, 최초 구매 또는 연장 시에만 선택·변경합니다.</p>
      </div>
      <ul class="plans-addon-grid" role="group" aria-label="홍보 배지 선택">
        ${badges
          .map((b) => {
            const checked = selected.includes(b.id);
            const disabled = selectable && atMax && !checked;
            if (!selectable) {
              return `
          <li class="plans-addon-card">
            <span class="plans-addon-card__mark plans-addon-card__mark--${esc(b.id)}" aria-hidden="true"></span>
            <strong>${esc(b.name)}</strong>
            <p>${esc(b.desc)}</p>
          </li>`;
            }
            return `
          <li class="plans-addon-card${checked ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}">
            <label class="plans-addon-card__label">
              <input type="checkbox" data-plans-badge-code="${esc(b.id)}" value="${esc(b.id)}"
                ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} />
              <span class="plans-addon-card__mark plans-addon-card__mark--${esc(b.id)}" aria-hidden="true"></span>
              <strong>${esc(b.name)}</strong>
              <p>${esc(b.desc)}</p>
            </label>
          </li>`;
          })
          .join('')}
      </ul>
      ${
        selectable && atMax
          ? `<p class="mypage-muted plans-badge-max" role="status">최대 2개까지 선택할 수 있습니다.</p>`
          : ''
      }
      <p class="mypage-muted">단독 구매·이용기간 중 추가·교체는 제공하지 않습니다. 결제 금액은 서버가 Prime/Pick과 함께 재계산합니다.</p>
      ${renderGuideBox({
        title: '광고 정책 및 안전 가이드',
        icon: '🛡',
        variant: 'policy',
        items: [
          { icon: '①', text: '적용 범위: Prime 노출·Pick 노출과 같은 날 시작·종료. 서로 다른 배지 최대 2개.' },
          { icon: '②', text: 'New는 첫 공개 후 1주 자동 부착이며 판매하지 않습니다. 추천·후기는 통계입니다.' },
          { icon: '③', text: '이용기간 중 배지 추가·교체는 서버에서 거부됩니다.' },
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
