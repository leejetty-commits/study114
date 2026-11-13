<?php

declare(strict_types=1);

namespace Study114\Media;

use InvalidArgumentException;

/**
 * 홍보·첨부 이미지 검증/처리 오류.
 * 사용자 문구에는 접두어를 넣지 않고, errorCode()로만 구분한다.
 */
final class PromoImageException extends InvalidArgumentException
{
    public const BAD_TYPE = 10;
    public const TOO_LARGE = 11;
    public const GD_MISSING = 12;
    public const WRITE_FAILED = 13;
    public const DB_FAILED = 14;

    public static function badType(string $message): self
    {
        return new self($message, self::BAD_TYPE);
    }

    public static function tooLarge(string $message): self
    {
        return new self($message, self::TOO_LARGE);
    }

    public static function gdMissing(string $message = '지금은 사진을 처리할 수 없어요. 잠시 후 다시 시도해 주세요.'): self
    {
        return new self($message, self::GD_MISSING);
    }

    public static function writeFailed(string $message): self
    {
        return new self($message, self::WRITE_FAILED);
    }

    public static function dbFailed(string $message): self
    {
        return new self($message, self::DB_FAILED);
    }

    public function errorCode(): string
    {
        return match ($this->getCode()) {
            self::BAD_TYPE => 'bad_type',
            self::TOO_LARGE => 'too_large',
            self::GD_MISSING => 'gd_missing',
            self::WRITE_FAILED => 'write_failed',
            self::DB_FAILED => 'db_failed',
            default => 'validation',
        };
    }
}
