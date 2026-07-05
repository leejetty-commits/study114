/** 17장 고객센터 사이드 메뉴 */

export const SUPPORT_NAV = [
  { id: 'home', label: '홈', path: '/support', screenId: 'P17-01', titleSuffix: '홈' },
  { id: 'guide', label: '이용안내', path: '/support/guide', screenId: 'P17-01', titleSuffix: '이용안내' },
  { id: 'notice', label: '공지사항', path: '/support/notice', screenId: 'P17-05', titleSuffix: '공지사항' },
  { id: 'safe', label: '안전과외 가이드', path: '/support/safe', screenId: 'P17-02', titleSuffix: '안전과외가이드' },
  { id: 'faq', label: 'FAQ', path: '/support/faq', screenId: 'P17-04', titleSuffix: 'FAQ' },
  { id: 'contact', label: '운영문의', path: '/support/contact', screenId: 'P17-07', titleSuffix: '운영문의' },
];

/** @param {string} path */
export function getActiveNavId(path) {
  if (path.startsWith('/support/safe')) return 'safe';
  if (path === '/support/contact/tickets') return 'contact';
  const hit = SUPPORT_NAV.find((n) => n.path !== '/support' && path === n.path);
  if (hit) return hit.id;
  return 'home';
}

/** @param {string} path */
export function getPageTitleSuffix(path) {
  if (path.startsWith('/support/admin')) return '운영';
  if (path === '/support/contact/tickets') return '문의내역';
  const id = getActiveNavId(path);
  const item = SUPPORT_NAV.find((n) => n.id === id);
  return item?.titleSuffix || '홈';
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** @param {string} path */
export function renderPageTitle(path) {
  const suffix = getPageTitleSuffix(path);
  return `<span class="sup-content__title-prefix">고객센터-</span><span class="sup-content__title-suffix">${esc(suffix)}</span>`;
}

/** @param {string} path */
export function renderSupportNav(path) {
  const active = getActiveNavId(path);
  return `
    <nav class="sup-nav" aria-label="고객센터 메뉴">
      <ul class="sup-nav__list">
        ${SUPPORT_NAV.map(
          (n) =>
            `<li>
              <a href="#${n.path}" class="sup-nav__link${active === n.id ? ' is-active' : ''}" data-sup-nav="${n.path}">
                <span class="sup-nav__label">${esc(n.label)}</span>
                <span class="sup-nav__id">${esc(n.screenId)}</span>
              </a>
            </li>`,
        ).join('')}
      </ul>
    </nav>`;
}
