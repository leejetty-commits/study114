<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Paid\PaidApi;
use Study114\Paid\ProviderCheckoutService;

PaidApi::bootstrap();

PaidApi::run(static function (): void {
    $auth = PaidApi::requireProvider();
    $userId = (int) $auth['user_id'];
    $method = PaidApi::method();

    if ($method !== 'GET') {
        PaidApi::fail(405, 'method_not_allowed', 'GET만 허용됩니다.');
    }

    $limit = (int) ($_GET['limit'] ?? 50);
    $service = new ProviderCheckoutService();
    PaidApi::ok($service->listOrders($userId, $limit));
});
