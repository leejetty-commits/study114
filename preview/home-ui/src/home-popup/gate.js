/**
 * 홈 팝업 Phase 1a — 관리자 시안 모달 게이트.
 * 손님·일반 회원에게는 열지 않는다. site-settings 스키마는 건드리지 않는다.
 */
import { isAdminUser } from '../auth-session.js';
import { getCurrentScreen } from '../state.js';
import { HOME_POPUPS } from './content.js';
import { pickHomePopup, seoulToday } from './engine.js';

const HOME_SCREENS = new Set(['guest', 'parent', 'studyRoom', 'tutor']);

const HIDE_PREFIX = 'udg.homePopup.hide.';

/** @type {{ path: string, type: string, family: 'a' | 'b', id: string | null } | null} */
let closedView = null;

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
  if (isHomePopupPreview()) {
    const choice = { mode: 'preview', type: readPopupDemo(), family: readPopupFamily(), id: null };
    return isChoiceClosed(choice) ? null : choice;
  }
  const picked = pickHomePopup(HOME_POPUPS, {
    surface: audienceSurface(),
    today: seoulToday(),
    isHidden: isPopupHiddenToday,
  });
  if (!picked) return null;
  const choice = {
    mode: 'public',
    type: String(picked.type),
    family: picked.family === 'b' ? 'b' : 'a',
    id: String(picked.id),
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
