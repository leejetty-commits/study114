/**
 * CUR-006 Resend — 정적·계약 검증 (실메일 없음)
 * PHP mock: php scripts/verify-cur-006-resend.php
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

const requiredFiles = [
  'src/Mail/MailTransport.php',
  'src/Mail/MailSendResult.php',
  'src/Mail/ResendMailTransport.php',
  'src/Mail/MailTransportFactory.php',
  'src/Mail/FakeMailTransport.php',
  'src/Mail/DisabledMailTransport.php',
  'src/Mail/MailAddressMasker.php',
  'src/Mail/MailMessageSanitizer.php',
  'src/Auth/AuthMailer.php',
  'public/api/auth/password/_mail-probe.php',
  'scripts/verify-cur-006-resend.php',
  '.github/workflows/cur-006-resend.yml',
];
for (const f of requiredFiles) {
  assert(existsSync(resolve(root, f)), `파일 존재 ${f}`);
}

assert(!existsSync(resolve(root, 'src/Mail/SmtpMailTransport.php')), 'SmtpMailTransport 삭제');
assert(!existsSync(resolve(root, 'src/Mail/SmtpProtocolException.php')), 'SmtpProtocolException 삭제');

const authMailer = read('src/Auth/AuthMailer.php');
const authMailerCode = authMailer
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');
assert(!/\bmail\s*\(/.test(authMailerCode), 'AuthMailer에 mail() 직접 호출 없음');
assert(authMailer.includes('MailTransportFactory') || authMailer.includes('MailTransport'), 'AuthMailer가 transport 사용');
assert(authMailer.includes('from_rejected'), 'From @study114.net 강제');
assert(authMailer.includes('MailAddressMasker'), '수신 마스킹');
assert(authMailer.includes('우동공과'), '발신자 표시명 우동공과');

const factory = read('src/Mail/MailTransportFactory.php');
assert(factory.includes('mail_fallback_forbidden'), 'mail() fallback 금지');
assert(factory.includes('api_key_missing'), 'API Key 누락 fail-closed');
assert(factory.includes('FakeMailTransport'), 'fake transport');
assert(factory.includes('ResendMailTransport'), 'Resend transport');
assert(factory.includes('smtp_removed'), 'smtp 모드 거부');
assert(factory.includes('STUDY114_RESEND_API_KEY'), 'Factory env STUDY114_RESEND_API_KEY');
assert(!factory.includes('SmtpMailTransport'), 'Factory에 Smtp 없음');

const resend = read('src/Mail/ResendMailTransport.php');
assert(resend.includes('https://api.resend.com/emails'), 'Resend endpoint');
assert(resend.includes('curl_init'), 'cURL');
assert(!resend.includes('stream_socket'), 'stream_socket 제거');
assert(resend.includes('header_injection'), '헤더 인젝션 차단');
assert(resend.includes('auth_failed'), '인증 실패 코드');
assert(resend.includes('timeout'), 'timeout 코드');
assert(resend.includes('resend_error'), 'resend_error 코드');
assert(resend.includes('api_key_missing'), 'api_key_missing 코드');

const probe = read('public/api/auth/password/_mail-probe.php');
assert(probe.includes('$sent') || probe.includes("'$sent'"), 'probe ok=전송 결과');
assert(probe.includes('lastResult'), 'probe lastResult');
assert(probe.includes('MailAddressMasker'), 'probe 마스킹');

const authCfg = read('config/auth.php');
assert(authCfg.includes('STUDY114_RESEND_API_KEY'), 'auth.php Resend key');
assert(authCfg.includes("'resend'"), 'auth.php default resend');
assert(!authCfg.includes('STUDY114_SMTP_HOST'), 'auth.php SMTP 제거');

const ht = read('public/.htaccess');
assert(ht.includes('STUDY114_RESEND_API_KEY __STUDY114_RESEND_API_KEY__'), 'htaccess Resend placeholder');
assert(ht.includes('no-reply@study114.net'), 'htaccess From no-reply@study114.net');
assert(!ht.includes('smtp.cafe24.com'), 'htaccess 카페24 제거');
assert(!ht.includes('STUDY114_SMTP_'), 'htaccess SMTP SetEnv 제거');
assert(!ht.includes('study114@study114.dothome.co.kr'), 'htaccess dothome From 제거');

const deploy = read('.github/workflows/deploy.yml');
assert(deploy.includes('STUDY114_RESEND_API_KEY'), 'deploy Resend Secret');
assert(!deploy.includes('STUDY114_SMTP_USERNAME'), 'deploy SMTP username 제거');
assert(!deploy.includes('STUDY114_SMTP_PASSWORD'), 'deploy SMTP password 제거');

const reminder = read('src/Paid/ProviderReminderService.php');
assert(reminder.includes('reminder_mail_excluded'), 'ProviderReminder 메일 제외');

const phpTest = read('scripts/verify-cur-006-resend.php');
for (const needle of [
  'AuthMailer→Fake 성공',
  '인증 실패',
  'timeout',
  'api_key_missing',
  'mail_fallback_forbidden',
  'from_rejected',
  '이메일 마스킹',
  'header_injection',
  'Resend mock',
  'reminder_mail_excluded',
]) {
  assert(phpTest.includes(needle), `PHP mock 시나리오: ${needle}`);
}

assert(existsSync(resolve(root, 'preview/auth-ui/src/email-verify-send-status.js')), 'UI 커밋 통합(email_sent 헬퍼)');

const secretScanFiles = [
  'src/Mail/ResendMailTransport.php',
  'src/Mail/MailTransportFactory.php',
  'src/Auth/AuthMailer.php',
  'config/auth.php',
  'public/.htaccess',
  'scripts/verify-cur-006-resend.php',
  'scripts/verify-cur-006-resend.mjs',
];
for (const rel of secretScanFiles) {
  const text = read(rel);
  const hits = text.match(/\bre_[A-Za-z0-9]{20,}\b/g) || [];
  const bad = hits.filter((h) => !h.startsWith('re_test_'));
  assert(bad.length === 0, `실 Resend 키 형태 없음 ${rel}`);
}

if (failed > 0) {
  console.error(`\nCUR-006 Resend static verify FAILED (${failed})`);
  process.exit(1);
}
console.log('\nCUR-006 Resend static verify OK');
console.log('PHP mock: php scripts/verify-cur-006-resend.php');
