<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;

/** SMS OTP 발송·확인 오류 (API error 코드 매핑) */
final class PhoneVerificationException extends InvalidArgumentException
{
    public function __construct(
        private readonly string $errorCode,
        string $message,
        private readonly int $resendAvailableIn = 0,
    ) {
        parent::__construct($message);
    }

    public function errorCode(): string
    {
        return $this->errorCode;
    }

    public function resendAvailableIn(): int
    {
        return $this->resendAvailableIn;
    }
}
