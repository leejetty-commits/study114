<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\StudyRoom\StudyRoomPublicReadService;
use Study114\Database\Connection;

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

$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_id', 'message' => 'id가 필요합니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = Connection::get();
    $service = new StudyRoomPublicReadService($pdo);
    $item = $service->getPublishedById($id);
    if ($item === null) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'not_found', 'message' => '공개된 공부방을 찾을 수 없습니다.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode(['ok' => true, 'item' => $item], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[study-room/public] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error', 'message' => '조회에 실패했습니다.'], JSON_UNESCAPED_UNICODE);
}
