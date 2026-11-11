<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;

/**
 * 365 — 쪽지 허용 본인인증 오류.
 * code: identity_required | identity_duplicate | identity_invalid | identity_channel
 */
final class IdentityVerificationException extends InvalidArgumentException
{
    public function __construct(
        string $message,
        public readonly string $errorCode = 'identity_invalid',
    ) {
        parent::__construct($message);
    }
}
