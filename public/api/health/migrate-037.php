<?php

declare(strict_types=1);

/**
 * 임시 1회용 — 037 지역등록 기준·단지 주소 백필
 * 적용 후 반드시 삭제할 것.
 */

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\RegionBasisSchemaMigrateService;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    $service = new RegionBasisSchemaMigrateService();
    $confirm = isset($_GET['confirm']) ? (string) $_GET['confirm'] : '';
    if ($confirm !== 'apply-037') {
        echo json_encode([
            'ok' => true,
            'hint' => 'Apply with ?confirm=apply-037',
            'status' => $service->status(),
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $result = $service->apply();
    echo json_encode([
        'ok' => true,
        'migrate' => $result,
        'note' => 'Delete this endpoint after success: public/api/health/migrate-037.php',
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'server_error',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
