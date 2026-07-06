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

$config = study114_config('paid');
$key = (string) ($_SERVER['HTTP_X_CRON_KEY'] ?? $_GET['key'] ?? '');
if ($key === '' || !hash_equals((string) $config['cron_key'], $key)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'cron key가 올바르지 않습니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $result = (new ProviderReminderService())->processScheduledReminders();
    echo json_encode(['ok' => true] + $result, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[cron/paid-reminders] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => '알림 처리 중 오류가 발생했습니다.'], JSON_UNESCAPED_UNICODE);
}
