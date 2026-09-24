<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/src/bootstrap.php';

use Study114\HomePopup\HomePopupService;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
study114_send_cors_headers(false);

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'ok' => false,
        'error' => 'method_not_allowed',
        'message' => 'GET만 허용됩니다.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $popups = (new HomePopupService())->listPublic();
    echo json_encode(['ok' => true, 'popups' => $popups], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[home-popups] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'server_error',
        'message' => '조회에 실패했습니다.',
    ], JSON_UNESCAPED_UNICODE);
}
