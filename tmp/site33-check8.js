const fs = require('fs');
const { execSync } = require('child_process');

console.log('=== .login-welcome CSS ===');
const cssHits = execSync('git grep -n "login-welcome" -- preview || true', { encoding: 'utf8', shell: true });
console.log(cssHits || '(none)');

console.log('=== remaining CDN in those 5 index.html ===');
for (const f of ['preview/auth-ui/index.html','preview/home-ui/index.html','preview/search-ui/index.html','preview/study-room-ui/index.html','preview/tutor-ui/index.html']) {
  const t = fs.readFileSync(f,'utf8');
  console.log(f+': jsdelivr='+t.includes('jsdelivr')+' googleapis='+t.includes('googleapis')+' Noto='+/Noto/i.test(t));
}

console.log('=== doneLead / waitDelay strings ===');
const c = fs.readFileSync('preview/shared/auth-welcome-copy.js','utf8');
const m1 = c.match(/doneLead:\s*'([^']*)'/);
const m2 = c.match(/doneTitle:\s*'([^']*)'/);
const m3 = c.match(/waitDelay:\s*'([^']*)'/);
console.log('doneTitle:', m2&&m2[1]);
console.log('doneLead:', m1&&m1[1]);
console.log('waitDelay:', m3&&m3[1]);

console.log('=== region# in HEAD vs working (was it pre-existing?) ===');
const head = execSync('git show HEAD:preview/auth-ui/src/screens/signup-complete.js', { encoding: 'utf8' });
console.log('HEAD has region#:', head.includes('region#'));
console.log('WORKING has region#:', fs.readFileSync('preview/auth-ui/src/screens/signup-complete.js','utf8').includes('region#'));

console.log('=== profileRoleLabel old vs new ===');
const oldMatch = head.match(/function profile[^\{]+\{[\s\S]{0,400}/);
console.log('old snippet:', (oldMatch&&oldMatch[0]||'').slice(0,300));
