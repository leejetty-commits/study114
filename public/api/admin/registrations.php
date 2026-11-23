<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Admin\AdminRegionFilter;
use Study114\Admin\AdminRegistrationListRepository;
use Study114\Database\Connection;

AdminApi::bootstrap();

AdminApi::run(static function (): void {
    AdminApi::requireAdmin();
    if (AdminApi::method() !== 'GET') {
        AdminApi::fail(405, 'method_not_allowed', 'GET만 허용됩니다.');
    }

    $role = (string) (AdminApi::queryString('role', 'study_room') ?? 'study_room');
    $from = AdminApi::queryString('from');
    $to = AdminApi::queryString('to');
    $region = AdminRegionFilter::parse(
        Connection::get(),
        AdminApi::queryString('sido'),
        AdminApi::queryString('region'),
    );
    $q = AdminApi::queryString('q');
    $page = AdminApi::queryInt('page', 1);
    $perPage = array_key_exists('perPage', $_GET) ? AdminApi::queryInt('perPage', 50) : 50;

    AdminApi::ok((new AdminRegistrationListRepository())->page(
        $role,
        $from,
        $to,
        $region['regionId'],
        $page,
        $perPage,
        $region['sido'],
        $q,
    ));
});
