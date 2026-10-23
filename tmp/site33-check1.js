const fs = require('fs');
const { execSync } = require('child_process');

console.log('=== git diff public/api src (name-only) ===');
console.log(execSync('git diff --name-only -- public/api src', { encoding: 'utf8' }) || '(none)');

console.log('=== git diff public/api/auth/oauth/callback.php (stat) ===');
try {
  console.log(execSync('git diff --stat -- public/api/auth/oauth/callback.php', { encoding: 'utf8' }));
  const d = execSync('git diff -- public/api/auth/oauth/callback.php', { encoding: 'utf8' });
  console.log(d.slice(0, 4000));
} catch (e) { console.log(String(e)); }

console.log('=== mail/template path grep in status ===');
const st = execSync('git status --short', { encoding: 'utf8' });
const mailish = st.split(/\n/).filter(l => /mail|email|template|smtp|verify.*php|oauth/i.test(l));
console.log(mailish.join('\n') || '(none in status matching mail/email/template)');
