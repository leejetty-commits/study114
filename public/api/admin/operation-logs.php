<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Admin\AdminSubmissionQueueService;

AdminApi::bootstrap();

AdminApi::run(static function (): void {
    AdminApi::requireAdmin();
    $service = new AdminSubmissionQueueService();
    $method = AdminApi::method();

    if ($method === 'GET') {
        $limit = AdminApi::queryInt('limit', 50);
        AdminApi::ok(['logs' => $service->listLogs($limit)]);
    }

    AdminApi::fail(405, 'method_not_allowed', 'GET만 허용됩니다.');
});
