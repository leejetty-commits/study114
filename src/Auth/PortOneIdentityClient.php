<?php

declare(strict_types=1);

namespace Study114\Auth;

use RuntimeException;

/**
 * 365 — 포트원 REST V2 본인인증 단건 조회.
 * 로그에 CI·이름·생년·휴대폰·키를 남기지 않는다.
 */
final class PortOneIdentityClient implements PortOneIdentityLookup
{
    private const API_BASE = 'https://api.portone.io';

    public function __construct(
        private readonly string $apiSecret,
    ) {
        if (trim($this->apiSecret) === '') {
            throw new RuntimeException('PORTONE_API_SECRET이 비어 있습니다.');
        }
    }

    public static function fromEnv(): self
    {
        $secret = study114_env('PORTONE_API_SECRET');
        if ($secret === '') {
            throw new RuntimeException('PORTONE_API_SECRET이 없습니다.');
        }

        return new self($secret);
    }

    /**
     * GET /identity-verifications/{id}
     *
     * @return array<string, mixed>
     */
    public function getIdentityVerification(string $identityVerificationId): array
    {
        $id = trim($identityVerificationId);
        if ($id === '') {
            throw new RuntimeException('identityVerificationId가 비어 있습니다.');
        }

        $url = self::API_BASE . '/identity-verifications/' . rawurlencode($id);
        $payload = $this->request('GET', $url);
        $status = (string) ($payload['status'] ?? '');
        error_log(sprintf('[portone-identity] get id_len=%d status=%s', strlen($id), $status));

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    private function request(string $method, string $url): array
    {
        $headers = [
            'Authorization: PortOne ' . $this->apiSecret,
            'Accept: application/json',
        ];

        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            if ($ch === false) {
                throw new RuntimeException('포트원 본인인증 요청 초기화 실패');
            }
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CUSTOMREQUEST => $method,
                CURLOPT_HTTPHEADER => $headers,
                CURLOPT_TIMEOUT => 30,
            ]);
            $raw = curl_exec($ch);
            $http = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if (!is_string($raw)) {
                throw new RuntimeException('포트원 본인인증 응답 없음');
            }

            return $this->decode($http, $raw);
        }

        $context = stream_context_create([
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $headers),
                'timeout' => 30,
                'ignore_errors' => true,
            ],
        ]);
        $raw = file_get_contents($url, false, $context);
        $http = 0;
        if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', (string) $http_response_header[0], $m)) {
            $http = (int) $m[1];
        }
        if (!is_string($raw)) {
            throw new RuntimeException('포트원 본인인증 응답 없음');
        }

        return $this->decode($http, $raw);
    }

    /**
     * @return array<string, mixed>
     */
    private function decode(int $http, string $raw): array
    {
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            throw new RuntimeException('포트원 본인인증 JSON 파싱 실패');
        }
        if ($http < 200 || $http >= 300) {
            throw new RuntimeException('포트원 본인인증 API HTTP ' . $http);
        }

        return $decoded;
    }
}
