<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\OAuthRoleService;

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
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'POST만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');

$user = AuthSession::user();
if ($user === null) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'unauthenticated', 'message' => '로그인이 필요합니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = file_get_contents('php://input');
/** @var array<string, mixed> $input */
$input = json_decode($raw ?: '{}', true);
if (!is_array($input)) {
    $input = $_POST;
}

$roleUi = (string) ($input['role'] ?? '');

try {
    $result = (new OAuthRoleService())->completeRole((int) $user['user_id'], $roleUi);
    AuthSession::login(
        (int) $user['user_id'],
        $user['email'],
        $result['role_type'],
        $user['name'],
    );

    echo json_encode([
        'ok'                   => true,
        'role_type'            => $result['role_type'],
        'needs_basic_register' => $result['needs_basic_register'],
    ], JSON_UNESCAPED_UNICODE);
} catch (InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'validation', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[oauth/complete-role] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error', 'message' => '회원 구분 저장 중 오류가 발생했습니다.'], JSON_UNESCAPED_UNICODE);
}
