import { getCurrentScreen, navigate, previewState, SCREEN_META, ROUTES } from './state.js';
import { REGIONS } from './data.js';

/** GNB 노출 — SSOT 9장 §4.1 */
const GNB = [
  { id: 'home', label: '홈', href: null },
  { id: 'find_room', label: '공부방 찾기', href: null },
  { id: 'register_room', label: '공부방 등록', href: null },
  { id: 'find_tutor', label: '과외 찾기', href: null },
  { id: 'register_tutor', label: '과외 등록', href: null },
  { id: 'mypage', label: '마이페이지', href: null },
];

/** @type {Record<string, Record<string, 'show' | 'limited' | 'hide'>>} */
const GNB_VISIBILITY = {
  guest: {
    home: 'show',
    find_room: 'show',
    register_room: 'hide',
    find_tutor: 'show',
    register_tutor: 'hide',
    mypage: 'hide',
  },
  parent: {
    home: 'show',
    find_room: 'show',
    register_room: 'hide',
    find_tutor: 'show',
    register_tutor: 'hide',
    mypage: 'show',
  },
  study_room: {
    home: 'show',
    find_room: 'limited',
    register_room: 'show',
    find_tutor: 'limited',
    register_tutor: 'hide',
    mypage: 'show',
  },
  tutor: {
    home: 'show',
    find_room: 'limited',
    register_room: 'hide',
    find_tutor: 'show',
    register_tutor: 'show',
    mypage: 'show',
  },
};

export function renderPreviewToolbar() {
  const current = getCurrentScreen();
  const region = previewState.regionKey;

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
        <button type="button" class="preview-toolbar__btn ${region === 'complex' ? 'is-active' : ''}" data-region="complex">단지 우선</button>
        <button type="button" class="preview-toolbar__btn ${region === 'dong' ? 'is-active' : ''}" data-region="dong">동 우선</button>
      </div>
    </div>
  `;
}

/**
 * @param {'guest' | 'parent' | 'study_room' | 'tutor'} role
 * @param {{ showAuth?: boolean, showRoleSwitch?: boolean }} opts
 */
export function renderHeader(role, opts = {}) {
  const { showAuth = role === 'guest', showRoleSwitch = role !== 'guest' } = opts;

  const gnbItems = GNB.map((item) => {
    const vis = GNB_VISIBILITY[role][item.id];
    if (vis === 'hide') {
      return `<span class="home-gnb__item is-muted">${item.label}</span>`;
    }
    const cls = [
      'home-gnb__item',
      item.id === 'home' ? 'is-active' : '',
      vis === 'limited' ? 'is-limited' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return `<a href="#" class="${cls}" data-action="gnb-${item.id}">${item.label}${vis === 'limited' ? ' △' : ''}</a>`;
  }).join('');

  const mobileGnb = GNB.map((item) => {
    const vis = GNB_VISIBILITY[role][item.id];
    if (vis === 'hide') return '';
    const cls = ['home-gnb__item', item.id === 'home' ? 'is-active' : ''].filter(Boolean).join(' ');
    return `<a href="#" class="${cls}" data-action="gnb-${item.id}">${item.label}</a>`;
  }).join('');

  return `
    <header class="home-header">
      <div class="home-header__inner">
        <a href="#/guest" class="home-header__logo" data-nav="/guest">
          <img src="/assets/brand/logo-wordmark.png" alt="우동공과" width="120" height="32" />
        </a>
        <nav class="home-gnb" aria-label="주 메뉴">${gnbItems}</nav>
        <div class="home-header__actions">
          ${
            showRoleSwitch
              ? `<button type="button" class="btn btn--ghost btn--sm" data-action="role-switch" title="역할 전환">역할 ▾</button>`
              : ''
          }
          ${
            showAuth
              ? `<a href="http://localhost:5173/#/login" class="btn btn--ghost btn--sm" target="_blank" rel="noopener">로그인</a>
                 <a href="http://localhost:5173/#/signup/terms" class="btn btn--primary btn--sm" target="_blank" rel="noopener">회원가입</a>`
              : `<button type="button" class="btn btn--ghost btn--sm" data-action="notify">알림</button>
                 <button type="button" class="btn btn--secondary btn--sm" data-action="mypage">마이페이지</button>`
          }
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
  const { showAuth, showRoleSwitch } = opts;
  return `
    ${renderPreviewToolbar()}
    <div class="home-shell">
      ${renderHeader(role, { showAuth, showRoleSwitch })}
      <div class="home-body">
        <div class="home-main">${mainContent}</div>
        ${renderAdSidebar()}
      </div>
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
        alert(`[프리뷰] ${el.textContent?.trim()} — 링크 연결 추후`);
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
