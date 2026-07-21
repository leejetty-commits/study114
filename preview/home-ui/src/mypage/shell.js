import { renderPreviewToolbar, renderHeader, renderFooter, bindLayoutEvents, renderAppShellWithPromo } from '../layout.js';
import { getNavRole } from '../state.js';
import { getAuthUser, isAdminUser } from '../auth-session.js';
import { resolveAccountDisplayName, isInternalAuthEmail, formatLoginAccountLabel } from '../auth/display-identity.js';
import { MYPAGE_NAV, getScreenIdForPath, screenTitle } from './router.js';
import { isMessagesDetailPath } from '../messages/router.js';
import { renderMessagesProviderToolbar } from '../messages/shell.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function navItemIsActive(item, currentPath) {
  return (
    currentPath === item.path ||
    (item.path === '/mypage/registrations' && currentPath.startsWith('/mypage/registrations')) ||
    (item.path === '/mypage/messages' && currentPath.startsWith('/mypage/messages')) ||
    (item.path === '/mypage/plans' &&
      (currentPath.startsWith('/mypage/plans') || currentPath.startsWith('/mypage/paid')))
  );
}

function renderBreadcrumb(currentPath, title, role) {
  const primary = MYPAGE_NAV.filter((item) => !item.roles || item.roles.includes(role)).find((item) =>
    navItemIsActive(item, currentPath),
  );
  const parts = [{ label: '마이페이지 홈', path: '/mypage/home' }];
  if (primary && primary.path !== '/mypage/home') {
    parts.push({ label: primary.label, path: primary.path });
  }
  if (title && title !== parts.at(-1)?.label) {
    parts.push({ label: title });
  }

  return `
    <nav class="mypage-breadcrumb" aria-label="현재 위치">
      ${parts
        .map((part, index) => {
          const isLast = index === parts.length - 1;
          const content =
            part.path && !isLast
              ? `<a href="#${part.path}" data-mypage-nav="${part.path}">${esc(part.label)}</a>`
              : `<span aria-current="${isLast ? 'page' : 'false'}">${esc(part.label)}</span>`;
          return `${index ? '<span class="mypage-breadcrumb__sep" aria-hidden="true">›</span>' : ''}${content}`;
        })
        .join('')}
    </nav>`;
}

/**
 * @param {string} currentPath
 * @param {string} bodyHtml
 */
export function renderMypageShell(currentPath, bodyHtml) {
  const role = getNavRole();
  const screenId = getScreenIdForPath(currentPath);
  const title = screenTitle(screenId, currentPath);
  const authUser = getAuthUser();
  const roleLabel =
    role === 'parent'
      ? '학부모'
      : role === 'study_room'
        ? '공부방'
        : role === 'tutor'
          ? '과외쌤'
          : '게스트';
  const homePath =
    role === 'parent'
      ? '/parent'
      : role === 'study_room'
        ? '/study-room'
        : role === 'tutor'
          ? '/tutor'
          : '/guest';
  const displayName = resolveAccountDisplayName(authUser);
  const displayInitial = String(displayName || roleLabel || '우').trim().charAt(0) || '우';
  const displayEmail = String(authUser?.email || '').trim();
  const accountPrimary = displayName;
  const accountSecondary =
    displayEmail && !isInternalAuthEmail(displayEmail) && displayEmail !== displayName
      ? displayEmail
      : isInternalAuthEmail(displayEmail)
        ? `로그인 계정: ${formatLoginAccountLabel(displayEmail)}`
        : '';
  const railSlotKey = currentPath.startsWith('/mypage/registrations')
    ? 'register_right_rail'
    : currentPath.startsWith('/mypage/paid') || currentPath.startsWith('/mypage/plans')
      ? 'plans_right_rail'
      : currentPath.startsWith('/mypage/submission-board')
        ? 'detail_right_rail'
        : 'support_right_rail';

  const navItems = MYPAGE_NAV.filter((item) => !item.roles || item.roles.includes(role))
    .map((item) => {
    const active = navItemIsActive(item, currentPath);
    const emph = item.emphasis?.includes(role) ? ' is-emphasis' : '';
    return `
      <a href="#${item.path}" class="mypage-nav__link${active ? ' is-active' : ''}${emph}" data-mypage-nav="${item.path}">
        <span class="mypage-nav__icon" aria-hidden="true">${esc(item.icon || '•')}</span>
        <span>${esc(item.label)}</span>
      </a>`;
    })
    .join('');

  const mainHtml = `
    <div class="mypage-layout">
      <aside class="mypage-sidebar" aria-label="마이페이지 메뉴">
        <p class="mypage-sidebar__eyebrow">내 공간</p>
        <p class="mypage-sidebar__title">나의 우동공과</p>
        ${
          authUser
            ? `<div class="mypage-account-card">
                <span class="mypage-account-card__avatar" aria-hidden="true">${esc(displayInitial)}</span>
                <span class="mypage-account-card__body">
                  <span class="mypage-account-card__label">반가워요</span>
                  <strong class="mypage-account-card__email">${esc(accountPrimary)}</strong>
                  ${accountSecondary ? `<span class="mypage-account-card__sub">${esc(accountSecondary)}</span>` : ''}
                  <span class="mypage-account-card__role">${esc(roleLabel)}${isAdminUser() ? ' · 관리자' : ''}</span>
                </span>
              </div>`
            : ''
        }
        <nav class="mypage-nav">${navItems}</nav>
        ${isAdminUser() ? '<a href="#/admin" class="mypage-nav__admin" data-nav="/admin">관리자 콘솔</a>' : ''}
        <a href="#${homePath}" class="mypage-nav__back" data-nav="${homePath}">← 역할 홈으로</a>
      </aside>
      <div class="mypage-content">
        <header class="mypage-content__head">
          ${renderBreadcrumb(currentPath, title, role)}
          <h1 class="mypage-content__title">${esc(title)}</h1>
        </header>
        ${isMessagesDetailPath(currentPath) ? renderMessagesProviderToolbar() : ''}
        ${bodyHtml}
      </div>
    </div>
  `;

  return renderAppShellWithPromo({
    toolbar: renderPreviewToolbar(),
    headerHtml: renderHeader(role, { showAuth: false, showRoleSwitch: false }),
    mainHtml,
    footerHtml: renderFooter(),
    slotKey: railSlotKey,
  });
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
