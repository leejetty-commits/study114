<?php

declare(strict_types=1);

namespace Study114\Auth;

use RuntimeException;

/** 휴대폰 본인확인(PASS/KMC/NICE/PG) 전용. SMS OTP 예외와 섞지 않는다. */
final class PhoneIdentityException extends RuntimeException
{
    public function __construct(
        private readonly string $errorCode,
        string $message,
        private readonly int $status = 422,
    ) {
        parent::__construct($message);
    }

    public function errorCode(): string
    {
        return $this->errorCode;
    }

    public function status(): int
    {
        return $this->status;
    }
}
