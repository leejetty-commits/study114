<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'GET만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');

$user = AuthSession::user();
if ($user === null) {
    echo json_encode(['ok' => true, 'authenticated' => false], JSON_UNESCAPED_UNICODE);
    exit;
}

$roles = new \Study114\Admin\AdminRoleService();
$flags = $roles->fetchAuthFlags((int) $user['user_id']);
$adminLevel = $flags['admin_level'] ?? ($user['admin_level'] ?? null);
$mustChange = $flags['must_change_password'] ?? !empty($user['must_change_password']);

// bootstrap: DB admin_level 있을 때만 admin으로 표시
if (($user['role_type'] ?? '') !== 'admin' && $adminLevel !== null
    && $roles->isBootstrapSuperAdminEmail((string) $user['email'])) {
    $user['role_type'] = 'admin';
}

if (($user['role_type'] ?? '') === 'admin') {
    $adminLevel = $roles->resolveLevel([
        'user_id' => (int) $user['user_id'],
        'email' => (string) $user['email'],
        'role_type' => 'admin',
        'admin_level' => $adminLevel,
    ]);
} else {
    $adminLevel = null;
}

$oauthRolePending = false;
$emailVerified = false;
try {
    $oauthRolePending = ($user['role_type'] === 'admin')
        ? false
        : (new \Study114\Auth\OAuthRoleService())->isRolePendingForUser((int) $user['user_id']);
    $emailVerified = (new \Study114\Auth\EmailVerificationGate())->isVerified((int) $user['user_id']);
} catch (Throwable $e) {
    error_log('[me] auth flags: ' . $e->getMessage());
}

echo json_encode([
    'ok' => true,
    'authenticated' => true,
    'user_id' => $user['user_id'],
    'email' => $user['email'],
    'role_type' => $user['role_type'],
    'name' => $user['name'],
    'admin_level' => $adminLevel,
    'must_change_password' => (bool) $mustChange,
    'oauth_role_pending' => $oauthRolePending,
    'email_verified' => $emailVerified,
], JSON_UNESCAPED_UNICODE);
