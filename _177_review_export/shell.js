import { renderPreviewToolbar, renderHeader, renderFooter, bindLayoutEvents, renderAppShellWithPromo } from '../layout.js';
import { getNavRole } from '../state.js';
import { getAuthUser } from '../auth-session.js';
import { memberHomeHashPath, navRoleFromAuthUser } from '../nav-config.js';
import { renderPlansPageTitle, renderPlansNav } from './nav.js';
import { renderHomeMarketingBanner } from '../home-marketing-banner.js';
import { renderPromoWithRightRail } from '../right-rail.js';
import { isPaidHubPath, isPaidStorefrontPath, isPaidTrackPath, wrapPaidStorefront } from './theme.js';
import { renderPlansHubCinema, renderPlansHubRailCard } from './hub-home.js';

/**
 * plans ?쇱슦?몄쓽 getNavRole()? guest濡?怨좎젙?쒕떎.
 * ?곗륫 ?덉씪留??ㅼ꽭??study_room/tutor/parent/guest)???대떎.
 */
function plansRailNavRole() {
  const live = navRoleFromAuthUser(getAuthUser());
  if (live === 'study_room' || live === 'tutor' || live === 'parent' || live === 'guest') return live;
  return 'guest';
}

/**
 * @param {string} currentPath
 * @param {string} bodyHtml
 * @param {{ role?: string, isGuest?: boolean, headerRole?: string }} [opts]
 */
export function renderPlansShell(currentPath, bodyHtml, opts = {}) {
  const role = opts.role || getNavRole();
  const headerRole = opts.headerRole || role;
  const sub = memberHomeHashPath(getAuthUser());
  const hideNav =
    currentPath.startsWith('/plans/checkout') || currentPath.startsWith('/plans/result');
  const guestCatalogOnly = Boolean(opts.isGuest);
  const banner = hideNav ? '' : renderHomeMarketingBanner('plans');

  if (isPaidTrackPath(currentPath)) {
    const isHub = isPaidHubPath(currentPath);
    const isSf = isPaidStorefrontPath(currentPath);
    const trail = isHub
      ? `<a href="#${sub}" class="plans-sf-back" data-nav="${sub}">??硫붿씤 ?덉쑝濡?/a>`
      : `<a href="#${sub}" class="plans-sf-back" data-nav="${sub}">??硫붿씤 ?덉쑝濡?/a>
              <a href="#/plans" class="plans-sf-hub" data-plans-nav="/plans">?곹뭹??/a>`;
    const trackHtml = `
      <div class="plans-hub-shell${isHub ? ' plans-hub-shell--cinema' : ''}" data-plans-track${isHub ? ' data-plans-hub-v21' : ' data-plans-shell-fit'}>
        ${isHub ? renderPlansHubCinema() : ''}
        <div class="plans-hub-warm" aria-hidden="true"></div>
        <div class="plans-hub-gutter-l" aria-hidden="true"></div>
        ${renderPlansNav(currentPath, { guestCatalogOnly, shellFit: true })}
        <div class="plans-hub-gap-nav" aria-hidden="true"></div>
        <div class="plans-hub-page${isSf ? ' plans-sf-page' : ''}">
          ${isSf ? banner : ''}
          ${isSf ? `<div class="plans-sf-page__main">${bodyHtml}</div>` : bodyHtml}
          <p class="plans-hub-trail${isSf ? ' plans-sf-page__trail' : ''}">
            ${trail}
          </p>
        </div>
        <div class="plans-hub-gap-rail" aria-hidden="true"></div>
        <div class="plans-hub-rail">
          ${isHub ? renderPlansHubRailCard() : ''}
          ${renderPromoWithRightRail('plans_right_rail', { navRole: plansRailNavRole() })}
        </div>
        <div class="plans-hub-gutter-r" aria-hidden="true"></div>
      </div>
    `;
    return renderAppShellWithPromo({
      toolbar: renderPreviewToolbar(),
      headerHtml: renderHeader(headerRole),
      mainHtml: wrapPaidStorefront(trackHtml),
      footerHtml: renderFooter(),
      slotKey: null,
      appClass: isSf ? 'home-app--plans-hub home-app--plans-sf' : 'home-app--plans-hub',
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
      <a href="#${sub}" class="sup-back-home" data-nav="${sub}">??硫붿씤 ?덉쑝濡?/a>
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

function syncPlansRailFold(root) {
  const desktop = window.matchMedia('(min-width: 1024px)').matches;
  root.querySelectorAll('details.plans-rail-fold').forEach((el) => {
    el.open = desktop;
  });
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindPlansShellEvents(root, rerender) {
  syncPlansRailFold(root);
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
