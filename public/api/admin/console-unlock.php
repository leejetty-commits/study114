<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Admin\AdminConsolePasswordService;
use Study114\Auth\AuthSession;

AdminApi::bootstrap();

AdminApi::run(static function (): void {
    $service = new AdminConsolePasswordService();
    $method = AdminApi::method();

    if ($method === 'GET') {
        $auth = AdminApi::requireAdmin(false);
        AdminApi::ok($service->publicStatus((int) $auth['user_id']));
    }

    if ($method !== 'POST') {
        AdminApi::fail(405, 'method_not_allowed', 'GET 또는 POST만 허용됩니다.');
    }

    $input = AdminApi::readJson();
    $action = strtolower(trim((string) ($input['action'] ?? 'unlock')));
    if ($action === 'change') {
        $auth = AdminApi::requireAdmin(true);
        $service->change(
            (int) $auth['user_id'],
            (string) ($input['current_password'] ?? ''),
            (string) ($input['password'] ?? ''),
            (string) ($input['password_confirm'] ?? ''),
        );
        AdminApi::ok(['changed' => true]);
    }

    $auth = AdminApi::requireAdmin(false);
    $service->unlock((int) $auth['user_id'], (string) ($input['password'] ?? ''));
    AuthSession::regenerate();
    AuthSession::markConsoleUnlocked();
    AdminApi::ok(['unlocked' => true]);
});
