<?php

declare(strict_types=1);

namespace Study114\Board;

use RuntimeException;

/** 게시판 channel ACL 거부 — BoardApi에서 HTTP status로 변환 */
final class BoardAccessException extends RuntimeException
{
    public function __construct(
        public readonly int $httpStatus,
        public readonly string $errorCode,
        string $message,
    ) {
        parent::__construct($message);
    }
}
