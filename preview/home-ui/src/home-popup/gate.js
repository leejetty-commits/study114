/**
 * 홈 팝업 Phase 1a — 관리자 시안 모달 게이트.
 * 손님·일반 회원에게는 열지 않는다. site-settings 스키마는 건드리지 않는다.
 */
import { isAdminUser } from '../auth-session.js';
import { getCurrentScreen } from '../state.js';

const HOME_SCREENS = new Set(['guest', 'parent', 'studyRoom', 'tutor']);

/** @type {{ path: string, type: string } | null} */
let closedView = null;

export function homePopupPath() {
  const hash = window.location.hash.slice(1) || '/guest';
  const path = hash.split('?')[0] || '/guest';
  return path.startsWith('/') ? path : `/${path}`;
}

export function isHomePopupSurface() {
  return HOME_SCREENS.has(getCurrentScreen());
}

/** 미리보기에서는 「오늘 하루 보지 않기」를 저장하지 않는다. 경로가 바뀌면 다시 연다. */
export function isHomePopupClosed(type) {
  if (!closedView) return false;
  return closedView.path === homePopupPath() && closedView.type === type;
}

/** @param {string} type */
export function markHomePopupClosed(type) {
  closedView = { path: homePopupPath(), type };
}

export function shouldShowHomePopup(type) {
  return isAdminUser() && isHomePopupSurface() && !isHomePopupClosed(type);
}

/** 시안 모달이 뜰 자리에서는 납작 예약 팝업을 같이 그리지 않는다. 배너는 유지. */
export function shouldSuppressOpsPopup() {
  return shouldShowHomePopup(readPopupDemo());
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
