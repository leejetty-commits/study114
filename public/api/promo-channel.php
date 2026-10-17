<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Database\Connection;
use Study114\Promo\PromoChannelPublicRead;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    study114_send_cors_headers(false);
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'GET만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

study114_send_cors_headers(false);

if (AuthSession::userIfActive() === null) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'auth_required', 'message' => '로그인 후 볼 수 있습니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$kind = isset($_GET['kind']) ? (string) $_GET['kind'] : '';
$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
if (($kind !== 'study_room' && $kind !== 'tutor') || $id <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_request', 'message' => 'kind와 id가 필요합니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $item = (new PromoChannelPublicRead(Connection::get()))->forCard($kind, $id);
    if ($item === null) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'not_found', 'message' => '홍보 채널을 찾을 수 없습니다.'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    echo json_encode(['ok' => true, 'item' => $item], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[promo-channel] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error', 'message' => '조회에 실패했습니다.'], JSON_UNESCAPED_UNICODE);
}
