<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Admin\AdminAccountSchemaMigrateService;
use Study114\Admin\AdminApi;
use Study114\Admin\AdminRoleService;
use Study114\Admin\ContentSchemaMigrateService;
use Study114\Admin\DualCapabilityAdminMigrateService;
use Study114\Admin\ListSortCountersMigrateService;
use Study114\Admin\RegionBasisSchemaMigrateService;

AdminApi::bootstrap();

AdminApi::run(static function (): void {
    $auth = AdminApi::requireAdmin();
    $roles = new AdminRoleService();
    $content = new ContentSchemaMigrateService();
    $accounts = new AdminAccountSchemaMigrateService();
    $regionBasis = new RegionBasisSchemaMigrateService();
    $dualAdmin = new DualCapabilityAdminMigrateService();
    $listSort = new ListSortCountersMigrateService();
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
            'region_037' => $regionBasis->status(),
            'dual_admin_038' => $dualAdmin->status(),
            'list_sort_041' => $listSort->status(),
            'can_apply_036' => $isSuper || $needs036Bootstrap,
            'can_apply_037' => $isSuper,
            'can_apply_038' => $isSuper,
            'can_apply_041' => $isSuper,
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
        if ($confirm === 'apply-037') {
            if (!$isSuper) {
                AdminApi::fail(403, 'forbidden', '최고관리자만 037을 적용할 수 있습니다.');
            }
            AdminApi::ok(['migrate' => $regionBasis->apply()]);
        }
        if ($confirm === 'apply-038') {
            if (!$isSuper) {
                AdminApi::fail(403, 'forbidden', '최고관리자만 038을 적용할 수 있습니다.');
            }
            AdminApi::ok(['migrate' => $dualAdmin->apply()]);
        }
        if ($confirm === 'apply-041') {
            if (!$isSuper) {
                AdminApi::fail(403, 'forbidden', '최고관리자만 041을 적용할 수 있습니다.');
            }
            // 운영 기본: 컬럼만 추가. 로컬 데모 시드는 seed_demo=true 일 때만.
            $seedDemo = !empty($input['seed_demo']);
            AdminApi::ok(['migrate' => $listSort->apply($seedDemo)]);
        }

        AdminApi::fail(422, 'validation', 'confirm: apply-034-035 · apply-036 · apply-037 · apply-038 · apply-041 이 필요합니다. apply-041은 042 user_recommendations 포함.');
    }

    AdminApi::fail(405, 'method_not_allowed', 'GET · POST만 허용됩니다.');
});
