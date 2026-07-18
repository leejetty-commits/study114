<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\LoginService;
use Study114\Admin\AdminRoleService;

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

$raw = file_get_contents('php://input');
/** @var array<string, mixed> $input */
$input = json_decode($raw ?: '{}', true);
if (!is_array($input)) {
    $input = $_POST;
}

$email = (string) ($input['email'] ?? '');
$password = (string) ($input['password'] ?? '');

try {
    $user = (new LoginService())->attempt($email, $password);
    $roles = new AdminRoleService();
    AuthSession::login(
        $user['user_id'],
        $user['email'],
        $user['role_type'],
        $user['name'],
        [
            'admin_level' => $user['admin_level'],
            'must_change_password' => $user['must_change_password'],
        ],
    );
    $session = AuthSession::user();
    $effectiveRole = (string) ($session['role_type'] ?? $user['role_type']);
    $adminLevel = $session['admin_level'] ?? $user['admin_level'];
    if ($effectiveRole === 'admin' && $adminLevel === null) {
        $adminLevel = $roles->resolveLevel([
            'user_id' => $user['user_id'],
            'email' => $user['email'],
            'role_type' => 'admin',
        ]);
    }

    echo json_encode([
        'ok' => true,
        'user_id' => $user['user_id'],
        'email' => $user['email'],
        'role_type' => $effectiveRole,
        'name' => $user['name'],
        'admin_level' => $adminLevel,
        'must_change_password' => !empty($session['must_change_password']),
    ], JSON_UNESCAPED_UNICODE);
} catch (InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode([
        'ok'      => false,
        'error'   => 'validation',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[login] error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok'      => false,
        'error'   => 'server_error',
        'message' => '로그인 처리 중 오류가 발생했습니다.',
    ], JSON_UNESCAPED_UNICODE);
}
