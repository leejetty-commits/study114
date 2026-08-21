/**
 * 게스트 깊은 진입 가드 — 미니카드 열람은 허용, 확대카드·후기 시트부터 로그인 게이트.
 * 후기 엔진 정책은 건드리지 않는다.
 */

import { isLoggedIn } from './auth-session.js';
import { openDeepAccessLoginGate } from '../../shared/guest-gate-ui.js';

/**
 * @param {string} [_viewerRole]
 * @param {'study_room'|'tutor'|'student'} [_targetType]
 */
export function canOpenDetailForViewer(_viewerRole, _targetType) {
  return isLoggedIn();
}

/**
 * 비로그인이면 게이트를 띄우고 false.
 * @param {string} [source]
 * @param {{ providerType?: 'study_room'|'tutor', providerId?: number, extra?: object }} [ctx]
 */
export function guardGuestDeepAccess(source = 'detail', ctx = {}) {
  if (isLoggedIn()) return true;
  openDeepAccessLoginGate({ source, ...ctx });
  return false;
}

export { openDeepAccessLoginGate };
