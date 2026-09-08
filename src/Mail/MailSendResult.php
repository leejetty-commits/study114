<?php

declare(strict_types=1);

namespace Study114\Mail;

/** 전송 결과 — 비밀값·수신 원문·API Key 없음 */
final class MailSendResult
{
    public function __construct(
        public readonly bool $ok,
        public readonly string $code,
        public readonly string $safeSummary,
        public readonly ?string $providerMessageId = null,
    ) {
    }

    public static function success(
        string $summary = 'Resend accepted the message',
        ?string $providerMessageId = null,
    ): self {
        return new self(true, 'resend_accepted', $summary, $providerMessageId);
    }

    public static function failure(string $code, string $safeSummary): self
    {
        return new self(false, $code, $safeSummary, null);
    }
}
