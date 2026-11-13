/**
 * 상품센터 상태·티어·자격. 바깥은 plans/screens.js만 부른다.
 */
import { fetchTierCheck } from '../paid-api.js';
import {
  getProviderStatus,
  hydrateProviderStatusStrict,
  invalidateProviderStatus,
} from '../provider-status.js';
import { getStudyRoom } from '../study-room-reg/store.js';
import { getTutor } from '../tutor-reg/store.js';
import { studyRoomSectionPath } from '../study-room-reg/router.js';
import { tutorSectionPath } from '../tutor-reg/router.js';
import { AUTH_UI_BASE } from '../../../shared/preview-links.js';
import { getPlanSetting } from './runtime-config.js';
import { parsePlansQuery, buildPlansHref } from './router.js';
import { getPlansEffectiveRole, listProviderProfiles } from './profiles.js';
import { buildRoomPrimeBoard, isRoomPrimeFull } from './slot-inventory.js';
import { getApplyTargetReadiness } from './order-blocks.js';

/** @param {ParentNode} [root] */
export function readSelectedPrimeRegion(root = document) {
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

/**
 * #/plans/access · #/plans/my 프로필별 status 동기화 (stale 구매 방지)
 * @type {{ key: string, phase: 'idle'|'loading'|'ready'|'error', error: string|null, route: string }}
 */
export let plansStatusSync = { key: '', phase: 'idle', error: null, route: '' };

/** 같은 hash 재렌더에서 중복 hydrate 방지. 라우트를 벗어나면 비운다. */
let lastPlansHydratedHash = '';


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
  const role = getPlansEffectiveRole();
  const region = {
    regionBasisType: q.region_basis_type || '',
    regionId: q.region_id || '',
    complexId: q.complex_id || '',
    slotGroup: q.slot_group || '',
    providerType: role === 'study_room' || role === 'tutor' ? role : String(profile.providerType || ''),
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

export function productLabel(code) {
  const normalized = String(code || '').toLowerCase();
  if (normalized.includes('prime')) return '프라임';
  if (normalized.includes('pick')) return '픽';
  if (normalized.includes('basic')) return '베이직카드';
  if (normalized.includes('memo')) return '쪽지권';
  return '이용 상품';
}

/** 구매이력·홈 요약용. 구매면(#/plans/access)에서는 사용하지 않음. */
export function renderLowCreditBanner(tickets) {
  if (!tickets) return '';
  const warns = [];
  if (isLowCredit(tickets.memo?.remaining)) {
    warns.push(`쪽지권 남은 횟수 ${tickets.memo.remaining}회 — 구매이력에서 확인하세요`);
  }
  if (!warns.length) return '';
  return `
    <div class="mypage-info-box is-warn plans-low-credit" role="status">
      <strong>쪽지권 안내</strong>
      <ul class="plans-tier-list">${warns.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
      <a href="#/mypage/plans" class="btn btn--secondary btn--sm" data-nav="/mypage/plans">구매이력 보기</a>
    </div>`;
}

/**
 * 공부방 Prime 점유판 (3칸 · 슬롯 선택 없음 · 만석 시 예약대기만)
 * @param {{ capacity: number, used: number, remaining: number }} prime
 */
export function renderRoomPrimeBoard(prime) {
  const cells = buildRoomPrimeBoard(prime);
  const full = isRoomPrimeFull(prime);
  const used = Math.min(3, Math.max(0, Number(prime?.used) || 0));
  const remaining = Math.max(0, 3 - used);
  const tone = full ? 'is-full' : used > 0 ? 'is-partial' : 'is-open';
  return `
    <div class="plans-prime-board ${tone}" data-plans-prime-board>
      <h4 class="plans-prime-board__title">선택 지역 프라임 노출 현황</h4>
      <p class="plans-prime-board__occupancy">3자리 중 ${used}자리 이용 중${remaining ? ` · 남은 자리 ${remaining}` : ' · 만석'}</p>
      <p class="plans-prime-board__lead">선택 지역의 프라임 대표 노출 · 빈자리는 왼쪽부터 자동 배정됩니다. 슬롯 번호는 고르지 않습니다.</p>
      <ul class="plans-prime-board__cells" aria-label="프라임 자리 3칸">
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
            <span class="plans-prime-cell__label">프라임 자리</span>
            <span class="plans-prime-cell__status">${esc(c.label)}</span>
            <span class="plans-prime-cell__meta">${esc(meta)}</span>
          </li>`;
          })
          .join('')}
      </ul>
      ${
        full
          ? `<div class="plans-prime-waitlist" data-plans-waitlist>
              <p><strong>현재 선택 지역의 프라임 자리는 모두 이용 중입니다.</strong></p>
              <p>예약대기를 등록하면 빈자리가 열릴 때 알려드립니다. 대기 등록만으로 자리나 순번이 보장되지는 않으며 결제가 완료되어야 확정됩니다.</p>
              <button type="button" class="btn btn--primary" data-plans-waitlist-register>예약대기 등록</button>
              <p class="mypage-muted" style="margin-top:0.5rem"><a href="#/mypage/plans/my" data-nav="/mypage/plans/my">내 예약대기 보기</a></p>
            </div>`
          : ''
      }
    </div>`;
}

export function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

export function roleLabel(role) {
  if (role === 'study_room') return '공부방';
  if (role === 'tutor') return '과외쌤';
  if (role === 'parent') return '학생';
  return '비로그인';
}

/** @param {import('./profiles.js').ProviderProfile | null} profile */
export function renderProfileBanner(profile, role) {
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
 * 픽·프라임 구매 판정 캐시. 화면은 서버 tier-check 답만 읽는다.
 * @type {Record<string, { phase: 'loading'|'ready'|'error', pick: { can_buy?: boolean, missing?: { id?: string, label?: string }[]|string[], message?: string }|null, prime: { can_buy?: boolean, missing?: { id?: string, label?: string }[]|string[], message?: string }|null, loadedAt: number }>}
 */
const tierCheckCache = {};
let tierHydratedHash = '';

function tierCacheKey(providerType, providerId) {
  return `${providerType}:${providerId}`;
}

/** @param {'tutor'|'study_room'|string} providerType @param {string|number} providerId */
export function readTierCheck(providerType, providerId) {
  return tierCheckCache[tierCacheKey(providerType, providerId)] || null;
}

/** @param {'tutor'|'study_room'|string} providerType @param {string|number} providerId */
export function rememberTierCheck(providerType, providerId, payload) {
  tierCheckCache[tierCacheKey(providerType, providerId)] = {
    phase: 'ready',
    pick: payload?.pick || null,
    prime: payload?.prime || null,
    loadedAt: Date.now(),
  };
}

function tierLabels(missing) {
  if (!Array.isArray(missing)) return [];
  return missing
    .map((item) => (item && typeof item === 'object' ? String(item.label || '') : String(item || '')))
    .filter(Boolean);
}

/**
 * @param {'tutor'|'study_room'|string} providerType
 * @param {string|number} providerId
 * @param {'pick'|'prime'|string} tier
 */
export function tierPurchaseGate(providerType, providerId, tier) {
  const id = Number(providerId);
  const href = providerType === 'study_room' ? studyRoomSectionPath(id, 'publish') : tutorSectionPath(id, 'publish');
  const entry = readTierCheck(providerType, id);
  const side = entry && tier === 'prime' ? entry.prime : entry ? entry.pick : null;
  if (!entry || entry.phase === 'loading' || (entry.phase === 'ready' && !side)) {
    return {
      blocked: true,
      phase: 'loading',
      lines: ['구매 조건을 확인하고 있어요'],
      reason: '구매 조건을 확인하고 있어요',
      registerCheckHref: '',
    };
  }
  if (entry.phase === 'error') {
    return {
      blocked: true,
      phase: 'error',
      lines: ['구매 조건을 확인하지 못했어요 · 다시 시도'],
      reason: '구매 조건을 확인하지 못했어요 · 다시 시도',
      registerCheckHref: '',
    };
  }
  const labels = tierLabels(side.missing);
  if (side.can_buy !== false && labels.length === 0) {
    return { blocked: false, phase: 'ready', lines: [], reason: '구매 가능', registerCheckHref: '' };
  }
  const message = String(side.message || '');
  const lines = message ? [message, ...labels] : [...labels];
  const reason = message && labels.length ? `${message} · ${labels.join(', ')}` : lines[0] || message;
  return { blocked: true, phase: 'ready', lines, reason, registerCheckHref: href };
}

/** 주문 422의 missing으로 해당 등급 캐시만 바꾼다. */
export function applyTierOrderMissing(providerType, providerId, tier, missing, message) {
  if (tier !== 'pick' && tier !== 'prime') return;
  const key = tierCacheKey(providerType, providerId);
  const prev = tierCheckCache[key] || { phase: 'ready', pick: null, prime: null, loadedAt: 0 };
  const rows = tierLabels(missing).map((label) => ({ id: '', label }));
  const side = {
    can_buy: rows.length === 0,
    missing: rows,
    message: rows.length ? String(message || '') : '',
  };
  tierCheckCache[key] = {
    phase: 'ready',
    pick: tier === 'pick' ? side : prev.pick,
    prime: tier === 'prime' ? side : prev.prime,
    loadedAt: Date.now(),
  };
  tierHydratedHash = typeof window !== 'undefined' ? window.location.hash : '';
}

/**
 * @param {import('./profiles.js').ProviderProfile | null} profile
 * @param {() => void} rerender
 * @param {{ force?: boolean }} [opts]
 */
export function scheduleTierCheckHydrate(profile, rerender, opts = {}) {
  if (!profile || (profile.providerType !== 'tutor' && profile.providerType !== 'study_room')) return;
  const key = tierCacheKey(profile.providerType, profile.id);
  const hash = window.location.hash;
  const force = opts.force === true;
  const cur = tierCheckCache[key];
  if (!force && cur?.phase === 'loading') return;
  if (!force && cur?.phase === 'ready' && tierHydratedHash === hash) return;
  if (!force && cur?.phase === 'error' && tierHydratedHash === hash) return;
  tierCheckCache[key] = {
    phase: 'loading',
    pick: cur?.pick || null,
    prime: cur?.prime || null,
    loadedAt: 0,
  };
  rerender();
  fetchTierCheck(profile.providerType, profile.id)
    .then((data) => {
      if (tierCheckCache[key]?.phase !== 'loading' && !force) return;
      rememberTierCheck(profile.providerType, profile.id, data);
      tierHydratedHash = window.location.hash;
      rerender();
    })
    .catch(() => {
      tierCheckCache[key] = { phase: 'error', pick: null, prime: null, loadedAt: Date.now() };
      tierHydratedHash = window.location.hash;
      rerender();
    });
}

/**
 * @param {import('./profiles.js').ProviderProfile} profile
 * @param {string} productCode
 * @param {'position'|'access'} [family]
 */
export function getEligibility(profile, productCode, family = 'position') {
  /** @type {string[]} */
  const missing = [];
  let canBuy = true;
  /** @type {string} */
  let registerCheckHref = '';
  /** @type {''|'loading'|'error'|'ready'} */
  let tierPhase = '';

  if (family === 'access') {
    if (profile.providerType !== 'tutor' && profile.providerType !== 'study_room') {
      return { canBuy: false, missing: ['쪽지권은 공부방·과외쌤만 구매할 수 있습니다'], registerCheckHref: '', tierPhase: '' };
    }
    if (profile.providerType === 'tutor') {
      const tutor = getTutor(Number(profile.id));
      if (!tutor) {
        return { canBuy: false, missing: ['프로필을 찾을 수 없습니다'], registerCheckHref: '', tierPhase: '' };
      }
    } else {
      const room = getStudyRoom(Number(profile.id));
      if (!room) {
        return { canBuy: false, missing: ['프로필을 찾을 수 없습니다'], registerCheckHref: '', tierPhase: '' };
      }
    }
    return { canBuy: true, missing: [], registerCheckHref: '', tierPhase: '' };
  }

  const tier = productCode === 'prime' || productCode === 'pick' ? productCode : '';

  if (profile.providerType === 'study_room') {
    const room = getStudyRoom(Number(profile.id));
    if (!room) {
      return { canBuy: false, missing: ['프로필을 찾을 수 없습니다'], registerCheckHref: '', tierPhase: '' };
    }
    if (room.profile_status === 'hidden') {
      missing.push('숨김 상태입니다. 구매는 홈·찾기에 다시 보인 뒤에 가능합니다.');
      canBuy = false;
    }
    if (tier) {
      const gate = tierPurchaseGate('study_room', room.id, tier);
      tierPhase = gate.phase;
      if (gate.blocked) {
        gate.lines.forEach((line) => missing.push(line));
        if (gate.registerCheckHref) registerCheckHref = gate.registerCheckHref;
        canBuy = false;
      }
      const apply = getApplyTargetReadiness(profile, 'study_room');
      if (!apply.regionReady) {
        missing.push('대표 홍보지역(행정동·단지 ID)이 필요합니다 · 기본정보에서 지역을 다시 저장하세요');
        canBuy = false;
      }
    }
  } else {
    const tutor = getTutor(Number(profile.id));
    if (!tutor) {
      return { canBuy: false, missing: ['프로필을 찾을 수 없습니다'], registerCheckHref: '', tierPhase: '' };
    }
    if (tutor.profile_status === 'hidden') {
      missing.push('숨김 상태입니다. 구매는 홈·찾기에 다시 보인 뒤에 가능합니다.');
      canBuy = false;
    }
    if (tier) {
      const gate = tierPurchaseGate('tutor', tutor.id, tier);
      tierPhase = gate.phase;
      if (gate.blocked) {
        gate.lines.forEach((line) => missing.push(line));
        if (gate.registerCheckHref) registerCheckHref = gate.registerCheckHref;
        canBuy = false;
      }
    }
  }

  return { canBuy, missing: [...new Set(missing)], registerCheckHref, tierPhase };
}

/**
 * Position(Pick·Prime) 단일 구매 준비 게이트 (319).
 * 카드 색·클릭·요약·배지·CTA가 이 함수 하나만 참조한다.
 * @param {import('./profiles.js').ProviderProfile | null} profile
 * @param {string} productCode 'pick' | 'prime'
 * @param {string} role
 * @returns {{ ready: boolean, reason: string, label: string, phase: string, registerCheckHref: string }}
 */
export function isProductReady(profile, productCode, role) {
  if (!profile) {
    return { ready: false, reason: 'no-profile', label: '적용 프로필을 먼저 선택하세요', phase: '', registerCheckHref: '' };
  }
  const elig = getEligibility(profile, productCode);

  if (elig.tierPhase === 'loading') {
    const tierLoadingMsg = '구매 조건을 확인하고 있어요';
    const nonTierMissing = elig.missing.filter((m) => m !== tierLoadingMsg);
    if (nonTierMissing.length > 0) {
      return { ready: false, reason: 'missing', label: nonTierMissing.join(' · '), phase: 'loading', registerCheckHref: elig.registerCheckHref || '' };
    }
    return { ready: false, reason: 'checking', label: '확인 중', phase: 'loading', registerCheckHref: '' };
  }

  if (!elig.canBuy) {
    let reason = 'missing';
    if (elig.tierPhase === 'error') reason = 'tier-error';
    else if (elig.missing.some((m) => m.includes('지역') || m.includes('행정동'))) reason = 'region';
    return { ready: false, reason, label: elig.missing.join(' · ') || '필수 입력을 완료해 주세요', phase: elig.tierPhase || '', registerCheckHref: elig.registerCheckHref || '' };
  }

  return { ready: true, reason: 'ok', label: '', phase: elig.tierPhase || 'ready', registerCheckHref: '' };
}

export function clearLastPlansHydratedHash() {
  lastPlansHydratedHash = '';
}

export function clearTierHydratedHash() {
  tierHydratedHash = '';
}
