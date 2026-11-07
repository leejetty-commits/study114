<?php

declare(strict_types=1);

/**
 * 로그인 rate limit 스모크 (로컬 CLI).
 * 사용: php scripts/check-login-rate-limit.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Auth\LoginRateLimitException;
use Study114\Auth\LoginRateLimiter;

$dir = sys_get_temp_dir() . '/study114-rate-limit-test-' . bin2hex(random_bytes(4));
@mkdir($dir, 0700, true);
$limiter = new LoginRateLimiter($dir);
$failed = 0;

$assert = static function (bool $ok, string $label) use (&$failed): void {
    if ($ok) {
        echo "ok  {$label}\n";
        return;
    }
    fwrite(STDERR, "FAIL {$label}\n");
    $failed++;
};

$email = 'rate-limit-test@example.com';
$ip = '203.0.113.10';

for ($i = 1; $i <= 4; $i++) {
    $limiter->assertPasswordAllowed($ip, $email);
    $limiter->recordPasswordFailure($ip, $email);
}
$assert(true, '4 failures still allowed');

$limiter->recordPasswordFailure($ip, $email);
try {
    $limiter->assertPasswordAllowed($ip, $email);
    $assert(false, '5th failure should lock');
} catch (LoginRateLimitException $e) {
    $assert($e->retryAfterSeconds() >= 60, 'lock retry_after >= 60s');
    $assert(str_contains($e->getMessage(), '보안상'), 'password message mentions 보안상');
    $assert(str_contains($e->getMessage(), '분 후'), 'password message has minutes');
}

$oauthIp = '203.0.113.20';
for ($i = 1; $i <= 10; $i++) {
    $limiter->assertOAuthStartAllowed($oauthIp);
    $limiter->recordOAuthStart($oauthIp);
}
try {
    $limiter->assertOAuthStartAllowed($oauthIp);
    $assert(false, '11th oauth start should block');
} catch (LoginRateLimitException $e) {
    $assert(str_contains($e->getMessage(), '요청이 잦아'), 'oauth message');
}

$limiter->clearPasswordEmail($email);
// email cleared but IP still locked from previous — use new email on same IP after IP not locked
// After 5 email failures IP also has 5 hits (<15) so email clear should allow new email
$limiter2 = new LoginRateLimiter($dir);
$freshEmail = 'other@example.com';
try {
    $limiter2->assertPasswordAllowed($ip, $freshEmail);
    $assert(true, 'other email on same IP still ok after 5 hits');
} catch (LoginRateLimitException $e) {
    unset($e);
    $assert(false, 'other email on same IP still ok after 5 hits');
}

foreach (glob($dir . '/*.json') ?: [] as $f) {
    @unlink($f);
}
@rmdir($dir);

if ($failed > 0) {
    fwrite(STDERR, "failed={$failed}\n");
    exit(1);
}
echo "ok all\n";
