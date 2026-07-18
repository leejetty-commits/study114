<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Admin\AdminAccountSchemaMigrateService;
use Study114\Admin\AdminApi;
use Study114\Admin\AdminRoleService;
use Study114\Admin\ContentSchemaMigrateService;

AdminApi::bootstrap();

AdminApi::run(static function (): void {
    $auth = AdminApi::requireAdmin();
    $roles = new AdminRoleService();
    if (!$roles->isSuperAdmin($auth)) {
        AdminApi::fail(403, 'forbidden', '최고관리자만 스키마 마이그레이션을 실행할 수 있습니다.');
    }

    $content = new ContentSchemaMigrateService();
    $accounts = new AdminAccountSchemaMigrateService();
    $method = AdminApi::method();

    if ($method === 'GET') {
        AdminApi::ok([
            'content_034_035' => $content->status(),
            'admin_036' => $accounts->status(),
        ]);
    }

    if ($method === 'POST') {
        $input = AdminApi::readJson();
        $confirm = (string) ($input['confirm'] ?? '');

        if ($confirm === 'apply-034-035') {
            AdminApi::ok(['migrate' => $content->apply()]);
        }
        if ($confirm === 'apply-036') {
            AdminApi::ok(['migrate' => $accounts->apply()]);
        }

        AdminApi::fail(422, 'validation', 'confirm: apply-034-035 또는 apply-036 가 필요합니다.');
    }

    AdminApi::fail(405, 'method_not_allowed', 'GET · POST만 허용됩니다.');
});
