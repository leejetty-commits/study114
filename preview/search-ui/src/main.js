import '@auth-styles/base.css';
import '@auth-styles/theme-v1.css';
import '@home-ui/styles/tokens.css';
import '@home-ui/styles/home.css';
/* home.css 분리분 — 검색 셸의 우측 배너·목록·상세(P24)·소개 카드에 필요 */
import '@home-ui/styles/home-listings.css';
import '@home-ui/styles/home-member-flows.css';
import '@home-ui/styles/home-right-rail.css';
import '@home-ui/styles/home-provider-reviews.css';
import '@home-ui/styles/home-promo.css';
import './styles/search.css';
import './styles/handoff-bridge.css';
import '@home-ui/styles/design-system.css';
import '@home-ui/styles/product-chrome.css';
import '@home-ui/styles/home-marketing-banner.css';
import './styles/search-visily.css';
import '@home-ui/styles/udx-std-apply.css';

import { bindSearchPageEvents, renderSearchPage } from './screens/search-page.js';
import { replaceSearchRightRail } from './layout.js';
import { mountOpsChrome } from '@home-ui/site-ops-chrome.js';
import { syncRoleFromHash } from './state.js';
import { getSessionConfirmStatus, initAuthSession, isEmailVerified } from '@home-ui/auth-session.js';
import { hydrateExposureBridge } from '@home-ui/exposure-bridge.js';
import { isAuthRedirectPending } from '../../shared/auth-redirect.js';
import { resumePendingDeepIntent, resetDeepIntentResumeFlag } from '@home-ui/resume-deep-intent.js';
import { presentLoginWelcome } from '../../shared/login-welcome.js';

/**
 * 세션 확정 후에만 GPS·복원 검색을 1회 돌린다. 첫 셸은 me.php를 기다리지 않는다.
 * 레일 6건(concern-hot 3 + 정보 글 3)은 allowFindBoot 가 켜진 뒤 한 번만 보낸다.
 * unconfirmed 도 initAuthSession 이 끝나면 이 값이 켜지고, 그때 남은 로그인 상태로 한 번 받는다.
 */
let allowFindBoot = false;
let sessionFollowUpDone = false;
let paintedHash = null;

/** 공부방찾기 첫 주소. 과외쌤찾기·학생찾기는 여기 넣지 않는다. */
function isStudyRoomFindEntry() {
  const path = (window.location.hash || '').replace(/^#/, '').split('?')[0];
  return path === '/search/room';
}

function render() {
  // 세션 확인 전에는 비회원 헤더·본문을 그리지 않는다. 앱은 빈 채로 둔다.
  if (!allowFindBoot) return;
  const hashBefore = window.location.hash;
  syncRoleFromHash();
  const app = document.getElementById('app');
  const html = renderSearchPage({ sessionReady: allowFindBoot, deferRailFetch: !allowFindBoot });
  const paintBlocked = window.location.hash !== hashBefore || isAuthRedirectPending();
  if (!paintBlocked) {
    app.innerHTML = html;
    bindSearchPageEvents(app, render, { allowFindBoot });
    mountOpsChrome(app);
    paintedHash = hashBefore;
    return;
  }
  // 해시가 바뀌거나 인증 대기로 페이지 전체를 못 심어도, 세션 전 손님 레일은 남기지 않는다.
  if (allowFindBoot) replaceSearchRightRail(app);
}

function init() {
  const hadHash = Boolean(window.location.hash);
  if (!hadHash) {
    window.location.hash = '#/search/room';
  }
  // 빈 해시를 채운 직후의 hashchange는 첫 셸과 같은 해시라 다시 그리지 않는다.
  let bootReady = hadHash;
  window.addEventListener('hashchange', () => {
    if (!bootReady) return;
    if (window.location.hash === paintedHash) return;
    render();
  });
  if (!hadHash) {
    setTimeout(() => {
      bootReady = true;
      if (window.location.hash !== paintedHash) render();
    }, 0);
  }
  const deferExposurePool = isStudyRoomFindEntry();
  initAuthSession(false, { deferExposurePool }).then((user) => {
    if (sessionFollowUpDone) return;
    sessionFollowUpDone = true;
    presentLoginWelcome(user?.name, Boolean(user));
    allowFindBoot = true;
    render();
    // 목록 요청이 먼저 나간 뒤에 노출 풀을 한 탭씩 채운다. 확인 실패·비회원은 풀을 부르지 않는다.
    if (deferExposurePool && getSessionConfirmStatus() === 'authenticated') {
      queueMicrotask(() => {
        hydrateExposureBridge({ sequential: true }).catch((err) => {
          console.warn('[auth] exposure hydrate skipped', err);
        });
      });
    }
    if (isAuthRedirectPending()) return;
    if (user && isEmailVerified()) {
      queueMicrotask(() => resumePendingDeepIntent());
    }
  });
  window.addEventListener('auth:login', () => {
    allowFindBoot = true;
    render();
    if (isEmailVerified()) queueMicrotask(() => resumePendingDeepIntent());
  });
  window.addEventListener('auth:logout', () => {
    resetDeepIntentResumeFlag();
    allowFindBoot = true;
    render();
  });
}

init();
