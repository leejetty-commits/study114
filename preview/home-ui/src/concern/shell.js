import { renderPreviewToolbar, renderHeader, renderFooter, bindLayoutEvents, renderAppShellWithPromo } from '../layout.js';
import { getNavRole, getCommunityPath } from '../state.js';
import { renderConcernScreen, renderConcernSideNav, bindConcernScreenEvents } from './screens.js';
import { getCommunityView } from './router.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function renderCommunityPageTitle(path) {
  const view = getCommunityView(path.split('?')[0]);
  const suffix = view.board?.label || '';
  if (!suffix) {
    return `<span class="sup-content__title-prefix">커뮤니티</span>`;
  }
  return `<span class="sup-content__title-prefix">커뮤니티</span><span class="sup-content__title-suffix">${esc(suffix)}</span>`;
}

export function renderConcernShell(currentPath, bodyHtml) {
  const role = getNavRole();
  const sub = role === 'guest' ? '/guest' : role === 'parent' ? '/parent' : role === 'study_room' ? '/study-room' : '/tutor';

  const mainHtml = `
    <div class="concern-layout">
      <header class="concern-content__head">
        <h1 class="concern-content__title">${renderCommunityPageTitle(currentPath)}</h1>
      </header>
      <div class="concern-frame">
        ${renderConcernSideNav(currentPath)}
        <div class="concern-frame__body">${bodyHtml}</div>
      </div>
      <a href="#${sub}" class="guide-back-home" data-nav="${sub}">← 메인 홈으로</a>
    </div>
  `;

  return renderAppShellWithPromo({
    toolbar: renderPreviewToolbar(),
    headerHtml: renderHeader(role, { activeGnbId: 'community' }),
    mainHtml,
    footerHtml: renderFooter(),
    slotKey: 'home_right_rail',
    appClass: 'concern-app',
  });
}

export function bindConcernShellEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  bindConcernScreenEvents(root, rerender);
  root.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-nav') || '/guest';
    });
  });
}

export function renderConcern() {
  const path = getCommunityPath();
  const body = renderConcernScreen(path);
  return renderConcernShell(path, body);
}

export function bindConcernEvents(root, rerender) {
  bindConcernShellEvents(root, rerender);
}
