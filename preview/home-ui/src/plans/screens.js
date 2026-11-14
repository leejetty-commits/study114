/**
 * 34장 — 상품센터 화면 (P18-01~07)
 * 기존 plans-catalog / paid-backend 자산 재사용
 * 본문은 screens-status.js, screens-orders.js로 나뉘어 있고, 공개 이름은 여기서 다시 내보낸다.
 */
import { P18_EXPOSURE_STATUS } from '../mypage/plans-catalog.js';
import { getRoiMetrics, getPaidOperationalStatus } from '../paid-backend.js';
import { renderProviderNoticeBanners, hydrateProviderNotices } from '../provider-notices.js';
import { s114Alert } from '../../../shared/confirm-dialog.js';
import {
  createPaidCheckout,
  completePaidCheckout,
  registerPrimeWaitlist,
  fetchPrimeWaitlist,
  cancelPrimeWaitlist,
} from '../paid-api.js';
import { requestPortOneCardPayment } from './portone-checkout.js';
import {
  getProviderStatus,
  hydrateProviderStatus,
  hydrateProviderStatusStrict,
  invalidateProviderStatus,
} from '../provider-status.js';
import { ensureStudyRoomStore } from '../study-room-reg/index.js';
import { ensureTutorStore } from '../tutor-reg/index.js';
import { AUTH_UI_BASE } from '../../../shared/preview-links.js';
import {
  getCatalogByFamily,
  getProductConfig,
  getPriceOption,
  resolveCheckoutAmount,
  formatKrw,
  isPlansTestMode,
  setPlansTestMode,
  badgePriceKrw,
} from './runtime-config.js';
import { parsePlansQuery, buildPlansHref } from './router.js';
import { getPlansEffectiveRole, resolveSelectedProfile } from './profiles.js';
import {
  setCheckoutDraft,
  getCheckoutDraft,
  clearCheckoutDraft,
  setCheckoutResult,
} from './checkout-session.js';
import { appendHistoryRow } from './history-mock.js';
import { MEMO_TICKET_REFUND_SHORT } from '../refund-policy-copy.js';
import { resolveRoomPrimeInventory, getSlotForProduct, isRoomPrimeFull } from './slot-inventory.js';
import { bindReceiptEvents } from './receipt.js';
import {
  renderPlansHero,
  renderBadgeAddonSection,
  productMediaClass,
  productIcon,
} from './store-ui.js';
import { renderPlansHomeBody } from './hub-home.js';
import {
  providerPageName,
  memoPackProviderLabel,
  memoPackStatusLabel,
  waitlistStatusLabel,
} from '../mypage/mypage-copy.js';
import {
  renderApplyTargetBlock,
  getApplyTargetReadiness,
  renderOrderSummaryBlock,
  buildPositionOrderRows,
  renderAccessPurchaseCheck,
  renderPolicyAccordion,
  renderBasicFreeRow,
  renderAccessAuxLinks,
} from './order-blocks.js';
import { sanitizeBadgeCodes, applyBadgeQuery, badgeDisplayName } from './badge-options.js';
import {
  sortPeriodOptions,
  periodKey,
  periodHint,
  previewInclusiveRange,
  periodDisabledReason,
} from './period-cards.js';
import {
  plansStatusSync,
  accessProfileKey,
  resetAccessStatusSync,
  schedulePlansStatusHydrate,
  plansStatusFlags,
  readSelectedPrimeRegion,
  applyTierOrderMissing,
  scheduleTierCheckHydrate,
  getEligibility,
  clearLastPlansHydratedHash,
  clearTierHydratedHash,
  productLabel,
  renderLowCreditBanner,
  renderRoomPrimeBoard,
  esc,
  roleLabel,
  renderProfileBanner,
  isProductReady,
} from './screens-status.js';
import {
  renderPlansHistory,
  renderPlansCheckout,
  renderPlansResult,
  scheduleCheckoutServerQuote,
  bindPlansHistoryEvents,
  markHistoryCacheStale,
} from './screens-orders.js';

export {
  accessProfileKey,
  resetAccessStatusSync,
  resetPlansStatusSync,
  schedulePlansStatusHydrate,
  plansStatusFlags,
  readTierCheck,
  rememberTierCheck,
  tierPurchaseGate,
  applyTierOrderMissing,
  scheduleTierCheckHydrate,
  getEligibility,
} from './screens-status.js';
export { renderPlansHistory, renderPlansCheckout, renderPlansResult } from './screens-orders.js';

/** @type {string | null} */
let openReceiptOrderRef = null;

/**
 * @param {object} product
 * @param {import('./profiles.js').ProviderProfile | null} profile
 * @param {string} role
 * @param {{ prime?: object, pick?: object } | null} [slots]
 * @param {{ layout?: 'store'|'compact'|'storefront', primaryCta?: boolean, regionReady?: boolean, embedBoard?: boolean, embedPickPreview?: boolean, selectedOptionId?: string }} [opts]
 */
function renderPositionCard(product, profile, role, slots = null, opts = {}) {
  const layout = opts.layout || 'store';
  const embedBoard = opts.embedBoard !== false;
  const embedPickPreview = opts.embedPickPreview !== false;
  const selectedOptionId = opts.selectedOptionId || '';
  const canPurchaseUi = role === 'study_room' || role === 'tutor';
  const implemented = product.implemented !== false && product.family === 'position';
  // 공부방 Prime만 재고. Pick·과외쌤은 순환형 → 매진/슬롯 UI 금지
  const roomPrimeOnly = role === 'study_room' && product.productCode === 'prime';
  const inv = roomPrimeOnly ? resolveRoomPrimeInventory(slots) : null;
  const slot = roomPrimeOnly && inv ? getSlotForProduct(product.productCode, inv, role) : null;
  const soldOut = roomPrimeOnly && slot != null && slot.remaining <= 0;
  const isPrime = product.productCode === 'prime';
  const isPick = product.productCode === 'pick';
  const primaryCta = opts.primaryCta ?? isPrime;
  const displayName =
    product.name || (isPrime ? '프라임' : isPick ? '픽' : productLabel(product.productCode));
  const isStorefront = layout === 'storefront' || layout === 'compact';

  if (!implemented) {
    return `
      <li class="plans-card plans-catalog__item is-placeholder">
        <div class="plans-card__body">
          <h3 class="plans-card__name">${esc(displayName)}</h3>
          <p class="plans-card__tagline">${esc(product.tagline)}</p>
          <button type="button" class="btn btn--secondary" disabled>준비중</button>
        </div>
      </li>`;
  }

  const options = product.options || [];
  const eligibility = profile
    ? getEligibility(profile, product.productCode)
    : { canBuy: false, missing: ['적용 프로필을 먼저 선택하세요'], tierPhase: '' };
  const readiness = isProductReady(profile, product.productCode, role);
  if (soldOut) {
    eligibility.canBuy = false;
    eligibility.missing = [
      ...eligibility.missing.filter((m) => !String(m).includes('슬롯') && !String(m).includes('마감')),
      '현재 지역 프라임 자리가 모두 이용 중입니다. 아래에서 예약대기를 등록하세요.',
    ];
  }
  const missingHtml =
    canPurchaseUi && eligibility.missing.length
      ? `<ul class="plans-eligibility plans-eligibility--soft">${eligibility.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>${
          eligibility.registerCheckHref
            ? `<a href="#${esc(eligibility.registerCheckHref)}" style="display:inline-flex;align-items:center;box-sizing:border-box;height:30px;margin-top:8px;padding:0 10px;border-radius:6px;background:#729FD9;color:#0B2545;font-size:14px;font-weight:600;line-height:30px;text-decoration:none">등록점검</a>`
            : ''
        }${eligibility.tierPhase === 'error' ? `<button type="button" class="btn btn--secondary" data-plans-tier-retry style="margin-top:8px">다시 시도</button>` : ''}`
      : '';

  const boardHtml = embedBoard && roomPrimeOnly && inv ? renderRoomPrimeBoard(inv.prime) : '';

  const footNote = (() => {
    if (role === 'study_room' && isPick) return '선택 지역에서 10개씩 순환 노출';
    if (role === 'tutor' && isPrime) return '선택 시·주력과목에서 3개씩 순환 노출';
    if (role === 'tutor' && isPick) return '선택 시·주력과목에서 10개씩 순환 노출';
    if (role === 'study_room' && isPrime) return '선택 지역의 프라임 대표 노출';
    return '';
  })();

  const pickPreviewHtml =
    embedPickPreview && isPick
      ? `<div class="plans-pick-preview" aria-label="픽 노출 미리보기 5열 2행">
        <p class="plans-pick-preview__label">픽 노출 미리보기 · 5열 × 2행</p>
        <ul class="plans-pick-preview__grid">
          ${Array.from({ length: 10 }, (_, i) => `<li class="plans-pick-preview__cell">P${i + 1}</li>`).join('')}
        </ul>
        <nav class="plans-pick-preview__pager" aria-label="페이지">
          <span class="is-current">1</span><span>2</span><span>3</span>
        </nav>
      </div>`
      : '';

  const regionReady = Boolean(opts.regionReady);
  const periodLocked = soldOut || !regionReady || !readiness.ready;
  const periodOptions = sortPeriodOptions(options);
  const periodReason = !regionReady
    ? periodDisabledReason(role)
    : !readiness.ready
      ? readiness.label || (readiness.reason === 'checking' ? '확인 중' : '준비 미완료')
      : '';
  const periodCards = periodOptions
    .map((o) => {
      const key = periodKey(o);
      const hint = periodHint(product.productCode, key);
      const amt = resolveCheckoutAmount(o.priceKrw);
      const selected = Boolean(selectedOptionId) && o.optionId === selectedOptionId;
      const hasDiscount = Number(o.discountKrw) > 0 && Number(o.listPriceKrw) > Number(o.priceKrw);
      const memo = Number(o.memoBundle) || 0;
      return `
        <li class="plans-period-card${selected ? ' is-selected' : ''}${periodLocked ? ' is-disabled' : ''}">
          <button type="button" class="plans-period-card__btn"
            data-plans-period-option="${esc(o.optionId)}"
            data-product-code="${esc(product.productCode)}"
            ${periodLocked ? 'disabled' : ''}
            aria-pressed="${selected ? 'true' : 'false'}">
            <span class="plans-period-card__hint">${hint ? esc(hint) : '\u00a0'}</span>
            <span class="plans-period-card__name">${esc(key)}</span>
            <span class="plans-period-card__list${hasDiscount ? '' : ' is-empty'}">${hasDiscount ? esc(formatKrw(o.listPriceKrw)) : '\u00a0'}</span>
            <strong class="plans-period-card__price">${esc(formatKrw(o.priceKrw))}</strong>
            <span class="plans-period-card__off">${o.discountLabel ? esc(o.discountLabel) : '\u00a0'}</span>
            <span class="plans-period-card__memo">${memo > 0 ? `쪽지권 ${memo}회 포함` : footNote || '\u00a0'}</span>
            ${amt.testMode ? `<span class="plans-period-card__test">시험 ${esc(formatKrw(amt.chargeKrw))}</span>` : ''}
          </button>
        </li>`;
    })
    .join('');
  const optionSelect = `
    <div class="plans-period" role="group" aria-label="기간 선택">
      <p class="plans-period__label">기간 선택</p>
      <ul class="plans-period-grid">${periodCards}</ul>
      ${periodReason ? `<p class="plans-period__reason">${esc(periodReason)}</p>` : ''}
      <p class="plans-period__vat">표시가 · VAT 포함 예정 · 기간 카드를 누르면 주문 요약에 반영됩니다</p>
      <label class="plans-card__pick plans-card__pick--sr">
        <span class="plans-card__pick-label">기간 선택</span>
        <select data-plans-option="${esc(product.productCode)}" class="student-form__select" ${periodLocked ? 'disabled' : ''}>
          ${periodOptions
            .map((o, i) => {
              const selected = selectedOptionId ? o.optionId === selectedOptionId : i === 0;
              return `<option value="${esc(o.optionId)}"${selected ? ' selected' : ''}>${esc(periodKey(o))}</option>`;
            })
            .join('')}
        </select>
      </label>
    </div>`;

  if (isStorefront) {
    return `
    <div class="plans-sf-buy plans-catalog__item${soldOut ? ' is-soldout' : ''}${!soldOut && !readiness.ready ? ' is-not-ready' : ''}${primaryCta ? ' is-primary' : ''}" data-product-code="${esc(product.productCode)}">
      ${boardHtml}
      ${pickPreviewHtml}
      ${optionSelect}
      ${missingHtml}
    </div>`;
  }

  const ctaClass = primaryCta ? 'btn btn--primary plans-card__cta' : 'btn btn--secondary plans-card__cta';
  const buyBtn = canPurchaseUi
    ? soldOut
      ? `<button type="button" class="btn btn--secondary plans-card__cta" disabled>예약대기만 가능</button>`
      : !readiness.ready
        ? `<button type="button" class="btn btn--secondary plans-card__cta" disabled>${esc(readiness.reason === 'checking' ? '확인 중' : '준비 미완료')}</button>`
        : `<button type="button" class="${ctaClass}" data-plans-select-product
         data-product-code="${esc(product.productCode)}"
         title="이 상품을 주문 요약에 반영">이 상품 선택</button>`
    : `<a href="${AUTH_UI_BASE}/#/login" class="btn btn--secondary plans-card__cta" data-same-tab-href="${AUTH_UI_BASE}/#/login">로그인 후 구매</a>`;

  const badge = product.cardBadge
    ? `<span class="plans-card__badge">${esc(product.cardBadge)}</span>`
    : '';

  const media = `<div class="plans-card__media ${productMediaClass(product.productCode)}" aria-hidden="true">${badge}<span class="plans-card__media-ico">${productIcon(product.productCode)}</span></div>`;

  return `
    <li class="plans-card plans-card--${layout} plans-catalog__item${product.featured ? ' is-featured' : ''}${soldOut ? ' is-soldout' : ''}${!soldOut && !readiness.ready ? ' is-not-ready' : ''}${primaryCta ? ' is-primary' : ''}" data-product-code="${esc(product.productCode)}">
      ${media}
      <div class="plans-card__body">
        <h3 class="plans-card__name">${esc(displayName)}</h3>
        <p class="plans-card__hook">${esc(product.tagline)}</p>
        ${boardHtml}
        ${pickPreviewHtml}
        <ul class="plans-card__checks">
          ${[...(product.bullets || [])]
            .filter(Boolean)
            .map((b) => `<li>${esc(b)}</li>`)
            .join('')}
        </ul>
        ${optionSelect}
        ${missingHtml}
        ${buyBtn}
      </div>
    </li>`;
}

function isImmediateTicket(option) {
  if (!option) return false;
  if (option.ticketKind === 'immediate') return true;
  return option.apiVariant === '1회' || /^1회/.test(String(option.label || ''));
}

function ticketCount(option) {
  const n = Number(option?.creditCount);
  if (n > 0) return n;
  if (isImmediateTicket(option)) return 1;
  const m = String(option?.label || option?.apiVariant || '').match(/(\d+)\s*회/);
  return m ? Number(m[1]) : 0;
}

function ticketProductName(option) {
  if (!option) return '쪽지권';
  if (isImmediateTicket(option)) return '1회 즉시권';
  const n = ticketCount(option);
  if (n === 5) return '5회권';
  if (n === 10) return '10회권';
  return String(option.label || '쪽지권');
}

/**
 * @param {object} product
 * @param {import('./profiles.js').ProviderProfile | null} profile
 * @param {string} role
 * @param {{ memo?: number }} remaining
 * @param {{ primaryCta?: boolean, activePaidPack?: object|null, packPurchaseBlocked?: boolean, embed?: 'grid'|'card', selectedOptionId?: string }} [opts]
 */
function renderAccessCard(product, profile, role, remaining = {}, opts = {}) {
  const isProvider = role === 'tutor' || role === 'study_room';
  const options = product.options || [];
  const primaryCta = opts.primaryCta ?? product.productCode === 'memo_ticket';
  const activePaidPack = opts.activePaidPack || null;
  const packPurchaseBlocked = Boolean(opts.packPurchaseBlocked);
  const eligibility = profile
    ? getEligibility(profile, product.productCode, 'access')
    : { canBuy: false, missing: ['적용 프로필을 먼저 선택하세요'] };
  const selectedOptionId = opts.selectedOptionId || '';

  const missingHtml =
    isProvider && eligibility.missing.length
      ? `<ul class="plans-eligibility">${eligibility.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`
      : '';

  const ticketCards = options
    .map((o) => {
      const amt = resolveCheckoutAmount(o.priceKrw);
      const priceNote = amt.testMode
        ? `${formatKrw(o.priceKrw)} (시험 ${formatKrw(amt.chargeKrw)})`
        : formatKrw(o.priceKrw);
      const isImmediate = isImmediateTicket(o);
      const packLocked = (!isImmediate && packPurchaseBlocked) || (!!activePaidPack && !isImmediate);
      const countNum = ticketCount(o);
      const name = ticketProductName(o);
      const selected = selectedOptionId
        ? o.optionId === selectedOptionId
        : !packLocked && (isImmediate && packPurchaseBlocked ? true : options.indexOf(o) === 0);
      const per =
        countNum > 0 && Number.isFinite(Number(o.priceKrw))
          ? Math.round(Number(o.priceKrw) / countNum)
          : 0;
      const savePct =
        Number(o.creditCount) === 5 ? 10 : Number(o.creditCount) === 10 ? 20 : 0;
      const saveNote = savePct
        ? `회당 ${formatKrw(per)} · ${savePct}% 절약`
        : isImmediate
          ? '\u00a0'
          : '';
      const meta = isImmediate
        ? '결제 후 바로 발송 · 남은 횟수로 보관되지 않습니다'
        : '구매일부터 120일';
      const lock =
        packLocked && activePaidPack
          ? `<span class="plans-ticket-card__lock">구매할 수 없습니다. 사용 중인 묶음권의 남은 횟수를 모두 쓰거나 사용기한이 지난 뒤 구매하세요.</span>`
          : '';
      const aria = packLocked && activePaidPack
        ? `${name} ${priceNote}. 사용 중인 쪽지권이 있어 구매할 수 없습니다.`
        : `${name} ${priceNote}`;
      return `
        <li class="plans-ticket-card${selected ? ' is-selected' : ''}${packLocked ? ' is-disabled' : ''}">
          <button type="button" class="plans-ticket-card__btn" data-plans-ticket-option="${esc(o.optionId)}"
            data-product-code="${esc(product.productCode)}"
            ${packLocked ? 'disabled' : ''} aria-pressed="${selected ? 'true' : 'false'}"
            aria-label="${esc(aria)}">
            <span class="plans-ticket-card__count" aria-hidden="true">${esc(String(countNum))}회</span>
            <strong class="plans-ticket-card__name">${esc(name)}</strong>
            <span class="plans-ticket-card__price">${esc(priceNote)}</span>
            <span class="plans-ticket-card__save">${saveNote ? esc(saveNote) : '\u00a0'}</span>
            ${lock}
            <span class="plans-ticket-card__meta">${esc(meta)}</span>
          </button>
        </li>`;
    })
    .join('');

  const buyDisabled = !isProvider || !profile || !eligibility.canBuy;
  const ctaClass = primaryCta ? 'btn btn--primary plans-card__cta' : 'btn btn--secondary plans-card__cta';
  const buyBtn = isProvider
    ? `<button type="button" class="${ctaClass}" data-plans-buy
         data-product-code="${esc(product.productCode)}"
         ${buyDisabled ? 'disabled' : ''}>이 상품 선택</button>`
    : role === 'guest'
      ? `<a href="${AUTH_UI_BASE}/#/login" class="btn btn--secondary plans-card__cta" data-same-tab-href="${AUTH_UI_BASE}/#/login">로그인 후 구매</a>`
      : `<button type="button" class="btn btn--secondary plans-card__cta" disabled>구매 불가</button>`;

  const hiddenSelect = `
    <label class="plans-card__pick plans-card__pick--sr">
      <span class="plans-card__pick-label">쪽지권 선택</span>
      <select data-plans-option="${esc(product.productCode)}" class="student-form__select">
        ${options
          .map((o) => {
            const isImmediate = isImmediateTicket(o);
            const packLocked = (!isImmediate && packPurchaseBlocked) || (!!activePaidPack && !isImmediate);
            const selected = selectedOptionId
              ? o.optionId === selectedOptionId
              : !packLocked && (isImmediate && packPurchaseBlocked ? true : options.indexOf(o) === 0);
            return `<option value="${esc(o.optionId)}"${packLocked ? ' disabled' : ''}${selected ? ' selected' : ''}>${esc(ticketProductName(o))}</option>`;
          })
          .join('')}
      </select>
    </label>`;

  const grid = `
        <ul class="plans-ticket-grid">${ticketCards}</ul>
        ${hiddenSelect}
        ${missingHtml}`;

  if (opts.embed === 'grid') {
    return `
    <div class="plans-card--access" data-product-code="${esc(product.productCode)}">
      ${grid}
    </div>`;
  }

  return `
    <li class="plans-card plans-card--access plans-catalog__item plans-card--tickets${product.featured ? ' is-featured' : ''}${primaryCta ? ' is-primary' : ''}" data-product-code="${esc(product.productCode)}">
      <div class="plans-card__body">
        <h3 class="plans-card__name">${esc(product.name)}</h3>
        <p class="plans-card__hook">${esc(product.tagline)}</p>
        ${grid}
        ${buyBtn}
      </div>
    </li>`;
}

function renderTestModeToggle() {
  const on = isPlansTestMode();
  return `
    <label class="plans-test-mode">
      <input type="checkbox" data-plans-test-mode ${on ? 'checked' : ''} />
      <span>결제 테스트 모드</span>
    </label>`;
}

/** P18-01 상품홈 — 안내·진입 허브. 구매 UI는 상세에만. */
export function renderPlansHome() {
  return renderPlansHomeBody({
    noticesHtml: renderProviderNoticeBanners(),
    role: getPlansEffectiveRole(),
  });
}

/** P18-02 노출상품 */
export function renderPlansPositions() {
  const role = getPlansEffectiveRole();
  const query = parsePlansQuery();
  const profile = resolveSelectedProfile(query, role);
  const providerKey = role === 'tutor' ? 'tutor' : 'study_room';
  const products = getCatalogByFamily('position', providerKey);
  const ops = getPaidOperationalStatus();
  const slots = role === 'study_room' ? ops?.slots ?? null : null;
  const canBuy = role === 'study_room' || role === 'tutor';
  const selectedCode = query.product || '';
  const selectedProduct = selectedCode ? products.find((p) => p.productCode === selectedCode) || null : null;
  const selectedPeriodOptions = sortPeriodOptions(selectedProduct?.options || []);
  const selectedOption =
    query.option ? selectedPeriodOptions.find((o) => o.optionId === query.option) || null : null;
  const periodLabel = selectedOption?.label || selectedOption?.apiVariant || '1개월';
  const periodPreview = selectedOption ? previewInclusiveRange(selectedOption) : null;
  const selectedBadges = sanitizeBadgeCodes(
    role,
    String(query.badges || '')
      .split(',')
      .map((s) => s.trim()),
  );
  const providerTypeKey = role === 'tutor' ? 'tutor' : 'study_room';
  const applyReady = profile ? getApplyTargetReadiness(profile, role).regionReady : false;
  const applyScopes = profile ? getApplyTargetReadiness(profile, role).regionScopes : [];
  const selectedRegionScope =
    applyScopes.find(
      (s) =>
        (query.city_id && String(s.city_id) === String(query.city_id)) ||
        (query.region_id && String(s.region_id) === String(query.region_id)) ||
        (query.complex_id && String(s.complex_id) === String(query.complex_id)),
    ) || applyScopes[0] || null;
  const selectedElig =
    profile && selectedProduct
      ? getEligibility(profile, selectedProduct.productCode)
      : { canBuy: false, missing: [] };
  const selectedReadiness = selectedProduct
    ? isProductReady(profile, selectedProduct.productCode, role)
    : { ready: false, reason: 'no-product', label: '', phase: '', registerCheckHref: '' };
  const roomPrimeSoldOut =
    role === 'study_room' &&
    selectedProduct?.productCode === 'prime' &&
    isRoomPrimeFull(resolveRoomPrimeInventory(slots).prime);
  const orderCtaDisabled =
    !canBuy ||
    !profile ||
    !selectedProduct ||
    !selectedOption ||
    !applyReady ||
    roomPrimeSoldOut ||
    !selectedReadiness.ready ||
    !selectedElig.canBuy ||
    (role === 'study_room' &&
      (selectedProduct?.productCode === 'prime' || selectedProduct?.productCode === 'pick') &&
      !selectedRegionScope);
  const summaryReady = Boolean(selectedProduct && selectedOption && selectedReadiness.ready);
  const effectiveBadges = selectedReadiness.ready ? selectedBadges : [];
  const badgeLines = effectiveBadges.map((code) => {
    const price = badgePriceKrw(providerTypeKey, undefined, code, periodLabel);
    return {
      label: badgeDisplayName(code),
      value: price != null ? formatKrw(price) : '—',
      priceKrw: price || 0,
    };
  });
  const positionAmt = summaryReady && selectedOption ? resolveCheckoutAmount(selectedOption.priceKrw) : null;
  const badgeSum = badgeLines.reduce((n, b) => n + (b.priceKrw || 0), 0);
  const displayTotal =
    positionAmt != null ? positionAmt.displayKrw + badgeSum : null;
  const orderRows = summaryReady
    ? buildPositionOrderRows({
        profileLabel: profile ? profile.label : '미선택',
        roleText: role === 'study_room' ? '공부방' : role === 'tutor' ? '과외쌤' : roleLabel(role),
        productName: selectedProduct?.name || productLabel(selectedCode),
        regionValue:
          selectedRegionScope?.label ||
          (role === 'tutor' ? (applyReady ? '시 미선택' : '과외지역·주력과목 필요') : applyReady ? '—' : '미선택'),
        periodLabel,
        periodRangeText: periodPreview ? `${periodPreview.startedOn} ~ ${periodPreview.endsOn}` : '결제 완료 시점부터',
        listPriceText:
          selectedOption && Number(selectedOption.discountKrw) > 0 && Number(selectedOption.listPriceKrw) > 0
            ? formatKrw(selectedOption.listPriceKrw)
            : '',
        positionPriceText: positionAmt
          ? positionAmt.testMode
            ? `${formatKrw(selectedOption.priceKrw)} (시험 ${formatKrw(positionAmt.chargeKrw)})`
            : formatKrw(selectedOption.priceKrw)
          : '—',
        discountText: selectedOption?.discountLabel || '',
        memoBundleText:
          Number(selectedOption?.memoBundle) > 0 ? `쪽지권 ${selectedOption.memoBundle}회 포함` : '',
        badgeLines,
        badgeSumText: formatKrw(badgeSum),
      })
    : [
        { label: '적용 프로필', value: profile ? profile.label : '미선택' },
        { label: '상품', value: selectedProduct ? (selectedProduct.name || productLabel(selectedCode)) : '미선택' },
        { label: '기간', value: selectedOption ? periodLabel : '미선택' },
        { label: '노출상품 표시가', value: '—' },
        { label: '자동연장', value: '없음' },
      ];
  const primeProduct = products.find((p) => p.productCode === 'prime');
  const pickProduct = products.find((p) => p.productCode === 'pick');
  const restProducts = products.filter((p) => p.productCode !== 'prime' && p.productCode !== 'pick');
  const isSelectedOffer = (product, _index) =>
    Boolean(selectedCode) && product.productCode === selectedCode;
  const renderOffer = (product, lead, index) => {
    if (!product) return '';
    const name = product.name || productLabel(product.productCode);
    const isRoomPrime = role === 'study_room' && product.productCode === 'prime';
    const isRoomPick = role === 'study_room' && product.productCode === 'pick';
    const isTutorPrime = role === 'tutor' && product.productCode === 'prime';
    const isTutorPick = role === 'tutor' && product.productCode === 'pick';
    const offerMod = isRoomPrime
      ? ' plans-storefront__offer--prime'
      : isRoomPick
        ? ' plans-storefront__offer--pick'
        : isTutorPrime
          ? ' plans-storefront__offer--tutor-prime'
          : isTutorPick
            ? ' plans-storefront__offer--tutor-pick'
            : '';
    const structureHtml = isRoomPrime
      ? renderRoomPrimeBoard(resolveRoomPrimeInventory(slots).prime)
      : '';
    return `
      <section class="plans-storefront__offer${offerMod} plans-sf-panel" data-plans-offer="${esc(product.productCode)}">
        <header class="plans-sf-panel__head">
          <h2 class="plans-sf-panel__title">${esc(name)}</h2>
          <p class="plans-sf-panel__lead">${esc(lead)}</p>
        </header>
        ${renderPositionCard(product, profile, role, slots, {
            layout: 'storefront',
            primaryCta: isSelectedOffer(product, index),
            regionReady: applyReady,
            embedBoard: false,
            embedPickPreview: false,
            selectedOptionId: product.productCode === selectedCode ? selectedOption?.optionId || '' : '',
          })}
        ${structureHtml}
      </section>`;
  };

  return `
    <section class="plans-store plans-storefront plans-sf" data-plans-positions>
      <header class="plans-sf-hero">
        ${renderPlansHero({
          eyebrow: '유료 안내',
          title: '노출상품',
          lead: `더 좋은 자리에서 학생에게 발견될 기회를 제공합니다.\n${providerPageName(role)} 꾸미기와 베이직카드 목록 노출은 무료입니다.\n필요한 기간만 결제하며 자동으로 연장하지 않습니다.`,
          sub: '프라임과 픽은 홈·찾기 화면에서 프로필을 더 잘 발견할 수 있도록 돕는 유료 노출상품입니다.',
        })}
        ${renderBasicFreeRow(role)}
      </header>

      <div class="plans-storefront__body">
        <div class="plans-storefront__aux">
          ${renderApplyTargetBlock(profile, role, 'positions', {
            productCode: selectedCode,
            primeScopes: Array.isArray(slots?.prime_scopes) ? slots.prime_scopes : [],
          })}
        </div>

        <div class="plans-storefront__catalog">
          ${
            primeProduct || pickProduct || restProducts.length
              ? `${renderOffer(
                  primeProduct,
                  role === 'tutor'
                    ? '선택한 시와 주력과목의 프라임 영역에 페이지당 3명씩 노출되며, 15분마다 공정하게 순환합니다.'
                    : '선택한 단지·행정동의 프라임 대표 자리를 확보하세요. 프라임은 선택 지역에서 3개만 운영하는 한정 대표 노출입니다.',
                  0,
                )}
          ${renderOffer(
            pickProduct,
            role === 'tutor'
              ? '한 페이지에 10명씩 노출되며, 15분마다 공정하게 순환합니다.'
              : '선택한 지역의 추천 영역에서 고르게 발견되세요. 한 페이지에 10개씩 노출되며, 15분마다 공정하게 순환합니다.',
            primeProduct ? 1 : 0,
          )}
          ${restProducts
            .map((p, i) =>
              renderOffer(p, p.tagline || p.name || productLabel(p.productCode), (primeProduct ? 1 : 0) + (pickProduct ? 1 : 0) + i),
            )
            .join('')}`
              : `<div class="plans-sf-empty" role="status">상품 정보를 다시 불러와 주세요.</div>`
          }

          ${renderBadgeAddonSection(role, ops, {
            selected: selectedBadges,
            periodLabel,
            selectable:
              canBuy &&
              Boolean(query.product) &&
              Boolean(selectedOption) &&
              Boolean(selectedProduct) &&
              !roomPrimeSoldOut &&
              selectedReadiness.ready,
          })}
        </div>

        <aside class="plans-storefront__summary" aria-label="주문 요약">
          ${renderOrderSummaryBlock({
            family: 'position',
            rows: orderRows,
            totalLabel: '예상 결제 금액',
            totalValue: displayTotal != null ? formatKrw(displayTotal) : '—',
            ctaDisabled: orderCtaDisabled,
            ctaLabel: roomPrimeSoldOut ? '예약대기만 가능' : '구매하기',
            note: '시작일·종료일은 결제 완료 시 확정 · 자동연장 없음 · 최종 금액은 결제 직전에 한 번 더 확인해요.',
          })}
        </aside>
      </div>

      <div class="plans-storefront__foot">
        ${renderPolicyAccordion('position', role)}
        ${role === 'study_room' || role === 'tutor' ? renderTestModeToggle() : ''}
      </div>
    </section>`;
}

/** P18-03 쪽지권 */
export function renderPlansAccess() {
  const role = getPlansEffectiveRole();
  const query = parsePlansQuery();
  const profile = role === 'tutor' || role === 'study_room' ? resolveSelectedProfile(query, role) : null;
  const providerKey = role === 'tutor' ? 'tutor' : 'study_room';
  const products = getCatalogByFamily('access', providerKey);
  const { syncReady, syncLoading, syncError, syncPending } = plansStatusFlags(profile);
  const ops = syncReady ? getPaidOperationalStatus() : null;
  const tickets = ops?.tickets;
  const packs = tickets?.memo?.packs ?? ops?.memo_packs ?? [];
  const activePaidPack =
    syncReady && profile
      ? packs.find(
          (p) =>
            p.provider_type === providerKey &&
            String(p.provider_id) === String(profile.id) &&
            (p.grant_kind === 'payment_pack' || p.grant_kind === 'payment') &&
            p.status === '사용 중' &&
            (Number(p.granted_count) === 5 || Number(p.granted_count) === 10),
        )
      : null;
  const packPurchaseBlocked = Boolean(activePaidPack) || syncLoading || syncPending || syncError;
  const product = products[0];
  const options = product?.options || [];
  const selectedOpt = (() => {
    const fromQuery = options.find((o) => o.optionId === query.option);
    if (fromQuery && (isImmediateTicket(fromQuery) || !packPurchaseBlocked)) return fromQuery;
    if (packPurchaseBlocked) {
      return options.find((o) => isImmediateTicket(o)) || options[0];
    }
    return options.find((o) => isImmediateTicket(o)) || options[0];
  })();
  const selectedPackLocked =
    Boolean(selectedOpt) && !isImmediateTicket(selectedOpt) && packPurchaseBlocked;
  const canBuy =
    (role === 'tutor' || role === 'study_room') && profile && product && !selectedPackLocked;
  const countN = ticketCount(selectedOpt);
  const productName = ticketProductName(selectedOpt);
  const priceText = selectedOpt
    ? (() => {
        const amt = resolveCheckoutAmount(selectedOpt.priceKrw);
        return amt.testMode
          ? `${formatKrw(selectedOpt.priceKrw)} (시험 ${formatKrw(amt.chargeKrw)})`
          : formatKrw(selectedOpt.priceKrw);
      })()
    : '—';
  const summaryRows = [
    { label: '상품', value: productName },
    { label: '횟수', value: countN ? `${countN}회` : '—' },
    { label: '가격', value: priceText },
    ...(isImmediateTicket(selectedOpt)
      ? [{ label: '발송', value: '결제 후 바로 발송 · 남은 횟수로 보관되지 않습니다' }]
      : [
          { label: '사용기한', value: '구매일부터 120일' },
          { label: '소멸', value: '사용기한 경과 시 잔여 소멸(환불액 0) · 연장 없음' },
        ]),
    { label: '환불', value: MEMO_TICKET_REFUND_SHORT },
    { label: '적용 프로필', value: profile ? profile.label : '미선택' },
  ];

  return `
    <section class="plans-store plans-storefront plans-sf plans-sf--access" data-plans-access>
      <header class="plans-sf-hero">
        ${renderPlansHero({
          eyebrow: '유료 안내',
          title: '공부방·과외쌤 쪽지권',
          lead: '',
        })}
      </header>

      <div class="plans-storefront__body">
        <div class="plans-storefront__catalog">
          <section class="plans-access-explain" aria-label="쪽지권 핵심 안내">
            <strong class="plans-access-explain__lead">학생에게 먼저 보내는 첫 쪽지만 차감됩니다</strong>
            <ul class="plans-access-explain__list">
              <li>학생에게 먼저 보내는 첫 쪽지만 차감됩니다.</li>
              <li>같은 대화방에서 주고받는 후속 쪽지는 모두 무료입니다.</li>
              <li>학생·학부모가 먼저 보낸 쪽지와 그에 대한 답장도 무료입니다.</li>
            </ul>
          </section>

          ${renderAccessAuxLinks()}

          ${role === 'tutor' || role === 'study_room' ? renderApplyTargetBlock(profile, role, 'access') : ''}
          ${role === 'guest' || role === 'parent' ? renderProfileBanner(null, role) : ''}
          ${
            syncLoading || syncPending
              ? `<p class="plans-sf-status" data-plans-access-status="loading">쪽지권 상태를 확인하는 중입니다. 5회권·10회권 구매는 잠시 후 가능합니다.</p>`
              : ''
          }
          ${
            syncError
              ? `<p class="plans-sf-status plans-sf-status--error" role="alert" data-plans-access-status="error">쪽지권 상태를 불러오지 못해 5회권·10회권 구매를 막았습니다. <button type="button" class="btn btn--secondary btn--sm" data-plans-access-retry>다시 시도</button></p>`
              : ''
          }

          <section class="plans-sf-panel plans-ticket-select">
            <header class="plans-sf-panel__head">
              <h2 class="plans-sf-panel__title">쪽지권 선택</h2>
              <p class="plans-sf-panel__lead">1회 즉시권 · 5회권 · 10회권 중 필요한 만큼만 선택하세요.</p>
            </header>
            ${
              activePaidPack
                ? `<div class="plans-access-hold" data-plans-access-status="active-pack" role="status">
              <p>사용 중인 쪽지권이 있습니다. 남은 횟수를 모두 사용하거나 사용기한이 지난 뒤 새 묶음권을 구매할 수 있습니다.</p>
              <p>5회권과 10회권은 지금 살 수 없습니다. 1회 즉시권은 계속 구매할 수 있습니다.</p>
              <p class="plans-access-hold__nav"><a class="plans-access-aux__link" href="#/mypage/plans" data-nav="/mypage/plans">구매이력 보기</a></p>
            </div>`
                : ''
            }
            ${products
              .map((p) =>
                renderAccessCard(p, profile, role, {}, {
                  embed: 'grid',
                  activePaidPack,
                  packPurchaseBlocked,
                  selectedOptionId: selectedOpt?.optionId || query.option || '',
                }),
              )
              .join('')}
            ${renderAccessPurchaseCheck()}
          </section>
        </div>

        <aside class="plans-storefront__summary" aria-label="주문 요약">
          ${renderOrderSummaryBlock({
            family: 'access',
            rows: summaryRows,
            totalLabel: '결제 예정(표시가)',
            totalValue: selectedOpt
              ? formatKrw(resolveCheckoutAmount(selectedOpt.priceKrw).displayKrw)
              : '—',
            ctaDisabled: !canBuy,
            ctaLabel: selectedPackLocked ? '묶음권 이용 중' : '구매하기',
          })}
        </aside>
      </div>

      <div class="plans-storefront__foot">
        ${renderPolicyAccordion('access')}
        ${role === 'tutor' || role === 'study_room' ? renderTestModeToggle() : ''}
      </div>
    </section>`;
}

/** P18-04 이용 현황 (#/mypage/plans/my) */
export function renderPlansMy() {
  const role = getPlansEffectiveRole();
  if (role === 'parent' || role === 'guest') {
    return `
      <section class="mypage-panel">
        <p class="mypage-lead">구매이력</p>
        ${renderProfileBanner(null, role)}
      </section>`;
  }

  const query = parsePlansQuery();
  const profile = role === 'tutor' || role === 'study_room' ? resolveSelectedProfile(query, role) : null;
  const providerKey = role === 'tutor' ? 'tutor' : 'study_room';
  const { syncReady, syncLoading, syncError, syncPending } = plansStatusFlags(profile);
  const ops = syncReady ? getPaidOperationalStatus() : null;
  const exposure = ops?.exposure;
  const tickets = ops?.tickets;
  const metrics = getRoiMetrics();
  const positions = exposure?.positions ?? [];
  const allPacks = tickets?.memo?.packs ?? [];
  const packs = profile
    ? allPacks.filter(
        (p) => p.provider_type === providerKey && String(p.provider_id) === String(profile.id),
      )
    : allPacks;

  return `
    <section class="mypage-panel">
      <p class="mypage-lead">이용 현황</p>
      ${renderProviderNoticeBanners()}
      ${
        syncLoading || syncPending
          ? `<p class="mypage-info-box" data-plans-my-status="loading">쪽지권·상품 상태를 확인하는 중입니다.</p>`
          : ''
      }
      ${
        syncError
          ? `<p class="mypage-info-box" role="alert" data-plans-my-status="error">상품 상태를 불러오지 못했습니다. <button type="button" class="btn btn--secondary btn--sm" data-plans-my-retry>다시 시도</button></p>`
          : ''
      }
      ${role === 'tutor' || role === 'study_room' ? renderLowCreditBanner(tickets) : ''}
      <h2 class="mypage-subhead">이용중 노출상품</h2>
      ${
        syncReady
          ? positions.length
            ? `<table class="plans-table" aria-label="이용중 노출상품">
              <thead><tr><th>상품</th><th>잔여</th><th>종료일</th><th></th></tr></thead>
              <tbody>
                ${positions
                  .map(
                    (p) => `
                  <tr>
                    <td><strong>${esc(productLabel(p.sku))}</strong></td>
                    <td>${p.days_left}일</td>
                    <td>${esc(String(p.ends_on || p.ends_at || '').slice(0, 10))}</td>
                    <td><a href="#/plans/positions" class="btn btn--secondary btn--sm" data-plans-nav="/plans/positions">재구매</a></td>
                  </tr>`,
                  )
                  .join('')}
              </tbody>
            </table>`
            : `<div class="mypage-info-box"><p>${esc(P18_EXPOSURE_STATUS.basic)}</p>
              <a href="#/plans/positions" class="btn btn--primary btn--sm" data-plans-nav="/plans/positions">노출상품 보기</a>
            </div>`
          : `<p class="mypage-muted">노출상품 정보는 상태 확인 후 표시됩니다.</p>`
      }
      ${role === 'tutor' || role === 'study_room' ? renderProfileBanner(profile, role) : ''}
      <h2 class="mypage-subhead">쪽지권</h2>
      ${
        !syncReady
          ? `<p class="mypage-muted" data-plans-my-status="packs-pending">쪽지권 목록은 상태 확인 후 표시됩니다.</p>`
          : packs.length
            ? `<table class="plans-table" aria-label="쪽지권" data-plans-my-status="packs-ready">
              <thead><tr><th>프로필</th><th>상품</th><th>출처</th><th>부여</th><th>남은 횟수</th><th>부여일</th><th>사용기한</th><th>상태</th></tr></thead>
              <tbody>
                ${packs
                  .map(
                    (p) => `
                  <tr data-plans-pack-row data-plans-pack-grant="${esc(String(p.grant_label || ''))}" data-plans-pack-status="${esc(String(p.status || ''))}" data-plans-pack-granted="${esc(String(p.granted_count ?? ''))}" data-plans-pack-remaining="${esc(String(p.remaining ?? ''))}" data-plans-pack-provider="${esc(String(p.provider_id ?? ''))}">
                    <td>${esc(memoPackProviderLabel(p.provider_type))}</td>
                    <td>${esc(p.product_name || '')}</td>
                    <td>${esc(p.grant_label || '')}</td>
                    <td>${p.granted_count ?? '—'}</td>
                    <td>${p.remaining ?? '—'}</td>
                    <td>${esc(String(p.purchased_at || '').slice(0, 10))}</td>
                    <td data-plans-pack-expires>${esc(String(p.expires_at || '').slice(0, 10))}</td>
                    <td>${esc(memoPackStatusLabel(p.status))}</td>
                  </tr>`,
                  )
                  .join('')}
              </tbody>
            </table>
            <p class="mypage-muted"><a href="#/plans/access" data-plans-nav="/plans/access">쪽지권 충전하기</a></p>`
            : `<p class="mypage-muted" data-plans-my-status="packs-empty">이 프로필에 표시할 쪽지권이 없습니다. · <a href="#/plans/access" data-plans-nav="/plans/access">쪽지권 충전하기</a></p>`
      }
      ${
        role === 'study_room' && profile
          ? `<h2 class="mypage-subhead">프라임 예약대기</h2>
            <div class="plans-my-waitlist" data-plans-my-waitlist data-study-room-id="${esc(String(profile.id))}">
              <p class="mypage-muted">예약대기 목록을 불러오는 중…</p>
            </div>`
          : ''
      }
      <h2 class="mypage-subhead">반응 요약</h2>
      <div class="mypage-stats roi-metrics">
        ${metrics
          .map(
            (m) => `
          <div class="mypage-stat" title="${esc(m.hint)}">
            <span>${esc(m.label)}</span><strong>${m.value}</strong>
          </div>`,
          )
          .join('')}
      </div>
      <div class="mypage-actions-row">
        <a href="#/mypage/plans" class="btn btn--secondary" data-nav="/mypage/plans">구매이력</a>
      </div>
    </section>`;
}

/** @param {string} path */
export function renderPlansScreen(path) {
  ensureStudyRoomStore();
  ensureTutorStore();
  const p = path.split('?')[0];
  if (p === '/plans/positions') return renderPlansPositions();
  if (p === '/plans/access') return renderPlansAccess();
  if (p === '/plans/my') return renderPlansMy();
  if (p === '/plans/history') return renderPlansHistory();
  if (p === '/plans/checkout') return renderPlansCheckout();
  if (p === '/plans/result') return renderPlansResult();
  return renderPlansHome();
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindPlansScreenEvents(root, rerender) {
  const path = (window.location.hash.slice(1) || '').split('?')[0];
  if (path !== '/plans/access' && path !== '/mypage/plans/my' && path !== '/plans/my' && path !== '/plans/positions') {
    clearLastPlansHydratedHash();
  }
  if (path !== '/plans/positions' && path !== '/plans/checkout') {
    clearTierHydratedHash();
  }
  if (path === '/plans/positions') {
    const role = getPlansEffectiveRole();
    const query = parsePlansQuery();
    const profile =
      role === 'tutor' || role === 'study_room' ? resolveSelectedProfile(query, role) : null;
    schedulePlansStatusHydrate(profile, rerender, path);
    scheduleTierCheckHydrate(profile, rerender);
    root.querySelectorAll('[data-plans-tier-retry]').forEach((btn) => {
      btn.addEventListener('click', () => {
        scheduleTierCheckHydrate(profile, rerender, { force: true });
      });
    });
    root.querySelectorAll('[data-plans-apply-region]').forEach((el) => {
      el.addEventListener('change', () => {
        const region = readSelectedPrimeRegion(root);
        const q = parsePlansQuery();
        const next = { ...q };
        if (region) {
          if (region.cityId) {
            next.city_id = region.cityId;
            delete next.region_basis_type;
            delete next.region_id;
            delete next.complex_id;
            delete next.slot_group;
          } else {
            delete next.city_id;
            next.region_basis_type = region.regionBasisType;
            if (region.regionId) next.region_id = region.regionId;
            else delete next.region_id;
            if (region.complexId) next.complex_id = region.complexId;
            else delete next.complex_id;
            if (region.slotGroup) next.slot_group = region.slotGroup;
          }
        }
        window.location.hash = buildPlansHref('/plans/positions', applyBadgeQuery(next, role));
      });
    });
  }
  if (path === '/plans/access') {
    const role = getPlansEffectiveRole();
    const query = parsePlansQuery();
    const profile =
      role === 'tutor' || role === 'study_room' ? resolveSelectedProfile(query, role) : null;
    schedulePlansStatusHydrate(profile, rerender, path);
    root.querySelector('[data-plans-access-retry]')?.addEventListener('click', () => {
      resetAccessStatusSync();
      schedulePlansStatusHydrate(profile, rerender, path);
    });
  }

  if (path === '/mypage/plans/my' || path === '/plans/my') {
    const role = getPlansEffectiveRole();
    const query = parsePlansQuery();
    const profile =
      role === 'tutor' || role === 'study_room' ? resolveSelectedProfile(query, role) : null;
    schedulePlansStatusHydrate(profile, rerender, path);
    root.querySelector('[data-plans-my-retry]')?.addEventListener('click', () => {
      resetAccessStatusSync();
      schedulePlansStatusHydrate(profile, rerender, path);
    });
    const waitHost = root.querySelector('[data-plans-my-waitlist]');
    if (waitHost && role === 'study_room' && profile) {
      const roomId = profile.id;
      fetchPrimeWaitlist(roomId)
        .then((res) => {
          const items = Array.isArray(res?.items) ? res.items : [];
          if (!items.length) {
            waitHost.innerHTML = `<p class="mypage-muted">등록된 프라임 예약대기가 없습니다. · <a href="#/plans/positions" data-plans-nav="/plans/positions">노출상품 보기</a></p>`;
            return;
          }
          waitHost.innerHTML = `
            <table class="plans-table" aria-label="프라임 예약대기">
              <thead><tr><th>상품</th><th>지역</th><th>상태</th><th>등록일</th><th></th></tr></thead>
              <tbody>
                ${items
                  .map(
                    (w) => `
                  <tr>
                    <td>${esc(w.product || '프라임')}</td>
                    <td>${esc(w.region || '—')}</td>
                    <td>${esc(waitlistStatusLabel(w))}</td>
                    <td>${esc(String(w.registered_at || '').slice(0, 10))}</td>
                    <td>${
                      w.can_cancel
                        ? `<button type="button" class="btn btn--secondary btn--sm" data-plans-waitlist-cancel="${esc(String(w.id))}">취소</button>`
                        : ''
                    }</td>
                  </tr>`,
                  )
                  .join('')}
              </tbody>
            </table>
            <p class="mypage-muted">순번·경쟁업체는 공개하지 않습니다. 결제 가능한 상태가 되면 노출상품에서 구매를 완료하세요.</p>`;
          waitHost.querySelectorAll('[data-plans-waitlist-cancel]').forEach((btn) => {
            btn.addEventListener('click', async () => {
              const id = btn.getAttribute('data-plans-waitlist-cancel');
              if (!id) return;
              try {
                await cancelPrimeWaitlist(roomId, id);
                rerender();
              } catch (err) {
                void s114Alert(err?.message || '예약대기 취소에 실패했습니다.');
              }
            });
          });
        })
        .catch(() => {
          waitHost.innerHTML = `<p class="mypage-muted" role="status">예약대기 목록을 불러오지 못했습니다.</p>`;
        });
    }
  }
  bindPlansHistoryEvents(root, rerender, path);

  root.querySelectorAll('[data-plans-receipt-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openReceiptOrderRef = btn.getAttribute('data-plans-receipt-open');
      rerender();
    });
  });
  root.querySelector('[data-plans-receipt-close]')?.addEventListener('click', () => {
    openReceiptOrderRef = null;
    rerender();
  });
  bindReceiptEvents(root);

  root.querySelectorAll('[data-plans-test-mode]').forEach((el) => {
    el.addEventListener('change', () => {
      if (el instanceof HTMLInputElement) {
        setPlansTestMode(el.checked);
        rerender();
      }
    });
  });

  root.querySelectorAll('[data-plans-buy], [data-plans-order-cta]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const role = getPlansEffectiveRole();
      const query = parsePlansQuery();
      const profile = resolveSelectedProfile(query, role);
      const family = btn.getAttribute('data-family') || btn.closest('[data-family]')?.getAttribute('data-family');
      let productCode = btn.getAttribute('data-product-code') || '';
      let optionId = '';

      if (btn.hasAttribute('data-plans-order-cta')) {
        const summary = btn.closest('[data-plans-order-summary]');
        const fam = summary?.getAttribute('data-family') || family || '';
        if (fam === 'access') {
          const accessItem = root.querySelector('.plans-card--access [data-plans-option]');
          const accessCard = root.querySelector('.plans-card--access');
          productCode =
            accessCard?.getAttribute('data-product-code') ||
            accessCard?.querySelector('[data-plans-buy]')?.getAttribute('data-product-code') ||
            'memo_ticket';
          optionId = accessItem instanceof HTMLSelectElement ? accessItem.value : '';
        } else {
          const selected =
            root.querySelector('.plans-catalog__item.is-primary [data-plans-option]') ||
            root.querySelector('.plans-catalog__item [data-plans-option]');
          const card = selected?.closest('.plans-catalog__item');
          productCode = card?.getAttribute('data-product-code') || query.product || 'prime';
          optionId = selected instanceof HTMLSelectElement ? selected.value : '';
        }
      } else {
        const itemEl = btn.closest('.plans-catalog__item');
        const select = itemEl?.querySelector('[data-plans-option]');
        optionId = select instanceof HTMLSelectElement ? select.value : '';
      }

      const product = getProductConfig(productCode, role);
      const option = getPriceOption(productCode, optionId, role);
      if (!product || !option || !profile) return;

      if (product.family === 'position' || productCode === 'prime' || productCode === 'pick') {
        const applyEl = root.querySelector('[data-plans-apply]');
        if (applyEl?.getAttribute('data-region-ready') === '0') return;
        const card =
          root.querySelector(`.plans-catalog__item[data-product-code="${productCode}"]`) ||
          root.querySelector('.plans-catalog__item.is-primary');
        if (card?.classList.contains('is-soldout')) return;
        if (card?.classList.contains('is-not-ready')) return;
      }

      const isImmediate = option.apiVariant === '1회' || /^1회/.test(String(option.label || ''));
      if (!isImmediate && (productCode.includes('memo') || product.family === 'access')) {
        const key = accessProfileKey(profile);
        const blocked =
          plansStatusSync.phase !== 'ready' ||
          plansStatusSync.key !== key ||
          !getProviderStatus();
        if (blocked) return;
        const ticketBtn = root.querySelector(
          `[data-plans-ticket-option="${optionId}"]`,
        );
        if (ticketBtn instanceof HTMLButtonElement && ticketBtn.disabled) return;
      }

      const badgeFromDom = [...root.querySelectorAll('[data-plans-badge-code]:checked')]
        .map((n) => n.getAttribute('data-plans-badge-code') || '')
        .filter(Boolean)
        .slice(0, 2);
      const badgeFromQuery = String(query.badges || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 2);
      const region =
        product.family === 'position' || productCode === 'prime' || productCode === 'pick'
          ? readSelectedPrimeRegion(root)
          : null;
      if (
        role === 'study_room' &&
        (productCode === 'prime' || productCode === 'pick') &&
        (!region || !region.regionBasisType)
      ) {
        return;
      }
      if (role === 'tutor' && (product.family === 'position' || productCode === 'prime' || productCode === 'pick')) {
        if (!region?.cityId) return;
      }
      setCheckoutDraft({
        productCode,
        optionId,
        productName: product.name,
        optionLabel: option.label,
        apiVariant: option.apiVariant,
        priceKrw: option.priceKrw,
        listPriceKrw: option.listPriceKrw,
        discountKrw: option.discountKrw,
        discountLabel: option.discountLabel || '',
        memoBundle: option.memoBundle || 0,
        providerType: profile.providerType,
        providerId: profile.id,
        providerLabel: profile.label,
        createdAt: Date.now(),
        badgeCodes:
          product.family === 'position' || productCode === 'prime' || productCode === 'pick'
            ? sanitizeBadgeCodes(
                role,
                badgeFromDom.length ? badgeFromDom : badgeFromQuery,
              )
            : [],
        regionBasisType: region?.regionBasisType,
        regionId: region?.regionId,
        complexId: region?.complexId,
        slotGroup: region?.slotGroup,
        regionLabel: region?.regionLabel,
        cityId: region?.cityId,
        primarySubjectId: getApplyTargetReadiness(profile, role).primarySubjectId || '',
      });
      window.location.hash = '#/plans/checkout';
    });
  });

  root.querySelectorAll('[data-plans-select-product]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn instanceof HTMLButtonElement && btn.disabled) return;
      const code = btn.getAttribute('data-product-code') || '';
      const itemEl = btn.closest('.plans-catalog__item');
      const select = itemEl?.querySelector('[data-plans-option]');
      const optionId = select instanceof HTMLSelectElement ? select.value : '';
      const role = getPlansEffectiveRole();
      const query = parsePlansQuery();
      const next = applyBadgeQuery({ ...query, product: code }, role);
      if (optionId) next.option = optionId;
      if (query.provider_id) next.provider_id = query.provider_id;
      if (query.provider_type) next.provider_type = query.provider_type;
      window.location.hash = buildPlansHref('/plans/positions', next);
    });
  });

  root.querySelectorAll('select[data-plans-option]').forEach((el) => {
    el.addEventListener('change', () => {
      if (!(el instanceof HTMLSelectElement)) return;
      const path = (window.location.hash.slice(1) || '').split('?')[0];
      if (path !== '/plans/positions' && path !== '/plans/access') return;
      const code = el.getAttribute('data-plans-option') || '';
      const query = parsePlansQuery();
      const next = { ...query };
      if (code) next.product = code;
      if (el.value) next.option = el.value;
      if (path === '/plans/positions') {
        window.location.hash = buildPlansHref(path, applyBadgeQuery(next, getPlansEffectiveRole()));
      } else {
        window.location.hash = buildPlansHref(path, next);
      }
    });
  });

  root.querySelectorAll('[data-plans-badge-code]').forEach((el) => {
    el.addEventListener('change', () => {
      const role = getPlansEffectiveRole();
      const checked = sanitizeBadgeCodes(
        role,
        [...root.querySelectorAll('[data-plans-badge-code]:checked')].map(
          (n) => n.getAttribute('data-plans-badge-code') || '',
        ),
      );
      const query = parsePlansQuery();
      const next = applyBadgeQuery({ ...query, badges: checked.join(',') }, role);
      window.location.hash = buildPlansHref('/plans/positions', next);
    });
  });

  root.querySelectorAll('[data-plans-period-option]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn instanceof HTMLButtonElement && btn.disabled) return;
      const optionId = btn.getAttribute('data-plans-period-option') || '';
      const code = btn.getAttribute('data-product-code') || '';
      const select = root.querySelector(`[data-plans-option="${code}"]`);
      if (select instanceof HTMLSelectElement && optionId) {
        select.value = optionId;
      }
      const query = parsePlansQuery();
      const next = { ...query };
      if (code) next.product = code;
      if (optionId) next.option = optionId;
      window.location.hash = buildPlansHref('/plans/positions', applyBadgeQuery(next, getPlansEffectiveRole()));
    });
  });

  root.querySelectorAll('[data-plans-ticket-option]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const optionId = btn.getAttribute('data-plans-ticket-option') || '';
      const productCode = btn.getAttribute('data-product-code') || 'memo_ticket';
      const select = root.querySelector(`[data-plans-option="${productCode}"]`);
      if (select instanceof HTMLSelectElement) {
        select.value = optionId;
      }
      const query = parsePlansQuery();
      window.location.hash = buildPlansHref('/plans/access', {
        ...query,
        option: optionId,
      });
    });
  });

  root.querySelector('[data-plans-waitlist-register]')?.addEventListener('click', async () => {
    const role = getPlansEffectiveRole();
    const query = parsePlansQuery();
    const profile = resolveSelectedProfile(query, role);
    if (role !== 'study_room' || !profile) {
      void s114Alert('예약대기는 공부방 프로필로만 등록할 수 있습니다.');
      return;
    }
    const regionEl = root.querySelector('[data-plans-apply-region]:checked');
    const region =
      regionEl instanceof HTMLInputElement
        ? {
            region_basis_type: regionEl.getAttribute('data-region-basis') || '',
            region_id: regionEl.getAttribute('data-region-id') || '',
            complex_id: regionEl.getAttribute('data-complex-id') || '',
            region_label: regionEl.value,
            slot_group: regionEl.value,
          }
        : null;
    if (!region?.region_basis_type || (region.region_basis_type === 'dong' && !region.region_id) || (region.region_basis_type === 'complex' && !region.complex_id)) {
      void s114Alert('적용 지역을 먼저 선택해 주세요.');
      return;
    }
    try {
      const res = await registerPrimeWaitlist(profile.id, region);
      await s114Alert(res.message || '예약대기가 등록되었습니다.');
      window.location.hash = '#/mypage/plans/my';
    } catch (err) {
      void s114Alert(err?.message || '예약대기 등록에 실패했습니다.');
    }
  });

  if (path === '/plans/checkout') {
    const draft = getCheckoutDraft();
    const checkoutProfile =
      draft && (draft.providerType === 'tutor' || draft.providerType === 'study_room')
        ? { providerType: draft.providerType, id: draft.providerId }
        : null;
    scheduleTierCheckHydrate(checkoutProfile, rerender);
    root.querySelector('[data-plans-tier-retry]')?.addEventListener('click', () => {
      scheduleTierCheckHydrate(checkoutProfile, rerender, { force: true });
    });
    scheduleCheckoutServerQuote(rerender);
  }

  const payBtn = root.querySelector('[data-plans-pay]');
  if (payBtn) {
    payBtn.addEventListener('click', async () => {
      const draft = getCheckoutDraft();
      const errEl = root.querySelector('[data-plans-checkout-error]');
      const agree = root.querySelector('[data-plans-agree]');
      if (!(agree instanceof HTMLInputElement) || !agree.checked) {
        if (errEl) {
          errEl.hidden = false;
          errEl.textContent = '약관에 동의해 주세요.';
        }
        return;
      }
      if (!draft) return;

      const methodEl = root.querySelector('input[name="plans_pay_method"]:checked');
      const method = methodEl instanceof HTMLInputElement ? methodEl.value : 'card';

      payBtn.setAttribute('disabled', 'true');
      try {
        if (!getProductConfig(draft.productCode, draft.providerType)) {
          throw new Error('상품 정보가 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.');
        }
        let created = null;
        if (draft.orderRef) {
          created = {
            order_ref: draft.orderRef,
            amount_won: draft.serverAmountWon,
            sale_price_krw: draft.serverAmountWon,
            badge_codes: draft.badgeCodes,
            badge_sale_krw: draft.serverBadgeSaleKrw,
            started_on: draft.startedOn,
            ends_on: draft.endsOn,
            city_id: draft.cityId,
            memo_bundle: 0,
            pg_provider: draft.pgProvider || '',
            payment_id: draft.paymentId || '',
            store_id: draft.storeId || '',
            channel_key: draft.channelKey || '',
            order_name: draft.orderName || '',
            currency: draft.payCurrency || 'CURRENCY_KRW',
          };
        } else {
          created = await createPaidCheckout(draft.productCode, draft.apiVariant, {
            providerType: draft.providerType,
            providerId: draft.providerId,
            studentId: Number(root.querySelector('[data-plans-immediate-student]')?.value || draft.studentId || 0),
            body: String(root.querySelector('[data-plans-immediate-body]')?.value || draft.body || ''),
            badgeCodes: Array.isArray(draft.badgeCodes)
              ? sanitizeBadgeCodes(draft.providerType, draft.badgeCodes)
              : [],
            regionBasisType: draft.regionBasisType,
            regionId: draft.regionId,
            complexId: draft.complexId,
            slotGroup: draft.slotGroup,
            regionLabel: draft.regionLabel,
            cityId: draft.cityId,
            primarySubjectId: draft.primarySubjectId,
          });
        }
        const serverAmount = Number(created.amount_won ?? created.sale_price_krw);
        if (!Number.isFinite(serverAmount) || serverAmount <= 0) {
          throw new Error('결제 금액을 확인하지 못했어요. 다시 시도해 주세요.');
        }
        // 클라이언트 draft 금액과 달라도 서버 판매가를 사용한다
        if (Number(draft.priceKrw) !== serverAmount) {
          console.warn('[plans/checkout] client price ignored', draft.priceKrw, '→', serverAmount);
        }
        let completed;
        if (String(created.pg_provider || '') === 'portone_test') {
          const pay = await requestPortOneCardPayment({
            storeId: String(created.store_id || ''),
            channelKey: String(created.channel_key || ''),
            paymentId: String(created.payment_id || ''),
            orderName: String(created.order_name || `${draft.productName} ${draft.optionLabel}`),
            totalAmount: serverAmount,
            currency: String(created.currency || 'CURRENCY_KRW'),
          });
          if (!pay.ok) {
            setCheckoutResult({
              status: pay.kind === 'cancel' ? 'canceled' : 'failed',
              message: pay.message,
              orderRef: created.order_ref,
              productName: draft.productName,
              optionLabel: draft.optionLabel,
              providerLabel: draft.providerLabel,
              providerType: draft.providerType,
              providerId: draft.providerId,
              chargeKrw: serverAmount,
            });
            if (errEl) {
              errEl.hidden = false;
              errEl.textContent = pay.message;
            }
            window.location.hash = '#/plans/result';
            return;
          }
          completed = await completePaidCheckout(created.order_ref, { paymentId: pay.paymentId });
        } else {
          completed = await completePaidCheckout(created.order_ref);
        }
        invalidateProviderStatus();
        resetAccessStatusSync();
        await hydrateProviderStatusStrict().catch(() => hydrateProviderStatus());
        await hydrateProviderNotices();

        if (completed && completed.auto_cancelled === true) {
          markHistoryCacheStale();
          setCheckoutResult({
            status: 'cancelled',
            auto_cancelled: true,
            message: typeof completed.message === 'string' && completed.message
              ? completed.message
              : '선택한 상품을 지금 지급할 수 없어 결제를 자동으로 취소했어요. 카드사에 따라 환불까지 3~5영업일 걸릴 수 있어요.',
            orderRef: completed.order_ref || created.order_ref,
            productName: draft.productName,
            optionLabel: draft.optionLabel,
            providerLabel: draft.providerLabel,
            providerType: draft.providerType,
            providerId: draft.providerId,
            chargeKrw: serverAmount,
          });
          clearCheckoutDraft();
          window.location.hash = '#/plans/result';
          return;
        }

        appendHistoryRow({
          orderRef: completed.order_ref || created.order_ref,
          productName: `${draft.productName} · ${draft.optionLabel}`,
          providerLabel: draft.providerLabel,
          amountKrw: serverAmount,
          paymentMethod: method,
          paidAt: new Date().toISOString(),
          status: 'paid',
        });
        markHistoryCacheStale();

        setCheckoutResult({
          status: 'success',
          orderRef: completed.order_ref || created.order_ref,
          productName: draft.productName,
          optionLabel: draft.optionLabel,
          providerLabel: draft.providerLabel,
          providerType: draft.providerType,
          providerId: draft.providerId,
          chargeKrw: serverAmount,
          badgeCodes: Array.isArray(created.badge_codes)
            ? created.badge_codes
            : Array.isArray(draft.badgeCodes)
              ? draft.badgeCodes
              : [],
          badgeSaleKrw: Number(created.badge_sale_krw) || 0,
          startedOn: completed.started_on || created.started_on || '',
          endsOn: completed.ends_on || created.ends_on || '',
          cityId: completed.city_id || created.city_id || draft.cityId || '',
          regionLabel: draft.regionLabel || '',
          memoBundleGranted:
            Number(completed.memo_bundle_granted) || Number(created.memo_bundle) || 0,
        });
        clearCheckoutDraft();
        window.location.hash = '#/plans/result';
      } catch (err) {
        if (err && err.code === 'tier_fields_missing') {
          applyTierOrderMissing(
            draft.providerType,
            draft.providerId,
            draft.productCode,
            err.missing,
            err.tierMessage || '',
          );
        }
        if (err instanceof Error && err.code === 'payment_not_available') {
          setCheckoutResult({
            status: 'unavailable',
            message: '결제를 진행할 수 없습니다. 잠시 후 다시 시도해 주세요.',
          });
          window.location.hash = '#/plans/result';
          return;
        }
        const msg = err instanceof Error ? err.message : '결제에 실패했습니다.';
        setCheckoutResult({
          status: 'failed',
          message: msg,
          productName: draft.productName,
          optionLabel: draft.optionLabel,
          providerLabel: draft.providerLabel,
          providerType: draft.providerType,
          providerId: draft.providerId,
          badgeCodes: Array.isArray(draft.badgeCodes) ? draft.badgeCodes : [],
        });
        if (errEl) {
          errEl.hidden = false;
          errEl.textContent = msg;
        }
        window.location.hash = '#/plans/result';
      } finally {
        payBtn.removeAttribute('disabled');
      }
    });
  }
}


