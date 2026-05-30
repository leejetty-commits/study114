import { getCurrentScreen } from './state.js';
import { renderGuest, bindGuestEvents } from './screens/guest.js';
import { renderParent, bindParentEvents } from './screens/parent.js';
import { renderStudyRoom, bindStudyRoomEvents } from './screens/study-room.js';
import { renderTutor, bindTutorEvents } from './screens/tutor.js';

const SCREENS = {
  guest: { render: renderGuest, bind: bindGuestEvents },
  parent: { render: renderParent, bind: bindParentEvents },
  studyRoom: { render: renderStudyRoom, bind: bindStudyRoomEvents },
  tutor: { render: renderTutor, bind: bindTutorEvents },
};

function render() {
  const key = getCurrentScreen();
  const screen = SCREENS[key] || SCREENS.guest;
  const app = document.getElementById('app');
  app.innerHTML = screen.render();
  screen.bind(app, render);
}

function init() {
  if (!window.location.hash) {
    window.location.hash = '#/guest';
  }
  window.addEventListener('hashchange', render);
  render();
}

init();
