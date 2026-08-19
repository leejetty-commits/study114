import '@auth-styles/base.css';
import '@auth-styles/theme-v1.css';
import '../../home-ui/src/styles/tokens.css';
import '../../home-ui/src/styles/home.css';
import '../../shared/register-flow.css';
import './styles/register.css';
import '../../home-ui/src/styles/design-system.css';
import '../../home-ui/src/styles/product-chrome.css';

import {
  getChromeNavRole,
  getChromeUser,
  isChromeLoggedIn,
  initChromeSession,
  chromeLogout,
} from '../../shared/chrome-session.js';
import { guardRegisterAccess } from '../../shared/route-access.js';
import { isAuthRedirectPending } from '../../shared/auth-redirect.js';
import { renderRegisterIntroGate, bindGuestGateLinks } from '../../shared/guest-gate-ui.js';
import {
  renderSiteHeader,
  bindSiteChrome,
  syncSiteHeaderOffset,
  ensureSiteHeaderOffsetListeners,
} from '../../shared/site-chrome.js';
import { getCurrentScreen, navigate, isRegisterEditMode, getHashQuery, basicOverviewPath } from './layout.js';
import { renderBasic, bindBasicEvents } from './screens/step-basic.js';
import { renderLocation, bindLocationEvents } from './screens/step-location.js';
import { renderLesson, bindLessonEvents } from './screens/step-lesson.js';
import { renderFacility, bindFacilityEvents } from './screens/step-facility.js';
import { renderComplete, bindCompleteEvents } from './screens/step-complete.js';
import { apiMasters, registerState, isRoomBasicComplete } from './state.js';
import { fetchMasters, loadRoom } from './register-api.js';
import { applyRoomToState } from './form-collect.js';

const SCREENS = {
  basic: { render: renderBasic, bind: bindBasicEvents },
  location: { render: renderLocation, bind: bindLocationEvents },
  lesson: { render: renderLesson, bind: bindLessonEvents },
  facility: { render: renderFacility, bind: bindFacilityEvents },
  complete: { render: renderComplete, bind: bindCompleteEvents },
};

const BASIC_KEYS = new Set(['basic', 'location']);

function renderIntroShell(innerHtml) {
  const header = renderSiteHeader({
    user: getChromeUser(),
    loggedIn: isChromeLoggedIn(),
    role: getChromeNavRole(),
    activeGnbId: 'register_room',
  });
  return `
    <div class="site-chrome-shell register-chrome-shell">
      ${header}
      <div class="home-body register-body register-body--no-promo">
        <div class="home-main">
          <div class="site-gate-wrap">
            ${innerHtml}
          </div>
        </div>
      </div>
    </div>`;
}

function resolveRegisterMode() {
  const role = getChromeNavRole();
  const gate = guardRegisterAccess(role, 'room');
  if (!gate.ok) {
    window.alert(gate.message);
    window.location.assign(gate.redirectUrl);
    return 'blocked';
  }
  return gate.mode;
}

/** 위치 단독 진입 → 기본정보 현황으로 (수정은 현황 팝업) */
function maybeRedirectLocationToOverview() {
  if (getCurrentScreen() !== 'location') return false;
  if (isRegisterEditMode()) {
    sessionStorage.setItem('study114_open_basic_edit', '1');
  }
  navigate(basicOverviewPath());
  return true;
}

function render() {
  const mode = resolveRegisterMode();
  if (mode === 'blocked') return;

  document.body.classList.remove('register-edit-open');

  const app = document.getElementById('app');
  if (mode === 'intro') {
    app.innerHTML = renderIntroShell(renderRegisterIntroGate('room'));
    bindGuestGateLinks(app);
    bindSiteChrome(app, {
      getRole: getChromeNavRole,
      logout: async () => {
        await chromeLogout();
        render();
      },
    });
    syncSiteHeaderOffset();
    ensureSiteHeaderOffsetListeners();
    return;
  }

  if (maybeRedirectLocationToOverview()) return;

  const key = getCurrentScreen();
  const screen = SCREENS[key] || SCREENS.basic;
  app.innerHTML = screen.render();
  screen.bind(app);
}

async function initApi() {
  try {
    const masters = await fetchMasters();
    apiMasters.regions = masters.regions ?? [];
    apiMasters.complexes = masters.complexes ?? [];
    apiMasters.facilities = masters.facilities ?? [];
    apiMasters.subjects = masters.subjects ?? [];
  } catch {
    /* 마스터 실패해도 기존 공부방 load는 이어간다 */
  }

  try {
    const gate = guardRegisterAccess(getChromeNavRole(), 'room');
    if (!gate.ok || gate.mode !== 'form') return null;

    const qRoomId = Number(getHashQuery().get('room_id') || '');
    const room = await loadRoom(Number.isFinite(qRoomId) && qRoomId > 0 ? qRoomId : null).catch(() => null);
    if (room) {
      applyRoomToState(registerState, room);
      const st = String(room.detail_completion_status || '');
      if (st === 'expanded_in_progress' || st === 'expanded_complete') {
        registerState.detailLessonSaved = true;
      }
      if (st === 'expanded_complete') {
        registerState.detailFacilitySaved = true;
      }
    } else {
      const cachedId = sessionStorage.getItem('study114_study_room_id');
      if (cachedId) registerState.study_room_id = Number(cachedId);
    }
    registerState.basicComplete = isRoomBasicComplete(room) || isRoomBasicComplete(registerState);
    return room;
  } catch {
    return null;
  }
}

function init() {
  if (!window.location.hash) window.location.hash = '#/register/basic';
  window.addEventListener('hashchange', render);

  Promise.all([initChromeSession(), initApi()])
    .then(() => {
      if (isAuthRedirectPending()) return;
      registerState.basicComplete =
        isRoomBasicComplete(registerState) || registerState.basicComplete;
      if (getCurrentScreen() === 'location') {
        if (isRegisterEditMode()) {
          sessionStorage.setItem('study114_open_basic_edit', '1');
        }
        navigate(basicOverviewPath());
        return;
      }
      render();
    })
    .catch(() => render());
}

init();
