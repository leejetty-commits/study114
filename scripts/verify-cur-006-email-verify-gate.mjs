/**
 * CUR-006 · 미확인 계정 이메일 검증 게이트 정적 점검 (실계정·실메일 없음)
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else {
    console.log('PASS:', msg);
  }
}

function read(rel) {
  return readFileSync(resolve(root, rel), 'utf8');
}

assert(existsSync(resolve(root, 'src/Auth/EmailVerificationGate.php')), 'EmailVerificationGate');
assert(existsSync(resolve(root, 'src/Auth/SignupService.php')), 'SignupService');

const signup = read('src/Auth/SignupService.php');
assert(/INSERT\s+INTO\s+users/i.test(signup), 'SignupService INSERT');
assert(!/INSERT\s+INTO\s+users[\s\S]{0,400}email_verified_at/i.test(signup), '가입 시 email_verified_at 미설정(NULL)');

const verifySvc = read('src/Auth/EmailVerificationService.php');
assert(verifySvc.includes('email_verified_at = COALESCE'), '확인 링크에서만 email_verified_at 기록');

const login = read('public/api/auth/login.php');
assert(login.includes('email_verified'), 'login 응답 email_verified');
assert(login.includes('email_verify_required'), 'login 응답 email_verify_required');
assert(login.includes('AuthSession::login'), '미확인도 세션 허용(SSOT C-2)');

const me = read('public/api/auth/me.php');
assert(me.includes('email_verified'), 'me.php email_verified');

const gatePaths = [
  ['public/api/auth/basic-register.php', 'assertVerified'],
  ['src/Messages/MessagesApi.php', 'assertVerified'],
  ['src/Board/BoardApi.php', 'requireAuth'],
  ['public/api/board/posts.php', 'requireAuth'],
  ['public/api/board/submission-attachments.php', 'requireAuth'],
  ['public/api/board/attachments/token.php', 'requireAuth'],
  ['public/api/study-room/promo-image.php', 'assertVerified'],
  ['public/api/auth/oauth/complete-role.php', 'assertVerified'],
];
for (const [rel, needle] of gatePaths) {
  assert(read(rel).includes(needle), `게이트 ${rel} :: ${needle}`);
}

assert(existsSync(resolve(root, 'docs/internal/cur-006-email-verify-open-apis.md')), 'OPEN 7 API 문서');
const flow = read('scripts/verify-cur-006-email-verify-flow.php');
assert(flow.includes("messages HTTP 200"), 'flow 긍정: messages 200');
assert(flow.includes("error'] ?? '') === 'validation'"), 'flow 긍정: basic-register validation');
assert(flow.includes("error'] ?? '') === 'forbidden'"), 'flow 긍정: board forbidden');
assert(flow.includes('registrations/students'), 'flow 긍정: registrations');

const boardApi = read('src/Board/BoardApi.php');
assert(boardApi.includes('email_verify_required'), 'BoardApi 403 email_verify_required');
assert(boardApi.includes('optionalVerifiedAuth'), 'Board GET 미확인=게스트');

const loginUi = read('preview/auth-ui/src/screens/login.js');
assert(loginUi.includes('email_verified') || loginUi.includes('fetchMeApi'), '로그인 FE 미확인 → me/대기');
assert(
  loginUi.includes('ensurePostVerifyTargetForUnverifiedLogin'),
  '미확인 로그인 시 postVerifyTarget 보존 헬퍼',
);
assert(!/setPostVerifyTarget\(\s*['"]home['"]\s*\)/.test(loginUi), '로그인에서 postVerifyTarget=home 강제 덮어쓰기 없음');

const redirect = read('preview/shared/auth-redirect.js');
assert(redirect.includes('emailVerifyWaitUrl') || redirect.includes('email_verified'), '리다이렉트 대기 화면');
assert(redirect.includes('ensurePostVerifyTargetForUnverifiedLogin'), 'auth-redirect 미확인 로그인 보존');
assert(redirect.includes('uiRoleFromRoleType'), 'auth-redirect role_type→UI 역할');
assert(redirect.includes('study114_post_verify_role'), 'auth-redirect 역할 세션 보존');
assert(redirect.includes("'home'") || redirect.includes('"home"'), 'auth-redirect home 보존 대상');
assert(redirect.includes('basicRegisterPathForMe'), 'auth-redirect 서버 역할 기본등록 path');

const verifyEmail = read('preview/auth-ui/src/screens/signup-verify-email.js');
assert(verifyEmail.includes("target === 'basic'"), '확인 후 basic 목표');
assert(verifyEmail.includes('basicRegisterPathForMe'), '확인 후 서버 역할 기본등록');
assert(verifyEmail.includes('uiRoleFromRoleType'), '확인 후 me.role_type');

const signupRole = read('preview/auth-ui/src/screens/signup-role.js');
assert(/setPostVerifyTarget\(\s*['"]basic['"]\s*,\s*selected\s*\)/.test(signupRole), '가입 시 basic+역할 저장');

const bypass = read('src/Auth/EmailVerificationGate.php');
assert(bypass.includes('email_verified_at'), '게이트 기준 email_verified_at');
const bypassCode = bypass.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
assert(!/leejetty|nate\.com|\$allowlist|in_array\s*\(\s*\$email/i.test(bypassCode), '게이트 코드에 이메일 우회 없음');

if (failed > 0) {
  console.error(`\nCUR-006 email-verify gate FAILED (${failed})`);
  process.exit(1);
}
console.log('\nCUR-006 email-verify gate OK');
