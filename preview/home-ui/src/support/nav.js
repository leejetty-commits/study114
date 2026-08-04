/** 고객센터 사이드 메뉴 */

import { isLoggedIn } from '../auth-session.js';

export const SUPPORT_NAV = [
  { id: 'home', label: '고객센터 홈', path: '/support', titleSuffix: '' },
  { id: 'notice', label: '공지사항', path: '/support/notice', titleSuffix: '공지사항' },
  { id: 'faq', label: '자주 묻는 질문', path: '/support/faq', titleSuffix: '자주 묻는 질문' },
  { id: 'policies', label: '약관·정책', path: '/support/policies', titleSuffix: '약관·정책' },
  { id: 'library', label: '자료실', path: '/support/library', titleSuffix: '자료실' },
  { id: 'contact', label: '문의', path: '/support/contact', titleSuffix: '문의', requiresLogin: true },
];

/** @param {string} path */
export function getActiveNavId(path) {
  if (path.startsWith('/support/policies')) return 'policies';
  if (path.startsWith('/support/library')) return 'library';
  if (path === '/support/contact/tickets') return 'contact';
  if (path === '/support' || path === '/support/') return 'home';
  const hit = SUPPORT_NAV.find((n) => n.path !== '/support' && path === n.path);
  if (hit) return hit.id;
  return 'home';
}

/** @param {string} path */
export function getPageTitleSuffix(path) {
  if (path.startsWith('/support/admin')) return '운영';
  if (path === '/support/contact/tickets') return '문의 내역';
  if (path.startsWith('/support/policies')) return '약관·정책';
  if (path.startsWith('/support/library')) return '자료실';
  const id = getActiveNavId(path);
  const item = SUPPORT_NAV.find((n) => n.id === id);
  return item?.titleSuffix || '';
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** @param {string} path */
export function renderPageTitle(path) {
  const suffix = getPageTitleSuffix(path);
  if (!suffix) {
    return `<span class="sup-content__title-prefix">고객센터</span>`;
  }
  return `<span class="sup-content__title-prefix">고객센터</span><span class="sup-content__title-suffix">${esc(suffix)}</span>`;
}

/** @param {string} path */
export function renderSupportNav(path) {
  const active = getActiveNavId(path);
  const loggedIn = isLoggedIn();
  return `
    <nav class="sup-nav" aria-label="고객센터 메뉴">
      <ul class="sup-nav__list">
        ${SUPPORT_NAV.map((n) => {
          const locked = Boolean(n.requiresLogin) && !loggedIn;
          const cls = [
            'sup-nav__link',
            active === n.id ? 'is-active' : '',
            locked ? 'is-locked' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const lockHint = locked ? ' <em class="sup-nav__lock">로그인</em>' : '';
          return `<li>
              <a href="#${n.path}" class="${cls}" data-sup-nav="${n.path}"${locked ? ' title="로그인 후 이용"' : ''}>
                <span class="sup-nav__label">${esc(n.label)}${lockHint}</span>
              </a>
            </li>`;
        }).join('')}
      </ul>
    </nav>`;
}
