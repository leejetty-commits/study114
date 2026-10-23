const { execSync } = require('child_process');
const fs = require('fs');

console.log('=== signup-complete diff for region# / profile ===');
const d = execSync('git diff -- preview/auth-ui/src/screens/signup-complete.js', { encoding: 'utf8' });
const interesting = d.split(/\n/).filter(l => /region#|profileStudyRoom|profileTutor|AUTH_WELCOME|title|studentLead|providerLead|Basic|공부방|과외|가입이/.test(l));
console.log(interesting.join('\n'));

console.log('\n=== --font-serif in tokens ===');
const tok = fs.readFileSync('preview/home-ui/src/styles/tokens.css','utf8');
tok.split(/\n/).forEach((l,i)=>{ if(/font-serif|font-sans|Pretendard|별칭|serif/.test(l)) console.log((i+1)+': '+l.trim()); });

console.log('\n=== AuthMailer / mail template git status ===');
console.log(execSync('git status --short -- src/Auth/AuthMailer.php src/Auth/PasswordResetMailTemplate.php src/Mail/', { encoding: 'utf8' }) || '(clean)');

console.log('\n=== compare 199 vs copy key strings ===');
const copy = fs.readFileSync('preview/shared/auth-welcome-copy.js','utf8');
const must = [
  '우리 동네 공부방과 과외쌤을 이어서 만나 보세요.',
  '학생·공부방·과외쌤으로 시작할 수 있어요.',
  '로그인하면 방금 보던 화면으로 돌아가요.',
  '저장해 둔 탐색과 최근 본 후보를 이어서 볼 수 있어요.',
  '로그인을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.',
  '이메일 또는 비밀번호를 확인해 주세요.',
  '다시 만나서 반가워요.',
  '서비스를 쓰려면 약관에 동의해 주세요.',
  '어떤 회원으로 시작할까요?',
  '하나만 골라 주세요. 계정을 만들고 이메일을 확인하면 기본정보로 이어져요.',
  '공통으로 필요한 정보만 받아요. 학교·과목·희망 조건은 여기서 받지 않아요.',
  '가입이 끝났어요',
  '적어 주신 내용은 학생 카드에 바로 반영돼요.',
  '계정과 기본등록이 끝났어요. 아직은 검색에 안 보여요. 상세등록을 채우면 이웃에게 열려요.',
  '로그인하면 후기·위치·비교·찜·문의를 더 볼 수 있어요.',
  '이메일을 확인했어요',
  '이메일이 확인됐어요',
];
for (const s of must) console.log((copy.includes(s)?'PASS':'MISS')+' | '+s);

console.log('\n=== HEAD ===');
console.log(execSync('git rev-parse HEAD',{encoding:'utf8'}).trim());
console.log(execSync('git log -1 --oneline',{encoding:'utf8'}).trim());
console.log('branch:', execSync('git branch --show-current',{encoding:'utf8'}).trim());
console.log('uncommitted welcome/font related:');
console.log(execSync('git status --short -- preview/shared/auth-welcome-copy.js preview/shared/login-welcome.js preview/shared/fonts docs/ssot/09-appendix-login-and-auth-policy.md preview/auth-ui preview/home-ui/src/styles/tokens.css preview/home-ui/index.html preview/search-ui/index.html preview/study-room-ui/index.html preview/tutor-ui/index.html public/api/auth/oauth/callback.php',{encoding:'utf8'}));
