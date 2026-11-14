<?php

declare(strict_types=1);

namespace Study114\Admin;

/**
 * 콘솔 2차 비밀번호 결정값. A~E는 여기만 고친다.
 * A 유휴 30분 슬라이딩, B 5회 후 15분 잠금, C admin_level 계정 전부,
 * D 비상코드 없음, E 특수문자 집합.
 */
final class AdminConsolePolicy
{
    public const IDLE_SECONDS = 1800;

    public const LOCK_SECONDS = 900;

    public const MAX_FAILS = 5;

    public const PASSWORD_LENGTH = 6;

    public const SPECIAL_CHARS = '!@#$%^&*?';

    public static function accepts(string $password): bool
    {
        if (strlen($password) !== self::PASSWORD_LENGTH) {
            return false;
        }
        $upper = 0;
        $lower = 0;
        $digit = 0;
        $special = 0;
        $length = strlen($password);
        for ($i = 0; $i < $length; $i++) {
            $ch = $password[$i];
            if ($ch >= 'A' && $ch <= 'Z') {
                $upper++;
            } elseif ($ch >= 'a' && $ch <= 'z') {
                $lower++;
            } elseif ($ch >= '0' && $ch <= '9') {
                $digit++;
            } elseif (str_contains(self::SPECIAL_CHARS, $ch)) {
                $special++;
            } else {
                return false;
            }
        }

        return $upper === 1 && $lower === 1 && $digit === 2 && $special === 2;
    }
}
