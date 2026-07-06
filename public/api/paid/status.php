<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Paid\PaidApi;
use Study114\Paid\ProviderUsageService;

PaidApi::bootstrap();

PaidApi::run(static function (): void {
    $auth = PaidApi::requireProvider();
    $userId = (int) $auth['user_id'];
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method !== 'GET') {
        PaidApi::fail(405, 'method_not_allowed', 'GET만 허용됩니다.');
    }

    $days = PaidApi::queryInt('days', 7);
    $service = new ProviderUsageService();
    $summary = $service->getFullSummary($userId, $days > 0 ? $days : 7);

    PaidApi::ok($summary);
});
