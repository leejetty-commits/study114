<?php

declare(strict_types=1);

$bootstrap = dirname(__DIR__, 4) . '/src/bootstrap.php';
if (!is_file($bootstrap)) {
    error_log('[oauth/start] bootstrap missing path=' . $bootstrap);
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo '소셜 로그인을 시작할 수 없습니다.';
    exit;
}

require_once $bootstrap;

use Study114\Auth\AuthSession;
use Study114\Auth\OAuthService;

$provider = (string) ($_GET['provider'] ?? '');
$returnTo = (string) ($_GET['return_to'] ?? '');

$failToLogin = static function (string $message) use ($provider): void {
    $origin = study114_request_origin() ?? '-';
    error_log('[oauth/start] fail provider=' . $provider . ' origin=' . $origin . ' msg=' . $message);
    try {
        $oauth = new OAuthService();
        $base = $oauth->authUiBase();
    } catch (Throwable $ignored) {
        unset($ignored);
        $base = rtrim(study114_public_origin(), '/') . '/auth';
    }
    header('Location: ' . $base . '/#/login?oauth_error=' . rawurlencode($message), true, 302);
    exit;
};

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
    session_write_close();

    error_log('[oauth/start] redirect provider=' . $provider
        . ' origin=' . (study114_request_origin() ?? '-')
        . ' redirect_uri=' . $redirectUri
        . ' https=' . (study114_request_is_https() ? '1' : '0')
        . ' trust_proxy=' . (study114_trust_forwarded_proto() ? '1' : '0'));

    header('Location: ' . $oauth->authorizeUrl($provider, $state, $redirectUri), true, 302);
    exit;
} catch (Throwable $e) {
    error_log('[oauth/start] ' . $e::class . ' ' . $e->getMessage()
        . ' provider=' . $provider
        . ' origin=' . (study114_request_origin() ?? '-'));
    $failToLogin($e->getMessage());
}
