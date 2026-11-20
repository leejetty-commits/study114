<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\MarketingConsentService;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
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
    echo json_encode([
        'ok' => false,
        'error' => 'unauthorized',
        'message' => '로그인이 필요합니다.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$userId = (int) $user['user_id'];
$svc = new MarketingConsentService();

try {
    if ($method === 'GET') {
        echo json_encode(['ok' => true] + $svc->get($userId), JSON_UNESCAPED_UNICODE);
        exit;
    }

    $input = json_decode(file_get_contents('php://input') ?: '{}', true);
    if (!is_array($input) || !array_key_exists('marketing_consent', $input)) {
        throw new InvalidArgumentException('수신 여부를 선택해 주세요.');
    }
    $saved = $svc->update($userId, $input['marketing_consent']);
    echo json_encode(array_merge([
        'ok' => true,
        'message' => '이벤트·혜택 정보 수신 설정을 저장했습니다.',
    ], $saved), JSON_UNESCAPED_UNICODE);
} catch (InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'error' => 'validation',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[auth/marketing-consent] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'server_error',
        'message' => '수신 설정 저장 중 오류가 발생했습니다.',
    ], JSON_UNESCAPED_UNICODE);
}
