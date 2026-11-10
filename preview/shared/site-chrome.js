/**
 * 공통 사이트 헤더 (유틸 + GNB) — 앱 간 시각·전환 일관성
 * 새 탭(target=_blank / window.open) 금지 · 같은 탭 location.assign / 내부 navigate
 */

import {
  GNB_MAIN,
  navRoleFromAuthUser,
  roleHomeHashPath,
  homeHashUrl,
  resolveGnbLink,
  HOME_UI_BASE,
  isGnbItemVisible,
  resolveUtilMenuItems,
} from './site-nav-config.js';
import { resolveAccountDisplayName } from '../home-ui/src/auth/display-identity.js';
import { PROMO_VIDEOS, isValidYoutubeId } from '../home-ui/src/promo-video-config.js';

import { ensureBackToTop } from './back-to-top.js';
import { setPendingRoute } from './pending-route.js';

const DRAWER_PROMO_LABELS = {
  study_room: '우동공과 공부방 소개영상',
  tutor: '우동공과 과외쌤 소개영상',
};

/** promoKeysForRole과 동일. ID 무효면 숨김. */
function drawerPromoKeysForRole(navRole) {
  if (navRole === 'study_room') return ['study_room'];
  if (navRole === 'tutor') return ['tutor'];
  return ['study_room', 'tutor'];
}

function renderDrawerPromoVideos(navRole) {
  const items = drawerPromoKeysForRole(navRole)
    .map((key) => {
      const video = PROMO_VIDEOS[key];
      if (!video || !isValidYoutubeId(video.id)) return '';
      const label = DRAWER_PROMO_LABELS[key] || String(video.title || '소개영상');
      return `<button type="button" class="home-drawer__promo-item" data-action="drawer-promo-video" data-rail-media-key="${key}">${label}</button>`;
    })
    .filter(Boolean)
    .join('');
  if (!items) return '';
  return `<div class="home-drawer__promo" data-drawer-promo>${items}</div>`;
}

const HEADER_OFFSET_VAR = '--site-header-h';
let offsetBound = false;

function escAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * @param {NavRole} role
 * @param {boolean} showAuth guest util
 * @param {{ role_type?: string, admin_level?: string|null, email?: string|null, name?: string|null } | null} [user]
 */
function renderUtilBar(role, showAuth, user = null) {
  const loggedIn = !showAuth && Boolean(user);
  const pendingVerify = loggedIn && user?.email_verified === false;
  const items = resolveUtilMenuItems(user, loggedIn);
  const isAdmin = Boolean(user?.admin_level) || user?.role_type === 'admin';
  const displayLabel = user ? resolveAccountDisplayName(user) : '';
  const account =
    loggedIn
      ? `<span class="home-util__account" title="${escAttr(displayLabel)}">로그인: ${escAttr(displayLabel)}</span>`
      : '';
  const adminLink =
    isAdmin && loggedIn && !pendingVerify
      ? `<button type="button" class="home-util__link home-util__link--admin" data-action="util-admin">관리자 콘솔</button>`
      : '';
  const base = items
    .map((item) => {
      if (item.href) {
        const cls = item.emphasis ? 'home-util__link home-util__link--emphasis' : 'home-util__link';
        return `<a href="${item.href}" class="${cls}" data-util-href="${item.href}">${item.label}</a>`;
      }
      return `<button type="button" class="home-util__link" data-action="${item.action}">${item.label}</button>`;
    })
    .join('');
  return `${account}${adminLink}${base}`;
}

/**
 * @param {{ id: string, label: string }} item
 * @param {NavRole} role
 * @param {{ activeGnbId?: string }} opts
 */
function roleHomePathForNav(role) {
  if (role === 'study_room') return '/study-room';
  if (role === 'tutor') return '/tutor';
  if (role === 'parent') return '/parent';
  return '/guest';
}

/** 검색 등 home 밖 GNB — 공지 직행 없이 고객센터 허브 `#/support` */
function supportHubUrl() {
  return `${String(HOME_UI_BASE).replace(/\/$/, '')}/#/support`;
}

function gnbHref(itemId, role) {
  if (itemId === 'home') return homeHashUrl(roleHomePathForNav(role));
  if (itemId === 'support') return supportHubUrl();
  if (itemId === 'community' || itemId === 'concern') return homeHashUrl('/community');
  if (itemId === 'plans') return homeHashUrl('/plans');
  const link = resolveGnbLink(itemId, role);
  if (!link) return homeHashUrl('/guest');
  return link.external ? link.url : homeHashUrl(link.url);
}

function renderGnbLink(item, role, opts = {}) {
  if (!isGnbItemVisible(role, item.id)) return '';
  const active = opts.activeGnbId === item.id ? ' is-active' : '';
  const href = gnbHref(item.id, role);
  return `<a href="${href}" class="home-gnb__item${active}" data-action="gnb-${item.id}">${item.label}</a>`;
}

/**
 * @param {object} opts
 * @param {import('./site-nav-config.js').NavRole} [opts.role]
 * @param {boolean} [opts.loggedIn]
 * @param {string} [opts.activeGnbId] home | find_room | find_tutor | student_parent | register_room | register_tutor | support
 * @param {string} [opts.logoHref] absolute or hash; default home guest/role
 * @param {{ role_type?: string } | null} [opts.user]
 */
export function renderSiteHeader(opts = {}) {
  const user = opts.user ?? null;
  const loggedIn = opts.loggedIn ?? Boolean(user);
  const role = opts.role ?? navRoleFromAuthUser(user);
  const showAuth = !loggedIn;
  const logoPath = roleHomeHashPath(user);
  const logoHref = opts.logoHref ?? homeHashUrl(logoPath);
  const gnbOpts = { activeGnbId: opts.activeGnbId };
  const gnbItems = GNB_MAIN.map((item) => renderGnbLink(item, role, gnbOpts)).join('');
  const mobileGnb = GNB_MAIN.map((item) => renderGnbLink(item, role, gnbOpts)).join('');

  const utilHtml = renderUtilBar(role, showAuth, user);
  const drawerGnb = GNB_MAIN.map((item) => renderGnbLink(item, role, gnbOpts)).join('');
  const drawerPromo = renderDrawerPromoVideos(role);

  return `
    <header class="home-header site-chrome-header" data-site-chrome>
      <div class="home-header__util">
        <div class="home-header__util-inner">
          <nav class="home-util" aria-label="유틸 메뉴">${utilHtml}</nav>
        </div>
      </div>
      <div class="home-header__main">
        <div class="home-header__inner">
          <a href="${logoHref}" class="home-header__logo" data-site-logo="${logoHref}" aria-label="우동공과 홈">
            <img src="/assets/brand/udong-symbol-2026.png" alt="" class="home-header__symbol" /><img src="/assets/brand/logo-wordmark-2026.png" alt="우동공과" class="home-header__wordmark" />
          </a>
          <nav class="home-gnb" aria-label="메인 메뉴">${gnbItems}</nav>
          <button type="button" class="home-hamburger" data-action="hamburger-toggle" aria-label="메뉴 열기" aria-expanded="false">
            <span class="home-hamburger__bar"></span>
            <span class="home-hamburger__bar"></span>
            <span class="home-hamburger__bar"></span>
          </button>
        </div>
      </div>
      <nav class="home-gnb-mobile" aria-label="모바일 메뉴">${mobileGnb}</nav>
      <div class="home-drawer" data-drawer hidden>
        <div class="home-drawer__backdrop" data-action="drawer-close"></div>
        <nav class="home-drawer__panel" aria-label="메뉴">
          <div class="home-drawer__head">
            <span class="home-drawer__title">메뉴</span>
            <button type="button" class="home-drawer__close" data-action="drawer-close" aria-label="메뉴 닫기">✕</button>
          </div>
          <div class="home-drawer__gnb">${drawerGnb}</div>
          ${drawerPromo}
          <div class="home-drawer__util">${utilHtml}</div>
        </nav>
      </div>
    </header>
  `;
}

function goSameTab(url) {
  if (!url) return;
  window.location.assign(url);
}

function runGuarded(guard, fn, actionKey) {
  if (typeof guard === 'function' && guard(actionKey) === false) {
    return;
  }
  fn();
}

/**
 * 현재 페이지가 home-ui인지 (해시 라우팅 앱)
 * — http/https 혼용·pathname 딥링크(/plans 등)에서도 true
 */
export function isHomeUiHost() {
  try {
    const home = new URL(HOME_UI_BASE, window.location.href);
    if (window.location.hostname !== home.hostname) return false;
    const path = window.location.pathname.replace(/\/$/, '') || '';
    const homePath = home.pathname.replace(/\/$/, '') || '';
    if (path === homePath) return true;
    // pathname 딥링크로 home-ui index.html이 뜬 경우
    const deepRoots = ['/plans', '/support', '/community', '/promo', '/concern', '/mypage', '/messages', '/policy', '/library', '/admin'];
    return deepRoots.some((root) => path === root || path.startsWith(`${root}/`));
  } catch {
    return false;
  }
}

/**
 * @param {HTMLElement} root
 * @param {object} [handlers]
 * @param {(path: string) => void} [handlers.navigateHome] home-ui 내부 해시 이동
 * @param {() => Promise<void> | void} [handlers.logout]
 * @param {() => import('./site-nav-config.js').NavRole} [handlers.getRole]
 * @param {() => boolean} [handlers.guardNavigation] false면 로그아웃 외 이동을 막는다
 */
function openDrawer(header) {
  const drawer = header.querySelector('[data-drawer]');
  const btn = header.querySelector('[data-action="hamburger-toggle"]');
  if (!drawer) return;
  drawer.hidden = false;
  document.body.classList.add('is-drawer-open');
  if (btn) btn.setAttribute('aria-expanded', 'true');
}

function closeDrawer(header) {
  const drawer = header.querySelector('[data-drawer]');
  const btn = header.querySelector('[data-action="hamburger-toggle"]');
  if (!drawer) return;
  drawer.hidden = true;
  document.body.classList.remove('is-drawer-open');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

export function bindSiteChrome(root, handlers = {}) {
  const getRole = handlers.getRole || (() => 'guest');
  const navigateHome = handlers.navigateHome;
  const logout = handlers.logout;
  const guardNavigation = handlers.guardNavigation;

  const header = root.closest?.('.home-header') || root.querySelector?.('.home-header') || root;
  header.querySelector?.('[data-action="hamburger-toggle"]')?.addEventListener('click', () => {
    const drawer = header.querySelector('[data-drawer]');
    if (drawer?.hidden) openDrawer(header); else closeDrawer(header);
  });
  header.querySelectorAll?.('[data-action="drawer-close"]')?.forEach((el) => {
    el.addEventListener('click', () => closeDrawer(header));
  });
  header.querySelector?.('[data-drawer]')?.addEventListener('click', (e) => {
    if (e.target.closest('.home-drawer__panel')) return;
    closeDrawer(header);
  });
  header.querySelector?.('.home-drawer__gnb')?.addEventListener('click', (e) => {
    if (e.target.closest('[data-action]')) closeDrawer(header);
  });
  header.querySelector?.('[data-drawer-promo]')?.addEventListener('click', (e) => {
    const btn = e.target instanceof Element ? e.target.closest('[data-action="drawer-promo-video"]') : null;
    if (!(btn instanceof HTMLElement)) return;
    e.preventDefault();
    const key = btn.getAttribute('data-rail-media-key') || '';
    closeDrawer(header);
    import('../home-ui/src/right-rail.js').then((mod) => {
      mod.openRailPromoVideo(key, btn);
    });
  });
  header.querySelector?.('.home-drawer__util')?.addEventListener('click', (e) => {
    if (e.target.closest('[data-action]') || e.target.closest('[data-util-href]')) closeDrawer(header);
  });

  root.querySelectorAll('[data-util-href]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      runGuarded(guardNavigation, () => goSameTab(el.dataset.utilHref || el.getAttribute('href')), 'util-href');
    });
  });

  root.querySelectorAll('[data-site-logo]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      runGuarded(guardNavigation, () => {
        const href = el.dataset.siteLogo || '';
        if (navigateHome && isHomeUiHost()) {
          try {
            const u = new URL(href, window.location.href);
            const hash = u.hash.replace(/^#/, '') || '/guest';
            const path = hash.startsWith('/') ? hash : `/${hash}`;
            navigateHome(path.split('?')[0]);
            return;
          } catch {
            /* fall through */
          }
        }
        goSameTab(href);
      }, 'logo');
    });
  });

  root.querySelectorAll('[data-action]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const action = el.dataset.action;
      if (!action) return;

      if (action === 'util-logout') {
        root.replaceChildren();
        Promise.resolve(logout ? logout() : null).then(() => {
          goSameTab(homeHashUrl('/guest'));
        });
        return;
      }

      runGuarded(guardNavigation, () => {
        const goHomePath = (path) => {
          if (navigateHome && isHomeUiHost()) {
            navigateHome(path);
          } else {
            goSameTab(homeHashUrl(path));
          }
        };

        if (action.startsWith('gnb-')) {
          const gnbId = action.replace('gnb-', '');
          const role = getRole();
          if (!isGnbItemVisible(role, gnbId)) return;

          const dest = el.getAttribute('href') || gnbHref(gnbId, role);
          if (gnbId === 'home') {
            goHomePath(roleHomePathForNav(role));
            return;
          }
          if (gnbId === 'support') {
            if (navigateHome && isHomeUiHost()) navigateHome('/support');
            else goSameTab(supportHubUrl());
            return;
          }
          if (gnbId === 'community' || gnbId === 'concern') {
            if (navigateHome && isHomeUiHost()) {
              setPendingRoute('/community');
              navigateHome('/community');
            } else goSameTab(dest);
            return;
          }
          if (gnbId === 'plans') {
            setPendingRoute('/plans');
            if (navigateHome && isHomeUiHost()) navigateHome('/plans');
            else goSameTab(dest);
            return;
          }
          const link = resolveGnbLink(gnbId, role);
          if (!link) return;
          if (link.external) goSameTab(link.url);
          else {
            if (
              link.url === '/register-intro/room' ||
              link.url === '/register-intro/tutor' ||
              link.url.startsWith('/register-intro/')
            ) {
              setPendingRoute(link.url);
            }
            goHomePath(link.url);
          }
          return;
        }

        if (action === 'util-guide') {
          if (navigateHome && isHomeUiHost()) navigateHome('/guide');
          else goSameTab(homeHashUrl('/guide'));
          return;
        }
        if (action === 'util-admin') {
          goHomePath('/admin');
          return;
        }
        if (action === 'util-mypage') {
          goHomePath('/mypage');
          return;
        }
        if (action === 'util-messages') {
          goHomePath('/messages');
          return;
        }
        if (action === 'util-recent') {
          goHomePath('/mypage/recent');
        }
      }, action);
    });
  });

  ensureBackToTop(root);
}

/**
 * 렌더된 `.home-header` 높이를 실측해 CSS 변수로 반영
 * fixed 헤더는 flow에서 빠지므로 getBoundingClientRect().height 사용
 * @param {ParentNode} [scope]
 */
export function syncSiteHeaderOffset(scope = document) {
  const header = scope.querySelector?.('.home-header') || document.querySelector('.home-header');
  const toolbar = document.querySelector('.preview-toolbar');
  const toolbarH = toolbar && getComputedStyle(toolbar).display !== 'none'
    ? Math.ceil(toolbar.getBoundingClientRect().height)
    : 0;
  document.documentElement.style.setProperty('--preview-toolbar-h', `${toolbarH}px`);

  if (!header) {
    document.documentElement.style.setProperty(HEADER_OFFSET_VAR, '0px');
    return 0;
  }
  // scrollHeight가 더 안정적일 수 있음 (폰트 로드 전에도 레이아웃 박스 기준)
  const rectH = Math.ceil(header.getBoundingClientRect().height);
  const scrollH = Math.ceil(header.scrollHeight);
  const h = Math.max(rectH, scrollH, 1);
  document.documentElement.style.setProperty(HEADER_OFFSET_VAR, `${h}px`);
  return h;
}

/** resize / 초기 1회 바인딩 */
export function ensureSiteHeaderOffsetListeners() {
  if (offsetBound) return;
  offsetBound = true;
  const run = () => syncSiteHeaderOffset();
  window.addEventListener('resize', run);
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(run);
    const observe = () => {
      const header = document.querySelector('.home-header');
      const toolbar = document.querySelector('.preview-toolbar');
      if (header) ro.observe(header);
      if (toolbar) ro.observe(toolbar);
    };
    observe();
    // 재렌더 후 observe 재시도
    const mo = new MutationObserver(() => observe());
    mo.observe(document.body, { childList: true, subtree: true });
  }
  run();
  requestAnimationFrame(run);
}
