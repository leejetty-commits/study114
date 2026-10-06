<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Admin\AdminRegistrationListRepository;

AdminApi::bootstrap();

AdminApi::run(static function (): void {
    AdminApi::requireAdmin();
    if (AdminApi::method() !== 'GET') {
        AdminApi::fail(405, 'method_not_allowed', 'GET만 허용됩니다.');
    }

    $role = (string) (AdminApi::queryString('role', 'study_room') ?? 'study_room');
    $from = AdminApi::queryString('from');
    $to = AdminApi::queryString('to');
    $regionRaw = AdminApi::queryString('region');
    $regionId = null;
    if ($regionRaw !== null && $regionRaw !== '') {
        if (!preg_match('/^[1-9][0-9]*$/', $regionRaw)) {
            AdminApi::fail(422, 'validation', 'region은 시·군·구 번호여야 합니다.');
        }
        $regionId = (int) $regionRaw;
    }
    $page = AdminApi::queryInt('page', 1);
    $perPage = array_key_exists('perPage', $_GET) ? AdminApi::queryInt('perPage', 50) : 50;

    AdminApi::ok((new AdminRegistrationListRepository())->page($role, $from, $to, $regionId, $page, $perPage));
});
