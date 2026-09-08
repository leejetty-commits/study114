<?php

declare(strict_types=1);

namespace Study114\Mail;

/**
 * STUDY114_* 환경변수 우선 · config/auth.php 보조.
 * 운영은 .htaccess SetEnv만으로도 SMTP를 선택 가능 (config/ 미배포 대비).
 * mail() fallback 없음.
 */
final class MailTransportFactory
{
    /**
     * @param array<string, mixed>|null $authConfig study114_config('auth') — 테스트에서 주입 가능
     */
    public static function create(?array $authConfig = null): MailTransport
    {
        $auth = $authConfig ?? [];
        if ($authConfig === null) {
            try {
                $auth = study114_config('auth');
            } catch (\Throwable) {
                $auth = [];
            }
        }

        $mode = strtolower(trim(self::pick($auth, 'mail_transport', 'STUDY114_MAIL_TRANSPORT', 'smtp')));

        if ($mode === 'fake') {
            $fakeMode = self::pick($auth, 'mail_fake_mode', 'STUDY114_MAIL_FAKE_MODE', 'success');

            return new FakeMailTransport($fakeMode);
        }

        if ($mode === 'disabled' || $mode === 'off' || $mode === 'none') {
            return new DisabledMailTransport('transport_disabled', 'Mail transport is disabled');
        }

        if ($mode === 'mail' || $mode === 'php_mail' || $mode === 'php-mail') {
            return new DisabledMailTransport(
                'mail_fallback_forbidden',
                'PHP mail() transport is not allowed'
            );
        }

        $host = trim(self::pick($auth, 'smtp_host', 'STUDY114_SMTP_HOST', ''));
        $port = (int) self::pick($auth, 'smtp_port', 'STUDY114_SMTP_PORT', '587');
        $user = trim(self::pick($auth, 'smtp_username', 'STUDY114_SMTP_USERNAME', ''));
        $pass = self::pick($auth, 'smtp_password', 'STUDY114_SMTP_PASSWORD', '');
        $enc = strtolower(trim(self::pick($auth, 'smtp_encryption', 'STUDY114_SMTP_ENCRYPTION', 'tls')));
        $timeout = (int) self::pick($auth, 'smtp_timeout', 'STUDY114_SMTP_TIMEOUT', '20');
        if ($timeout < 1) {
            $timeout = 20;
        }

        if ($host === '' || $port < 1 || $user === '' || $pass === '') {
            return new DisabledMailTransport('config_missing', 'SMTP configuration is incomplete');
        }

        if ($pass === '__STUDY114_SMTP_PASSWORD__' || str_starts_with($pass, '__')) {
            return new DisabledMailTransport('config_missing', 'SMTP password placeholder is not injected');
        }

        if (!in_array($enc, ['tls', 'ssl', 'none'], true)) {
            $enc = 'tls';
        }

        return new SmtpMailTransport($host, $port, $user, $pass, $enc, $timeout);
    }

    /** @param array<string, mixed> $auth */
    private static function pick(array $auth, string $configKey, string $envKey, string $default): string
    {
        if (array_key_exists($configKey, $auth) && $auth[$configKey] !== null && $auth[$configKey] !== '') {
            return (string) $auth[$configKey];
        }
        if (function_exists('study114_env')) {
            $fromEnv = study114_env($envKey, '');
            if ($fromEnv !== '') {
                return $fromEnv;
            }
        }

        return $default;
    }
}
