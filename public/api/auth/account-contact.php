<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\AccountContactService;
use Study114\Auth\AuthSession;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    study114_send_cors_headers();
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

study114_send_cors_headers();

$user = AuthSession::user();
if ($user === null) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'unauthenticated', 'message' => '로그인이 필요합니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$svc = new AccountContactService();
$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

try {
    if ($method === 'GET') {
        $status = $svc->status((int) $user['user_id']);
        echo json_encode([
            'ok' => true,
            'needs_account_contact' => $status['needs_account_contact'],
            'needs_email' => $status['needs_email'],
            'has_phone' => $status['has_phone'],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'GET · POST만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $raw = json_decode(file_get_contents('php://input') ?: '{}', true);
    $input = is_array($raw) ? $raw : [];
    $svc->save((int) $user['user_id'], $input);
    $status = $svc->status((int) $user['user_id']);

    if (!$status['needs_email']) {
        $emailStmtOk = true;
        try {
            $fresh = \Study114\Database\Connection::get()->prepare('SELECT email FROM users WHERE id = ?');
            $fresh->execute([(int) $user['user_id']]);
            $email = (string) $fresh->fetchColumn();
            AuthSession::login(
                (int) $user['user_id'],
                $email !== '' ? $email : (string) $user['email'],
                (string) $user['role_type'],
                (string) ($user['name'] ?? ''),
            );
        } catch (Throwable $e) {
            $emailStmtOk = false;
            error_log('[account-contact] session email: ' . $e->getMessage());
        }
        unset($emailStmtOk);
    }

    echo json_encode([
        'ok' => true,
        'needs_account_contact' => $status['needs_account_contact'],
        'message' => '계정 연락처가 저장되었습니다. 이 정보는 회원에게 공개되지 않습니다.',
    ], JSON_UNESCAPED_UNICODE);
} catch (InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'validation', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[account-contact] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error', 'message' => '연락처 저장 중 오류가 발생했습니다.'], JSON_UNESCAPED_UNICODE);
}
