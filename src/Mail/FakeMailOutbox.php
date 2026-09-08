<?php

declare(strict_types=1);

namespace Study114\Mail;

/**
 * STUDY114_MAIL_TRANSPORT=fake 전용 outbox (비운영만).
 * STUDY114_APP_ENV=production 이면 transport와 무관하게 비활성 — 본문·토큰 파일 생성 금지.
 */
final class FakeMailOutbox
{
    public static function isEnabled(): bool
    {
        if (self::appEnv() === 'production') {
            return false;
        }

        return self::mailTransport() === 'fake';
    }

    private static function appEnv(): string
    {
        $env = '';
        if (function_exists('study114_env')) {
            $env = strtolower(trim(study114_env('STUDY114_APP_ENV', '')));
        }
        if ($env === '' && isset($_ENV['STUDY114_APP_ENV'])) {
            $env = strtolower(trim((string) $_ENV['STUDY114_APP_ENV']));
        }
        if ($env === '' && isset($_SERVER['STUDY114_APP_ENV'])) {
            $env = strtolower(trim((string) $_SERVER['STUDY114_APP_ENV']));
        }

        return $env;
    }

    private static function mailTransport(): string
    {
        $mode = '';
        if (function_exists('study114_env')) {
            $mode = strtolower(trim(study114_env('STUDY114_MAIL_TRANSPORT', '')));
        }
        if ($mode === '' && isset($_ENV['STUDY114_MAIL_TRANSPORT'])) {
            $mode = strtolower(trim((string) $_ENV['STUDY114_MAIL_TRANSPORT']));
        }
        if ($mode === '' && isset($_SERVER['STUDY114_MAIL_TRANSPORT'])) {
            $mode = strtolower(trim((string) $_SERVER['STUDY114_MAIL_TRANSPORT']));
        }

        return $mode;
    }

    public static function path(): string
    {
        if (function_exists('study114_env')) {
            $custom = study114_env('STUDY114_MAIL_FAKE_OUTBOX', '');
            if ($custom !== '') {
                return $custom;
            }
        }

        return dirname(__DIR__, 2) . '/storage/logs/mail-fake-outbox.jsonl';
    }

    /** @param array<string, mixed> $message */
    public static function record(array $message): void
    {
        if (!self::isEnabled()) {
            return;
        }
        $path = self::path();
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        $row = [
            'ts' => date('c'),
            'to' => (string) ($message['to'] ?? ''),
            'from_email' => (string) ($message['from_email'] ?? ''),
            'subject' => (string) ($message['subject'] ?? ''),
            'body' => (string) ($message['body'] ?? ''),
            'html_body' => is_string($message['html_body'] ?? null) ? (string) $message['html_body'] : null,
        ];
        file_put_contents($path, json_encode($row, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
    }

    public static function clear(): void
    {
        $path = self::path();
        if (is_file($path)) {
            @unlink($path);
        }
    }

    /** @return array<string, mixed>|null */
    public static function last(): ?array
    {
        if (!self::isEnabled()) {
            return null;
        }
        $path = self::path();
        if (!is_file($path)) {
            return null;
        }
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false || $lines === []) {
            return null;
        }
        $decoded = json_decode((string) $lines[array_key_last($lines)], true);

        return is_array($decoded) ? $decoded : null;
    }
}
