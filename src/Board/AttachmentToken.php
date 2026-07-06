<?php

declare(strict_types=1);

namespace Study114\Board;

use InvalidArgumentException;

/** 단기 다운로드 토큰 (직접 스토리지 URL 노출 방지) */
final class AttachmentToken
{
    /** @param array<string, mixed> $payload */
    public static function issue(array $payload, string $secret, int $ttlSeconds): string
    {
        $payload['exp'] = time() + $ttlSeconds;
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            throw new InvalidArgumentException('토큰 생성에 실패했습니다.');
        }
        $body = self::base64UrlEncode($json);
        $sig = hash_hmac('sha256', $body, $secret, true);

        return $body . '.' . self::base64UrlEncode($sig);
    }

    /** @return array<string, mixed> */
    public static function verify(string $token, string $secret): array
    {
        $parts = explode('.', $token, 2);
        if (count($parts) !== 2) {
            throw new InvalidArgumentException('유효하지 않은 토큰입니다.');
        }
        [$body, $sig] = $parts;
        $expected = self::base64UrlEncode(hash_hmac('sha256', $body, $secret, true));
        if (!hash_equals($expected, $sig)) {
            throw new InvalidArgumentException('토큰 서명이 올바르지 않습니다.');
        }

        $json = self::base64UrlDecode($body);
        /** @var mixed $payload */
        $payload = json_decode($json, true);
        if (!is_array($payload)) {
            throw new InvalidArgumentException('토큰 페이로드가 올바르지 않습니다.');
        }
        $exp = (int) ($payload['exp'] ?? 0);
        if ($exp < time()) {
            throw new InvalidArgumentException('다운로드 토큰이 만료되었습니다.');
        }

        return $payload;
    }

    private static function base64UrlEncode(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $encoded): string
    {
        $pad = 4 - (strlen($encoded) % 4);
        if ($pad < 4) {
            $encoded .= str_repeat('=', $pad);
        }
        $decoded = base64_decode(strtr($encoded, '-_', '+/'), true);
        if ($decoded === false) {
            throw new InvalidArgumentException('토큰 디코딩에 실패했습니다.');
        }

        return $decoded;
    }
}
