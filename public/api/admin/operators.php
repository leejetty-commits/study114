<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Admin\AdminOperatorService;
use Study114\Admin\AdminRoleService;

AdminApi::bootstrap();

AdminApi::run(static function (): void {
    $auth = AdminApi::requireAdmin();
    $roles = new AdminRoleService();
    if (!$roles->isSuperAdmin($auth)) {
        AdminApi::fail(403, 'forbidden', '최고관리자만 운영 계정을 관리할 수 있습니다.');
    }

    // resolveLevel이 session에 admin_level 없을 때 DB를 보도록 user_id 보장
    $auth['admin_level'] = $roles->resolveLevel($auth);

    $service = new AdminOperatorService();
    $method = AdminApi::method();
    $action = strtolower((string) (AdminApi::queryString('action') ?? ''));

    if ($method === 'GET') {
        AdminApi::ok(['operators' => $service->listOperators($auth)]);
    }

    if ($method === 'POST' && $action === 'reset_password') {
        $body = AdminApi::readJson();
        $userId = (int) ($body['user_id'] ?? AdminApi::queryInt('id', 0));
        AdminApi::ok(['operator' => $service->resetPassword($auth, $userId, $body)]);
    }

    if ($method === 'POST') {
        $body = AdminApi::readJson();
        AdminApi::ok(['operator' => $service->create($auth, $body)]);
    }

    if ($method === 'PATCH') {
        $body = AdminApi::readJson();
        $userId = (int) ($body['user_id'] ?? AdminApi::queryInt('id', 0));
        AdminApi::ok(['operator' => $service->patch($auth, $userId, $body)]);
    }

    AdminApi::fail(405, 'method_not_allowed', 'GET · POST · PATCH만 허용됩니다.');
});
