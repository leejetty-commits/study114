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
    $content = new ContentSchemaMigrateService();
    $accounts = new AdminAccountSchemaMigrateService();
    $method = AdminApi::method();
    $admin036 = $accounts->status();
    $needs036Bootstrap = empty($admin036['has_admin_level']);
    $isSuper = $roles->isSuperAdmin($auth);

    // 036 컬럼이 아직 없으면 부마스터도 1회 부트스트랩 적용 허용 (닭-달걀)
    if (!$isSuper && !$needs036Bootstrap) {
        AdminApi::fail(403, 'forbidden', '최고관리자만 스키마 마이그레이션을 실행할 수 있습니다.');
    }

    if ($method === 'GET') {
        AdminApi::ok([
            'content_034_035' => $content->status(),
            'admin_036' => $admin036,
            'can_apply_036' => $isSuper || $needs036Bootstrap,
        ]);
    }

    if ($method === 'POST') {
        $input = AdminApi::readJson();
        $confirm = (string) ($input['confirm'] ?? '');

        if ($confirm === 'apply-034-035') {
            if (!$isSuper) {
                AdminApi::fail(403, 'forbidden', '최고관리자만 034/035를 적용할 수 있습니다.');
            }
            AdminApi::ok(['migrate' => $content->apply()]);
        }
        if ($confirm === 'apply-036') {
            if (!$isSuper && !$needs036Bootstrap) {
                AdminApi::fail(403, 'forbidden', '최고관리자만 036을 적용할 수 있습니다.');
            }
            AdminApi::ok(['migrate' => $accounts->apply()]);
        }

        AdminApi::fail(422, 'validation', 'confirm: apply-034-035 또는 apply-036 가 필요합니다.');
    }

    AdminApi::fail(405, 'method_not_allowed', 'GET · POST만 허용됩니다.');
});
