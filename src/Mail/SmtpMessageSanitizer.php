<?php

declare(strict_types=1);

namespace Study114\Mail;

/** 헤더 인젝션·개행 차단 */
final class SmtpMessageSanitizer
{
    public static function assertSafeMailbox(string $value, string $field): ?string
    {
        $value = trim($value);
        if ($value === '') {
            return "{$field} is empty";
        }
        if (preg_match('/[\r\n]/', $value) === 1) {
            return "{$field} contains CR/LF";
        }
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            return "{$field} is not a valid email";
        }

        return null;
    }

    public static function assertSafeHeaderText(string $value, string $field): ?string
    {
        if (preg_match('/[\r\n]/', $value) === 1) {
            return "{$field} contains CR/LF";
        }

        return null;
    }

    public static function encodeHeader(string $value): string
    {
        return '=?UTF-8?B?' . base64_encode($value) . '?=';
    }
}
