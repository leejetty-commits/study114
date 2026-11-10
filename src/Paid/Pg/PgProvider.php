<?php

declare(strict_types=1);

namespace Study114\Paid\Pg;

/**
 * 339 — PG 어댑터 선택 (서버 한 곳).
 * PG_PROVIDER=portone_test 일 때만 포트원. 그 외·미설정은 dev_mock.
 */
final class PgProvider
{
    public const DEV_MOCK = 'dev_mock';
    public const PORTONE_TEST = 'portone_test';

    public static function id(): string
    {
        $raw = getenv('PG_PROVIDER');
        if (!is_string($raw)) {
            return self::DEV_MOCK;
        }
        $value = trim($raw);
        if ($value === self::PORTONE_TEST) {
            return self::PORTONE_TEST;
        }

        return self::DEV_MOCK;
    }

    public static function isPortOneTest(): bool
    {
        return self::id() === self::PORTONE_TEST;
    }

    public static function usesPortOne(string $pgProvider): bool
    {
        return $pgProvider === self::PORTONE_TEST;
    }
}
