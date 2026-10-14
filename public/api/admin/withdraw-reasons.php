<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Auth\WithdrawReasonService;
use Study114\Database\Connection;

header('Content-Type: application/json; charset=utf-8');
study114_send_cors_headers();
if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

/** 관리자 「회원관리 › 탈퇴 사유」 (정본 74 §1-4). 누가 남겼는지 알 수 없는 모음 — 운영자 전원 보기 */
AdminApi::run(static function (): void {
    AdminApi::requireAdmin();
    if (AdminApi::method() !== 'GET') {
        AdminApi::fail(405, 'method_not_allowed', 'GET만 허용됩니다.');
    }
    $service = new WithdrawReasonService(Connection::get());
    try {
        AdminApi::ok($service->summary((int) ($_GET['days'] ?? WithdrawReasonService::SUMMARY_DAYS[0])));
    } catch (RuntimeException $e) {
        if ($e->getMessage() === WithdrawReasonService::SCHEMA_MISSING) {
            AdminApi::fail(503, 'schema_missing', '탈퇴 사유 표가 없습니다. sql/schema/080_withdraw_reasons.sql 을 적용해 주세요.');
        }
        throw $e;
    }
});
