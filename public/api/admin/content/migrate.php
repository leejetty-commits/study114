<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Admin\ContentSchemaMigrateService;

AdminApi::bootstrap();

AdminApi::run(static function (): void {
    AdminApi::requireAdmin();
    $service = new ContentSchemaMigrateService();
    $method = AdminApi::method();

    if ($method === 'GET') {
        AdminApi::ok(['status' => $service->status()]);
    }

    if ($method === 'POST') {
        $input = AdminApi::readJson();
        if (($input['confirm'] ?? '') !== 'apply-034-035') {
            AdminApi::fail(422, 'validation', 'confirm: apply-034-035 가 필요합니다.');
        }
        AdminApi::ok(['migrate' => $service->apply()]);
    }

    AdminApi::fail(405, 'method_not_allowed', 'GET · POST만 허용됩니다.');
});
