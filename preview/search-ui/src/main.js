import '@auth-styles/base.css';
import '@auth-styles/theme-v1.css';
import '@home-ui/styles/tokens.css';
import '@home-ui/styles/home.css';
import '@home-ui/styles/design-system.css';
import './styles/search.css';
import './styles/handoff-bridge.css';

import { bindSearchPageEvents, renderSearchPage } from './screens/search-page.js';
import { syncRoleFromHash } from './state.js';
import { initAuthSession } from '@home-ui/auth-session.js';

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
  initAuthSession().finally(render);
}

init();
