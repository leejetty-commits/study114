<?php

declare(strict_types=1);

/**
 * CUR-006 authenticated SMTP — PHP 8.2 mock 검증 (실메일·운영 probe 없음)
 *
 * 실행: php scripts/verify-cur-006-authenticated-smtp.php
 */

$root = dirname(__DIR__);

putenv('STUDY114_MAIL_FROM=noreply@study114.net');
putenv('STUDY114_MAIL_TRANSPORT=fake');
putenv('STUDY114_MAIL_FAKE_MODE=success');
$_ENV['STUDY114_MAIL_FROM'] = 'noreply@study114.net';
$_ENV['STUDY114_MAIL_TRANSPORT'] = 'fake';
$_SERVER['STUDY114_MAIL_FROM'] = 'noreply@study114.net';
$_SERVER['STUDY114_MAIL_TRANSPORT'] = 'fake';

require_once $root . '/src/bootstrap.php';

use Study114\Auth\AuthMailer;
use Study114\Mail\DisabledMailTransport;
use Study114\Mail\FakeMailTransport;
use Study114\Mail\MailAddressMasker;
use Study114\Mail\MailTransportFactory;
use Study114\Mail\SmtpMailTransport;
use Study114\Mail\SmtpMessageSanitizer;

$failed = 0;
$passed = 0;

function assert_true(bool $cond, string $msg): void
{
    global $failed, $passed;
    if ($cond) {
        echo "PASS: {$msg}\n";
        $passed++;
    } else {
        echo "FAIL: {$msg}\n";
        $failed++;
        // CI 로그에서 바로 원인 확인용
        fwrite(STDERR, "ASSERT_FAIL {$msg}\n");
    }
}

echo 'PHP_VERSION=' . PHP_VERSION . PHP_EOL;
assert_true(PHP_VERSION_ID >= 80200 && PHP_VERSION_ID < 80300, 'PHP 8.2.x runtime');

$logPath = $root . '/storage/logs/mail-cur006-test.log';
@unlink($logPath);

function authConfig(array $over = []): array
{
    global $logPath;

    return array_merge([
        'mail_from' => 'noreply@study114.net',
        'mail_transport' => 'smtp',
        'mail_fake_mode' => 'success',
        'smtp_host' => '',
        'smtp_port' => 587,
        'smtp_encryption' => 'tls',
        'smtp_username' => '',
        'smtp_password' => '',
        'smtp_timeout' => 5,
        'mail_log_path' => $logPath,
    ], $over);
}

$mailer = new AuthMailer(new FakeMailTransport('success'));
assert_true($mailer->send('user@example.com', '제목', '본문') === true, 'AuthMailer→Fake 성공');
assert_true($mailer->lastResult()?->ok === true, 'lastResult ok');

$mailer = new AuthMailer(new FakeMailTransport('auth_failed'));
assert_true($mailer->send('user@example.com', 't', 'body') === false, '인증 실패 → false');
assert_true($mailer->lastResult()?->code === 'auth_failed', 'auth_failed code');

$mailer = new AuthMailer(new FakeMailTransport('connect_failed'));
assert_true($mailer->send('user@example.com', 't', 'body') === false, '연결 실패 → false');

$mailer = new AuthMailer(new FakeMailTransport('timeout'));
assert_true($mailer->send('user@example.com', 't', 'body') === false, 'timeout → false');
assert_true($mailer->lastResult()?->code === 'timeout', 'timeout code');

$t = MailTransportFactory::create(authConfig(['smtp_host' => '', 'smtp_username' => '']));
assert_true($t instanceof DisabledMailTransport, '설정 누락 → DisabledMailTransport');
assert_true(
    $t->send([
        'to' => 'a@b.c',
        'subject' => 's',
        'body' => 'b',
        'from_email' => 'noreply@study114.net',
        'from_header' => 'x <noreply@study114.net>',
    ])->ok === false,
    '설정 누락 send false'
);

$t = MailTransportFactory::create(authConfig(['mail_transport' => 'php_mail']));
assert_true($t instanceof DisabledMailTransport, 'php_mail → fail-closed');
assert_true(
    $t->send([
        'to' => 'a@b.c',
        'subject' => 's',
        'body' => 'b',
        'from_email' => 'noreply@study114.net',
        'from_header' => 'x <noreply@study114.net>',
    ])->code === 'mail_fallback_forbidden',
    'mail_fallback_forbidden'
);

putenv('STUDY114_MAIL_FROM=study114@study114.dothome.co.kr');
$_ENV['STUDY114_MAIL_FROM'] = 'study114@study114.dothome.co.kr';
$_SERVER['STUDY114_MAIL_FROM'] = 'study114@study114.dothome.co.kr';
$mailerBadFrom = new AuthMailer(new FakeMailTransport('success'));
assert_true($mailerBadFrom->send('user@example.com', 't', 'body') === false, 'dothome From 거부');
assert_true($mailerBadFrom->lastResult()?->code === 'from_rejected', 'from_rejected code');

putenv('STUDY114_MAIL_FROM=noreply@study114.net');
$_ENV['STUDY114_MAIL_FROM'] = 'noreply@study114.net';
$_SERVER['STUDY114_MAIL_FROM'] = 'noreply@study114.net';

assert_true(MailAddressMasker::mask('ab@gmail.com') === 'ab***@gmail.com', '이메일 마스킹');
assert_true(!str_contains(MailAddressMasker::mask('secretuser@nate.com'), 'secretuser'), '로컬파트 전체 미노출');

$log = is_file($logPath) ? (string) file_get_contents($logPath) : '';
assert_true(!str_contains($log, 'SMTP_PASSWORD'), '로그에 SMTP 비밀번호 키 없음');
assert_true(preg_match('/pass(word)?\s*=\s*\S+/i', $log) !== 1, '로그에 password= 패턴 없음');
assert_true(str_contains($log, '***@'), '로그 TO 마스킹');

$authMailerSrc = (string) file_get_contents($root . '/src/Auth/AuthMailer.php');
$authMailerCode = preg_replace('/\/\*[\s\S]*?\*\//', '', $authMailerSrc) ?? '';
$authMailerCode = preg_replace('/\/\/.*$/m', '', $authMailerCode) ?? '';
assert_true(preg_match('/\bmail\s*\(/', $authMailerCode) !== 1, 'AuthMailer에 mail() 없음');

// 헤더 인젝션
$smtp = new SmtpMailTransport('127.0.0.1', 9, 'u', 'p', 'none', 1);
$inj = $smtp->send([
    'to' => "evil@example.com\r\nBcc: spoof@example.com",
    'subject' => 'ok',
    'body' => 'x',
    'from_email' => 'noreply@study114.net',
    'from_header' => '우동공과 <noreply@study114.net>',
]);
assert_true($inj->ok === false && $inj->code === 'header_injection', '수신자 개행 → header_injection');

$inj2 = $smtp->send([
    'to' => 'ok@example.com',
    'subject' => "subj\r\nX-Injected: 1",
    'body' => 'x',
    'from_email' => 'noreply@study114.net',
    'from_header' => '우동공과 <noreply@study114.net>',
]);
assert_true($inj2->code === 'header_injection', '제목 개행 → header_injection');

assert_true(
    SmtpMessageSanitizer::assertSafeMailbox("a@b.com\n", 'to') !== null,
    'sanitizer mailbox CR/LF'
);
$enc = SmtpMessageSanitizer::encodeHeader('우동공과');
assert_true(str_starts_with($enc, '=?UTF-8?B?') && str_ends_with($enc, '?='), '한글 헤더 MIME encoding');

// DNS/소켓 연결 실패 (닫힌 포트)
$smtpFail = new SmtpMailTransport('127.0.0.1', 1, 'u', 'p', 'none', 1);
$conn = $smtpFail->send([
    'to' => 'ok@example.com',
    'subject' => 's',
    'body' => 'b',
    'from_email' => 'noreply@study114.net',
    'from_header' => '우동공과 <noreply@study114.net>',
]);
assert_true(
    $conn->ok === false && in_array($conn->code, ['connect_failed', 'timeout', 'smtp_error'], true),
    '소켓 연결 실패 → connect_failed|timeout (code=' . $conn->code . ')'
);

// TLS peer verify 설정이 소스에 존재
$smtpSrc = (string) file_get_contents($root . '/src/Mail/SmtpMailTransport.php');
assert_true(str_contains($smtpSrc, "'verify_peer' => true"), 'TLS verify_peer=true');
assert_true(str_contains($smtpSrc, "'verify_peer_name' => true"), 'TLS verify_peer_name=true');
assert_true(!preg_match("/verify_peer'\s*=>\s*false/", $smtpSrc), 'verify_peer false 없음');
assert_true(str_contains($smtpSrc, 'STARTTLS'), 'STARTTLS');
assert_true(str_contains($smtpSrc, 'EHLO study114.net'), 'EHLO');
assert_true(str_contains($smtpSrc, 'AUTH LOGIN'), 'AUTH LOGIN');
assert_true(str_contains($smtpSrc, 'AUTH PLAIN'), 'AUTH PLAIN 폴백');
assert_true(str_contains($smtpSrc, 'dotStuff'), 'dot-stuffing');
assert_true(str_contains($smtpSrc, "\r\n\r\n"), '헤더/본문 빈 줄(CRLF)');
assert_true(str_contains($smtpSrc, 'smtp_temp_fail') && str_contains($smtpSrc, 'smtp_perm_fail'), '4xx/5xx 분류');
assert_true(str_contains($smtpSrc, 'multipart/alternative'), 'HTML/text Content-Type');

// env-only factory (config 키 없이)
putenv('STUDY114_MAIL_TRANSPORT=disabled');
$_ENV['STUDY114_MAIL_TRANSPORT'] = 'disabled';
$envOnly = MailTransportFactory::create([]);
assert_true($envOnly instanceof DisabledMailTransport, 'env-only transport 선택');

putenv('STUDY114_MAIL_TRANSPORT=fake');
$_ENV['STUDY114_MAIL_TRANSPORT'] = 'fake';

$probe = (string) file_get_contents($root . '/public/api/auth/password/_mail-probe.php');
assert_true(str_contains($probe, 'lastResult'), 'probe lastResult');
assert_true(str_contains($probe, 'MailAddressMasker'), 'probe TO 마스킹');

echo "\npassed={$passed} failed={$failed}\n";
exit($failed > 0 ? 1 : 0);
