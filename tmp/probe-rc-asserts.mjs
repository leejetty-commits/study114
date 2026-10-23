const fs = require('fs');
function has(file, s) {
  const t = fs.readFileSync(file, 'utf8');
  return t.includes(s);
}
const screens = 'preview/home-ui/src/study-room-reg/screens.js';
const model = 'preview/home-ui/src/study-room-reg/registration-check-model.js';
const copy = 'preview/home-ui/src/study-room-reg/registration-check-copy.js';
const render = 'preview/home-ui/src/study-room-reg/registration-check-render.js';
const edit = 'preview/home-ui/src/study-room-reg/registration-check-edit.js';
const css = 'preview/home-ui/src/styles/registration-check.css';
const listings = 'preview/home-ui/src/styles/home-listings.css';
const store = 'preview/home-ui/src/study-room-reg/store.js';
const checks = [
  [screens, 'getPublishReadiness(room)'],
  [screens, 'getPublishReadiness'],
  [screens, 'buildRegistrationCheckModel(registerState, room,'],
  [model, "id: 'publish'"],
  [model, "id: 'basic'"],
  [model, "id: 'pick'"],
  [model, "id: 'prime'"],
  [model, 'function nextAction('],
  [copy, "publishOk: '공개 가능'"],
  [copy, "pickMissingTitle: '[픽] 추가 입력'"],
  [copy, "pickMissingTitle: '[픽] 추가 입력"],
  [copy, '자기확인 후 공개하기'],
  [copy, '공개 전 자기확인'],
  [copy, 'next.done'],
  [copy, "done: '현황만 확인하면 됩니다'"],
  [copy, 'basicNeed'],
  [render, 'rc-publish'],
  [render, 'data-p20-publish'],
  [render, 'data-p20-confirm'],
  [render, 'renderPublishActions'],
  [edit, 'data-p20-publish'],
  [edit, 'data-p20-confirm'],
  [edit, 'publishStudyRoom'],
  [css, '[data-rc-page] .rc-publish'],
  [css, '[data-rc-page] .rc-next'],
  [listings, 'var(--expo-prime-media-height-scale'],
  [listings, '100cqw * 9 / 16'],
  [listings, 'container-name: expo-prime-media'],
  [store, 'export function getPublishChecklistItems'],
  [store, 'export function getPublishReadiness'],
  [store, "id: 'name', label: '공부방명'"],
  [store, "id: 'contact', label: '문의·쪽지 방식'"],
];
for (const [f,s] of checks) console.log((has(f,s)?'Y':'N'), s, '::', f.split('/').pop());
const c = fs.readFileSync(copy,'utf8');
const m = c.match(/badges:\s*\{[\s\S]*?\n\s*\},/);
console.log('BADGES', m && m[0]);
const listingsT = fs.readFileSync(listings,'utf8');
const idx = listingsT.indexOf('prime');
console.log('listings prime snippets:');
for (const re of [/expo-prime-media[^\n]{0,120}/g, /100cqw[^\n]{0,80}/g, /height-scale[^\n]{0,80}/g, /container-name:[^\n]{0,60}/g]) {
  const hits = listingsT.match(re);
  if (hits) console.log(hits.slice(0,5));
}
