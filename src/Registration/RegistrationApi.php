<?php

declare(strict_types=1);

namespace Study114\Registration;

use InvalidArgumentException;
use Study114\Auth\AuthSession;
use Study114\Messages\PaidGateException;
use Throwable;

/** P19~21 등록 허브 JSON API 공통 */
final class RegistrationApi
{
    public static function bootstrap(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
            self::cors();
            header('Access-Control-Allow-Methods: GET, PATCH, OPTIONS');
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

    /** @return array{user_id: int, email: string, role_type: string, name: string} */
    public static function requireAuth(): array
    {
        $auth = AuthSession::user();
        if ($auth === null) {
            self::fail(401, 'unauthorized', '로그인이 필요합니다.');
        }

        return $auth;
    }

    /** @param string|list<string> $allowed */
    public static function requireRole(array $auth, string|array $allowed): void
    {
        $roles = is_array($allowed) ? $allowed : [$allowed];
        if (!in_array($auth['role_type'], $roles, true)) {
            self::fail(403, 'forbidden', '이 역할에서는 이용할 수 없습니다.');
        }
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

    /** @param callable(): void $fn */
    public static function run(callable $fn): void
    {
        try {
            $fn();
        } catch (PaidGateException $e) {
            self::fail(403, 'paid_gate', $e->getMessage());
        } catch (\Study114\Auth\EmailVerificationRequiredException $e) {
            self::fail(403, 'email_verify_required', $e->getMessage());
        } catch (InvalidArgumentException $e) {
            self::fail(422, 'validation', $e->getMessage());
        } catch (Throwable $e) {
            error_log('[registration] ' . $e->getMessage());
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
            'ok'      => false,
            'error'   => $error,
            'message' => $message,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
