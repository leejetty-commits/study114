import '@auth-styles/base.css';
import '@auth-styles/theme-v1.css';
import '../../home-ui/src/styles/tokens.css';
import '../../home-ui/src/styles/home.css';
import './styles/register.css';

import { initChromeSession } from '../../shared/chrome-session.js';
import { getCurrentScreen } from './layout.js';
import { apiMasters, registerState } from './state.js';
import { fetchMasters, loadTutor } from './register-api.js';
import { applyTutorToState } from './form-collect.js';
import { renderBasic, bindBasicEvents } from './screens/step-basic.js';
import { renderRegions, bindRegionsEvents } from './screens/step-regions.js';
import { renderLesson, bindLessonEvents } from './screens/step-lesson.js';
import { renderCareer, bindCareerEvents } from './screens/step-career.js';
import { renderContact, bindContactEvents } from './screens/step-contact.js';
import { renderComplete, bindCompleteEvents } from './screens/step-complete.js';

const SCREENS = {
  basic: { render: renderBasic, bind: bindBasicEvents },
  regions: { render: renderRegions, bind: bindRegionsEvents },
  lesson: { render: renderLesson, bind: bindLessonEvents },
  career: { render: renderCareer, bind: bindCareerEvents },
  contact: { render: renderContact, bind: bindContactEvents },
  complete: { render: renderComplete, bind: bindCompleteEvents },
};

function render() {
  const key = getCurrentScreen();
  const screen = SCREENS[key] || SCREENS.basic;
  document.getElementById('app').innerHTML = screen.render();
  screen.bind(document.getElementById('app'));
}

async function initApi() {
  try {
    const masters = await fetchMasters();
    apiMasters.regions = masters.regions ?? [];
    const tutor = await loadTutor().catch(() => null);
    if (tutor) applyTutorToState(registerState, tutor);
    else {
      const cached = sessionStorage.getItem('study114_tutor_id');
      if (cached) registerState.tutor_id = Number(cached);
    }
  } catch {
    /* masters는 비로그인 가능 */
  }
}

function init() {
  if (!window.location.hash) window.location.hash = '#/register/basic';
  window.addEventListener('hashchange', render);
  Promise.all([initChromeSession(), initApi()]).finally(render);
}

init();
