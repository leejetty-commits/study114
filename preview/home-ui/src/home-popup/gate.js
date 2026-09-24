/**
 * 홈 팝업 Phase 1a — 관리자 시안 모달 게이트.
 * 손님·일반 회원에게는 열지 않는다. site-settings 스키마는 건드리지 않는다.
 */
import { isAdminUser } from '../auth-session.js';
import { getCurrentScreen } from '../state.js';
import { pickHomePopup, seoulToday } from './engine.js';

const HOME_SCREENS = new Set(['guest', 'parent', 'studyRoom', 'tutor']);

const HIDE_PREFIX = 'udg.homePopup.hide.';

/** @type {{ path: string, type: string, family: 'a' | 'b', id: string | null } | null} */
let closedView = null;

/** @type {Record<string, unknown> | false | null} */
let previewRow = null;
/** @type {string} */
let previewForId = '';
/** @type {Promise<void> | null} */
let previewPromise = null;

/** @type {Array<Record<string, unknown>> | null} */
let publicCatalog = null;
/** @type {Promise<void> | null} */
let catalogPromise = null;
/** @type {HTMLElement | null} */
let pendingRoot = null;
/** @type {((root: HTMLElement | null) => void) | null} */
let onCatalogReady = null;

/** @param {(root: HTMLElement | null) => void} fn */
export function setHomePopupRemount(fn) {
  onCatalogReady = fn;
}

/** @param {HTMLElement | null} root */
export function noteHomePopupRoot(root) {
  pendingRoot = root;
}

function loadPublicCatalog() {
  if (catalogPromise) return catalogPromise;
  catalogPromise = fetch('/api/home-popups.php', { credentials: 'same-origin' })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      const rows = data && data.ok === true && Array.isArray(data.popups) ? data.popups : [];
      publicCatalog = rows.map((row) => ({
        ...row,
        id: String(row.id),
        published: true,
      }));
    })
    .catch(() => {
      publicCatalog = [];
    })
    .then(() => {
      const root = pendingRoot;
      if (onCatalogReady) onCatalogReady(root);
    });
  return catalogPromise;
}

export function homePopupPath() {
  const hash = window.location.hash.slice(1) || '/guest';
  const path = hash.split('?')[0] || '/guest';
  return path.startsWith('/') ? path : `/${path}`;
}

export function isHomePopupSurface() {
  return HOME_SCREENS.has(getCurrentScreen());
}

/** 페이지 쿼리에 popupDemo가 있을 때만 관리자 미리보기. 없으면 엔진. */
export function hasPopupDemoQuery() {
  const raw = new URLSearchParams(window.location.search).get('popupDemo');
  return raw === 'notice' || raw === 'event' || raw === 'ad';
}

export function isHomePopupPreview() {
  return isAdminUser() && hasPopupDemoQuery();
}

export function readPopupPreviewId() {
  const raw = new URLSearchParams(window.location.search).get('popupPreviewId') || '';
  return /^\d+$/.test(raw) ? raw : '';
}

function loadPreviewRow(id) {
  if (previewPromise && previewForId === id) return previewPromise;
  previewForId = id;
  previewRow = null;
  previewPromise = fetch(`/api/admin/home-popups.php?id=${encodeURIComponent(id)}`, {
    credentials: 'include',
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      previewRow = data && data.ok === true && data.popup ? data.popup : false;
    })
    .catch(() => {
      previewRow = false;
    })
    .then(() => {
      if (onCatalogReady) onCatalogReady(pendingRoot);
    });
  return previewPromise;
}

/** @param {string} id */
export function isPopupHiddenToday(id) {
  try {
    return localStorage.getItem(HIDE_PREFIX + id) === seoulToday();
  } catch {
    return false;
  }
}

/** @param {string} id */
export function hidePopupForToday(id) {
  try {
    localStorage.setItem(HIDE_PREFIX + id, seoulToday());
  } catch {
    /* 저장 불가 */
  }
}

/**
 * @param {{ type: string, family: string, id?: string | null }} choice
 */
function isChoiceClosed(choice) {
  if (!closedView || closedView.path !== homePopupPath()) return false;
  if (choice.id) return closedView.id === choice.id;
  return closedView.type === choice.type && closedView.family === choice.family;
}

/**
 * @param {{ type: string, family: string, id?: string | null }} choice
 */
export function markHomePopupClosed(choice) {
  closedView = {
    path: homePopupPath(),
    type: choice.type,
    family: choice.family,
    id: choice.id || null,
  };
}

/** 홈 코드. parent 홈은 학생(student) 대상. */
function audienceSurface() {
  const screen = getCurrentScreen();
  if (screen === 'parent') return 'student';
  return screen;
}

/**
 * @returns {{ mode: 'preview' | 'public', type: string, family: 'a' | 'b', id: string | null } | null}
 */
export function resolveHomePopup() {
  if (!isHomePopupSurface()) return null;
  if (isAdminUser()) {
    const previewId = readPopupPreviewId();
    if (previewId) {
      if (previewForId !== previewId || previewRow === null) {
        loadPreviewRow(previewId);
        return null;
      }
      if (previewRow) {
        const content = previewRow.content && typeof previewRow.content === 'object' ? previewRow.content : {};
        const choice = {
          mode: 'preview',
          previewKind: 'row',
          type: String(previewRow.type),
          family: previewRow.family === 'b' ? 'b' : 'a',
          id: String(previewRow.id),
          content,
        };
        return isChoiceClosed(choice) ? null : choice;
      }
    }
  }
  if (isHomePopupPreview()) {
    const choice = {
      mode: 'preview',
      previewKind: 'demo',
      type: readPopupDemo(),
      family: readPopupFamily(),
      id: null,
    };
    return isChoiceClosed(choice) ? null : choice;
  }
  if (publicCatalog === null) {
    loadPublicCatalog();
    return null;
  }
  const picked = pickHomePopup(publicCatalog, {
    surface: audienceSurface(),
    today: seoulToday(),
    isHidden: isPopupHiddenToday,
  });
  if (!picked) return null;
  const content = picked.content && typeof picked.content === 'object' ? picked.content : {};
  const choice = {
    mode: 'public',
    type: String(picked.type),
    family: picked.family === 'b' ? 'b' : 'a',
    id: String(picked.id),
    content,
  };
  return isChoiceClosed(choice) ? null : choice;
}

/** 미리보기 또는 엔진이 팝업을 띄울 때 납작 팝업을 숨긴다. 배너는 유지. */
export function shouldSuppressOpsPopup() {
  return resolveHomePopup() !== null;
}

/** `?popupDemo=` 는 해시가 아니라 페이지 쿼리. 해시 쿼리는 역할 홈 경로를 깨뜨린다. */
export function readPopupDemo() {
  const search = new URLSearchParams(window.location.search).get('popupDemo');
  const hash = window.location.hash.slice(1);
  const qIdx = hash.indexOf('?');
  const fromHash =
    qIdx === -1 ? '' : new URLSearchParams(hash.slice(qIdx + 1)).get('popupDemo') || '';
  const raw = String(search || fromHash || 'notice');
  if (raw === 'event' || raw === 'ad' || raw === 'notice') return raw;
  return 'notice';
}

/** @param {'notice'|'event'|'ad'} type */
export function writePopupDemo(type) {
  const url = new URL(window.location.href);
  url.searchParams.set('popupDemo', type);
  window.history.replaceState(null, '', url);
}

/** 페이지 쿼리만. 해시 쿼리는 읽지도 쓰지도 않는다. 기본 a. */
export function readPopupFamily() {
  const raw = new URLSearchParams(window.location.search).get('popupFamily');
  return raw === 'b' ? 'b' : 'a';
}

/** @param {'a'|'b'} family */
export function writePopupFamily(family) {
  const url = new URL(window.location.href);
  url.searchParams.set('popupFamily', family === 'b' ? 'b' : 'a');
  window.history.replaceState(null, '', url);
}
