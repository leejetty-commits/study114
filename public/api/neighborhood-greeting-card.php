<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/src/bootstrap.php';

use Study114\Neighborhood\NeighborhoodGreetingService;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method === 'OPTIONS') {
    study114_send_cors_headers();
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

study114_send_cors_headers();

$providerType = (string) ($_GET['provider_type'] ?? '');
$providerType = $providerType === 'tutor' ? 'tutor' : 'study_room';
$registrationId = (int) ($_GET['registration_id'] ?? 0);

try {
    $item = NeighborhoodGreetingService::fromDefaultPath()->basicCard($providerType, $registrationId);
    if ($item === null) {
        http_response_code(404);
        echo json_encode([
            'ok' => false,
            'error' => 'unavailable',
            'message' => '카드를 볼 수 없어요',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    echo json_encode(['ok' => true, 'item' => $item], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[neighborhood-greeting-card] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error'], JSON_UNESCAPED_UNICODE);
}
