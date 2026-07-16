import '@auth-styles/base.css';
import '@auth-styles/theme-v1.css';
import '../../home-ui/src/styles/tokens.css';
import '../../home-ui/src/styles/home.css';
import './styles/register.css';
import '../../home-ui/src/styles/design-system.css';

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
import { getCurrentScreen } from './layout.js';
import { renderBasic, bindBasicEvents } from './screens/step-basic.js';
import { renderLocation, bindLocationEvents } from './screens/step-location.js';
import { renderLesson, bindLessonEvents } from './screens/step-lesson.js';
import { renderCareer, bindCareerEvents } from './screens/step-career.js';
import { renderFacility, bindFacilityEvents } from './screens/step-facility.js';
import { renderComplete, bindCompleteEvents } from './screens/step-complete.js';
import { apiMasters, registerState } from './state.js';
import { fetchMasters, loadRoom } from './register-api.js';
import { applyRoomToState } from './form-collect.js';

const SCREENS = {
  basic: { render: renderBasic, bind: bindBasicEvents },
  location: { render: renderLocation, bind: bindLocationEvents },
  lesson: { render: renderLesson, bind: bindLessonEvents },
  career: { render: renderCareer, bind: bindCareerEvents },
  facility: { render: renderFacility, bind: bindFacilityEvents },
  complete: { render: renderComplete, bind: bindCompleteEvents },
};

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
      <div class="home-body register-body">
        <div class="home-main">
          <div class="register-card panel">
            ${innerHtml}
          </div>
        </div>
      </div>
    </div>`;
}

/** @returns {'blocked'|'intro'|'form'} */
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

  const key = getCurrentScreen();
  const screen = SCREENS[key] || SCREENS.basic;
  app.innerHTML = screen.render();
  screen.bind(app);
}

function init() {
  if (!window.location.hash) {
    window.location.hash = '#/register/basic';
  }
  window.addEventListener('hashchange', render);

  Promise.all([initChromeSession(), initApi()]).finally(render);
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
    if (!gate.ok || gate.mode !== 'form') return;

    const room = await loadRoom().catch(() => null);
    if (room) {
      applyRoomToState(registerState, room);
    } else {
      const cachedId = sessionStorage.getItem('study114_study_room_id');
      if (cachedId) registerState.study_room_id = Number(cachedId);
    }
  } catch {
    /* masters는 비로그인 가능 · load는 401 허용 */
  }
}

init();
