import { renderPreviewToolbar, renderHeader, renderFooter, bindLayoutEvents, renderAppShellWithPromo } from '../layout.js';
import { getNavRole } from '../state.js';
import { renderGuidePageTitle, renderGuideNav } from './nav.js';

export function renderGuideShell(currentPath, bodyHtml) {
  const role = getNavRole();
  const sub = role === 'guest' ? '/guest' : role === 'parent' ? '/parent' : role === 'study_room' ? '/study-room' : '/tutor';

  const mainHtml = `
    <div class="guide-layout">
      <header class="guide-content__head">
        <div>
          <h1 class="guide-content__title">${renderGuidePageTitle(currentPath)}</h1>
        </div>
      </header>
      <div class="guide-frame">
        ${renderGuideNav(currentPath)}
        <div class="guide-frame__body">${bodyHtml}</div>
      </div>
      <a href="#${sub}" class="guide-back-home" data-nav="${sub}">← 메인 홈으로</a>
    </div>
  `;

  return renderAppShellWithPromo({
    toolbar: renderPreviewToolbar(),
    headerHtml: renderHeader(role),
    mainHtml,
    footerHtml: renderFooter(),
    slotKey: 'support_right_rail',
    appClass: 'guide-app',
  });
}

export function bindGuideShellEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  root.querySelectorAll('[data-guide-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-guide-nav') || '/guide';
    });
  });
  root.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-nav') || '/guest';
    });
  });
}

