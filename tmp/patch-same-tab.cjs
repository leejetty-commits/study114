const fs = require('fs');
let s = fs.readFileSync('scripts/verify-tutor-register-same-tab.mjs', 'utf8');
const old = "assert(\r\n  /if \\(role === 'tutor'\\) \\{\\s*window\\.location\\.assign\\(home\\);\\s*return;/.test(complete),\r\n  'complete: tutor home CTA uses location.assign(home) then return',\r\n);";
const neu = "assert(\r\n  complete.includes('window.location.assign(home)') &&\r\n    !/if \\(role === 'tutor'\\) \\{\\s*window\\.location\\.assign\\(home\\);\\s*return;/.test(complete),\r\n  'complete: shared location.assign(home) for all roles (no tutor-only branch)',\r\n);\r\nassert(\r\n  !complete.includes('window.open(home') && !complete.includes(\"window.open(home\"),\r\n  'complete: home CTA must not window.open',\r\n);";
if (!s.includes(old)) {
  // try LF
  const oldLf = old.replace(/\r\n/g, '\n');
  if (s.includes(oldLf)) {
    s = s.replace(oldLf, neu.replace(/\r\n/g, '\n'));
  } else {
    console.error('OLD NOT FOUND');
    process.exit(1);
  }
} else {
  s = s.replace(old, neu);
}
fs.writeFileSync('scripts/verify-tutor-register-same-tab.mjs', s, 'utf8');
console.log('patched same-tab');
