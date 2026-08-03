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
import { renderRegisterIntroGate, bindGuestGateLinks } from '../../shared/guest-gate-ui.js';
import {
  renderSiteHeader,
  bindSiteChrome,
  syncSiteHeaderOffset,
  ensureSiteHeaderOffsetListeners,
} from '../../shared/site-chrome.js';
import { getCurrentScreen, navigate, isRegisterEditMode } from './layout.js';
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

function maybeSkipBasicSteps() {
  if (!registerState.basicComplete) return false;
  if (isRegisterEditMode()) return false;
  const key = getCurrentScreen();
  if (BASIC_KEYS.has(key)) {
    if (window.location.hash.split('?')[0] !== '#/register/lesson') {
      navigate('/register/lesson');
      return true;
    }
  }
  return false;
}

function render() {
  const mode = resolveRegisterMode();
  if (mode === 'blocked') return;

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

  if (maybeSkipBasicSteps()) return;

  const key = getCurrentScreen();
  const screen = SCREENS[key] || SCREENS.lesson;
  app.innerHTML = screen.render();
  screen.bind(app);
}

async function initApi() {
  try {
    const masters = await fetchMasters();
    apiMasters.regions = masters.regions ?? [];
    apiMasters.complexes = masters.complexes ?? [];
    apiMasters.facilities = masters.facilities ?? [];

    if (apiMasters.regions.length && !registerState.region_id) {
      registerState.region_id = String(apiMasters.regions[0].id);
    }

    const gate = guardRegisterAccess(getChromeNavRole(), 'room');
    if (!gate.ok || gate.mode !== 'form') return null;

    const room = await loadRoom().catch(() => null);
    if (room) {
      applyRoomToState(registerState, room);
      registerState.basicComplete = isRoomBasicComplete(room);
    } else {
      const cachedId = sessionStorage.getItem('study114_study_room_id');
      if (cachedId) registerState.study_room_id = Number(cachedId);
      registerState.basicComplete = false;
    }
    return room;
  } catch {
    return null;
  }
}

function init() {
  if (!window.location.hash) window.location.hash = '#/register/basic';
  window.addEventListener('hashchange', render);

  Promise.all([initChromeSession(), initApi()])
    .then(([, room]) => {
      registerState.basicComplete = isRoomBasicComplete(room) || registerState.basicComplete;
      if (
        registerState.basicComplete &&
        BASIC_KEYS.has(getCurrentScreen()) &&
        !isRegisterEditMode()
      ) {
        navigate('/register/lesson');
        return;
      }
      render();
    })
    .catch(() => render());
}

init();
