<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Admin\ContentConfigService;

AdminApi::bootstrap();

AdminApi::run(static function (): void {
    $auth = AdminApi::requireAdmin();
    $service = new ContentConfigService();
    $method = AdminApi::method();
    $operatorId = (string) ($auth['email'] ?? 'admin');

    if ($method === 'GET') {
        AdminApi::ok(['slots' => $service->listRightRails()]);
    }

    if ($method === 'POST' || $method === 'PATCH') {
        $input = AdminApi::readJson();
        $slotKey = AdminApi::queryString('slot_key') ?? AdminApi::queryString('slotKey');
        if ($slotKey !== null && $slotKey !== '') {
            $input['slotKey'] = $slotKey;
        }
        $slot = $service->saveRightRail($input, $operatorId);
        AdminApi::ok(['slot' => $slot]);
    }

    AdminApi::fail(405, 'method_not_allowed', 'GET · POST · PATCH만 허용됩니다.');
});
