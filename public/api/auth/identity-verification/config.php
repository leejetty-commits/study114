<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\IdentityVerificationException;
use Study114\Auth\IdentityVerificationService;

header('Content-Type: application/json; charset=utf-8');
study114_send_cors_headers();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'GET만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$user = AuthSession::user();
if ($user === null) {
    AuthSession::close();
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'unauthorized', 'message' => '로그인이 필요합니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!IdentityVerificationService::isProviderRole((string) ($user['role_type'] ?? ''))) {
    AuthSession::close();
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'forbidden', 'message' => '공급자만 이용할 수 있습니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$svc = new IdentityVerificationService();
$status = $svc->publicStatus((int) $user['user_id']);

try {
    $issued = $svc->issuePendingVerification($user);
} catch (IdentityVerificationException $e) {
    AuthSession::close();
    $code = $e->errorCode;
    $http = match ($code) {
        'identity_pepper', 'identity_channel' => 503,
        default => 422,
    };
    http_response_code($http);
    echo json_encode([
        'ok' => false,
        'error' => $code,
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

AuthSession::close();

echo json_encode([
    'ok' => true,
    'store_id' => $issued['store_id'],
    'channel_key' => $issued['channel_key'],
    'identity_verification_id' => $issued['identity_verification_id'],
    'customer_id' => $issued['customer_id'],
    'identity' => $status,
], JSON_UNESCAPED_UNICODE);
