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
import { getCurrentScreen, navigate } from './layout.js';
import { apiMasters, registerState, isTutorBasicComplete } from './state.js';
import { fetchMasters, loadTutor } from './register-api.js';
import { applyTutorToState } from './form-collect.js';
import { renderBasic, bindBasicEvents } from './screens/step-basic.js';
import { renderRegions, bindRegionsEvents } from './screens/step-regions.js';
import { renderLesson, bindLessonEvents } from './screens/step-lesson.js';
import { renderContact, bindContactEvents } from './screens/step-contact.js';
import { renderComplete, bindCompleteEvents } from './screens/step-complete.js';

const SCREENS = {
  basic: { render: renderBasic, bind: bindBasicEvents },
  regions: { render: renderRegions, bind: bindRegionsEvents },
  lesson: { render: renderLesson, bind: bindLessonEvents },
  contact: { render: renderContact, bind: bindContactEvents },
  complete: { render: renderComplete, bind: bindCompleteEvents },
};

const BASIC_KEYS = new Set(['basic', 'regions']);

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

function maybeSkipBasicSteps() {
  if (!registerState.basicComplete) return false;
  const key = getCurrentScreen();
  if (BASIC_KEYS.has(key)) {
    if (window.location.hash !== '#/register/lesson') {
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
    apiMasters.cities = masters.cities ?? [];

    const gate = guardRegisterAccess(getChromeNavRole(), 'tutor');
    if (!gate.ok || gate.mode !== 'form') return null;

    const tutor = await loadTutor().catch(() => null);
    if (tutor) {
      applyTutorToState(registerState, tutor);
      registerState.basicComplete = isTutorBasicComplete(tutor);
    } else {
      const cached = sessionStorage.getItem('study114_tutor_id');
      if (cached) registerState.tutor_id = Number(cached);
      registerState.basicComplete = false;
    }
    return tutor;
  } catch {
    return null;
  }
}

function init() {
  if (!window.location.hash) window.location.hash = '#/register/basic';
  window.addEventListener('hashchange', render);
  Promise.all([initChromeSession(), initApi()])
    .then(([, tutor]) => {
      registerState.basicComplete = isTutorBasicComplete(tutor) || registerState.basicComplete;
      if (registerState.basicComplete && BASIC_KEYS.has(getCurrentScreen())) {
        navigate('/register/lesson');
        return;
      }
      render();
    })
    .catch(() => render());
}

init();
