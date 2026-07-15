/**
 * 9장 부록 — 로그인 스테이지 (흐린 홈 실루엣 + 중앙 카드)
 * 유틸 메뉴는 site-chrome 공통 헤더(UTIL_MENU.guest) 사용 — 별도 login-util 두지 않음
 */

import { HOME_UI_BASE } from '../../shared/preview-links.js';

function renderSilhouetteRoom() {
  return `
    <div class="login-silhouette login-silhouette--room" aria-hidden="true">
      <div class="login-silhouette__map"></div>
      <div class="login-silhouette__prime-row">
        <span></span><span></span><span></span>
      </div>
      <div class="login-silhouette__pick-row">
        <span></span><span></span>
      </div>
      <div class="login-silhouette__list">
        <span></span><span></span><span></span>
      </div>
    </div>`;
}

function renderSilhouetteTutor() {
  return `
    <div class="login-silhouette login-silhouette--tutor" aria-hidden="true">
      <div class="login-silhouette__headline"></div>
      <div class="login-silhouette__chips">
        <span></span><span></span><span></span>
      </div>
      <div class="login-silhouette__prime-row">
        <span></span><span></span>
      </div>
      <div class="login-silhouette__list">
        <span></span><span></span><span></span>
      </div>
    </div>`;
}

export function renderLoginBackdrop() {
  return `
    <div class="login-stage__backdrop" aria-hidden="true">
      ${renderSilhouetteRoom()}
      ${renderSilhouetteTutor()}
    </div>`;
}

export function renderLoginPurposeChips() {
  const chips = ['우리동네 공부방 찾기', '과외쌤 비교하기', '쪽지로 이어서 상담하기'];
  return `
    <div class="login-purpose" aria-label="로그인 후 할 수 있는 일">
      ${chips.map((label) => `<span class="login-purpose__chip">${label}</span>`).join('')}
    </div>`;
}

/**
 * 카드 아래 — 목적 칩·안내 (9장 부록 §8)
 * @param {{ returnTo?: string, lead?: string }} [opts]
 */
export function renderLoginStageBelow(opts = {}) {
  const guestUrl = `${HOME_UI_BASE}#/guest`;
  const lead =
    opts.lead ||
    (opts.returnTo
      ? '로그인하면 방금 보던 화면으로 돌아갑니다.'
      : '저장한 탐색 조건과 최근 본 후보를 이어서 확인할 수 있습니다.');
  return `
    <div class="login-stage__below">
      ${renderLoginPurposeChips()}
      <p class="login-stage__lead">${lead}</p>
      <p class="login-stage__guest">
        <a href="${guestUrl}" class="login-stage__guest-link">로그인 없이 둘러보기</a>
        <span class="login-stage__guest-hint">· 대치동 데모</span>
      </p>
    </div>`;
}
