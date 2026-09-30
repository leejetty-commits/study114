<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Site\SiteSettingsService;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
study114_send_cors_headers(false);

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
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

$service = new SiteSettingsService();
try {
    $payload = $service->publicPayload();
} catch (Throwable $e) {
    error_log('[site-settings] public: ' . $e->getMessage());
    $payload = $service->emptyPublicPayload();
}

echo json_encode(['ok' => true] + $payload, JSON_UNESCAPED_UNICODE);
