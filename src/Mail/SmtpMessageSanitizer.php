<?php

declare(strict_types=1);

namespace Study114\Mail;

/** 헤더 인젝션·개행 차단 */
final class SmtpMessageSanitizer
{
    public static function assertSafeMailbox(string $value, string $field): ?string
    {
        // trim 전에 CR/LF 검사 — 끝 개행만 있어도 헤더 인젝션으로 차단
        if (preg_match('/[\r\n]/', $value) === 1) {
            return "{$field} contains CR/LF";
        }
        $value = trim($value);
        if ($value === '') {
            return "{$field} is empty";
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
