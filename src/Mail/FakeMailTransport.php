<?php

declare(strict_types=1);

namespace Study114\Mail;

/**
 * 테스트·설정 누락용 — 실제 네트워크 없음.
 * STUDY114_MAIL_TRANSPORT=fake 일 때만 Factory가 사용.
 */
final class FakeMailTransport implements MailTransport
{
    /** @var 'success'|'auth_failed'|'connect_failed'|'timeout'|'reject' */
    private string $mode;

    public function __construct(string $mode = 'success')
    {
        $this->mode = $mode;
    }

    public function send(array $message): MailSendResult
    {
        return match ($this->mode) {
            'success' => MailSendResult::success('fake transport accepted message'),
            'auth_failed' => MailSendResult::failure('auth_failed', 'SMTP authentication failed'),
            'connect_failed' => MailSendResult::failure('connect_failed', 'Could not connect to SMTP host'),
            'timeout' => MailSendResult::failure('timeout', 'SMTP connection timed out'),
            default => MailSendResult::failure('smtp_rejected', 'SMTP server rejected the message'),
        };
    }
}
