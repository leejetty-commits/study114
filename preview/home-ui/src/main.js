import './styles/tokens.css';
import './styles/home.css';
import './styles/home-member-flows.css';
import './styles/home-support-guide.css';
import './styles/home-admin.css';
import './styles/home-right-rail.css';
import './styles/home-community.css';
import './styles/info-pages.css';
import './styles/zip-bridge.css';
import './styles/zip-guide.css';
import './styles/zip-visual-v2.css';
import './styles/home-promo.css';
import './styles/home-provider-reviews.css';
import '@search-ui/styles/search.css';
import './styles/design-system.css';
/* listings는 design-system 뒤에 — section-heading/toolbar 정본 */
import './styles/home-listings.css';
import './styles/product-chrome.css';
import './styles/home-marketing-banner.css';
import './styles/neighborhood-greeting.css';
import './styles/home-popup.css';
import './styles/plans-theme.css';
import './styles/plans-store.css';
import './styles/mypage-ops.css';
import './styles/registration-check.css';
import './styles/myshop.css';
import './styles/myshop-public.css';
/* auth base.css 전체 import 금지(전역 reset). 폼 프리미티브만 공유 */
import '../../shared/register-form-primitives.css';
import '../../shared/register-flow.css';
import '../../shared/password-field.css';
import '../../study-room-ui/src/styles/register.css';
import '@search-ui/styles/search-visily.css';
/* UDX-STD-001 오버레이는 공통 CSS 이후 */
import './styles/udx-std-apply.css';
import './styles/student-detail.css';
/* 홍보랜딩·공부방 쪽지설정 본문만. 전역 헤더/다른 탭에는 선택자가 닿지 않음 */
import './styles/promo-catalog.css';
import './styles/promo-v2.css';
import './styles/inquiry-settings-catalog.css';
/* 학생 마이페이지·내 등록만. 홈·타역할 선택자는 없음 */
import './styles/student-mypage-stage5b.css';
import { bindCardTrustRailFit } from './exposure-render.js';
import { renderGuest, bindGuestEvents } from './screens/guest.js';
import { s114Alert } from '../../shared/confirm-dialog.js';
import {
  getCurrentScreen,
  navigate,
  isMypageRoute,
  bootstrapMypageRoute,
  bootstrapMessagesRoute,
  isGuideRoute,
  bootstrapGuideRoute,
  isCommunityRoute,
  bootstrapCommunityRoute,
  isPromoRoute,
  bootstrapPromoRoute,
  isSupportRoute,
  bootstrapSupportRoute,
  isAboutRoute,
  bootstrapAboutRoute,
  isPolicyRoute,
  bootstrapPolicyRoute,
  isLibraryRoute,
  isInfoBoardRoute,
  bootstrapLibraryRoute,
  isAdminRoute,
  bootstrapAdminRoute,
  isPlansRoute,
  bootstrapPlansRoute,
  isMyshopRoute,
  bootstrapMyshopRoute,
  isMessagesRoute,
  isRegisterIntroRoute,
} from './state.js';
import { bindLayoutEvents, renderHomeShell } from './layout.js';
import { readLastRoleHint } from '../../shared/last-role.js';
import { PLANS_REDIRECTS } from './plans/router.js';
import { initAuthSession, getAuthUser, isAdminUser, isLoggedIn, isEmailVerified, ROLE_HOME, registerStudyRoomSnapshotSeed } from './auth-session.js';
import { importNeighborhoodGreetingHandoff, pullNeighborhoodGreetings } from './neighborhood-greeting-ui.js';
import { guardRoleHomeAccess, isPublicPlansCatalogPath } from '../../shared/route-access.js';
import { navRoleFromAuthUser } from './nav-config.js';
import { parseHashQuery } from '../../shared/preview-links.js';
import { presentLoginWelcome } from '../../shared/login-welcome.js';
import { AUTH_WELCOME_COPY } from '../../shared/auth-welcome-copy.js';
import { SHOW_PREVIEW_TOOLBAR } from '../../shared/preview-flags.js';
import { showEmailVerifyOverlay } from './email-verify-overlay.js';
import { activateSupportApi, deactivateSupportApi } from './support/support-backend.js';
import { activateBoardApi, boardKeysBlockedForRole, deactivateBoardApi, hydrateBoardCache, hydrateNoticeCenter, hydrateNoticeHome, resetNoticeCaches, isBoardApiMode, getNoticeHomePosts } from './board/board-backend.js';
import { resetConcernData } from './concern/store.js';
import { setConsoleUnlockRequiredHandler } from './admin/admin-fetch.js';
import { activateContentConfigApi, deactivateContentConfigApi } from './content-config-backend.js';
import { mountOpsChrome } from './site-ops-chrome.js';
import { mountHomePopup } from './home-popup/mount.js';
import { consumePendingRoute, clearPendingRoute, peekPendingRoute } from '../../shared/pending-route.js';
import { isAuthRedirectPending, redirectToEmailVerifyWait } from '../../shared/auth-redirect.js';
import { resumePendingDeepIntent, hasPendingDeepIntent, resetDeepIntentResumeFlag } from './resume-deep-intent.js';
import { closeDetailModal } from './detail-decision/detail-shell.js';
import { closeCompareModal } from './compare-modal.js';
import '../../shared/dialog-drag-auto.js';

/* 게스트 첫 화면에 없는 화면은 그 주소에서만 받는다. 해시 판별·plans 리다이렉트 표·인증·2차 비밀번호는 정적. */
const loadAdminScreen = () => import('./admin/index.js');
const loadParentScreen = () => import('./screens/parent.js');
const loadStudyRoomScreen = () => import('./screens/study-room.js');
const loadTutorScreen = () => import('./screens/tutor.js');
const loadMypageScreen = () => import('./mypage/index.js');
const loadPlansScreen = () => import('./plans/index.js');
const loadMyshopScreen = () => import('./myshop/index.js');
const loadGuideScreen = () => import('./guide/index.js');
const loadConcernScreen = () => import('./concern/index.js');
const loadPromoScreen = () => import('./promo/index.js');
const loadSupportScreen = () => import('./support/index.js');
const loadAboutScreen = () => import('./about.js');
const loadPolicyScreen = () => import('./policy-index.js');
const loadLibraryScreen = () => import('./library/index.js');
const loadRegisterIntroScreen = () => import('./register-intro/index.js');

/** @type {Promise<{ activateAdminApi: () => Promise<void>, deactivateAdminApi: () => void }>|null} */
let adminBackendLoad = null;
function loadAdminBackend() {
  if (!adminBackendLoad) adminBackendLoad = import('./admin/admin-backend.js');
  return adminBackendLoad;
}
async function activateAdminBackend() {
  const mod = await loadAdminBackend();
  await mod.activateAdminApi();
}
function deactivateAdminBackend() {
  if (!adminBackendLoad) return;
  adminBackendLoad.then((mod) => mod.deactivateAdminApi()).catch(() => {});
}

/** 첫 진입만 안내 문구. 이미 그려진 화면은 조각이 올 때까지 유지한다. */
function paintRouteLoading(app) {
  if (!app || app.childElementCount > 0) return;
  app.innerHTML = '<p role="status" style="padding:1.5rem;font-family:system-ui,sans-serif">불러오는 중</p>';
}

const CHUNK_RELOAD_KEY = 'study114-chunk-reload';

function isChunkLoadError(err) {
  const msg = String(err instanceof Error ? err.message : err || '');
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('vite:preloadError')
  );
}

/** 배포 직후 옛 조각 404는 같은 주소에서 한 번만 새로고침한다. */
let chunkReloadPending = false;
function reloadOnceForStaleChunk(err) {
  if (!isChunkLoadError(err)) return false;
  if (chunkReloadPending) return true;
  const here = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === here) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, here);
  } catch {
    return false;
  }
  chunkReloadPending = true;
  window.location.reload();
  return true;
}

function handleBootError(err) {
  if (reloadOnceForStaleChunk(err)) return;
  showBootError(err);
}

window.addEventListener('vite:preloadError', (event) => {
  const err = event?.payload instanceof Error ? event.payload : new Error('vite:preloadError');
  if (reloadOnceForStaleChunk(err)) event.preventDefault();
});

async function loadRouteModule(app, loader) {
  paintRouteLoading(app);
  try {
    const mod = await loader();
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    } catch {
      /* 성공 뒤에는 다음 배포도 한 번 새로고침할 수 있게 비운다. */
    }
    return mod;
  } catch (err) {
    if (reloadOnceForStaleChunk(err)) return new Promise(() => {});
    throw err;
  }
}

function hydrateNotices() {
  hydrateNoticeCenter().catch(() => {});
  // 공지 캐시는 첫 그리기보다 늦게 채워질 수 있다. 마이페이지에 블록이 아직 없을 때만 다시 그린다.
  hydrateNoticeHome()
    .then(() => {
      try {
        if (!sessionChecked || !isMypageRoute()) return;
        if (!isBoardApiMode() || getNoticeHomePosts().length === 0) return;
        const app = document.getElementById('app');
        if (!app || app.querySelector('.mypage-notice')) return;
        render();
      } catch (err) {
        console.warn('[notice] mypage repaint skipped', err);
      }
    })
    .catch(() => {});
}

/** 해시 이동 시 body에 남은 상세·비교 모달·비교 토스트 제거 */
function dismissRouteOverlays() {
  closeDetailModal();
  closeCompareModal();
  const toast = document.getElementById('p24-toast');
  if (toast) toast.classList.remove('is-visible');
}

const SCREENS = {
  guest: { render: renderGuest, bind: bindGuestEvents },
};

const ROLE_SCREEN_LOADERS = {
  parent: loadParentScreen,
  studyRoom: loadStudyRoomScreen,
  tutor: loadTutorScreen,
};

/** 마지막 역할 힌트 → 역할 홈 조각. 관리자는 역할 홈 조각이 없다. */
const HINT_SCREEN = {
  tutor: 'tutor',
  study_room_owner: 'studyRoom',
  guardian_student: 'parent',
};

function prefetchLastRoleScreen() {
  const key = HINT_SCREEN[readLastRoleHint()];
  const loader = key ? ROLE_SCREEN_LOADERS[key] : null;
  if (!loader) return;
  loader().catch(() => {});
}

/** 로그인 흔적이 있으면 지도 없는 헤더와 회색 칸만 둔다. */
function paintNeutralShell() {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = renderHomeShell(
    'guest',
    `<div class="home-session-wait" aria-busy="true">
      <p class="home-session-wait__label">불러오는 중</p>
      <div class="home-session-wait__bar"></div>
      <div class="home-session-wait__block"></div>
      <div class="home-session-wait__block home-session-wait__block--short"></div>
    </div>`,
    { showAuth: false, showRoleSwitch: false, sidebarHtml: '' },
  );
  bindLayoutEvents(app, () => {});
}

function roleScreenFromModule(key, mod) {
  if (key === 'parent') return { render: mod.renderParent, bind: mod.bindParentEvents };
  if (key === 'studyRoom') return { render: mod.renderStudyRoom, bind: mod.bindStudyRoomEvents };
  if (key === 'tutor') return { render: mod.renderTutor, bind: mod.bindTutorEvents };
  return null;
}

function applyPlansRedirects() {
  const hash = window.location.hash.slice(1) || '';
  const pathWithQuery = hash.startsWith('/') ? hash : `/${hash}`;
  const path = pathWithQuery.split('?')[0];
  const query = pathWithQuery.includes('?') ? pathWithQuery.slice(pathWithQuery.indexOf('?')) : '';
  if (PLANS_REDIRECTS[path]) {
    window.location.replace(`#${PLANS_REDIRECTS[path]}${query}`);
    return true;
  }
  return false;
}

let paintedHash = null;
/** me.php 확인 전에는 역할 홈을 그리지도, 가드로 판정하지도 않는다. */
let sessionChecked = false;
/** 빠른 해시 전환 시 늦게 도착한 비동기 그리기를 버린다. */
let renderGeneration = 0;

setConsoleUnlockRequiredHandler(async () => {
  await initAuthSession(false);
  if (isAdminRoute()) {
    await render();
  }
});

async function render() {
  const generation = ++renderGeneration;
  // 첫 진입 init()과 같이 #/messages 를 #/mypage/messages 로 바꾼다.
  // 주소를 바꾼 경우에는 여기서 그리지 않고, 바뀐 주소의 hashchange에 맡긴다.
  if (bootstrapMessagesRoute()) return;
  if (isMypageRoute()) bootstrapMypageRoute();
  const hashBefore = window.location.hash;
  await renderScreen(generation);
  if (generation !== renderGeneration) return;
  if (window.location.hash === hashBefore) paintedHash = hashBefore;
}

function shouldPaintBeforeSession() {
  if (isAdminRoute() || isMypageRoute() || isPlansRoute() || isMessagesRoute() || isRegisterIntroRoute() || isInfoBoardRoute()) {
    return false;
  }
  // 커뮤니티·고객센터는 세션 전에 그리면 비회원 헤더가 먼저 보인다.
  if (isCommunityRoute() || isSupportRoute()) return false;
  const screen = getCurrentScreen();
  // 비로그인 손님만 게스트 홈을 먼저 그린다. 로그인 흔적이 있으면 지도 없는 칸만 둔다.
  if (screen === 'guest') return !readLastRoleHint();
  return screen !== 'parent' && screen !== 'studyRoom' && screen !== 'tutor';
}

async function renderScreen(generation) {
  // 공개 마이샵·가이드는 미인증 로그인 유저도 열람 가능 (공통 쇼케이스)
  if (isLoggedIn() && !isEmailVerified() && !isGuideRoute() && !isMyshopRoute() && !isAboutRoute()) {
    redirectToEmailVerifyWait();
    return;
  }
  if (applyPlansRedirects()) return;
  const app = document.getElementById('app');
  if (isAdminRoute()) {
    const { renderAdmin, bindAdminEvents, renderAdminDenied } = await loadAdminScreen();
    if (generation !== renderGeneration) return;
    if (!isAdminUser()) {
      app.innerHTML = renderAdminDenied();
      bindAdminEvents(app, render);
      mountOpsChrome(app);
      mountHomePopup(app);
      return;
    }
    app.innerHTML = renderAdmin();
    bindAdminEvents(app, render);
    mountOpsChrome(app);
    mountHomePopup(app);
    return;
  }
  if (isRegisterIntroRoute()) {
    const {
      renderRegisterIntro,
      bindRegisterIntroEvents,
      redirectLoggedInFromRegisterIntro,
    } = await loadRegisterIntroScreen();
    if (generation !== renderGeneration) return;
    if (redirectLoggedInFromRegisterIntro()) return;
    app.innerHTML = renderRegisterIntro();
    bindRegisterIntroEvents(app, render);
    mountOpsChrome(app);
    mountHomePopup(app);
    return;
  }
  if (isPlansRoute()) {
    const { renderPlans, bindPlansEvents } = await loadRouteModule(app, loadPlansScreen);
    if (generation !== renderGeneration) return;
    app.innerHTML = renderPlans();
    bindPlansEvents(app, render);
    mountOpsChrome(app);
    mountHomePopup(app);
    return;
  }
  if (isLibraryRoute()) {
    const { renderLibrary, bindLibraryEvents } = await loadLibraryScreen();
    if (generation !== renderGeneration) return;
    app.innerHTML = renderLibrary();
    bindLibraryEvents(app, render);
    mountOpsChrome(app);
    mountHomePopup(app);
    return;
  }
  if (isAboutRoute()) {
    const { renderAbout, bindAboutEvents } = await loadRouteModule(app, loadAboutScreen);
    if (generation !== renderGeneration) return;
    app.innerHTML = renderAbout();
    bindAboutEvents(app, render);
    mountOpsChrome(app);
    mountHomePopup(app);
    return;
  }
  if (isSupportRoute()) {
    // 해시가 세션 확정 전에 고객센터로 바뀌면 비회원 화면을 그리지 않는다.
    if (!sessionChecked) {
      app.innerHTML = '';
      return;
    }
    const { renderSupport, bindSupportEvents } = await loadSupportScreen();
    if (generation !== renderGeneration) return;
    app.innerHTML = renderSupport();
    bindSupportEvents(app, render);
    mountOpsChrome(app);
    mountHomePopup(app);
    return;
  }
  if (isGuideRoute()) {
    const { renderGuide, bindGuideEvents } = await loadGuideScreen();
    if (generation !== renderGeneration) return;
    app.innerHTML = renderGuide();
    bindGuideEvents(app, render);
    mountOpsChrome(app);
    mountHomePopup(app);
    return;
  }
  if (isCommunityRoute()) {
    // 해시가 세션 확정 전에 커뮤니티로 바뀌면 비회원 화면을 그리지 않는다.
    if (!sessionChecked) {
      app.innerHTML = '';
      return;
    }
    const { renderConcern, bindConcernEvents } = await loadConcernScreen();
    if (generation !== renderGeneration) return;
    app.innerHTML = renderConcern();
    bindConcernEvents(app, render);
    mountOpsChrome(app);
    mountHomePopup(app);
    return;
  }
  if (isPromoRoute()) {
    const { renderPromo, bindPromoEvents } = await loadPromoScreen();
    if (generation !== renderGeneration) return;
    app.innerHTML = renderPromo();
    bindPromoEvents(app, render);
    mountOpsChrome(app);
    mountHomePopup(app);
    return;
  }
  if (isPolicyRoute()) {
    const { renderPolicy, bindPolicyEvents } = await loadPolicyScreen();
    if (generation !== renderGeneration) return;
    app.innerHTML = renderPolicy();
    bindPolicyEvents(app, render);
    mountOpsChrome(app);
    mountHomePopup(app);
    return;
  }
  if (isMyshopRoute()) {
    const { renderPublicMyshop, bindPublicMyshopEvents } = await loadRouteModule(app, loadMyshopScreen);
    if (generation !== renderGeneration) return;
    app.innerHTML = renderPublicMyshop();
    bindPublicMyshopEvents(app, render);
    mountOpsChrome(app);
    mountHomePopup(app);
    return;
  }
  if (isMypageRoute()) {
    // 세션 확인 전에는 ACTIVE_ROLE·기본 분기로 상단 메뉴를 그리지 않는다.
    if (!sessionChecked) {
      app.innerHTML = '';
      return;
    }
    const { renderMypage, bindMypageEvents } = await loadRouteModule(app, loadMypageScreen);
    if (generation !== renderGeneration) return;
    app.innerHTML = renderMypage();
    bindMypageEvents(app, render);
    bindCardTrustRailFit(app);
    mountOpsChrome(app);
    mountHomePopup(app);
    return;
  }
  const key = getCurrentScreen();
  if (!sessionChecked && key === 'guest' && readLastRoleHint()) {
    paintNeutralShell();
    return;
  }
  if (!sessionChecked && ROLE_SCREEN_LOADERS[key]) return;
  const roleGate = guardRoleHomeAccess(key, isLoggedIn(), navRoleFromAuthUser(getAuthUser()));
  if (!roleGate.ok) {
    if (window.location.hash !== roleGate.redirectHash) {
      window.location.replace(roleGate.redirectHash);
      return;
    }
  }
  let screen = SCREENS.guest;
  if (roleGate.ok && ROLE_SCREEN_LOADERS[key]) {
    const mod = await loadRouteModule(app, ROLE_SCREEN_LOADERS[key]);
    if (generation !== renderGeneration) return;
    screen = roleScreenFromModule(key, mod) || SCREENS.guest;
  }
  app.innerHTML = screen.render();
  screen.bind(app, render);
  bindCardTrustRailFit(app);
  mountOpsChrome(app);
  mountHomePopup(app);
}

function showBootError(err) {
  const app = document.getElementById('app');
  if (!app) return;
  const msg = err instanceof Error ? err.message : String(err);
  app.innerHTML = `
    <div style="padding:1.5rem;font-family:system-ui,sans-serif;max-width:40rem">
      <p style="font-weight:700;color:#b91c1c">프리뷰 로드 오류</p>
      <pre style="margin-top:0.5rem;padding:0.75rem;background:#fef2f2;border-radius:0.5rem;font-size:0.8125rem;white-space:pre-wrap">${msg.replace(/</g, '&lt;')}</pre>
      <p style="margin-top:0.75rem;font-size:0.875rem;color:#64748b">개발자 도구(F12) 콘솔에서 스택을 확인하세요.</p>
    </div>
  `;
  console.error(err);
}

function leaveLegacyAdminEntry() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path !== '/adm' && path !== '/bbs/admin.php') return false;
  window.location.replace('/#/guest');
  return true;
}

function init() {
  try {
    if (leaveLegacyAdminEntry()) return;
    registerStudyRoomSnapshotSeed((snap) =>
      import('./study-room-home-seed.js').then((mod) => mod.seedStudyRoomHomeFromSnapshot(snap)),
    );
    import('../../shared/session-snapshot.js').catch(() => {});
    importNeighborhoodGreetingHandoff();
    if (!SHOW_PREVIEW_TOOLBAR) {
      document.documentElement.style.setProperty('--preview-toolbar-h', '0px');
    }
    bootstrapPlansRoute();
    bootstrapMypageRoute();
    bootstrapMessagesRoute();
    bootstrapGuideRoute();
    bootstrapCommunityRoute();
    bootstrapPromoRoute();
    bootstrapSupportRoute();
    bootstrapAboutRoute();
    bootstrapPolicyRoute();
    bootstrapLibraryRoute();
    bootstrapAdminRoute();
    bootstrapMyshopRoute();
    // pathname 딥링크는 bootstrap*가 hash로 옮긴다. fragment만 유실된 `/`는 guest.
    // /support 등 pathname이 남은 채 hash만 비면 guest로 덮어쓰지 않는다.
    // SPA 간 이동으로 hash/pathname이 떨어졌을 때는 pending-route로 복구한다.
    if (!window.location.hash) {
      const pending = consumePendingRoute();
      if (pending) {
        window.location.hash = pending.startsWith('#') ? pending : `#${pending}`;
      } else {
        const path = window.location.pathname.replace(/\/$/, '') || '/';
        const deep =
          path === '/support' ||
          path.startsWith('/support/') ||
          path === '/guide' ||
          path.startsWith('/guide/') ||
          path === '/community' ||
          path.startsWith('/community/') ||
          path === '/promo' ||
          path.startsWith('/promo/') ||
          path === '/concern' ||
          path.startsWith('/concern/') ||
          path === '/mypage' ||
          path.startsWith('/mypage/') ||
          path === '/messages' ||
          path.startsWith('/messages/') ||
          path === '/policy' ||
          path.startsWith('/policy/') ||
          path === '/library' ||
          path.startsWith('/library/') ||
          path === '/admin' ||
          path.startsWith('/admin/') ||
          path === '/plans' ||
          path.startsWith('/plans/') ||
          path === '/about' ||
          path === '/myshop' ||
          path.startsWith('/myshop/');
        if (!deep) {
          window.location.hash = '#/guest';
        }
      }
    } else if (
      window.location.hash.slice(1).split('?')[0] === '/plans' ||
      window.location.hash.slice(1).startsWith('/plans/') ||
      window.location.hash.slice(1).split('?')[0] === '/community' ||
      window.location.hash.slice(1).startsWith('/community/') ||
      window.location.hash.slice(1).split('?')[0] === '/register-intro/room' ||
      window.location.hash.slice(1).split('?')[0] === '/register-intro/tutor' ||
      window.location.hash.slice(1).startsWith('/register-intro/')
    ) {
      clearPendingRoute();
    }
    // bootstrap*Route가 큐에 넣은 hashchange는 방금 그린 셸과 같으면 무시한다.
    // 게스트·공개 화면은 me.php·board·support 완료 전에 셸을 그린다.
    // 역할 홈·마이페이지·관리자는 세션 전 guard가 해시를 옮기므로 여기서 그리지 않는다.
    let bootReady = false;
    // 해시가 바뀌기 전에 비운다. hashchange는 한 프레임 늦게 돌아 이전 게스트 홈이 남는다.
    document.addEventListener('click', (event) => {
      if (sessionChecked) return;
      const target = event.target instanceof Element ? event.target : null;
      const hit = target?.closest('[data-action="gnb-community"], [data-action="gnb-support"]');
      if (!hit) return;
      const app = document.getElementById('app');
      if (app) app.innerHTML = '';
    }, true);
    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const link = target.closest('[data-util-href]');
      const href = link?.getAttribute('data-util-href') || '';
      const action = target.closest('[data-action]')?.getAttribute('data-action') || '';
      // 상세등록 GNB는 세션 확정 전에만 막는다. 로그인 뒤에는 통과한다.
      if (action === 'gnb-register_room' || action === 'gnb-register_tutor') {
        if (!sessionChecked) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }
      const guestOnly =
        href.includes('#/login') ||
        href.includes('#/signup') ||
        action === 'login-gate' ||
        action === 'compare-guest-blocked' ||
        action === 'search' ||
        Boolean(target.closest('[data-prime-empty], [data-basic-empty], [data-pick-empty]'));
      if (!guestOnly) return;
      if (sessionChecked) return;
      event.preventDefault();
      event.stopPropagation();
    }, true);
    window.addEventListener('pagehide', () => {
      document.getElementById('app')?.replaceChildren();
    });
    window.addEventListener('pageshow', (event) => {
      if (!event.persisted) return;
      initAuthSession()
        .then(() => {
          sessionChecked = true;
          render();
        })
        .catch((err) => handleBootError(err));
    });
    window.addEventListener('hashchange', (event) => {
      if (!bootReady) return;
      // 부트가 넣은 같은 주소 hashchange만 건너뛴다.
      // 공부방 상단탭은 load 뒤에 같은 주소로 화면을 다시 그린다.
      if (event.isTrusted && window.location.hash === paintedHash) return;
      const oldMark = typeof event.oldURL === 'string' ? event.oldURL.indexOf('#') : -1;
      const newMark = typeof event.newURL === 'string' ? event.newURL.indexOf('#') : -1;
      const oldHash = oldMark >= 0 ? event.oldURL.slice(oldMark) : '';
      const newHash = newMark >= 0 ? event.newURL.slice(newMark) : '';
      dismissRouteOverlays();
      render()
        .then(() => {
          if (oldHash === newHash) return;
          if (!newHash.startsWith('#/')) return;
          if (window.location.hash !== newHash) return;
          window.scrollTo(0, 0);
        })
        .catch(handleBootError);
    });
    window.addEventListener('auth:login', async () => {
      sessionChecked = true;
      if (isAdminUser() && getAuthUser()?.console_unlocked === true) {
        await activateAdminBackend().catch((err) => {
          console.warn('[admin] api disabled — static A28 fallback', err);
          deactivateAdminBackend();
        });
        await activateContentConfigApi().catch((err) => {
          console.warn('[content-config] api disabled — sessionStorage fallback', err);
          deactivateContentConfigApi();
        });
      } else if (!isAdminUser()) {
        deactivateAdminBackend();
        deactivateContentConfigApi();
      }
      hydrateNotices();
      render();
      queueMicrotask(() => resumePendingDeepIntent());
    });
    window.addEventListener('auth:logout', () => {
      sessionChecked = true;
      resetDeepIntentResumeFlag();
      resetConcernData();
      deactivateBoardApi();
      deactivateAdminBackend();
      deactivateContentConfigApi();
      resetNoticeCaches();
      hydrateNotices();
      render();
    });
    window.addEventListener('auth:role-change', () => {
      resetConcernData();
      deactivateBoardApi();
      activateBoardApi().then(() => hydrateNotices()).catch((err) => {
        console.warn('[board] rehydrate after role-change failed', err);
        deactivateBoardApi();
      });
    });
    window.addEventListener('auth:profile', () => {
      render();
    });
    window.addEventListener('auth:session-hydrated', (event) => {
      if (event.detail?.changed === false) return;
      render();
    });
    prefetchLastRoleScreen();
    if (shouldPaintBeforeSession()) {
      render().catch(handleBootError);
    } else if (getCurrentScreen() === 'guest' && readLastRoleHint()) {
      paintNeutralShell();
    }
    setTimeout(() => {
      bootReady = true;
      if (paintedHash !== null && window.location.hash !== paintedHash) {
        render().catch(handleBootError);
      }
    }, 0);
    const supportBoot = activateSupportApi().catch((err) => {
      console.warn('[support] api disabled — sessionStorage fallback', err);
      deactivateSupportApi();
    });
    hydrateNotices();
    // 게스트에게 401이 나는 library·submission은 첫 부트에서 요청하지 않는다.
    const guestBoardBoot = activateBoardApi({ navRole: 'guest' }).catch((err) => {
      console.warn('[board] api disabled — sessionStorage fallback', err);
      deactivateBoardApi();
    });
    let followUpDone = false;
    Promise.all([
      supportBoot,
      guestBoardBoot,
      initAuthSession(),
    ])
      .then(async ([, , user]) => {
        if (followUpDone) return;
        followUpDone = true;
        presentLoginWelcome(user?.name, Boolean(user));
        sessionChecked = true;
        pullNeighborhoodGreetings()
          .then((changed) => {
            if (changed) render();
          })
          .catch(() => {});
        if (isAuthRedirectPending()) return;
        if (user) {
          hydrateNotices();
          const deferred = boardKeysBlockedForRole('guest');
          if (deferred.length) {
            hydrateBoardCache({ onlyKeys: deferred })
              .then(() => {
                if (isLibraryRoute() || isMypageRoute() || isAdminRoute()) render();
              })
              .catch((err) => {
                console.warn('[board] deferred hydrate failed', err);
              });
          }
        }
        if (user && isAdminUser() && user.console_unlocked === true) {
          await activateAdminBackend().catch((err) => {
            console.warn('[admin] api disabled — static A28 fallback', err);
            deactivateAdminBackend();
          });
          await activateContentConfigApi().catch((err) => {
            console.warn('[content-config] api disabled — sessionStorage fallback', err);
            deactivateContentConfigApi();
          });
        }
        // 소셜/세션 로그인 후 #/guest에 남아 있으면 역할 홈으로 이동
        // admin은 운영 콘솔이 기본 홈이 아님 — 사이트 진입 시 게스트 홈 유지
        // 커뮤니티·유료상품 등 pending/딥링크와 겹치면 역할홈으로 덮어쓰지 않음
        const pending = peekPendingRoute();
        const onDeep =
          isCommunityRoute() ||
          isPromoRoute() ||
          isPlansRoute() ||
          isRegisterIntroRoute() ||
          isSupportRoute() ||
          isAboutRoute() ||
          isGuideRoute() ||
          isMyshopRoute() ||
          isMypageRoute() ||
          isAdminRoute();
        if (
          user &&
          getCurrentScreen() === 'guest' &&
          !onDeep &&
          !pending &&
          !hasPendingDeepIntent() &&
          user.role_type !== 'admin' &&
          ROLE_HOME[user.role_type]
        ) {
          navigate(ROLE_HOME[user.role_type]);
          if (!bootReady) render();
          return;
        }
        if (pending === '/community' || pending === '/community/' || (pending && pending.startsWith('/community/'))) {
          clearPendingRoute();
          const target = pending;
          if (!isCommunityRoute()) {
            navigate(target);
            return;
          }
        }
        if (
          pending === '/register-intro/room' ||
          pending === '/register-intro/tutor' ||
          (pending && pending.startsWith('/register-intro/'))
        ) {
          clearPendingRoute();
          const target = pending;
          if (!isRegisterIntroRoute()) {
            navigate(target);
            return;
          }
        }
        if (pending && isPublicPlansCatalogPath(pending)) {
          clearPendingRoute();
          const here = (window.location.hash.slice(1) || '').split('?')[0];
          if (here !== pending.split('?')[0]) {
            navigate(pending);
            return;
          }
        }
        const q = parseHashQuery();
        if (q.email_verified === '1') {
          await s114Alert(AUTH_WELCOME_COPY.verify.doneAlert);
        } else if (q.email_verify_error) {
          showEmailVerifyOverlay();
        }
        render();
        if (user) queueMicrotask(() => resumePendingDeepIntent());
      })
      .catch((err) => handleBootError(err));
  } catch (err) {
    handleBootError(err);
  }
}

init();
