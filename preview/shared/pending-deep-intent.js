/**
 * 게스트 깊은 진입 → 로그인 후 1회 복귀 intent.
 * 후기 엔진 정책과 무관. 최소 payload만 저장한다.
 */

const KEY = 'study114:pending-deep-intent';
const MAX_AGE_MS = 30 * 60 * 1000;

/** @typedef {'card_detail'|'review_sheet'|'compare'|'wishlist'|'message'|'public_myshop'} DeepIntentSource */

const SOURCE_MAP = {
  detail: 'card_detail',
  card_detail: 'card_detail',
  review: 'review_sheet',
  review_sheet: 'review_sheet',
  review_write: 'review_sheet',
  compare: 'compare',
  wish: 'wishlist',
  wishlist: 'wishlist',
  inquire: 'message',
  memo: 'message',
  message: 'message',
  myshop: 'public_myshop',
  public_myshop: 'public_myshop',
  recommend: 'card_detail',
};

export function normalizeDeepIntentSource(raw) {
  return SOURCE_MAP[String(raw || '')] || 'card_detail';
}

/**
 * @param {object} [raw]
 * @returns {{ source: DeepIntentSource, providerType: 'study_room'|'tutor'|'', providerId: number, extra: object, t: number } | null}
 */
export function normalizeDeepIntent(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const source = normalizeDeepIntentSource(raw.source);
  const providerType = raw.providerType === 'tutor' ? 'tutor' : raw.providerType === 'study_room' ? 'study_room' : '';
  const providerId = Number(raw.providerId || raw.extra?.compareId || raw.extra?.myshopId || 0) || 0;
  const extra = raw.extra && typeof raw.extra === 'object' ? { ...raw.extra } : {};
  if (String(raw.source) === 'review_write' || extra.view === 'write') extra.view = 'write';
  const t = Number(raw.t) || Date.now();
  if (Date.now() - t > MAX_AGE_MS) return null;
  return { source, providerType, providerId, extra, t };
}

export function savePendingDeepIntent(raw) {
  const intent = normalizeDeepIntent({ ...raw, t: Date.now() });
  if (!intent) return null;
  if (intent.source !== 'compare' && !(intent.providerType && intent.providerId > 0)) {
    return null;
  }
  try {
    sessionStorage.setItem(KEY, JSON.stringify(intent));
  } catch {
    /* private mode */
  }
  return intent;
}

export function peekPendingDeepIntent() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return normalizeDeepIntent(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearPendingDeepIntent() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** 읽고 즉시 제거 */
export function consumePendingDeepIntent() {
  const v = peekPendingDeepIntent();
  clearPendingDeepIntent();
  return v;
}

/** @param {string} encoded */
export function parseResumeIntentParam(encoded) {
  if (!encoded) return null;
  try {
    return normalizeDeepIntent(JSON.parse(encoded));
  } catch {
    try {
      return normalizeDeepIntent(JSON.parse(decodeURIComponent(encoded)));
    } catch {
      return null;
    }
  }
}
