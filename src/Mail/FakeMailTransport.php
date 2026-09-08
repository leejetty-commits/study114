<?php

declare(strict_types=1);

namespace Study114\Mail;

/**
 * 테스트용 — 실제 네트워크 없음.
 * STUDY114_MAIL_TRANSPORT=fake 일 때만 Factory가 사용.
 */
final class FakeMailTransport implements MailTransport
{
    /** @var 'success'|'auth_failed'|'api_key_missing'|'resend_error'|'timeout'|'reject' */
    private string $mode;

    public function __construct(string $mode = 'success')
    {
        $this->mode = $mode;
    }

    public function send(array $message): MailSendResult
    {
        return match ($this->mode) {
            'success' => MailSendResult::success('fake transport accepted message'),
            'auth_failed' => MailSendResult::failure('auth_failed', 'Resend API authentication failed'),
            'api_key_missing' => MailSendResult::failure('api_key_missing', 'Resend API key is not configured'),
            'timeout' => MailSendResult::failure('timeout', 'Resend API request timed out'),
            'resend_error' => MailSendResult::failure('resend_error', 'Resend API rejected the message'),
            default => MailSendResult::failure('resend_error', 'Resend rejected the message'),
        };
    }
}
