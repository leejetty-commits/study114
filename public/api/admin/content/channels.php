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
        AdminApi::ok(['channels' => $service->listChannels()]);
    }

    if ($method === 'POST') {
        $channel = $service->saveChannel(AdminApi::readJson(), $operatorId);
        AdminApi::ok(['channel' => $channel]);
    }

    if ($method === 'PATCH') {
        $boardKey = AdminApi::queryString('board_key') ?? AdminApi::queryString('boardKey');
        $input = AdminApi::readJson();
        if ($boardKey !== null && $boardKey !== '') {
            $input['boardKey'] = $boardKey;
        }
        $channel = $service->saveChannel($input, $operatorId);
        AdminApi::ok(['channel' => $channel]);
    }

    AdminApi::fail(405, 'method_not_allowed', 'GET · POST · PATCH만 허용됩니다.');
});
