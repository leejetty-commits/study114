import { getBoardChannel, listBoardOperationLogs } from './board-channel-store.js';
import {
  isContentConfigApiMode,
  getContentRailCache,
  apiPersistRightRailSlot,
} from './content-config-backend.js';
import { normalizeGuestFilter, resolveSlotGuestFilter } from './board-channel-acl.js';

const RAIL_KEY = 'study114-right-rail-slot-definitions-v1';
const RAIL_LOG_KEY = 'study114-right-rail-logs-v1';

export const RIGHT_RAIL_SLOT_KEYS = [
  'home_right_rail',
  'search_right_rail',
  'detail_right_rail',
  'register_right_rail',
  'plans_right_rail',
  'support_right_rail',
];

export const RIGHT_RAIL_SELECTION_MODES = ['latest', 'pinned', 'curated', 'manual'];
export const RIGHT_RAIL_MOBILE_BEHAVIORS = ['stack', 'collapse', 'hide'];
/** guestFilter: allow | summary_only | block */
export const RIGHT_RAIL_GUEST_FILTERS = ['allow', 'summary_only', 'block'];

export { normalizeGuestFilter, resolveSlotGuestFilter };

export const RIGHT_RAIL_PAGE_LABELS = {
  home: '홈',
  search: '검색',
  detail: '상세',
  register: '등록',
  plans: '상품/플랜',
  support: '고객센터',
};

/**
 * 우측 레일 슬롯 정본 (SSOT runtime seed)
 * - preview: 이 배열이 기본
 * - API mode: DB row가 overlay · DB seed는 본 배열과 동일 값으로 동기화
 * - guestFilter: allow=게스트 노출 / summary_only=게스트 요약·진입만 / block=게스트 슬롯 숨김
 */
export const DEFAULT_RIGHT_RAIL_SLOTS = [
  {
    slotKey: 'home_right_rail',
    pageType: 'home',
    enabled: true,
    sourceType: 'mixed',
    sourceBoardKey: 'notice',
    sourceBoardKeys: ['notice', 'concern-director', 'concern-tutor', 'concern-parent'],
    selectionMode: 'curated',
    itemLimit: 3,
    sectionTitle: '오늘의 안내',
    ctaLabel: '고객센터 보기',
    ctaTarget: '#/support',
    visibilityRule: 'public',
    roleTarget: 'all',
    guestFilter: 'summary_only',
    mobileBehavior: 'stack',
    priority: 10,
    status: 'active',
  },
  {
    slotKey: 'search_right_rail',
    pageType: 'search',
    enabled: true,
    sourceType: 'mixed',
    sourceBoardKey: 'faq',
    sourceBoardKeys: ['faq', 'concern-parent', 'safe-guide'],
    selectionMode: 'curated',
    itemLimit: 3,
    sectionTitle: '탐색 도움말',
    ctaLabel: '자주 묻는 질문 보기',
    ctaTarget: '#/support/faq',
    visibilityRule: 'public',
    roleTarget: 'all',
    guestFilter: 'summary_only',
    mobileBehavior: 'stack',
    priority: 20,
    status: 'active',
  },
  {
    slotKey: 'detail_right_rail',
    pageType: 'detail',
    enabled: true,
    sourceType: 'mixed',
    sourceBoardKey: 'safe-guide',
    sourceBoardKeys: ['safe-guide', 'submission', 'notice'],
    selectionMode: 'curated',
    itemLimit: 3,
    sectionTitle: '상세 확인 전 안내',
    ctaLabel: '안전과외 가이드',
    ctaTarget: '#/guide/safety',
    visibilityRule: 'public',
    roleTarget: 'all',
    guestFilter: 'allow',
    mobileBehavior: 'collapse',
    priority: 30,
    status: 'active',
  },
  {
    slotKey: 'register_right_rail',
    pageType: 'register',
    enabled: true,
    sourceType: 'mixed',
    sourceBoardKey: 'library-template',
    sourceBoardKeys: ['library-template', 'concern-director', 'concern-tutor'],
    selectionMode: 'curated',
    itemLimit: 3,
    sectionTitle: '작성 전 체크',
    ctaLabel: '서식함 보기',
    ctaTarget: '#/library/templates',
    visibilityRule: 'login',
    roleTarget: 'provider',
    guestFilter: 'block',
    mobileBehavior: 'stack',
    priority: 40,
    status: 'active',
  },
  {
    slotKey: 'plans_right_rail',
    pageType: 'plans',
    enabled: true,
    sourceType: 'mixed',
    sourceBoardKey: 'notice',
    sourceBoardKeys: ['notice', 'faq', 'safe-guide'],
    selectionMode: 'curated',
    itemLimit: 3,
    sectionTitle: '상품 이용 안내',
    ctaLabel: '상품 자주 묻는 질문',
    ctaTarget: '#/support/faq',
    visibilityRule: 'public',
    roleTarget: 'provider',
    guestFilter: 'block',
    mobileBehavior: 'collapse',
    priority: 50,
    status: 'active',
  },
  {
    slotKey: 'support_right_rail',
    pageType: 'support',
    enabled: true,
    sourceType: 'mixed',
    sourceBoardKey: 'notice',
    sourceBoardKeys: ['notice', 'faq', 'library-guide-pdf'],
    selectionMode: 'latest',
    itemLimit: 3,
    sectionTitle: '빠른 도움말',
    ctaLabel: '자료실 보기',
    ctaTarget: '#/library/guides',
    visibilityRule: 'public',
    roleTarget: 'all',
    guestFilter: 'allow',
    mobileBehavior: 'stack',
    priority: 60,
    status: 'active',
  },
];

function nowStamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function loadJson(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

function loadOverrides() {
  const rows = loadJson(RAIL_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

function appendRailLog(action, target, detailMemo = '') {
  const logs = loadJson(RAIL_LOG_KEY, []);
  const next = [
    {
      id: `rail-log-${Date.now()}`,
      targetType: 'right_rail_slot',
      target,
      action,
      operator: 'preview-admin',
      at: nowStamp(),
      reasonCategory: 'right_rail_config',
      detailMemo,
      reversible: false,
      userNotified: false,
    },
    ...(Array.isArray(logs) ? logs : []),
  ].slice(0, 80);
  saveJson(RAIL_LOG_KEY, next);
}

export function listRightRailOperationLogs() {
  return loadJson(RAIL_LOG_KEY, []);
}

export function listAllBoardAndRailLogs() {
  return [...listRightRailOperationLogs(), ...listBoardOperationLogs()].sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

/** @param {object} slot */
function withCanonicalFields(slot, source = 'seed') {
  const sourceBoardKeys = normalizeBoardKeys(slot.sourceBoardKeys, slot.sourceBoardKey);
  const next = {
    ...slot,
    sourceBoardKeys,
    sourceBoardKey: String(slot.sourceBoardKey || sourceBoardKeys[0] || ''),
    visibilityRule: String(slot.visibilityRule || 'public'),
    roleTarget: String(slot.roleTarget || 'all'),
    guestFilter: resolveSlotGuestFilter({ ...slot, sourceBoardKeys }),
    mobileBehavior: String(slot.mobileBehavior || 'stack'),
    source,
  };
  return next;
}

export function listRightRailSlots() {
  const byKey = new Map(DEFAULT_RIGHT_RAIL_SLOTS.map((slot) => [slot.slotKey, withCanonicalFields(slot, 'seed')]));
  if (isContentConfigApiMode()) {
    getContentRailCache().forEach((slot) => {
      const base = byKey.get(slot.slotKey) || {};
      byKey.set(slot.slotKey, withCanonicalFields({ ...base, ...slot }, slot.source || 'db'));
    });
  }
  loadOverrides().forEach((slot) => {
    const base = byKey.get(slot.slotKey) || {};
    byKey.set(slot.slotKey, withCanonicalFields({ ...base, ...slot }, 'admin'));
  });
  return [...byKey.values()].sort((a, b) => Number(a.priority || 0) - Number(b.priority || 0));
}

export function getRightRailSlot(slotKey) {
  return listRightRailSlots().find((slot) => slot.slotKey === slotKey) || null;
}

function normalizeBoardKeys(value, fallback = '') {
  const keys = Array.isArray(value) ? value : String(value || fallback).split(',');
  return keys.map((v) => String(v).trim()).filter(Boolean);
}

export function validateRightRailSlotInput(input) {
  const errors = [];
  if (!RIGHT_RAIL_SLOT_KEYS.includes(input.slotKey)) errors.push('허용된 slotKey가 아닙니다.');
  if (!input.sectionTitle) errors.push('sectionTitle이 필요합니다.');
  if (!RIGHT_RAIL_SELECTION_MODES.includes(input.selectionMode)) errors.push('selectionMode가 올바르지 않습니다.');
  if (!RIGHT_RAIL_MOBILE_BEHAVIORS.includes(input.mobileBehavior)) errors.push('mobileBehavior가 올바르지 않습니다.');
  const gf = normalizeGuestFilter(input.guestFilter) || resolveSlotGuestFilter(input);
  if (!RIGHT_RAIL_GUEST_FILTERS.includes(gf)) errors.push('guestFilter가 올바르지 않습니다.');
  const sourceBoardKeys = normalizeBoardKeys(input.sourceBoardKeys, input.sourceBoardKey);
  if (input.sourceType === 'board' || input.sourceType === 'mixed') {
    sourceBoardKeys.forEach((key) => {
      const channel = getBoardChannel(key);
      if (!channel) errors.push(`존재하지 않는 채널 식별값입니다: ${key}`);
      if (channel?.status === 'archived') errors.push(`보관된 채널은 슬롯 source로 쓸 수 없습니다: ${key}`);
    });
  }
  if (Number(input.itemLimit) < 1 || Number(input.itemLimit) > 5) {
    errors.push('itemLimit은 1~5 사이로 제한합니다.');
  }
  return { ok: errors.length === 0, errors };
}

export function buildRightRailSlotFromInput(input) {
  const sourceBoardKeys = normalizeBoardKeys(input.sourceBoardKeys, input.sourceBoardKey);
  const guestFilter =
    normalizeGuestFilter(input.guestFilter) || resolveSlotGuestFilter({ ...input, sourceBoardKeys });
  return {
    slotKey: input.slotKey,
    pageType: String(input.pageType || input.slotKey.replace('_right_rail', '')),
    enabled: input.enabled !== false && input.status !== 'hidden' && input.status !== 'archived',
    sourceType: String(input.sourceType || 'mixed'),
    sourceBoardKey: String(input.sourceBoardKey || sourceBoardKeys[0] || ''),
    sourceBoardKeys,
    selectionMode: String(input.selectionMode || 'curated'),
    itemLimit: Number(input.itemLimit || 3),
    sectionTitle: String(input.sectionTitle || '').trim(),
    ctaLabel: String(input.ctaLabel || '바로가기').trim(),
    ctaTarget: String(input.ctaTarget || '#/support').trim(),
    visibilityRule: String(input.visibilityRule || 'public'),
    roleTarget: String(input.roleTarget || 'all'),
    guestFilter,
    mobileBehavior: String(input.mobileBehavior || 'stack'),
    priority: Number(input.priority || 50),
    status: String(input.status || 'active'),
    lastUpdatedAt: nowStamp(),
  };
}

export async function saveRightRailSlot(input) {
  const validation = validateRightRailSlotInput(input);
  if (!validation.ok) {
    const err = new Error(validation.errors.join('\n'));
    err.validation = validation;
    throw err;
  }
  const next = buildRightRailSlotFromInput(input);
  if (isContentConfigApiMode()) {
    await apiPersistRightRailSlot(next);
  }
  const overrides = loadOverrides().filter((slot) => slot.slotKey !== next.slotKey);
  overrides.unshift(next);
  saveJson(RAIL_KEY, overrides);
  appendRailLog('slot_update', next.slotKey, `${next.sectionTitle} · ${next.sourceBoardKeys.join(', ')}`);
  return next;
}

export function updateRightRailSlotStatus(slotKey, status) {
  const slot = getRightRailSlot(slotKey);
  if (!slot) return null;
  const next = {
    ...slot,
    status,
    enabled: status === 'active',
    lastUpdatedAt: nowStamp(),
  };
  const overrides = loadOverrides().filter((row) => row.slotKey !== slotKey);
  overrides.unshift(next);
  saveJson(RAIL_KEY, overrides);
  appendRailLog(status === 'active' ? 'slot_enable' : 'slot_disable', slotKey, `status=${status}`);
  return next;
}

export function resetRightRailSlots() {
  sessionStorage.removeItem(RAIL_KEY);
  appendRailLog('slot_reset_seed', 'right_rail_slot', '기본 seed 복원');
}
