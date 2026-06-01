import { getCurrentScreen, navigate, previewState, SCREEN_META, ROUTES } from './state.js';
import { REGIONS } from './data.js';
import { UTIL_MENU, GNB_MAIN, GNB_VISIBILITY, GNB_ACTION_HINTS } from './nav-config.js';

export function renderPreviewToolbar() {
  const current = getCurrentScreen();
  const region = previewState.regionKey;
  const isGuest = current === 'guest';

  return `
    <div class="preview-toolbar">
      <span class="preview-toolbar__label">우동공과 · 메인 UI 프리뷰 (9장)</span>
      <div class="preview-toolbar__group">
        ${Object.entries(ROUTES)
          .map(([path, key]) => {
            const meta = SCREEN_META[key];
            const active = key === current;
            return `<button type="button" class="preview-toolbar__btn ${active ? 'is-active' : ''}" data-nav="${path}">${meta.label}</button>`;
          })
          .join('')}
        <span class="preview-toolbar__divider"></span>
        ${
          isGuest
            ? `<span class="preview-toolbar__hint">비회원: 대치동 고정</span>`
            : `<button type="button" class="preview-toolbar__btn ${region === 'complex' ? 'is-active' : ''}" data-region="complex">단지 우선</button>
               <button type="button" class="preview-toolbar__btn ${region === 'dong' ? 'is-active' : ''}" data-region="dong">동 우선</button>`
        }
      </div>
    </div>
  `;
}

/**
 * @param {'guest' | 'parent' | 'study_room' | 'tutor'} role
 * @param {{ showAuth?: boolean, showRoleSwitch?: boolean }} opts
 */
function renderUtilBar(role, showAuth) {
  const items = showAuth ? UTIL_MENU.guest : UTIL_MENU.loggedIn;
  return items
    .map((item) => {
      if (item.external && item.href) {
        const cls = item.emphasis ? 'home-util__link home-util__link--emphasis' : 'home-util__link';
        return `<a href="${item.href}" class="${cls}" target="_blank" rel="noopener">${item.label}</a>`;
      }
      return `<button type="button" class="home-util__link" data-action="${item.action}">${item.label}</button>`;
    })
    .join('');
}

function renderGnbLink(item, role, { mobile = false } = {}) {
  const vis = GNB_VISIBILITY[role][item.id];
  if (vis === 'hide') {
    return mobile ? '' : `<span class="home-gnb__item is-muted">${item.label}</span>`;
  }
  const isHomeContext = getCurrentScreen() === 'guest' && item.id === 'find_room';
  const cls = [
    'home-gnb__item',
    isHomeContext ? 'is-active' : '',
    vis === 'limited' ? 'is-limited' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const suffix = vis === 'limited' && !mobile ? ' △' : '';
  return `<a href="#" class="${cls}" data-action="gnb-${item.id}">${item.label}${suffix}</a>`;
}

/**
 * @param {'guest' | 'parent' | 'study_room' | 'tutor'} role
 * @param {{ showAuth?: boolean, showRoleSwitch?: boolean }} opts
 */
export function renderHeader(role, opts = {}) {
  const { showAuth = role === 'guest', showRoleSwitch = role !== 'guest' } = opts;

  const gnbItems = GNB_MAIN.map((item) => renderGnbLink(item, role)).join('');
  const mobileGnb = GNB_MAIN.map((item) => renderGnbLink(item, role, { mobile: true })).join('');

  return `
    <header class="home-header">
      <div class="home-header__util">
        <div class="home-header__util-inner">
          <nav class="home-util" aria-label="유틸 메뉴">${renderUtilBar(role, showAuth)}</nav>
          ${
            showRoleSwitch
              ? `<button type="button" class="home-util__link home-util__link--role" data-action="role-switch" title="역할 전환">역할 ▾</button>`
              : ''
          }
        </div>
      </div>
      <div class="home-header__main">
        <div class="home-header__inner">
          <a href="#/guest" class="home-header__logo" data-nav="/guest" aria-label="우동공과 홈">
            <img src="/assets/brand/logo-wordmark.png" alt="우동공과" width="120" height="32" />
          </a>
          <nav class="home-gnb" aria-label="메인 메뉴">${gnbItems}</nav>
        </div>
      </div>
      <nav class="home-gnb-mobile" aria-label="모바일 메뉴">${mobileGnb}</nav>
    </header>
  `;
}

export function renderFooter() {
  return `
    <footer class="home-footer">
      <div class="home-footer__links">
        <a href="#">약관</a>
        <a href="#">개인정보</a>
        <a href="#">고객센터</a>
      </div>
      <p>© 2026 우동공과 · study114 · UI Preview</p>
    </footer>
  `;
}

export function renderRegionBar(showSearch = true) {
  const region = REGIONS[previewState.regionKey];
  return `
    <div class="region-bar">
      <div>
        <div class="region-bar__title">${region.label}</div>
        <div class="region-bar__meta">${region.sub}</div>
        <span class="region-bar__policy">${region.policy}</span>
      </div>
      ${
        showSearch
          ? `<div class="region-bar__actions">
              <button type="button" class="btn btn--secondary btn--sm" data-action="region-change">지역 변경</button>
              <button type="button" class="btn btn--primary btn--sm" data-action="search">검색</button>
            </div>`
          : `<div class="region-bar__actions">
              <button type="button" class="btn btn--secondary btn--sm" data-action="region-change">지역 변경 △</button>
            </div>`
      }
    </div>
  `;
}

/** @param {{ slot: string, name: string, meta: string, price?: string, variant?: 'top' | 'mid' }} item */
function renderSlotCard(item) {
  const isTop = item.variant === 'top';
  return `
    <article class="slot-card ${isTop ? 'slot-card--top' : ''}">
      <span class="slot-card__badge ${isTop ? '' : 'slot-card__badge--blue'}">${item.slot}</span>
      <div class="slot-card__name">${item.name}</div>
      <div class="slot-card__meta">${item.meta}</div>
      ${item.price ? `<div class="slot-card__price">${item.price}</div>` : ''}
    </article>
  `;
}

/** @param {string} title @param {string} desc @param {Array<{slot:string,name:string,meta:string,price?:string}>} items */
export function renderTop3Section(title, desc, items) {
  return `
    <section class="home-section">
      <div class="home-section__head">
        <h2 class="home-section__title">${title}</h2>
        <span class="home-section__desc">${desc}</span>
      </div>
      <div class="slot-grid--3">
        ${items.map((item, i) => renderSlotCard({ ...item, variant: 'top', slot: item.slot || ['고정 A', '고정 B', '고정 C'][i] })).join('')}
      </div>
    </section>
  `;
}

export function renderMid5Section(title, desc, items) {
  return `
    <section class="home-section">
      <div class="home-section__head">
        <h2 class="home-section__title">${title}</h2>
        <span class="home-section__desc">${desc}</span>
      </div>
      <div class="slot-grid--5">
        ${items.map((item, i) => renderSlotCard({ ...item, variant: 'mid', slot: item.slot || `고정 ${i + 1}` })).join('')}
      </div>
    </section>
  `;
}

/** @param {string} title @param {Array<{title:string,meta:string,date:string}>} items */
export function renderBottomList(title, items) {
  return `
    <section class="home-section">
      <div class="list-block">
        <div class="list-block__head">${title} · 최근 등록순</div>
        ${items
          .map(
            (item, i) => `
          <div class="list-item">
            <span class="list-item__rank">${i + 1}</span>
            <div class="list-item__body">
              <div class="list-item__title">${item.title}</div>
              <div class="list-item__meta">${item.meta}</div>
            </div>
            <span class="list-item__date">${item.date}</span>
          </div>
        `,
          )
          .join('')}
      </div>
    </section>
  `;
}

export function renderMapBlock() {
  return `
    <div class="map-block">
      <div class="map-block__head">📍 공부방 지도 · ${REGIONS[previewState.regionKey].label}</div>
      <div class="map-block__body">
        <span>[프리뷰] 공부방 지도 영역</span>
        <span class="map-block__pin"></span>
        <span class="map-block__pin"></span>
        <span class="map-block__pin"></span>
      </div>
    </div>
  `;
}

export function renderAdSidebar() {
  return `
    <aside class="home-sidebar" aria-label="광고">
      <div class="ad-slot">
        <span>광고 슬롯</span>
        <span>데스크톱 전용</span>
      </div>
      <div class="ad-slot" style="min-height: 20rem;">
        <span>광고 슬롯 2</span>
      </div>
    </aside>
  `;
}

export function renderAdInline() {
  return `<div class="ad-slot ad-slot--inline"><span>광고 · 모바일 인라인</span></div>`;
}

export function renderHomeShell(role, mainContent, opts = {}) {
  const { showAuth, showRoleSwitch, sidebarHtml, loginStrip } = opts;
  const sidebar = sidebarHtml ?? renderAdSidebar();
  return `
    ${renderPreviewToolbar()}
    <div class="home-shell">
      ${renderHeader(role, { showAuth, showRoleSwitch })}
      <div class="home-body">
        <div class="home-main">${mainContent}</div>
        ${sidebar}
      </div>
      ${loginStrip ? loginStrip : ''}
      ${renderFooter()}
    </div>
  `;
}

export function bindLayoutEvents(root, rerender) {
  root.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.dataset.nav);
    });
  });

  root.querySelectorAll('[data-region]').forEach((el) => {
    el.addEventListener('click', () => {
      previewState.regionKey = el.dataset.region;
      rerender();
    });
  });

  root.querySelectorAll('[data-action]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const action = el.dataset.action;
      if (action === 'role-switch') {
        alert('[프리뷰] 복수 역할 전환 UI — 9장 §2.2 (추후 구현)');
      } else if (action.startsWith('gnb-')) {
        const gnbId = action.replace('gnb-', '');
        const hint = GNB_ACTION_HINTS[gnbId];
        if (gnbId === 'register_room' && typeof hint === 'string' && hint.startsWith('http')) {
          window.open(hint, '_blank', 'noopener');
        } else {
          alert(`[프리뷰] ${el.textContent?.trim()}\n${hint || '연결 추후'}`);
        }
      } else if (action.startsWith('util-')) {
        alert(`[프리뷰] ${el.textContent?.trim()} — 6장 유틸 메뉴 (연결 추후)`);
      } else if (el.dataset.href) {
        window.open(el.dataset.href, '_blank', 'noopener');
      } else {
        alert(`[프리뷰] ${action} — 더미 동작`);
      }
    });
  });
}

export function bindParentTabEvents(root, rerender) {
  root.querySelectorAll('[data-parent-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      previewState.parentTab = btn.dataset.parentTab;
      rerender();
    });
  });
}
