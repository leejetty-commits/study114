import { getCurrentScreen, getCurrentPath } from './layout.js';
import { renderLogin, bindLoginEvents } from './screens/login.js';
import { renderSignupTerms, bindSignupTermsEvents } from './screens/signup-terms.js';
import { renderSignupRole, bindSignupRoleEvents } from './screens/signup-role.js';
import { renderSignupForm, bindSignupFormEvents } from './screens/signup-form.js';
import { renderSignupComplete, bindSignupCompleteEvents } from './screens/signup-complete.js';
import { renderFindId, bindFindIdEvents } from './screens/find-id.js';
import { renderFindPassword, bindFindPasswordEvents } from './screens/find-password.js';

const SCREENS = {
  login: { render: renderLogin, bind: bindLoginEvents },
  signupTerms: { render: renderSignupTerms, bind: bindSignupTermsEvents },
  signupRole: { render: renderSignupRole, bind: bindSignupRoleEvents },
  signupForm: { render: renderSignupForm, bind: bindSignupFormEvents },
  signupComplete: { render: renderSignupComplete, bind: bindSignupCompleteEvents },
  findId: { render: renderFindId, bind: bindFindIdEvents },
  findPassword: { render: renderFindPassword, bind: bindFindPasswordEvents },
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

  window.addEventListener('hashchange', render);
  window.addEventListener('themechange', render);
  render();
}

init();
