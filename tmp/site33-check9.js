const { execSync } = require('child_process');
const d = execSync('git diff -U5 -- preview/auth-ui/src/screens/signup-complete.js', { encoding: 'utf8' });
// find profile label related hunks
const lines = d.split(/\n/);
let buf=[]; let on=false;
for (const l of lines) {
  if (l.startsWith('@@')) { if(on && buf.length){console.log(buf.join('\n')+'\n---');} buf=[l]; on=/profile|kind|Basic|가입|title|Lead|roleLabel|summarize/i.test(l)?true:false; }
  else if (on) buf.push(l);
  if (/profile|kind#|Basic|공부방|과외쌤|AUTH_WELCOME_COPY.complete|function .*[Pp]rofile|role ===/.test(l)) { on=true; buf.push(l); }
}
if(buf.length) console.log(buf.slice(0,80).join('\n'));

console.log('\n=== old profile display from HEAD grep ===');
const head = execSync('git show HEAD:preview/auth-ui/src/screens/signup-complete.js', { encoding: 'utf8' });
head.split(/\n/).forEach((l,i)=>{ if(/kind|Basic|#\$\{|profile|가입 ·|기본등록 완료|학생 기본정보/.test(l)) console.log((i+1)+': '+l.trim()); });
