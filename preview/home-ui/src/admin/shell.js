import { renderPreviewToolbar, renderFooter, bindLayoutEvents } from '../layout.js';
import { A28_COPY } from './a28-copy.js';
import { getAdminScreenId } from './router.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** @param {string} path @param {string} bodyHtml */
export function renderAdminShell(path, bodyHtml) {
  const screenId = getAdminScreenId(path);
  return `
    ${renderPreviewToolbar()}
    <div class="home-app a28-app">
      <main class="home-main sup-main">
        <div class="sup-layout sup-layout--admin">
          <header class="sup-content__head a28-head">
            <div>
              <h1 class="sup-content__title">${esc(A28_COPY.hubTitle)}</h1>
              <span class="sup-content__screen-id">${esc(screenId)} · 28장 · 내부 전용</span>
            </div>
          </header>
          <div class="sup-frame sup-frame--admin">
            <div class="sup-frame__body">${bodyHtml}</div>
          </div>
        </div>
      </main>
      ${renderFooter()}
    </div>
  `;
}

export function bindAdminShellEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
}
