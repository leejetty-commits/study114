import { renderPreviewToolbar, renderHeader, renderFooter, bindLayoutEvents } from '../layout.js';
import { getNavRole } from '../state.js';
import { MYPAGE_NAV, getScreenIdForPath, screenTitle } from './router.js';
import { isMessagesDetailPath } from '../messages/router.js';
import { renderMessagesProviderToolbar } from '../messages/shell.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/**
 * @param {string} currentPath
 * @param {string} bodyHtml
 */
export function renderMypageShell(currentPath, bodyHtml) {
  const role = getNavRole();
  const screenId = getScreenIdForPath(currentPath);
  const title = screenTitle(screenId, currentPath);

  const navItems = MYPAGE_NAV.filter((item) => !item.roles || item.roles.includes(role))
    .map((item) => {
    const active =
      currentPath === item.path ||
      (item.path === '/mypage/registrations' && currentPath.startsWith('/mypage/registrations')) ||
      (item.path === '/mypage/messages' && currentPath.startsWith('/mypage/messages')) ||
      (item.path === '/mypage/plans' && currentPath.startsWith('/mypage/paid'));
    const emph = item.emphasis?.includes(role) ? ' is-emphasis' : '';
    return `
      <a href="#${item.path}" class="mypage-nav__link${active ? ' is-active' : ''}${emph}" data-mypage-nav="${item.path}">
        ${esc(item.label)}
      </a>`;
    })
    .join('');

  return `
    ${renderPreviewToolbar()}
    <div class="home-app">
      ${renderHeader(role, { showAuth: false, showRoleSwitch: false })}
      <main class="home-main mypage-main">
        <div class="mypage-layout">
          <aside class="mypage-sidebar" aria-label="마이페이지 메뉴">
            <p class="mypage-sidebar__title">마이페이지</p>
            <nav class="mypage-nav">${navItems}</nav>
            <a href="#${role === 'parent' ? '/parent' : role === 'study_room' ? '/study-room' : '/tutor'}" class="mypage-nav__back" data-nav="${role === 'parent' ? '/parent' : role === 'study_room' ? '/study-room' : '/tutor'}">← 메인 홈으로</a>
          </aside>
          <div class="mypage-content">
            <header class="mypage-content__head">
              <h1 class="mypage-content__title">${esc(title)}</h1>
            </header>
            ${isMessagesDetailPath(currentPath) ? renderMessagesProviderToolbar() : ''}
            ${bodyHtml}
          </div>
        </div>
      </main>
      ${renderFooter()}
    </div>
  `;
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindMypageShellEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  root.querySelectorAll('[data-mypage-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-mypage-nav') || '/mypage/home';
    });
  });
}
