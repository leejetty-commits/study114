<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Admin\AdminStatsRepository;
use Study114\Database\Connection;

header('Content-Type: application/json; charset=utf-8');
study114_send_cors_headers();
if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

AdminApi::run(static function (): void {
    $auth = AdminApi::requireAdmin();
    AdminApi::requireMaster($auth);
    if (AdminApi::method() !== 'GET') {
        AdminApi::fail(405, 'method_not_allowed', 'GET만 허용됩니다.');
    }
    $days = AdminApi::queryInt('days', 14);
    if (!in_array($days, [7, 14, 30], true)) {
        AdminApi::fail(422, 'validation', 'days는 7, 14, 30만 가능합니다.');
    }
    AdminApi::ok((new AdminStatsRepository(Connection::get()))->summary(
        $days,
        new DateTimeImmutable('now', new DateTimeZone('Asia/Seoul')),
    ));
});
