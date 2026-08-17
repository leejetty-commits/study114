<?php

declare(strict_types=1);

/**
 * 소셜 로그인 — 네이버 · 카카오 · 구글
 * redirect_uri 실사용 값은 OAuthService::redirectUri()가 요청 origin으로 만든다.
 * 아래 값은 env 폴백(메일·로컬·origin 없을 때). 운영 STUDY114_API_BASE=https://study114.net
 */
$apiBase = rtrim(study114_env('STUDY114_API_BASE', 'http://127.0.0.1:8080'), '/');
$homeUi = rtrim(study114_env('STUDY114_HOME_UI', 'http://127.0.0.1:5174'), '/');
$authUi = rtrim(study114_env('STUDY114_AUTH_UI', 'http://127.0.0.1:5173'), '/');

return [
    'home_ui'  => $homeUi,
    'auth_ui'  => $authUi,
    'api_base' => $apiBase,
    'providers' => [
        'naver' => [
            'client_id'     => study114_env('OAUTH_NAVER_CLIENT_ID'),
            'client_secret' => study114_env('OAUTH_NAVER_CLIENT_SECRET'),
            'redirect_uri'  => $apiBase . '/api/auth/oauth/callback.php?provider=naver',
        ],
        'kakao' => [
            'rest_api_key'  => study114_env('OAUTH_KAKAO_REST_API_KEY'),
            'client_secret' => study114_env('OAUTH_KAKAO_CLIENT_SECRET'),
            'redirect_uri'  => $apiBase . '/api/auth/oauth/callback.php?provider=kakao',
        ],
        'google' => [
            'client_id'     => study114_env('OAUTH_GOOGLE_CLIENT_ID'),
            'client_secret' => study114_env('OAUTH_GOOGLE_CLIENT_SECRET'),
            'redirect_uri'  => $apiBase . '/api/auth/oauth/callback.php?provider=google',
        ],
    ],
];
