import { GUIDE_NAV_ITEMS, GUIDE_PAGES } from './copy.js';
import { getGuidePageId } from './router.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

export function renderGuidePageTitle(path) {
  const id = getGuidePageId(path);
  if (id === 'home') {
    return '<span class="guide-content__title-prefix">이용안내</span>';
  }
  const page = GUIDE_PAGES[id];
  return `<span class="guide-content__title-prefix">이용안내</span><span class="guide-content__title-suffix">${esc(page?.title || '이용안내')}</span>`;
}

export function renderGuideNav(path) {
  const active = getGuidePageId(path);
  return `
    <nav class="guide-nav" aria-label="이용안내 메뉴">
      <ul class="guide-nav__list">
        ${GUIDE_NAV_ITEMS.map((item) => {
          const cls = ['guide-nav__link', active === item.id ? 'is-active' : ''].filter(Boolean).join(' ');
          return `<li><a href="#${item.path}" class="${cls}" data-guide-nav="${item.path}">${esc(item.label)}</a></li>`;
        }).join('')}
      </ul>
    </nav>`;
}

