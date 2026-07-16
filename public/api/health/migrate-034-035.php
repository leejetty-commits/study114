<?php

declare(strict_types=1);

/**
 * ⚠️ 임시 034/035 스키마 적용 — 확인 후 반드시 삭제하세요.
 * POST /api/health/migrate-034-035.php
 * body: {"confirm":"apply-034-035"}
 */
require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\ContentSchemaMigrateService;

header('Content-Type: application/json; charset=utf-8');

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

try {
    $service = new ContentSchemaMigrateService();

    if ($method === 'GET') {
        echo json_encode([
            'ok' => true,
            'status' => $service->status(),
            'hint' => '적용하려면 POST {"confirm":"apply-034-035"} · 완료 후 이 파일을 삭제하세요.',
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['ok' => false, 'error' => 'POST or GET only'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $raw = file_get_contents('php://input');
    /** @var mixed $decoded */
    $decoded = json_decode($raw ?: '{}', true);
    if (!is_array($decoded) || ($decoded['confirm'] ?? '') !== 'apply-034-035') {
        http_response_code(422);
        echo json_encode([
            'ok' => false,
            'error' => 'validation',
            'message' => 'confirm: apply-034-035 가 필요합니다.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $result = $service->apply();
    echo json_encode([
        'ok' => true,
        'migrate' => $result,
        'message' => '적용 완료 — public/api/health/migrate-034-035.php 를 삭제하세요.',
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'migrate failed',
        'error' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
