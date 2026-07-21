/**
 * 18§ 통합 — 공급자 entitlement 단일 캐시 (status · entitlements · request-access)
 */

import { previewState } from './state.js';
import { fetchPaidStatus } from './paid-api.js';
import { fetchEntitlements } from './messages-api.js';

/** @typedef {{
 *   is_provider: boolean,
 *   subscription_tier: string,
 *   cold_memo: { can_send: boolean, bypass: boolean, remaining: number, legacy_credits: number, nearest_expiry: string|null },
 *   request_view: { remaining: number, nearest_expiry: string|null, unlocked_student_ids: number[] },
 *   exposure: { state: string, label: string, positions: object[] },
 *   slots?: { prime: { capacity: number, used: number, remaining: number }, pick: { capacity: number, used: number, remaining: number } },
 *   metrics?: object[],
 *   days?: number,
 *   tickets?: object,
 * }} ProviderStatusCache */

/** @type {ProviderStatusCache|null} */
let cached = null;

/** @type {Set<number>} */
const unlockedStudentIds = new Set();

let apiMode = false;

function normalizeColdMemo(data) {
  if (data.cold_memo) {
    return {
      can_send: !!data.cold_memo.can_send,
      bypass: !!data.cold_memo.bypass,
      remaining: Number(data.cold_memo.remaining ?? 0),
      legacy_credits: Number(data.cold_memo.legacy_credits ?? 0),
      nearest_expiry: data.cold_memo.nearest_expiry ? String(data.cold_memo.nearest_expiry) : null,
    };
  }
  return {
    can_send: !!data.can_cold_memo,
    bypass: !!data.cold_memo_allowed,
    remaining: Number(data.memo_tickets ?? data.tickets?.memo?.remaining ?? 0),
    legacy_credits: Number(data.memo_credits ?? 0),
    nearest_expiry: data.memo_nearest_expiry
      ? String(data.memo_nearest_expiry)
      : data.tickets?.memo?.nearest_expiry
        ? String(data.tickets.memo.nearest_expiry)
        : null,
  };
}

function normalizeRequestView(data) {
  if (data.request_view) {
    const rv = data.request_view;
    return {
      remaining: Number(rv.remaining ?? 0),
      nearest_expiry: rv.nearest_expiry ? String(rv.nearest_expiry) : null,
      unlocked_student_ids: (rv.unlocked_student_ids ?? []).map(Number),
    };
  }
  return {
    remaining: Number(
      data.request_view_tickets ?? data.tickets?.request_view?.remaining ?? 0,
    ),
    nearest_expiry: data.tickets?.request_view?.nearest_expiry
      ? String(data.tickets.request_view.nearest_expiry)
      : null,
    unlocked_student_ids: (data.unlocked_student_ids ?? []).map(Number),
  };
}

/** @param {object} data */
function applyProviderStatus(data) {
  const coldMemo = normalizeColdMemo(data);
  const requestView = normalizeRequestView(data);
  cached = {
    is_provider: !!data.is_provider,
    subscription_tier: String(data.subscription_tier ?? data.tier ?? 'free'),
    cold_memo: coldMemo,
    request_view: requestView,
    exposure: data.exposure ?? {
      state: 'basic',
      label: '기본 노출 — 유료 노출 이용 안 함',
      positions: [],
    },
    slots: data.slots ?? null,
    metrics: data.metrics,
    days: data.days,
    tickets: data.tickets,
  };

  unlockedStudentIds.clear();
  for (const id of requestView.unlocked_student_ids) {
    unlockedStudentIds.add(id);
  }

  if (cached.is_provider) {
    previewState.providerSubscription = coldMemo.can_send ? 'paid' : 'free';
  }
}

/**
 * 공급자: status.php 우선 · 실패 시 entitlements
 * @param {number} [days]
 */
export async function hydrateProviderStatus(days = 7) {
  apiMode = true;
  try {
    const data = await fetchPaidStatus(days);
    applyProviderStatus({ ...data, is_provider: true });
    return cached;
  } catch (statusErr) {
    console.warn('[provider-status] status hydrate failed, trying entitlements', statusErr);
    try {
      const data = await fetchEntitlements();
      applyProviderStatus(data);
      return cached;
    } catch (entErr) {
      console.warn('[provider-status] entitlements hydrate failed', entErr);
      cached = null;
      unlockedStudentIds.clear();
      return null;
    }
  }
}

/** entitlements만 (비공급자·폴백) */
export async function hydrateProviderEntitlementOnly() {
  apiMode = true;
  try {
    const data = await fetchEntitlements();
    applyProviderStatus(data);
    return cached;
  } catch (err) {
    console.warn('[provider-status] entitlement-only failed', err);
    cached = null;
    unlockedStudentIds.clear();
    return null;
  }
}

export function resetProviderStatus() {
  apiMode = false;
  cached = null;
  unlockedStudentIds.clear();
}

export function isProviderStatusApiMode() {
  return apiMode;
}

/** @returns {ProviderStatusCache|null} */
export function getProviderStatus() {
  return cached;
}

export function getSubscriptionTier() {
  return cached?.subscription_tier ?? 'free';
}

export function canColdMemoFromEntitlement() {
  if (!cached) return null;
  return cached.cold_memo.can_send;
}

export function isColdMemoBypass() {
  return !!cached?.cold_memo.bypass;
}

export function getMemoTicketsRemaining() {
  return cached?.cold_memo.remaining ?? 0;
}

export function getMemoNearestExpiry() {
  return cached?.cold_memo.nearest_expiry ?? null;
}

export function getRequestViewTicketsRemaining() {
  return cached?.request_view.remaining ?? 0;
}

export function getRequestViewNearestExpiry() {
  return cached?.request_view.nearest_expiry ?? null;
}

export function isStudentRequestUnlocked(studentId) {
  return unlockedStudentIds.has(Number(studentId));
}

export function markStudentRequestUnlocked(studentId) {
  unlockedStudentIds.add(Number(studentId));
  if (cached) {
    const id = Number(studentId);
    if (!cached.request_view.unlocked_student_ids.includes(id)) {
      cached.request_view.unlocked_student_ids.push(id);
    }
  }
}

/** unlock POST 응답 반영 */
export function applyRequestViewUnlockResponse(data) {
  if (data.unlocked) {
    markStudentRequestUnlocked(data.student_id);
  }
  const remaining = Number(
    data.request_view?.remaining ?? data.request_view_tickets ?? getRequestViewTicketsRemaining(),
  );
  if (cached) {
    cached.request_view.remaining = remaining;
    if (data.request_view?.nearest_expiry) {
      cached.request_view.nearest_expiry = String(data.request_view.nearest_expiry);
    }
    if (cached.tickets?.request_view) {
      cached.tickets.request_view.remaining = remaining;
    }
  }
}

export function getMemoGateState() {
  const ticketsRemaining = getMemoTicketsRemaining();
  const bypass = isColdMemoBypass();
  const canColdMemo = canColdMemoFromEntitlement() ?? (ticketsRemaining > 0 || bypass);
  return {
    ticketsRemaining,
    nearestExpiry: getMemoNearestExpiry(),
    bypass,
    hasTickets: bypass || ticketsRemaining > 0,
    canColdMemo,
  };
}

/** @returns {typeof import('./mypage/plans-catalog.js').ROI_FREE_METRICS} */
export function getRoiMetricsFromStatus() {
  const metrics = cached?.metrics;
  if (!metrics) return null;
  return metrics.map((m) => ({
    id: String(m.id),
    label: String(m.label),
    value: Number(m.value),
    period: String(m.period),
    hint: String(m.hint),
  }));
}

export function getPaidOperationalStatusFromCache() {
  if (!cached) return null;
  return {
    exposure: cached.exposure,
    slots: cached.slots ?? null,
    tickets: cached.tickets ?? {
      memo: {
        label: '쪽지권',
        remaining: cached.cold_memo.remaining,
        nearest_expiry: cached.cold_memo.nearest_expiry,
      },
      request_view: {
        label: '요청문 열람권',
        remaining: cached.request_view.remaining,
        nearest_expiry: cached.request_view.nearest_expiry,
      },
    },
  };
}
