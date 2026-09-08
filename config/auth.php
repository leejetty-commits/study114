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
    /** 닷홈: SetEnv STUDY114_MAIL_FROM. 운영 From: 우동공과 <no-reply@study114.net> */
    'mail_from'                  => study114_env('STUDY114_MAIL_FROM', 'no-reply@study114.local'),
    /**
     * resend | fake | disabled
     * smtp / php_mail / mail 은 허용하지 않음 (fail-closed).
     */
    'mail_transport'             => study114_env('STUDY114_MAIL_TRANSPORT', 'resend'),
    'mail_fake_mode'             => study114_env('STUDY114_MAIL_FAKE_MODE', 'success'),
    'resend_api_key'             => study114_env('STUDY114_RESEND_API_KEY', ''),
    'resend_timeout'             => (int) study114_env('STUDY114_RESEND_TIMEOUT', '20'),
    'password_reset_ttl_minutes' => 30,
    /** 재설정 메일 재전송 최소 간격(초). 서버·클라이언트 동일 — 5분 */
    'password_reset_resend_cooldown_seconds' => 300,
    'email_verify_ttl_minutes'   => 24 * 60,
    /** 가입 확인 메일 재전송 최소 간격(초). 서버·클라이언트 동일 — 10분 */
    'email_verify_resend_cooldown_seconds' => 600,
    /** P20-05 SMS OTP — 재발송 간격(초) · 유효(분) · HMAC pepper */
    'phone_otp_resend_cooldown_seconds' => 60,
    'phone_otp_ttl_minutes'             => 3,
    'phone_otp_pepper'                  => study114_env('STUDY114_PHONE_OTP_PEPPER', 'study114-phone-otp-dev'),
    /** 테스트·스테이징: STUDY114_MAIL_LOG_PATH 로 분리 가능 */
    'mail_log_path'              => study114_env('STUDY114_MAIL_LOG_PATH', $root . '/storage/logs/mail.log'),
];
