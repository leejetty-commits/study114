<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Site\SiteSettingsSchemaException;
use Study114\Site\SiteSettingsService;

header('Content-Type: application/json; charset=utf-8');
study114_send_cors_headers();
if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

AdminApi::run(static function (): void {
    $auth = AdminApi::requireAdmin();
    AdminApi::requireMaster($auth);
    $service = new SiteSettingsService();
    $operator = (string) ($auth['email'] ?? '');
    $method = AdminApi::method();

    try {
        if ($method === 'GET') {
            AdminApi::ok($service->adminView());
        }
        if ($method === 'PUT') {
            AdminApi::ok($service->save(AdminApi::readJson(), $operator));
        }
        AdminApi::fail(405, 'method_not_allowed', 'GET · PUT만 허용됩니다.');
    } catch (SiteSettingsSchemaException $e) {
        AdminApi::fail(503, 'schema_missing', $e->getMessage());
    }
});
