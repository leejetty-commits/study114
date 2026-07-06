<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Admin\AdminReportService;

AdminApi::bootstrap();

AdminApi::run(static function (): void {
    $auth = AdminApi::requireAdmin();
    $service = new AdminReportService();
    $method = AdminApi::method();

    if ($method === 'GET') {
        $status = AdminApi::queryString('status');
        AdminApi::ok(['reports' => $service->list($status)]);
    }

    if ($method === 'PATCH') {
        $result = $service->update(AdminApi::readJson(), (string) $auth['email']);
        AdminApi::ok($result);
    }

    AdminApi::fail(405, 'method_not_allowed', 'GET · PATCH만 허용됩니다.');
});
