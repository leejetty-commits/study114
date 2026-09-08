<?php

declare(strict_types=1);

namespace Study114\Mail;

/**
 * 설정 불완전 시 전송하지 않음 (fail-closed, mail() fallback 없음).
 */
final class DisabledMailTransport implements MailTransport
{
    public function __construct(
        private readonly string $code = 'config_missing',
        private readonly string $summary = 'SMTP configuration is incomplete',
    ) {
    }

    public function send(array $message): MailSendResult
    {
        return MailSendResult::failure($this->code, $this->summary);
    }
}
