import { adminFetch, adminHttpStatus } from './admin-fetch.js';
import {
  listPopups,
  rememberPublicBundle,
  writePopupRows,
} from './site-settings-public.js';

export {
  dismissPopup,
  ensurePublicSettings,
  getActiveGuestBanner,
  getActiveMaintenance,
  isPopupDismissed,
  isWithinSchedule,
  listActivePopupsForSurface,
  listPopups,
  peekPublicSettings,
} from './site-settings-public.js';

/**
 * 사이트 기본 — 서버 site_settings가 원본.
 * sessionStorage는 마지막 성공 응답의 읽기 캐시만 둔다.
 */

const SETTINGS_KEY = 'study114-site-settings-v1';
const LEGAL_KEY = 'study114-site-legal-v1';
const LOG_KEY = 'study114-site-settings-logs-v1';

/** @typedef {'guardian_student'|'study_room_owner'|'tutor'} JoinRole */

/** 가입·상세등록에서 운영이 조절할 수집 항목 (SSOT 공통 필수와 별도·강조/추가 안내) */
export const JOIN_FIELD_OPTIONS = [
  { id: 'phone', label: '휴대폰' },
  { id: 'address', label: '주소' },
  { id: 'gender', label: '성별' },
  { id: 'birth_date', label: '생년월일' },
  { id: 'sms_consent', label: '문자 수신동의 안내 강조' },
  { id: 'safe_number', label: '안전번호 안내' },
  { id: 'children', label: '자녀 정보(학생)' },
  { id: 'study_room_detail', label: '공부방 상세등록 유도' },
  { id: 'tutor_detail', label: '과외쌤 상세등록 유도' },
];

export const JOIN_ROLES = [
  { id: 'guardian_student', label: '학생' },
  { id: 'study_room_owner', label: '공부방' },
  { id: 'tutor', label: '과외쌤' },
];

export const POPUP_SURFACES = [
  { id: 'guest_home', label: '게스트 홈' },
  { id: 'search', label: '검색' },
  { id: 'mypage', label: '마이페이지' },
  { id: 'all', label: '전체' },
];

function nowStamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function clone(v) {
  return JSON.parse(JSON.stringify(v));
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

function appendLog(action, target, detailMemo = '') {
  const logs = loadJson(LOG_KEY, []);
  const next = [
    {
      id: `settings-log-${Date.now()}`,
      targetType: 'site_settings',
      target,
      action,
      operator: 'preview-admin',
      at: nowStamp(),
      reasonCategory: 'site_settings',
      detailMemo,
      reversible: false,
      userNotified: false,
    },
    ...(Array.isArray(logs) ? logs : []),
  ].slice(0, 80);
  saveJson(LOG_KEY, next);
}

export function listSiteSettingsLogs() {
  return adminLogs;
}

function defaultJoinPolicy() {
  /** @type {Record<string, Record<string, { show: boolean, emphasize: boolean }>>} */
  const matrix = {};
  for (const role of JOIN_ROLES) {
    matrix[role.id] = {};
    for (const field of JOIN_FIELD_OPTIONS) {
      const guardianOnly = field.id === 'children';
      const roomOnly = field.id === 'study_room_detail';
      const tutorOnly = field.id === 'tutor_detail';
      let show = true;
      if (guardianOnly) show = role.id === 'guardian_student';
      if (roomOnly) show = role.id === 'study_room_owner';
      if (tutorOnly) show = role.id === 'tutor';
      matrix[role.id][field.id] = {
        show,
        emphasize: ['phone', 'address'].includes(field.id),
      };
    }
  }
  return matrix;
}

function defaultSettings() {
  return {
    siteName: '우동공과',
    operatorEmail: 'ops@study114.local',
    operatorPhone: '',
    supportHours: '평일 10:00–18:00',
    maintenanceEnabled: false,
    maintenanceMessage: '시스템 점검 중입니다. 잠시 후 다시 이용해 주세요.',
    maintenanceUntil: '',
    guestBannerEnabled: false,
    guestBannerText: '',
    bannedEmails: '',
    bannedWords: '',
    notifyOnReport: true,
    notifyOnTicket: true,
    notifyOnNewProvider: false,
    notifyEmails: 'ops@study114.local',
    joinPolicy: defaultJoinPolicy(),
    updatedAt: 'seed',
  };
}

function defaultLegal() {
  return {
    terms: {
      title: '이용약관',
      body: '우동공과 이용약관 초안을 여기에 작성합니다.',
      updatedAt: 'seed',
    },
    privacy: {
      title: '개인정보처리방침',
      body: '우동공과 개인정보처리방침 초안을 여기에 작성합니다.',
      updatedAt: 'seed',
    },
  };
}

const ADMIN_CACHE_KEY = 'study114-site-settings-server-cache-v1';

/** @type {Record<string, unknown>|null} */
let adminBundle = null;
/** @type {Array<{ action: string, target: string, at: string }>} */
let adminLogs = [];
let adminReady = false;
let adminError = '';
/** @type {Promise<void>|null} */
let adminInflight = null;

function cacheAdmin(bundle, logs) {
  adminBundle = bundle;
  adminLogs = Array.isArray(logs) ? logs : [];
  adminReady = true;
  adminError = '';
  saveJson(ADMIN_CACHE_KEY, { bundle, logs: adminLogs });
  syncPublicFromAdmin(bundle);
}

function syncPublicFromAdmin(bundle) {
  rememberPublicBundle(bundle);
}

function readApiError(res, data) {
  const message = String(data?.message || '').trim();
  if (message) return message;
  if (adminHttpStatus(res, data) === 403) return '최고관리자만 사이트 기본을 저장할 수 있습니다.';
  return '사이트 기본을 저장하지 못했습니다.';
}

export function isAdminSettingsReady() {
  return adminReady;
}

export function getSettingsError() {
  return adminError;
}

export function ensureAdminSettings() {
  if (adminReady) return Promise.resolve();
  if (!adminInflight) {
    adminInflight = adminFetch('/api/admin/site-settings.php')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.ok === false) throw new Error(readApiError(res, data));
        if (!data?.ok || !data.settings) throw new Error(data?.message || '사이트 기본을 읽지 못했습니다.');
        cacheAdmin(data.settings, data.logs);
      })
      .catch((err) => {
        adminReady = true;
        adminError = err instanceof Error ? err.message : '사이트 기본을 읽지 못했습니다.';
        const cached = loadJson(ADMIN_CACHE_KEY, null);
        if (cached?.bundle && typeof cached.bundle === 'object') {
          adminBundle = cached.bundle;
          adminLogs = Array.isArray(cached.logs) ? cached.logs : [];
        }
      })
      .finally(() => {
        adminInflight = null;
      });
  }
  return adminInflight;
}

/** 손님 화면용 함수는 site-settings-public.js. 여기서는 다시 내보내 기존 관리자 import를 유지한다. */

export function getSiteSettings() {
  const base = defaultSettings();
  const saved = adminBundle && typeof adminBundle === 'object' ? adminBundle : null;
  const joinPolicy = saved?.joinPolicy && typeof saved.joinPolicy === 'object' ? saved.joinPolicy : base.joinPolicy;
  return { ...base, ...(saved || {}), joinPolicy };
}

/** @param {Record<string, unknown>} patch */
export async function saveSiteSettings(patch) {
  const res = await adminFetch('/api/admin/site-settings.php', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const message = readApiError(res, data);
    adminError = message;
    throw new Error(message);
  }
  if (!data?.ok || !data.settings) {
    const message = String(data?.message || '사이트 기본을 저장하지 못했습니다.');
    adminError = message;
    throw new Error(message);
  }
  cacheAdmin(data.settings, data.logs);
  return clone(getSiteSettings());
}

/** @param {Record<string, unknown>} input */
export function savePopup(input) {
  const rows = listPopups();
  const id = String(input.id || `popup-${Date.now()}`);
  const row = {
    id,
    title: String(input.title || '').trim() || '제목 없음',
    body: String(input.body || '').trim(),
    surface: String(input.surface || 'guest_home'),
    startAt: String(input.startAt || ''),
    endAt: String(input.endAt || ''),
    dismissHours: Math.max(0, Number(input.dismissHours) || 24),
    enabled: Boolean(input.enabled),
    updatedAt: nowStamp(),
  };
  const idx = rows.findIndex((r) => r.id === id);
  if (idx >= 0) rows[idx] = row;
  else rows.unshift(row);
  writePopupRows(rows);
  appendLog(idx >= 0 ? 'popup_update' : 'popup_create', id, row.title);
  return clone(row);
}

/** @param {string} id */
export function deletePopup(id) {
  const next = listPopups().filter((r) => r.id !== id);
  writePopupRows(next);
  appendLog('popup_delete', id, '');
  return true;
}

export function getLegalDocs() {
  const saved = adminBundle && typeof adminBundle === 'object' ? adminBundle : null;
  const seed = defaultLegal();
  const terms = saved?.terms && typeof saved.terms === 'object' ? saved.terms : {};
  const privacy = saved?.privacy && typeof saved.privacy === 'object' ? saved.privacy : {};
  return {
    terms: {
      title: String(terms.title || seed.terms.title),
      body: String(terms.body || seed.terms.body),
      updatedAt: String(terms.updatedAt || ''),
    },
    privacy: {
      title: String(privacy.title || seed.privacy.title),
      body: String(privacy.body || seed.privacy.body),
      updatedAt: String(privacy.updatedAt || ''),
    },
  };
}

/**
 * @param {'terms'|'privacy'} key
 * @param {{ title?: string, body?: string }} input
 */
export async function saveLegalDoc(key, input) {
  if (key !== 'terms' && key !== 'privacy') throw new Error('지원하지 않는 문서입니다.');
  const current = getLegalDocs();
  const doc = {
    title: String(input.title || current[key].title).trim(),
    body: String(input.body || '').trim(),
  };
  await saveSiteSettings({ [key]: doc });
  return clone(getLegalDocs()[key]);
}

export async function resetSiteSettingsSeed() {
  sessionStorage.removeItem(SETTINGS_KEY);
  sessionStorage.removeItem(LEGAL_KEY);
  await saveSiteSettings({ reset: true });
}
