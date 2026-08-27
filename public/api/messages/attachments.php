<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use InvalidArgumentException;
use Study114\Auth\AuthSession;
use Study114\Messages\MessageAttachmentService;
use Study114\Messages\MessagesApi;

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    study114_send_cors_headers();
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

study114_send_cors_headers();

if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Content-Type: application/json; charset=utf-8');
    MessagesApi::fail(405, 'method_not_allowed', 'GET만 허용됩니다.');
}

$auth = AuthSession::user();
if ($auth === null) {
    header('Content-Type: application/json; charset=utf-8');
    MessagesApi::fail(401, 'unauthorized', '로그인이 필요합니다.');
}

$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
if ($id <= 0) {
    header('Content-Type: application/json; charset=utf-8');
    MessagesApi::fail(422, 'validation', 'id가 필요합니다.');
}

try {
    (new \Study114\Auth\EmailVerificationGate())->assertVerified((int) $auth['user_id']);
    (new MessageAttachmentService())->streamDownload((int) $auth['user_id'], $id);
} catch (\Study114\Auth\EmailVerificationRequiredException $e) {
    header('Content-Type: application/json; charset=utf-8');
    MessagesApi::fail(403, 'email_verify_required', $e->getMessage());
} catch (InvalidArgumentException $e) {
    header('Content-Type: application/json; charset=utf-8');
    MessagesApi::fail(422, 'validation', $e->getMessage());
} catch (\Throwable $e) {
    error_log('[messages-attach] ' . $e->getMessage());
    header('Content-Type: application/json; charset=utf-8');
    MessagesApi::fail(500, 'server_error', $e->getMessage());
}
