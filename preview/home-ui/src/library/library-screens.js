import { LIBRARY_ENTRY_COPY } from './library-copy.js';
import { renderLibraryBoardCards, bindInfoBoardEntry } from './info-board-screens.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** #/library · #/library/templates · #/library/guides — 고객센터 자료실 입구와 같은 게시판 카드 */
export function renderLibraryScreen() {
  return `
    <section class="sup-panel-card">
      <div class="sup-panel-card__body">
        <p class="sup-panel-card__lead">${esc(LIBRARY_ENTRY_COPY.lead)}</p>
        ${renderLibraryBoardCards()}
      </div>
    </section>`;
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindLibraryScreenEvents(root, rerender) {
  root.querySelectorAll('[data-lib-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-lib-nav') || '/library';
    });
  });
  bindInfoBoardEntry(root, rerender);
}
