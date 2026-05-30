import '@auth-styles/base.css';
import '@auth-styles/theme-v1.css';
import './styles/register.css';

import { getCurrentScreen } from './layout.js';
import { renderBasic, bindBasicEvents } from './screens/step-basic.js';
import { renderLocation, bindLocationEvents } from './screens/step-location.js';
import { renderLesson, bindLessonEvents } from './screens/step-lesson.js';
import { renderCareer, bindCareerEvents } from './screens/step-career.js';
import { renderFacility, bindFacilityEvents } from './screens/step-facility.js';
import { renderComplete, bindCompleteEvents } from './screens/step-complete.js';

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
  render();
}

init();
