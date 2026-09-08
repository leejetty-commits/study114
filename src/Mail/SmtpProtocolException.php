<?php

declare(strict_types=1);

namespace Study114\Mail;

final class SmtpProtocolException extends \RuntimeException
{
    public function __construct(
        public readonly string $codeKey,
        string $safeMessage,
    ) {
        parent::__construct($safeMessage);
    }
}
