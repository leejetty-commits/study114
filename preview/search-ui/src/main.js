import '@auth-styles/base.css';
import '@auth-styles/theme-v1.css';
import '@home-ui/styles/tokens.css';
import '@home-ui/styles/home.css';
/* home.css 분리분 — 검색 셸의 우측 배너·목록·상세(P24)·소개 카드에 필요 */
import '@home-ui/styles/home-listings.css';
import '@home-ui/styles/home-member-flows.css';
import '@home-ui/styles/home-right-rail.css';
import '@home-ui/styles/home-promo.css';
import './styles/search.css';
import './styles/handoff-bridge.css';
import '@home-ui/styles/design-system.css';
import '@home-ui/styles/product-chrome.css';
import '@home-ui/styles/home-marketing-banner.css';
import './styles/search-visily.css';

import { bindSearchPageEvents, renderSearchPage } from './screens/search-page.js';
import { syncRoleFromHash } from './state.js';
import { initAuthSession } from '@home-ui/auth-session.js';
import { isAuthRedirectPending } from '../../shared/auth-redirect.js';

function render() {
  syncRoleFromHash();
  const app = document.getElementById('app');
  app.innerHTML = renderSearchPage();
  bindSearchPageEvents(app, render);
}

function init() {
  if (!window.location.hash) {
    window.location.hash = '#/search/room';
  }
  window.addEventListener('hashchange', render);
  initAuthSession().then(() => {
    if (isAuthRedirectPending()) return;
    render();
  });
}

init();
