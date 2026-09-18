// deploy-bump-7b17262
/**
 * 34?????í’ˆ?¼í„° ?”ë©´ (P18-01~07)
 * ê¸°ì¡´ plans-catalog / paid-backend / paid-checkout ?ì‚° ?¬ì‚¬??
 */

import {
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
import { getStudyRoom } from '../study-room-reg/store.js';
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
  renderBadgeAddonSection,
  productMediaClass,
  productIcon,
} from './store-ui.js';
import { renderPlansHomeBody } from './hub-home.js';
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
  const el =
    root.querySelector?.('[data-plans-apply-region]:checked:not(:disabled)') ||
    root.querySelector?.('[data-plans-apply-region]:not(:disabled)');
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
 * #/plans/access Â· #/plans/my ?„ë¡œ?„ë³„ status ?™ê¸°??(stale êµ¬ë§¤ ë°©ì?)
 * @type {{ key: string, phase: 'idle'|'loading'|'ready'|'error', error: string|null, route: string }}
 */
let plansStatusSync = { key: '', phase: 'idle', error: null, route: '' };

/** ê°™ì? hash ?¬ë Œ?”ì—??ì¤‘ë³µ hydrate ë°©ì?. ?¼ìš°?¸ë? ë²—ì–´?˜ë©´ ë¹„ìš´?? */
let lastPlansHydratedHash = '';

/** checkout ì§„ì… ???œë²„ quoteë§?ë°›ê³  ê¶Œë¦¬??? ì ?˜ì? ?ŠëŠ”?? */
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

/** @deprecated alias ??access/my ê³µìš© */
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
  const role = getPlansEffectiveRole();
  const profile = resolveSelectedProfile(q, role);
  const region = {
    regionBasisType: q.region_basis_type || '',
    regionId: q.region_id || '',
    complexId: q.complex_id || '',
    slotGroup: q.slot_group || '',
    providerType: role === 'study_room' || role === 'tutor' ? role : '',
    providerId: profile?.id || '',
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
        error: err instanceof Error ? err.message : String(err || 'status ì¡°íšŒ ?¤íŒ¨'),
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
  // total ë¯¸ì œê³????ˆë? ?”ì—¬ë§??¬ìš© (2???´í•˜)
  return n > 0 && n <= Math.max(2, Math.ceil(10 * threshold));
}

function productLabel(code) {
  const normalized = String(code || '').toLowerCase();
  if (normalized.includes('prime')) return 'Prime ?¸ì¶œ';
  if (normalized.includes('pick')) return 'Pick ?¸ì¶œ';
  if (normalized.includes('basic')) return 'Basic ?¸ì¶œ';
  if (normalized.includes('memo')) return 'ìª½ì?ê¶?;
  return '?´ìš© ?í’ˆ';
}

/** ???í’ˆÂ·???”ì•½?? êµ¬ë§¤ë©?#/plans/access)?ì„œ???¬ìš©?˜ì? ?ŠìŒ. */
function renderLowCreditBanner(tickets) {
  if (!tickets) return '';
  const warns = [];
  if (isLowCredit(tickets.memo?.remaining)) {
    warns.push(`ìª½ì?ê¶??¨ì? ?Ÿìˆ˜ ${tickets.memo.remaining}???????í’ˆ?ì„œ ?•ì¸?˜ì„¸??);
  }
  if (!warns.length) return '';
  return `
    <div class="mypage-info-box is-warn plans-low-credit" role="status">
      <strong>ìª½ì?ê¶??ˆë‚´</strong>
      <ul class="plans-tier-list">${warns.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
      <a href="#/mypage/plans/my" class="btn btn--secondary btn--sm" data-nav="/mypage/plans/my">??ìª½ì?ê¶?ë³´ê¸°</a>
    </div>`;
}

/** R2 ê³µë?ë°?Pick 5Ã—2 ë¯¸ë¦¬ë³´ê¸° ?€??(?¼ì´ë¸?ëª©ë¡ ?„ë‹˜ Â· ?˜í”Œ ?¬ì‚¬?? */
const ROOM_PICK_PREVIEW_TILES = [
  { name: '?€ì¹??‹â—‹?˜í•™', stats: 'ì¶”ì²œ 24 Â· ?„ê¸° 18' },
  { name: '??‚¼ ?‹â—‹?ì–´', stats: 'ì¶”ì²œ 19 Â· ?„ê¸° 12' },
  { name: '? ì‹¤ ?‹â—‹êµ?–´', stats: 'ì¶”ì²œ 31 Â· ?„ê¸° 22' },
  { name: '?¼ì„± ?‹â—‹ê³¼í•™', stats: 'ì¶”ì²œ 15 Â· ?„ê¸° 9' },
  { name: '?œì´ˆ ?‹â—‹?¼ìˆ ', stats: 'ì¶”ì²œ 27 Â· ?„ê¸° 16' },
  { name: '?„ê³¡ ?‹â—‹?˜í•™', stats: 'ì¶”ì²œ 21 Â· ?„ê¸° 14' },
  { name: 'ê°œí¬ ?‹â—‹?ì–´', stats: 'ì¶”ì²œ 17 Â· ?„ê¸° 11' },
  { name: 'ì²?‹´ ?‹â—‹ë¯¸ìˆ ', stats: 'ì¶”ì²œ 13 Â· ?„ê¸° 8' },
  { name: '?•êµ¬???‹â—‹?¼ì•„??, stats: 'ì¶”ì²œ 22 Â· ?„ê¸° 15' },
  { name: '?€ì¹??‹â—‹ì½”ë”©', stats: 'ì¶”ì²œ 28 Â· ?„ê¸° 19' },
];

/**
 * ê³µë?ë°?Prime ?ìœ ??(3ì¹?Â· ?¬ë¡¯ ? íƒ ?†ìŒ Â· ë§Œì„ ???ˆì•½?€ê¸°ë§Œ)
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
      <h4 class="plans-prime-board__title">? íƒ ì§€??Prime ?¸ì¶œ ?„í™©</h4>
      <p class="plans-prime-board__occupancy">3?ë¦¬ ì¤?${used}?ë¦¬ ?´ìš© ì¤?{remaining ? ` Â· ?¨ì? ?ë¦¬ ${remaining}` : ' Â· ë§Œì„'}</p>
      <p class="plans-prime-board__lead">? íƒ ì§€??˜ Prime ?€???¸ì¶œ Â· ë¹ˆìë¦¬ëŠ” ?¼ìª½ë¶€???ë™ ë°°ì •?©ë‹ˆ?? ?¬ë¡¯ ë²ˆí˜¸??ê³ ë¥´ì§€ ?ŠìŠµ?ˆë‹¤.</p>
      <ul class="plans-prime-board__cells" aria-label="Prime ?ë¦¬ 3ì¹?>
        ${cells
          .map((c) => {
            const st = c.status === 'held' ? 'held' : c.status;
            const meta =
              st === 'available'
                ? 'ë¹ˆìë¦?
                : st === 'held'
                  ? '?„ì‹œ?•ë³´'
                  : c.endsAt
                    ? `${c.endsAt} ì¢…ë£Œ ?ˆì •`
                    : '?´ìš© ì¤?;
            return `
          <li class="plans-prime-cell is-${esc(st)}">
            <span class="plans-prime-cell__label">Prime ?ë¦¬</span>
            <span class="plans-prime-cell__status">${esc(c.label)}</span>
            <span class="plans-prime-cell__meta">${esc(meta)}</span>
          </li>`;
          })
          .join('')}
      </ul>
      ${
        full
          ? `<div class="plans-prime-waitlist" data-plans-waitlist>
              <p><strong>?„ì¬ ? íƒ ì§€??˜ Prime ?ë¦¬??ëª¨ë‘ ?´ìš© ì¤‘ì…?ˆë‹¤.</strong></p>
              <p>?ˆì•½?€ê¸°ë? ?±ë¡?˜ë©´ ë¹ˆìë¦¬ê? ?´ë¦´ ???Œë ¤?œë¦½?ˆë‹¤. ?€ê¸??±ë¡ë§Œìœ¼ë¡??ë¦¬???œë²ˆ??ë³´ì¥?˜ì????Šìœ¼ë©?ê²°ì œê°€ ?„ë£Œ?˜ì–´???•ì •?©ë‹ˆ??</p>
              <button type="button" class="btn btn--primary" data-plans-waitlist-register>?ˆì•½?€ê¸??±ë¡</button>
              <p class="mypage-muted" style="margin-top:0.5rem"><a href="#/mypage/plans/my" data-nav="/mypage/plans/my">???ˆì•½?€ê¸?ë³´ê¸°</a></p>
            </div>`
          : ''
      }
    </div>`;
}

/** ê³µë?ë°?Pick 5Ã—2=10 ë¯¸ë¦¬ë³´ê¸° (?œí™˜ ëª©ë¡Â·ê³¼ì™¸??ë¯¸ì‚¬?? */
function renderRoomPickPreview() {
  return `
    <div class="plans-room-pick" aria-label="Pick ?¸ì¶œ ë¯¸ë¦¬ë³´ê¸° 5??2??>
      <p class="plans-room-pick__title">Pick ?¸ì¶œ ë¯¸ë¦¬ë³´ê¸° Â· ???˜ì´ì§€ 10ëª?(5??Ã— 2??</p>
      <ul class="plans-room-pick__grid">
        ${ROOM_PICK_PREVIEW_TILES.map(
          (p, i) => `
          <li class="plans-room-pick__tile" aria-label="Pick ë¯¸ë¦¬ë³´ê¸° ${i + 1}">
            <span class="plans-room-pick__thumb" aria-hidden="true">P${i + 1}</span>
            <span class="plans-room-pick__name">${esc(p.name)}</span>
            <span class="plans-room-pick__stats">${esc(p.stats)}</span>
          </li>`,
        ).join('')}
      </ul>
      <nav class="plans-room-pick__pager" aria-label="?˜ì´ì§€">
        <span class="is-current" aria-current="page">1</span><span>2</span><span>3</span>
      </nav>
    </div>`;
}

/** T1 ê³¼ì™¸??circulation ë¯¸ë¦¬ë³´ê¸° (?ìœ Â·ë§Œì„Â·?ˆì•½?€ê¸??†ìŒ) */
const TUTOR_PRIME_PREVIEW_TILES = [
  { name: 'ê¹€?‹â—‹', subject: '?˜í•™ Â· ê³ ë“±?™êµ', stats: 'ì¶”ì²œ 28 Â· ?„ê¸° 19' },
  { name: '?´â—‹??, subject: '?ì–´ Â· ê³ ë“±?™êµ', stats: 'ì¶”ì²œ 21 Â· ?„ê¸° 14' },
  { name: 'ë°•â—‹??, subject: 'êµ?–´ Â· ì¤‘í•™êµ?, stats: 'ì¶”ì²œ 17 Â· ?„ê¸° 11' },
];

const TUTOR_PICK_PREVIEW_TILES = [
  { name: 'ê¹€?‹â—‹', subject: '?˜í•™ Â· ê³ ë“±?™êµ', stats: 'ì¶”ì²œ 28 Â· ?„ê¸° 19' },
  { name: '?´â—‹??, subject: '?ì–´ Â· ê³ ë“±?™êµ', stats: 'ì¶”ì²œ 21 Â· ?„ê¸° 14' },
  { name: 'ë°•â—‹??, subject: 'êµ?–´ Â· ì¤‘í•™êµ?, stats: 'ì¶”ì²œ 17 Â· ?„ê¸° 11' },
  { name: 'ìµœâ—‹??, subject: 'ê³¼í•™ Â· ê³ ë“±?™êµ', stats: 'ì¶”ì²œ 15 Â· ?„ê¸° 9' },
  { name: '?•â—‹??, subject: '?¼ìˆ  Â· ê³ ë“±?™êµ', stats: 'ì¶”ì²œ 24 Â· ?„ê¸° 16' },
  { name: 'ê°•â—‹??, subject: '?˜í•™ Â· ì¤‘í•™êµ?, stats: 'ì¶”ì²œ 19 Â· ?„ê¸° 12' },
  { name: '?¤â—‹??, subject: '?ì–´ Â· ì¤‘í•™êµ?, stats: 'ì¶”ì²œ 13 Â· ?„ê¸° 8' },
  { name: '?¥â—‹??, subject: '?¬íšŒ Â· ê³ ë“±?™êµ', stats: 'ì¶”ì²œ 22 Â· ?„ê¸° 15' },
  { name: '?„â—‹??, subject: 'ì½”ë”© Â· ê³ ë“±?™êµ', stats: 'ì¶”ì²œ 18 Â· ?„ê¸° 10' },
  { name: '?œâ—‹??, subject: 'êµ?–´ Â· ê³ ë“±?™êµ', stats: 'ì¶”ì²œ 31 Â· ?„ê¸° 22' },
];

function renderTutorCircPager() {
  return `<nav class="plans-tutor-circ__pager" aria-label="?˜ì´ì§€">
        <span class="is-current" aria-current="page">1</span><span>2</span><span>3</span>
      </nav>`;
}

function renderTutorCircTiles(tiles, prefix) {
  return tiles
    .map(
      (p, i) => `
          <li class="plans-tutor-circ__tile" aria-label="${prefix} ë¯¸ë¦¬ë³´ê¸° ${i + 1}">
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
    <div class="plans-tutor-circ plans-tutor-circ--prime" aria-label="Prime ?¸ì¶œ ë¯¸ë¦¬ë³´ê¸° ?˜ì´ì§€??3ëª?>
      <div class="plans-tutor-circ__head">
        <span class="plans-tutor-circ__kicker">?µì‹¬ ?¸ì¶œ Â· ?œí™˜??/span>
        <span class="plans-tutor-circ__count">3 / page</span>
      </div>
      <p class="plans-tutor-circ__title">Prime ?œí™˜ ë¯¸ë¦¬ë³´ê¸° Â· ?˜ì´ì§€??3ëª?/p>
      <p class="plans-tutor-circ__rotate">? íƒ ?œÂ·ì£¼?¥ê³¼ëª??ìª½ ?¸ì¶œ Â· 15ë¶„ë§ˆ??ê³µì • ?œí™˜ Â· ?˜ì´ì§€ ?˜ê?</p>
      <ul class="plans-tutor-circ__grid">
        ${renderTutorCircTiles(TUTOR_PRIME_PREVIEW_TILES, 'T')}
      </ul>
      ${renderTutorCircPager()}
    </div>`;
}

function renderTutorPickCirculation() {
  return `
    <div class="plans-tutor-circ plans-tutor-circ--pick" aria-label="Pick ?¸ì¶œ ë¯¸ë¦¬ë³´ê¸° ?˜ì´ì§€??10ëª?>
      <div class="plans-tutor-circ__head">
        <span class="plans-tutor-circ__kicker">ì¶”ì²œ ?¸ì¶œ Â· ?œí™˜??/span>
        <span class="plans-tutor-circ__count">10 / page</span>
      </div>
      <p class="plans-tutor-circ__title">Pick ?œí™˜ ë¯¸ë¦¬ë³´ê¸° Â· ?˜ì´ì§€??10ëª?/p>
      <p class="plans-tutor-circ__rotate">? íƒ ?œÂ·ì£¼?¥ê³¼ëª?ì¶”ì²œ ?¸ì¶œ Â· 15ë¶„ë§ˆ??ê³µì • ?œí™˜ Â· ?˜ì´ì§€ ?˜ê?</p>
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
  if (role === 'study_room') return 'ê³µë?ë°?;
  if (role === 'tutor') return 'ê³¼ì™¸??;
  if (role === 'parent') return '?™ìƒ';
  return 'ë¹„ë¡œê·¸ì¸';
}

/** @param {import('./profiles.js').ProviderProfile | null} profile */
function renderProfileBanner(profile, role) {
  if (role === 'guest') {
    return `
      <div class="mypage-info-box plans-profile-banner">
        <strong>?ìš© ?€??/strong>
        <p>ë¹„ë¡œê·¸ì¸ Â· ?í’ˆ ?Œê°œë§?ë³????ˆìŠµ?ˆë‹¤. êµ¬ë§¤??ê³µê¸‰??ë¡œê·¸????ì§„í–‰?©ë‹ˆ??</p>
        <a href="${AUTH_UI_BASE}/#/login" class="btn btn--primary btn--sm" data-same-tab-href="${AUTH_UI_BASE}/#/login">ë¡œê·¸??/a>
      </div>`;
  }
  if (role === 'parent') {
    return `
      <div class="mypage-info-box plans-profile-banner">
        <strong>?ìš© ?€??/strong>
        <p>?™ìƒ ê³„ì •?€ ? ë£Œ?í’ˆ êµ¬ë§¤ ì£¼ì²´ê°€ ?„ë‹™?ˆë‹¤. FAQ?ì„œ ?ˆë‚´ë§??•ì¸?˜ì„¸??</p>
        <a href="#/support/faq" class="btn btn--secondary btn--sm" data-nav="/support/faq">?ì£¼ ë¬»ëŠ” ì§ˆë¬¸</a>
      </div>`;
  }
  if (!profile) {
    const profiles = listProviderProfiles(role);
    if (!profiles.length) {
      return `
        <div class="mypage-info-box plans-profile-banner is-warn">
          <strong>?ìš© ?„ë¡œ??/strong>
          <p>?±ë¡??${esc(roleLabel(role))} ?„ë¡œ?„ì´ ?†ìŠµ?ˆë‹¤. ?ì„¸?±ë¡??ë¨¼ì? ?„ë£Œ??ì£¼ì„¸??</p>
          <a href="#/mypage/registrations" class="btn btn--secondary btn--sm" data-nav="/mypage/registrations">???±ë¡?¼ë¡œ</a>
        </div>`;
    }
    return `
      <div class="mypage-info-box plans-profile-banner">
        <strong>?ìš© ?„ë¡œ?„ì„ ? íƒ?˜ì„¸??/strong>
        <p class="mypage-muted">ê°™ì? ??• ???„ë¡œ?„ì´ ?¬ëŸ¬ ê°œì…?ˆë‹¤. ?ìš©???„ë¡œ?„ì„ ê³ ë¥¸ ???í’ˆ??? íƒ?©ë‹ˆ??</p>
        <ul class="plans-profile-pick">
          ${profiles
            .map(
              (p) => `
            <li>
              <a class="btn btn--secondary btn--sm" href="${buildPlansHref(window.location.hash.slice(1).split('?')[0] || '/plans', {
                provider_type: p.providerType,
                provider_id: p.id,
              })}" data-plans-nav-query>${esc(p.label)} Â· ${esc(p.status || '')}</a>
            </li>`,
            )
            .join('')}
        </ul>
      </div>`;
  }
  return `
    <div class="mypage-info-box plans-profile-banner is-active">
      <strong>?ìš© ?„ë¡œ??/strong>
      <p><span class="plans-profile-name">${esc(profile.label)}</span>
        <span class="mypage-muted">Â· ${esc(roleLabel(profile.providerType))} Â· ${esc(profile.status || '')}</span>
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
      return { canBuy: false, missing: ['ìª½ì?ê¶Œì? ê³µë?ë°©Â·ê³¼?¸ìŒ¤ë§?êµ¬ë§¤?????ˆìŠµ?ˆë‹¤'] };
    }
    if (profile.providerType === 'tutor') {
      const tutor = getTutor(Number(profile.id));
      if (!tutor) {
        return { canBuy: false, missing: ['?„ë¡œ?„ì„ ì°¾ì„ ???†ìŠµ?ˆë‹¤'] };
      }
    } else {
      const room = getStudyRoom(Number(profile.id));
      if (!room) {
        return { canBuy: false, missing: ['?„ë¡œ?„ì„ ì°¾ì„ ???†ìŠµ?ˆë‹¤'] };
      }
    }
    return { canBuy: true, missing: [] };
  }

  if (profile.providerType === 'study_room') {
    const room = getStudyRoom(Number(profile.id));
    if (!room) {
      return { canBuy: false, missing: ['?„ë¡œ?„ì„ ì°¾ì„ ???†ìŠµ?ˆë‹¤'] };
    }
    if (room.profile_status !== 'published') {
      missing.push('ê³µê°œ(published) ?íƒœê°€ ?„ìš”?©ë‹ˆ??Â· ?±ë¡?ê??ì„œ ?Œê³µê°œí•˜ê¸°ã€?);
      canBuy = false;
    }
    // Pick/Prime ?ê²©ë§??…ë ¥ ?„ì„±?„ë? ë³¸ë‹¤. ê³µê°œÂ·ìª½ì??€ ë¶„ë¦¬.
    if (productCode === 'prime' || productCode === 'pick') {
      if (room.detail_completion_status !== 'expanded_complete') {
        missing.push(
          `${productCode === 'prime' ? 'Prime' : 'Pick'} ?•ë³´ ë¶€ì¡?Â· ?±ë¡?ê??ì„œ ?¨ì? ??ª©??ì±„ìš°ë©?êµ¬ë§¤ê°€ ?´ë¦½?ˆë‹¤`,
        );
        canBuy = false;
      }
      const apply = getApplyTargetReadiness(profile, 'study_room');
      if (!apply.regionReady) {
        missing.push('?€???ë³´ì§€???‰ì •?™Â·ë‹¨ì§€ ID)???„ìš”?©ë‹ˆ??Â· ê¸°ë³¸?•ë³´?ì„œ ì§€??„ ?¤ì‹œ ?€?¥í•˜?¸ìš”');
        canBuy = false;
      }
    }
  } else {
    const tutor = getTutor(Number(profile.id));
    if (!tutor) {
      return { canBuy: false, missing: ['?„ë¡œ?„ì„ ì°¾ì„ ???†ìŠµ?ˆë‹¤'] };
    }
    if (tutor.profile_status !== 'published') {
      missing.push('ê³µê°œ(published) ?íƒœê°€ ?„ìš”?©ë‹ˆ??);
      canBuy = false;
    }
    // ê³¼ì™¸??êµ¬ë§¤ ì°¨ë‹¨?€ ?¸ì¶œì¶??œÂ·ì£¼?¥ê³¼ëª?ë§? ?Œê°œë¬¸Â·ì¹´??ì¹´í”¼ ?„ì„±?„ëŠ” ?±ê³¼ ë¶ˆì´??
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
  // ê³µë?ë°?Primeë§??¬ê³ . PickÂ·ê³¼ì™¸?¤ì? ?œí™˜????ë§¤ì§„/?¬ë¡¯ UI ê¸ˆì?
  const roomPrimeOnly = role === 'study_room' && product.productCode === 'prime';
  const inv = roomPrimeOnly ? resolveRoomPrimeInventory(slots) : null;
  const slot = roomPrimeOnly && inv ? getSlotForProduct(product.productCode, inv, role) : null;
  const soldOut = roomPrimeOnly && slot != null && slot.remaining <= 0;
  const isPrime = product.productCode === 'prime';
  const isPick = product.productCode === 'pick';
  const primaryCta = opts.primaryCta ?? isPrime;
  const displayName =
    product.name || (isPrime ? 'Prime ?¸ì¶œ' : isPick ? 'Pick ?¸ì¶œ' : productLabel(product.productCode));
  const isStorefront = layout === 'storefront' || layout === 'compact';

  if (!implemented) {
    return `
      <li class="plans-card plans-catalog__item is-placeholder">
        <div class="plans-card__body">
          <h3 class="plans-card__name">${esc(displayName)}</h3>
          <p class="plans-card__tagline">${esc(product.tagline)}</p>
          <button type="button" class="btn btn--secondary" disabled>ì¤€ë¹„ì¤‘</button>
        </div>
      </li>`;
  }

  const options = product.options || [];
  const eligibility = profile
    ? getEligibility(profile, product.productCode)
    : { canBuy: false, missing: ['?ìš© ?„ë¡œ?„ì„ ë¨¼ì? ? íƒ?˜ì„¸??] };
  if (soldOut) {
    eligibility.canBuy = false;
    eligibility.missing = [
      ...eligibility.missing.filter((m) => !String(m).includes('?¬ë¡¯') && !String(m).includes('ë§ˆê°')),
      '?„ì¬ ì§€??Prime ?ë¦¬ê°€ ëª¨ë‘ ?´ìš© ì¤‘ì…?ˆë‹¤. ?„ë˜?ì„œ ?ˆì•½?€ê¸°ë? ?±ë¡?˜ì„¸??',
    ];
  }
  const missingHtml =
    canPurchaseUi && eligibility.missing.length
      ? `<ul class="plans-eligibility plans-eligibility--soft">${eligibility.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`
      : '';

  const boardHtml = embedBoard && roomPrimeOnly && inv ? renderRoomPrimeBoard(inv.prime) : '';

  const footNote = (() => {
    if (role === 'study_room' && isPick) return '? íƒ ì§€??—??10ê°œì”© ?œí™˜ ?¸ì¶œ';
    if (role === 'tutor' && isPrime) return '? íƒ ?œÂ·ì£¼?¥ê³¼ëª©ì—??3ê°œì”© ?œí™˜ ?¸ì¶œ';
    if (role === 'tutor' && isPick) return '? íƒ ?œÂ·ì£¼?¥ê³¼ëª©ì—??10ê°œì”© ?œí™˜ ?¸ì¶œ';
    if (role === 'study_room' && isPrime) return '? íƒ ì§€??˜ Prime ?€???¸ì¶œ';
    return '';
  })();

  const pickPreviewHtml =
    embedPickPreview && isPick
      ? `<div class="plans-pick-preview" aria-label="Pick ?¸ì¶œ ë¯¸ë¦¬ë³´ê¸° 5??2??>
        <p class="plans-pick-preview__label">Pick ?¸ì¶œ ë¯¸ë¦¬ë³´ê¸° Â· 5??Ã— 2??/p>
        <ul class="plans-pick-preview__grid">
          ${Array.from({ length: 10 }, (_, i) => `<li class="plans-pick-preview__cell">P${i + 1}</li>`).join('')}
        </ul>
        <nav class="plans-pick-preview__pager" aria-label="?˜ì´ì§€">
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
            <span class="plans-period-card__memo">${memo > 0 ? `ìª½ì?ê¶?${memo}???¬í•¨` : footNote || '\u00a0'}</span>
            ${amt.testMode ? `<span class="plans-period-card__test">?œí—˜ ${esc(formatKrw(amt.chargeKrw))}</span>` : ''}
          </button>
        </li>`;
    })
    .join('');
  const optionSelect = `
    <div class="plans-period" role="group" aria-label="ê¸°ê°„ ? íƒ">
      <p class="plans-period__label">ê¸°ê°„ ? íƒ</p>
      <ul class="plans-period-grid">${periodCards}</ul>
      ${periodReason ? `<p class="plans-period__reason">${esc(periodReason)}</p>` : ''}
      <p class="plans-period__vat">?œì‹œê°€ Â· VAT ?¬í•¨ ?ˆì • Â· ê¸°ê°„ ì¹´ë“œë¥??„ë¥´ë©?ì£¼ë¬¸ ?”ì•½??ë°˜ì˜?©ë‹ˆ??/p>
      <label class="plans-card__pick plans-card__pick--sr">
        <span class="plans-card__pick-label">ê¸°ê°„ ? íƒ</span>
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
      ? `<button type="button" class="btn btn--secondary plans-card__cta" disabled>?ˆì•½?€ê¸°ë§Œ ê°€??/button>`
      : `<button type="button" class="${ctaClass}" data-plans-select-product
         data-product-code="${esc(product.productCode)}"
         title="???í’ˆ??ì£¼ë¬¸ ?”ì•½??ë°˜ì˜">???í’ˆ ? íƒ</button>`
    : `<a href="${AUTH_UI_BASE}/#/login" class="btn btn--secondary plans-card__cta" data-same-tab-href="${AUTH_UI_BASE}/#/login">ë¡œê·¸????êµ¬ë§¤</a>`;

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
  return option.apiVariant === '1?? || /^1??.test(String(option.label || ''));
}

function ticketCount(option) {
  const n = Number(option?.creditCount);
  if (n > 0) return n;
  if (isImmediateTicket(option)) return 1;
  const m = String(option?.label || option?.apiVariant || '').match(/(\d+)\s*??);
  return m ? Number(m[1]) : 0;
}

function ticketProductName(option) {
  if (!option) return 'ìª½ì?ê¶?;
  if (isImmediateTicket(option)) return '1??ì¦‰ì‹œê¶?;
  const n = ticketCount(option);
  if (n === 5) return '5?Œê¶Œ';
  if (n === 10) return '10?Œê¶Œ';
  return String(option.label || 'ìª½ì?ê¶?);
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
    : { canBuy: false, missing: ['?ìš© ?„ë¡œ?„ì„ ë¨¼ì? ? íƒ?˜ì„¸??] };
  const selectedOptionId = opts.selectedOptionId || '';

  const missingHtml =
    isProvider && eligibility.missing.length
      ? `<ul class="plans-eligibility">${eligibility.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`
      : '';

  const ticketCards = options
    .map((o) => {
      const amt = resolveCheckoutAmount(o.priceKrw);
      const priceNote = amt.testMode
        ? `${formatKrw(o.priceKrw)} (?œí—˜ ${formatKrw(amt.chargeKrw)})`
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
        ? `?Œë‹¹ ${formatKrw(per)} Â· ${savePct}% ?ˆì•½`
        : isImmediate
          ? '\u00a0'
          : '';
      const meta = isImmediate
        ? 'ê²°ì œ ??ë°”ë¡œ ë°œì†¡ Â· ?¨ì? ?Ÿìˆ˜ë¡?ë³´ê??˜ì? ?ŠìŠµ?ˆë‹¤'
        : 'êµ¬ë§¤?¼ë???120??;
      const lock =
        packLocked && activePaidPack
          ? `<span class="plans-ticket-card__lock">êµ¬ë§¤?????†ìŠµ?ˆë‹¤. ?¬ìš© ì¤‘ì¸ ë¬¶ìŒê¶Œì˜ ?¨ì? ?Ÿìˆ˜ë¥?ëª¨ë‘ ?°ê±°???¬ìš©ê¸°í•œ??ì§€????êµ¬ë§¤?˜ì„¸??</span>`
          : '';
      const aria = packLocked && activePaidPack
        ? `${name} ${priceNote}. ?¬ìš© ì¤‘ì¸ ìª½ì?ê¶Œì´ ?ˆì–´ êµ¬ë§¤?????†ìŠµ?ˆë‹¤.`
        : `${name} ${priceNote}`;
      return `
        <li class="plans-ticket-card${selected ? ' is-selected' : ''}${packLocked ? ' is-disabled' : ''}">
          <button type="button" class="plans-ticket-card__btn" data-plans-ticket-option="${esc(o.optionId)}"
            data-product-code="${esc(product.productCode)}"
            ${packLocked ? 'disabled' : ''} aria-pressed="${selected ? 'true' : 'false'}"
            aria-label="${esc(aria)}">
            <span class="plans-ticket-card__count" aria-hidden="true">${esc(String(countNum))}??/span>
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
         ${buyDisabled ? 'disabled' : ''}>???í’ˆ ? íƒ</button>`
    : role === 'guest'
      ? `<a href="${AUTH_UI_BASE}/#/login" class="btn btn--secondary plans-card__cta" data-same-tab-href="${AUTH_UI_BASE}/#/login">ë¡œê·¸????êµ¬ë§¤</a>`
      : `<button type="button" class="btn btn--secondary plans-card__cta" disabled>êµ¬ë§¤ ë¶ˆê?</button>`;

  const hiddenSelect = `
    <label class="plans-card__pick plans-card__pick--sr">
      <span class="plans-card__pick-label">ìª½ì?ê¶?? íƒ</span>
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
      <span>?œí—˜ ê²°ì œ ?”ë©´ (?¤ì œ PG ?°ë™ ??Â· ê¸ˆì•¡?€ ?œë²„ ?ë§¤ê°€)</span>
    </label>`;
}

/** P18-01 ?í’ˆ?????ˆë‚´Â·ì§„ì… ?ˆë¸Œ. êµ¬ë§¤ UI???ì„¸?ë§Œ. */
export function renderPlansHome() {
  return renderPlansHomeBody({
    noticesHtml: renderProviderNoticeBanners(),
  });
}

/** P18-02 ?¸ì¶œ?í’ˆ */
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
  const periodLabel = selectedOption?.label || selectedOption?.apiVariant || '1ê°œì›”';
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
      value: price != null ? formatKrw(price) : '??,
      priceKrw: price || 0,
    };
  });
  const positionAmt = selectedOption ? resolveCheckoutAmount(selectedOption.priceKrw) : null;
  const badgeSum = badgeLines.reduce((n, b) => n + (b.priceKrw || 0), 0);
  const displayTotal =
    positionAmt != null ? positionAmt.displayKrw + badgeSum : null;
  const orderRows = buildPositionOrderRows({
    profileLabel: profile ? profile.label : 'ë¯¸ì„ ??,
    roleText: role === 'study_room' ? 'ê³µë?ë°? : role === 'tutor' ? 'ê³¼ì™¸?? : roleLabel(role),
    productName: selectedProduct?.name || productLabel(selectedCode),
    regionValue:
      selectedRegionScope?.label ||
      (role === 'tutor' ? (applyReady ? '??ë¯¸ì„ ?? : '?œë™ ?œÂ·ì£¼?¥ê³¼ëª??„ìš”') : applyReady ? '?? : 'ë¯¸ì„ ??),
    periodLabel,
    periodRangeText: periodPreview ? `${periodPreview.startedOn} ~ ${periodPreview.endsOn}` : 'ê²°ì œ ?„ë£Œ ?œì ë¶€??(?œë²„ ?•ì •)',
    listPriceText:
      selectedOption && Number(selectedOption.discountKrw) > 0 && Number(selectedOption.listPriceKrw) > 0
        ? formatKrw(selectedOption.listPriceKrw)
        : '',
    positionPriceText: positionAmt
      ? positionAmt.testMode
        ? `${formatKrw(selectedOption.priceKrw)} (?œí—˜ ${formatKrw(positionAmt.chargeKrw)})`
        : formatKrw(selectedOption.priceKrw)
      : '??,
    discountText: selectedOption?.discountLabel || '',
    memoBundleText:
      Number(selectedOption?.memoBundle) > 0 ? `ìª½ì?ê¶?${selectedOption.memoBundle}???¬í•¨` : '',
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
          title: '?¸ì¶œ?í’ˆ',
          lead: '??ì¢‹ì? ?ë¦¬?ì„œ ?™ë?ëª¨Â·í•™?ì—ê²?ë°œê²¬??ê¸°íšŒë¥??œê³µ?©ë‹ˆ??\në§ˆì´?µì„ ë§Œë“¤ê³?Basic ëª©ë¡???¸ì¶œ?˜ëŠ” ê²ƒì? ë¬´ë£Œ?…ë‹ˆ??\n?„ìš”??ê¸°ê°„ë§?ê²°ì œ?˜ë©° ?ë™?¼ë¡œ ?°ì¥?˜ì? ?ŠìŠµ?ˆë‹¤.',
          sub: 'Prime ?¸ì¶œê³?Pick ?¸ì¶œ?€ ?ˆÂ·ì°¾ê¸??”ë©´?ì„œ ?„ë¡œ?„ì„ ????ë°œê²¬?????ˆë„ë¡??•ëŠ” ? ë£Œ ?¸ì¶œ?í’ˆ?…ë‹ˆ??',
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
                    ? '? íƒ???œì? ì£¼ë ¥ê³¼ëª©??Prime ?ì—­???˜ì´ì§€??3ëª…ì”© ?¸ì¶œ?˜ë©°, 15ë¶„ë§ˆ??ê³µì •?˜ê²Œ ?œí™˜?©ë‹ˆ??'
                    : '? íƒ???¨ì?Â·?‰ì •?™ì˜ Prime ?€???ë¦¬ë¥??•ë³´?˜ì„¸?? Prime?€ ? íƒ ì§€??—??3ê°œë§Œ ?´ì˜?˜ëŠ” ?œì • ?€???¸ì¶œ?…ë‹ˆ??',
                  0,
                )}
          ${renderOffer(
            pickProduct,
            role === 'tutor'
              ? '???˜ì´ì§€??10ëª…ì”© ?¸ì¶œ?˜ë©°, 15ë¶„ë§ˆ??ê³µì •?˜ê²Œ ?œí™˜?©ë‹ˆ??'
              : '? íƒ??ì§€??˜ ì¶”ì²œ ?ì—­?ì„œ ê³ ë¥´ê²?ë°œê²¬?˜ì„¸?? ???˜ì´ì§€??10ê°œì”© ?¸ì¶œ?˜ë©°, 15ë¶„ë§ˆ??ê³µì •?˜ê²Œ ?œí™˜?©ë‹ˆ??',
            primeProduct ? 1 : 0,
          )}
          ${restProducts
            .map((p, i) =>
              renderOffer(p, p.tagline || p.name || productLabel(p.productCode), (primeProduct ? 1 : 0) + (pickProduct ? 1 : 0) + i),
            )
            .join('')}`
              : `<div class="plans-sf-empty" role="status">?œì‹œ???¸ì¶œ?í’ˆ???†ìŠµ?ˆë‹¤. ì¹´íƒˆë¡œê·¸ë¥??¤ì‹œ ë¶ˆëŸ¬?€ ì£¼ì„¸??</div>`
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
          ${renderApplyTargetBlock(profile, role, 'positions', {
            productCode: selectedCode,
            primeScopes: Array.isArray(slots?.prime_scopes) ? slots.prime_scopes : [],
          })}
        </div>

        <aside class="plans-storefront__summary" aria-label="ì£¼ë¬¸ ?”ì•½">
          ${renderOrderSummaryBlock({
            family: 'position',
            rows: orderRows,
            totalLabel: 'ê²°ì œ ?ˆì •(?œì‹œê°€Â·?œë²„ ?¬ê?ì¦?',
            totalValue: displayTotal != null ? formatKrw(displayTotal) : '??,
            ctaDisabled: orderCtaDisabled,
            ctaLabel: roomPrimeSoldOut ? '?ˆì•½?€ê¸°ë§Œ ê°€?? : 'êµ¬ë§¤?˜ê¸°',
            note: '?œì‘?¼Â·ì¢…ë£Œì¼?€ ê²°ì œ ?„ë£Œ ???œë²„ ?•ì • Â· ?ë™?°ì¥ ?†ìŒ Â· ?œì‹œê°€??ì°¸ê³ ?´ë©° ê²°ì œ ì§ì „ ?œë²„ê°€ ?¬ê?ì¦í•©?ˆë‹¤.',
          })}
        </aside>
      </div>

      <div class="plans-storefront__foot">
        ${renderPolicyAccordion('position')}
        ${role === 'study_room' || role === 'tutor' ? renderTestModeToggle() : ''}
      </div>
    </section>`;
}

/** P18-03 ìª½ì?ê¶?*/
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
            p.status === '?¬ìš© ì¤? &&
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
          ? `${formatKrw(selectedOpt.priceKrw)} (?œí—˜ ${formatKrw(amt.chargeKrw)})`
          : formatKrw(selectedOpt.priceKrw);
      })()
    : '??;
  const summaryRows = [
    { label: '?í’ˆ', value: productName },
    { label: '?Ÿìˆ˜', value: countN ? `${countN}?? : '?? },
    { label: 'ê°€ê²?, value: priceText },
    ...(isImmediateTicket(selectedOpt)
      ? [{ label: 'ë°œì†¡', value: 'ê²°ì œ ??ë°”ë¡œ ë°œì†¡ Â· ?¨ì? ?Ÿìˆ˜ë¡?ë³´ê??˜ì? ?ŠìŠµ?ˆë‹¤' }]
      : [
          { label: '?¬ìš©ê¸°í•œ', value: 'êµ¬ë§¤?¼ë???120?? },
          { label: '?Œë©¸', value: '?¬ìš©ê¸°í•œ ê²½ê³¼ ???¨ì? ?Ÿìˆ˜ ?Œë©¸ Â· ?˜ë¶ˆÂ·?°ì¥ ?†ìŒ' },
        ]),
    { label: '?ìš© ?„ë¡œ??, value: profile ? profile.label : 'ë¯¸ì„ ?? },
  ];

  return `
    <section class="plans-store plans-storefront plans-sf plans-sf--access" data-plans-access>
      <header class="plans-sf-hero">
        ${renderPlansHero({
          eyebrow: 'PAID PRODUCTS',
          title: 'ê³µë?ë°©Â·ê³¼?¸ìŒ¤ ìª½ì?ê¶?,
          lead: '',
        })}
      </header>

      <div class="plans-storefront__body">
        <div class="plans-storefront__catalog">
          <section class="plans-access-explain" aria-label="ìª½ì?ê¶??µì‹¬ ?ˆë‚´">
            <strong class="plans-access-explain__lead">?™ìƒ?ê²Œ ë¨¼ì? ë³´ë‚´??ì²?ìª½ì?ë§?ì°¨ê°?©ë‹ˆ??/strong>
            <ul class="plans-access-explain__list">
              <li>?™ìƒ?ê²Œ ë¨¼ì? ë³´ë‚´??ì²?ìª½ì?ë§?ì°¨ê°?©ë‹ˆ??</li>
              <li>ê°™ì? ?€?”ë°©?ì„œ ì£¼ê³ ë°›ëŠ” ?„ì† ìª½ì???ëª¨ë‘ ë¬´ë£Œ?…ë‹ˆ??</li>
              <li>?™ìƒÂ·?™ë?ëª¨ê? ë¨¼ì? ë³´ë‚¸ ìª½ì??€ ê·¸ì— ?€???µì¥??ë¬´ë£Œ?…ë‹ˆ??</li>
            </ul>
          </section>

          ${renderAccessAuxLinks()}

          ${role === 'tutor' || role === 'study_room' ? renderApplyTargetBlock(profile, role, 'access') : ''}
          ${role === 'guest' || role === 'parent' ? renderProfileBanner(null, role) : ''}
          ${
            syncLoading || syncPending
              ? `<p class="plans-sf-status" data-plans-access-status="loading">ìª½ì?ê¶??íƒœë¥??•ì¸?˜ëŠ” ì¤‘ì…?ˆë‹¤. 5?Œê¶ŒÂ·10?Œê¶Œ êµ¬ë§¤??? ì‹œ ??ê°€?¥í•©?ˆë‹¤.</p>`
              : ''
          }
          ${
            syncError
              ? `<p class="plans-sf-status plans-sf-status--error" role="alert" data-plans-access-status="error">ìª½ì?ê¶??íƒœë¥?ë¶ˆëŸ¬?¤ì? ëª»í•´ 5?Œê¶ŒÂ·10?Œê¶Œ êµ¬ë§¤ë¥?ë§‰ì•˜?µë‹ˆ?? <button type="button" class="btn btn--secondary btn--sm" data-plans-access-retry>?¤ì‹œ ?œë„</button></p>`
              : ''
          }

          <section class="plans-sf-panel plans-ticket-select">
            <header class="plans-sf-panel__head">
              <h2 class="plans-sf-panel__title">ìª½ì?ê¶?? íƒ</h2>
              <p class="plans-sf-panel__lead">1??ì¦‰ì‹œê¶?Â· 5?Œê¶Œ Â· 10?Œê¶Œ ì¤??„ìš”??ë§Œí¼ë§?? íƒ?˜ì„¸??</p>
            </header>
            ${
              activePaidPack
                ? `<div class="plans-access-hold" data-plans-access-status="active-pack" role="status">
              <p>?¬ìš© ì¤‘ì¸ ìª½ì?ê¶Œì´ ?ˆìŠµ?ˆë‹¤. ?¨ì? ?Ÿìˆ˜ë¥?ëª¨ë‘ ?¬ìš©?˜ê±°???¬ìš©ê¸°í•œ??ì§€??????ë¬¶ìŒê¶Œì„ êµ¬ë§¤?????ˆìŠµ?ˆë‹¤.</p>
              <p>5?Œê¶Œê³?10?Œê¶Œ?€ ì§€ê¸??????†ìŠµ?ˆë‹¤. 1??ì¦‰ì‹œê¶Œì? ê³„ì† êµ¬ë§¤?????ˆìŠµ?ˆë‹¤.</p>
              <p class="plans-access-hold__nav"><a class="plans-access-aux__link" href="#/mypage/plans/my" data-nav="/mypage/plans/my">??ìª½ì?ê¶?ë³´ê¸°</a></p>
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

        <aside class="plans-storefront__summary" aria-label="ì£¼ë¬¸ ?”ì•½">
          ${renderOrderSummaryBlock({
            family: 'access',
            rows: summaryRows,
            totalLabel: 'ê²°ì œ ?ˆì •(?œì‹œê°€)',
            totalValue: selectedOpt
              ? formatKrw(resolveCheckoutAmount(selectedOpt.priceKrw).displayKrw)
              : '??,
            ctaDisabled: !canBuy,
            ctaLabel: selectedPackLocked ? 'ë¬¶ìŒê¶??´ìš© ì¤? : 'êµ¬ë§¤?˜ê¸°',
          })}
        </aside>
      </div>

      <div class="plans-storefront__foot">
        ${renderPolicyAccordion('access')}
        ${role === 'tutor' || role === 'study_room' ? renderTestModeToggle() : ''}
      </div>
    </section>`;
}

/** P18-04 ???í’ˆ */
export function renderPlansMy() {
  const role = getPlansEffectiveRole();
  if (role === 'parent' || role === 'guest') {
    return `
      <section class="mypage-panel">
        <p class="mypage-lead">???í’ˆ</p>
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
      <p class="mypage-lead">???í’ˆ ?´ìš© ?„í™©</p>
      ${renderProviderNoticeBanners()}
      ${
        syncLoading || syncPending
          ? `<p class="mypage-info-box" data-plans-my-status="loading">ìª½ì?ê¶ŒÂ·ìƒ???íƒœë¥??•ì¸?˜ëŠ” ì¤‘ì…?ˆë‹¤.</p>`
          : ''
      }
      ${
        syncError
          ? `<p class="mypage-info-box" role="alert" data-plans-my-status="error">?í’ˆ ?íƒœë¥?ë¶ˆëŸ¬?¤ì? ëª»í–ˆ?µë‹ˆ?? <button type="button" class="btn btn--secondary btn--sm" data-plans-my-retry>?¤ì‹œ ?œë„</button></p>`
          : ''
      }
      ${role === 'tutor' || role === 'study_room' ? renderLowCreditBanner(tickets) : ''}
      <h2 class="mypage-subhead">?´ìš©ì¤??¸ì¶œ?í’ˆ</h2>
      ${
        syncReady
          ? positions.length
            ? `<table class="plans-table" aria-label="?´ìš©ì¤??¸ì¶œ?í’ˆ">
              <thead><tr><th>?í’ˆ</th><th>?”ì—¬</th><th>ì¢…ë£Œ??/th><th></th></tr></thead>
              <tbody>
                ${positions
                  .map(
                    (p) => `
                  <tr>
                    <td><strong>${esc(productLabel(p.sku))}</strong></td>
                    <td>${p.days_left}??/td>
                    <td>${esc(String(p.ends_on || p.ends_at || '').slice(0, 10))}</td>
                    <td><a href="#/plans/positions" class="btn btn--secondary btn--sm" data-plans-nav="/plans/positions">?¬êµ¬ë§?/a></td>
                  </tr>`,
                  )
                  .join('')}
              </tbody>
            </table>`
            : `<div class="mypage-info-box"><p>${esc(P18_EXPOSURE_STATUS.basic)}</p>
              <a href="#/plans/positions" class="btn btn--primary btn--sm" data-plans-nav="/plans/positions">?¸ì¶œ?í’ˆ ë³´ê¸°</a>
            </div>`
          : `<p class="mypage-muted">?¸ì¶œ?í’ˆ ?•ë³´???íƒœ ?•ì¸ ???œì‹œ?©ë‹ˆ??</p>`
      }
      ${role === 'tutor' || role === 'study_room' ? renderProfileBanner(profile, role) : ''}
      <h2 class="mypage-subhead">ìª½ì?ê¶?/h2>
      ${
        !syncReady
          ? `<p class="mypage-muted" data-plans-my-status="packs-pending">ìª½ì?ê¶?ëª©ë¡?€ ?íƒœ ?•ì¸ ???œì‹œ?©ë‹ˆ??</p>`
          : packs.length
            ? `<table class="plans-table" aria-label="ìª½ì?ê¶? data-plans-my-status="packs-ready">
              <thead><tr><th>?„ë¡œ??/th><th>?í’ˆ</th><th>ì¶œì²˜</th><th>ë¶€??/th><th>?¨ì? ?Ÿìˆ˜</th><th>ë¶€?¬ì¼</th><th>?¬ìš©ê¸°í•œ</th><th>?íƒœ</th></tr></thead>
              <tbody>
                ${packs
                  .map(
                    (p) => `
                  <tr data-plans-pack-row data-plans-pack-grant="${esc(String(p.grant_label || ''))}" data-plans-pack-status="${esc(String(p.status || ''))}" data-plans-pack-granted="${esc(String(p.granted_count ?? ''))}" data-plans-pack-remaining="${esc(String(p.remaining ?? ''))}" data-plans-pack-provider="${esc(String(p.provider_id ?? ''))}">
                    <td>${esc(p.provider_type || 'ë¯¸í™•??)} #${esc(String(p.provider_id ?? ''))}</td>
                    <td>${esc(p.product_name || '')}</td>
                    <td>${esc(p.grant_label || '')}</td>
                    <td>${p.granted_count ?? '??}</td>
                    <td>${p.remaining ?? '??}</td>
                    <td>${esc(String(p.purchased_at || '').slice(0, 10))}</td>
                    <td data-plans-pack-expires>${esc(String(p.expires_at || '').slice(0, 10))}</td>
                    <td>${esc(p.status || '')}</td>
                  </tr>`,
                  )
                  .join('')}
              </tbody>
            </table>
            <p class="mypage-muted"><a href="#/plans/access" data-plans-nav="/plans/access">ìª½ì?ê¶?ì¶©ì „?˜ê¸°</a></p>`
            : `<p class="mypage-muted" data-plans-my-status="packs-empty">???„ë¡œ?„ì— ?œì‹œ??ìª½ì?ê¶Œì´ ?†ìŠµ?ˆë‹¤. Â· <a href="#/plans/access" data-plans-nav="/plans/access">ìª½ì?ê¶?ì¶©ì „?˜ê¸°</a></p>`
      }
      ${
        role === 'study_room' && profile
          ? `<h2 class="mypage-subhead">Prime ?ˆì•½?€ê¸?/h2>
            <div class="plans-my-waitlist" data-plans-my-waitlist data-study-room-id="${esc(String(profile.id))}">
              <p class="mypage-muted">?ˆì•½?€ê¸?ëª©ë¡??ë¶ˆëŸ¬?¤ëŠ” ì¤‘â€?/p>
            </div>`
          : ''
      }
      <h2 class="mypage-subhead">ë°˜ì‘ ?”ì•½</h2>
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
        <a href="#/mypage/plans/history" class="btn btn--secondary" data-nav="/mypage/plans/history">ê²°ì œ?´ì—­</a>
        <a href="#/mypage/plans" class="btn btn--secondary" data-nav="/mypage/plans">?´ìš© ?„í™©</a>
      </div>
    </section>`;
}

/** P18-05 ê²°ì œ?´ì—­ */
export function renderPlansHistory() {
  const role = getPlansEffectiveRole();
  if (role === 'parent' || role === 'guest') {
    return `
      <section class="mypage-panel">
        <p class="mypage-lead">ê²°ì œ?´ì—­</p>
        ${renderProfileBanner(null, role)}
      </section>`;
  }

  const rows = historyCache.loaded ? historyCache.rows : getHistoryRows();
  const sourceNote = historyCache.loaded
    ? historyCache.fromApi
      ? '?œë²„ ì£¼ë¬¸ ?´ì—­ê³???ê¸°ê¸°???„ì‹œ ?´ì—­???¨ê»˜ ?œì‹œ'
      : '?œë²„ ?°ê²° ??Â· ??ê¸°ê¸°???„ì‹œ ?´ì—­'
    : 'ë¶ˆëŸ¬?¤ëŠ” ì¤‘â€?;
  const receiptRow = openReceiptOrderRef
    ? rows.find((r) => r.orderRef === openReceiptOrderRef) || null
    : null;

  return `
    <section class="mypage-panel">
      <p class="mypage-lead">ê²°ì œ?´ì—­</p>
      <p class="mypage-muted">${esc(sourceNote)}</p>
      <div class="plans-history-layout">
      <table class="plans-table" aria-label="ê²°ì œ?´ì—­">
        <thead>
          <tr>
            <th>ì£¼ë¬¸ë²ˆí˜¸</th>
            <th>?í’ˆ</th>
            <th>?„ë¡œ??/th>
            <th>ê¸ˆì•¡</th>
            <th>?˜ë‹¨</th>
            <th>?¼ì‹œ</th>
            <th>?íƒœ</th>
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
              <td><button type="button" class="btn btn--secondary btn--sm" data-plans-receipt-open="${esc(r.orderRef)}">?ì„¸</button></td>
            </tr>`,
                  )
                  .join('')
              : `<tr><td colspan="8" class="mypage-muted">?´ì—­???†ìŠµ?ˆë‹¤.</td></tr>`
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
        <p class="mypage-lead">ê²°ì œ</p>
        <div class="mypage-info-box is-warn">
          <p>ê²°ì œ???í’ˆ???†ìŠµ?ˆë‹¤. ?¸ì¶œ?í’ˆ?ì„œ ?¤ì‹œ ? íƒ??ì£¼ì„¸??</p>
          <a href="#/plans/positions" class="btn btn--primary" data-plans-nav="/plans/positions">?¸ì¶œ?í’ˆ?¼ë¡œ</a>
        </div>
      </section>`;
  }

  if (role !== 'study_room' && role !== 'tutor') {
    return `
      <section class="mypage-panel">
        <p class="mypage-lead">ê²°ì œ</p>
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
      value: price != null ? formatKrw(price) : '??,
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
      : 'ê²°ì œ ?„ë£Œ ?œì ë¶€??(?œë²„ ?•ì •)';
  const checkoutRows = isPosition
    ? buildPositionOrderRows({
        profileLabel: draft.providerLabel,
        roleText: roleLabel(draft.providerType),
        productName: draft.productName,
        regionValue: draft.regionLabel || (draft.providerType === 'tutor' ? '?œÂ·ì£¼?¥ê³¼ëª? : '??),
        periodLabel: draft.optionLabel || draft.apiVariant,
        periodRangeText,
        listPriceText:
          Number(draft.discountKrw) > 0 && Number(draft.listPriceKrw) > 0 ? formatKrw(draft.listPriceKrw) : '',
        positionPriceText: formatKrw(positionDisplay),
        discountText: draft.discountLabel || '',
        memoBundleText: Number(draft.memoBundle) > 0 ? `ìª½ì?ê¶?${draft.memoBundle}???¬í•¨` : '',
        badgeLines,
        badgeSumText: formatKrw(badgeDisplay),
      })
    : [
        { label: '?í’ˆ', value: `${draft.productName} Â· ${draft.optionLabel}` },
        { label: '?œì‹œê°€', value: formatKrw(amt.displayKrw) },
        { label: '?ë™?°ì¥', value: '?†ìŒ' },
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
      <p class="mypage-lead">ê²°ì œ</p>
      ${renderOrderSummaryBlock({
        family: isPosition ? 'position' : 'access',
        rows: checkoutRows,
        totalLabel: 'ê²°ì œ ?ˆì •(?œì‹œê°€Â·?œë²„ ?¬ê?ì¦?',
        totalValue: formatKrw(previewTotal),
        showCta: false,
        note: '?ë™?°ì¥ ?†ìŒ Â· ?˜ë¶ˆ?€ ?œì‘ ???„ì•¡, ?œì‘ ???¼í•  ê³„ì‚°(?œë²„ ?•ë³¸) Â· ê²°ì œ ì§ì „ ?œë²„ê°€ ?¬ê?ì¦í•©?ˆë‹¤.',
      })}
      <ol class="plans-checkout-steps">
        <li class="is-done"><strong>1. ?ìš© ?„ë¡œ??/strong>
          <p>${esc(draft.providerLabel)} Â· ${esc(roleLabel(draft.providerType))}</p>
        </li>
        <li class="is-done"><strong>2. ?í’ˆ ?µì…˜</strong>
          <p>${esc(draft.productName)} Â· ${esc(draft.optionLabel)}</p>
        </li>
        ${
          draft.apiVariant === '1??
            ? `<li class="is-done"><strong>ì¦‰ì‹œ ë°œì†¡</strong>
          <p class="mypage-muted">1??ì¦‰ì‹œê¶Œì? ?˜ì‹  ?™ìƒê³?ì²?ìª½ì? ë³¸ë¬¸???„ìš”?©ë‹ˆ?? ?€?ì´ ?†ìœ¼ë©?êµ¬ë§¤?????†ìŠµ?ˆë‹¤.</p>
          <label class="plans-card__pick"><span class="plans-card__pick-label">?™ìƒ ID</span>
            <input type="number" data-plans-immediate-student min="1" value="${esc(String(draft.studentId || ''))}" class="student-form__select" /></label>
          <label class="plans-card__pick"><span class="plans-card__pick-label">ì²?ìª½ì?</span>
            <textarea data-plans-immediate-body class="student-form__select" rows="3">${esc(draft.body || '')}</textarea></label>
        </li>`
            : ''
        }
        <li class="is-done"><strong>3. ê¸ˆì•¡ ?•ì¸</strong>
          <p>?œì‹œê°€ ${formatKrw(previewTotal)}
            ${isPosition && badgeDisplay ? ` Â· ?¸ì¶œ ${formatKrw(positionDisplay)} Â· ë°°ì? ?Œê³„ ${formatKrw(badgeDisplay)}` : ''}
            ${amt.testMode ? ` Â· <em>?œí—˜ ê²°ì œ ?”ë©´</em>` : ''}</p>
        </li>
        <li>
          <strong>4. ?½ê? ?™ì˜</strong>
          <label class="plans-check">
            <input type="checkbox" data-plans-agree />
            <span>? ë£Œ?í’ˆ ?´ìš©?½ê? ë°??˜ë¶ˆ ?ˆë‚´ë¥??•ì¸?ˆìŠµ?ˆë‹¤.</span>
          </label>
        </li>
        <li>
          <strong>5. ê²°ì œ?˜ë‹¨</strong>
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
          <strong>6. ê²°ì œ ì§„í–‰</strong>
          <p class="mypage-muted">?„ì¬???œí—˜ ê²°ì œ ?”ë©´?´ë©° ?¤ì œ ê²°ì œ ?°ë™?€ ì¤€ë¹?ì¤‘ì…?ˆë‹¤.</p>
          <div class="mypage-actions-row">
            <button type="button" class="btn btn--primary" data-plans-pay>ê²°ì œ?˜ê¸°</button>
            <a href="${esc(cancelHref)}" class="btn btn--secondary" data-plans-nav="${isPosition ? '/plans/positions' : '/plans/access'}">ì·¨ì†Œ</a>
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
        <p class="mypage-lead">ê²°ì œ ê²°ê³¼</p>
        <div class="mypage-info-box">
          <p>?œì‹œ??ê²°ê³¼ê°€ ?†ìŠµ?ˆë‹¤.</p>
          <a href="#/plans" class="btn btn--secondary" data-plans-nav="/plans">?í’ˆ??/a>
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
        .map((code) => `<p>?ë³´ ë°°ì? Â· ${esc(badgeDisplayName(code))}</p>`)
        .join('')
    : '<p>?ë³´ ë°°ì? ?†ìŒ</p>';

  return `
    <section class="mypage-panel">
      <p class="mypage-lead">${ok ? 'ê²°ì œ ?„ë£Œ' : 'ê²°ì œ ë¯¸ì™„ë£?}</p>
      <div class="mypage-info-box ${ok ? '' : 'is-warn'}">
        <p><strong>${esc(orderStatusLabel(result.status === 'success' ? 'paid' : result.status))}</strong></p>
        ${result.orderRef ? `<p>ì£¼ë¬¸ë²ˆí˜¸ <code>${esc(result.orderRef)}</code></p>` : ''}
        ${result.productName ? `<p>${esc(result.productName)}${result.optionLabel ? ` Â· ${esc(result.optionLabel)}` : ''}</p>` : ''}
        ${result.providerLabel ? `<p>?ìš© ?„ë¡œ?? ${esc(result.providerLabel)}</p>` : ''}
        ${result.regionLabel ? `<p>?ìš© ì§€?? ${esc(result.regionLabel)}</p>` : ''}
        ${result.startedOn || result.endsOn ? `<p>?´ìš© ê¸°ê°„ ${esc(result.startedOn || '??)} ~ ${esc(result.endsOn || '??)}</p>` : ''}
        ${resultBadgeLines}
        ${result.badgeSaleKrw != null && resultBadges.length ? `<p>ë°°ì? ?Œê³„ ${formatKrw(result.badgeSaleKrw)}</p>` : ''}
        ${result.chargeKrw != null ? `<p>ê²°ì œê¸ˆì•¡ ${formatKrw(result.chargeKrw)}</p>` : ''}
        <p>?ë™?°ì¥ ?†ìŒ Â· ?˜ë¶ˆ?€ ?œì‘ ???„ì•¡, ?œì‘ ???¼í•  ê³„ì‚°(?œë²„ ?•ë³¸)</p>
        ${result.memoBundleGranted > 0 ? `<p>?¸ì¶œ?í’ˆ ë¬´ë£Œ ìª½ì? ${result.memoBundleGranted}????ë³¸ìƒ?ˆê³¼ ê°™ì? ê¸°ê°„?´ë©° ì¢…ë£Œ ???¨ê»˜ ì¢…ë£Œ?©ë‹ˆ??</p>` : ''}
        ${result.message ? `<p class="mypage-muted">${esc(result.message)}</p>` : ''}
      </div>
      <div class="mypage-actions-row">
        <a href="#/mypage/plans/my" class="btn btn--primary" data-nav="/mypage/plans/my">???í’ˆ ë³´ê¸°</a>
        ${ok ? `<a href="${backOp}" class="btn btn--secondary" data-nav="${backOp.slice(1)}">?´ì˜ ?”ë©´?¼ë¡œ</a>` : ''}
        ${!ok ? `<a href="#/plans/checkout" class="btn btn--secondary" data-plans-nav="/plans/checkout">?¤ì‹œ ê²°ì œ</a>` : ''}
        <a href="#/plans" class="btn btn--secondary" data-plans-nav="/plans">?í’ˆ?¼í„°</a>
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
            waitHost.innerHTML = `<p class="mypage-muted">?±ë¡??Prime ?ˆì•½?€ê¸°ê? ?†ìŠµ?ˆë‹¤. Â· <a href="#/plans/positions" data-plans-nav="/plans/positions">?¸ì¶œ?í’ˆ ë³´ê¸°</a></p>`;
            return;
          }
          waitHost.innerHTML = `
            <table class="plans-table" aria-label="Prime ?ˆì•½?€ê¸?>
              <thead><tr><th>?í’ˆ</th><th>ì§€??/th><th>?íƒœ</th><th>?±ë¡??/th><th></th></tr></thead>
              <tbody>
                ${items
                  .map(
                    (w) => `
                  <tr>
                    <td>${esc(w.product || 'Prime ?¸ì¶œ')}</td>
                    <td>${esc(w.region || '??)}</td>
                    <td>${esc(w.status_label || w.status || '')}</td>
                    <td>${esc(String(w.registered_at || '').slice(0, 10))}</td>
                    <td>${
                      w.can_cancel
                        ? `<button type="button" class="btn btn--secondary btn--sm" data-plans-waitlist-cancel="${esc(String(w.id))}">ì·¨ì†Œ</button>`
                        : ''
                    }</td>
                  </tr>`,
                  )
                  .join('')}
              </tbody>
            </table>
            <p class="mypage-muted">?œë²ˆÂ·ê²½ìŸ?…ì²´??ê³µê°œ?˜ì? ?ŠìŠµ?ˆë‹¤. ê²°ì œ ê°€?¥í•œ ?íƒœê°€ ?˜ë©´ ?¸ì¶œ?í’ˆ?ì„œ êµ¬ë§¤ë¥??„ë£Œ?˜ì„¸??</p>`;
          waitHost.querySelectorAll('[data-plans-waitlist-cancel]').forEach((btn) => {
            btn.addEventListener('click', async () => {
              const id = btn.getAttribute('data-plans-waitlist-cancel');
              if (!id) return;
              try {
                await cancelPrimeWaitlist(roomId, id);
                rerender();
              } catch (err) {
                window.alert(err?.message || '?ˆì•½?€ê¸?ì·¨ì†Œ???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
              }
            });
          });
        })
        .catch(() => {
          waitHost.innerHTML = `<p class="mypage-muted" role="status">?ˆì•½?€ê¸?ëª©ë¡??ë¶ˆëŸ¬?¤ì? ëª»í–ˆ?µë‹ˆ??</p>`;
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

      const isImmediate = option.apiVariant === '1?? || /^1??.test(String(option.label || ''));
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
      window.alert('?ˆì•½?€ê¸°ëŠ” ê³µë?ë°??„ë¡œ?„ë¡œë§??±ë¡?????ˆìŠµ?ˆë‹¤.');
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
      window.alert('?ìš© ì§€??„ ë¨¼ì? ? íƒ??ì£¼ì„¸??');
      return;
    }
    try {
      const res = await registerPrimeWaitlist(profile.id, region);
      window.alert(res.message || '?ˆì•½?€ê¸°ê? ?±ë¡?˜ì—ˆ?µë‹ˆ??');
      window.location.hash = '#/mypage/plans/my';
    } catch (err) {
      window.alert(err?.message || '?ˆì•½?€ê¸??±ë¡???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
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
          errEl.textContent = '?½ê????™ì˜??ì£¼ì„¸??';
        }
        return;
      }
      if (!draft) return;

      const methodEl = root.querySelector('input[name="plans_pay_method"]:checked');
      const method = methodEl instanceof HTMLInputElement ? methodEl.value : 'card';

      payBtn.setAttribute('disabled', 'true');
      try {
        if (!getProductConfig(draft.productCode, draft.providerType)) {
          throw new Error('?í’ˆ ì¹´íƒˆë¡œê·¸ê°€ ì¤€ë¹„ë˜ì§€ ?Šì•˜?µë‹ˆ?? ?ˆë¡œê³ ì¹¨ ???¤ì‹œ ?œë„??ì£¼ì„¸??');
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
          throw new Error('?œë²„ ê²°ì œê¸ˆì•¡???¬ë°”ë¥´ì? ?ŠìŠµ?ˆë‹¤.');
        }
        // ?´ë¼?´ì–¸??draft ê¸ˆì•¡ê³??¬ë¼???œë²„ ?ë§¤ê°€ë¥??¬ìš©?œë‹¤
        if (Number(draft.priceKrw) !== serverAmount) {
          console.warn('[plans/checkout] client price ignored', draft.priceKrw, '??, serverAmount);
        }
        const completed = await completePaidCheckout(created.order_ref);
        invalidateProviderStatus();
        resetAccessStatusSync();
        await hydrateProviderStatusStrict().catch(() => hydrateProviderStatus());
        await hydrateProviderNotices();

        appendHistoryRow({
          orderRef: completed.order_ref || created.order_ref,
          productName: `${draft.productName} Â· ${draft.optionLabel}`,
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
        const msg = err instanceof Error ? err.message : 'ê²°ì œ???¤íŒ¨?ˆìŠµ?ˆë‹¤.';
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
