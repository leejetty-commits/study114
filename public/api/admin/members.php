<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Admin\AdminMemberService;

AdminApi::bootstrap();

AdminApi::run(static function (): void {
    $auth = AdminApi::requireAdmin();
    $service = new AdminMemberService();
    $method = AdminApi::method();

    if ($method === 'GET') {
        $id = AdminApi::queryInt('id', 0);
        if ($id > 0) {
            AdminApi::ok(['member' => $service->detail($id)]);
        }

        AdminApi::ok($service->list([
            'q' => (string) (AdminApi::queryString('q', '') ?? ''),
            'status' => (string) (AdminApi::queryString('status', 'all') ?? 'all'),
            'role_type' => (string) (AdminApi::queryString('role_type', 'all') ?? 'all'),
            'limit' => AdminApi::queryInt('limit', 50),
        ]));
    }

    if ($method === 'PATCH') {
        $input = AdminApi::readJson();
        AdminApi::ok($service->applyAction($auth, $input));
    }

    AdminApi::fail(405, 'method_not_allowed', 'GET, PATCH만 허용됩니다.');
});
