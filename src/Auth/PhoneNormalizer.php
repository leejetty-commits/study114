<?php

declare(strict_types=1);

namespace Study114\Auth;

final class PhoneNormalizer
{
    /** 숫자만 남긴 휴대폰 번호 (비교·검증용). */
    public static function digits(string $phone): string
    {
        return preg_replace('/\D+/', '', $phone) ?? '';
    }

    /** 한국 휴대폰 10~11자리(01로 시작) 여부. */
    public static function isValidMobile(string $phone): bool
    {
        $digits = self::digits($phone);

        return (bool) preg_match('/^01[016789]\d{7,8}$/', $digits);
    }
}
