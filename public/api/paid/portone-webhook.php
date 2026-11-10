<?php

declare(strict_types=1);

/**
 * 339 — 포트원 V2 웹훅 수신.
 * Standard Webhooks 서명 검증. PORTONE_WEBHOOK_SECRET 없으면 거절.
 * 검증 후 completePortOneByPaymentId(단건 조회·금액 대조·멱등)와 동일 경로.
 */

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Paid\Pg\PortOneWebhookVerifier;
use Study114\Paid\ProviderCheckoutService;

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$verifier = PortOneWebhookVerifier::fromEnv();
if ($verifier === null) {
    http_response_code(503);
    echo json_encode([
        'ok' => false,
        'error' => 'webhook_secret_missing',
        'message' => 'PORTONE_WEBHOOK_SECRET이 없어 웹훅을 받지 않습니다. 로컬은 수동 재조회로 확인하세요.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = file_get_contents('php://input');
if (!is_string($raw) || $raw === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'empty_body'], JSON_UNESCAPED_UNICODE);
    exit;
}

/** @var array<string, string|list<string>|null> $headers */
$headers = [];
foreach ($_SERVER as $key => $value) {
    if (!is_string($key) || !str_starts_with($key, 'HTTP_')) {
        continue;
    }
    $name = strtolower(str_replace('_', '-', substr($key, 5)));
    $headers[$name] = is_string($value) || is_array($value) ? $value : null;
}
// Standard Webhooks 헤더 이름 복원
foreach (['webhook-id' => 'webhook-id', 'webhook-timestamp' => 'webhook-timestamp', 'webhook-signature' => 'webhook-signature'] as $_) {
    // $_SERVER 키가 HTTP_WEBHOOK_ID 형태
}

try {
    $payload = $verifier->verify($raw, $headers);
} catch (Throwable $e) {
    error_log('[portone] webhook verify failed: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_signature'], JSON_UNESCAPED_UNICODE);
    exit;
}

$data = is_array($payload['data'] ?? null) ? $payload['data'] : $payload;
$paymentId = '';
if (isset($data['paymentId'])) {
    $paymentId = trim((string) $data['paymentId']);
} elseif (isset($payload['paymentId'])) {
    $paymentId = trim((string) $payload['paymentId']);
}

$type = (string) ($payload['type'] ?? '');
if ($paymentId === '') {
    http_response_code(200);
    echo json_encode(['ok' => true, 'ignored' => true, 'reason' => 'no_payment_id'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Paid / 결제 완료 계열만 확정. 그 외는 200 무시.
$paidTypes = ['Transaction.Paid', 'Transaction.PayPending', 'PAID'];
$shouldComplete = $type === '' || in_array($type, $paidTypes, true) || str_contains($type, 'Paid');

if (!$shouldComplete) {
    http_response_code(200);
    echo json_encode(['ok' => true, 'ignored' => true, 'type' => $type], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $result = (new ProviderCheckoutService())->completePortOneByPaymentId($paymentId);
    error_log('[portone] webhook complete paymentId=' . $paymentId . ' status=' . ($result['status'] ?? 'none'));
    http_response_code(200);
    echo json_encode([
        'ok' => true,
        'payment_id' => $paymentId,
        'fulfilled' => (bool) ($result['fulfilled'] ?? false),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[portone] webhook complete failed paymentId=' . $paymentId . ' err=' . $e->getMessage());
    // 재시도 유도: 5xx
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'complete_failed'], JSON_UNESCAPED_UNICODE);
}
