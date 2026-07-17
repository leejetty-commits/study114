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
const SECTION_GROUPS_KEY = 'study114-board-section-groups-v1';
const SECTION_ACCESS_KEY = 'study114-board-section-access-v1';

const BOARD_KEY_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SECTION_OWNER_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 우동공과 역할 — 영카트 mb_level 매트릭스 대신 사용 */
export const CHANNEL_ROLE_OPTIONS = [
  { id: 'guardian_student', label: '학부모' },
  { id: 'study_room_owner', label: '공부방' },
  { id: 'tutor', label: '과외쌤' },
  { id: 'admin', label: '운영자' },
];
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

/** @returns {Array<{ id: string, label: string, source: 'custom' }>} */
export function listCustomSectionGroups() {
  const rows = loadJson(SECTION_GROUPS_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

/**
 * 영카트 게시판그룹 경량판 — sectionOwner 집계 + 커스텀 그룹.
 * @returns {Array<{ id: string, label: string, channelCount: number, source: string }>}
 */
export function listSectionGroupSummary() {
  const channels = listBoardChannels();
  const presetOwners = new Set();
  Object.values(BOARD_CREATE_PRESETS).forEach((preset) => {
    (preset.sectionOwners || []).forEach((id) => presetOwners.add(id));
  });
  const custom = listCustomSectionGroups();
  const customMap = new Map(custom.map((g) => [g.id, g]));
  const used = new Set(channels.map((ch) => ch.sectionOwner).filter(Boolean));
  const ids = new Set([...presetOwners, ...customMap.keys(), ...used]);

  return [...ids]
    .sort()
    .map((id) => {
      const channelCount = channels.filter((ch) => ch.sectionOwner === id).length;
      const customRow = customMap.get(id);
      let source = 'preset';
      if (customRow) source = 'custom';
      else if (!presetOwners.has(id)) source = 'orphan';
      return {
        id,
        label: customRow?.label || id,
        channelCount,
        accessMemberCount: getSectionAccessMembers(id).length,
        source,
      };
    });
}

/**
 * @param {string} id
 * @param {string} [label]
 */
export function addCustomSectionGroup(id, label = '') {
  const key = String(id || '')
    .trim()
    .toLowerCase();
  if (!key) throw new Error('그룹 ID가 필요합니다.');
  if (!SECTION_OWNER_RE.test(key)) {
    throw new Error('그룹 ID는 영문 소문자/숫자/하이픈만 사용할 수 있습니다.');
  }
  const rows = listCustomSectionGroups();
  if (rows.some((g) => g.id === key)) {
    throw new Error(`이미 있는 그룹입니다: ${key}`);
  }
  const next = [
    ...rows,
    { id: key, label: String(label || key).trim() || key, source: 'custom' },
  ];
  saveJson(SECTION_GROUPS_KEY, next);
  appendOperationLog('section_group_create', key, label || key);
  return clone(next[next.length - 1]);
}

/** @param {string} id */
export function removeCustomSectionGroup(id) {
  const key = String(id || '').trim();
  const inUse = listBoardChannels().some((ch) => ch.sectionOwner === key);
  if (inUse) {
    throw new Error('채널이 연결된 그룹은 삭제할 수 없습니다. 채널 소속을 먼저 바꾸세요.');
  }
  const presetOwners = new Set();
  Object.values(BOARD_CREATE_PRESETS).forEach((preset) => {
    (preset.sectionOwners || []).forEach((oid) => presetOwners.add(oid));
  });
  if (presetOwners.has(key)) {
    throw new Error('프리셋 기본 소속 그룹은 삭제할 수 없습니다.');
  }
  const next = listCustomSectionGroups().filter((g) => g.id !== key);
  saveJson(SECTION_GROUPS_KEY, next);
  appendOperationLog('section_group_delete', key, '');
  return true;
}

export function getSectionOwnerOptions(presetId) {
  const preset = BOARD_CREATE_PRESETS[presetId] || BOARD_CREATE_PRESETS.notice;
  const custom = listCustomSectionGroups().map((g) => g.id);
  return [...new Set([...(preset.sectionOwners || []), ...custom])];
}

/** @param {string} sectionOwner @returns {string[]} */
export function getSectionAccessMembers(sectionOwner) {
  const map = loadJson(SECTION_ACCESS_KEY, {});
  const rows = map && typeof map === 'object' ? map[sectionOwner] : null;
  return Array.isArray(rows) ? rows.map(String) : [];
}

/**
 * @param {string} sectionOwner
 * @param {string} email
 */
export function addSectionAccessMember(sectionOwner, email) {
  const owner = String(sectionOwner || '').trim();
  const value = String(email || '')
    .trim()
    .toLowerCase();
  if (!owner) throw new Error('그룹 ID가 필요합니다.');
  if (!EMAIL_RE.test(value)) throw new Error('올바른 이메일 형식이 아닙니다.');
  const map = { ...(loadJson(SECTION_ACCESS_KEY, {}) || {}) };
  const current = Array.isArray(map[owner]) ? map[owner].map(String) : [];
  if (current.includes(value)) throw new Error('이미 등록된 접근회원입니다.');
  map[owner] = [...current, value];
  saveJson(SECTION_ACCESS_KEY, map);
  appendOperationLog('section_access_add', owner, value);
  return clone(map[owner]);
}

/**
 * @param {string} sectionOwner
 * @param {string} email
 */
export function removeSectionAccessMember(sectionOwner, email) {
  const owner = String(sectionOwner || '').trim();
  const value = String(email || '')
    .trim()
    .toLowerCase();
  const map = { ...(loadJson(SECTION_ACCESS_KEY, {}) || {}) };
  const current = Array.isArray(map[owner]) ? map[owner].map(String) : [];
  map[owner] = current.filter((e) => e !== value);
  saveJson(SECTION_ACCESS_KEY, map);
  appendOperationLog('section_access_remove', owner, value);
  return clone(map[owner]);
}

/**
 * 채널 설정 복제 (영카트 board_copy 경량판).
 * @param {string} sourceKey
 * @param {{ boardKey: string, menuLabel?: string, routeSlug?: string }} input
 */
export async function copyBoardChannel(sourceKey, input) {
  const src = getBoardChannel(sourceKey);
  if (!src) throw new Error('원본 채널을 찾을 수 없습니다.');
  const boardKey = String(input.boardKey || '')
    .trim()
    .toLowerCase();
  if (!boardKey) throw new Error('새 boardKey가 필요합니다.');
  if (boardKey === src.boardKey) throw new Error('원본과 다른 boardKey를 입력하세요.');

  const menuLabel = String(input.menuLabel || `${src.menuLabel} 복사`).trim();
  let routeSlug = String(input.routeSlug || '').trim();
  if (!routeSlug) {
    const base = src.routeSlug || `#/${src.boardKey}`;
    routeSlug = `${base}-copy`;
  }

  return saveBoardChannel(
    {
      presetId: src.presetId,
      boardKey,
      menuLabel,
      routeSlug,
      sectionOwner: src.sectionOwner,
      visibility: src.visibility,
      downloadPolicy: src.downloadPolicy,
      allowedRoles: (src.allowedRoles || []).join(', '),
      allowWrite: src.allowWrite,
      allowComment: src.allowComment,
      allowUpload: src.allowUpload,
      requireReview: src.requireReview,
      isGnuSeparated: src.isGnuSeparated,
      status: src.status === 'archived' ? 'hidden' : src.status,
    },
    { mode: 'create' },
  ).then((created) => {
    appendOperationLog('channel_copy', boardKey, `from ${sourceKey}`);
    return created;
  });
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
  if (preset && input.sectionOwner) {
    const allowed = getSectionOwnerOptions(input.presetId);
    if (!allowed.includes(input.sectionOwner)) {
      errors.push('선택한 프리셋에서 허용되지 않는 소속 메뉴군입니다. 그룹을 먼저 추가하세요.');
    }
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
