<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\PhoneIdentityException;
use Study114\Auth\PhoneIdentityService;

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'POST만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = file_get_contents('php://input');
$raw = is_string($raw) ? $raw : '';
$signature = (string) ($_SERVER['HTTP_X_STUDY114_IDENTITY_SIGNATURE'] ?? '');

try {
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        throw new PhoneIdentityException('invalid_payload', '본인인증 결과를 확인할 수 없습니다.', 422);
    }
    unset($decoded['ci'], $decoded['di'], $decoded['CI'], $decoded['DI']);

    $result = (new PhoneIdentityService())->recordSignedResult($raw, $signature, $decoded);
    echo json_encode(['ok' => true] + $result, JSON_UNESCAPED_UNICODE);
} catch (PhoneIdentityException $e) {
    http_response_code($e->status());
    echo json_encode(['ok' => false, 'error' => $e->errorCode(), 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[phone-identity/callback] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error', 'message' => '본인인증 결과를 저장하지 못했습니다.'], JSON_UNESCAPED_UNICODE);
}
