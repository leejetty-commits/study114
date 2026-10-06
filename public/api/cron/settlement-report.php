<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Report\SettlementReportService;

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'POST만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$expected = study114_env('STUDY114_REPORT_CRON_KEY', '');
if ($expected === '' || str_starts_with($expected, '__') || strlen($expected) < 32 || $expected === 'dev-cron-key') {
    http_response_code(503);
    echo json_encode([
        'ok' => false,
        'error' => 'cron_key_unconfigured',
        'message' => '보고서 cron 키가 준비되지 않았습니다.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$given = (string) ($_SERVER['HTTP_X_CRON_KEY'] ?? '');
if ($given === '' || !hash_equals($expected, $given)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'forbidden', 'message' => 'cron key가 올바르지 않습니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $service = new SettlementReportService();
    $result = $service->runAt(new DateTimeImmutable('now', new DateTimeZone('Asia/Seoul')));
    echo json_encode(array_merge(['ok' => true], $result), JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    $missing = $e->getMessage() === 'schema_missing';
    error_log('[cron/settlement-report] ' . ($missing ? 'schema_missing' : $e->getMessage()));
    http_response_code($missing ? 503 : 500);
    echo json_encode([
        'ok' => false,
        'error' => $missing ? 'schema_missing' : 'server_error',
        'message' => $missing ? '보고서 저장 공간이 아직 준비되지 않았어요.' : '보고서 집계 중 오류가 발생했습니다.',
    ], JSON_UNESCAPED_UNICODE);
}
