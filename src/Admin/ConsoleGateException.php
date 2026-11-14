<?php

declare(strict_types=1);

namespace Study114\Admin;

/** 콘솔 잠금해제 거절. 메시지에 비밀번호·해시를 넣지 않는다. */
final class ConsoleGateException extends \RuntimeException
{
    public function __construct(
        public readonly int $httpStatus,
        public readonly string $error,
        string $message,
    ) {
        parent::__construct($message);
    }
}
