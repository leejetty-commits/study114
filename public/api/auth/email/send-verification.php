<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\EmailVerificationService;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    study114_send_cors_headers();
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'POST만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

study114_send_cors_headers();

$user = AuthSession::user();
if ($user === null) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => '로그인이 필요합니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $result = (new EmailVerificationService())->sendVerification((int) $user['user_id']);
    echo json_encode([
        'ok'      => true,
        'sent'    => !empty($result['sent']),
        'already_verified' => !empty($result['already_verified']),
        'resend_available_in' => (int) ($result['resend_available_in'] ?? 0),
        'message' => !empty($result['already_verified'])
            ? '이미 이메일이 확인되었습니다.'
            : (!empty($result['sent'])
                ? '확인 메일을 보냈습니다. 메일함에서 링크를 확인해 주세요.'
                : '확인 메일은 잠시 후 다시 보낼 수 있습니다.'),
    ], JSON_UNESCAPED_UNICODE);
} catch (InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[email/send-verification] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => '인증 메일 발송 중 오류가 발생했습니다.'], JSON_UNESCAPED_UNICODE);
}
