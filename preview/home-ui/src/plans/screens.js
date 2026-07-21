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
  if (normalized.includes('request')) return '요청문 열람권';
  return '이용 상품';
}

function renderLowCreditBanner(tickets) {
  if (!tickets) return '';
  const warns = [];
  if (isLowCredit(tickets.memo?.remaining)) {
    warns.push(`쪽지권 잔여 ${tickets.memo.remaining}회 — 재충전을 권장합니다`);
  }
  if (isLowCredit(tickets.request_view?.remaining)) {
    warns.push(`열람권 잔여 ${tickets.request_view.remaining}회 — 재충전을 권장합니다`);
  }
  if (!warns.length) return '';
  return `
    <div class="mypage-info-box is-warn plans-low-credit" role="status">
      <strong>저잔량 안내</strong>
      <ul class="plans-tier-list">${warns.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
      <a href="#/plans/access" class="btn btn--secondary btn--sm" data-plans-nav="/plans/access">접근권 충전</a>
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
    if (profile.providerType !== 'tutor') {
      return { canBuy: false, missing: ['접근권 상품은 과외쌤 전용입니다'] };
    }
    const tutor = getTutor(Number(profile.id));
    if (!tutor) {
      return { canBuy: false, missing: ['프로필을 찾을 수 없습니다'] };
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

/** @param {object} product @param {import('./profiles.js').ProviderProfile | null} profile @param {string} role @param {{ prime?: object, pick?: object } | null} [slots] */
function renderPositionCard(product, profile, role, slots = null) {
  const canPurchaseUi = role === 'study_room' || role === 'tutor';
  const implemented = product.implemented !== false && product.family === 'position';
  const inv = resolveSlotInventory(slots);
  const slot = getSlotForProduct(product.productCode, inv);
  const soldOut = slot != null && slot.remaining <= 0;

  if (!implemented) {
    return `
      <li class="plans-catalog__item is-placeholder">
        <div class="plans-catalog__head">
          <strong>${esc(product.name)}</strong>
          <span class="plans-catalog__kind">준비중</span>
        </div>
        <p class="plans-catalog__tagline">${esc(product.tagline)}</p>
        <ul class="plans-catalog__bullets">${product.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
        <button type="button" class="btn btn--secondary btn--sm" disabled>준비중</button>
      </li>`;
  }

  const options = product.options || [];
  const eligibility = profile ? getEligibility(profile, product.productCode) : { canBuy: false, missing: ['적용 프로필을 먼저 선택하세요'] };
  if (soldOut) {
    eligibility.canBuy = false;
    eligibility.missing = [...eligibility.missing, '슬롯이 마감되었습니다 (대기열은 후속)'];
  }
  const missingHtml =
    canPurchaseUi && eligibility.missing.length
      ? `<ul class="plans-eligibility">${eligibility.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`
      : '';

  const slotHtml = slot
    ? `<p class="plans-slot-meta">슬롯 ${slot.used}/${slot.capacity} 사용 · 잔여 <strong>${slot.remaining}</strong>${soldOut ? ' · <span class="plans-remain--low">마감</span>' : ''}</p>`
    : '';

  const optionSelect = `
    <label class="plans-catalog__pick">
      <span class="mypage-muted">기간</span>
      <select data-plans-option="${esc(product.productCode)}" class="student-form__select" ${soldOut ? 'disabled' : ''}>
        ${options
          .map((o, i) => {
            const amt = resolveCheckoutAmount(o.priceKrw);
            const priceNote = amt.testMode
              ? `${formatKrw(o.priceKrw)} (테스트 ${formatKrw(amt.chargeKrw)})`
              : formatKrw(o.priceKrw);
            return `<option value="${esc(o.optionId)}"${i === 0 ? ' selected' : ''}>${esc(o.label)} · ${esc(priceNote)}</option>`;
          })
          .join('')}
      </select>
    </label>`;

  const buyDisabled = !canPurchaseUi || !profile || !eligibility.canBuy || soldOut;
  const buyBtn = canPurchaseUi
    ? soldOut
      ? `<button type="button" class="btn btn--secondary btn--sm" disabled title="대기열 후속">슬롯 마감</button>`
      : `<button type="button" class="btn btn--primary btn--sm" data-plans-buy
         data-product-code="${esc(product.productCode)}"
         ${buyDisabled ? 'disabled' : ''}
         title="${buyDisabled ? '구매 조건을 확인하세요' : '결제로 이동'}">구매하기</button>`
    : `<a href="${AUTH_UI_BASE}/#/login" class="btn btn--secondary btn--sm" data-same-tab-href="${AUTH_UI_BASE}/#/login">로그인 후 구매</a>`;

  return `
    <li class="plans-catalog__item${product.featured ? ' is-featured' : ''}${soldOut ? ' is-soldout' : ''}">
      <div class="plans-catalog__head">
        <strong>${esc(product.name)}</strong>
        <span class="plans-catalog__kind">노출 상품</span>
      </div>
      <p class="plans-catalog__tagline">${esc(product.tagline)}</p>
      ${slotHtml}
      ${optionSelect}
      <ul class="plans-catalog__bullets">${product.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      ${missingHtml}
      ${buyBtn}
    </li>`;
}

/** @param {object} product @param {import('./profiles.js').ProviderProfile | null} profile @param {string} role @param {{ memo?: number, request_view?: number }} remaining */
function renderAccessCard(product, profile, role, remaining = {}) {
  const isTutor = role === 'tutor';
  const options = product.options || [];
  const eligibility = profile
    ? getEligibility(profile, product.productCode, 'access')
    : { canBuy: false, missing: ['적용 프로필을 먼저 선택하세요'] };

  if (role === 'study_room') {
    return `
      <li class="plans-catalog__item is-placeholder">
        <div class="plans-catalog__head">
          <strong>${esc(product.name)}</strong>
          <span class="plans-catalog__kind">접근권 · 과외쌤 전용</span>
        </div>
        <p class="plans-catalog__tagline">${esc(product.tagline)}</p>
        <p class="mypage-muted">공부방 역할에서는 구매할 수 없습니다.</p>
      </li>`;
  }

  const remainKey = product.productCode === 'memo_ticket' ? 'memo' : 'request_view';
  const remain = remaining[remainKey];
  const remainHtml =
    remain != null
      ? `<p class="plans-remain">현재 잔여 <strong>${remain}회</strong>${isLowCredit(remain) ? ' · <span class="plans-remain--low">저잔량</span>' : ''}</p>`
      : '';

  const missingHtml =
    isTutor && eligibility.missing.length
      ? `<ul class="plans-eligibility">${eligibility.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`
      : '';

  const optionSelect = `
    <label class="plans-catalog__pick">
      <span class="mypage-muted">팩</span>
      <select data-plans-option="${esc(product.productCode)}" class="student-form__select">
        ${options
          .map((o, i) => {
            const amt = resolveCheckoutAmount(o.priceKrw);
            const priceNote = amt.testMode
              ? `${formatKrw(o.priceKrw)} (시험 결제 ${formatKrw(amt.chargeKrw)})`
              : formatKrw(o.priceKrw);
            return `<option value="${esc(o.optionId)}"${i === 0 ? ' selected' : ''}>${esc(o.label)} · ${esc(priceNote)}</option>`;
          })
          .join('')}
      </select>
    </label>`;

  const buyDisabled = !isTutor || !profile || !eligibility.canBuy;
  const buyBtn = isTutor
    ? `<button type="button" class="btn btn--primary btn--sm" data-plans-buy
         data-product-code="${esc(product.productCode)}"
         ${buyDisabled ? 'disabled' : ''}>구매하기</button>`
    : role === 'guest'
      ? `<a href="${AUTH_UI_BASE}/#/login" class="btn btn--secondary btn--sm" data-same-tab-href="${AUTH_UI_BASE}/#/login">로그인 후 구매</a>`
      : `<button type="button" class="btn btn--secondary btn--sm" disabled>구매 불가</button>`;

  return `
    <li class="plans-catalog__item${product.featured ? ' is-featured' : ''}">
      <div class="plans-catalog__head">
        <strong>${esc(product.name)}</strong>
        <span class="plans-catalog__kind">접근권</span>
      </div>
      <p class="plans-catalog__tagline">${esc(product.tagline)}</p>
      ${remainHtml}
      ${optionSelect}
      <ul class="plans-catalog__bullets">${product.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      <p class="mypage-muted">먼저 산 이용권부터 차감 · 사용기한 ${getPlanSetting('credit_expire_days')}일</p>
      ${missingHtml}
      ${buyBtn}
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

function renderSettingsHints() {
  const s = getPlanRuntimeSettings();
  return `
    <p class="mypage-muted plans-settings-hint">
      지역 기준 대표 노출 ${s.prime_slots}자리
      · 추천 노출 ${s.pick_set_size}개씩/${s.pick_rotation_minutes}분 순환
      · 기본 노출 ${s.basic_page_size}개/페이지 · 주문 유효시간 ${s.order_expire_minutes}분
    </p>`;
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
  const quickLinks =
    role === 'study_room'
      ? [
          { href: '/plans/positions', label: '대표·추천 노출 보기' },
          { href: '/mypage/plans/my', label: '내 상품', internal: true },
          { href: '/mypage/plans/history', label: '결제내역', internal: true },
        ]
      : role === 'tutor'
        ? [
            { href: '/plans/positions', label: '노출상품' },
            { href: '/plans/access', label: '접근권' },
            { href: '/mypage/plans/my', label: '내 상품', internal: true },
            { href: '/mypage/plans/history', label: '결제내역', internal: true },
          ]
        : [
            { href: '/plans/positions', label: '노출상품 소개' },
            { href: '/support/faq', label: '자주 묻는 질문' },
          ];

  return `
    <section class="mypage-panel">
      <p class="mypage-lead">${esc(P18_HEADLINE)}</p>
      <div class="mypage-info-box">
        <strong>유료 = 구매 단계</strong>
        <p class="mypage-muted">새로 정보를 입력하는 화면이 아닙니다. 상세등록을 마친 뒤 대표 노출·추천 노출·접근권을 구매합니다.</p>
      </div>
      ${renderProviderNoticeBanners()}
      ${renderProfileBanner(profile, role)}
      ${role === 'study_room' || role === 'tutor' ? renderTestModeToggle() : ''}
      ${renderSettingsHints()}
      <div class="mypage-info-box plans-tier-box">
        <strong>${esc(tierCopy.title)}</strong>
        <ul class="plans-tier-list">${tierCopy.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>
      <h2 class="mypage-subhead">이용중 요약</h2>
      ${
        positions.length
          ? `<ul class="plans-tier-list">${positions
              .map(
                (p) =>
                  `<li><strong>${esc(productLabel(p.sku))}</strong> · ${p.days_left}일 남음</li>`,
              )
              .join('')}</ul>`
          : `<p class="mypage-muted">${esc(P18_EXPOSURE_STATUS.basic)}</p>`
      }
      <h2 class="mypage-subhead">빠른 진입</h2>
      <div class="mypage-actions-row">
        ${quickLinks
          .map(
            (l) =>
              `<a href="#${l.href}" class="btn btn--secondary btn--sm" ${l.internal ? 'data-nav' : 'data-plans-nav'}="${l.href}">${esc(l.label)}</a>`,
          )
          .join('')}
      </div>
      <p class="mypage-muted">현재 이용 역할: <strong>${esc(roleLabel(role))}</strong></p>
      <div class="mypage-info-box">
        <strong>${esc(P18_RENEWAL_COPY.title)}</strong>
        <ul class="plans-tier-list">${P18_RENEWAL_COPY.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>
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
    <section class="mypage-panel">
      <p class="mypage-lead">노출 상품 (대표 노출 / 추천 노출 · 기본 노출은 추가 올리기 없음)</p>
      ${renderProfileBanner(profile, role)}
      ${role === 'study_room' || role === 'tutor' ? renderTestModeToggle() : ''}
      <div class="mypage-info-box plans-slot-banner">
        <strong>대표 노출 자리 · ${esc(scopeLabel)} 단위</strong>
        <p>대표 노출 ${inv.prime.used}/${inv.prime.capacity} (남은 자리 ${inv.prime.remaining})
          · 추천 노출 ${inv.pick.used}/${inv.pick.capacity} (남은 자리 ${inv.pick.remaining})</p>
        <p class="mypage-muted">공부방 대표 노출 ${settings.prime_slots}자리 고정 · 과외쌤 대표 노출은 시 단위·페이지·${settings.pick_rotation_minutes}분 순환 · 추천 노출 ${settings.pick_set_size}개씩/${settings.pick_rotation_minutes}분 · 기본 노출은 최신순·직접 페이지 이동</p>
      </div>
      <ul class="plans-catalog">
        ${products.map((p) => renderPositionCard(p, profile, role, slots)).join('')}
      </ul>
      <p class="mypage-note">기본 노출을 위로 올리는 별도 상품은 판매하지 않습니다. 접근권은 <a href="#/plans/access" data-plans-nav="/plans/access">접근권 상품</a>에서 확인하세요.</p>
    </section>`;
}

/** P18-03 접근권상품 */
export function renderPlansAccess() {
  const role = getPlansEffectiveRole();
  const query = parsePlansQuery();
  const profile = role === 'tutor' ? resolveSelectedProfile(query, role) : null;
  const products = getCatalogByFamily('access', 'tutor');
  const ops = getPaidOperationalStatus();
  const tickets = ops?.tickets;
  const remaining = {
    memo: tickets?.memo?.remaining,
    request_view: tickets?.request_view?.remaining,
  };

  return `
    <section class="mypage-panel">
      <p class="mypage-lead">접근권 상품 (쪽지권 / 요청문 열람권)</p>
      ${role === 'tutor' ? renderProfileBanner(profile, role) : ''}
      ${role === 'study_room' ? `<div class="mypage-info-box"><p>접근권 상품은 <strong>과외쌤 전용</strong>입니다. 공부방은 노출상품을 이용해 주세요.</p>
        <a href="#/plans/positions" class="btn btn--secondary btn--sm" data-plans-nav="/plans/positions">노출상품으로</a></div>` : ''}
      ${role === 'guest' || role === 'parent' ? renderProfileBanner(null, role) : ''}
      ${role === 'tutor' ? renderTestModeToggle() : ''}
      ${role === 'tutor' ? renderLowCreditBanner(tickets) : ''}
      <ul class="plans-catalog">
        ${products.map((p) => renderAccessCard(p, profile, role, remaining)).join('')}
      </ul>
      <p class="mypage-note">결제 후 이용권이 생성되며, 먼저 산 이용권부터 차례로 사용됩니다.</p>
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
      ${role === 'tutor' ? renderLowCreditBanner(tickets) : ''}
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
                    <td>${esc(String(p.ends_at || '').slice(0, 10))}</td>
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
      <h2 class="mypage-subhead">횟수권 잔여</h2>
      ${
        tickets
          ? `<div class="mypage-stats roi-metrics">
              <div class="mypage-stat${isLowCredit(tickets.memo.remaining) ? ' is-warn' : ''}"><span>${esc(tickets.memo.label)}</span><strong>${tickets.memo.remaining}</strong></div>
              <div class="mypage-stat${isLowCredit(tickets.request_view.remaining) ? ' is-warn' : ''}"><span>${esc(tickets.request_view.label)}</span><strong>${tickets.request_view.remaining}</strong></div>
            </div>
            <p class="mypage-muted"><a href="#/plans/access" data-plans-nav="/plans/access">접근권 충전하기</a></p>`
          : `<p class="mypage-muted">이용권 정보를 불러오면 표시됩니다. · <a href="#/plans/access" data-plans-nav="/plans/access">접근권 상품</a></p>`
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
      : `#/mypage/registrations/study-rooms/${result.providerId || ''}/exposure`;

  return `
    <section class="mypage-panel">
      <p class="mypage-lead">${ok ? '결제 완료' : '결제 미완료'}</p>
      <div class="mypage-info-box ${ok ? '' : 'is-warn'}">
        <p><strong>${esc(orderStatusLabel(result.status === 'success' ? 'paid' : result.status))}</strong></p>
        ${result.orderRef ? `<p>주문번호 <code>${esc(result.orderRef)}</code></p>` : ''}
        ${result.productName ? `<p>${esc(result.productName)}${result.optionLabel ? ` · ${esc(result.optionLabel)}` : ''}</p>` : ''}
        ${result.providerLabel ? `<p>적용 프로필: ${esc(result.providerLabel)}</p>` : ''}
        ${result.chargeKrw != null ? `<p>결제금액 ${formatKrw(result.chargeKrw)}</p>` : ''}
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
      const product = getProductConfig(productCode);
      const option = getPriceOption(productCode, optionId);
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
      const amt = resolveCheckoutAmount(draft.priceKrw);

      payBtn.setAttribute('disabled', 'true');
      try {
        const created = await createPaidCheckout(draft.productCode, draft.apiVariant);
        const completed = await completePaidCheckout(created.order_ref);
        await hydrateProviderStatus();
        await hydrateProviderNotices();

        appendHistoryRow({
          orderRef: completed.order_ref || created.order_ref,
          productName: `${draft.productName} · ${draft.optionLabel}`,
          providerLabel: draft.providerLabel,
          amountKrw: amt.chargeKrw,
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
          chargeKrw: amt.chargeKrw,
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
