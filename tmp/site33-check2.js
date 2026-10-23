const fs = require('fs');
const files = [
  'preview/auth-ui/src/screens/login.js',
  'preview/auth-ui/src/screens/signup-terms.js',
  'preview/auth-ui/src/screens/signup-role.js',
  'preview/auth-ui/src/screens/signup-form.js',
  'preview/auth-ui/src/screens/signup-verify-email.js',
  'preview/auth-ui/src/screens/signup-complete.js',
  'preview/auth-ui/src/screens/signup-basic.js',
  'preview/auth-ui/src/login-stage.js',
  'preview/auth-ui/src/email-verify-send-status.js',
  'preview/shared/guest-gate-ui.js',
  'preview/home-ui/src/main.js',
  'preview/search-ui/src/main.js',
  'preview/study-room-ui/src/main.js',
  'preview/tutor-ui/src/main.js',
];
const keys = ['AUTH_WELCOME_COPY','loginFailureMessage','loginWelcomeText','presentLoginWelcome','withLoginWelcome','guestGateLead','auth-welcome-copy','login-welcome'];
for (const f of files) {
  const t = fs.readFileSync(f, 'utf8');
  const uses = keys.filter(k => t.includes(k));
  console.log(f + ' => ' + (uses.join(', ') || 'NONE'));
}
