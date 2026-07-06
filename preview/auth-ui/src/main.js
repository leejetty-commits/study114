import { getCurrentScreen, getCurrentPath } from './layout.js';
import { signupState } from './state.js';
import { fetchRegions } from './auth-api.js';
import { isReturnImportMode, getReturnImportRole } from '../../shared/student-auth-bridge.js';
import { parseHashQuery } from '../../shared/preview-links.js';
import { renderLogin, bindLoginEvents } from './screens/login.js';
import { renderSignupTerms, bindSignupTermsEvents } from './screens/signup-terms.js';
import { renderSignupRole, bindSignupRoleEvents } from './screens/signup-role.js';
import { renderSignupForm, bindSignupFormEvents } from './screens/signup-form.js';
import { renderSignupBasic, bindSignupBasicEvents } from './screens/signup-basic.js';
import { renderSignupComplete, bindSignupCompleteEvents } from './screens/signup-complete.js';
import { renderFindId, bindFindIdEvents } from './screens/find-id.js';
import { renderFindPassword, bindFindPasswordEvents } from './screens/find-password.js';
import { renderResetPassword, bindResetPasswordEvents } from './screens/reset-password.js';

const SCREENS = {
  login: { render: renderLogin, bind: bindLoginEvents },
  signupTerms: { render: renderSignupTerms, bind: bindSignupTermsEvents },
  signupRole: { render: renderSignupRole, bind: bindSignupRoleEvents },
  signupForm: { render: renderSignupForm, bind: bindSignupFormEvents },
  signupBasic: { render: renderSignupBasic, bind: bindSignupBasicEvents },
  signupComplete: { render: renderSignupComplete, bind: bindSignupCompleteEvents },
  findId: { render: renderFindId, bind: bindFindIdEvents },
  findPassword: { render: renderFindPassword, bind: bindFindPasswordEvents },
  resetPassword: { render: renderResetPassword, bind: bindResetPasswordEvents },
};

function render() {
  const screen = getCurrentScreen();
  const config = SCREENS[screen] || SCREENS.login;
  const app = document.getElementById('app');

  app.innerHTML = config.render();
  config.bind(app);
}

function init() {
  if (!window.location.hash) {
    window.location.hash = '#/login';
  }

  if (isReturnImportMode()) {
    const role = getReturnImportRole() || 'student';
    signupState.role = role;
    const path = getCurrentPath();
    if (!path.startsWith('/signup/basic')) {
      window.location.hash = '#/signup/basic?return_import=1&role=student';
    }
  }

  const hashQuery = parseHashQuery();
  if (hashQuery.from === 'oauth' && hashQuery.role) {
    signupState.role = hashQuery.role;
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('themechange', render);
  fetchRegions()
    .then((regions) => {
      signupState.regions = regions;
    })
    .catch(() => {})
    .finally(render);
}

init();
