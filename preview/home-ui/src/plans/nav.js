/** 34장 — 상품센터 서브탭 */

import { plansScreenTitle, getPlansScreenId } from './router.js';

export const PLANS_NAV = [
  { id: 'home', label: '상품홈', path: '/plans', screenId: 'P18-01' },
  { id: 'positions', label: '노출상품', path: '/plans/positions', screenId: 'P18-02' },
  { id: 'access', label: '쪽지권', path: '/plans/access', screenId: 'P18-03' },
];

/** @param {string} path */
export function getActivePlansNavId(path) {
  const p = path.split('?')[0];
  if (p === '/plans/checkout' || p === '/plans/result') return '';
  const hit = PLANS_NAV.find((n) => n.path === p);
  return hit?.id || 'home';
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** @param {string} path */
export function renderPlansPageTitle(path) {
  const screenId = getPlansScreenId(path);
  const suffix = plansScreenTitle(screenId || 'P18-01');
  return `<span class="sup-content__title-prefix">유료상품</span><span class="sup-content__title-suffix">${esc(suffix)}</span>`;
}

/** @param {string} path @param {{ guestCatalogOnly?: boolean, shellFit?: boolean }} [opts] */
export function renderPlansNav(path, opts = {}) {
  const active = getActivePlansNavId(path);
  const items = opts.guestCatalogOnly
    ? PLANS_NAV.filter((n) => n.id === 'home' || n.id === 'positions' || n.id === 'access')
    : PLANS_NAV;
  const shellFit = Boolean(opts.shellFit);
  return `
    <nav class="sup-nav${shellFit ? ' plans-sf-sidenav' : ''}" aria-label="유료상품 메뉴">
      ${shellFit ? '<p class="plans-sf-sidenav__label">유료상품</p>' : ''}
      <ul class="sup-nav__list">
        ${items
          .map(
            (n) =>
              `<li>
              <a href="#${n.path}" class="sup-nav__link${active === n.id ? ' is-active' : ''}" data-plans-nav="${n.path}"${
                active === n.id ? ' aria-current="page"' : ''
              }>
                <span class="sup-nav__label">${esc(n.label)}${n.badge ? ` <em class="plans-nav-badge">${esc(n.badge)}</em>` : ''}</span>
              </a>
            </li>`,
          )
          .join('')}
      </ul>
    </nav>`;
}

/**
 * 유료상품 storefront 가로 내비 (positions / access 전용 · 설정형 좌측 nav 대체)
 * @param {string} path
 * @param {{ guestCatalogOnly?: boolean }} [opts]
 */
export function renderPlansStorefrontNav(path, opts = {}) {
  const active = getActivePlansNavId(path);
  const items = PLANS_NAV.filter((n) => n.id === 'positions' || n.id === 'access');
  void opts;
  return `
    <nav class="plans-sf-nav" aria-label="유료상품 storefront">
      <p class="plans-sf-nav__brand">유료상품</p>
      <ul class="plans-sf-nav__list">
        ${items
          .map(
            (n) => `
          <li>
            <a href="#${n.path}" class="plans-sf-nav__link${active === n.id ? ' is-active' : ''}"
              data-plans-nav="${n.path}"${active === n.id ? ' aria-current="page"' : ''}>${esc(n.label)}</a>
          </li>`,
          )
          .join('')}
      </ul>
    </nav>`;
}
