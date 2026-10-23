const fs = require('fs');
const listings = fs.readFileSync('preview/home-ui/src/styles/home-listings.css','utf8');
const tokens = fs.readFileSync('preview/home-ui/src/styles/tokens.css','utf8');
console.log('=== tokens prime ===');
for (const line of tokens.split(/\n/)) if (/prime|expo-prime/.test(line)) console.log(line);
console.log('=== listings prime media related ===');
const lines = listings.split(/\n/);
for (let i=0;i<lines.length;i++) {
  if (/prime|cqw|aspect-ratio|media-height|expo-prime/.test(lines[i])) {
    console.log(String(i+1).padStart(5), lines[i]);
  }
}
console.log('=== store contact ===');
const store = fs.readFileSync('preview/home-ui/src/study-room-reg/store.js','utf8');
for (const line of store.split(/\n/)) if (/contact|getPublish|name.*공부방/.test(line)) console.log(line);
console.log('=== model id basic contexts ===');
const model = fs.readFileSync('preview/home-ui/src/study-room-reg/registration-check-model.js','utf8');
const re = /id: 'basic'[\s\S]{0,80}/g;
let m; while ((m = re.exec(model))) console.log(JSON.stringify(m[0]));
console.log('=== screens buildRegistrationCheckModel call ===');
const screens = fs.readFileSync('preview/home-ui/src/study-room-reg/screens.js','utf8');
const idx = screens.indexOf('buildRegistrationCheckModel');
console.log(screens.slice(idx, idx+200));
