<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\EmailVerificationGate;
use Study114\Auth\IdentityVerificationException;
use Study114\Auth\IdentityVerificationService;

header('Content-Type: application/json; charset=utf-8');
study114_send_cors_headers();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'POST만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$user = AuthSession::user();
if ($user === null) {
    AuthSession::close();
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'unauthorized', 'message' => '로그인이 필요합니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}
// 세션은 complete에서 pending 대조·삭제에 필요 — close는 성공/실패 후

try {
    (new EmailVerificationGate())->assertVerified((int) $user['user_id']);
} catch (\Study114\Auth\EmailVerificationRequiredException $e) {
    AuthSession::close();
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'email_verify_required', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = file_get_contents('php://input');
/** @var mixed $decoded */
$decoded = json_decode($raw ?: '{}', true);
if (!is_array($decoded)) {
    AuthSession::close();
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_json', 'message' => 'JSON 본문이 필요합니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$id = (string) ($decoded['identityVerificationId'] ?? $decoded['identity_verification_id'] ?? '');

try {
    $svc = new IdentityVerificationService();
    $status = $svc->completeFromPortOne($user, $id);
    AuthSession::close();
    echo json_encode(['ok' => true, 'identity' => $status], JSON_UNESCAPED_UNICODE);
} catch (IdentityVerificationException $e) {
    AuthSession::close();
    $code = $e->errorCode;
    $http = match ($code) {
        'identity_duplicate' => 409,
        'identity_required' => 403,
        'identity_channel', 'identity_pepper' => 503,
        'identity_replay' => 409,
        default => 422,
    };
    http_response_code($http);
    echo json_encode([
        'ok' => false,
        'error' => $code,
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    AuthSession::close();
    error_log('[identity-complete] ' . get_class($e));
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'server_error',
        'message' => '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    ], JSON_UNESCAPED_UNICODE);
}
