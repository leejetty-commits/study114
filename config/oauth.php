<?php

declare(strict_types=1);

/**
 * 소셜 로그인 — 네이버 · 카카오 · 구글
 * 운영: 환경변수 또는 배포 시 이 파일 값을 채운다.
 */
$apiBase = getenv('STUDY114_API_BASE') ?: 'http://127.0.0.1:8080';
$homeUi = getenv('STUDY114_HOME_UI') ?: 'http://127.0.0.1:5174';
$authUi = getenv('STUDY114_AUTH_UI') ?: 'http://127.0.0.1:5173';

return [
    'home_ui'  => rtrim($homeUi, '/'),
    'auth_ui'  => rtrim($authUi, '/'),
    'api_base' => rtrim($apiBase, '/'),
    'providers' => [
        'naver' => [
            'client_id'     => getenv('OAUTH_NAVER_CLIENT_ID') ?: '',
            'client_secret' => getenv('OAUTH_NAVER_CLIENT_SECRET') ?: '',
            'redirect_uri'  => $apiBase . '/api/auth/oauth/callback.php?provider=naver',
        ],
        'kakao' => [
            'rest_api_key'  => getenv('OAUTH_KAKAO_REST_API_KEY') ?: '',
            'client_secret' => getenv('OAUTH_KAKAO_CLIENT_SECRET') ?: '',
            'redirect_uri'  => $apiBase . '/api/auth/oauth/callback.php?provider=kakao',
        ],
        'google' => [
            'client_id'     => getenv('OAUTH_GOOGLE_CLIENT_ID') ?: '',
            'client_secret' => getenv('OAUTH_GOOGLE_CLIENT_SECRET') ?: '',
            'redirect_uri'  => $apiBase . '/api/auth/oauth/callback.php?provider=google',
        ],
    ],
];
