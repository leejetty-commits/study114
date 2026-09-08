<?php

declare(strict_types=1);

namespace Study114\Board;

use InvalidArgumentException;
use Study114\Auth\AuthSession;
use Study114\Auth\EmailVerificationGate;
use Study114\Auth\EmailVerificationRequiredException;
use Throwable;

/** P23 게시판 엔진 JSON API 공통 */
final class BoardApi
{
    public static function bootstrap(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
            self::cors();
            header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type');
            http_response_code(204);
            exit;
        }

        self::cors();
    }

    public static function cors(): void
    {
        study114_send_cors_headers();
    }

    /**
     * 쓰기·보호 액션 — 로그인 + email_verified_at 필수.
     *
     * @return array{user_id: int, email: string, role_type: string, name: string}
     */
    public static function requireAuth(): array
    {
        $auth = AuthSession::user();
        if ($auth === null) {
            self::fail(401, 'unauthorized', '로그인이 필요합니다.');
        }
        (new EmailVerificationGate())->assertVerified((int) $auth['user_id']);

        return $auth;
    }

    /**
     * 공개 GET용. 미확인 세션은 게스트로 취급.
     *
     * @return array{user_id?: int}|null
     */
    public static function optionalVerifiedAuth(): ?array
    {
        return (new EmailVerificationGate())->optionalVerifiedUser(AuthSession::user());
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
        } catch (EmailVerificationRequiredException $e) {
            self::fail(403, 'email_verify_required', $e->getMessage());
        } catch (BoardAccessException $e) {
            self::fail($e->httpStatus, $e->errorCode, $e->getMessage());
        } catch (InvalidArgumentException $e) {
            self::fail(422, 'validation', $e->getMessage());
        } catch (Throwable $e) {
            error_log('[board] ' . $e->getMessage());
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
