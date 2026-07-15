<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\PasswordChangeService;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'POST만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');

$user = AuthSession::user();
if ($user === null) {
    http_response_code(401);
    echo json_encode([
        'ok'      => false,
        'error'   => 'unauthorized',
        'message' => '로그인이 필요합니다.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$input = json_decode(file_get_contents('php://input') ?: '{}', true);
if (!is_array($input)) {
    $input = [];
}

$current = (string) ($input['current_password'] ?? '');
$password = (string) ($input['password'] ?? '');
$confirm = (string) ($input['password_confirm'] ?? '');

try {
    (new PasswordChangeService())->change((int) $user['user_id'], $current, $password, $confirm);
    echo json_encode([
        'ok'      => true,
        'message' => '비밀번호가 변경되었습니다.',
    ], JSON_UNESCAPED_UNICODE);
} catch (InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode([
        'ok'      => false,
        'error'   => 'validation',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[password/change] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok'      => false,
        'message' => '비밀번호 변경 중 오류가 발생했습니다.',
    ], JSON_UNESCAPED_UNICODE);
}
