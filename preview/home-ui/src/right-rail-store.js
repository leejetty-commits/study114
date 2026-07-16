import { getBoardChannel, listBoardOperationLogs } from './board-channel-store.js';
import {
  isContentConfigApiMode,
  getContentRailCache,
  apiPersistRightRailSlot,
} from './content-config-backend.js';

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

export const RIGHT_RAIL_PAGE_LABELS = {
  home: '홈',
  search: '검색',
  detail: '상세',
  register: '등록',
  plans: '상품/플랜',
  support: '고객센터',
};

const DEFAULT_RIGHT_RAIL_SLOTS = [
  {
    slotKey: 'home_right_rail',
    pageType: 'home',
    enabled: true,
    sourceType: 'mixed',
    sourceBoardKey: 'notice',
    sourceBoardKeys: ['notice', 'library', 'safe-guide'],
    selectionMode: 'curated',
    itemLimit: 3,
    sectionTitle: '오늘의 안내',
    ctaLabel: '고객센터 보기',
    ctaTarget: '#/support',
    visibilityRule: 'public',
    roleTarget: 'all',
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
    sourceBoardKeys: ['faq', 'library-template', 'safe-guide'],
    selectionMode: 'curated',
    itemLimit: 3,
    sectionTitle: '탐색 도움말',
    ctaLabel: 'FAQ 보기',
    ctaTarget: '#/support/faq',
    visibilityRule: 'public',
    roleTarget: 'all',
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
    ctaTarget: '#/support/safe',
    visibilityRule: 'public',
    roleTarget: 'all',
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
    sourceBoardKeys: ['library-template', 'faq', 'safe-guide'],
    selectionMode: 'curated',
    itemLimit: 3,
    sectionTitle: '작성 전 체크',
    ctaLabel: '서식함 보기',
    ctaTarget: '#/library/templates',
    visibilityRule: 'login',
    roleTarget: 'provider',
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
    ctaLabel: '상품 FAQ',
    ctaTarget: '#/support/faq',
    visibilityRule: 'public',
    roleTarget: 'provider',
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

export function listRightRailSlots() {
  const byKey = new Map(DEFAULT_RIGHT_RAIL_SLOTS.map((slot) => [slot.slotKey, { ...slot, source: 'seed' }]));
  if (isContentConfigApiMode()) {
    getContentRailCache().forEach((slot) => {
      byKey.set(slot.slotKey, { ...byKey.get(slot.slotKey), ...slot, source: slot.source || 'db' });
    });
  }
  loadOverrides().forEach((slot) => byKey.set(slot.slotKey, { ...byKey.get(slot.slotKey), ...slot, source: 'admin' }));
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
  const sourceBoardKeys = normalizeBoardKeys(input.sourceBoardKeys, input.sourceBoardKey);
  if (input.sourceType === 'board' || input.sourceType === 'mixed') {
    sourceBoardKeys.forEach((key) => {
      const channel = getBoardChannel(key);
      if (!channel) errors.push(`존재하지 않는 boardKey입니다: ${key}`);
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
