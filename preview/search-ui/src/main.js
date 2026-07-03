import '@auth-styles/base.css';
import '@auth-styles/theme-v1.css';
import './styles/search.css';

import { bindSearchPageEvents, renderSearchPage } from './screens/search-page.js';
import { syncRoleFromHash } from './state.js';

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
  render();
}

init();
