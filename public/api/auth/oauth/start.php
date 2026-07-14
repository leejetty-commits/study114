<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\OAuthService;

$provider = (string) ($_GET['provider'] ?? '');
$returnTo = (string) ($_GET['return_to'] ?? '');

try {
    $oauth = new OAuthService();
    if (!in_array($provider, OAuthService::providers(), true)) {
        throw new InvalidArgumentException('지원하지 않는 소셜 로그인입니다.');
    }
    if (!$oauth->isConfigured($provider)) {
        throw new RuntimeException('소셜 로그인 설정이 완료되지 않았습니다. 운영 환경 변수를 확인해 주세요.');
    }

    AuthSession::start();
    $state = bin2hex(random_bytes(16));
    $redirectUri = $oauth->redirectUri($provider);
    $_SESSION['oauth'] = [
        'state'        => $state,
        'provider'     => $provider,
        'return_to'    => $returnTo,
        'redirect_uri' => $redirectUri,
    ];
    // Google 등 외부로 나가기 전에 세션을 확정 저장 (콜백에서 state 유실 방지)
    session_write_close();

    header('Location: ' . $oauth->authorizeUrl($provider, $state, $redirectUri), true, 302);
    exit;
} catch (Throwable $e) {
    error_log('[oauth/start] ' . $e->getMessage());
    $oauth = new OAuthService();
    $target = $oauth->authUiBase() . '/#/login?oauth_error=' . rawurlencode($e->getMessage());
    header('Location: ' . $target, true, 302);
    exit;
}
