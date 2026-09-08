<?php

declare(strict_types=1);

namespace Study114\Mail;

/**
 * STUDY114_* 환경변수 기반 transport 생성.
 * mail() fallback 없음 — 설정 부족 시 DisabledMailTransport.
 */
final class MailTransportFactory
{
    /**
     * @param array<string, mixed>|null $authConfig study114_config('auth')
     */
    public static function create(?array $authConfig = null): MailTransport
    {
        $auth = $authConfig ?? study114_config('auth');
        $mode = strtolower(trim((string) ($auth['mail_transport'] ?? 'smtp')));

        if ($mode === 'fake') {
            $fakeMode = (string) ($auth['mail_fake_mode'] ?? 'success');

            return new FakeMailTransport($fakeMode);
        }

        if ($mode === 'disabled' || $mode === 'off' || $mode === 'none') {
            return new DisabledMailTransport('transport_disabled', 'Mail transport is disabled');
        }

        // php_mail / mail 명시해도 허용하지 않음 (fail-closed)
        if ($mode === 'mail' || $mode === 'php_mail' || $mode === 'php-mail') {
            return new DisabledMailTransport(
                'mail_fallback_forbidden',
                'PHP mail() transport is not allowed'
            );
        }

        $host = trim((string) ($auth['smtp_host'] ?? ''));
        $port = (int) ($auth['smtp_port'] ?? 0);
        $user = trim((string) ($auth['smtp_username'] ?? ''));
        $pass = (string) ($auth['smtp_password'] ?? '');
        $enc = strtolower(trim((string) ($auth['smtp_encryption'] ?? 'tls')));
        $timeout = (int) ($auth['smtp_timeout'] ?? 20);
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
}
