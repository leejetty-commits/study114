/**
 * 공통 사이트 헤더 (유틸 + GNB) — 앱 간 시각·전환 일관성
 * 새 탭(target=_blank / window.open) 금지 · 같은 탭 location.assign / 내부 navigate
 */

import {
  UTIL_MENU,
  GNB_MAIN,
  navRoleFromAuthUser,
  roleHomeHashPath,
  homeHashUrl,
  resolveGnbLink,
  HOME_UI_BASE,
  isGnbItemVisible,
} from './site-nav-config.js';

import { ensureBackToTop } from './back-to-top.js';

const HEADER_OFFSET_VAR = '--site-header-h';
let offsetBound = false;

/**
 * @param {NavRole} role
 * @param {boolean} showAuth guest util
 */
function renderUtilBar(role, showAuth) {
  const items = showAuth ? UTIL_MENU.guest : UTIL_MENU.loggedIn;
  return items
    .map((item) => {
      if (item.href) {
        const cls = item.emphasis ? 'home-util__link home-util__link--emphasis' : 'home-util__link';
        return `<a href="${item.href}" class="${cls}" data-util-href="${item.href}">${item.label}</a>`;
      }
      return `<button type="button" class="home-util__link" data-action="${item.action}">${item.label}</button>`;
    })
    .join('');
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

function gnbHref(itemId, role) {
  if (itemId === 'home') return homeHashUrl(roleHomePathForNav(role));
  if (itemId === 'support') return homeHashUrl('/support');
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

  return `
    <header class="home-header site-chrome-header" data-site-chrome>
      <div class="home-header__util">
        <div class="home-header__util-inner">
          <nav class="home-util" aria-label="유틸 메뉴">${renderUtilBar(role, showAuth)}</nav>
        </div>
      </div>
      <div class="home-header__main">
        <div class="home-header__inner">
          <a href="${logoHref}" class="home-header__logo" data-site-logo="${logoHref}" aria-label="우동공과 홈">
            <img src="/assets/brand/logo-wordmark.png" alt="우동공과" width="120" height="32" />
          </a>
          <nav class="home-gnb" aria-label="메인 메뉴">${gnbItems}</nav>
        </div>
      </div>
      <nav class="home-gnb-mobile" aria-label="모바일 메뉴">${mobileGnb}</nav>
    </header>
  `;
}

function goSameTab(url) {
  if (!url) return;
  window.location.assign(url);
}

/**
 * 현재 페이지가 home-ui인지 (해시 라우팅 앱)
 */
export function isHomeUiHost() {
  try {
    const home = new URL(HOME_UI_BASE, window.location.href);
    return window.location.origin === home.origin && window.location.pathname.replace(/\/$/, '') === home.pathname.replace(/\/$/, '');
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
 */
export function bindSiteChrome(root, handlers = {}) {
  const getRole = handlers.getRole || (() => 'guest');
  const navigateHome = handlers.navigateHome;
  const logout = handlers.logout;

  root.querySelectorAll('[data-util-href]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      goSameTab(el.dataset.utilHref || el.getAttribute('href'));
    });
  });

  root.querySelectorAll('[data-site-logo]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
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
    });
  });

  root.querySelectorAll('[data-action]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const action = el.dataset.action;
      if (!action) return;

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

        // href에 실제 목적지를 넣어 두었으므로, 타 SPA→홈 이동은 location이 fragment를
        // 잃지 않도록 pathname 딥링크(homeHashUrl)를 그대로 사용한다.
        const dest = el.getAttribute('href') || gnbHref(gnbId, role);
        if (gnbId === 'home') {
          goHomePath(roleHomePathForNav(role));
          return;
        }
        if (gnbId === 'support') {
          if (navigateHome && isHomeUiHost()) navigateHome('/support');
          else goSameTab(dest);
          return;
        }
        if (gnbId === 'plans') {
          if (navigateHome && isHomeUiHost()) navigateHome('/plans');
          else goSameTab(dest);
          return;
        }
        const link = resolveGnbLink(gnbId, role);
        if (!link) return;
        if (link.external) goSameTab(link.url);
        else goHomePath(link.url);
        return;
      }

      if (action === 'util-guide') {
        if (navigateHome && isHomeUiHost()) navigateHome('/support/guide');
        else goSameTab(homeHashUrl('/support/guide'));
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
        return;
      }
      if (action === 'util-logout') {
        Promise.resolve(logout ? logout() : null).then(() => {
          goSameTab(homeHashUrl('/guest'));
        });
      }
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
