<?php

declare(strict_types=1);

namespace Study114\Auth;

/** 아이디 찾기용 이메일 마스킹 (로컬파트 일부만 노출). */
final class EmailMasker
{
    public static function mask(string $email): string
    {
        $email = EmailNormalizer::normalize($email);
        $at = strrpos($email, '@');
        if ($at === false || $at === 0) {
            return '***';
        }

        $local = substr($email, 0, $at);
        $domain = substr($email, $at + 1);
        if ($domain === '') {
            return '***';
        }

        $len = strlen($local);
        if ($len <= 1) {
            $maskedLocal = '*';
        } elseif ($len === 2) {
            $maskedLocal = $local[0] . '*';
        } else {
            $maskedLocal = substr($local, 0, 2) . str_repeat('*', min(4, $len - 2));
        }

        return $maskedLocal . '@' . $domain;
    }
}
