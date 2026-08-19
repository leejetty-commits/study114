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
    $redirect('email_verify_error=' . rawurlencode('인증 토큰이 없습니다.'));
}

try {
    (new EmailVerificationService())->verifyToken($token);
    $redirect('verified=1');
} catch (InvalidArgumentException $e) {
    $redirect('email_verify_error=' . rawurlencode($e->getMessage()));
} catch (Throwable $e) {
    error_log('[email/verify] ' . $e->getMessage());
    $redirect('email_verify_error=' . rawurlencode('이메일 인증 처리 중 오류가 발생했습니다.'));
}
