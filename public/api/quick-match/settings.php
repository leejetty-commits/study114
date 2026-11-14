<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Paid\PaidApi;
use Study114\QuickMatch\QuickMatchHttpException;
use Study114\QuickMatch\QuickMatchSettingsService;

PaidApi::bootstrap();

PaidApi::run(static function (): void {
    $auth = PaidApi::requireProvider();
    $userId = (int) $auth['user_id'];
    $role = (string) $auth['role_type'];
    $service = new QuickMatchSettingsService();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    try {
        if ($method === 'GET') {
            $requested = isset($_GET['provider_id']) ? (int) $_GET['provider_id'] : null;
            PaidApi::ok($service->read($userId, $role, $requested));
        }
        if ($method === 'POST') {
            $raw = file_get_contents('php://input');
            $body = is_string($raw) && $raw !== '' ? json_decode($raw, true) : [];
            if (!is_array($body)) {
                PaidApi::fail(400, 'invalid_json', '요청 본문을 확인해 주세요.');
            }
            PaidApi::ok($service->save($userId, $role, $body));
        }
        PaidApi::fail(405, 'method_not_allowed', 'GET과 POST만 허용됩니다.');
    } catch (QuickMatchHttpException $e) {
        PaidApi::fail($e->status, $e->error, $e->getMessage(), $e->extra);
    }
});
