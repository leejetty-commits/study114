<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\PasswordResetService;
use Study114\Auth\PasswordResetTokenException;

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

$input = json_decode(file_get_contents('php://input') ?: '{}', true);
if (!is_array($input)) {
    $input = [];
}

$token = (string) ($input['token'] ?? '');
$password = (string) ($input['password'] ?? '');
$confirm = (string) ($input['password_confirm'] ?? '');

try {
    (new PasswordResetService())->resetWithToken($token, $password, $confirm);
    echo json_encode(['ok' => true, 'message' => '비밀번호가 변경되었습니다. 다시 로그인해 주세요.'], JSON_UNESCAPED_UNICODE);
} catch (PasswordResetTokenException $e) {
    http_response_code(422);
    echo json_encode([
        'ok'      => false,
        'error'   => $e->reason,
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
} catch (InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[password/reset] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => '비밀번호 재설정 중 오류가 발생했습니다.'], JSON_UNESCAPED_UNICODE);
}
