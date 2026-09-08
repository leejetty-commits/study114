/**
 * CUR-006 — email_sent UI 분기·재전송 상태 분류 검증 (로컬, 메일 발송 없음)
 */
import {
  classifyEmailVerifySendResult,
  emailVerifySendStatusMessage,
  isSignupEmailSendFailedFlag,
  verifyEmailPathForSignupResult,
} from '../preview/auth-ui/src/email-verify-send-status.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else {
    console.log('PASS:', msg);
  }
}

// 1) ok=false 경로: 가입 실패는 signup-role이 email_sent 전에 처리 — 헬퍼 경로 확인
assert(
  classifyEmailVerifySendResult({ ok: false }, { httpOk: false }) === 'fail',
  '가입/재전송 HTTP 실패 → fail',
);

// 2) ok=true + email_sent=true → 대기 화면 경로
assert(verifyEmailPathForSignupResult(true) === '/signup/verify-email?send=1', 'email_sent=true 경로');
assert(!isSignupEmailSendFailedFlag('1'), 'send=1은 발송 실패 UI 아님');

// 3) ok=true + email_sent=false → 발송 실패 화면 경로
assert(verifyEmailPathForSignupResult(false) === '/signup/verify-email?send=0', 'email_sent=false 경로');
assert(isSignupEmailSendFailedFlag('0'), 'send=0은 발송 실패 UI');

// 4) 재전송 성공
assert(classifyEmailVerifySendResult({ ok: true, sent: true, resend_available_in: 600 }) === 'success', '재전송 성공');
assert(
  emailVerifySendStatusMessage('success').includes('다시 보냈습니다'),
  '재전송 성공 문구',
);

// 5) 쿨다운
assert(
  classifyEmailVerifySendResult({ ok: true, sent: false, resend_available_in: 120 }) === 'cooldown',
  '재전송 쿨다운',
);
assert(
  emailVerifySendStatusMessage('cooldown', 0).includes('최근에') &&
    emailVerifySendStatusMessage('cooldown', 0).includes('잠시 후'),
  '쿨다운 남은시간 없을 때 임의 숫자 없이 표시',
);
{
  const msg = emailVerifySendStatusMessage('cooldown', 0);
  assert(!msg.includes('10분') && !msg.includes('600'), '쿨다운 임의 숫자 미생성');
  assert(msg.includes('잠시 후 다시 시도'), '쿨다운 기본 문구');
}

// 6) 실제 발송 실패
assert(
  classifyEmailVerifySendResult({ ok: true, sent: false, resend_available_in: 0 }) === 'fail',
  '재전송 실제 실패',
);
assert(emailVerifySendStatusMessage('fail').includes('보내지 못했습니다'), '실패 문구');
assert(!emailVerifySendStatusMessage('fail').includes('보냈습니다'), '실패≠성공 문구');

// 소스 연결 확인
const root = resolve(process.cwd());
const roleSrc = readFileSync(resolve(root, 'preview/auth-ui/src/screens/signup-role.js'), 'utf8');
const verifySrc = readFileSync(resolve(root, 'preview/auth-ui/src/screens/signup-verify-email.js'), 'utf8');
assert(roleSrc.includes('email_sent'), 'signup-role.js가 email_sent를 읽음');
assert(roleSrc.includes('verifyEmailPathForSignupResult'), 'signup-role.js가 경로 헬퍼 사용');
assert(verifySrc.includes('classifyEmailVerifySendResult'), 'verify-email이 재전송 분류 사용');
assert(verifySrc.includes('계정은 만들어졌지만 확인 메일을 보내지 못했습니다'), '발송 실패 제목 존재');
assert(verifySrc.includes('확인 메일을 보냈습니다'), '발송 성공 대기 문구 존재');
assert(!verifySrc.includes('SMTP') && !verifySrc.includes('SPF'), '내부 원인 문구 없음');

const apiSrc = readFileSync(resolve(root, 'public/api/auth/email/send-verification.php'), 'utf8');
assert(apiSrc.includes('보내지 못했습니다'), 'send-verification 실패 메시지 구분');
assert(apiSrc.includes('최근에 확인 메일을 보냈습니다'), 'send-verification 쿨다운 메시지 구분');

// 제외 범위 미변경(핵심 파일 문자열 스모크)
const mailer = readFileSync(resolve(root, 'src/Auth/AuthMailer.php'), 'utf8');
assert(mailer.includes('function send('), 'AuthMailer 유지(스모크)');

if (failed > 0) {
  console.error(`\nCUR-006 verify failed: ${failed}`);
  process.exit(1);
}
console.log('\nCUR-006 verify OK');
