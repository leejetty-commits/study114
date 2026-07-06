import '@search-ui/styles/search.css';
import { getCurrentScreen } from './state.js';
import { renderGuest, bindGuestEvents } from './screens/guest.js';
import { renderParent, bindParentEvents } from './screens/parent.js';
import { renderStudyRoom, bindStudyRoomEvents } from './screens/study-room.js';
import { renderTutor, bindTutorEvents } from './screens/tutor.js';
import { isMypageRoute, bootstrapMypageRoute, bootstrapMessagesRoute, isSupportRoute, bootstrapSupportRoute, isPolicyRoute, bootstrapPolicyRoute, isLibraryRoute, bootstrapLibraryRoute, isAdminRoute, bootstrapAdminRoute } from './state.js';
import { renderMypage, bindMypageEvents } from './mypage/index.js';
import { renderSupport, bindSupportEvents } from './support/index.js';
import { renderPolicy, bindPolicyEvents } from './policy-index.js';
import { renderLibrary, bindLibraryEvents } from './library/index.js';
import { renderAdmin, bindAdminEvents } from './admin/index.js';
import { initAuthSession, isAdminUser } from './auth-session.js';
import { parseHashQuery } from '../../shared/preview-links.js';
import { showEmailVerifyOverlay } from './email-verify-overlay.js';
import { activateSupportApi, deactivateSupportApi } from './support/support-backend.js';
import { activateBoardApi, deactivateBoardApi } from './board/board-backend.js';
import { activateAdminApi, deactivateAdminApi } from './admin/admin-backend.js';

const SCREENS = {
  guest: { render: renderGuest, bind: bindGuestEvents },
  parent: { render: renderParent, bind: bindParentEvents },
  studyRoom: { render: renderStudyRoom, bind: bindStudyRoomEvents },
  tutor: { render: renderTutor, bind: bindTutorEvents },
};

function render() {
  const app = document.getElementById('app');
  if (isAdminRoute()) {
    app.innerHTML = renderAdmin();
    bindAdminEvents(app, render);
    return;
  }
  if (isLibraryRoute()) {
    app.innerHTML = renderLibrary();
    bindLibraryEvents(app, render);
    return;
  }
  if (isSupportRoute()) {
    app.innerHTML = renderSupport();
    bindSupportEvents(app, render);
    return;
  }
  if (isPolicyRoute()) {
    app.innerHTML = renderPolicy();
    bindPolicyEvents(app, render);
    return;
  }
  if (isMypageRoute()) {
    app.innerHTML = renderMypage();
    bindMypageEvents(app, render);
    return;
  }
  const key = getCurrentScreen();
  const screen = SCREENS[key] || SCREENS.guest;
  app.innerHTML = screen.render();
  screen.bind(app, render);
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
    bootstrapMypageRoute();
    bootstrapMessagesRoute();
    bootstrapSupportRoute();
    bootstrapPolicyRoute();
    bootstrapLibraryRoute();
    bootstrapAdminRoute();
    if (!window.location.hash) {
      window.location.hash = '#/guest';
    }
    window.addEventListener('hashchange', () => {
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
      } else {
        deactivateAdminApi();
      }
      render();
    });
    window.addEventListener('auth:logout', () => {
      deactivateAdminApi();
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
        if (user && isAdminUser()) {
          await activateAdminApi().catch((err) => {
            console.warn('[admin] api disabled — static A28 fallback', err);
            deactivateAdminApi();
          });
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
