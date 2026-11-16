/**
 * 손님 화면이 읽는 사이트 공개 설정. 관리자 저장 API는 여기 두지 않는다.
 */

const POPUPS_KEY = 'study114-site-popups-v1';

/** @type {Record<string, unknown>|null} */
let publicSnapshot = null;
let publicSettled = false;
/** @type {Promise<boolean>|null} */
let publicInflight = null;

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

/** 관리자 저장 응답을 손님 스냅샷에 반영한다. */
export function rememberPublicBundle(bundle) {
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

/** @param {string} [raw] */
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

export function listPopups() {
  const rows = loadJson(POPUPS_KEY, null);
  return Array.isArray(rows) ? rows : defaultPopups();
}

/** @param {unknown[]} rows */
export function writePopupRows(rows) {
  saveJson(POPUPS_KEY, rows);
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
