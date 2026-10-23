const fs = require('fs');
const { execSync } = require('child_process');

function show(file, needles) {
  const t = fs.readFileSync(file, 'utf8');
  console.log('\n==== ' + file + ' ====');
  const lines = t.split(/\n/);
  lines.forEach((l,i) => {
    if (needles.some(n => l.includes(n))) console.log((i+1)+': '+l.trim());
  });
}

show('preview/auth-ui/src/screens/signup-complete.js', ['profileStudyRoom','profileTutor','AUTH_WELCOME','title','studentLead','providerLead','kind','#']);
show('preview/shared/guest-gate-ui.js', ['guestGateLead','AUTH_WELCOME']);
show('preview/auth-ui/src/screens/login.js', ['AUTH_WELCOME','sub','signupHint','returnLead','savedLead','loginFailure','withLoginWelcome']);
show('preview/home-ui/src/main.js', ['presentLoginWelcome','AUTH_WELCOME']);
show('preview/search-ui/src/main.js', ['presentLoginWelcome']);
show('preview/study-room-ui/src/main.js', ['presentLoginWelcome']);
show('preview/tutor-ui/src/main.js', ['presentLoginWelcome']);

// how other UIs get fonts
console.log('\n==== CSS imports of pretendard/tokens ====');
for (const f of [
  'preview/auth-ui/src/main.js','preview/auth-ui/src/styles/main.css','preview/auth-ui/src/app.css',
  'preview/search-ui/src/main.js','preview/study-room-ui/src/main.js','preview/tutor-ui/src/main.js',
  'preview/home-ui/src/main.js'
]) {
  if (!fs.existsSync(f)) { console.log('missing '+f); continue; }
  const t = fs.readFileSync(f,'utf8');
  const hits = t.split(/\n/).filter(l => /import.*(css|tokens|pretendard|fonts)/i.test(l));
  console.log(f+':'); console.log(hits.join('\n')||'(no css imports)');
}
