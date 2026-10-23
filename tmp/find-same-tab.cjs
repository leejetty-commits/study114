const fs = require('fs');
const s = fs.readFileSync('scripts/verify-tutor-register-same-tab.mjs', 'utf8');
const idx = s.indexOf("role === 'tutor'");
console.log('idx', idx);
console.log(JSON.stringify(s.slice(idx - 80, idx + 220)));
const m = s.match(/assert\(\s*\/if[\s\S]*?then return',\s*\);/);
console.log('match', m && JSON.stringify(m[0]));
