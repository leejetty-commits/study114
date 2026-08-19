<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\PhoneVerificationException;
use Study114\Auth\PhoneVerificationService;

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    study114_send_cors_headers();
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'POST만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
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

try {
    $result = (new PhoneVerificationService())->sendOtp((int) $user['user_id']);
    echo json_encode(['ok' => true] + $result, JSON_UNESCAPED_UNICODE);
} catch (PhoneVerificationException $e) {
    $status = $e->errorCode() === 'resend_cooldown' ? 429 : 422;
    http_response_code($status);
    echo json_encode([
        'ok' => false,
        'error' => $e->errorCode(),
        'message' => $e->getMessage(),
        'resend_available_in' => $e->resendAvailableIn(),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[phone/send-otp] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error', 'message' => '인증번호 발송에 실패했습니다.'], JSON_UNESCAPED_UNICODE);
}
