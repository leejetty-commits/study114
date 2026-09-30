<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Admin\AdminMemberDeleteService;

AdminApi::bootstrap();

AdminApi::run(static function (): void {
    $auth = AdminApi::requireAdmin();
    AdminApi::requireMaster($auth);
    if (AdminApi::method() !== 'POST') {
        AdminApi::fail(405, 'method_not_allowed', 'POST만 허용됩니다.');
    }

    AdminApi::ok((new AdminMemberDeleteService())->deleteMany($auth, AdminApi::readJson()));
});
