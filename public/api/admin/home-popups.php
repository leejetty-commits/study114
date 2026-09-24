<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\HomePopup\HomePopupService;
use Study114\HomePopup\HomePopupValidationException;

header('Content-Type: application/json; charset=utf-8');
study114_send_cors_headers();

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

AdminApi::run(static function () use ($method): void {
    $auth = AdminApi::requireAdmin();
    AdminApi::requireMaster($auth);
    $service = new HomePopupService();

    try {
        if ($method === 'GET') {
            $id = AdminApi::queryInt('id', 0);
            if ($id > 0) {
                $popup = $service->get($id);
                if ($popup === null) {
                    AdminApi::fail(404, 'not_found', '팝업을 찾을 수 없습니다.');
                }
                AdminApi::ok(['popup' => $popup]);
            }
            AdminApi::ok(['popups' => $service->list()]);
        }

        if ($method === 'POST') {
            AdminApi::ok(['popup' => $service->save(AdminApi::readJson())]);
        }

        if ($method === 'DELETE') {
            $id = AdminApi::queryInt('id', 0);
            if ($id <= 0) {
                AdminApi::fail(400, 'bad_id', 'id가 필요합니다.');
            }
            $service->delete($id);
            AdminApi::ok([]);
        }

        AdminApi::fail(405, 'method_not_allowed', 'GET · POST · DELETE만 허용됩니다.');
    } catch (HomePopupValidationException $e) {
        $status = $e->errorCode() === 'not_found' ? 404 : 400;
        AdminApi::fail($status, $e->errorCode(), $e->getMessage());
    }
});
