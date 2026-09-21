<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\EmailVerificationGate;
use Study114\Auth\PhoneIdentityException;
use Study114\Auth\PhoneIdentityService;

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

$user = AuthSession::userIfActive();
if ($user === null) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'unauthorized', 'message' => '로그인이 필요합니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}
AuthSession::close();

$role = (string) ($user['role_type'] ?? '');
if (!PhoneIdentityService::isProviderRole($role)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'not_provider', 'message' => '공급자 가입 단계에서만 본인인증을 진행합니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    if (!(new EmailVerificationGate())->isVerified((int) $user['user_id'])) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'email_unverified', 'message' => '이메일 확인 후 본인인증을 진행합니다.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $service = new PhoneIdentityService();
    if ($service->mode() === 'off') {
        http_response_code(409);
        echo json_encode(['ok' => false, 'error' => 'identity_mode_off', 'message' => '본인인증 단계가 아직 적용되지 않았습니다.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $state = $service->publicState(
        (int) $user['user_id'],
        $role,
        true,
        false,
        false,
        true,
    );
    if ($state['verified'] === true) {
        echo json_encode([
            'ok' => true,
            'already_verified' => true,
            'message' => '본인인증이 완료되었습니다. 다음 단계로 이동합니다.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(503);
    echo json_encode([
        'ok' => false,
        'error' => 'vendor_not_configured',
        'message' => '본인인증 연결이 아직 준비되지 않았습니다.',
    ], JSON_UNESCAPED_UNICODE);
} catch (PhoneIdentityException $e) {
    http_response_code($e->status());
    echo json_encode(['ok' => false, 'error' => $e->errorCode(), 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[phone-identity/start] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error', 'message' => '본인인증을 시작하지 못했습니다. 다시 시도해 주세요.'], JSON_UNESCAPED_UNICODE);
}
