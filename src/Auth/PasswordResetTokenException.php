<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;

/** 9장 부록 §17-8 — 재설정 링크 상태 */
final class PasswordResetTokenException extends InvalidArgumentException
{
    public function __construct(
        public readonly string $reason,
        string $message,
    ) {
        parent::__construct($message);
    }
}
