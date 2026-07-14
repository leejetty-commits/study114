<?php

declare(strict_types=1);

/**
 * 소셜 로그인 — 네이버 · 카카오 · 구글
 * 운영: 환경변수 또는 배포 시 이 파일 값을 채운다.
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
