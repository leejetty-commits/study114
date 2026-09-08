<?php

declare(strict_types=1);

/**
 * CUR-006 Resend HTTPS API — PHP 8.2 mock 검증 (실메일·운영 probe 없음)
 *
 * 실행: php scripts/verify-cur-006-resend.php
 */

$root = dirname(__DIR__);
$logPath = $root . '/storage/logs/mail-cur006-test.log';
$outboxPath = $root . '/storage/logs/mail-cur006-fake-outbox.jsonl';

putenv('STUDY114_MAIL_FROM=no-reply@study114.net');
putenv('STUDY114_MAIL_TRANSPORT=fake');
putenv('STUDY114_MAIL_FAKE_MODE=success');
putenv('STUDY114_MAIL_LOG_PATH=' . $logPath);
putenv('STUDY114_MAIL_FAKE_OUTBOX=' . $outboxPath);
$_ENV['STUDY114_MAIL_FROM'] = 'no-reply@study114.net';
$_ENV['STUDY114_MAIL_TRANSPORT'] = 'fake';
$_ENV['STUDY114_MAIL_LOG_PATH'] = $logPath;
$_ENV['STUDY114_MAIL_FAKE_OUTBOX'] = $outboxPath;
$_SERVER['STUDY114_MAIL_FROM'] = 'no-reply@study114.net';
$_SERVER['STUDY114_MAIL_TRANSPORT'] = 'fake';
$_SERVER['STUDY114_MAIL_LOG_PATH'] = $logPath;
$_SERVER['STUDY114_MAIL_FAKE_OUTBOX'] = $outboxPath;

require_once $root . '/src/bootstrap.php';

use Study114\Auth\AuthMailer;
use Study114\Mail\DisabledMailTransport;
use Study114\Mail\FakeMailOutbox;
use Study114\Mail\FakeMailTransport;
use Study114\Mail\MailAddressMasker;
use Study114\Mail\MailMessageSanitizer;
use Study114\Mail\MailTransportFactory;
use Study114\Mail\ResendMailTransport;

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
        fwrite(STDERR, "ASSERT_FAIL {$msg}\n");
    }
}

echo 'PHP_VERSION=' . PHP_VERSION . PHP_EOL;
assert_true(PHP_VERSION_ID >= 80200 && PHP_VERSION_ID < 80300, 'PHP 8.2.x runtime');
assert_true(function_exists('curl_init'), 'curl extension');

@unlink($logPath);
@unlink($outboxPath);

function authConfig(array $over = []): array
{
    global $logPath;

    return array_merge([
        'mail_from' => 'no-reply@study114.net',
        'mail_transport' => 'resend',
        'mail_fake_mode' => 'success',
        'resend_api_key' => '',
        'resend_timeout' => 5,
        'mail_log_path' => $logPath,
    ], $over);
}

$secretToken = 'verify_tok_' . bin2hex(random_bytes(16));
$secretBody = "확인 링크: https://study114.net/api/auth/email/verify.php?token={$secretToken}\n";
$mailer = new AuthMailer(new FakeMailTransport('success'));
assert_true($mailer->send('user@example.com', '[우동공과] 이메일 확인', $secretBody, '<p>' . $secretBody . '</p>') === true, 'AuthMailer→Fake 성공');
assert_true($mailer->lastResult()?->ok === true, 'lastResult ok');
assert_true($mailer->lastResult()?->code === 'resend_accepted', 'resend_accepted code');

$outbox = FakeMailOutbox::last();
assert_true(is_array($outbox) && str_contains((string) ($outbox['body'] ?? ''), $secretToken), 'fake outbox에만 token 본문');
$logAfterFake = is_file($logPath) ? (string) file_get_contents($logPath) : '';
assert_true(!str_contains($logAfterFake, $secretToken), 'fake 모드 mail.log에 token 없음');
assert_true(!str_contains($logAfterFake, $secretBody), 'fake 모드 mail.log에 본문 없음');
assert_true(!str_contains($logAfterFake, '--- plain ---'), 'mail.log에 plain 본문 블록 없음');
assert_true(str_contains($logAfterFake, 'KIND=email_verify'), 'mail.log KIND=email_verify');

$mailer = new AuthMailer(new FakeMailTransport('auth_failed'));
assert_true($mailer->send('user@example.com', 't', 'body') === false, '인증 실패 → false');
assert_true($mailer->lastResult()?->code === 'auth_failed', 'auth_failed code');

$mailer = new AuthMailer(new FakeMailTransport('resend_error'));
assert_true($mailer->send('user@example.com', 't', 'body') === false, 'Resend 오류 → false');
assert_true($mailer->lastResult()?->code === 'resend_error', 'resend_error code');

$mailer = new AuthMailer(new FakeMailTransport('timeout'));
assert_true($mailer->send('user@example.com', 't', 'body') === false, 'timeout → false');
assert_true($mailer->lastResult()?->code === 'timeout', 'timeout code');

$t = MailTransportFactory::create(authConfig(['resend_api_key' => '']));
assert_true($t instanceof DisabledMailTransport, 'API Key 누락 → DisabledMailTransport');
assert_true(
    $t->send([
        'to' => 'a@b.c',
        'subject' => 's',
        'body' => 'b',
        'from_email' => 'no-reply@study114.net',
        'from_header' => 'x <no-reply@study114.net>',
    ])->code === 'api_key_missing',
    'api_key_missing'
);

$t = MailTransportFactory::create(authConfig(['mail_transport' => 'php_mail']));
assert_true($t instanceof DisabledMailTransport, 'php_mail → fail-closed');
assert_true(
    $t->send([
        'to' => 'a@b.c',
        'subject' => 's',
        'body' => 'b',
        'from_email' => 'no-reply@study114.net',
        'from_header' => 'x <no-reply@study114.net>',
    ])->code === 'mail_fallback_forbidden',
    'mail_fallback_forbidden'
);

$t = MailTransportFactory::create(authConfig(['mail_transport' => 'smtp', 'resend_api_key' => 'x']));
assert_true(
    $t instanceof DisabledMailTransport
    && $t->send([
        'to' => 'a@b.c',
        'subject' => 's',
        'body' => 'b',
        'from_email' => 'no-reply@study114.net',
        'from_header' => 'x <no-reply@study114.net>',
    ])->code === 'smtp_removed',
    'smtp mode → smtp_removed'
);

putenv('STUDY114_MAIL_FROM=study114@study114.dothome.co.kr');
$_ENV['STUDY114_MAIL_FROM'] = 'study114@study114.dothome.co.kr';
$_SERVER['STUDY114_MAIL_FROM'] = 'study114@study114.dothome.co.kr';
$mailerBadFrom = new AuthMailer(new FakeMailTransport('success'));
assert_true($mailerBadFrom->send('user@example.com', 't', 'body') === false, 'dothome From 거부');
assert_true($mailerBadFrom->lastResult()?->code === 'from_rejected', 'from_rejected code');

putenv('STUDY114_MAIL_FROM=no-reply@study114.net');
$_ENV['STUDY114_MAIL_FROM'] = 'no-reply@study114.net';
$_SERVER['STUDY114_MAIL_FROM'] = 'no-reply@study114.net';

assert_true(MailAddressMasker::mask('ab@gmail.com') === 'ab***@gmail.com', '이메일 마스킹');
assert_true(!str_contains(MailAddressMasker::mask('secretuser@nate.com'), 'secretuser'), '로컬파트 전체 미노출');

$log = is_file($logPath) ? (string) file_get_contents($logPath) : '';
assert_true(!str_contains($log, 'RESEND_API_KEY'), '로그에 RESEND_API_KEY 키 없음');
assert_true(!str_contains($log, 're_test_'), '로그에 테스트 키 접두 없음');
assert_true(preg_match('/pass(word)?\s*=\s*\S+/i', $log) !== 1, '로그에 password= 패턴 없음');
assert_true(str_contains($log, '***@'), '로그 TO 마스킹');
assert_true(!str_contains($log, 'verify.php?token='), '로그에 verify URL 없음');
assert_true(!str_contains($log, $secretToken), '로그에 secret token 없음');

$authMailerSrc = (string) file_get_contents($root . '/src/Auth/AuthMailer.php');
$authMailerCode = preg_replace('/\/\*[\s\S]*?\*\//', '', $authMailerSrc) ?? '';
$authMailerCode = preg_replace('/\/\/.*$/m', '', $authMailerCode) ?? '';
assert_true(preg_match('/\bmail\s*\(/', $authMailerCode) !== 1, 'AuthMailer에 mail() 없음');

// Resend mock HTTP — 성공 / 401 / timeout (실네트워크 없음)
$okHttp = static function () {
    return ['ok' => true, 'status' => 200, 'body' => '{"id":"msg_mock"}', 'errno' => 0, 'error' => ''];
};
$resendOk = new ResendMailTransport('re_test_mock_key_not_real', 5, $okHttp);
$okResult = $resendOk->send([
    'to' => 'ok@example.com',
    'subject' => '확인',
    'body' => '본문',
    'from_email' => 'no-reply@study114.net',
    'from_header' => '우동공과 <no-reply@study114.net>',
]);
assert_true($okResult->ok && $okResult->code === 'resend_accepted', 'Resend mock HTTP 200');
assert_true($okResult->providerMessageId === 'msg_mock', 'Resend message id 파싱');

// production/resend 경로: 본문·토큰은 mail.log·outbox에 없음
putenv('STUDY114_MAIL_TRANSPORT=resend');
$_ENV['STUDY114_MAIL_TRANSPORT'] = 'resend';
$_SERVER['STUDY114_MAIL_TRANSPORT'] = 'resend';
$prodToken = 'reset_tok_' . bin2hex(random_bytes(12));
$prodBody = "재설정: https://study114.net/#/reset-password?token={$prodToken}";
@unlink($outboxPath);
$logBeforeProd = is_file($logPath) ? (string) file_get_contents($logPath) : '';
$mailerProd = new AuthMailer(new ResendMailTransport('re_test_mock_key_not_real', 5, $okHttp));
assert_true(
    $mailerProd->send('user@example.com', '[우동공과] 비밀번호 재설정', $prodBody) === true,
    'resend 모드 AuthMailer 성공'
);
$logProd = is_file($logPath) ? (string) file_get_contents($logPath) : '';
$logProdDelta = substr($logProd, strlen($logBeforeProd));
assert_true(!str_contains($logProdDelta, $prodToken), 'resend 모드 mail.log에 reset token 없음');
assert_true(!str_contains($logProdDelta, $prodBody), 'resend 모드 mail.log에 본문 없음');
assert_true(!str_contains($logProdDelta, '--- html ---'), 'resend 모드 mail.log에 html 본문 없음');
assert_true(str_contains($logProdDelta, 'KIND=password_reset'), 'resend 모드 KIND=password_reset');
assert_true(str_contains($logProdDelta, 'MSG_ID=msg_mock'), 'resend 모드 MSG_ID만 기록');
assert_true(!is_file($outboxPath) || trim((string) file_get_contents($outboxPath)) === '', 'resend 모드 fake outbox 미사용');
assert_true(FakeMailOutbox::last() === null, 'resend 모드 FakeMailOutbox::last()=null');

putenv('STUDY114_MAIL_TRANSPORT=fake');
$_ENV['STUDY114_MAIL_TRANSPORT'] = 'fake';
$_SERVER['STUDY114_MAIL_TRANSPORT'] = 'fake';

$authHttp = static function () {
    return ['ok' => true, 'status' => 401, 'body' => '{}', 'errno' => 0, 'error' => ''];
};
$resendAuth = new ResendMailTransport('re_test_mock_key_not_real', 5, $authHttp);
$authResult = $resendAuth->send([
    'to' => 'ok@example.com',
    'subject' => 's',
    'body' => 'b',
    'from_email' => 'no-reply@study114.net',
    'from_header' => '우동공과 <no-reply@study114.net>',
]);
assert_true(!$authResult->ok && $authResult->code === 'auth_failed', 'Resend mock HTTP 401');

$timeoutHttp = static function () {
    return ['ok' => false, 'status' => 0, 'body' => '', 'errno' => 28, 'error' => 'Operation timed out'];
};
$resendTimeout = new ResendMailTransport('re_test_mock_key_not_real', 5, $timeoutHttp);
$toResult = $resendTimeout->send([
    'to' => 'ok@example.com',
    'subject' => 's',
    'body' => 'b',
    'from_email' => 'no-reply@study114.net',
    'from_header' => '우동공과 <no-reply@study114.net>',
]);
assert_true(!$toResult->ok && $toResult->code === 'timeout', 'Resend mock timeout');

$inj = (new ResendMailTransport('re_test_mock_key_not_real', 5, $okHttp))->send([
    'to' => "evil@example.com\r\nBcc: spoof@example.com",
    'subject' => 'ok',
    'body' => 'x',
    'from_email' => 'no-reply@study114.net',
    'from_header' => '우동공과 <no-reply@study114.net>',
]);
assert_true($inj->ok === false && $inj->code === 'header_injection', '수신자 개행 → header_injection');

$inj2 = (new ResendMailTransport('re_test_mock_key_not_real', 5, $okHttp))->send([
    'to' => 'ok@example.com',
    'subject' => "subj\r\nX-Injected: 1",
    'body' => 'x',
    'from_email' => 'no-reply@study114.net',
    'from_header' => '우동공과 <no-reply@study114.net>',
]);
assert_true($inj2->code === 'header_injection', '제목 개행 → header_injection');

assert_true(
    MailMessageSanitizer::assertSafeMailbox("a@b.com\n", 'to') !== null,
    'sanitizer mailbox CR/LF'
);
$enc = MailMessageSanitizer::encodeHeader('우동공과');
assert_true(str_starts_with($enc, '=?UTF-8?B?') && str_ends_with($enc, '?='), '한글 헤더 MIME encoding');

$resendSrc = (string) file_get_contents($root . '/src/Mail/ResendMailTransport.php');
assert_true(str_contains($resendSrc, 'https://api.resend.com/emails'), 'Resend endpoint');
assert_true(str_contains($resendSrc, 'curl_init'), 'cURL 사용');
assert_true(!str_contains($resendSrc, 'stream_socket'), 'stream_socket 없음');
assert_true(!preg_match('/safeSummary.*apiKey|apiKey.*safeSummary/', $resendSrc), '결과에 apiKey 결합 없음');

assert_true(!is_file($root . '/src/Mail/SmtpMailTransport.php'), 'SmtpMailTransport 제거');
assert_true(!is_file($root . '/src/Mail/SmtpProtocolException.php'), 'SmtpProtocolException 제거');

$reminderSrc = (string) file_get_contents($root . '/src/Paid/ProviderReminderService.php');
assert_true(str_contains($reminderSrc, 'reminder_mail_excluded'), 'ProviderReminder 메일 제외');

putenv('STUDY114_MAIL_TRANSPORT=disabled');
$_ENV['STUDY114_MAIL_TRANSPORT'] = 'disabled';
$envOnly = MailTransportFactory::create([]);
assert_true($envOnly instanceof DisabledMailTransport, 'env-only transport 선택');

putenv('STUDY114_MAIL_TRANSPORT=fake');
$_ENV['STUDY114_MAIL_TRANSPORT'] = 'fake';

$probe = (string) file_get_contents($root . '/public/api/auth/password/_mail-probe.php');
assert_true(str_contains($probe, 'lastResult'), 'probe lastResult');
assert_true(str_contains($probe, 'MailAddressMasker'), 'probe TO 마스킹');
assert_true(str_contains($probe, 'Resend'), 'probe Resend 문구');
assert_true(str_contains($probe, 'resend_accepted'), 'probe resend_accepted');
assert_true(!str_contains($probe, 'smtp_accepted'), 'probe smtp_accepted 제거');
assert_true(!preg_match('/\$_GET\[[\'"]key[\'"]\].*[\'"]key[\'"]\s*=>/', $probe), 'probe key를 JSON 키로 미노출');
assert_true(str_contains($probe, 'details omitted'), 'probe 예외 시 key/메시지 미노출');

$disabledSrc = (string) file_get_contents($root . '/src/Mail/DisabledMailTransport.php');
assert_true(!str_contains($disabledSrc, 'SMTP configuration'), 'DisabledMailTransport SMTP 문구 제거');

$deploy = (string) file_get_contents($root . '/.github/workflows/deploy.yml');
assert_true(str_contains($deploy, 'STUDY114_RESEND_API_KEY'), 'deploy Resend Secret');
assert_true(
    str_contains($deploy, 'STUDY114_PHONE_OTP_PEPPER STUDY114_RESEND_API_KEY')
    || preg_match('/required=.*STUDY114_RESEND_API_KEY/', $deploy) === 1,
    'deploy Resend Secret 필수 required 목록'
);
assert_true(str_contains($deploy, 'placeholder 형식'), 'deploy placeholder 거부');
assert_true(!str_contains($deploy, 'Resend API Key는 선택'), 'deploy Resend 선택 문구 제거');

$envEx = (string) file_get_contents($root . '/config/dothome.env.example');
assert_true(str_contains($envEx, 'STUDY114_MAIL_TRANSPORT=resend'), 'dothome.env Resend transport');
assert_true(str_contains($envEx, 'STUDY114_RESEND_API_KEY='), 'dothome.env Resend key');
assert_true(!str_contains($envEx, 'STUDY114_SMTP_'), 'dothome.env SMTP 제거');

echo "\npassed={$passed} failed={$failed}\n";
exit($failed > 0 ? 1 : 0);
