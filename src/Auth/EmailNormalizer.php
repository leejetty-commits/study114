<?php

declare(strict_types=1);

namespace Study114\Auth;

final class EmailNormalizer
{
    /** 저장·정확 일치용: 소문자·trim만. */
    public static function normalize(string $email): string
    {
        return strtolower(trim($email));
    }

    /**
     * 중복 판정용 canonical.
     * Gmail(gmail.com·googlemail.com): +뒤 제거 · 점 제거 · 도메인 gmail.com 통일.
     * 그 외 도메인: normalize와 동일 (이번 범위 Gmail만).
     */
    public static function canonical(string $email): string
    {
        $normalized = self::normalize($email);
        $at = strrpos($normalized, '@');
        if ($at === false || $at === 0) {
            return $normalized;
        }

        $local = substr($normalized, 0, $at);
        $domain = substr($normalized, $at + 1);
        if ($domain !== 'gmail.com' && $domain !== 'googlemail.com') {
            return $normalized;
        }

        $plus = strpos($local, '+');
        if ($plus !== false) {
            $local = substr($local, 0, $plus);
        }
        $local = str_replace('.', '', $local);

        return $local . '@gmail.com';
    }

    public static function isGmailFamily(string $email): bool
    {
        $normalized = self::normalize($email);
        $at = strrpos($normalized, '@');
        if ($at === false) {
            return false;
        }
        $domain = substr($normalized, $at + 1);

        return $domain === 'gmail.com' || $domain === 'googlemail.com';
    }
}
