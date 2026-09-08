<?php

declare(strict_types=1);

/**
 * CUR-006 authenticated SMTP — mock 검증 (실메일·운영 probe 없음)
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
    }
}

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
assert_true($mailer->send('user@example.com', 't', 'body') === true, 'SMTP 성공(fake) → true');
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
        'from_header' => 'x',
    ])->ok === false,
    '설정 누락 send false'
);

$t = MailTransportFactory::create(authConfig(['mail_transport' => 'php_mail']));
assert_true($t instanceof DisabledMailTransport, 'php_mail 요청 → Disabled (fallback 없음)');
assert_true(
    $t->send([
        'to' => 'a@b.c',
        'subject' => 's',
        'body' => 'b',
        'from_email' => 'noreply@study114.net',
        'from_header' => 'x',
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
assert_true(str_contains($log, 'TO=us***@example.com') || str_contains($log, '***@'), '로그 TO 마스킹');

$authMailerSrc = (string) file_get_contents($root . '/src/Auth/AuthMailer.php');
assert_true(preg_match('/\bmail\s*\(/', $authMailerSrc) !== 1, 'AuthMailer에 mail() 없음');
assert_true(class_exists(SmtpMailTransport::class), 'SmtpMailTransport 로드');

$probe = (string) file_get_contents($root . '/public/api/auth/password/_mail-probe.php');
assert_true(str_contains($probe, 'lastResult'), 'probe가 lastResult 사용');
assert_true(str_contains($probe, 'MailAddressMasker'), 'probe TO 마스킹');
assert_true(!str_contains($probe, 'mail() 호출 완료'), 'probe 구 mail() 성공 문구 제거');

// Factory fake mode
$fake = MailTransportFactory::create(authConfig([
    'mail_transport' => 'fake',
    'mail_fake_mode' => 'auth_failed',
]));
assert_true($fake instanceof FakeMailTransport, 'Factory fake mode');
assert_true($fake->send([
    'to' => 'a@b.c',
    'subject' => 's',
    'body' => 'b',
    'from_email' => 'noreply@study114.net',
    'from_header' => 'x',
])->code === 'auth_failed', 'Factory fake auth_failed');

echo "\npassed={$passed} failed={$failed}\n";
exit($failed > 0 ? 1 : 0);
