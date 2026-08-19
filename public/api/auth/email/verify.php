<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\EmailVerificationService;

$token = (string) ($_GET['token'] ?? '');
$config = study114_config('auth');
$authUi = rtrim((string) $config['auth_ui'], '/');

$redirect = static function (string $query) use ($authUi): void {
    header('Location: ' . $authUi . '/#/signup/verify-email?' . $query, true, 302);
    exit;
};

if ($token === '') {
    $redirect('email_verify_error=' . rawurlencode('이미 확인되었거나 만료된 링크입니다'));
}

try {
    $outcome = (new EmailVerificationService())->applyVerifyLink($token);
    if ($outcome === 'verified' || $outcome === 'already_verified') {
        $redirect('verified=1');
    }
    $redirect('email_verify_error=' . rawurlencode('이미 확인되었거나 만료된 링크입니다'));
} catch (Throwable $e) {
    error_log('[email/verify] ' . $e->getMessage());
    $redirect('email_verify_error=' . rawurlencode('이미 확인되었거나 만료된 링크입니다'));
}
