import { renderPreviewToolbar, renderHeader, renderFooter, bindLayoutEvents, renderAppShellWithPromo } from '../layout.js';
import { getNavRole } from '../state.js';
import { LIBRARY_HEAD, LIBRARY_SECTIONS } from './library-copy.js';
import { getLibrarySection } from './library-router.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function getRoleHomePath(role) {
  if (role === 'guest') return '/guest';
  if (role === 'parent') return '/parent';
  if (role === 'study_room') return '/study-room';
  return '/tutor';
}

/** @param {string} path */
function renderLibraryNav(path) {
  const section = getLibrarySection(path);
  return `
    <nav class="sup-nav" aria-label="자료실 메뉴">
      <ul class="sup-nav__list">
        ${LIBRARY_SECTIONS.map(
          (s) =>
            `<li>
              <a href="#${s.path}" class="sup-nav__link${s.key === section ? ' is-active' : ''}" data-lib-nav="${s.path}">
                <span class="sup-nav__label">${esc(s.label)}</span>
              </a>
            </li>`,
        ).join('')}
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
  const section = getLibrarySection(path);
  const meta = LIBRARY_SECTIONS.find((s) => s.key === section) || LIBRARY_SECTIONS[0];
  const suffix = section === 'library' ? LIBRARY_HEAD.title : meta.label;
  return `<span class="sup-content__title-prefix">자료실-</span><span class="sup-content__title-suffix">${esc(suffix)}</span>`;
}

/**
 * @param {string} path
 * @param {string} bodyHtml
 */
export function renderLibraryShell(path, bodyHtml) {
  const role = getNavRole();
  const homePath = getRoleHomePath(role);
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
