const fs = require('fs');
const screens = fs.readFileSync('preview/home-ui/src/study-room-reg/screens.js','utf8');
let i = 0;
while ((i = screens.indexOf('buildRegistrationCheckModel', i)) !== -1) {
  console.log('---', i);
  console.log(screens.slice(Math.max(0,i-120), i+220));
  i += 1;
}
console.log('=== getPublish in screens ===');
for (const line of screens.split(/\n/)) if (/[Pp]ublish|[Rr]eadiness/.test(line)) console.log(line);
console.log('=== store checklist items ===');
const store = fs.readFileSync('preview/home-ui/src/study-room-reg/store.js','utf8');
const idx = store.indexOf('function getPublishChecklistItems');
console.log(store.slice(idx, idx+900));
console.log('=== model badges array ===');
const model = fs.readFileSync('preview/home-ui/src/study-room-reg/registration-check-model.js','utf8');
const h = model.indexOf('badges: [');
console.log(model.slice(h, h+500));
