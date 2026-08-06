import { renderPreviewToolbar, renderHeader, renderFooter, bindLayoutEvents, renderAppShellWithPromo } from '../layout.js';
import { getNavRole, getPromoPath } from '../state.js';
import { renderPromoScreen, bindPromoScreenEvents } from './screens.js';
import { getPromoView } from './router.js';
import { getPromoLandingByPath } from './catalog.js';
import { STUDY_ROOM_PROMO } from './study-room-content.js';

export function renderPromoShell(currentPath, bodyHtml) {
  const role = getNavRole();
  const landing = getPromoLandingByPath(currentPath);
  const title = landing?.title || STUDY_ROOM_PROMO.meta.title;
  const sub = role === 'guest' ? '/guest' : role === 'parent' ? '/parent' : role === 'study_room' ? '/study-room' : '/tutor';

  const mainHtml = `
    <div class="promo-layout">
      <header class="promo-layout__head">
        <p class="promo-layout__crumb"><a href="#${sub}" data-nav="${sub}">홈</a> · 홍보</p>
        <h1 class="promo-layout__title">${title}</h1>
      </header>
      ${bodyHtml}
      <a href="#${sub}" class="guide-back-home" data-nav="${sub}">← 메인 홈으로</a>
    </div>
  `;

  return renderAppShellWithPromo({
    toolbar: renderPreviewToolbar(),
    headerHtml: renderHeader(role, { activeGnbId: 'home' }),
    mainHtml,
    footerHtml: renderFooter(),
    slotKey: 'home_right_rail',
    appClass: 'promo-app',
  });
}

export function bindPromoShellEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  bindPromoScreenEvents(root);
  root.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-nav') || '/guest';
    });
  });
}

export function renderPromo() {
  const path = getPromoPath();
  const view = getPromoView(path);
  return renderPromoShell(view.path, renderPromoScreen(view.path));
}

export function bindPromoEvents(root, rerender) {
  bindPromoShellEvents(root, rerender);
}
