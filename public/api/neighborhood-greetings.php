<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Neighborhood\NeighborhoodGreetingService;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method === 'OPTIONS') {
    study114_send_cors_headers();
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

study114_send_cors_headers();

try {
    $service = NeighborhoodGreetingService::fromDefaultPath();
    if ($method === 'GET') {
        $full = false;
        try {
            $full = AuthSession::userIfActive() !== null;
        } catch (Throwable) {
            $full = false;
        }
        echo json_encode([
            'ok' => true,
            'items' => $service->listPublic($full),
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['ok' => false, 'error' => 'method_not_allowed'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $user = AuthSession::userIfActive();
    if ($user === null) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'auth_required', 'message' => '로그인이 필요해요.'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $raw = file_get_contents('php://input') ?: '';
    $input = json_decode($raw, true);
    if (!is_array($input)) {
        throw new InvalidArgumentException('입력을 확인해 주세요.');
    }
    $saved = $service->save((int) $user['user_id'], (string) ($user['role_type'] ?? ''), $input);
    echo json_encode(['ok' => true, 'item' => [
        'provider_type' => $saved['provider_type'],
        'registration_id' => $saved['registration_id'],
        'status' => $saved['status'],
    ]], JSON_UNESCAPED_UNICODE);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[neighborhood-greeting] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error'], JSON_UNESCAPED_UNICODE);
}
