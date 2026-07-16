import { renderPreviewToolbar, renderHeader, renderFooter, bindLayoutEvents } from '../layout.js';
import { getNavRole } from '../state.js';
import { renderPlansPageTitle, renderPlansNav } from './nav.js';

/**
 * @param {string} currentPath
 * @param {string} bodyHtml
 * @param {{ role?: string, isGuest?: boolean }} [opts]
 */
export function renderPlansShell(currentPath, bodyHtml, opts = {}) {
  const role = opts.role || getNavRole();
  const headerRole = opts.headerRole || role;
  const sub =
    role === 'guest' ? '/guest' : role === 'parent' ? '/parent' : role === 'study_room' ? '/study-room' : '/tutor';
  const hideNav =
    currentPath.startsWith('/plans/checkout') || currentPath.startsWith('/plans/result');
  const guestCatalogOnly = Boolean(opts.isGuest);

  return `
    ${renderPreviewToolbar()}
    <div class="home-app">
      ${renderHeader(headerRole)}
      <main class="home-main sup-main">
        <div class="sup-layout plans-layout">
          <header class="sup-content__head">
            <div>
              <h1 class="sup-content__title">${renderPlansPageTitle(currentPath)}</h1>
            </div>
          </header>
          <div class="sup-frame">
            ${hideNav ? '' : renderPlansNav(currentPath, { guestCatalogOnly })}
            <div class="sup-frame__body">${bodyHtml}</div>
          </div>
          <a href="#${sub}" class="sup-back-home" data-nav="${sub}">← 메인 홈으로</a>
        </div>
      </main>
      ${renderFooter()}
    </div>
  `;
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindPlansShellEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  root.querySelectorAll('[data-plans-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-plans-nav') || '/plans';
    });
  });
  root.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-nav') || '/guest';
    });
  });
}
