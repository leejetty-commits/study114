<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Admin\AdminCommerceService;
use Study114\Admin\AdminRoleService;

AdminApi::bootstrap();

AdminApi::run(static function (): void {
    $auth = AdminApi::requireAdmin();
    $service = new AdminCommerceService();
    $roles = new AdminRoleService();
    $method = AdminApi::method();

    if ($method === 'GET') {
        AdminApi::ok([
            'session' => $service->sessionInfo($auth),
            'menus' => [
                'master_only' => ['permissions'],
                'sub_master_blocked' => ['permissions', 'settings', 'system'],
            ],
            'can_write_commerce_strong' => $roles->isMaster($auth),
        ]);
    }

    AdminApi::fail(405, 'method_not_allowed', 'GET만 허용됩니다.');
});
