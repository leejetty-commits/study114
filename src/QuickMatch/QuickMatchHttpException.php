<?php

declare(strict_types=1);

namespace Study114\QuickMatch;

final class QuickMatchHttpException extends \RuntimeException
{
    /** @param array<string, mixed> $extra */
    public function __construct(
        public readonly int $status,
        public readonly string $error,
        string $message,
        public readonly array $extra = [],
    ) {
        parent::__construct($message);
    }
}
