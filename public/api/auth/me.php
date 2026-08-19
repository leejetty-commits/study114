<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    study114_send_cors_headers();
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'GET만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

study114_send_cors_headers();

$user = AuthSession::userIfActive();
if ($user === null) {
    echo json_encode(['ok' => true, 'authenticated' => false], JSON_UNESCAPED_UNICODE);
    exit;
}
AuthSession::close();

$roles = new \Study114\Admin\AdminRoleService();
$flags = $roles->fetchAuthFlags((int) $user['user_id']);
$adminLevel = $flags['admin_level'] ?? ($user['admin_level'] ?? null);
$mustChange = $flags['must_change_password'] ?? !empty($user['must_change_password']);

// 시장 역할 유지 — admin_level이 있어도 role_type을 admin으로 덮지 않음
$adminLevel = $roles->resolveLevel([
    'user_id' => (int) $user['user_id'],
    'email' => (string) $user['email'],
    'role_type' => (string) ($user['role_type'] ?? ''),
    'admin_level' => $adminLevel,
]);

$oauthRolePending = false;
$emailVerified = false;
$oauthProviders = [];
$oauthProviderLabels = [];
$needsAccountContact = false;
try {
    $oauthRolePending = ($user['role_type'] === 'admin')
        ? false
        : (new \Study114\Auth\OAuthRoleService())->isRolePendingForUser((int) $user['user_id']);
    $emailVerified = (new \Study114\Auth\EmailVerificationGate())->isVerified((int) $user['user_id']);
    $profileSvc = new \Study114\Auth\ProfileDisplayNameService();
    $oauthProviders = $profileSvc->oauthProviders((int) $user['user_id']);
    $oauthProviderLabels = \Study114\Auth\OAuthProviderLabels::labels($oauthProviders);
    $needsAccountContact = (new \Study114\Auth\AccountContactService())
        ->status((int) $user['user_id'])['needs_account_contact'];
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
    'oauth_providers' => $oauthProviders,
    'oauth_provider_labels' => $oauthProviderLabels,
    'needs_account_contact' => $needsAccountContact,
], JSON_UNESCAPED_UNICODE);
