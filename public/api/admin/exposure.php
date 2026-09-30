<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Admin\AdminExposureService;
use Study114\Admin\ExposureDraftPublishException;

AdminApi::bootstrap();

AdminApi::run(static function (): void {
    $auth = AdminApi::requireAdmin();
    $service = new AdminExposureService();
    $method = AdminApi::method();

    if ($method === 'GET') {
        $targetType = AdminApi::queryString('target_type', 'all');
        $status = AdminApi::queryString('status');
        $userId = exposureUserIdFilter();
        AdminApi::ok(['items' => $service->list($targetType, $status, $userId)]);
    }

    if ($method === 'PATCH') {
        try {
            $result = $service->applyCorrection(AdminApi::readJson(), (string) $auth['email']);
        } catch (ExposureDraftPublishException $e) {
            AdminApi::fail(400, 'draft_not_publishable', $e->getMessage());
        }
        AdminApi::ok($result);
    }

    AdminApi::fail(405, 'method_not_allowed', 'GET · PATCH만 허용됩니다.');
});

function exposureUserIdFilter(): ?int
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
