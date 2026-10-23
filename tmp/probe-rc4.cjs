const fs = require('fs');
const store = fs.readFileSync('preview/home-ui/src/study-room-reg/store.js','utf8');
const idx = store.indexOf('PUBLISH_CHECKLIST_DEFS');
console.log(store.slice(idx, idx+600));
