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

import { afterSearchPageMount, bindSearchPageEvents, renderSearchPage } from './screens/search-page.js';
import { syncRoleFromHash } from './state.js';
import { initAuthSession } from '@home-ui/auth-session.js';
import { isAuthRedirectPending } from '../../shared/auth-redirect.js';
import { resumePendingDeepIntent, resetDeepIntentResumeFlag } from '@home-ui/resume-deep-intent.js';

/** 세션 확정 후에만 GPS·복원 검색을 1회 돌린다. 첫 셸은 me.php를 기다리지 않는다. */
let allowFindBoot = false;
let sessionFollowUpDone = false;
let paintedHash = null;

function render() {
  const hashBefore = window.location.hash;
  syncRoleFromHash();
  const app = document.getElementById('app');
  const html = renderSearchPage();
  if (window.location.hash !== hashBefore) return;
  app.innerHTML = html;
  bindSearchPageEvents(app, render, { allowFindBoot });
  paintedHash = hashBefore;
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
  if (!isAuthRedirectPending()) {
    render();
  }
  if (!hadHash) {
    setTimeout(() => {
      bootReady = true;
      if (window.location.hash !== paintedHash) render();
    }, 0);
  }
  initAuthSession().then((user) => {
    if (sessionFollowUpDone) return;
    sessionFollowUpDone = true;
    if (isAuthRedirectPending()) return;
    allowFindBoot = true;
    if (user) {
      render();
      queueMicrotask(() => resumePendingDeepIntent());
      return;
    }
    afterSearchPageMount(render);
  });
  window.addEventListener('auth:login', () => {
    allowFindBoot = true;
    render();
    queueMicrotask(() => resumePendingDeepIntent());
  });
  window.addEventListener('auth:logout', () => {
    resetDeepIntentResumeFlag();
    allowFindBoot = true;
    render();
  });
}

init();
