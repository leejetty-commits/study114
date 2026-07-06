<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Paid\PaidApi;
use Study114\Paid\ProviderNoticeService;

PaidApi::bootstrap();

PaidApi::run(static function (): void {
    $auth = PaidApi::requireProvider();
    $userId = (int) $auth['user_id'];
    $service = new ProviderNoticeService();
    $method = PaidApi::method();

    if ($method === 'GET') {
        PaidApi::ok(['notices' => $service->listUnread($userId)]);
    }

    if ($method === 'POST') {
        $input = PaidApi::readJson();
        $action = (string) ($input['action'] ?? 'mark_read');
        if ($action === 'mark_all_read') {
            $count = $service->markAllRead($userId);
            PaidApi::ok(['marked' => $count]);
        }
        $noticeId = (int) ($input['notice_id'] ?? 0);
        if ($noticeId <= 0) {
            PaidApi::fail(422, 'validation', 'notice_id가 필요합니다.');
        }
        PaidApi::ok(['marked' => $service->markRead($userId, $noticeId)]);
    }

    PaidApi::fail(405, 'method_not_allowed', 'GET · POST만 허용됩니다.');
});
