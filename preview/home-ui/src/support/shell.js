import { renderPreviewToolbar, renderHeader, renderFooter, bindLayoutEvents } from '../layout.js';
import { getNavRole } from '../state.js';
import { getScreenIdForPath, screenTitle } from './router.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/**
 * @param {string} currentPath
 * @param {string} bodyHtml
 */
export function renderSupportShell(currentPath, bodyHtml) {
  const role = getNavRole();
  const screenId = getScreenIdForPath(currentPath);
  const title = screenTitle(screenId);
  const sub = role === 'guest' ? '/guest' : role === 'parent' ? '/parent' : role === 'study_room' ? '/study-room' : '/tutor';

  return `
    ${renderPreviewToolbar()}
    <div class="home-app">
      ${renderHeader(role, { showAuth: role === 'guest', showRoleSwitch: role !== 'guest' })}
      <main class="home-main sup-main">
        <div class="sup-layout">
          <header class="sup-content__head">
            <div>
              <h1 class="sup-content__title">${esc(title)}</h1>
              <span class="sup-content__screen-id">${esc(screenId)} · 17장</span>
            </div>
            ${
              currentPath !== '/support'
                ? `<a href="#/support" class="sup-link-muted" data-sup-nav="/support">P17-01 홈</a>`
                : ''
            }
          </header>
          ${bodyHtml}
          <a href="#${sub}" class="sup-back-home" data-nav="${sub}">← 메인 홈으로</a>
        </div>
      </main>
      ${renderFooter()}
    </div>
  `;
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
