import { previewState } from '../state.js';
import {
  FREE_TIER_COPY,
  PAID_TIER_COPY,
  P18_GUIDE_LEAD,
  P18_USAGE_LEAD,
  P18_HEADLINE,
  P18_RENEWAL_COPY,
  P18_EXPOSURE_STATUS,
  getPaidCatalog,
  getCatalogVariants,
  formatCatalogPrice,
} from './plans-catalog.js';
import { getRoiMetrics, getPaidOperationalStatus } from '../paid-backend.js';
import { getMemoTicketsRemaining } from '../provider-entitlement.js';
import { renderProviderNoticeBanners } from '../provider-notices.js';
import { GUARDIAN_PLANS_COPY } from './mypage-copy.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function renderCatalogItem(item) {
  const variants = getCatalogVariants(item);
  const purchasable = item.kind === 'position' || item.kind === 'count';
  const variantSelect = purchasable
    ? `<label class="plans-catalog__pick">
        <span class="mypage-muted">옵션</span>
        <select data-paid-variant="${esc(item.id)}" class="student-form__select">
          ${variants.map((v, i) => `<option value="${esc(v)}"${i === 0 ? ' selected' : ''}>${esc(formatCatalogPrice(item, v))}</option>`).join('')}
        </select>
      </label>`
    : `<p class="mypage-muted plans-catalog__dep">대표·추천 노출 이용 중에 구매할 수 있어요.</p>`;
  const buyBtn = purchasable
    ? `<button type="button" class="btn btn--secondary btn--sm" data-paid-buy data-product-id="${esc(item.id)}" data-product-label="${esc(item.name)}">시험 구매</button>`
    : `<button type="button" class="btn btn--secondary btn--sm" disabled title="포지션 종속">구매 불가</button>`;

  return `
    <li class="plans-catalog__item${item.featured ? ' is-featured' : ''}">
      <div class="plans-catalog__head">
        <strong>${esc(item.name)}</strong>
        <span class="plans-catalog__kind">${esc(item.kind)}</span>
      </div>
      <p class="plans-catalog__tagline">${esc(item.tagline)}</p>
      ${variantSelect}
      <ul class="plans-catalog__bullets">${item.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      ${buyBtn}
    </li>`;
}

/** P18-01 — 상품·권한 카탈로그 */
export function renderPaidGuide(role) {
  if (role === 'parent') {
    return `
      <section class="mypage-panel">
        <p class="mypage-lead">${GUARDIAN_PLANS_COPY.lead}</p>
        <div class="mypage-info-box">
          <p>${GUARDIAN_PLANS_COPY.body}</p>
          <p class="mypage-muted">${GUARDIAN_PLANS_COPY.footnote}</p>
        </div>
        <a href="#/support/faq" class="btn btn--secondary" data-nav="/support/faq">자주 묻는 질문</a>
      </section>`;
  }

  const tier = previewState.providerSubscription;
  const tierCopy = tier === 'paid' ? PAID_TIER_COPY : FREE_TIER_COPY;
  const catalog = getPaidCatalog(role);
  const roleLabel = role === 'study_room' ? '공부방' : '과외쌤';
  const ops = getPaidOperationalStatus();
  const memoRemaining = ops?.tickets?.memo?.remaining ?? getMemoTicketsRemaining();
  const viewRemaining = ops?.tickets?.request_view?.remaining ?? 0;
  const activePositions = ops?.exposure?.positions ?? [];
  const statusBadges = [
    memoRemaining > 0
      ? `<span class="plans-status-badge" title="쪽지권 잔여">쪽지권 ${memoRemaining}회</span>`
      : '',
    viewRemaining > 0
      ? `<span class="plans-status-badge" title="열람권 잔여">열람권 ${viewRemaining}회</span>`
      : '',
    ...activePositions.map(
      (p) =>
        `<span class="plans-status-badge is-active" title="기간형 노출">${esc(String(p.sku).toUpperCase())} D-${p.days_left}</span>`,
    ),
  ]
    .filter(Boolean)
    .join('');

  return `
    <section class="mypage-panel">
      <p class="mypage-lead">${esc(P18_HEADLINE)}</p>
      ${renderProviderNoticeBanners()}
      <p class="mypage-muted">${esc(P18_GUIDE_LEAD)}</p>
      ${statusBadges ? `<p class="plans-status-row">${statusBadges}</p>` : ''}
      <p class="mypage-muted">역할: <strong>${roleLabel}</strong> · 데모 요금제: <strong>${tier === 'paid' ? '유료' : tier === 'free' ? '무료' : tier}</strong> · <a href="#/plans/my" data-nav="/plans/my">내 상품</a></p>
      <div class="mypage-info-box plans-tier-box">
        <strong>${esc(tierCopy.title)}</strong>
        <ul class="plans-tier-list">${tierCopy.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>
      <h2 class="mypage-subhead">상품 카탈로그 (${roleLabel} 우선순위)</h2>
      <ul class="plans-catalog">
        ${catalog.map(renderCatalogItem).join('')}
      </ul>
      <div class="mypage-info-box">
        <strong>${esc(P18_RENEWAL_COPY.title)}</strong>
        <ul class="plans-tier-list">${P18_RENEWAL_COPY.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>
      <p class="mypage-note">상품 안내 → <a href="#/plans" data-nav="/plans">이용권</a> · <a href="#/plans/my" data-nav="/plans/my">내 상품</a></p>
    </section>`;
}

/** P18-02 — ROI 무료 3종 + 노출 운영 상태 */
export function renderPaidUsage(role) {
  if (role === 'parent') {
    return `
      <section class="mypage-panel">
        <p class="mypage-muted">${GUARDIAN_PLANS_COPY.lead}</p>
      </section>`;
  }

  const metrics = getRoiMetrics();
  const ops = getPaidOperationalStatus();
  const exposure = ops?.exposure;
  const tickets = ops?.tickets;

  const exposureLabel = exposure?.label ?? P18_EXPOSURE_STATUS.basic;
  const positionRows =
    exposure?.positions?.length > 0
      ? `<ul class="plans-tier-list">${exposure.positions
          .map(
            (p) =>
              `<li><strong>${esc(String(p.sku).toUpperCase())}</strong> · ${p.days_left}일 남음 (~${esc(String(p.ends_at).slice(0, 10))})</li>`,
          )
          .join('')}</ul>`
      : '';

  const ticketRows = tickets
    ? `<div class="mypage-stats roi-metrics">
        <div class="mypage-stat" title="선제 쪽지">
          <span>${esc(tickets.memo.label)}</span>
          <strong>${tickets.memo.remaining}</strong>
          <span class="mypage-muted roi-metrics__period">잔여</span>
        </div>
        <div class="mypage-stat" title="요청문 열람">
          <span>${esc(tickets.request_view.label)}</span>
          <strong>${tickets.request_view.remaining}</strong>
          <span class="mypage-muted roi-metrics__period">잔여</span>
        </div>
      </div>`
    : '';

  return `
    <section class="mypage-panel">
      <p class="mypage-lead">${esc(P18_USAGE_LEAD)}</p>
      ${renderProviderNoticeBanners()}
      <p class="mypage-muted"><a href="#/plans" data-nav="/plans">상품센터</a></p>
      <h2 class="mypage-subhead">노출 운영 상태</h2>
      <div class="mypage-info-box">
        <p><strong>${esc(exposureLabel)}</strong></p>
        ${positionRows}
        <p class="mypage-muted">${esc(P18_EXPOSURE_STATUS.note)}</p>
      </div>
      <h2 class="mypage-subhead">횟수권 잔여</h2>
      ${ticketRows || '<p class="mypage-muted">이용 내역을 불러오면 여기에 표시됩니다.</p>'}
      <h2 class="mypage-subhead">무료 반응 요약 3종</h2>
      <div class="mypage-stats roi-metrics" aria-label="무료 반응 요약 3종">
        ${metrics.map(
          (m) => `
          <div class="mypage-stat is-emphasis" title="${esc(m.hint)}">
            <span>${esc(m.label)}</span>
            <strong>${m.value}</strong>
            <span class="mypage-muted roi-metrics__period">${esc(m.period)}</span>
          </div>`,
        ).join('')}
      </div>
      <div class="mypage-info-box">
        <p>동네 단위·적은 숫자도 의미 있습니다. 상세 분석·알림형은 나중에 연결합니다.</p>
        <p class="mypage-muted">쪽지 시도·차단 횟수는 주요 반응 수치에 포함하지 않습니다.</p>
      </div>
      <a href="#/plans/positions" class="btn btn--secondary" data-nav="/plans/positions">노출상품 보기</a>
    </section>`;
}
