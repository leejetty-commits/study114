<?php

declare(strict_types=1);

namespace Study114\Support;

use InvalidArgumentException;
use Throwable;

/** P17 고객센터 JSON API 공통 */
final class SupportApi
{
    public static function bootstrap(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
            self::cors();
            header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type');
            http_response_code(204);
            exit;
        }

        self::cors();
    }

    public static function cors(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
        header('Access-Control-Allow-Origin: ' . ($origin !== '' ? $origin : '*'));
        header('Access-Control-Allow-Credentials: true');
    }

    /** @return array<string, mixed> */
    public static function readJson(): array
    {
        $raw = file_get_contents('php://input');
        /** @var mixed $decoded */
        $decoded = json_decode($raw ?: '{}', true);
        if (!is_array($decoded)) {
            self::fail(400, 'invalid_json', 'JSON 본문이 필요합니다.');
        }

        return $decoded;
    }

    public static function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public static function queryInt(string $key, int $default = 0): int
    {
        return isset($_GET[$key]) ? (int) $_GET[$key] : $default;
    }

    public static function queryString(string $key, ?string $default = null): ?string
    {
        $val = $_GET[$key] ?? $default;
        if ($val === null) {
            return null;
        }

        $out = trim((string) $val);
        return $out === '' ? $default : $out;
    }

    /** @param callable(): void $fn */
    public static function run(callable $fn): void
    {
        try {
            $fn();
        } catch (InvalidArgumentException $e) {
            self::fail(422, 'validation', $e->getMessage());
        } catch (Throwable $e) {
            error_log('[support] ' . $e->getMessage());
            self::fail(500, 'server_error', $e->getMessage());
        }
    }

    /** @param array<string, mixed> $data */
    public static function ok(array $data = []): never
    {
        echo json_encode(['ok' => true] + $data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function fail(int $status, string $error, string $message): never
    {
        http_response_code($status);
        echo json_encode([
            'ok' => false,
            'error' => $error,
            'message' => $message,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
