<?php

declare(strict_types=1);

namespace Study114\Paid\Pg;

use RuntimeException;

/**
 * 339 — Standard Webhooks 서명 검증 (포트원 V2).
 * 시크릿이 비어 있으면 호출측에서 거절한다.
 */
final class PortOneWebhookVerifier
{
    public function __construct(
        private readonly string $secret,
    ) {
    }

    public static function fromEnv(): ?self
    {
        $secret = getenv('PORTONE_WEBHOOK_SECRET');
        if (!is_string($secret) || trim($secret) === '') {
            return null;
        }

        return new self(trim($secret));
    }

    /**
     * @param array<string, string|list<string>|null> $headers
     * @return array<string, mixed> decoded JSON payload
     */
    public function verify(string $rawBody, array $headers): array
    {
        $msgId = $this->header($headers, 'webhook-id');
        $timestamp = $this->header($headers, 'webhook-timestamp');
        $signatures = $this->header($headers, 'webhook-signature');
        if ($msgId === '' || $timestamp === '' || $signatures === '') {
            throw new RuntimeException('웹훅 서명 헤더가 없습니다.');
        }

        if (!ctype_digit($timestamp)) {
            throw new RuntimeException('웹훅 timestamp가 올바르지 않습니다.');
        }
        $ts = (int) $timestamp;
        $now = time();
        if (abs($now - $ts) > 300) {
            throw new RuntimeException('웹훅 timestamp가 허용 범위를 벗어났습니다.');
        }

        $key = $this->decodeSecret($this->secret);
        $signed = $msgId . '.' . $timestamp . '.' . $rawBody;
        $expected = base64_encode(hash_hmac('sha256', $signed, $key, true));

        $matched = false;
        foreach (preg_split('/\s+/', trim($signatures)) ?: [] as $part) {
            $part = trim($part);
            if ($part === '') {
                continue;
            }
            if (str_starts_with($part, 'v1,')) {
                $part = substr($part, 3);
            }
            if (hash_equals($expected, $part)) {
                $matched = true;
                break;
            }
        }
        if (!$matched) {
            throw new RuntimeException('웹훅 서명 검증 실패');
        }

        $decoded = json_decode($rawBody, true);
        if (!is_array($decoded)) {
            throw new RuntimeException('웹훅 본문 JSON 파싱 실패');
        }

        return $decoded;
    }

    private function decodeSecret(string $secret): string
    {
        $raw = $secret;
        if (str_starts_with($raw, 'whsec_')) {
            $raw = substr($raw, 6);
        }
        $decoded = base64_decode($raw, true);
        if ($decoded === false || $decoded === '') {
            // 일부 환경은 raw secret을 그대로 씀
            return $secret;
        }

        return $decoded;
    }

    /**
     * @param array<string, string|list<string>|null> $headers
     */
    private function header(array $headers, string $name): string
    {
        $want = strtolower($name);
        foreach ($headers as $key => $value) {
            if (strtolower((string) $key) !== $want) {
                continue;
            }
            if (is_array($value)) {
                return trim((string) ($value[0] ?? ''));
            }

            return trim((string) $value);
        }

        // PHP CGI: HTTP_WEBHOOK_ID
        $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        if (isset($_SERVER[$serverKey])) {
            return trim((string) $_SERVER[$serverKey]);
        }

        return '';
    }
}
