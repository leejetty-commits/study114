import { getCurrentScreen, navigate, previewState, SCREEN_META, ROUTES, getNavRole, isMypageRoute, isMessagesRoute, isSupportRoute, isPolicyRoute, isLibraryRoute, isAdminRoute, navigateToSupport } from './state.js';
import { POLICY_SHORT_NOTICE } from './policy-copy.js';
import { getDefaultMypagePath } from './mypage/router.js';
import { getDefaultMessagesPath } from './messages/router.js';
import { REGIONS } from './data.js';
import { UTIL_MENU, GNB_MAIN, GNB_VISIBILITY, GNB_MUTED_TITLE, resolveGnbLink, searchUiUrl } from './nav-config.js';
import { defaultSearchTabForRole } from '@search-ui/search-role-access.js';
import { getAuthUser, isLoggedIn, devLoginAs, logout } from './auth-session.js';
import { isHandoffApiMode } from './handoff-backend.js';
import { isMessagesApiMode } from './messages-backend.js';
import { SHOW_PREVIEW_TOOLBAR } from '../../shared/preview-flags.js';
import { syncSiteHeaderOffset, ensureSiteHeaderOffsetListeners } from '../../shared/site-chrome.js';

export function renderPreviewToolbar() {
  if (!SHOW_PREVIEW_TOOLBAR) return '';
  const current = getCurrentScreen();
  const onMypage = isMypageRoute();
  const onMessages = isMessagesRoute();
  const onSupport = isSupportRoute();
  const onPolicy = isPolicyRoute();
  const onLibrary = isLibraryRoute();
  const onAdmin = isAdminRoute();
  const region = previewState.regionKey;
  const isGuest = current === 'guest' && !onMypage && !onMessages && !onSupport && !onPolicy && !onLibrary && !onAdmin;
  const authUser = getAuthUser();
  const apiOn = isHandoffApiMode();
  const msgApiOn = isMessagesApiMode();
  const authLabel = authUser
    ? `${authUser.name || authUser.email} · handoff ${apiOn ? 'ON' : 'OFF'} · 쪽지 ${msgApiOn ? 'ON' : 'OFF'}`
    : '비로그인 · sessionStorage';

  return `
    <div class="preview-toolbar">
      <span class="preview-toolbar__label">우동공과 · 메인 UI 프리뷰 (9·15·16·17·25·26장)</span>
      <div class="preview-toolbar__group">
        ${Object.entries(ROUTES)
          .map(([path, key]) => {
            const meta = SCREEN_META[key];
            const active = !onMypage && !onMessages && !onSupport && !onPolicy && !onLibrary && !onAdmin && key === current;
            return `<button type="button" class="preview-toolbar__btn ${active ? 'is-active' : ''}" data-nav="${path}">${meta.label}</button>`;
          })
          .join('')}
        <button type="button" class="preview-toolbar__btn ${onMypage ? 'is-active' : ''}" data-nav="${getDefaultMypagePath(getNavRole())}">마이페이지</button>
        <button type="button" class="preview-toolbar__btn ${onMessages ? 'is-active' : ''}" data-nav="${getDefaultMessagesPath()}">쪽지함</button>
        <button type="button" class="preview-toolbar__btn ${onSupport ? 'is-active' : ''}" data-nav="/support">고객센터</button>
        <button type="button" class="preview-toolbar__btn ${onLibrary ? 'is-active' : ''}" data-nav="/library">자료실</button>
        <button type="button" class="preview-toolbar__btn ${onPolicy ? 'is-active' : ''}" data-nav="/policy/terms">정책</button>
        <button type="button" class="preview-toolbar__btn ${onAdmin ? 'is-active' : ''}" data-nav="/admin">A28</button>
        <span class="preview-toolbar__divider"></span>
        <span class="preview-toolbar__hint" title="handoff store">${authLabel}</span>
        <button type="button" class="preview-toolbar__btn" data-action="dev-login-parent" title="guardian1@dev.local">Dev·학부모</button>
        <button type="button" class="preview-toolbar__btn" data-action="dev-login-room" title="room-owner1@dev.local">Dev·공부방</button>
        <button type="button" class="preview-toolbar__btn" data-action="dev-login-tutor" title="tutor-owner1@dev.local">Dev·과외</button>
        <button type="button" class="preview-toolbar__btn" data-action="dev-login-admin" title="ops@dev.local">Dev·운영</button>
        ${isLoggedIn() ? `<button type="button" class="preview-toolbar__btn" data-action="dev-logout">로그아웃</button>` : ''}
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
      if (item.href) {
        const cls = item.emphasis ? 'home-util__link home-util__link--emphasis' : 'home-util__link';
        // 같은 탭 이동 — target="_blank" 금지
        return `<a href="${item.href}" class="${cls}" data-util-href="${item.href}">${item.label}</a>`;
      }
      return `<button type="button" class="home-util__link" data-action="${item.action}">${item.label}</button>`;
    })
    .join('');
}

function gnbItemLabel(item) {
  return item.label;
}

function renderGnbLink(item, role, { mobile = false } = {}) {
  const vis = GNB_VISIBILITY[role]?.[item.id] ?? 'show';
  if (vis === 'hide') {
    return '';
  }
  const label = gnbItemLabel(item);
  if (vis === 'limited') {
    const mutedCls = mobile ? 'home-gnb__item is-muted' : 'home-gnb__item is-muted';
    return `<span class="${mutedCls}" title="${GNB_MUTED_TITLE}" aria-disabled="true">${label}</span>`;
  }
  const screen = getCurrentScreen();
  const onRoleHome = screen === 'guest' || screen === 'parent' || screen === 'studyRoom' || screen === 'tutor';
  const isHomeActive = item.id === 'home' && onRoleHome;
  const onSupport = isSupportRoute();
  const isSupportActive = item.id === 'support' && onSupport && !window.location.hash.includes('/guide');
  const cls = [
    'home-gnb__item',
    isHomeActive || isSupportActive ? 'is-active' : '',
  ]
    .filter(Boolean)
    .join(' ');
  let href = '#';
  if (item.id === 'home') {
    href = `#${roleHomePath()}`;
  } else if (item.id === 'support') {
    href = '#/support';
  } else {
    const link = resolveGnbLink(item.id, role);
    if (link) href = link.external ? link.url : `#${link.url}`;
  }
  return `<a href="${href}" class="${cls}" data-action="gnb-${item.id}">${label}</a>`;
}

/** @returns {'/guest'|'/parent'|'/study-room'|'/tutor'} */
function roleHomePath() {
  const user = getAuthUser();
  if (!user) return '/guest';
  if (user.role_type === 'study_room_owner') return '/study-room';
  if (user.role_type === 'tutor') return '/tutor';
  return '/parent';
}

/** 같은 탭에서 URL로 이동 (검색·등록·auth SPA) */
function goSameTab(url) {
  if (!url) return;
  window.location.assign(url);
}

/**
 * @param {'guest' | 'parent' | 'study_room' | 'tutor'} role
 * @param {{ showAuth?: boolean, showRoleSwitch?: boolean }} opts
 */
export function renderHeader(role, opts = {}) {
  const loggedIn = isLoggedIn();
  // 로그인 여부 기준 — 화면이 guest여도 세션이 있으면 마이페이지·로그아웃 노출
  const showAuth = opts.showAuth ?? !loggedIn;
  // 역할 전환 UI 미구현 — 더미 alert 방지를 위해 기본 비표시
  const showRoleSwitch = opts.showRoleSwitch === true;
  const logoPath = loggedIn ? roleHomePath() : '/guest';

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
          <a href="#${logoPath}" class="home-header__logo" data-nav="${logoPath}" aria-label="우동공과 홈">
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
        <a href="#/policy/terms" data-nav="/policy/terms">약관</a>
        <a href="#/policy/privacy" data-nav="/policy/privacy">개인정보</a>
        <a href="#/policy/platform" data-nav="/policy/platform">플랫폼 고지</a>
        <a href="#/support" data-action="util-support">고객센터</a>
      </div>
      <p class="home-footer__notice">${POLICY_SHORT_NOTICE.footer}</p>
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
      const target = el.dataset.nav || '/guest';
      if (target === '/support' || target.startsWith('/support/')) {
        navigateToSupport(target);
      } else {
        navigate(target);
      }
    });
  });

  root.querySelectorAll('[data-util-href]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      goSameTab(el.dataset.utilHref || el.getAttribute('href'));
    });
  });

  root.querySelectorAll('[data-same-tab-href]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      goSameTab(el.dataset.sameTabHref || el.getAttribute('href'));
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
        navigate('/mypage/account');
      } else if (action === 'dev-login-parent' || action === 'dev-login-room' || action === 'dev-login-tutor' || action === 'dev-login-admin') {
        const key =
          action === 'dev-login-parent'
            ? 'parent'
            : action === 'dev-login-room'
              ? 'study_room'
              : action === 'dev-login-admin'
                ? 'admin'
                : 'tutor';
        devLoginAs(key)
          .then(() => rerender())
          .catch((err) => console.error('[dev-login]', err));
      } else if (action === 'dev-logout') {
        logout().then(() => {
          navigate('/guest');
          rerender();
        });
      } else if (action.startsWith('gnb-')) {
        const gnbId = action.replace('gnb-', '');
        const role = getNavRole();
        const vis = GNB_VISIBILITY[role]?.[gnbId] ?? 'show';
        if (vis === 'limited' || vis === 'hide') {
          return;
        }
        if (gnbId === 'home') {
          navigate(roleHomePath());
          return;
        }
        if (gnbId === 'support') {
          navigateToSupport('/support');
          return;
        }
        const link = resolveGnbLink(gnbId, role);
        if (!link) return;
        if (link.external) {
          goSameTab(link.url);
        } else {
          navigate(link.url);
        }
      } else if (action === 'search') {
        const role = getNavRole();
        goSameTab(searchUiUrl(defaultSearchTabForRole(role), role));
      } else if (action === 'util-mypage') {
        navigate(getDefaultMypagePath(getNavRole()));
      } else if (action === 'util-messages') {
        navigate(getDefaultMessagesPath());
      } else if (action === 'util-recent') {
        navigate('/mypage/recent');
      } else if (action === 'util-logout') {
        logout()
          .then(() => {
            navigate('/guest');
            rerender();
          })
          .catch((err) => console.error('[logout]', err));
      } else if (action === 'util-guide') {
        navigateToSupport('/support/guide');
      } else if (action === 'util-library') {
        navigate('/library');
      } else if (action === 'util-support') {
        navigateToSupport('/support');
      } else if (el.dataset.href) {
        goSameTab(el.dataset.href);
      }
      // 기타 util-/더미 alert 제거 — 미연결 액션은 무시
    });
  });

  ensureSiteHeaderOffsetListeners();
  syncSiteHeaderOffset(root);
  requestAnimationFrame(() => syncSiteHeaderOffset(root));
}
