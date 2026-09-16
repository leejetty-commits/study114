import { renderPreviewToolbar, renderHeader, renderFooter, bindLayoutEvents, renderAppShellWithPromo } from '../layout.js';
import { getNavRole } from '../state.js';
import { renderPlansPageTitle, renderPlansNav, renderPlansStorefrontNav } from './nav.js';
import { renderHomeMarketingBanner } from '../home-marketing-banner.js';
import { isPaidStorefrontPath, wrapPaidStorefront } from './theme.js';

/**
 * @param {string} currentPath
 * @param {string} bodyHtml
 * @param {{ role?: string, isGuest?: boolean, headerRole?: string }} [opts]
 */
export function renderPlansShell(currentPath, bodyHtml, opts = {}) {
  const role = opts.role || getNavRole();
  const headerRole = opts.headerRole || role;
  const sub =
    role === 'guest' ? '/guest' : role === 'parent' ? '/parent' : role === 'study_room' ? '/study-room' : '/tutor';
  const hideNav =
    currentPath.startsWith('/plans/checkout') || currentPath.startsWith('/plans/result');
  const guestCatalogOnly = Boolean(opts.isGuest);
  const banner = hideNav ? '' : renderHomeMarketingBanner('plans');

  if (isPaidStorefrontPath(currentPath)) {
    const storefrontHtml = `
      <div class="plans-sf-shell">
        ${banner}
        <div class="plans-sf-page">
          ${renderPlansStorefrontNav(currentPath, { guestCatalogOnly })}
          <div class="plans-sf-page__main">${bodyHtml}</div>
          <p class="plans-sf-page__trail">
            <a href="#${sub}" class="plans-sf-back" data-nav="${sub}">← 메인 홈으로</a>
            <a href="#/plans" class="plans-sf-hub" data-plans-nav="/plans">상품홈</a>
          </p>
        </div>
      </div>
    `;
    return renderAppShellWithPromo({
      toolbar: renderPreviewToolbar(),
      headerHtml: renderHeader(headerRole),
      mainHtml: wrapPaidStorefront(storefrontHtml),
      footerHtml: renderFooter(),
      // 승인 시안: 우측 레일 없이 본문 전폭 세로 흐름
      slotKey: null,
      appClass: 'home-app--plans-sf',
    });
  }

  const layoutHtml = `
    <div class="sup-layout plans-layout">
      ${banner}
      <header class="sup-content__head">
        <div>
          <h1 class="sup-content__title">${renderPlansPageTitle(currentPath)}</h1>
        </div>
      </header>
      <div class="sup-frame">
        ${hideNav ? '' : renderPlansNav(currentPath, { guestCatalogOnly })}
        <div class="sup-frame__body">${bodyHtml}</div>
      </div>
      <a href="#${sub}" class="sup-back-home" data-nav="${sub}">← 메인 홈으로</a>
    </div>
  `;

  return renderAppShellWithPromo({
    toolbar: renderPreviewToolbar(),
    headerHtml: renderHeader(headerRole),
    mainHtml: layoutHtml,
    footerHtml: renderFooter(),
    slotKey: hideNav ? null : 'plans_right_rail',
  });
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindPlansShellEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  root.querySelectorAll('[data-plans-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const href = el.getAttribute('href') || '';
      const attr = el.getAttribute('data-plans-nav') || '';
      const fromHref = href.startsWith('#') ? href.slice(1) : '';
      window.location.hash = fromHref || attr || '/plans';
    });
  });
  root.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-nav') || '/guest';
    });
  });
}
