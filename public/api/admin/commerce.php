<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Admin\AdminCommerceService;

AdminApi::bootstrap();

AdminApi::run(static function (): void {
    $auth = AdminApi::requireAdmin();
    $service = new AdminCommerceService();
    $method = AdminApi::method();

    if ($method === 'GET') {
        $limit = AdminApi::queryInt('limit', 50);
        AdminApi::ok($service->overview($auth, $limit, commerceUserIdFilter()));
    }

    if ($method === 'PATCH') {
        $input = AdminApi::readJson();
        AdminApi::ok($service->applyCorrection($auth, $input));
    }

    AdminApi::fail(405, 'method_not_allowed', 'GET, PATCH만 허용됩니다.');
});

/** 비우면 전체. 숫자가 아니면 400. */
function commerceUserIdFilter(): ?int
{
    if (!array_key_exists('user_id', $_GET)) {
        return null;
    }
    $raw = trim((string) $_GET['user_id']);
    if ($raw === '') {
        return null;
    }
    if (!preg_match('/^[1-9][0-9]*$/', $raw)) {
        AdminApi::fail(400, 'invalid_user_id', 'user_id는 숫자여야 합니다.');
    }

    return (int) $raw;
}
