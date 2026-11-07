<?php

declare(strict_types=1);

namespace Study114\Auth;

use RuntimeException;

final class LoginRateLimitException extends RuntimeException
{
    public function __construct(
        private readonly int $retryAfterSeconds,
        string $message = '',
    ) {
        parent::__construct($message !== '' ? $message : self::passwordMessage($retryAfterSeconds));
    }

    public function retryAfterSeconds(): int
    {
        return max(1, $this->retryAfterSeconds);
    }

    public static function forPassword(int $retryAfterSeconds): self
    {
        return new self($retryAfterSeconds, self::passwordMessage($retryAfterSeconds));
    }

    public static function forOAuth(int $retryAfterSeconds): self
    {
        return new self($retryAfterSeconds, self::oauthMessage($retryAfterSeconds));
    }

    public static function passwordMessage(int $retryAfterSeconds): string
    {
        $minutes = self::retryMinutes($retryAfterSeconds);

        return "로그인 실패가 잦아 보안상 잠시 막았습니다. 약 {$minutes}분 후에 다시 시도해 주세요.";
    }

    public static function oauthMessage(int $retryAfterSeconds): string
    {
        $minutes = self::retryMinutes($retryAfterSeconds);

        return "요청이 잦아 보안상 잠시 막았습니다. 약 {$minutes}분 후에 다시 시도해 주세요.";
    }

    private static function retryMinutes(int $retryAfterSeconds): int
    {
        return max(1, (int) ceil(max(1, $retryAfterSeconds) / 60));
    }
}
