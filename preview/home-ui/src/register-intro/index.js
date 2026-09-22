/**
 * 게스트 등록 intro — home 해시에서 안내만 표시 (register SPA 풀로드 회피)
 */

import {
  renderRegisterIntroGate,
  bindGuestGateLinks,
} from '../../../shared/guest-gate-ui.js';
import {
  STUDY_ROOM_REGISTER_URL,
  TUTOR_REGISTER_URL,
} from '../../../shared/preview-links.js';
import { clearPendingRoute } from '../../../shared/pending-route.js';
import { isLoggedIn } from '../auth-session.js';
import { getRegisterIntroKind } from '../state.js';
import { renderPreviewToolbar, renderHeader, renderFooter, bindLayoutEvents } from '../layout.js';

/**
 * @returns {boolean} true면 로그인 사용자라 register SPA로 보냄 (home 렌더 중단)
 */
export function redirectLoggedInFromRegisterIntro() {
  if (!isLoggedIn()) return false;
  const kind = getRegisterIntroKind();
  const dest = kind === 'tutor' ? TUTOR_REGISTER_URL : STUDY_ROOM_REGISTER_URL;
  window.location.assign(dest);
  return true;
}

export function renderRegisterIntro() {
  clearPendingRoute();
  const kind = getRegisterIntroKind() || 'room';
  const panel = renderRegisterIntroGate(kind);
  return `
    ${renderPreviewToolbar()}
    <div class="home-app">
      ${renderHeader('guest')}
      <div class="home-body home-body--no-promo">
        <div class="home-main">
          <div class="site-gate-wrap">
            ${panel}
          </div>
        </div>
      </div>
      ${renderFooter()}
    </div>
  `;
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindRegisterIntroEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  bindGuestGateLinks(root);
}
