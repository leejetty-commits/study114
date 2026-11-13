<?php

declare(strict_types=1);

namespace Study114\Paid\Pg;

use RuntimeException;

/**
 * 339 — 포트원 REST V2 클라이언트 (로컬·테스트 채널용).
 * 로그에는 paymentId·상태·금액만 남긴다. 키·헤더·카드정보는 남기지 않는다.
 */
final class PortOneClient implements PortOneApi
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
        $secret = getenv('PORTONE_API_SECRET');
        if (!is_string($secret) || trim($secret) === '') {
            throw new RuntimeException('PORTONE_API_SECRET이 없습니다.');
        }

        return new self(trim($secret));
    }

    /**
     * GET /payments/{paymentId}
     *
     * @return array<string, mixed>
     */
    public function getPayment(string $paymentId): array
    {
        $paymentId = trim($paymentId);
        if ($paymentId === '') {
            throw new RuntimeException('paymentId가 비어 있습니다.');
        }

        $url = self::API_BASE . '/payments/' . rawurlencode($paymentId);
        $payload = $this->request('GET', $url, null);
        $status = (string) ($payload['status'] ?? '');
        $total = $this->extractTotalAmount($payload);
        self::logSafe('getPayment', $paymentId, $status, $total);

        return $payload;
    }

    /**
     * POST /payments/{paymentId}/cancel
     *
     * @return array{cancel_id: string, cancelled_at: string|null, cancel_amount_won: int, remaining_won: int, raw: array<string, mixed>}
     */
    public function cancelPayment(string $paymentId, int $amountWon, string $reason, ?int $currentCancellableAmount = null): array
    {
        $paymentId = trim($paymentId);
        if ($paymentId === '' || $amountWon <= 0) {
            throw new RuntimeException('취소 paymentId·금액이 올바르지 않습니다.');
        }

        $body = [
            'reason' => $reason !== '' ? $reason : '환불',
            'amount' => $amountWon,
        ];
        if ($currentCancellableAmount !== null && $currentCancellableAmount >= 0) {
            $body['currentCancellableAmount'] = $currentCancellableAmount;
        }

        $url = self::API_BASE . '/payments/' . rawurlencode($paymentId) . '/cancel';
        $payload = $this->request('POST', $url, $body);

        $cancellation = is_array($payload['cancellation'] ?? null) ? $payload['cancellation'] : [];
        $cancelId = (string) ($cancellation['id'] ?? $payload['cancellationId'] ?? '');
        $cancelledAt = isset($cancellation['cancelledAt'])
            ? (string) $cancellation['cancelledAt']
            : (isset($cancellation['requestedAt']) ? (string) $cancellation['requestedAt'] : null);
        $cancelAmount = isset($cancellation['totalAmount'])
            ? (int) $cancellation['totalAmount']
            : $amountWon;

        $paymentAfter = $this->getPayment($paymentId);
        $remaining = $this->extractCancellableAmount($paymentAfter);

        self::logSafe('cancelPayment', $paymentId, (string) ($cancellation['status'] ?? 'ok'), $cancelAmount);

        return [
            'cancel_id' => $cancelId !== '' ? $cancelId : ('cancel-' . $paymentId . '-' . time()),
            'cancelled_at' => $cancelledAt,
            'cancel_amount_won' => $cancelAmount,
            'remaining_won' => max(0, $remaining),
            'raw' => $payload,
        ];
    }

    /**
     * @param array<string, mixed>|null $jsonBody
     * @return array<string, mixed>
     */
    private function request(string $method, string $url, ?array $jsonBody): array
    {
        $headers = [
            'Authorization: PortOne ' . $this->apiSecret,
            'Content-Type: application/json',
            'Accept: application/json',
        ];

        if (function_exists('curl_init')) {
            return $this->requestCurl($method, $url, $headers, $jsonBody);
        }

        return $this->requestStream($method, $url, $headers, $jsonBody);
    }

    /**
     * @param list<string> $headers
     * @param array<string, mixed>|null $jsonBody
     * @return array<string, mixed>
     */
    private function requestCurl(string $method, string $url, array $headers, ?array $jsonBody): array
    {
        $ch = curl_init($url);
        if ($ch === false) {
            throw new RuntimeException('포트원 요청 초기화 실패');
        }
        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 30,
        ];
        if ($jsonBody !== null) {
            $opts[CURLOPT_POSTFIELDS] = json_encode($jsonBody, JSON_UNESCAPED_UNICODE);
        }
        curl_setopt_array($ch, $opts);
        $raw = curl_exec($ch);
        $http = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);
        if (!is_string($raw)) {
            throw new RuntimeException('포트원 응답 없음' . ($err !== '' ? (': ' . $err) : ''));
        }

        return $this->decodeResponse($http, $raw);
    }

    /**
     * @param list<string> $headers
     * @param array<string, mixed>|null $jsonBody
     * @return array<string, mixed>
     */
    private function requestStream(string $method, string $url, array $headers, ?array $jsonBody): array
    {
        $content = $jsonBody !== null ? json_encode($jsonBody, JSON_UNESCAPED_UNICODE) : null;
        $context = stream_context_create([
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $headers),
                'content' => $content ?? '',
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
            throw new RuntimeException('포트원 응답 없음');
        }

        return $this->decodeResponse($http, $raw);
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeResponse(int $http, string $raw): array
    {
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            throw new RuntimeException('포트원 응답 JSON 파싱 실패 http=' . $http);
        }
        if ($http < 200 || $http >= 300) {
            $type = (string) ($decoded['type'] ?? $decoded['code'] ?? 'error');
            $message = (string) ($decoded['message'] ?? '포트원 API 오류');
            throw new RuntimeException('포트원 API ' . $http . ' ' . $type . ': ' . $message);
        }

        return $decoded;
    }

    /** @param array<string, mixed> $payment */
    public function extractTotalAmount(array $payment): int
    {
        $amount = $payment['amount'] ?? null;
        if (is_array($amount) && isset($amount['total'])) {
            return (int) $amount['total'];
        }

        return (int) ($payment['totalAmount'] ?? 0);
    }

    /** @param array<string, mixed> $payment */
    public function extractCurrency(array $payment): string
    {
        $amount = $payment['amount'] ?? null;
        if (is_array($amount) && isset($amount['currency'])) {
            return strtoupper((string) $amount['currency']);
        }
        $currency = (string) ($payment['currency'] ?? 'KRW');

        return strtoupper(str_replace('CURRENCY_', '', $currency));
    }

    /** @param array<string, mixed> $payment */
    public function extractCancellableAmount(array $payment): int
    {
        $amount = $payment['amount'] ?? null;
        if (is_array($amount)) {
            if (isset($amount['remainingPayment'])) {
                return (int) $amount['remainingPayment'];
            }
            if (isset($amount['cancelled'])) {
                $total = (int) ($amount['total'] ?? 0);
                $cancelled = (int) $amount['cancelled'];

                return max(0, $total - $cancelled);
            }
            if (isset($amount['total'])) {
                return (int) $amount['total'];
            }
        }

        return 0;
    }

    private static function logSafe(string $op, string $paymentId, string $status, int $amountWon): void
    {
        error_log(sprintf(
            '[portone] op=%s paymentId=%s status=%s amount=%d',
            $op,
            $paymentId,
            $status,
            $amountWon,
        ));
    }
}
