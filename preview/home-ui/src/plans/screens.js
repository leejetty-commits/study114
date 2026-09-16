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
import {
  createPaidCheckout,
  completePaidCheckout,
  registerPrimeWaitlist,
  fetchPrimeWaitlist,
  cancelPrimeWaitlist,
} from '../paid-api.js';
import {
  getProviderStatus,
  hydrateProviderStatus,
  hydrateProviderStatusStrict,
  invalidateProviderStatus,
} from '../provider-status.js';
import { ensureStudyRoomStore } from '../study-room-reg/index.js';
import { ensureTutorStore } from '../tutor-reg/index.js';
import { getPublishReadiness as getRoomReadiness, getStudyRoom } from '../study-room-reg/store.js';
import { getTutor } from '../tutor-reg/store.js';
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
  badgePriceKrw,
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
import {
  resolveRoomPrimeInventory,
  getSlotForProduct,
  buildRoomPrimeBoard,
  isRoomPrimeFull,
} from './slot-inventory.js';
import { renderReceiptPanel, bindReceiptEvents } from './receipt.js';
import {
  renderPlansHero,
  renderGuideBox,
  renderFreePaidCompare,
  renderPlansCtaBanner,
  renderBadgeAddonSection,
  productMediaClass,
  productIcon,
} from './store-ui.js';
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

/** @param {ParentNode} [root] */
function readSelectedPrimeRegion(root = document) {
  const el = root.querySelector?.('[data-plans-apply-region]:checked') ||
    root.querySelector?.('[data-plans-apply-region]');
  if (!(el instanceof HTMLInputElement)) {
    return null;
  }
  const cityId = el.getAttribute('data-city-id') || '';
  const basis = el.getAttribute('data-region-basis') || '';
  const regionId = el.getAttribute('data-region-id') || '';
  const complexId = el.getAttribute('data-complex-id') || '';
  const label = el.value || el.nextElementSibling?.textContent || '';
  if (cityId) {
    return {
      cityId,
      regionLabel: label,
      slotGroup: label,
      regionBasisType: '',
      regionId: '',
      complexId: '',
    };
  }
  if (basis !== 'dong' && basis !== 'complex') return null;
  if (basis === 'complex' && !complexId) return null;
  if (basis === 'dong' && !regionId) return null;
  return {
    regionBasisType: basis,
    regionId,
    complexId,
    slotGroup: label,
    regionLabel: label,
    cityId: '',
  };
}

/** @type {{ rows: import('./history-mock.js').HistoryRow[], fromApi: boolean, loaded: boolean }} */
let historyCache = { rows: [], fromApi: false, loaded: false };

/** @type {string | null} */
let openReceiptOrderRef = null;

/**
 * #/plans/access · #/plans/my 프로필별 status 동기화 (stale 구매 방지)
 * @type {{ key: string, phase: 'idle'|'loading'|'ready'|'error', error: string|null, route: string }}
 */
let plansStatusSync = { key: '', phase: 'idle', error: null, route: '' };

/** 같은 hash 재렌더에서 중복 hydrate 방지. 라우트를 벗어나면 비운다. */
let lastPlansHydratedHash = '';

/** checkout 진입 시 서버 quote만 받고 권리는 선점하지 않는다. */
let checkoutQuoteKey = '';
let checkoutQuotePhase = 'idle';

function checkoutQuoteContext(draft) {
  return {
    providerType: draft.providerType,
    providerId: draft.providerId,
    badgeCodes: Array.isArray(draft.badgeCodes) ? draft.badgeCodes : [],
    regionBasisType: draft.regionBasisType,
    regionId: draft.regionId,
    complexId: draft.complexId,
    slotGroup: draft.slotGroup,
    regionLabel: draft.regionLabel,
    cityId: draft.cityId,
    primarySubjectId: draft.primarySubjectId,
  };
}

/** @param {() => void} rerender */
function scheduleCheckoutServerQuote(rerender) {
  const draft = getCheckoutDraft();
  if (!draft) return;
  const isPosition = draft.productCode === 'prime' || draft.productCode === 'pick';
  if (!isPosition) return;
  const key = [
    draft.providerType,
    draft.providerId,
    draft.productCode,
    draft.apiVariant,
    (draft.badgeCodes || []).join(','),
    draft.cityId || '',
    draft.regionId || '',
    draft.complexId || '',
  ].join('|');
  if (checkoutQuoteKey === key && checkoutQuotePhase !== 'idle') return;
  checkoutQuoteKey = key;
  checkoutQuotePhase = 'loading';
  createPaidCheckout(draft.productCode, draft.apiVariant, checkoutQuoteContext(draft))
    .then((created) => {
      checkoutQuotePhase = 'ready';
      const cur = getCheckoutDraft();
      if (!cur) return;
      const snap = created.price_snapshot && typeof created.price_snapshot === 'object' ? created.price_snapshot : {};
      setCheckoutDraft({
        ...cur,
        orderRef: created.order_ref,
        serverAmountWon: Number(created.amount_won),
        serverBadgeSaleKrw: Number(created.badge_sale_krw || 0),
        serverPositionSaleKrw: Number(snap.position_sale_krw != null ? snap.position_sale_krw : created.amount_won),
        startedOn: created.started_on || '',
        endsOn: created.ends_on || '',
        cityId: created.city_id || cur.cityId,
        primarySubjectId: created.primary_subject_id || cur.primarySubjectId,
        memoBundle: created.memo_bundle != null ? Number(created.memo_bundle) : cur.memoBundle,
      });
      rerender();
    })
    .catch(() => {
      checkoutQuoteKey = '';
      checkoutQuotePhase = 'idle';
    });
}

/** @param {import('./profiles.js').ProviderProfile | null} profile */
export function accessProfileKey(profile) {
  return profile ? `${profile.providerType}:${profile.id}` : '';
}

export function resetAccessStatusSync() {
  plansStatusSync = { key: '', phase: 'idle', error: null, route: '' };
  lastPlansHydratedHash = '';
}

/** @deprecated alias — access/my 공용 */
export const resetPlansStatusSync = resetAccessStatusSync;

/**
 * @param {import('./profiles.js').ProviderProfile | null} profile
 * @param {() => void} rerender
 * @param {string} routePath '/plans/access' | '/plans/my' | '/mypage/plans/my'
 */
export function schedulePlansStatusHydrate(profile, rerender, routePath) {
  if (!profile) {
    resetPlansStatusSync();
    return;
  }
  const key = accessProfileKey(profile);
  const hash = window.location.hash;
  if (plansStatusSync.phase === 'loading' && plansStatusSync.key === key) {
    return;
  }
  if (
    plansStatusSync.phase === 'ready' &&
    plansStatusSync.key === key &&
    lastPlansHydratedHash === hash &&
    getProviderStatus()
  ) {
    return;
  }
  if (
    plansStatusSync.phase === 'error' &&
    plansStatusSync.key === key &&
    lastPlansHydratedHash === hash
  ) {
    return;
  }

  plansStatusSync = { key, phase: 'loading', error: null, route: routePath };
  invalidateProviderStatus();
  rerender();

  const q = parsePlansQuery();
  const region = {
    regionBasisType: q.region_basis_type || '',
    regionId: q.region_id || '',
    complexId: q.complex_id || '',
    slotGroup: q.slot_group || '',
  };

  hydrateProviderStatusStrict(7, region)
    .then(() => {
      if (plansStatusSync.key !== key) return;
      lastPlansHydratedHash = window.location.hash;
      plansStatusSync = { key, phase: 'ready', error: null, route: routePath };
      rerender();
    })
    .catch((err) => {
      if (plansStatusSync.key !== key) return;
      lastPlansHydratedHash = window.location.hash;
      plansStatusSync = {
        key,
        phase: 'error',
        error: err instanceof Error ? err.message : String(err || 'status 조회 실패'),
        route: routePath,
      };
      invalidateProviderStatus();
      rerender();
    });
}

/** @param {import('./profiles.js').ProviderProfile | null} profile */
export function plansStatusFlags(profile) {
  const profileKey = accessProfileKey(profile);
  const syncReady =
    plansStatusSync.phase === 'ready' &&
    plansStatusSync.key === profileKey &&
    Boolean(getProviderStatus());
  const syncLoading =
    plansStatusSync.phase === 'loading' && plansStatusSync.key === profileKey;
  const syncError =
    plansStatusSync.phase === 'error' && plansStatusSync.key === profileKey;
  const syncPending = Boolean(profile) && !syncReady && !syncError;
  return { profileKey, syncReady, syncLoading, syncError, syncPending };
}

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
  if (normalized.includes('prime')) return 'Prime 노출';
  if (normalized.includes('pick')) return 'Pick 노출';
  if (normalized.includes('basic')) return 'Basic 노출';
  if (normalized.includes('memo')) return '쪽지권';
  return '이용 상품';
}

/** 내 상품·홈 요약용. 구매면(#/plans/access)에서는 사용하지 않음. */
function renderLowCreditBanner(tickets) {
  if (!tickets) return '';
  const warns = [];
  if (isLowCredit(tickets.memo?.remaining)) {
    warns.push(`쪽지권 남은 횟수 ${tickets.memo.remaining}회 — 내 상품에서 확인하세요`);
  }
  if (!warns.length) return '';
  return `
    <div class="mypage-info-box is-warn plans-low-credit" role="status">
      <strong>쪽지권 안내</strong>
      <ul class="plans-tier-list">${warns.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
      <a href="#/mypage/plans/my" class="btn btn--secondary btn--sm" data-nav="/mypage/plans/my">내 쪽지권 보기</a>
    </div>`;
}

/** R2 공부방 Pick 5×2 미리보기 타일 (라이브 목록 아님 · 샘플 재사용) */
const ROOM_PICK_PREVIEW_TILES = [
  { name: '대치 ○○수학', stats: '추천 24 · 후기 18' },
  { name: '역삼 ○○영어', stats: '추천 19 · 후기 12' },
  { name: '잠실 ○○국어', stats: '추천 31 · 후기 22' },
  { name: '삼성 ○○과학', stats: '추천 15 · 후기 9' },
  { name: '서초 ○○논술', stats: '추천 27 · 후기 16' },
  { name: '도곡 ○○수학', stats: '추천 21 · 후기 14' },
  { name: '개포 ○○영어', stats: '추천 17 · 후기 11' },
  { name: '청담 ○○미술', stats: '추천 13 · 후기 8' },
  { name: '압구정 ○○피아노', stats: '추천 22 · 후기 15' },
  { name: '대치 ○○코딩', stats: '추천 28 · 후기 19' },
];

/**
 * 공부방 Prime 점유판 (3칸 · 슬롯 선택 없음 · 만석 시 예약대기만)
 * @param {{ capacity: number, used: number, remaining: number }} prime
 */
function renderRoomPrimeBoard(prime) {
  const cells = buildRoomPrimeBoard(prime);
  const full = isRoomPrimeFull(prime);
  const used = Math.min(3, Math.max(0, Number(prime?.used) || 0));
  const remaining = Math.max(0, 3 - used);
  const tone = full ? 'is-full' : used > 0 ? 'is-partial' : 'is-open';
  return `
    <div class="plans-prime-board ${tone}" data-plans-prime-board>
      <h4 class="plans-prime-board__title">선택 지역 Prime 노출 현황</h4>
      <p class="plans-prime-board__occupancy">3자리 중 ${used}자리 이용 중${remaining ? ` · 남은 자리 ${remaining}` : ' · 만석'}</p>
      <p class="plans-prime-board__lead">선택 지역의 Prime 대표 노출 · 빈자리는 왼쪽부터 자동 배정됩니다. 슬롯 번호는 고르지 않습니다.</p>
      <ul class="plans-prime-board__cells" aria-label="Prime 자리 3칸">
        ${cells
          .map((c) => {
            const st = c.status === 'held' ? 'held' : c.status;
            const meta =
              st === 'available'
                ? '빈자리'
                : st === 'held'
                  ? '임시확보'
                  : c.endsAt
                    ? `${c.endsAt} 종료 예정`
                    : '이용 중';
            return `
          <li class="plans-prime-cell is-${esc(st)}">
            <span class="plans-prime-cell__label">Prime 자리</span>
            <span class="plans-prime-cell__status">${esc(c.label)}</span>
            <span class="plans-prime-cell__meta">${esc(meta)}</span>
          </li>`;
          })
          .join('')}
      </ul>
      ${
        full
          ? `<div class="plans-prime-waitlist" data-plans-waitlist>
              <p><strong>현재 선택 지역의 Prime 자리는 모두 이용 중입니다.</strong></p>
              <p>예약대기를 등록하면 빈자리가 열릴 때 알려드립니다. 대기 등록만으로 자리나 순번이 보장되지는 않으며 결제가 완료되어야 확정됩니다.</p>
              <button type="button" class="btn btn--primary" data-plans-waitlist-register>예약대기 등록</button>
              <p class="mypage-muted" style="margin-top:0.5rem"><a href="#/mypage/plans/my" data-nav="/mypage/plans/my">내 예약대기 보기</a></p>
            </div>`
          : ''
      }
    </div>`;
}

/** 공부방 Pick 5×2=10 미리보기 (순환 목록·과외쌤 미사용) */
function renderRoomPickPreview() {
  return `
    <div class="plans-room-pick" aria-label="Pick 노출 미리보기 5열 2행">
      <p class="plans-room-pick__title">Pick 노출 미리보기 · 한 페이지 10명 (5열 × 2행)</p>
      <ul class="plans-room-pick__grid">
        ${ROOM_PICK_PREVIEW_TILES.map(
          (p, i) => `
          <li class="plans-room-pick__tile" aria-label="Pick 미리보기 ${i + 1}">
            <span class="plans-room-pick__thumb" aria-hidden="true">P${i + 1}</span>
            <span class="plans-room-pick__name">${esc(p.name)}</span>
            <span class="plans-room-pick__stats">${esc(p.stats)}</span>
          </li>`,
        ).join('')}
      </ul>
      <nav class="plans-room-pick__pager" aria-label="페이지">
        <span class="is-current" aria-current="page">1</span><span>2</span><span>3</span>
      </nav>
    </div>`;
}

/** T1 과외쌤 circulation 미리보기 (점유·만석·예약대기 없음) */
const TUTOR_PRIME_PREVIEW_TILES = [
  { name: '김○○', subject: '수학 · 고등학교', stats: '추천 28 · 후기 19' },
  { name: '이○○', subject: '영어 · 고등학교', stats: '추천 21 · 후기 14' },
  { name: '박○○', subject: '국어 · 중학교', stats: '추천 17 · 후기 11' },
];

const TUTOR_PICK_PREVIEW_TILES = [
  { name: '김○○', subject: '수학 · 고등학교', stats: '추천 28 · 후기 19' },
  { name: '이○○', subject: '영어 · 고등학교', stats: '추천 21 · 후기 14' },
  { name: '박○○', subject: '국어 · 중학교', stats: '추천 17 · 후기 11' },
  { name: '최○○', subject: '과학 · 고등학교', stats: '추천 15 · 후기 9' },
  { name: '정○○', subject: '논술 · 고등학교', stats: '추천 24 · 후기 16' },
  { name: '강○○', subject: '수학 · 중학교', stats: '추천 19 · 후기 12' },
  { name: '윤○○', subject: '영어 · 중학교', stats: '추천 13 · 후기 8' },
  { name: '장○○', subject: '사회 · 고등학교', stats: '추천 22 · 후기 15' },
  { name: '임○○', subject: '코딩 · 고등학교', stats: '추천 18 · 후기 10' },
  { name: '한○○', subject: '국어 · 고등학교', stats: '추천 31 · 후기 22' },
];

function renderTutorCircPager() {
  return `<nav class="plans-tutor-circ__pager" aria-label="페이지">
        <span class="is-current" aria-current="page">1</span><span>2</span><span>3</span>
      </nav>`;
}

function renderTutorCircTiles(tiles, prefix) {
  return tiles
    .map(
      (p, i) => `
          <li class="plans-tutor-circ__tile" aria-label="${prefix} 미리보기 ${i + 1}">
            <span class="plans-tutor-circ__thumb" aria-hidden="true">${prefix}${i + 1}</span>
            <span class="plans-tutor-circ__name">${esc(p.name)}</span>
            <span class="plans-tutor-circ__subject">${esc(p.subject)}</span>
            <span class="plans-tutor-circ__stats">${esc(p.stats)}</span>
          </li>`,
    )
    .join('');
}

function renderTutorPrimeCirculation() {
  return `
    <div class="plans-tutor-circ plans-tutor-circ--prime" aria-label="Prime 노출 미리보기 페이지당 3명">
      <div class="plans-tutor-circ__head">
        <span class="plans-tutor-circ__kicker">핵심 노출 · 순환형</span>
        <span class="plans-tutor-circ__count">3 / page</span>
      </div>
      <p class="plans-tutor-circ__title">Prime 순환 미리보기 · 페이지당 3명</p>
      <p class="plans-tutor-circ__rotate">선택 시·주력과목 앞쪽 노출 · 15분마다 공정 순환 · 페이지 넘김</p>
      <ul class="plans-tutor-circ__grid">
        ${renderTutorCircTiles(TUTOR_PRIME_PREVIEW_TILES, 'T')}
      </ul>
      ${renderTutorCircPager()}
    </div>`;
}

function renderTutorPickCirculation() {
  return `
    <div class="plans-tutor-circ plans-tutor-circ--pick" aria-label="Pick 노출 미리보기 페이지당 10명">
      <div class="plans-tutor-circ__head">
        <span class="plans-tutor-circ__kicker">추천 노출 · 순환형</span>
        <span class="plans-tutor-circ__count">10 / page</span>
      </div>
      <p class="plans-tutor-circ__title">Pick 순환 미리보기 · 페이지당 10명</p>
      <p class="plans-tutor-circ__rotate">선택 시·주력과목 추천 노출 · 15분마다 공정 순환 · 페이지 넘김</p>
      <ul class="plans-tutor-circ__grid">
        ${renderTutorCircTiles(TUTOR_PICK_PREVIEW_TILES, 'P')}
      </ul>
      ${renderTutorCircPager()}
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
    if (tutor.profile_status !== 'published') {
      missing.push('공개(published) 상태가 필요합니다');
      canBuy = false;
    }
    // 과외쌤 구매 차단은 노출축(시·주력과목)만. 소개문·카드 카피 완성도는 성과 불이익.
  }

  return { canBuy, missing: [...new Set(missing)] };
}

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
    product.name || (isPrime ? 'Prime 노출' : isPick ? 'Pick 노출' : productLabel(product.productCode));
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
    : { canBuy: false, missing: ['적용 프로필을 먼저 선택하세요'] };
  if (soldOut) {
    eligibility.canBuy = false;
    eligibility.missing = [
      ...eligibility.missing.filter((m) => !String(m).includes('슬롯') && !String(m).includes('마감')),
      '현재 지역 Prime 자리가 모두 이용 중입니다. 아래에서 예약대기를 등록하세요.',
    ];
  }
  const missingHtml =
    canPurchaseUi && eligibility.missing.length
      ? `<ul class="plans-eligibility plans-eligibility--soft">${eligibility.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`
      : '';

  const boardHtml = embedBoard && roomPrimeOnly && inv ? renderRoomPrimeBoard(inv.prime) : '';

  const footNote = (() => {
    if (role === 'study_room' && isPick) return '선택 지역에서 10개씩 순환 노출';
    if (role === 'tutor' && isPrime) return '선택 시·주력과목에서 3개씩 순환 노출';
    if (role === 'tutor' && isPick) return '선택 시·주력과목에서 10개씩 순환 노출';
    if (role === 'study_room' && isPrime) return '선택 지역의 Prime 대표 노출';
    return '';
  })();

  const pickPreviewHtml =
    embedPickPreview && isPick
      ? `<div class="plans-pick-preview" aria-label="Pick 노출 미리보기 5열 2행">
        <p class="plans-pick-preview__label">Pick 노출 미리보기 · 5열 × 2행</p>
        <ul class="plans-pick-preview__grid">
          ${Array.from({ length: 10 }, (_, i) => `<li class="plans-pick-preview__cell">P${i + 1}</li>`).join('')}
        </ul>
        <nav class="plans-pick-preview__pager" aria-label="페이지">
          <span class="is-current">1</span><span>2</span><span>3</span>
        </nav>
      </div>`
      : '';

  const regionReady = Boolean(opts.regionReady);
  const periodLocked = soldOut || !regionReady;
  const periodOptions = sortPeriodOptions(options);
  const periodReason = !regionReady ? periodDisabledReason(role) : '';
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
    <div class="plans-sf-buy plans-catalog__item${soldOut ? ' is-soldout' : ''}${primaryCta ? ' is-primary' : ''}" data-product-code="${esc(product.productCode)}">
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
      : `<button type="button" class="${ctaClass}" data-plans-select-product
         data-product-code="${esc(product.productCode)}"
         title="이 상품을 주문 요약에 반영">이 상품 선택</button>`
    : `<a href="${AUTH_UI_BASE}/#/login" class="btn btn--secondary plans-card__cta" data-same-tab-href="${AUTH_UI_BASE}/#/login">로그인 후 구매</a>`;

  const badge = product.cardBadge
    ? `<span class="plans-card__badge">${esc(product.cardBadge)}</span>`
    : '';

  const media = `<div class="plans-card__media ${productMediaClass(product.productCode)}" aria-hidden="true">${badge}<span class="plans-card__media-ico">${productIcon(product.productCode)}</span></div>`;

  return `
    <li class="plans-card plans-card--${layout} plans-catalog__item${product.featured ? ' is-featured' : ''}${soldOut ? ' is-soldout' : ''}${primaryCta ? ' is-primary' : ''}" data-product-code="${esc(product.productCode)}">
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
      <span>시험 결제 화면 (실제 PG 연동 전 · 금액은 서버 판매가)</span>
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
          <p class="plans-section__lead">Prime 노출·Pick 노출은 기간형 단건 결제입니다. Basic을 위로 올리는 별도 UP 상품은 없습니다.</p>
        </div>
        <ul class="plans-card-grid plans-card-grid--2">
          ${positionProducts
            .map((p, i) =>
              renderPositionCard(p, profile, role, slots, {
                layout: 'compact',
                primaryCta: i === 0,
                regionReady: profile ? getApplyTargetReadiness(profile, role).regionReady : false,
              }),
            )
            .join('')}
        </ul>
        <div class="plans-tip">
          <span class="plans-tip__ico" aria-hidden="true">💡</span>
          <p>알고 계셨나요? Hot·단과(공부방)·쪽집게·SKY(과외쌤)는 Prime·Pick 노출 이용 기간에 함께 적용됩니다. 서로 다른 배지 최대 2개 · New는 신규 1주 자동배지이며 추천·후기는 통계입니다.</p>
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
  const slots = role === 'study_room' ? ops?.slots ?? null : null;
  const canBuy = role === 'study_room' || role === 'tutor';
  const selectedCode = query.product || products[0]?.productCode || 'prime';
  const selectedProduct = products.find((p) => p.productCode === selectedCode) || products[0];
  const selectedPeriodOptions = sortPeriodOptions(selectedProduct?.options || []);
  const selectedOption =
    selectedPeriodOptions.find((o) => o.optionId === query.option) || selectedPeriodOptions[0];
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
  const roomPrimeSoldOut =
    role === 'study_room' &&
    selectedProduct?.productCode === 'prime' &&
    isRoomPrimeFull(resolveRoomPrimeInventory(slots).prime);
  const orderCtaDisabled =
    !canBuy ||
    !profile ||
    !selectedProduct ||
    !applyReady ||
    roomPrimeSoldOut ||
    !selectedElig.canBuy ||
    (role === 'study_room' &&
      selectedProduct?.productCode === 'prime' &&
      !selectedRegionScope);
  const badgeLines = selectedBadges.map((code) => {
    const price = badgePriceKrw(providerTypeKey, undefined, code, periodLabel);
    return {
      label: badgeDisplayName(code),
      value: price != null ? formatKrw(price) : '—',
      priceKrw: price || 0,
    };
  });
  const positionAmt = selectedOption ? resolveCheckoutAmount(selectedOption.priceKrw) : null;
  const badgeSum = badgeLines.reduce((n, b) => n + (b.priceKrw || 0), 0);
  const displayTotal =
    positionAmt != null ? positionAmt.displayKrw + badgeSum : null;
  const orderRows = buildPositionOrderRows({
    profileLabel: profile ? profile.label : '미선택',
    roleText: role === 'study_room' ? '공부방' : role === 'tutor' ? '과외쌤' : roleLabel(role),
    productName: selectedProduct?.name || productLabel(selectedCode),
    regionValue:
      selectedRegionScope?.label ||
      (role === 'tutor' ? (applyReady ? '시 미선택' : '활동 시·주력과목 필요') : applyReady ? '—' : '미선택'),
    periodLabel,
    periodRangeText: periodPreview ? `${periodPreview.startedOn} ~ ${periodPreview.endsOn}` : '결제 완료 시점부터 (서버 확정)',
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
  });
  const primeProduct = products.find((p) => p.productCode === 'prime');
  const pickProduct = products.find((p) => p.productCode === 'pick');
  const restProducts = products.filter((p) => p.productCode !== 'prime' && p.productCode !== 'pick');
  const isSelectedOffer = (product, index) =>
    product.productCode === selectedCode || (!query.product && index === 0);
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
      : isRoomPick
        ? renderRoomPickPreview()
        : isTutorPrime
          ? renderTutorPrimeCirculation()
          : isTutorPick
            ? renderTutorPickCirculation()
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
          eyebrow: 'PAID PRODUCTS',
          title: '노출상품',
          lead: '더 좋은 자리에서 학부모·학생에게 발견될 기회를 제공합니다.\n마이샵을 만들고 Basic 목록에 노출하는 것은 무료입니다.\n필요한 기간만 결제하며 자동으로 연장하지 않습니다.',
          sub: 'Prime 노출과 Pick 노출은 홈·찾기 화면에서 프로필을 더 잘 발견할 수 있도록 돕는 유료 노출상품입니다.',
        })}
        ${renderBasicFreeRow()}
      </header>

      <div class="plans-storefront__body">
        <div class="plans-storefront__catalog">
          ${
            primeProduct || pickProduct || restProducts.length
              ? `${renderOffer(
                  primeProduct,
                  role === 'tutor'
                    ? '선택한 시와 주력과목의 Prime 영역에 페이지당 3명씩 노출되며, 15분마다 공정하게 순환합니다.'
                    : '선택한 단지·행정동의 Prime 대표 자리를 확보하세요. Prime은 선택 지역에서 3개만 운영하는 한정 대표 노출입니다.',
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
              : `<div class="plans-sf-empty" role="status">표시할 노출상품이 없습니다. 카탈로그를 다시 불러와 주세요.</div>`
          }

          ${renderBadgeAddonSection(role, ops, {
            selected: selectedBadges,
            periodLabel,
            selectable:
              canBuy &&
              Boolean(query.product) &&
              Boolean(selectedOption) &&
              Boolean(selectedProduct) &&
              !roomPrimeSoldOut,
          })}
        </div>

        <div class="plans-storefront__aux">
          ${renderApplyTargetBlock(profile, role, 'positions')}
        </div>

        <aside class="plans-storefront__summary" aria-label="주문 요약">
          ${renderOrderSummaryBlock({
            family: 'position',
            rows: orderRows,
            totalLabel: '결제 예정(표시가·서버 재검증)',
            totalValue: displayTotal != null ? formatKrw(displayTotal) : '—',
            ctaDisabled: orderCtaDisabled,
            ctaLabel: roomPrimeSoldOut ? '예약대기만 가능' : '구매하기',
            note: '시작일·종료일은 결제 완료 시 서버 확정 · 자동연장 없음 · 표시가는 참고이며 결제 직전 서버가 재검증합니다.',
          })}
        </aside>
      </div>

      <div class="plans-storefront__foot">
        ${renderPolicyAccordion('position')}
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
          { label: '소멸', value: '사용기한 경과 시 남은 횟수 소멸 · 환불·연장 없음' },
        ]),
    { label: '적용 프로필', value: profile ? profile.label : '미선택' },
  ];

  return `
    <section class="plans-store plans-storefront plans-sf plans-sf--access" data-plans-access>
      <header class="plans-sf-hero">
        ${renderPlansHero({
          eyebrow: 'PAID PRODUCTS',
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
              <p class="plans-access-hold__nav"><a class="plans-access-aux__link" href="#/mypage/plans/my" data-nav="/mypage/plans/my">내 쪽지권 보기</a></p>
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
      <p class="mypage-lead">내 상품 이용 현황</p>
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
                    <td>${esc(p.provider_type || '미확인')} #${esc(String(p.provider_id ?? ''))}</td>
                    <td>${esc(p.product_name || '')}</td>
                    <td>${esc(p.grant_label || '')}</td>
                    <td>${p.granted_count ?? '—'}</td>
                    <td>${p.remaining ?? '—'}</td>
                    <td>${esc(String(p.purchased_at || '').slice(0, 10))}</td>
                    <td data-plans-pack-expires>${esc(String(p.expires_at || '').slice(0, 10))}</td>
                    <td>${esc(p.status || '')}</td>
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
          ? `<h2 class="mypage-subhead">Prime 예약대기</h2>
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
  const isPosition = draft.productCode === 'prime' || draft.productCode === 'pick';
  const badgeCodes = isPosition ? sanitizeBadgeCodes(draft.providerType, draft.badgeCodes || []) : [];
  const badgeLines = badgeCodes.map((code) => {
    const price = badgePriceKrw(draft.providerType, undefined, code, draft.optionLabel || draft.apiVariant);
    return {
      label: badgeDisplayName(code),
      value: price != null ? formatKrw(price) : '—',
      priceKrw: price || 0,
    };
  });
  const badgeSum = badgeLines.reduce((n, b) => n + (b.priceKrw || 0), 0);
  const positionDisplay =
    draft.serverPositionSaleKrw != null ? Number(draft.serverPositionSaleKrw) : amt.displayKrw;
  const badgeDisplay =
    draft.serverBadgeSaleKrw != null ? Number(draft.serverBadgeSaleKrw) : badgeSum;
  const previewTotal =
    draft.serverAmountWon != null ? Number(draft.serverAmountWon) : positionDisplay + badgeDisplay;
  const periodRangeText =
    draft.startedOn && draft.endsOn
      ? `${draft.startedOn} ~ ${draft.endsOn}`
      : '결제 완료 시점부터 (서버 확정)';
  const checkoutRows = isPosition
    ? buildPositionOrderRows({
        profileLabel: draft.providerLabel,
        roleText: roleLabel(draft.providerType),
        productName: draft.productName,
        regionValue: draft.regionLabel || (draft.providerType === 'tutor' ? '시·주력과목' : '—'),
        periodLabel: draft.optionLabel || draft.apiVariant,
        periodRangeText,
        listPriceText:
          Number(draft.discountKrw) > 0 && Number(draft.listPriceKrw) > 0 ? formatKrw(draft.listPriceKrw) : '',
        positionPriceText: formatKrw(positionDisplay),
        discountText: draft.discountLabel || '',
        memoBundleText: Number(draft.memoBundle) > 0 ? `쪽지권 ${draft.memoBundle}회 포함` : '',
        badgeLines,
        badgeSumText: formatKrw(badgeDisplay),
      })
    : [
        { label: '상품', value: `${draft.productName} · ${draft.optionLabel}` },
        { label: '표시가', value: formatKrw(amt.displayKrw) },
        { label: '자동연장', value: '없음' },
      ];
  const cancelHref = isPosition
    ? buildPlansHref(
        '/plans/positions',
        applyBadgeQuery(
          {
            product: draft.productCode,
            option: draft.optionId,
            badges: (draft.badgeCodes || []).join(','),
            city_id: draft.cityId ? String(draft.cityId) : '',
          },
          draft.providerType,
        ),
      )
    : buildPlansHref('/plans/access', { option: draft.optionId });

  return `
    <section class="mypage-panel plans-checkout">
      <p class="mypage-lead">결제</p>
      ${renderOrderSummaryBlock({
        family: isPosition ? 'position' : 'access',
        rows: checkoutRows,
        totalLabel: '결제 예정(표시가·서버 재검증)',
        totalValue: formatKrw(previewTotal),
        showCta: false,
        note: '자동연장 없음 · 환불은 시작 전 전액, 시작 후 일할 계산(서버 정본) · 결제 직전 서버가 재검증합니다.',
      })}
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
          <p>표시가 ${formatKrw(previewTotal)}
            ${isPosition && badgeDisplay ? ` · 노출 ${formatKrw(positionDisplay)} · 배지 소계 ${formatKrw(badgeDisplay)}` : ''}
            ${amt.testMode ? ` · <em>시험 결제 화면</em>` : ''}</p>
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
            <a href="${esc(cancelHref)}" class="btn btn--secondary" data-plans-nav="${isPosition ? '/plans/positions' : '/plans/access'}">취소</a>
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
  const resultBadges = sanitizeBadgeCodes(result.providerType || '', result.badgeCodes || []);
  const resultBadgeLines = resultBadges.length
    ? resultBadges
        .map((code) => `<p>홍보 배지 · ${esc(badgeDisplayName(code))}</p>`)
        .join('')
    : '<p>홍보 배지 없음</p>';

  return `
    <section class="mypage-panel">
      <p class="mypage-lead">${ok ? '결제 완료' : '결제 미완료'}</p>
      <div class="mypage-info-box ${ok ? '' : 'is-warn'}">
        <p><strong>${esc(orderStatusLabel(result.status === 'success' ? 'paid' : result.status))}</strong></p>
        ${result.orderRef ? `<p>주문번호 <code>${esc(result.orderRef)}</code></p>` : ''}
        ${result.productName ? `<p>${esc(result.productName)}${result.optionLabel ? ` · ${esc(result.optionLabel)}` : ''}</p>` : ''}
        ${result.providerLabel ? `<p>적용 프로필: ${esc(result.providerLabel)}</p>` : ''}
        ${result.regionLabel ? `<p>적용 지역: ${esc(result.regionLabel)}</p>` : ''}
        ${result.startedOn || result.endsOn ? `<p>이용 기간 ${esc(result.startedOn || '—')} ~ ${esc(result.endsOn || '—')}</p>` : ''}
        ${resultBadgeLines}
        ${result.badgeSaleKrw != null && resultBadges.length ? `<p>배지 소계 ${formatKrw(result.badgeSaleKrw)}</p>` : ''}
        ${result.chargeKrw != null ? `<p>결제금액 ${formatKrw(result.chargeKrw)}</p>` : ''}
        <p>자동연장 없음 · 환불은 시작 전 전액, 시작 후 일할 계산(서버 정본)</p>
        ${result.memoBundleGranted > 0 ? `<p>노출상품 무료 쪽지 ${result.memoBundleGranted}회 — 본상품과 같은 기간이며 종료 시 함께 종료됩니다.</p>` : ''}
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
  if (path !== '/plans/access' && path !== '/mypage/plans/my' && path !== '/plans/my' && path !== '/plans/positions') {
    lastPlansHydratedHash = '';
  }
  if (path === '/plans/positions') {
    const role = getPlansEffectiveRole();
    const query = parsePlansQuery();
    const profile =
      role === 'tutor' || role === 'study_room' ? resolveSelectedProfile(query, role) : null;
    schedulePlansStatusHydrate(profile, rerender, path);
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
            waitHost.innerHTML = `<p class="mypage-muted">등록된 Prime 예약대기가 없습니다. · <a href="#/plans/positions" data-plans-nav="/plans/positions">노출상품 보기</a></p>`;
            return;
          }
          waitHost.innerHTML = `
            <table class="plans-table" aria-label="Prime 예약대기">
              <thead><tr><th>상품</th><th>지역</th><th>상태</th><th>등록일</th><th></th></tr></thead>
              <tbody>
                ${items
                  .map(
                    (w) => `
                  <tr>
                    <td>${esc(w.product || 'Prime 노출')}</td>
                    <td>${esc(w.region || '—')}</td>
                    <td>${esc(w.status_label || w.status || '')}</td>
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
                window.alert(err?.message || '예약대기 취소에 실패했습니다.');
              }
            });
          });
        })
        .catch(() => {
          waitHost.innerHTML = `<p class="mypage-muted" role="status">예약대기 목록을 불러오지 못했습니다.</p>`;
        });
    }
  }
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
        productCode === 'prime' &&
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
      window.alert('예약대기는 공부방 프로필로만 등록할 수 있습니다.');
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
      window.alert('적용 지역을 먼저 선택해 주세요.');
      return;
    }
    try {
      const res = await registerPrimeWaitlist(profile.id, region);
      window.alert(res.message || '예약대기가 등록되었습니다.');
      window.location.hash = '#/mypage/plans/my';
    } catch (err) {
      window.alert(err?.message || '예약대기 등록에 실패했습니다.');
    }
  });

  if (path === '/plans/checkout') {
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
          throw new Error('상품 카탈로그가 준비되지 않았습니다. 새로고침 후 다시 시도해 주세요.');
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
          throw new Error('서버 결제금액이 올바르지 않습니다.');
        }
        // 클라이언트 draft 금액과 달라도 서버 판매가를 사용한다
        if (Number(draft.priceKrw) !== serverAmount) {
          console.warn('[plans/checkout] client price ignored', draft.priceKrw, '→', serverAmount);
        }
        const completed = await completePaidCheckout(created.order_ref);
        invalidateProviderStatus();
        resetAccessStatusSync();
        await hydrateProviderStatusStrict().catch(() => hydrateProviderStatus());
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
