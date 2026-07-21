import './styles/tokens.css';
import './styles/home.css';
import '@search-ui/styles/search.css';
import './styles/design-system.css';
import { renderGuest, bindGuestEvents } from './screens/guest.js';
import { renderParent, bindParentEvents } from './screens/parent.js';
import { renderStudyRoom, bindStudyRoomEvents } from './screens/study-room.js';
import { renderTutor, bindTutorEvents } from './screens/tutor.js';
import {
  getCurrentScreen,
  navigate,
  isMypageRoute,
  bootstrapMypageRoute,
  bootstrapMessagesRoute,
  isSupportRoute,
  bootstrapSupportRoute,
  isPolicyRoute,
  bootstrapPolicyRoute,
  isLibraryRoute,
  bootstrapLibraryRoute,
  isAdminRoute,
  bootstrapAdminRoute,
  isPlansRoute,
  bootstrapPlansRoute,
} from './state.js';
import { PLANS_REDIRECTS } from './plans/router.js';
import { renderMypage, bindMypageEvents } from './mypage/index.js';
import { renderSupport, bindSupportEvents } from './support/index.js';
import { renderPolicy, bindPolicyEvents } from './policy-index.js';
import { renderLibrary, bindLibraryEvents } from './library/index.js';
import { renderAdmin, bindAdminEvents } from './admin/index.js';
import { renderPlans, bindPlansEvents } from './plans/index.js';
import { initAuthSession, isAdminUser, isLoggedIn, ROLE_HOME } from './auth-session.js';
import { guardRoleHomeAccess } from '../../shared/route-access.js';
import { parseHashQuery } from '../../shared/preview-links.js';
import { SHOW_PREVIEW_TOOLBAR } from '../../shared/preview-flags.js';
import { showEmailVerifyOverlay } from './email-verify-overlay.js';
import { activateSupportApi, deactivateSupportApi } from './support/support-backend.js';
import { activateBoardApi, deactivateBoardApi } from './board/board-backend.js';
import { activateAdminApi, deactivateAdminApi } from './admin/admin-backend.js';
import { activateContentConfigApi, deactivateContentConfigApi } from './content-config-backend.js';
import { mountOpsChrome } from './site-ops-chrome.js';

const SCREENS = {
  guest: { render: renderGuest, bind: bindGuestEvents },
  parent: { render: renderParent, bind: bindParentEvents },
  studyRoom: { render: renderStudyRoom, bind: bindStudyRoomEvents },
  tutor: { render: renderTutor, bind: bindTutorEvents },
};

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

function render() {
  if (applyPlansRedirects()) return;
  const app = document.getElementById('app');
  if (isAdminRoute()) {
    app.innerHTML = renderAdmin();
    bindAdminEvents(app, render);
    return;
  }
  if (isPlansRoute()) {
    app.innerHTML = renderPlans();
    bindPlansEvents(app, render);
    mountOpsChrome(app);
    return;
  }
  if (isLibraryRoute()) {
    app.innerHTML = renderLibrary();
    bindLibraryEvents(app, render);
    mountOpsChrome(app);
    return;
  }
  if (isSupportRoute()) {
    app.innerHTML = renderSupport();
    bindSupportEvents(app, render);
    mountOpsChrome(app);
    return;
  }
  if (isPolicyRoute()) {
    app.innerHTML = renderPolicy();
    bindPolicyEvents(app, render);
    mountOpsChrome(app);
    return;
  }
  if (isMypageRoute()) {
    app.innerHTML = renderMypage();
    bindMypageEvents(app, render);
    mountOpsChrome(app);
    return;
  }
  const key = getCurrentScreen();
  const roleGate = guardRoleHomeAccess(key, isLoggedIn());
  if (!roleGate.ok) {
    if (window.location.hash !== roleGate.redirectHash) {
      window.location.replace(roleGate.redirectHash);
      return;
    }
  }
  const screen = SCREENS[roleGate.ok ? key : 'guest'] || SCREENS.guest;
  app.innerHTML = screen.render();
  screen.bind(app, render);
  mountOpsChrome(app);
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

function init() {
  try {
    if (!SHOW_PREVIEW_TOOLBAR) {
      document.documentElement.style.setProperty('--preview-toolbar-h', '0px');
    }
    bootstrapPlansRoute();
    bootstrapMypageRoute();
    bootstrapMessagesRoute();
    bootstrapSupportRoute();
    bootstrapPolicyRoute();
    bootstrapLibraryRoute();
    bootstrapAdminRoute();
    // pathname 딥링크는 bootstrap*가 hash로 옮긴다. fragment만 유실된 `/`는 guest.
    // /support 등 pathname이 남은 채 hash만 비면 guest로 덮어쓰지 않는다.
    if (!window.location.hash) {
      const path = window.location.pathname.replace(/\/$/, '') || '/';
      const deep =
        path === '/support' ||
        path.startsWith('/support/') ||
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
        path.startsWith('/plans/');
      if (!deep) {
        window.location.hash = '#/guest';
      }
    }
    // 부팅 중 bootstrap*Route의 location.replace가 유발하는 hashchange가
    // 세션(me.php) 로드 전에 조기 render를 일으켜 계정·관리자 콘솔이 늦게
    // 나타나는 이중 렌더를 막는다. 세션 준비 후 첫 render부터 반영한다.
    let bootReady = false;
    window.addEventListener('hashchange', () => {
      if (!bootReady) return;
      try {
        render();
      } catch (e) {
        showBootError(e);
      }
    });
    window.addEventListener('auth:login', async () => {
      if (isAdminUser()) {
        await activateAdminApi().catch((err) => {
          console.warn('[admin] api disabled — static A28 fallback', err);
          deactivateAdminApi();
        });
        await activateContentConfigApi().catch((err) => {
          console.warn('[content-config] api disabled — sessionStorage fallback', err);
          deactivateContentConfigApi();
        });
      } else {
        deactivateAdminApi();
        deactivateContentConfigApi();
      }
      render();
    });
    window.addEventListener('auth:logout', () => {
      deactivateAdminApi();
      deactivateContentConfigApi();
      render();
    });
    window.addEventListener('auth:profile', () => {
      render();
    });
    Promise.all([
      activateSupportApi().catch((err) => {
        console.warn('[support] api disabled — sessionStorage fallback', err);
        deactivateSupportApi();
      }),
      activateBoardApi().catch((err) => {
        console.warn('[board] api disabled — sessionStorage fallback', err);
        deactivateBoardApi();
      }),
      initAuthSession(),
    ])
      .then(async ([, , user]) => {
        bootReady = true;
        if (user && isAdminUser()) {
          await activateAdminApi().catch((err) => {
            console.warn('[admin] api disabled — static A28 fallback', err);
            deactivateAdminApi();
          });
          await activateContentConfigApi().catch((err) => {
            console.warn('[content-config] api disabled — sessionStorage fallback', err);
            deactivateContentConfigApi();
          });
        }
        // 소셜/세션 로그인 후 #/guest에 남아 있으면 역할 홈으로 이동
        // admin은 운영 콘솔이 기본 홈이 아님 — 사이트 진입 시 게스트 홈 유지
        if (
          user &&
          getCurrentScreen() === 'guest' &&
          user.role_type !== 'admin' &&
          ROLE_HOME[user.role_type]
        ) {
          navigate(ROLE_HOME[user.role_type]);
          return;
        }
        const q = parseHashQuery();
        if (q.email_verified === '1') {
          window.alert('이메일 인증이 완료되었습니다.');
        } else if (q.email_verify_error) {
          showEmailVerifyOverlay();
        }
        render();
      })
      .catch((err) => showBootError(err));
  } catch (err) {
    showBootError(err);
  }
}

init();
