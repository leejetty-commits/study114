import '@auth-styles/base.css';
import '@auth-styles/theme-v1.css';
import '../../home-ui/src/styles/tokens.css';
import '../../home-ui/src/styles/home.css';
import './styles/register.css';
import '../../home-ui/src/styles/design-system.css';

import { initChromeSession } from '../../shared/chrome-session.js';
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

function render() {
  const key = getCurrentScreen();
  const screen = SCREENS[key] || SCREENS.basic;
  const app = document.getElementById('app');
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
