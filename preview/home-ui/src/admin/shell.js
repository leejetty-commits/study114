/**
 * 관리자 셸 — 영카트식 그룹 + 서브메뉴 사이드바
 * (영카트: 좌측 GNB 아이콘 + gnb_oparea 서브. 여기선 그룹 접힘/펼침으로 동일 깊이 처리)
 */

import { renderPreviewToolbar, renderFooter, bindLayoutEvents, renderAppShellWithPromo } from '../layout.js';
import { A28_COPY, A28_MENU } from './a28-copy.js';
import { findAdminNavLeaf } from './router.js';
import { canAccessAdminMenu } from './admin-permissions.js';
import { getAuthUser, ROLE_HOME } from '../auth-session.js';
import { resolveAccountDisplayName } from '../auth/display-identity.js';
import { renderAdminRoleBadge } from './admin-guard.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** @returns {string} */
function roleHomeHash() {
  const user = getAuthUser();
  const path = user?.role_type ? ROLE_HOME[user.role_type] : null;
  return path || '/guest';
}

/** @param {string} path */
function findGroupForPath(path) {
  const leaf = findAdminNavLeaf(path);
  if (!leaf) return null;
  for (const g of A28_MENU) {
    if (g.children?.some((c) => c.path === leaf.path)) return g;
    if (g.path === leaf.path) return g;
  }
  return null;
}

/** @param {string} path */
function renderBreadcrumb(path) {
  const leaf = findAdminNavLeaf(path);
  const group = findGroupForPath(path);
  const groupLabel = group?.children ? group.label : null;
  return `
    <nav class="admin-breadcrumb" aria-label="위치">
      <a href="#/admin" data-a28-nav="/admin">운영</a>
      ${groupLabel ? `<span aria-hidden="true">/</span><span>${esc(groupLabel)}</span>` : ''}
      <span aria-hidden="true">/</span>
      <span>${esc(leaf?.label || '홈')}</span>
    </nav>`;
}

/**
 * @param {typeof A28_MENU[number]} group
 * @param {string} activePath
 */
function groupHasAccess(group) {
  if (group.children?.length) {
    return group.children.some((c) => canAccessAdminMenu(c.menuId || c.id));
  }
  return canAccessAdminMenu(group.menuId || group.id);
}

/** @param {string} activePath */
function renderSidebar(activePath) {
  const activeLeaf = findAdminNavLeaf(activePath);
  const activeGroup = findGroupForPath(activePath);

  const blocks = A28_MENU.filter(groupHasAccess)
    .map((group) => {
      if (!group.children?.length) {
        const active = group.path === activePath ? ' is-active' : '';
        return `
          <a href="#${group.path}" class="admin-sidebar__link${active}" data-a28-nav="${group.path}">
            <span class="admin-sidebar__label">${esc(group.label)}</span>
          </a>`;
      }

      const kids = group.children.filter((c) => canAccessAdminMenu(c.menuId || c.id));
      if (!kids.length) return '';

      const open = activeGroup?.id === group.id;
      const childLinks = kids
        .map((c) => {
          const active = c.path === activeLeaf?.path ? ' is-active' : '';
          const locked = c.masterOnly ? ' admin-sidebar__sublink--locked' : '';
          return `<a href="#${c.path}" class="admin-sidebar__sublink${active}${locked}" data-a28-nav="${c.path}">${esc(c.label)}</a>`;
        })
        .join('');

      return `
        <details class="admin-sidebar__group"${open ? ' open' : ''}>
          <summary class="admin-sidebar__group-title">${esc(group.label)}</summary>
          <div class="admin-sidebar__subnav">${childLinks}</div>
        </details>`;
    })
    .join('');

  return `
    <aside class="admin-sidebar" aria-label="관리자 메뉴">
      <div class="admin-sidebar__brand">
        <strong>우동공과 관리자</strong>
        <span class="admin-sidebar__badge">${esc(A28_COPY.previewBadge)}</span>
      </div>
      <a href="#${roleHomeHash()}" class="admin-sidebar__exit" data-nav="${roleHomeHash()}">← 역할 홈으로 돌아가기</a>
      <nav class="admin-sidebar__nav">${blocks}</nav>
    </aside>`;
}

/** @param {string} path @param {string} bodyHtml */
export function renderAdminShell(path, bodyHtml) {
  const user = getAuthUser();
  const leaf = findAdminNavLeaf(path);

  const mainHtml = `
    <div class="admin-shell">
      ${renderSidebar(path)}
      <div class="admin-shell__main">
        <header class="admin-topbar">
          <div class="admin-topbar__left">
            ${renderBreadcrumb(path)}
            ${leaf?.help ? `<p class="admin-topbar__help">${esc(leaf.help)}</p>` : ''}
          </div>
          <div class="admin-topbar__right">
            ${renderAdminRoleBadge()}
            <span class="admin-topbar__user">${esc(resolveAccountDisplayName(user) || user?.email || '비로그인')}</span>
            <a href="#${roleHomeHash()}" class="admin-topbar__exit btn btn--secondary btn--sm" data-nav="${roleHomeHash()}">← 역할 홈으로</a>
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
    appClass: 'home-app--admin',
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
