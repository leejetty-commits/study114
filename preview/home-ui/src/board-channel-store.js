import {
  BOARD_CREATE_PRESETS,
  BOARD_REGISTRY,
  STATIC_POLICY_RESERVED_SLUGS,
  getBoardPolicy,
} from './board-engine-copy.js';
import {
  isContentConfigApiMode,
  getContentChannelCache,
  apiPersistBoardChannel,
} from './content-config-backend.js';

const CHANNEL_KEY = 'study114-board-channel-definitions-v1';
const CHANNEL_LOG_KEY = 'study114-board-channel-logs-v1';

const BOARD_KEY_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_STATIC_POLICY_PATHS = STATIC_POLICY_RESERVED_SLUGS.map((slug) => `#/policy/${slug}`);

function nowStamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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

function defaultDownloadPolicy(policy) {
  if (!policy.downloadRoles.length) return 'none';
  if (policy.downloadRoles.includes('guest')) return 'public';
  if (policy.visibility === 'role') return 'role';
  return 'login';
}

function policyToChannel(policy) {
  return {
    boardKey: policy.boardKey,
    menuLabel: policy.userFacingMenu || policy.label,
    boardType: policy.boardType,
    presetId: policy.presetId,
    sectionOwner: policy.sectionOwner,
    visibility: policy.visibility,
    downloadPolicy: defaultDownloadPolicy(policy),
    allowWrite: policy.writeRoles.length > 0,
    allowComment: policy.allowComment,
    allowUpload: policy.allowUpload,
    allowedRoles: policy.writeRoles,
    requireReview: policy.requireReview,
    isGnuSeparated: policy.isGnuSeparated,
    enabled: policy.enabled !== false,
    status: policy.enabled === false ? 'hidden' : 'active',
    routeSlug: policy.routeSlug,
    lastUpdatedAt: 'seed',
    source: 'registry',
  };
}

function seedChannels() {
  return BOARD_REGISTRY.map(policyToChannel);
}

function loadOverrides() {
  const rows = loadJson(CHANNEL_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

function saveOverrides(rows) {
  saveJson(CHANNEL_KEY, rows);
}

function appendOperationLog(action, target, detailMemo = '') {
  const logs = loadJson(CHANNEL_LOG_KEY, []);
  const next = [
    {
      id: `board-log-${Date.now()}`,
      targetType: 'board_channel',
      target,
      action,
      operator: 'preview-admin',
      at: nowStamp(),
      reasonCategory: 'board_channel_config',
      detailMemo,
      reversible: false,
      userNotified: false,
    },
    ...(Array.isArray(logs) ? logs : []),
  ].slice(0, 80);
  saveJson(CHANNEL_LOG_KEY, next);
}

export function listBoardOperationLogs() {
  return loadJson(CHANNEL_LOG_KEY, []);
}

export function listBoardChannels() {
  const byKey = new Map(seedChannels().map((row) => [row.boardKey, row]));
  if (isContentConfigApiMode()) {
    getContentChannelCache().forEach((row) => {
      byKey.set(row.boardKey, { ...byKey.get(row.boardKey), ...row, source: row.source || 'db' });
    });
  }
  loadOverrides().forEach((row) => {
    byKey.set(row.boardKey, { ...byKey.get(row.boardKey), ...row, source: row.source || 'override' });
  });
  return [...byKey.values()].sort((a, b) => {
    const aPolicy = getBoardPolicy(a.boardKey);
    const bPolicy = getBoardPolicy(b.boardKey);
    const phaseOrder = String(aPolicy?.phase || 'phase2').localeCompare(String(bPolicy?.phase || 'phase2'));
    return phaseOrder || String(a.boardKey).localeCompare(String(b.boardKey));
  });
}

export function getBoardChannel(boardKey) {
  return listBoardChannels().find((row) => row.boardKey === boardKey) || null;
}

export function getPresetOptions() {
  return Object.entries(BOARD_CREATE_PRESETS).map(([id, preset]) => ({ id, ...preset }));
}

export function getSectionOwnerOptions(presetId) {
  const preset = BOARD_CREATE_PRESETS[presetId] || BOARD_CREATE_PRESETS.notice;
  return preset.sectionOwners;
}

export function getBoardKeyCandidates(presetId) {
  const preset = BOARD_CREATE_PRESETS[presetId] || BOARD_CREATE_PRESETS.notice;
  return preset.lockedBoardKeys || [];
}

function normalizedRoute(routeSlug) {
  const value = String(routeSlug || '').trim();
  if (!value) return '';
  return value.startsWith('#') ? value : `#${value.startsWith('/') ? value : `/${value}`}`;
}

function normalizeRoles(value) {
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean);
  return String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function validatePresetBoundary(input, errors) {
  const key = input.boardKey;
  const presetId = input.presetId;
  if (key === 'submission' && presetId !== 'submission') {
    errors.push('submission은 제출형 프리셋에서만 운영할 수 있습니다.');
  }
  if (['notice', 'faq'].includes(key) && key !== presetId) {
    errors.push(`${key}는 해당 고객센터 프리셋에서만 운영할 수 있습니다.`);
  }
  if (['safe-guide', 'policy-log'].includes(key) && presetId !== 'guide') {
    errors.push(`${key}는 가이드형/정책 문맥 프리셋에서만 운영할 수 있습니다.`);
  }
  if ((key === 'library' || key.startsWith('library-')) && presetId !== 'library') {
    errors.push('library 계열은 자료실형 프리셋에서만 운영할 수 있습니다.');
  }
  if (key === 'showcase' && presetId !== 'curation') {
    errors.push('showcase는 큐레이션형 프리셋에서만 운영할 수 있습니다.');
  }
}

/**
 * @param {Record<string, any>} input
 * @param {{ mode?: 'create'|'update' }} [opts]
 */
export function validateBoardChannelInput(input, opts = {}) {
  const mode = opts.mode || 'create';
  const errors = [];
  const routeSlug = normalizedRoute(input.routeSlug);
  const boardKey = String(input.boardKey || '').trim();
  const preset = BOARD_CREATE_PRESETS[input.presetId];
  const existing = listBoardChannels();

  if (!preset) errors.push('프리셋 선택이 필요합니다.');
  if (!boardKey) errors.push('boardKey가 필요합니다.');
  if (boardKey && !BOARD_KEY_RE.test(boardKey)) errors.push('boardKey는 영문 소문자/숫자/하이픈만 사용할 수 있습니다.');
  if (mode === 'create' && existing.some((row) => row.boardKey === boardKey)) {
    errors.push(`이미 존재하는 boardKey입니다: ${boardKey}`);
  }
  if (!input.menuLabel) errors.push('menuLabel이 필요합니다.');
  if (!input.sectionOwner) errors.push('소속 메뉴군(sectionOwner) 선택이 필요합니다.');
  if (preset && input.sectionOwner && !preset.sectionOwners.includes(input.sectionOwner)) {
    errors.push('선택한 프리셋에서 허용되지 않는 소속 메뉴군입니다.');
  }
  if (!routeSlug && boardKey !== 'showcase') errors.push('routeSlug가 필요합니다.');
  if (routeSlug && RESERVED_STATIC_POLICY_PATHS.includes(routeSlug)) {
    errors.push(`정적 정책 페이지와 충돌합니다: ${routeSlug}`);
  }
  if (
    routeSlug &&
    existing.some((row) => row.boardKey !== boardKey && normalizedRoute(row.routeSlug) === routeSlug)
  ) {
    errors.push(`이미 사용하는 routeSlug입니다: ${routeSlug}`);
  }

  const allowedRoles = normalizeRoles(input.allowedRoles);
  if (allowedRoles.includes('guest') && (input.allowWrite || input.allowUpload)) {
    errors.push('guest write/upload은 허용하지 않습니다.');
  }
  validatePresetBoundary({ ...input, boardKey, presetId: input.presetId }, errors);

  return { ok: errors.length === 0, errors };
}

export function buildChannelFromInput(input) {
  const preset = BOARD_CREATE_PRESETS[input.presetId];
  return {
    boardKey: String(input.boardKey || '').trim(),
    menuLabel: String(input.menuLabel || '').trim(),
    boardType: preset.boardType,
    presetId: input.presetId,
    sectionOwner: String(input.sectionOwner || preset.sectionOwners[0]),
    visibility: String(input.visibility || preset.defaultVisibility),
    downloadPolicy: String(input.downloadPolicy || 'none'),
    allowWrite: Boolean(input.allowWrite),
    allowComment: Boolean(input.allowComment),
    allowUpload: Boolean(input.allowUpload),
    allowedRoles: normalizeRoles(input.allowedRoles),
    requireReview: Boolean(input.requireReview),
    isGnuSeparated: input.isGnuSeparated !== false,
    enabled: input.status !== 'hidden' && input.status !== 'archived',
    status: String(input.status || 'active'),
    routeSlug: normalizedRoute(input.routeSlug),
    lastUpdatedAt: nowStamp(),
    source: 'admin',
  };
}

/** @param {Record<string, any>} input @param {{ mode?: 'create'|'update' }} [opts] */
export async function saveBoardChannel(input, opts = {}) {
  const mode = opts.mode || (getBoardChannel(input.boardKey) ? 'update' : 'create');
  const validation = validateBoardChannelInput(input, { mode });
  if (!validation.ok) {
    const err = new Error(validation.errors.join('\n'));
    err.validation = validation;
    throw err;
  }
  const next = buildChannelFromInput(input);
  if (isContentConfigApiMode()) {
    await apiPersistBoardChannel(next);
  }
  const overrides = loadOverrides();
  const idx = overrides.findIndex((row) => row.boardKey === next.boardKey);
  if (idx >= 0) overrides[idx] = next;
  else overrides.unshift(next);
  saveOverrides(overrides);
  appendOperationLog(mode === 'create' ? 'channel_create' : 'channel_update', next.boardKey, `${next.menuLabel} · ${next.status}`);
  return clone(next);
}

export function archiveBoardChannel(boardKey) {
  const channel = getBoardChannel(boardKey);
  if (!channel) return null;
  const next = { ...channel, status: 'archived', enabled: false, lastUpdatedAt: nowStamp(), source: 'admin' };
  const overrides = loadOverrides().filter((row) => row.boardKey !== boardKey);
  overrides.unshift(next);
  saveOverrides(overrides);
  appendOperationLog('channel_archive', boardKey, '삭제 대신 보관');
  return clone(next);
}

export function resetBoardChannels() {
  sessionStorage.removeItem(CHANNEL_KEY);
  appendOperationLog('channel_reset_seed', 'board_channel', 'BOARD_REGISTRY seed 복원');
}
