import '@auth-styles/base.css';
import '@auth-styles/theme-v1.css';
import '../../home-ui/src/styles/tokens.css';
import '../../home-ui/src/styles/home.css';
import '../../shared/register-flow.css';
import './styles/register.css';
import '../../home-ui/src/styles/design-system.css';
import '../../home-ui/src/styles/product-chrome.css';
import '../../home-ui/src/styles/home-right-rail.css';
import '../../home-ui/src/styles/udx-std-apply.css';

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
  markRegisterBootDone,
  markRegisterBootFailed,
} from '../../shared/register-boot-watchdog.js';
import {
  renderSiteHeader,
  bindSiteChrome,
  syncSiteHeaderOffset,
  ensureSiteHeaderOffsetListeners,
} from '../../shared/site-chrome.js';
import { getCurrentScreen, navigate, isRegisterEditMode } from './layout.js';
import { HOME_UI_BASE } from '../../shared/preview-links.js';
import { renderSiteFooter } from '../../shared/site-footer.js';
import { apiMasters, registerState, isTutorBasicComplete } from './state.js';
import { fetchMasters, loadTutor } from './register-api.js';
import { applyTutorToState } from './form-collect.js';
import { presentLoginWelcome } from '../../shared/login-welcome.js';
import { renderBasic, bindBasicEvents } from './screens/step-basic.js';
import { renderRegions, bindRegionsEvents } from './screens/step-regions.js';
import { renderLesson, bindLessonEvents } from './screens/step-lesson.js';
import { renderContact, bindContactEvents } from './screens/step-contact.js';
import { renderDetail, bindDetailEvents } from './screens/step-detail.js';
import { renderComplete, bindCompleteEvents } from './screens/step-complete.js';

const SCREENS = {
  basic: { render: renderBasic, bind: bindBasicEvents },
  regions: { render: renderRegions, bind: bindRegionsEvents },
  lesson: { render: renderLesson, bind: bindLessonEvents },
  contact: { render: renderContact, bind: bindContactEvents },
  detail: { render: renderDetail, bind: bindDetailEvents },
  complete: { render: renderComplete, bind: bindCompleteEvents },
};

const BASIC_KEYS = new Set(['basic', 'regions']);

/** 세션·저장값 확정 전 해시 변경이 빈 폼을 그리지 않게 한다. */
let chromeReady = false;

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
      ${renderSiteFooter({ linkMode: 'absolute', homeBase: HOME_UI_BASE })}
    </div>`;
}

/** @returns {'blocked'|'intro'|'form'} */
function resolveRegisterMode() {
  // 비로그인은 빈 화면·알림 대신 소개+로그인/회원가입. 폼은 열지 않는다.
  if (!isChromeLoggedIn()) return 'intro';
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
  if (isRegisterEditMode()) return false; // 마이페이지 기본정보 수정
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
  if (!chromeReady) return;
  const mode = resolveRegisterMode();
  if (mode === 'blocked') {
    markRegisterBootDone();
    return;
  }

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
    markRegisterBootDone();
    return;
  }

  if (maybeSkipBasicSteps()) return;

  const key = getCurrentScreen();
  const screen = SCREENS[key] || SCREENS.lesson;
  app.innerHTML = screen.render();
  screen.bind(app);
  markRegisterBootDone();
}

/** masters 는 세션과 병렬. 실패하면 저장값 불러오기도 하지 않는다. */
function loadMasters() {
  return fetchMasters().then((masters) => {
    apiMasters.regions = masters.regions ?? [];
    apiMasters.tutorUnits = masters.tutor_units ?? [];
  });
}

/**
 * initChromeSession() 이 끝난 뒤에만 호출한다.
 * guest/intro 면 저장값을 넣지 않는다.
 */
async function loadSavedTutor() {
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
}

function init() {
  if (!window.location.hash) window.location.hash = '#/register/basic';
  window.addEventListener('hashchange', render);
  const mastersReady = loadMasters();
  initChromeSession()
    .then(() => mastersReady)
    .then(() => loadSavedTutor())
    .then((tutor) => {
      presentLoginWelcome(getChromeUser()?.name, isChromeLoggedIn());
      chromeReady = true;
      if (isAuthRedirectPending()) {
        markRegisterBootDone();
        return;
      }
      registerState.basicComplete = isTutorBasicComplete(tutor) || registerState.basicComplete;
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
    .catch(() => {
      chromeReady = true;
      if (isAuthRedirectPending()) {
        markRegisterBootDone();
        return;
      }
      try {
        render();
      } catch {
        markRegisterBootFailed();
      }
    });
}

init();
