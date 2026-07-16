import { renderPreviewToolbar, renderHeader, renderFooter, bindLayoutEvents, renderAppShellWithPromo } from '../layout.js';
import { getNavRole } from '../state.js';
import { LIBRARY_HEAD } from './library-copy.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function getRoleHomePath(role) {
  if (role === 'guest') return '/guest';
  if (role === 'parent') return '/parent';
  if (role === 'study_room') return '/study-room';
  return '/tutor';
}

/** @param {string} _screenId @param {string} bodyHtml */
export function renderLibraryShell(_screenId, bodyHtml) {
  const role = getNavRole();
  const homePath = getRoleHomePath(role);
  const mainHtml = `
    <div class="sup-layout">
      <header class="sup-content__head">
        <div>
          <h1 class="sup-content__title"><span class="sup-content__title-prefix">자료실-</span><span class="sup-content__title-suffix">${esc(LIBRARY_HEAD.title)}</span></h1>
        </div>
      </header>
      <div class="sup-frame sup-frame--library">
        <div class="sup-frame__body">
          ${bodyHtml}
          <footer class="sup-frame__foot">
            <a href="#${homePath}" class="sup-back-home" data-nav="${homePath}">← 메인 홈으로</a>
          </footer>
        </div>
      </div>
    </div>
  `;

  return renderAppShellWithPromo({
    toolbar: renderPreviewToolbar(),
    headerHtml: renderHeader(role),
    mainHtml,
    footerHtml: renderFooter(),
  });
}

export function bindLibraryShellEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
}
