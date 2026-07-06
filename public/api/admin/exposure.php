<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Admin\AdminExposureService;

AdminApi::bootstrap();

AdminApi::run(static function (): void {
    $auth = AdminApi::requireAdmin();
    $service = new AdminExposureService();
    $method = AdminApi::method();

    if ($method === 'GET') {
        $targetType = AdminApi::queryString('target_type', 'all');
        $status = AdminApi::queryString('status');
        AdminApi::ok(['items' => $service->list($targetType, $status)]);
    }

    if ($method === 'PATCH') {
        $result = $service->applyCorrection(AdminApi::readJson(), (string) $auth['email']);
        AdminApi::ok($result);
    }

    AdminApi::fail(405, 'method_not_allowed', 'GET · PATCH만 허용됩니다.');
});
