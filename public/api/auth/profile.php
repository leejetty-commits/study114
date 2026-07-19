<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\ProfileDisplayNameService;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
    http_response_code(204);
    exit;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if (!in_array($method, ['GET', 'POST', 'PATCH'], true)) {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'GET · POST · PATCH만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
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

$userId = (int) $user['user_id'];
$svc = new ProfileDisplayNameService();
$providers = $svc->oauthProviders($userId);
$providerLabels = \Study114\Auth\OAuthProviderLabels::labels($providers);

if ($method === 'GET') {
    echo json_encode([
        'ok' => true,
        'name' => (string) ($user['name'] ?? ''),
        'email' => (string) ($user['email'] ?? ''),
        'oauth_providers' => $providers,
        'oauth_provider_labels' => $providerLabels,
        'note' => '사이트 표시명만 변경 가능합니다. 로그인 계정(auth email)·소셜 연동은 변경하지 않습니다.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$input = json_decode(file_get_contents('php://input') ?: '{}', true);
if (!is_array($input)) {
    $input = [];
}

// email 변경 요청은 명시 거부
if (array_key_exists('email', $input) || array_key_exists('login_email', $input)) {
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'error' => 'validation',
        'message' => '로그인 계정(이메일)은 이 화면에서 변경할 수 없습니다. 사이트 표시명만 수정해 주세요.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$displayName = (string) ($input['display_name'] ?? $input['site_display_name'] ?? $input['name'] ?? '');

try {
    $result = $svc->updateDisplayName($userId, $displayName);
    AuthSession::updateName($result['name']);
    echo json_encode([
        'ok' => true,
        'name' => $result['name'],
        'email' => (string) ($user['email'] ?? ''),
        'oauth_providers' => $providers,
        'oauth_provider_labels' => $providerLabels,
        'message' => '사이트 표시명이 저장되었습니다.',
    ], JSON_UNESCAPED_UNICODE);
} catch (InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'error' => 'validation',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[auth/profile] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'server_error',
        'message' => '표시명 저장 중 오류가 발생했습니다.',
    ], JSON_UNESCAPED_UNICODE);
}
