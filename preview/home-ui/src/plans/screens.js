/**
 * 34장 — 상품센터 화면 (P18-01~07)
 * 기존 plans-catalog / paid-backend / paid-checkout 자산 재사용
 */

import { previewState } from '../state.js';
import {
  FREE_TIER_COPY,
  PAID_TIER_COPY,
  P18_HEADLINE,
  P18_RENEWAL_COPY,
  P18_EXPOSURE_STATUS,
} from '../mypage/plans-catalog.js';
import { getRoiMetrics, getPaidOperationalStatus } from '../paid-backend.js';
import { renderProviderNoticeBanners, hydrateProviderNotices } from '../provider-notices.js';
import { createPaidCheckout, completePaidCheckout } from '../paid-api.js';
import { hydrateProviderStatus } from '../provider-status.js';
import { ensureStudyRoomStore } from '../study-room-reg/index.js';
import { ensureTutorStore } from '../tutor-reg/index.js';
import { getPublishReadiness as getRoomReadiness, getStudyRoom } from '../study-room-reg/store.js';
import { getPublishReadiness as getTutorReadiness, getTutor } from '../tutor-reg/store.js';
import { AUTH_UI_BASE } from '../../../shared/preview-links.js';
import {
  getCatalogByFamily,
  getProductConfig,
  getPriceOption,
  getPlanRuntimeSettings,
  getPlanSetting,
  resolveCheckoutAmount,
  formatKrw,
  isPlansTestMode,
  setPlansTestMode,
} from './runtime-config.js';
import { parsePlansQuery, buildPlansHref } from './router.js';
import {
  getPlansEffectiveRole,
  listProviderProfiles,
  resolveSelectedProfile,
} from './profiles.js';
import {
  setCheckoutDraft,
  getCheckoutDraft,
  clearCheckoutDraft,
  setCheckoutResult,
  getCheckoutResult,
} from './checkout-session.js';
import {
  getHistoryRows,
  loadHistoryRows,
  appendHistoryRow,
  paymentMethodLabel,
  orderStatusLabel,
} from './history-mock.js';
import { resolveSlotInventory, getSlotForProduct } from './slot-inventory.js';
import { renderReceiptPanel, bindReceiptEvents } from './receipt.js';
import {
  renderPlansHero,
  renderGuideBox,
  renderFreePaidCompare,
  renderAccessCompare,
  renderPlansCtaBanner,
  renderFeatureHighlights,
  renderPlansFaqList,
  renderBadgeAddonSection,
  formatCardPrice,
  productMediaClass,
  productIcon,
} from './store-ui.js';

/** @type {{ rows: import('./history-mock.js').HistoryRow[], fromApi: boolean, loaded: boolean }} */
let historyCache = { rows: [], fromApi: false, loaded: false };

/** @type {string | null} */
let openReceiptOrderRef = null;

/**
 * @param {number} remaining
 * @returns {boolean}
 */
function isLowCredit(remaining) {
  const n = Number(remaining) || 0;
  if (n <= 2) return true;
  const threshold = Number(getPlanSetting('low_credit_threshold')) || 0.2;
  // total 미제공 시 절대 잔여만 사용 (2회 이하)
  return n > 0 && n <= Math.max(2, Math.ceil(10 * threshold));
}

function productLabel(code) {
  const normalized = String(code || '').toLowerCase();
  if (normalized.includes('prime')) return '대표 노출';
  if (normalized.includes('pick')) return '추천 노출';
  if (normalized.includes('basic')) return '기본 노출';
  if (normalized.includes('memo')) return '쪽지권';
  return '이용 상품';
}

function renderLowCreditBanner(tickets) {
  if (!tickets) return '';
  const warns = [];
  if (isLowCredit(tickets.memo?.remaining)) {
    warns.push(`쪽지권 잔여 ${tickets.memo.remaining}회 — 재충전을 권장합니다`);
  }
  if (!warns.length) return '';
  return `
    <div class="mypage-info-box is-warn plans-low-credit" role="status">
      <strong>저잔량 안내</strong>
      <ul class="plans-tier-list">${warns.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
      <a href="#/plans/access" class="btn btn--secondary btn--sm" data-plans-nav="/plans/access">쪽지권 충전</a>
    </div>`;
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function roleLabel(role) {
  if (role === 'study_room') return '공부방';
  if (role === 'tutor') return '과외쌤';
  if (role === 'parent') return '학생';
  return '비로그인';
}

/** @param {import('./profiles.js').ProviderProfile | null} profile */
function renderProfileBanner(profile, role) {
  if (role === 'guest') {
    return `
      <div class="mypage-info-box plans-profile-banner">
        <strong>적용 대상</strong>
        <p>비로그인 · 상품 소개만 볼 수 있습니다. 구매는 공급자 로그인 후 진행합니다.</p>
        <a href="${AUTH_UI_BASE}/#/login" class="btn btn--primary btn--sm" data-same-tab-href="${AUTH_UI_BASE}/#/login">로그인</a>
      </div>`;
  }
  if (role === 'parent') {
    return `
      <div class="mypage-info-box plans-profile-banner">
        <strong>적용 대상</strong>
        <p>학생 계정은 유료상품 구매 주체가 아닙니다. FAQ에서 안내만 확인하세요.</p>
        <a href="#/support/faq" class="btn btn--secondary btn--sm" data-nav="/support/faq">자주 묻는 질문</a>
      </div>`;
  }
  if (!profile) {
    const profiles = listProviderProfiles(role);
    if (!profiles.length) {
      return `
        <div class="mypage-info-box plans-profile-banner is-warn">
          <strong>적용 프로필</strong>
          <p>등록된 ${esc(roleLabel(role))} 프로필이 없습니다. 상세등록을 먼저 완료해 주세요.</p>
          <a href="#/mypage/registrations" class="btn btn--secondary btn--sm" data-nav="/mypage/registrations">내 등록으로</a>
        </div>`;
    }
    return `
      <div class="mypage-info-box plans-profile-banner">
        <strong>적용 프로필을 선택하세요</strong>
        <p class="mypage-muted">같은 역할의 프로필이 여러 개입니다. 적용할 프로필을 고른 뒤 상품을 선택합니다.</p>
        <ul class="plans-profile-pick">
          ${profiles
            .map(
              (p) => `
            <li>
              <a class="btn btn--secondary btn--sm" href="${buildPlansHref(window.location.hash.slice(1).split('?')[0] || '/plans', {
                provider_type: p.providerType,
                provider_id: p.id,
              })}" data-plans-nav-query>${esc(p.label)} · ${esc(p.status || '')}</a>
            </li>`,
            )
            .join('')}
        </ul>
      </div>`;
  }
  return `
    <div class="mypage-info-box plans-profile-banner is-active">
      <strong>적용 프로필</strong>
      <p><span class="plans-profile-name">${esc(profile.label)}</span>
        <span class="mypage-muted">· ${esc(roleLabel(profile.providerType))} · ${esc(profile.status || '')}</span>
      </p>
    </div>`;
}

/**
 * @param {import('./profiles.js').ProviderProfile} profile
 * @param {string} productCode
 * @param {'position'|'access'} [family]
 */
function getEligibility(profile, productCode, family = 'position') {
  /** @type {string[]} */
  const missing = [];
  let canBuy = true;

  if (family === 'access') {
    if (profile.providerType !== 'tutor' && profile.providerType !== 'study_room') {
      return { canBuy: false, missing: ['쪽지권은 공부방·과외쌤만 구매할 수 있습니다'] };
    }
    if (profile.providerType === 'tutor') {
      const tutor = getTutor(Number(profile.id));
      if (!tutor) {
        return { canBuy: false, missing: ['프로필을 찾을 수 없습니다'] };
      }
    } else {
      const room = getStudyRoom(Number(profile.id));
      if (!room) {
        return { canBuy: false, missing: ['프로필을 찾을 수 없습니다'] };
      }
    }
    return { canBuy: true, missing: [] };
  }

  if (profile.providerType === 'study_room') {
    const room = getStudyRoom(Number(profile.id));
    if (!room) {
      return { canBuy: false, missing: ['프로필을 찾을 수 없습니다'] };
    }
    const readiness = getRoomReadiness(room);
    if (room.profile_status !== 'published') {
      missing.push('공개(published) 상태가 필요합니다');
      canBuy = false;
    }
    if (productCode === 'prime') {
      if (!readiness.canPublish) {
        missing.push(...(readiness.missing || ['상세등록 완료가 필요합니다']));
        canBuy = false;
      }
      if (room.detail_completion_status !== 'expanded_complete') {
        missing.push('상세소개(확장 완료)가 필요합니다');
        canBuy = false;
      }
    }
    if (productCode === 'pick') {
      if (room.detail_completion_status !== 'expanded_complete') {
        missing.push('상세등록 완료 후 구매할 수 있습니다');
        canBuy = false;
      }
      if (!readiness.canPublish) {
        missing.push(...(readiness.missing || ['상세등록·품질 항목이 부족합니다']));
        canBuy = false;
      }
    }
  } else {
    const tutor = getTutor(Number(profile.id));
    if (!tutor) {
      return { canBuy: false, missing: ['프로필을 찾을 수 없습니다'] };
    }
    const readiness = getTutorReadiness(tutor);
    if (tutor.profile_status !== 'published') {
      missing.push('공개(published) 상태가 필요합니다');
      canBuy = false;
    }
    if (productCode === 'prime' || productCode === 'pick') {
      if (!readiness.canPublish) {
        missing.push(...(readiness.missing || ['상세등록 완료가 필요합니다']));
        canBuy = false;
      }
    }
  }

  return { canBuy, missing: [...new Set(missing)] };
}

/**
 * @param {object} product
 * @param {import('./profiles.js').ProviderProfile | null} profile
 * @param {string} role
 * @param {{ prime?: object, pick?: object } | null} [slots]
 * @param {{ layout?: 'store'|'compact', primaryCta?: boolean }} [opts]
 */
function renderPositionCard(product, profile, role, slots = null, opts = {}) {
  const layout = opts.layout || 'store';
  const canPurchaseUi = role === 'study_room' || role === 'tutor';
  const implemented = product.implemented !== false && product.family === 'position';
  const inv = resolveSlotInventory(slots);
  const slot = getSlotForProduct(product.productCode, inv);
  const soldOut = slot != null && slot.remaining <= 0;
  const price = formatCardPrice(product);
  const isPrime = product.productCode === 'prime';
  const primaryCta = opts.primaryCta ?? isPrime;

  if (!implemented) {
    return `
      <li class="plans-card plans-catalog__item is-placeholder">
        <div class="plans-card__body">
          <h3 class="plans-card__name">${esc(product.name)}</h3>
          <p class="plans-card__tagline">${esc(product.tagline)}</p>
          <button type="button" class="btn btn--secondary" disabled>준비중</button>
        </div>
      </li>`;
  }

  const options = product.options || [];
  const eligibility = profile
    ? getEligibility(profile, product.productCode)
    : { canBuy: false, missing: ['적용 프로필을 먼저 선택하세요'] };
  if (soldOut) {
    eligibility.canBuy = false;
    eligibility.missing = [...eligibility.missing, '슬롯이 마감되었습니다 (대기열은 후속)'];
  }
  const missingHtml =
    canPurchaseUi && eligibility.missing.length
      ? `<ul class="plans-eligibility">${eligibility.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`
      : '';

  const slotHtml = slot
    ? `<p class="plans-slot-meta">슬롯 ${slot.used}/${slot.capacity} · 잔여 <strong>${slot.remaining}</strong>${soldOut ? ' · <span class="plans-remain--low">마감</span>' : ''}</p>`
    : '';

  const optionSelect = `
    <label class="plans-card__pick">
      <span class="plans-card__pick-label">기간 선택</span>
      <select data-plans-option="${esc(product.productCode)}" class="student-form__select" ${soldOut ? 'disabled' : ''}>
        ${options
          .map((o, i) => {
            const amt = resolveCheckoutAmount(o.priceKrw);
            const priceNote = amt.testMode
              ? `${formatKrw(o.priceKrw)} (테스트 ${formatKrw(amt.chargeKrw)})`
              : formatKrw(o.priceKrw);
            const extras = [o.marketingBadge, o.discountLabel, o.bundleNote].filter(Boolean).join(' · ');
            return `<option value="${esc(o.optionId)}"${i === 0 ? ' selected' : ''}>${esc(o.label)} · ${esc(priceNote)}${extras ? ` · ${esc(extras)}` : ''}</option>`;
          })
          .join('')}
      </select>
    </label>`;

  const buyDisabled = !canPurchaseUi || !profile || !eligibility.canBuy || soldOut;
  const ctaClass = primaryCta ? 'btn btn--primary plans-card__cta' : 'btn btn--secondary plans-card__cta';
  const buyBtn = canPurchaseUi
    ? soldOut
      ? `<button type="button" class="btn btn--secondary plans-card__cta" disabled>슬롯 마감</button>`
      : `<button type="button" class="${ctaClass}" data-plans-buy
         data-product-code="${esc(product.productCode)}"
         ${buyDisabled ? 'disabled' : ''}
         title="${buyDisabled ? '구매 조건을 확인하세요' : '결제로 이동'}">상품 구매하기 →</button>`
    : `<a href="${AUTH_UI_BASE}/#/login" class="btn btn--secondary plans-card__cta" data-same-tab-href="${AUTH_UI_BASE}/#/login">로그인 후 구매</a>`;

  const badge = product.cardBadge
    ? `<span class="plans-card__badge">${esc(product.cardBadge)}</span>`
    : isPrime
      ? `<span class="plans-card__badge">BEST</span>`
      : product.productCode === 'pick'
        ? `<span class="plans-card__badge plans-card__badge--pop">POPULAR</span>`
        : '';

  const media =
    layout === 'store'
      ? `<div class="plans-card__media ${productMediaClass(product.productCode)}" aria-hidden="true">${badge}<span class="plans-card__media-ico">${productIcon(product.productCode)}</span></div>`
      : `<div class="plans-card__icon ${productMediaClass(product.productCode)}" aria-hidden="true">${badge || ''}<span>${productIcon(product.productCode)}</span></div>`;

  return `
    <li class="plans-card plans-card--${layout} plans-catalog__item${product.featured ? ' is-featured' : ''}${soldOut ? ' is-soldout' : ''}${primaryCta ? ' is-primary' : ''}">
      ${media}
      <div class="plans-card__body">
        <h3 class="plans-card__name">${esc(product.name)}</h3>
        <p class="plans-card__hook">${esc(product.tagline)}</p>
        ${slotHtml}
        <ul class="plans-card__checks">
          ${[...(product.bullets || []), role === 'tutor' && product.family === 'position' ? '구매 완료 시 쪽지권이 함께 지급됩니다' : '']
            .filter(Boolean)
            .map((b) => `<li>${esc(b)}</li>`)
            .join('')}
        </ul>
        <div class="plans-card__price-row">
          <span class="plans-card__price">${esc(price.display)}</span>
          <span class="plans-card__unit">${esc(price.unit)}</span>
          <span class="plans-card__vat">${esc(price.note)}</span>
        </div>
        ${optionSelect}
        ${missingHtml}
        ${buyBtn}
      </div>
    </li>`;
}

/**
 * @param {object} product
 * @param {import('./profiles.js').ProviderProfile | null} profile
 * @param {string} role
 * @param {{ memo?: number }} remaining
 * @param {{ primaryCta?: boolean }} [opts]
 */
function renderAccessCard(product, profile, role, remaining = {}, opts = {}) {
  const isProvider = role === 'tutor' || role === 'study_room';
  const options = product.options || [];
  const price = formatCardPrice(product);
  const primaryCta = opts.primaryCta ?? product.productCode === 'memo_ticket';
  const activePaidPack = opts.activePaidPack || null;
  const eligibility = profile
    ? getEligibility(profile, product.productCode, 'access')
    : { canBuy: false, missing: ['적용 프로필을 먼저 선택하세요'] };

  const remainHtml = '';

  const missingHtml =
    isProvider && eligibility.missing.length
      ? `<ul class="plans-eligibility">${eligibility.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`
      : '';

  const optionSelect = `
    <label class="plans-card__pick">
      <span class="plans-card__pick-label">팩 선택</span>
      <select data-plans-option="${esc(product.productCode)}" class="student-form__select">
        ${options
          .map((o, i) => {
            const amt = resolveCheckoutAmount(o.priceKrw);
            const priceNote = amt.testMode
              ? `${formatKrw(o.priceKrw)} (시험 결제 ${formatKrw(amt.chargeKrw)})`
              : formatKrw(o.priceKrw);
            const extras = [o.marketingBadge, o.discountLabel].filter(Boolean).join(' · ');
            const isImmediate = o.apiVariant === '1회' || o.label === '1회';
            const packLocked = !!activePaidPack && !isImmediate;
            return `<option value="${esc(o.optionId)}"${packLocked ? ' disabled' : ''}${!packLocked && i === 0 ? ' selected' : ''}${isImmediate && activePaidPack ? ' selected' : ''}>${esc(o.label)} · ${esc(priceNote)}${extras ? ` · ${esc(extras)}` : ''}</option>`;
          })
          .join('')}
      </select>
    </label>`;

  const buyDisabled = !isProvider || !profile || !eligibility.canBuy;
  const ctaClass = primaryCta ? 'btn btn--primary plans-card__cta' : 'btn btn--secondary plans-card__cta';
  const buyBtn = isProvider
    ? `<button type="button" class="${ctaClass}" data-plans-buy
         data-product-code="${esc(product.productCode)}"
         ${buyDisabled ? 'disabled' : ''}>지금 바로 이용하기 →</button>`
    : role === 'guest'
      ? `<a href="${AUTH_UI_BASE}/#/login" class="btn btn--secondary plans-card__cta" data-same-tab-href="${AUTH_UI_BASE}/#/login">로그인 후 구매</a>`
      : `<button type="button" class="btn btn--secondary plans-card__cta" disabled>구매 불가</button>`;

  return `
    <li class="plans-card plans-card--access plans-catalog__item${product.featured ? ' is-featured' : ''}${primaryCta ? ' is-primary' : ''}">
      <div class="plans-card__icon ${productMediaClass(product.productCode)}" aria-hidden="true"><span>${productIcon(product.productCode)}</span></div>
      <div class="plans-card__body">
        <h3 class="plans-card__name">${esc(product.name)}</h3>
        <p class="plans-card__hook">${esc(product.tagline)}</p>
        ${remainHtml}
        <div class="plans-card__price-row">
          <span class="plans-card__price">${esc(price.display)}</span>
          <span class="plans-card__unit">${esc(price.unit)}</span>
          <span class="plans-card__vat">${esc(price.note)}</span>
        </div>
        <p class="plans-card__benefits-label">주요 제공 혜택</p>
        <ul class="plans-card__checks">
          ${(product.bullets || []).map((b) => `<li>${esc(b)}</li>`).join('')}
        </ul>
        ${optionSelect}
        ${missingHtml}
        ${buyBtn}
      </div>
    </li>`;
}

function renderTestModeToggle() {
  const on = isPlansTestMode();
  return `
    <label class="plans-test-mode">
      <input type="checkbox" data-plans-test-mode ${on ? 'checked' : ''} />
      <span>시험 결제 사용 (결제 ${formatKrw(getPlanRuntimeSettings().test_amount_krw)})</span>
    </label>`;
}

/** P18-01 상품홈 */
export function renderPlansHome() {
  const role = getPlansEffectiveRole();
  const query = parsePlansQuery();
  const profile = resolveSelectedProfile(query, role);
  const tier = previewState.providerSubscription;
  const tierCopy = tier === 'paid' ? PAID_TIER_COPY : FREE_TIER_COPY;
  const ops = getPaidOperationalStatus();
  const positions = ops?.exposure?.positions ?? [];
  const slots = ops?.slots ?? null;
  const providerKey = role === 'tutor' ? 'tutor' : 'study_room';
  const positionProducts = getCatalogByFamily('position', providerKey);
  const accessProducts = getCatalogByFamily('access', providerKey);
  const tickets = ops?.tickets;
  const remaining = {
    memo: tickets?.memo?.remaining,
  };

  return `
    <section class="mypage-panel plans-store">
      <div class="plans-hero-row">
        ${renderPlansHero({
          title: '더 많은 학생과 만나는 가장 확실한 방법',
          lead: '가게 품질은 무료로, 홍보·획득은 필요할 때만 단건으로. 자동연장 없이 기간형·횟수권만 구매합니다.',
          chips: [
            { label: '노출상품', href: '/plans/positions' },
            { label: '쪽지권', href: '/plans/access' },
            { label: role === 'study_room' ? '공부방' : role === 'tutor' ? '과외쌤' : '소개 보기', active: true },
          ],
        })}
        ${renderGuideBox({
          title: '안전 결제 안내',
          icon: '🛡',
          variant: 'guide',
          items: [
            { icon: '🔒', text: '단건 결제 · 자동연장 없음 · 만료 시 기본 노출로 복귀' },
            { icon: '💳', text: '학부모 과금 없음 · 공급자만 구매 · 시험 결제 모드 제공' },
          ],
          linkLabel: '이용 가이드 및 환불 규정 확인',
          linkNav: '/support/faq',
        })}
      </div>

      ${renderProviderNoticeBanners()}
      ${renderProfileBanner(profile, role)}
      ${role === 'study_room' || role === 'tutor' ? renderTestModeToggle() : ''}

      <div class="plans-status-strip">
        <div class="plans-status-strip__box">
          <strong>${esc(tierCopy.title)}</strong>
          <ul class="plans-tier-list">${tierCopy.items.slice(0, 3).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
        <div class="plans-status-strip__box">
          <strong>이용중 요약</strong>
          ${
            positions.length
              ? `<ul class="plans-tier-list">${positions
                  .map((p) => `<li><strong>${esc(productLabel(p.sku))}</strong> · ${p.days_left}일 남음</li>`)
                  .join('')}</ul>`
              : `<p class="mypage-muted">${esc(P18_EXPOSURE_STATUS.basic)}</p>`
          }
          <div class="mypage-actions-row">
            <a href="#/mypage/plans/my" class="btn btn--secondary btn--sm" data-nav="/mypage/plans/my">내 상품</a>
            <a href="#/mypage/plans/history" class="btn btn--secondary btn--sm" data-nav="/mypage/plans/history">결제내역</a>
          </div>
        </div>
      </div>

      <section class="plans-section">
        <div class="plans-section__head">
          <h3 class="plans-section__title"><span class="plans-section__ico" aria-hidden="true">📢</span> 노출 극대화 상품</h3>
          <p class="plans-section__lead">대표·추천 노출은 기간형 단건 결제입니다. 기본 목록을 위로 올리는 별도 상품은 없습니다.</p>
        </div>
        <ul class="plans-card-grid plans-card-grid--2">
          ${positionProducts
            .map((p, i) => renderPositionCard(p, profile, role, slots, { layout: 'compact', primaryCta: i === 0 }))
            .join('')}
        </ul>
        <div class="plans-tip">
          <span class="plans-tip__ico" aria-hidden="true">💡</span>
          <p>알고 계셨나요? Hot·단과(공부방)·쪽집게·SKY(과외쌤)는 대표·추천 노출 이용 기간에 함께 적용됩니다. New는 신규 1주 자동배지이며, 추천·후기는 통계입니다. (단독 핵심상품 ✕)</p>
        </div>
      </section>

      <section class="plans-section">
        <div class="plans-section__head">
          <h3 class="plans-section__title"><span class="plans-section__ico" aria-hidden="true">🔗</span> 쪽지권</h3>
          <p class="plans-section__lead">학생에게 먼저 보내는 쪽지만 횟수권입니다. 학부모가 먼저 보낸 쪽지와 답장은 무료입니다.</p>
        </div>
        <ul class="plans-card-grid plans-card-grid--2">
          ${accessProducts
            .map((p, i) => renderAccessCard(p, profile, role, remaining, { primaryCta: i === 0 }))
            .join('')}
        </ul>
      </section>

      ${renderFreePaidCompare()}

      ${renderPlansCtaBanner({
        title: '상품 구매에 대해 궁금한 점이 있으신가요?',
        lead: '자주 묻는 질문에서 노출·쪽지권·환불 안내를 확인하세요.',
        secondary: { label: '자주 묻는 질문', href: '/support/faq', nav: true },
        primary: { label: '1:1 문의하기', href: '/support/contact', nav: true },
      })}

      <div class="mypage-info-box plans-renewal-box">
        <strong>${esc(P18_RENEWAL_COPY.title)}</strong>
        <ul class="plans-tier-list">${P18_RENEWAL_COPY.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>
      <p class="mypage-muted plans-settings-hint">${esc(P18_HEADLINE)} · 현재 역할 <strong>${esc(roleLabel(role))}</strong></p>
    </section>`;
}

/** P18-02 노출상품 */
export function renderPlansPositions() {
  const role = getPlansEffectiveRole();
  const query = parsePlansQuery();
  const profile = resolveSelectedProfile(query, role);
  const providerKey = role === 'tutor' ? 'tutor' : 'study_room';
  const products = getCatalogByFamily('position', providerKey);
  const ops = getPaidOperationalStatus();
  const slots = ops?.slots ?? null;
  const inv = resolveSlotInventory(slots);
  const settings = getPlanRuntimeSettings();
  const scopeLabel = settings.region_scope_type === 'complex' ? '단지' : '행정동';

  return `
    <section class="mypage-panel plans-store">
      <div class="plans-hero-row">
        ${renderPlansHero({
          title: '동네 상단에서 학생에게 먼저 보이세요',
          lead: '대표 노출은 한정 슬롯, 추천 노출은 세트·순환형입니다. 기간이 끝나면 기본 노출로 돌아갑니다.',
        })}
        ${renderGuideBox({
          title: `대표 노출 자리 · ${scopeLabel} 단위`,
          icon: '📍',
          variant: 'slot',
          items: [
            { icon: '①', text: `대표 노출 ${inv.prime.used}/${inv.prime.capacity} (남은 자리 ${inv.prime.remaining})` },
            { icon: '②', text: `추천 노출 ${inv.pick.used}/${inv.pick.capacity} (남은 자리 ${inv.pick.remaining})` },
            {
              icon: '③',
              text: `공부방 대표 ${settings.prime_slots}자리 · 추천 ${settings.pick_set_size}개/${settings.pick_rotation_minutes}분 순환`,
            },
          ],
        })}
      </div>

      ${renderProfileBanner(profile, role)}
      ${role === 'study_room' || role === 'tutor' ? renderTestModeToggle() : ''}

      <ul class="plans-card-grid plans-card-grid--2 plans-card-grid--store">
        ${products
          .map((p, i) => renderPositionCard(p, profile, role, slots, { layout: 'store', primaryCta: i === 0 }))
          .join('')}
      </ul>

      ${renderFeatureHighlights([
        { icon: '🚀', title: '즉시 노출 시작', body: '결제 완료 후 적용 조건이 맞으면 노출이 시작됩니다.' },
        { icon: '⏱', title: '기간형 단건', body: '자동연장 없음 · 만료 전 안내 후 같은 조건으로 연장할 수 있습니다.' },
        { icon: '📍', title: '지역 단위 선점', body: `${scopeLabel} 기준 한정 자리 · 빈 슬롯은 홍보카드로 유지됩니다.` },
      ])}

      <div class="plans-guide plans-guide--detail">
        <div class="plans-guide__head">
          <span class="plans-guide__head-ico" aria-hidden="true">ℹ</span>
          <strong class="plans-guide__title">노출 상품 이용 안내</strong>
        </div>
        <div class="plans-guide__cols">
          <div>
            <h4>적용 시점</h4>
            <p>공개(published) 프로필 · 대표 노출은 상세소개 완료 후 구매할 수 있습니다.</p>
          </div>
          <div>
            <h4>노출 기준</h4>
            <p>기본 노출을 위로 올리는 별도 상품은 없습니다. 상위 노출은 대표·추천만 해당합니다.</p>
          </div>
        </div>
      </div>

      ${renderPlansFaqList([
        { q: '대표 노출과 추천 노출의 차이는 무엇인가요?' },
        { q: '기간이 끝나면 프로필이 사라지나요?' },
        { q: '광고 배지는 따로 구매하나요?' },
      ])}

      ${renderBadgeAddonSection(role, ops)}

      ${renderPlansCtaBanner({
        title: '맞춤형 노출 상담이 필요하신가요?',
        lead: '슬롯·시즌·역할별 안내는 고객센터에서 확인할 수 있습니다.',
        secondary: { label: '1:1 문의', href: '/support/contact', nav: true },
        primary: { label: '자주 묻는 질문', href: '/support/faq', nav: true },
      })}
    </section>`;
}

/** P18-03 쪽지권 */
export function renderPlansAccess() {
  const role = getPlansEffectiveRole();
  const query = parsePlansQuery();
  const profile = role === 'tutor' || role === 'study_room' ? resolveSelectedProfile(query, role) : null;
  const providerKey = role === 'tutor' ? 'tutor' : 'study_room';
  const products = getCatalogByFamily('access', providerKey);
  const ops = getPaidOperationalStatus();
  const tickets = ops?.tickets;
  const remaining = {
    memo: tickets?.memo?.remaining,
  };
  const packs = tickets?.memo?.packs ?? ops?.memo_packs ?? [];
  const activePaidPack = profile
    ? packs.find(
        (p) =>
          p.provider_type === providerKey &&
          String(p.provider_id) === String(profile.id) &&
          (p.grant_kind === 'payment_pack' || p.grant_kind === 'payment') &&
          p.status === '사용 중' &&
          (Number(p.granted_count) === 5 || Number(p.granted_count) === 10),
      )
    : null;

  return `
    <section class="mypage-panel plans-store">
      <div class="plans-hero-row">
        ${renderPlansHero({
          title: '학생에게 먼저 연락할 때 쓰는 쪽지권',
          lead: '공급자→학생 선제 쪽지만 횟수권입니다. 요청문 열람과 학부모 선연락·답장은 항상 무료입니다.',
          chips: [{ label: '쪽지권 1·5·10회', active: true }],
        })}
        ${renderGuideBox({
          title: '안전 매칭 정책',
          icon: '🛡',
          variant: 'policy',
          items: [
            { icon: '✓', text: '학부모→공급자 선연락·답장은 무료' },
            { icon: '✓', text: '요청문·특이사항은 로그인 공급자 무료 열람' },
            { icon: '✓', text: '5·10회권은 결제 성공부터 120일 · 프로필당 활성 묶음권 1개' },
            { icon: '✓', text: '에스크로·매칭 보장 연출 없음' },
          ],
          linkLabel: '이용권 가이드 자세히 보기',
          linkNav: '/support/faq',
        })}
      </div>

      ${role === 'tutor' || role === 'study_room' ? renderProfileBanner(profile, role) : ''}
      ${role === 'guest' || role === 'parent' ? renderProfileBanner(null, role) : ''}
      ${role === 'tutor' || role === 'study_room' ? renderTestModeToggle() : ''}
      ${role === 'tutor' || role === 'study_room' ? renderLowCreditBanner(tickets) : ''}
      ${
        activePaidPack
          ? `<p class="mypage-info-box">이 프로필에는 이미 사용 중인 유료 묶음권이 있어 5회권·10회권은 새로 살 수 없습니다. 1회 즉시권은 계속 이용할 수 있습니다.</p>`
          : ''
      }

      <section class="plans-section">
        <div class="plans-section__head">
          <h3 class="plans-section__title">쪽지권 팩</h3>
        </div>
        <ul class="plans-card-grid plans-card-grid--2">
          ${products
            .map((p, i) => renderAccessCard(p, profile, role, remaining, { primaryCta: i === 0, activePaidPack }))
            .join('')}
        </ul>
      </section>

      <div class="plans-access-lower">
        <div class="plans-access-lower__side">
          ${renderGuideBox({
            title: '관련 가이드',
            icon: '📘',
            variant: 'guide',
            items: [
              { icon: '→', text: '쪽지함에서 콜드 메모 게이트 확인' },
              { icon: '→', text: '요청문은 공급자 로그인 후 무료' },
              { icon: '→', text: '저잔량·소진 시 충전 경로' },
            ],
            linkLabel: '고객센터로 이동',
            linkNav: '/support/faq',
          })}
          <div class="plans-stat-box">
            <strong>바로가기</strong>
            <p class="mypage-muted" style="margin:8px 0 0">
              <a href="#/plans/my" data-plans-nav="/plans/my">내 쪽지권 보기</a>
              · <a href="#/mypage/messages" data-nav="/mypage/messages">쪽지함 보기</a>
            </p>
          </div>
        </div>
        ${renderAccessCompare()}
      </div>

      ${renderPlansCtaBanner({
        title: '대량·기관 이용이 필요하신가요?',
        lead: '현재는 단건 횟수권만 제공합니다. 문의는 고객센터로 남겨 주세요.',
        secondary: { label: '자주 묻는 질문', href: '/support/faq', nav: true },
        primary: { label: '1:1 문의하기', href: '/support/contact', nav: true },
      })}
    </section>`;
}

/** P18-04 내 상품 */
export function renderPlansMy() {
  const role = getPlansEffectiveRole();
  if (role === 'parent' || role === 'guest') {
    return `
      <section class="mypage-panel">
        <p class="mypage-lead">내 상품</p>
        ${renderProfileBanner(null, role)}
      </section>`;
  }

  const ops = getPaidOperationalStatus();
  const exposure = ops?.exposure;
  const tickets = ops?.tickets;
  const metrics = getRoiMetrics();
  const positions = exposure?.positions ?? [];

  return `
    <section class="mypage-panel">
      <p class="mypage-lead">내 상품 이용 현황</p>
      ${renderProviderNoticeBanners()}
      ${role === 'tutor' || role === 'study_room' ? renderLowCreditBanner(tickets) : ''}
      <h2 class="mypage-subhead">이용중 포지션</h2>
      ${
        positions.length
          ? `<table class="plans-table" aria-label="이용중 상품">
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
      }
      <h2 class="mypage-subhead">쪽지권</h2>
      ${
        (tickets?.memo?.packs ?? []).length
          ? `<table class="plans-table" aria-label="쪽지권">
              <thead><tr><th>프로필</th><th>상품</th><th>출처</th><th>부여</th><th>남은 횟수</th><th>부여일</th><th>사용기한</th><th>상태</th></tr></thead>
              <tbody>
                ${(tickets.memo.packs)
                  .map(
                    (p) => `
                  <tr>
                    <td>${esc(p.provider_type || '미확인')} #${esc(String(p.provider_id ?? ''))}</td>
                    <td>${esc(p.product_name || '')}</td>
                    <td>${esc(p.grant_label || '')}</td>
                    <td>${p.granted_count ?? '—'}</td>
                    <td>${p.remaining ?? '—'}</td>
                    <td>${esc(String(p.purchased_at || '').slice(0, 10))}</td>
                    <td>${esc(String(p.expires_at || '').slice(0, 10))}</td>
                    <td>${esc(p.status || '')}</td>
                  </tr>`,
                  )
                  .join('')}
              </tbody>
            </table>
            <p class="mypage-muted"><a href="#/plans/access" data-plans-nav="/plans/access">쪽지권 충전하기</a></p>`
          : tickets
          ? `<div class="mypage-stats roi-metrics">
              <div class="mypage-stat${isLowCredit(tickets.memo.remaining) ? ' is-warn' : ''}"><span>${esc(tickets.memo.label)}</span><strong>${tickets.memo.remaining}</strong></div>
            </div>
            <p class="mypage-muted"><a href="#/plans/access" data-plans-nav="/plans/access">쪽지권 충전하기</a></p>`
          : `<p class="mypage-muted">이용권 정보를 불러오면 표시됩니다. · <a href="#/plans/access" data-plans-nav="/plans/access">쪽지권</a></p>`
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
        <a href="#/mypage/plans/history" class="btn btn--secondary" data-nav="/mypage/plans/history">결제내역</a>
        <a href="#/mypage/plans" class="btn btn--secondary" data-nav="/mypage/plans">이용 현황</a>
      </div>
    </section>`;
}

/** P18-05 결제내역 */
export function renderPlansHistory() {
  const role = getPlansEffectiveRole();
  if (role === 'parent' || role === 'guest') {
    return `
      <section class="mypage-panel">
        <p class="mypage-lead">결제내역</p>
        ${renderProfileBanner(null, role)}
      </section>`;
  }

  const rows = historyCache.loaded ? historyCache.rows : getHistoryRows();
  const sourceNote = historyCache.loaded
    ? historyCache.fromApi
      ? '서버 주문 내역과 이 기기의 임시 내역을 함께 표시'
      : '서버 연결 전 · 이 기기의 임시 내역'
    : '불러오는 중…';
  const receiptRow = openReceiptOrderRef
    ? rows.find((r) => r.orderRef === openReceiptOrderRef) || null
    : null;

  return `
    <section class="mypage-panel">
      <p class="mypage-lead">결제내역</p>
      <p class="mypage-muted">${esc(sourceNote)}</p>
      <div class="plans-history-layout">
      <table class="plans-table" aria-label="결제내역">
        <thead>
          <tr>
            <th>주문번호</th>
            <th>상품</th>
            <th>프로필</th>
            <th>금액</th>
            <th>수단</th>
            <th>일시</th>
            <th>상태</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${
            rows.length
              ? rows
                  .map(
                    (r) => `
            <tr>
              <td><code>${esc(r.orderRef)}</code></td>
              <td>${esc(r.productName)}</td>
              <td>${esc(r.providerLabel)}</td>
              <td>${formatKrw(r.amountKrw)}</td>
              <td>${esc(paymentMethodLabel(r.paymentMethod))}</td>
              <td>${esc(String(r.paidAt).slice(0, 16).replace('T', ' '))}</td>
              <td>${esc(orderStatusLabel(r.status))}</td>
              <td><button type="button" class="btn btn--secondary btn--sm" data-plans-receipt-open="${esc(r.orderRef)}">상세</button></td>
            </tr>`,
                  )
                  .join('')
              : `<tr><td colspan="8" class="mypage-muted">내역이 없습니다.</td></tr>`
          }
        </tbody>
      </table>
      ${receiptRow ? renderReceiptPanel(receiptRow) : ''}
      </div>
    </section>`;
}

/** P18-06 checkout */
export function renderPlansCheckout() {
  const draft = getCheckoutDraft();
  const role = getPlansEffectiveRole();
  if (!draft) {
    return `
      <section class="mypage-panel">
        <p class="mypage-lead">결제</p>
        <div class="mypage-info-box is-warn">
          <p>결제할 상품이 없습니다. 노출상품에서 다시 선택해 주세요.</p>
          <a href="#/plans/positions" class="btn btn--primary" data-plans-nav="/plans/positions">노출상품으로</a>
        </div>
      </section>`;
  }

  if (role !== 'study_room' && role !== 'tutor') {
    return `
      <section class="mypage-panel">
        <p class="mypage-lead">결제</p>
        ${renderProfileBanner(null, role)}
      </section>`;
  }

  const amt = resolveCheckoutAmount(draft.priceKrw);
  const methods = getPlanRuntimeSettings().payment_methods;

  return `
    <section class="mypage-panel plans-checkout">
      <p class="mypage-lead">결제</p>
      <ol class="plans-checkout-steps">
        <li class="is-done"><strong>1. 적용 프로필</strong>
          <p>${esc(draft.providerLabel)} · ${esc(roleLabel(draft.providerType))}</p>
        </li>
        <li class="is-done"><strong>2. 상품 옵션</strong>
          <p>${esc(draft.productName)} · ${esc(draft.optionLabel)}</p>
        </li>
        ${
          draft.apiVariant === '1회'
            ? `<li class="is-done"><strong>즉시 발송</strong>
          <p class="mypage-muted">1회 즉시권은 수신 학생과 첫 쪽지 본문이 필요합니다. 대상이 없으면 구매할 수 없습니다.</p>
          <label class="plans-card__pick"><span class="plans-card__pick-label">학생 ID</span>
            <input type="number" data-plans-immediate-student min="1" value="${esc(String(draft.studentId || ''))}" class="student-form__select" /></label>
          <label class="plans-card__pick"><span class="plans-card__pick-label">첫 쪽지</span>
            <textarea data-plans-immediate-body class="student-form__select" rows="3">${esc(draft.body || '')}</textarea></label>
        </li>`
            : ''
        }
        <li class="is-done"><strong>3. 금액 확인</strong>
          <p>표시가 ${formatKrw(amt.displayKrw)}
            ${amt.testMode ? ` · <em>테스트 결제 ${formatKrw(amt.chargeKrw)}</em>` : ''}</p>
        </li>
        <li>
          <strong>4. 약관 동의</strong>
          <label class="plans-check">
            <input type="checkbox" data-plans-agree />
            <span>유료상품 이용약관 및 환불 안내를 확인했습니다.</span>
          </label>
        </li>
        <li>
          <strong>5. 결제수단</strong>
          <div class="plans-pay-methods">
            ${(methods || [])
              .map(
                (m, i) => `
              <label class="plans-check">
                <input type="radio" name="plans_pay_method" value="${esc(m)}" ${i === 0 ? 'checked' : ''} />
                <span>${esc(paymentMethodLabel(m))}</span>
              </label>`,
              )
              .join('')}
          </div>
        </li>
        <li>
          <strong>6. 결제 진행</strong>
          <p class="mypage-muted">현재는 시험 결제 화면이며 실제 결제 연동은 준비 중입니다.</p>
          <div class="mypage-actions-row">
            <button type="button" class="btn btn--primary" data-plans-pay>결제하기</button>
            <a href="#/plans/positions" class="btn btn--secondary" data-plans-nav="/plans/positions">취소</a>
          </div>
          <p class="plans-checkout-error mypage-muted" data-plans-checkout-error hidden></p>
        </li>
      </ol>
    </section>`;
}

/** P18-07 result */
export function renderPlansResult() {
  const result = getCheckoutResult();
  if (!result) {
    return `
      <section class="mypage-panel">
        <p class="mypage-lead">결제 결과</p>
        <div class="mypage-info-box">
          <p>표시할 결과가 없습니다.</p>
          <a href="#/plans" class="btn btn--secondary" data-plans-nav="/plans">상품홈</a>
        </div>
      </section>`;
  }

  const ok = result.status === 'success';
  const backOp =
    result.providerType === 'tutor'
      ? `#/mypage/registrations/tutors/${result.providerId || ''}/exposure`
      : `#/mypage/registrations/study-rooms/${result.providerId || ''}/inquiries`;

  return `
    <section class="mypage-panel">
      <p class="mypage-lead">${ok ? '결제 완료' : '결제 미완료'}</p>
      <div class="mypage-info-box ${ok ? '' : 'is-warn'}">
        <p><strong>${esc(orderStatusLabel(result.status === 'success' ? 'paid' : result.status))}</strong></p>
        ${result.orderRef ? `<p>주문번호 <code>${esc(result.orderRef)}</code></p>` : ''}
        ${result.productName ? `<p>${esc(result.productName)}${result.optionLabel ? ` · ${esc(result.optionLabel)}` : ''}</p>` : ''}
        ${result.providerLabel ? `<p>적용 프로필: ${esc(result.providerLabel)}</p>` : ''}
        ${result.chargeKrw != null ? `<p>결제금액 ${formatKrw(result.chargeKrw)}</p>` : ''}
        ${result.memoBundleGranted > 0 ? `<p>쪽지권 ${result.memoBundleGranted}회가 함께 지급되었습니다. (180일)</p>` : ''}
        ${result.message ? `<p class="mypage-muted">${esc(result.message)}</p>` : ''}
      </div>
      <div class="mypage-actions-row">
        <a href="#/mypage/plans/my" class="btn btn--primary" data-nav="/mypage/plans/my">내 상품 보기</a>
        ${ok ? `<a href="${backOp}" class="btn btn--secondary" data-nav="${backOp.slice(1)}">운영 화면으로</a>` : ''}
        ${!ok ? `<a href="#/plans/checkout" class="btn btn--secondary" data-plans-nav="/plans/checkout">다시 결제</a>` : ''}
        <a href="#/plans" class="btn btn--secondary" data-plans-nav="/plans">상품센터</a>
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
  if ((path === '/plans/history' || path.endsWith('/history')) && !historyCache.loaded) {
    loadHistoryRows().then((result) => {
      historyCache = { rows: result.rows, fromApi: result.fromApi, loaded: true };
      rerender();
    });
  }

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

  root.querySelectorAll('[data-plans-buy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const productCode = btn.getAttribute('data-product-code') || '';
      const itemEl = btn.closest('.plans-catalog__item');
      const select = itemEl?.querySelector('[data-plans-option]');
      const optionId = select instanceof HTMLSelectElement ? select.value : '';
      const product = getProductConfig(productCode, role);
      const option = getPriceOption(productCode, optionId, role);
      const role = getPlansEffectiveRole();
      const query = parsePlansQuery();
      const profile = resolveSelectedProfile(query, role);
      if (!product || !option || !profile) return;

      setCheckoutDraft({
        productCode,
        optionId,
        productName: product.name,
        optionLabel: option.label,
        apiVariant: option.apiVariant,
        priceKrw: option.priceKrw,
        providerType: profile.providerType,
        providerId: profile.id,
        providerLabel: profile.label,
        createdAt: Date.now(),
      });
      window.location.hash = '#/plans/checkout';
    });
  });

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
          throw new Error('상품 카탈로그가 준비되지 않았습니다. 새로고침 후 다시 시도해 주세요.');
        }
        const created = await createPaidCheckout(draft.productCode, draft.apiVariant, {
          providerType: draft.providerType,
          providerId: draft.providerId,
          studentId: Number(root.querySelector('[data-plans-immediate-student]')?.value || draft.studentId || 0),
          body: String(root.querySelector('[data-plans-immediate-body]')?.value || draft.body || ''),
        });
        const serverAmount = Number(created.amount_won ?? created.sale_price_krw);
        if (!Number.isFinite(serverAmount) || serverAmount <= 0) {
          throw new Error('서버 결제금액이 올바르지 않습니다.');
        }
        // 클라이언트 draft 금액과 달라도 서버 판매가를 사용한다
        if (Number(draft.priceKrw) !== serverAmount) {
          console.warn('[plans/checkout] client price ignored', draft.priceKrw, '→', serverAmount);
        }
        const completed = await completePaidCheckout(created.order_ref);
        await hydrateProviderStatus();
        await hydrateProviderNotices();

        appendHistoryRow({
          orderRef: completed.order_ref || created.order_ref,
          productName: `${draft.productName} · ${draft.optionLabel}`,
          providerLabel: draft.providerLabel,
          amountKrw: serverAmount,
          paymentMethod: method,
          paidAt: new Date().toISOString(),
          status: 'paid',
        });
        historyCache.loaded = false;

        setCheckoutResult({
          status: 'success',
          orderRef: completed.order_ref || created.order_ref,
          productName: draft.productName,
          optionLabel: draft.optionLabel,
          providerLabel: draft.providerLabel,
          providerType: draft.providerType,
          providerId: draft.providerId,
          chargeKrw: serverAmount,
          memoBundleGranted:
            Number(completed.memo_bundle_granted) || Number(created.memo_bundle) || 0,
        });
        clearCheckoutDraft();
        window.location.hash = '#/plans/result';
      } catch (err) {
        const msg = err instanceof Error ? err.message : '결제에 실패했습니다.';
        setCheckoutResult({
          status: 'failed',
          message: msg,
          productName: draft.productName,
          optionLabel: draft.optionLabel,
          providerLabel: draft.providerLabel,
          providerType: draft.providerType,
          providerId: draft.providerId,
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
