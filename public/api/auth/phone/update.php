<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\EmailVerificationGate;
use Study114\Auth\EmailVerificationRequiredException;
use Study114\Auth\PhoneVerificationException;
use Study114\Auth\PhoneVerificationService;
use Study114\Auth\ProviderIdentityGate;

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    study114_send_cors_headers();
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if (!in_array($method, ['GET', 'POST'], true)) {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'GET · POST만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

study114_send_cors_headers();

$user = AuthSession::user();
if ($user === null) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'unauthorized', 'message' => '로그인이 필요합니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}
AuthSession::close();

$userId = (int) $user['user_id'];
$roleType = (string) ($user['role_type'] ?? '');
try {
    (new EmailVerificationGate())->assertVerified($userId);
} catch (EmailVerificationRequiredException $e) {
    http_response_code(403);
    echo json_encode([
        'ok' => false,
        'error' => 'email_verify_required',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
$svc = new PhoneVerificationService();

if ($method === 'GET') {
    $status = $svc->status($userId);
    echo json_encode(['ok' => true] + $status, JSON_UNESCAPED_UNICODE);
    exit;
}

$gate = new ProviderIdentityGate();
if (!$gate->isProviderRole($roleType)) {
    http_response_code(403);
    echo json_encode([
        'ok' => false,
        'error' => 'forbidden',
        'message' => '휴대폰 번호 변경은 공급자 계정설정에서만 할 수 있습니다.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = file_get_contents('php://input');
/** @var mixed $decoded */
$decoded = json_decode($raw ?: '{}', true);
$phone = is_array($decoded) ? (string) ($decoded['phone'] ?? '') : '';

try {
    $result = $svc->changePhone($userId, $phone);
    echo json_encode(['ok' => true] + $result, JSON_UNESCAPED_UNICODE);
} catch (PhoneVerificationException $e) {
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'error' => $e->errorCode(),
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[phone/update] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error', 'message' => '휴대폰 번호 저장에 실패했습니다.'], JSON_UNESCAPED_UNICODE);
}
