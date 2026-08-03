<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\AccountWithdrawService;
use Study114\Auth\AuthSession;

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'POST만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');

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

$input = json_decode(file_get_contents('php://input') ?: '{}', true);
if (!is_array($input)) {
    $input = [];
}

$confirmText = (string) ($input['confirm_text'] ?? '');

try {
    $svc = new AccountWithdrawService();
    $result = $svc->withdraw((int) $user['user_id'], $confirmText);
    AuthSession::logout();

    echo json_encode([
        'ok' => true,
        'withdrawn' => true,
        'user_id' => $result['user_id'],
        'message' => '회원탈퇴가 완료되었습니다.',
    ], JSON_UNESCAPED_UNICODE);
} catch (InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'error' => 'validation',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'withdraw_failed',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
