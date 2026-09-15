/**
 * Visily 톤 — 상품센터 공통 UI 조각
 * (히어로 · 안내박스 · 비교표 · CTA · 부가배지 안내)
 */

import { FREE_TIER_COPY, PAID_TIER_COPY } from '../mypage/plans-catalog.js';
import { formatKrw, resolveCheckoutAmount } from './runtime-config.js';
import { listBadgeOptions } from './badge-options.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/**
 * @param {{
 *   title: string,
 *   lead?: string,
 *   sub?: string,
 *   eyebrow?: string,
 *   chips?: Array<{ label: string, href?: string, active?: boolean }>
 * }} opts
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
      ${opts.eyebrow ? `<p class="plans-hero__eyebrow">${esc(opts.eyebrow)}</p>` : ''}
      <h2 class="plans-hero__title">${esc(opts.title)}</h2>
      ${opts.lead ? `<p class="plans-hero__lead">${esc(opts.lead)}</p>` : ''}
      ${opts.sub ? `<p class="plans-hero__sub">${esc(opts.sub)}</p>` : ''}
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
  const selectable = opts.selectable !== false && (role === 'study_room' || role === 'tutor');
  const selected = Array.isArray(opts.selected) ? opts.selected.map(String) : [];
  const periodLabel = opts.periodLabel || '1개월';
  const badges = listBadgeOptions(role, periodLabel);
  const atMax = selected.length >= 2;
  const setLabel = badges.map((b) => b.name).join(' · ');
  const limitId = 'plans-badge-limit';
  const policyId = 'plans-badge-policy';

  return `
    <section class="plans-section plans-badge-select" data-plans-badge-section data-badge-count="${selected.length}">
      <div class="plans-section__head">
        <h3 class="plans-section__title" id="plans-badge-heading">홍보 배지 선택</h3>
        <p class="plans-section__lead">위에서 고른 Prime 또는 Pick에 붙는 홍보 표현입니다. 노출상품과 같은 기간으로 시작·종료하며, 단독 구매하지 않습니다.</p>
      </div>
      <p class="plans-badge-select__meta">
        <span>선택한 노출상품 기간 · <strong>${esc(periodLabel)}</strong></span>
        <span class="plans-badge-select__count" data-plans-badge-count>${selected.length}/2</span>
      </p>
      <p class="plans-badge-select__policy" id="${policyId}">${esc(role === 'tutor' ? '과외쌤' : '공부방')} · ${esc(setLabel)} · 서로 다른 배지 최대 2개</p>
      ${
        selectable && atMax
          ? `<p class="plans-badge-select__limit" id="${limitId}" data-plans-badge-limit role="status">최대 2개까지 선택할 수 있습니다</p>`
          : ''
      }
      <fieldset class="plans-badge-select__fieldset" aria-labelledby="plans-badge-heading" aria-describedby="${policyId}${selectable && atMax ? ` ${limitId}` : ''}">
        <legend class="plans-badge-select__legend">홍보 배지 (다중 선택)</legend>
        <ul class="plans-badge-select__options" role="group" aria-label="홍보 배지 다중 선택, 최대 2개">
          ${badges
            .map((b) => {
              const checked = selected.includes(b.id);
              const disabled = !selectable || (atMax && !checked);
              const skyNote =
                b.id === 'sky'
                  ? `<span class="plans-badge-select__sky">학교정보 광고 표현 · 학교·학력 인증 아님</span>`
                  : '';
              return `
            <li>
              <label class="plans-badge-select__option${checked ? ' is-checked' : ''}${disabled && !checked ? ' is-disabled' : ''}">
                <input type="checkbox" data-plans-badge-code="${esc(b.id)}" value="${esc(b.id)}"
                  ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}
                  aria-label="${esc(b.name)} 홍보 배지${b.id === 'sky' ? ', 광고 표현이며 인증 아님' : ''}" />
                <span class="plans-badge-select__body">
                  <span class="plans-badge-select__name">${esc(b.name)}</span>
                  <span class="plans-badge-select__desc">${esc(b.desc)}</span>
                  <span class="plans-badge-select__price">${esc(b.priceLine)}</span>
                  ${skyNote}
                </span>
              </label>
            </li>`;
            })
            .join('')}
        </ul>
      </fieldset>
      <p class="mypage-muted plans-badge-select__note">이용기간 중 추가·교체·배지 단독 결제는 없습니다. 금액은 Prime/Pick과 함께 서버가 재계산합니다.</p>
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
