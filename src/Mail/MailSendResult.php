<?php

declare(strict_types=1);

namespace Study114\Mail;

/** SMTP/전송 결과 — 비밀값·수신 원문 없음 */
final class MailSendResult
{
    public function __construct(
        public readonly bool $ok,
        public readonly string $code,
        public readonly string $safeSummary,
    ) {
    }

    public static function success(string $summary = 'SMTP server accepted the message'): self
    {
        return new self(true, 'smtp_accepted', $summary);
    }

    public static function failure(string $code, string $safeSummary): self
    {
        return new self(false, $code, $safeSummary);
    }
}
