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

function renderIntroShell(innerHtml) {
  const header = renderSiteHeader({
    user: getChromeUser(),
    loggedIn: isChromeLoggedIn(),
    role: getChromeNavRole(),
    activeGnbId: 'register_tutor',
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

/** @returns {'blocked'|'intro'|'form'} */
function resolveRegisterMode() {
  const role = getChromeNavRole();
  const gate = guardRegisterAccess(role, 'tutor');
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
    app.innerHTML = renderIntroShell(renderRegisterIntroGate('tutor'));
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

async function initApi() {
  try {
    const masters = await fetchMasters();
    apiMasters.regions = masters.regions ?? [];

    const gate = guardRegisterAccess(getChromeNavRole(), 'tutor');
    if (!gate.ok || gate.mode !== 'form') return;

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
