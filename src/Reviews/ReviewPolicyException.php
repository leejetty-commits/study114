<?php

declare(strict_types=1);

namespace Study114\Reviews;

use InvalidArgumentException;

final class ReviewPolicyException extends InvalidArgumentException
{
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly int $httpStatus = 422,
        /** @var array<string, mixed> */
        public readonly array $extra = [],
    ) {
        parent::__construct($message);
    }
}
