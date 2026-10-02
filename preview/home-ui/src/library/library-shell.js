import { renderPreviewToolbar, renderHeader, renderFooter, bindLayoutEvents, renderAppShellWithPromo } from '../layout.js';
import { getNavRole } from '../state.js';
import { getAuthUser } from '../auth-session.js';
import { memberHomeHashPath } from '../nav-config.js';
import { LIBRARY_ENTRY_COPY } from './library-copy.js';
import { isInfoBoardPath } from './library-router.js';
import { renderInfoBoardNavLinks, infoBoardTitleFor } from './info-board-screens.js';
import { currentInfoViewer } from './info-board-store.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function getRoleHomePath() {
  return memberHomeHashPath(getAuthUser());
}

/** @param {string} path */
function renderLibraryNav(path) {
  const entryActive = !isInfoBoardPath(path);
  return `
    <nav class="sup-nav" aria-label="자료실 메뉴">
      <ul class="sup-nav__list">
        <li>
          <a href="#/library" class="sup-nav__link${entryActive ? ' is-active' : ''}" data-lib-nav="/library"${entryActive ? ' aria-current="page"' : ''}>
            <span class="sup-nav__label">${esc(LIBRARY_ENTRY_COPY.navEntry)}</span>
          </a>
        </li>
        ${renderInfoBoardNavLinks(path, currentInfoViewer().boardRole)}
        <li>
          <a href="#/support" class="sup-nav__link" data-lib-nav="/support">
            <span class="sup-nav__label">← 고객센터</span>
          </a>
        </li>
      </ul>
    </nav>`;
}

/** @param {string} path */
function renderLibraryTitle(path) {
  if (isInfoBoardPath(path)) {
    const label = infoBoardTitleFor(path, currentInfoViewer().boardRole);
    const suffix = label ? `<span class="sup-content__title-suffix">${esc(label)}</span>` : '';
    return `<span class="sup-content__title-prefix">자료실</span>${suffix}`;
  }
  return `<span class="sup-content__title-prefix">자료실</span>`;
}

/**
 * @param {string} path
 * @param {string} bodyHtml
 */
export function renderLibraryShell(path, bodyHtml) {
  const role = getNavRole();
  const homePath = getRoleHomePath();
  const mainHtml = `
    <div class="sup-layout">
      <header class="sup-content__head">
        <div>
          <h1 class="sup-content__title">${renderLibraryTitle(path)}</h1>
        </div>
      </header>
      <div class="sup-frame sup-frame--library">
        ${renderLibraryNav(path)}
        <div class="sup-frame__body">${bodyHtml}</div>
      </div>
      <a href="#${homePath}" class="sup-back-home" data-nav="${homePath}">← 메인 홈으로</a>
    </div>
  `;

  return renderAppShellWithPromo({
    toolbar: renderPreviewToolbar(),
    headerHtml: renderHeader(role),
    mainHtml,
    footerHtml: renderFooter(),
    slotKey: 'support_right_rail',
  });
}

export function bindLibraryShellEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
}
