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
  'src/Mail/FakeMailOutbox.php',
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
assert(authMailer.includes('KIND='), '운영 로그 KIND 메타');
assert(!authMailer.includes('--- plain ---'), 'AuthMailer plain 본문 로그 제거');
assert(!authMailer.includes('--- html ---'), 'AuthMailer html 본문 로그 제거');
assert(!/file_put_contents\([^)]*\$body/.test(authMailer), 'AuthMailer가 body를 로그에 쓰지 않음');

const outbox = read('src/Mail/FakeMailOutbox.php');
assert(outbox.includes("=== 'fake'"), 'FakeMailOutbox는 fake transport만');
assert(outbox.includes("=== 'production'"), 'FakeMailOutbox production 강제 차단');
assert(outbox.includes('STUDY114_APP_ENV'), 'FakeMailOutbox APP_ENV 검사');
assert(outbox.includes('mail-fake-outbox.jsonl'), 'FakeMailOutbox 기본 경로');

const disabled = read('src/Mail/DisabledMailTransport.php');
assert(!disabled.includes('SMTP configuration'), 'DisabledMailTransport SMTP 문구 제거');
assert(disabled.includes('Mail transport'), 'DisabledMailTransport 일반 문구');

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
assert(probe.includes('Resend'), 'probe Resend 문구');
assert(probe.includes('resend_accepted'), 'probe resend_accepted');
assert(!probe.includes('smtp_accepted'), 'probe smtp_accepted 제거');
assert(!probe.includes('SMTP 발송'), 'probe SMTP 문구 제거');
assert(probe.includes('method_not_allowed'), 'probe GET 405');
assert(probe.includes('HTTP_X_STUDY114_MAIL_PROBE_KEY'), 'probe header key');
assert(probe.includes('php://input'), 'probe JSON body');
assert(!probe.includes("$_GET['key']") && !probe.includes('$_GET["key"]'), 'probe URL key 제거');
assert(!probe.includes("$_GET['to']") && !probe.includes('$_GET["to"]'), 'probe URL to 제거');
assert(!probe.includes('?key='), 'probe URL key 예시 제거');
assert(probe.includes("'code' => 'forbidden'") || probe.includes('"forbidden"'), 'probe 잘못된 key 403');

const deployDoc = read('docs/internal/cur-006-config-deploy-gate.md');
assert(deployDoc.includes('운영 배포 필수'), 'deploy gate 문서 Resend 필수');
assert(!deployDoc.includes('선택 주입'), 'deploy gate 문서 선택 주입 제거');
assert(!deployDoc.includes('placeholder 유지'), 'deploy gate 문서 placeholder 유지 제거');

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
assert(
  /required=.*STUDY114_RESEND_API_KEY/.test(deploy),
  'deploy Resend Secret 필수(required)'
);
assert(deploy.includes('placeholder 형식'), 'deploy placeholder 거부');
assert(!deploy.includes('Resend API Key는 선택'), 'deploy Resend 선택 주입 제거');
assert(!deploy.includes('STUDY114_SMTP_USERNAME'), 'deploy SMTP username 제거');
assert(!deploy.includes('STUDY114_SMTP_PASSWORD'), 'deploy SMTP password 제거');

const envEx = read('config/dothome.env.example');
assert(envEx.includes('STUDY114_MAIL_TRANSPORT=resend'), 'dothome.env resend');
assert(envEx.includes('STUDY114_RESEND_API_KEY='), 'dothome.env Resend key');
assert(!envEx.includes('STUDY114_SMTP_'), 'dothome.env SMTP 제거');

const wf = read('.github/workflows/cur-006-resend.yml');
assert(wf.includes('verify:cur-006-email-sent-ui'), 'CI email-sent-ui');
assert(wf.includes('verify:cur-006-email-verify-inventory'), 'CI inventory');
assert(wf.includes('preview/auth-ui/**'), 'CI path preview/auth-ui');
assert(wf.includes('public/.htaccess'), 'CI path htaccess');
assert(wf.includes('deploy.yml'), 'CI path deploy.yml');
assert(wf.includes('public/api/auth/email/**'), 'CI path email API');

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
  'fake outbox에만 token',
  'production+fake → FakeMailOutbox::isEnabled=false',
  'resend 모드 mail.log에 reset token 없음',
  'deploy Resend Secret 필수',
  'probe GET→405 method_not_allowed',
  'probe header X-Study114-Mail-Probe-Key',
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
