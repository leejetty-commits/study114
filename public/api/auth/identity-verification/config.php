<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
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
AuthSession::close();
if ($user === null) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'unauthorized', 'message' => '로그인이 필요합니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!IdentityVerificationService::isProviderRole((string) ($user['role_type'] ?? ''))) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'forbidden', 'message' => '공급자만 이용할 수 있습니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$storeId = study114_env('PORTONE_STORE_ID');
$channelKey = study114_env('PORTONE_IDENTITY_CHANNEL_KEY');
if ($storeId === '' || $channelKey === '') {
    http_response_code(503);
    echo json_encode([
        'ok' => false,
        'error' => 'identity_channel',
        'message' => '본인인증 채널이 준비되지 않았습니다.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$svc = new IdentityVerificationService();
$status = $svc->publicStatus((int) $user['user_id']);

echo json_encode([
    'ok' => true,
    'store_id' => $storeId,
    'channel_key' => $channelKey,
    'identity' => $status,
], JSON_UNESCAPED_UNICODE);
