<?php

declare(strict_types=1);

/**
 * 9장 부록 §16 — 메일·토큰·UI 베이스
 */
$authUi = study114_env('STUDY114_AUTH_UI', 'http://127.0.0.1:5173');
$homeUi = study114_env('STUDY114_HOME_UI', 'http://127.0.0.1:5174');
$apiBase = study114_env('STUDY114_API_BASE', 'http://127.0.0.1:8080');
$root = dirname(__DIR__);

return [
    'auth_ui'                    => rtrim($authUi, '/'),
    'home_ui'                    => rtrim($homeUi, '/'),
    'api_base'                   => rtrim($apiBase, '/'),
    /** 닷홈: SetEnv STUDY114_MAIL_FROM. 실도메인 전환 시 일괄 변경. */
    'mail_from'                  => study114_env('STUDY114_MAIL_FROM', 'noreply@study114.local'),
    'password_reset_ttl_minutes' => 30,
    /** 재설정 메일 재전송 최소 간격(초). 서버·클라이언트 동일 — 5분 */
    'password_reset_resend_cooldown_seconds' => 300,
    'email_verify_ttl_minutes'   => 24 * 60,
    'mail_log_path'              => $root . '/storage/logs/mail.log',
];
