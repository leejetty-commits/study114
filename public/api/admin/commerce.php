<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Admin\AdminCommerceService;

AdminApi::bootstrap();

AdminApi::run(static function (): void {
    $auth = AdminApi::requireAdmin();
    $service = new AdminCommerceService();
    $method = AdminApi::method();

    if ($method === 'GET') {
        $limit = AdminApi::queryInt('limit', 50);
        AdminApi::ok($service->overview($auth, $limit));
    }

    if ($method === 'PATCH') {
        $input = AdminApi::readJson();
        AdminApi::ok($service->applyCorrection($auth, $input));
    }

    AdminApi::fail(405, 'method_not_allowed', 'GET, PATCH만 허용됩니다.');
});
