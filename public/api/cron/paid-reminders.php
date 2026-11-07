<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Paid\ProviderReminderService;

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'POST만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// 정산·회원메일 cron과 동일: 전용 키 · 헤더만 · 약한/기본값이면 실행 안 함 (GET ?key= 금지)
$expected = study114_env('STUDY114_CRON_KEY', '');
if ($expected === '' || str_starts_with($expected, '__') || strlen($expected) < 32 || $expected === 'dev-cron-key') {
    http_response_code(503);
    echo json_encode([
        'ok' => false,
        'error' => 'cron_key_unconfigured',
        'message' => '리마인더 cron 키가 준비되지 않았습니다.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$given = (string) ($_SERVER['HTTP_X_CRON_KEY'] ?? '');
if ($given === '' || !hash_equals($expected, $given)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'cron key가 올바르지 않습니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $result = (new ProviderReminderService())->processScheduledReminders();
    echo json_encode(array_merge(['ok' => true], $result), JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[cron/paid-reminders] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => '알림 처리 중 오류가 발생했습니다.'], JSON_UNESCAPED_UNICODE);
}
