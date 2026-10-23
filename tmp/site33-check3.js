const fs = require('fs');
const { execSync } = require('child_process');

// jargon in welcome copy
const copy = fs.readFileSync('preview/shared/auth-welcome-copy.js','utf8');
for (const k of ['Basic','BASIC','study_room #','region#','role_type','학부모','#id','kind#']) {
  console.log('jargon '+k+':', copy.includes(k) ? 'FOUND' : 'absent');
}

// modal phrase
console.log('\n=== 동네에 인사할까요 occurrences ===');
const files = execSync('git grep -l "동네에 인사할까요" -- preview || true', { encoding: 'utf8', shell: 'cmd.exe' });
