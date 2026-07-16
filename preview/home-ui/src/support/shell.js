import { renderPreviewToolbar, renderHeader, renderFooter, bindLayoutEvents, renderAppShellWithPromo } from '../layout.js';
import { getNavRole } from '../state.js';
import { renderPageTitle, renderSupportNav } from './nav.js';

/**
 * @param {string} currentPath
 * @param {string} bodyHtml
 */
export function renderSupportShell(currentPath, bodyHtml) {
  const role = getNavRole();
  const sub = role === 'guest' ? '/guest' : role === 'parent' ? '/parent' : role === 'study_room' ? '/study-room' : '/tutor';

  const mainHtml = `
    <div class="sup-layout">
      <header class="sup-content__head">
        <div>
          <h1 class="sup-content__title">${renderPageTitle(currentPath)}</h1>
        </div>
      </header>
      <div class="sup-frame">
        ${renderSupportNav(currentPath)}
        <div class="sup-frame__body">${bodyHtml}</div>
      </div>
      <a href="#${sub}" class="sup-back-home" data-nav="${sub}">← 메인 홈으로</a>
    </div>
  `;

  return renderAppShellWithPromo({
    toolbar: renderPreviewToolbar(),
    headerHtml: renderHeader(role),
    mainHtml,
    footerHtml: renderFooter(),
  });
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindSupportShellEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  root.querySelectorAll('[data-sup-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-sup-nav') || '/support';
    });
  });
  root.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-nav') || '/guest';
    });
  });
}
