/**
 * 사이트 기본 — 서버 site_settings가 원본.
 * sessionStorage는 마지막 성공 응답의 읽기 캐시만 둔다.
 */

const SETTINGS_KEY = 'study114-site-settings-v1';
const POPUPS_KEY = 'study114-site-popups-v1';
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

function defaultPopups() {
  return [
    {
      id: 'popup-welcome',
      title: '서비스 안내',
      body: '우리 동네 공부방·과외 정보를 안전하게 이용해 주세요.',
      surface: 'guest_home',
      startAt: '',
      endAt: '',
      dismissHours: 24,
      enabled: false,
      updatedAt: 'seed',
    },
  ];
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

/** @type {Record<string, unknown>|null} */
let publicSnapshot = null;
let publicSettled = false;
/** @type {Promise<boolean>|null} */
let publicInflight = null;

function cacheAdmin(bundle, logs) {
  adminBundle = bundle;
  adminLogs = Array.isArray(logs) ? logs : [];
  adminReady = true;
  adminError = '';
  saveJson(ADMIN_CACHE_KEY, { bundle, logs: adminLogs });
  syncPublicFromAdmin(bundle);
}

function syncPublicFromAdmin(bundle) {
  const termsBody = String(bundle?.terms?.body || '').trim();
  const privacyBody = String(bundle?.privacy?.body || '').trim();
  publicSnapshot = {
    siteName: String(bundle?.siteName || ''),
    maintenanceEnabled: Boolean(bundle?.maintenanceEnabled),
    maintenanceMessage: String(bundle?.maintenanceMessage || ''),
    maintenanceUntil: String(bundle?.maintenanceUntil || ''),
    guestBannerEnabled: Boolean(bundle?.guestBannerEnabled),
    guestBannerText: String(bundle?.guestBannerText || ''),
    terms: termsBody ? { title: String(bundle.terms.title || ''), body: termsBody } : null,
    privacy: privacyBody ? { title: String(bundle.privacy.title || ''), body: privacyBody } : null,
  };
  publicSettled = true;
}

function applyPublicPayload(data) {
  publicSnapshot = {
    siteName: String(data?.siteName || ''),
    maintenanceEnabled: Boolean(data?.maintenanceEnabled),
    maintenanceMessage: String(data?.maintenanceMessage || ''),
    maintenanceUntil: String(data?.maintenanceUntil || ''),
    guestBannerEnabled: Boolean(data?.guestBannerEnabled),
    guestBannerText: String(data?.guestBannerText || ''),
    terms: data?.terms?.body ? { title: String(data.terms.title || ''), body: String(data.terms.body) } : null,
    privacy: data?.privacy?.body ? { title: String(data.privacy.title || ''), body: String(data.privacy.body) } : null,
  };
  publicSettled = true;
}

async function readApiError(res) {
  const data = await res.json().catch(() => ({}));
  const message = String(data?.message || '').trim();
  if (message) return message;
  if (res.status === 403) return '최고관리자만 사이트 기본을 저장할 수 있습니다.';
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
    adminInflight = fetch('/api/admin/site-settings.php', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error(await readApiError(res));
        const data = await res.json();
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

/** 손님 화면용. 실패하면 false이고 점검·배너·약관 덮어쓰기를 하지 않는다. @returns {Promise<boolean>} */
export function ensurePublicSettings() {
  if (publicSettled) return Promise.resolve(false);
  if (!publicInflight) {
    publicInflight = fetch('/api/site/public-settings.php', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('public settings');
        const data = await res.json();
        if (!data?.ok) throw new Error('public settings');
        applyPublicPayload(data);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        publicInflight = null;
      });
  }
  return publicInflight;
}

export function peekPublicSettings() {
  return publicSnapshot;
}

export function getSiteSettings() {
  const base = defaultSettings();
  const saved = adminBundle && typeof adminBundle === 'object' ? adminBundle : null;
  const joinPolicy = saved?.joinPolicy && typeof saved.joinPolicy === 'object' ? saved.joinPolicy : base.joinPolicy;
  return { ...base, ...(saved || {}), joinPolicy };
}

/** @param {Record<string, unknown>} patch */
export async function saveSiteSettings(patch) {
  const res = await fetch('/api/admin/site-settings.php', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const message = await readApiError(res);
    adminError = message;
    throw new Error(message);
  }
  const data = await res.json().catch(() => ({}));
  if (!data?.ok || !data.settings) {
    const message = String(data?.message || '사이트 기본을 저장하지 못했습니다.');
    adminError = message;
    throw new Error(message);
  }
  cacheAdmin(data.settings, data.logs);
  return clone(getSiteSettings());
}

export function listPopups() {
  const rows = loadJson(POPUPS_KEY, null);
  return Array.isArray(rows) ? rows : defaultPopups();
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
  saveJson(POPUPS_KEY, rows);
  appendLog(idx >= 0 ? 'popup_update' : 'popup_create', id, row.title);
  return clone(row);
}

/** @param {string} id */
export function deletePopup(id) {
  const next = listPopups().filter((r) => r.id !== id);
  saveJson(POPUPS_KEY, next);
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

/** @returns {{ enabled: boolean, message: string, until: string }|null} */
export function getActiveMaintenance() {
  if (!publicSnapshot?.maintenanceEnabled) return null;
  if (publicSnapshot.maintenanceUntil) {
    const until = parseOpsTime(String(publicSnapshot.maintenanceUntil));
    if (until && new Date() > until) return null;
  }
  return {
    enabled: true,
    message: String(publicSnapshot.maintenanceMessage || '시스템 점검 중입니다.'),
    until: String(publicSnapshot.maintenanceUntil || ''),
  };
}

/** @returns {{ text: string }|null} */
export function getActiveGuestBanner() {
  if (!publicSnapshot?.guestBannerEnabled) return null;
  const text = String(publicSnapshot.guestBannerText || '').trim();
  if (!text) return null;
  return { text };
}

/** @param {string} [raw] ISO-ish or datetime-local */
function parseOpsTime(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * @param {{ startAt?: string, endAt?: string }} row
 * @param {Date} [now]
 */
export function isWithinSchedule(row, now = new Date()) {
  const start = parseOpsTime(row.startAt);
  const end = parseOpsTime(row.endAt);
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

const DISMISS_PREFIX = 'study114-popup-dismiss:';

/** @param {string} id */
export function isPopupDismissed(id) {
  try {
    const raw = localStorage.getItem(DISMISS_PREFIX + id);
    if (!raw) return false;
    const until = Number(raw);
    if (!until || Number.isNaN(until)) return false;
    if (Date.now() > until) {
      localStorage.removeItem(DISMISS_PREFIX + id);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} id
 * @param {number} hours
 */
export function dismissPopup(id, hours) {
  const h = Math.max(0, Number(hours) || 0);
  const until = h <= 0 ? Date.now() + 365 * 24 * 3600 * 1000 : Date.now() + h * 3600 * 1000;
  try {
    localStorage.setItem(DISMISS_PREFIX + id, String(until));
  } catch {
    /* ignore */
  }
}

/**
 * @param {'guest_home'|'search'|'mypage'|'all'|string} surface
 * @returns {Array<Record<string, unknown>>}
 */
export function listActivePopupsForSurface(surface) {
  const now = new Date();
  return listPopups().filter((p) => {
    if (!p.enabled) return false;
    if (!isWithinSchedule(p, now)) return false;
    if (isPopupDismissed(p.id)) return false;
    const surf = p.surface || 'all';
    if (surf === 'all') return true;
    return surf === surface;
  });
}
