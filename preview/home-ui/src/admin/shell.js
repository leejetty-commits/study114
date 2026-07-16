import { renderPreviewToolbar, renderFooter, bindLayoutEvents, renderAppShellWithPromo } from '../layout.js';
import { A28_COPY, A28_NAV } from './a28-copy.js';
import { getAdminScreenId, getAdminMenuId } from './router.js';
import { canAccessAdminMenu } from './admin-permissions.js';
import { getAuthUser } from '../auth-session.js';
import { renderAdminRoleBadge } from './admin-guard.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** @param {string} path */
function renderBreadcrumb(path) {
  const item = A28_NAV.find((n) => n.path === path) || A28_NAV[0];
  return `
    <nav class="admin-breadcrumb" aria-label="breadcrumb">
      <a href="#/admin" data-a28-nav="/admin">운영</a>
      <span aria-hidden="true">/</span>
      <span>${esc(item?.label || '홈')}</span>
    </nav>`;
}

/** @param {string} activePath */
function renderSidebar(activePath) {
  const links = A28_NAV.filter((item) => canAccessAdminMenu(item.id))
    .map((item) => {
      const active = item.path === activePath ? ' is-active' : '';
      const locked = item.masterOnly ? ' admin-sidebar__link--locked' : '';
      return `<a href="#${item.path}" class="admin-sidebar__link${active}${locked}" data-a28-nav="${item.path}">
        <span class="admin-sidebar__label">${esc(item.label)}</span>
        <span class="admin-sidebar__id">${esc(item.screenId)}</span>
      </a>`;
    })
    .join('');

  return `
    <aside class="admin-sidebar" aria-label="관리자 메뉴">
      <div class="admin-sidebar__brand">
        <strong>${esc(A28_COPY.hubTitle)}</strong>
        <span class="admin-sidebar__badge">${esc(A28_COPY.previewBadge)}</span>
      </div>
      <a href="#/guest" class="admin-sidebar__exit" data-nav="/guest">← 서비스로 나가기</a>
      <nav class="admin-sidebar__nav">${links}</nav>
    </aside>`;
}

/** @param {string} path @param {string} bodyHtml */
export function renderAdminShell(path, bodyHtml) {
  const screenId = getAdminScreenId(path);
  const user = getAuthUser();
  const menuId = getAdminMenuId(path);

  const mainHtml = `
    <div class="admin-shell">
      ${renderSidebar(path)}
      <div class="admin-shell__main">
        <header class="admin-topbar">
          <div class="admin-topbar__left">
            ${renderBreadcrumb(path)}
            <span class="admin-topbar__screen">${esc(screenId)} · ${esc(menuId)}</span>
          </div>
          <div class="admin-topbar__right">
            ${renderAdminRoleBadge()}
            <span class="admin-topbar__user">${esc(user?.email || '비로그인')}</span>
            <a href="#/guest" class="admin-topbar__exit btn btn--secondary btn--sm" data-nav="/guest">← 서비스 홈</a>
          </div>
        </header>
        <div class="admin-shell__body">${bodyHtml}</div>
      </div>
    </div>
  `;

  return renderAppShellWithPromo({
    toolbar: renderPreviewToolbar(),
    headerHtml: '',
    mainHtml,
    footerHtml: renderFooter(),
    slotKey: null,
  });
}

export function bindAdminShellEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  root.querySelectorAll('[data-a28-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.getAttribute('data-a28-nav');
      if (target) window.location.hash = target.startsWith('/') ? target : `/${target}`;
    });
  });
}
