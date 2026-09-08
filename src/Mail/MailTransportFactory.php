<?php

declare(strict_types=1);

namespace Study114\Mail;

/**
 * STUDY114_* 환경변수 우선 · config/auth.php 보조.
 * 기본 transport: Resend HTTPS API. SMTP·mail() 없음.
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

        $mode = strtolower(trim(self::pick($auth, 'mail_transport', 'STUDY114_MAIL_TRANSPORT', 'resend')));

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

        if ($mode === 'smtp') {
            return new DisabledMailTransport(
                'smtp_removed',
                'Custom SMTP transport was removed; use Resend'
            );
        }

        $apiKey = self::pick($auth, 'resend_api_key', 'STUDY114_RESEND_API_KEY', '');
        $timeout = (int) self::pick($auth, 'resend_timeout', 'STUDY114_RESEND_TIMEOUT', '20');
        if ($timeout < 1) {
            $timeout = 20;
        }

        if ($apiKey === '' || $apiKey === '__STUDY114_RESEND_API_KEY__' || str_starts_with($apiKey, '__')) {
            return new DisabledMailTransport('api_key_missing', 'Resend API key is not configured');
        }

        return new ResendMailTransport($apiKey, $timeout);
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
