/**
 * CUR-006 authenticated SMTP — 정적·계약 검증 (실메일 없음)
 * PHP mock은 `php scripts/verify-cur-006-authenticated-smtp.php` (PHP 있을 때)
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

const files = [
  'src/Mail/MailTransport.php',
  'src/Mail/MailSendResult.php',
  'src/Mail/SmtpMailTransport.php',
  'src/Mail/MailTransportFactory.php',
  'src/Mail/FakeMailTransport.php',
  'src/Mail/DisabledMailTransport.php',
  'src/Mail/MailAddressMasker.php',
  'src/Auth/AuthMailer.php',
  'public/api/auth/password/_mail-probe.php',
  'scripts/verify-cur-006-authenticated-smtp.php',
  'docs/internal/cur-006-smtp-dns-apply-table.md',
];
for (const f of files) {
  assert(existsSync(resolve(root, f)), `파일 존재 ${f}`);
}

const authMailer = read('src/Auth/AuthMailer.php');
const authMailerCode = authMailer
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');
assert(!/\bmail\s*\(/.test(authMailerCode), 'AuthMailer에 mail() 직접 호출 없음');
assert(authMailer.includes('MailTransportFactory') || authMailer.includes('MailTransport'), 'AuthMailer가 transport 사용');
assert(authMailer.includes('from_rejected'), 'From @study114.net 강제');
assert(authMailer.includes('MailAddressMasker'), '수신 마스킹');

const factory = read('src/Mail/MailTransportFactory.php');
assert(factory.includes('mail_fallback_forbidden'), 'mail() fallback 금지');
assert(factory.includes('config_missing'), '설정 누락 fail-closed');
assert(factory.includes('FakeMailTransport'), 'fake transport');

const smtp = read('src/Mail/SmtpMailTransport.php');
assert(smtp.includes('AUTH LOGIN'), 'SMTP AUTH LOGIN');
assert(smtp.includes('STARTTLS') || smtp.includes('ssl://'), 'TLS/SSL 지원');
assert(smtp.includes('auth_failed'), '인증 실패 코드');
assert(smtp.includes('connect_failed'), '연결 실패 코드');
assert(smtp.includes('timeout'), 'timeout 코드');

const probe = read('public/api/auth/password/_mail-probe.php');
assert(probe.includes("'$sent'") || probe.includes('$sent'), 'probe ok=전송 결과');
assert(probe.includes('lastResult'), 'probe lastResult');
assert(probe.includes('MailAddressMasker'), 'probe 마스킹');
assert(!probe.includes('mail() 호출 완료'), 'probe 무관 ok:true 문구 제거');

const authCfg = read('config/auth.php');
assert(authCfg.includes('STUDY114_SMTP_HOST'), 'auth.php SMTP host');
assert(authCfg.includes('STUDY114_MAIL_TRANSPORT'), 'auth.php transport');

const ht = read('public/.htaccess');
assert(ht.includes('STUDY114_SMTP_PASSWORD __STUDY114_SMTP_PASSWORD__'), 'htaccess SMTP password placeholder');
assert(ht.includes('noreply@study114.net'), 'htaccess From @study114.net');
assert(!ht.includes('study114@study114.dothome.co.kr'), 'htaccess dothome From 제거');

const phpTest = read('scripts/verify-cur-006-authenticated-smtp.php');
for (const needle of [
  'SMTP 성공',
  '인증 실패',
  '연결 실패',
  'timeout',
  '설정 누락',
  'mail_fallback_forbidden',
  'from_rejected',
  '이메일 마스킹',
]) {
  assert(phpTest.includes(needle), `PHP mock 시나리오: ${needle}`);
}

// mail() 잔여: Smtp/AuthMailer/Factory/Disabled/Fake 외 비즈니스 경로
const mailerOnly = read('src/Auth/AuthMailer.php')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');
assert(!/\bmail\s*\(/.test(mailerOnly), '비즈니스 AuthMailer mail() 0건');

const dns = read('docs/internal/cur-006-smtp-dns-apply-table.md');
assert(dns.includes('SPF'), 'DNS 표 SPF');
assert(dns.includes('DKIM'), 'DNS 표 DKIM');
assert(dns.includes('DMARC'), 'DNS 표 DMARC');
assert(dns.includes('병합'), 'DNS SPF 병합 안내');

// UI cherry-pick 존재
assert(existsSync(resolve(root, 'preview/auth-ui/src/email-verify-send-status.js')), 'UI 커밋 통합(email_sent 헬퍼)');

if (failed > 0) {
  console.error(`\nCUR-006 SMTP static verify failed: ${failed}`);
  process.exit(1);
}
console.log('\nCUR-006 SMTP static verify OK');
console.log('PHP mock: php scripts/verify-cur-006-authenticated-smtp.php');
