<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\OAuthRoleService;
use Study114\Auth\OAuthService;

$provider = (string) ($_GET['provider'] ?? '');
$code = (string) ($_GET['code'] ?? '');
$state = (string) ($_GET['state'] ?? '');
$error = (string) ($_GET['error'] ?? '');

$oauth = new OAuthService();
$authUi = $oauth->authUiBase();
$homeUi = $oauth->homeUiBase();

$fail = static function (string $message) use ($authUi): void {
    header('Location: ' . $authUi . '/#/login?oauth_error=' . rawurlencode($message), true, 302);
    exit;
};

if ($error !== '') {
    $fail('소셜 로그인이 취소되었습니다.');
}

try {
    AuthSession::start();
    $session = $_SESSION['oauth'] ?? null;
    if (!is_array($session) || ($session['state'] ?? '') !== $state || ($session['provider'] ?? '') !== $provider) {
        throw new InvalidArgumentException('소셜 로그인 상태가 올바르지 않습니다. 다시 시도해 주세요.');
    }
    if ($code === '') {
        throw new InvalidArgumentException('인증 코드가 없습니다.');
    }

    $returnTo = (string) ($session['return_to'] ?? '');
    $redirectUri = (string) ($session['redirect_uri'] ?? $oauth->redirectUri($provider));
    unset($_SESSION['oauth']);

    $user = $oauth->authenticate($provider, $code, $redirectUri);
    AuthSession::login($user['user_id'], $user['email'], $user['role_type'], $user['name']);

    $roleHome = match ($user['role_type']) {
        'study_room_owner' => '/study-room',
        'tutor'            => '/tutor',
        default            => '/parent',
    };

    if ($user['is_new'] || (new OAuthRoleService())->isRolePendingForUser($user['user_id'])) {
        $params = ['from' => 'oauth'];
        if ($returnTo !== '' && (str_starts_with($returnTo, '/') || str_starts_with($returnTo, $homeUi))) {
            $params['return_to'] = $returnTo;
        }
        $target = $authUi . '/#/signup/role?' . http_build_query($params);
        header('Location: ' . $target, true, 302);
        exit;
    }

    if ($returnTo !== '' && (str_starts_with($returnTo, '/') || str_starts_with($returnTo, $homeUi))) {
        $target = str_starts_with($returnTo, 'http')
            ? $returnTo
            : $homeUi . '/#/' . ltrim($returnTo, '/#');
    } else {
        $target = $homeUi . '/#/' . ltrim($roleHome, '/');
    }

    header('Location: ' . $target, true, 302);
    exit;
} catch (Throwable $e) {
    error_log('[oauth/callback] ' . $e->getMessage());
    $fail($e instanceof InvalidArgumentException ? $e->getMessage() : '소셜 로그인 처리 중 오류가 발생했습니다.');
}
