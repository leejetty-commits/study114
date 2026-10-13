<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\AdminApi;
use Study114\Admin\AdminRoleService;
use Study114\Database\Connection;
use Study114\Mail\MemberMailAdminService;
use Study114\Mail\MemberMailSettings;

header('Content-Type: application/json; charset=utf-8');
study114_send_cors_headers();
if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

/** 관리자 「알림·문자 › 회원 메일」 (정본 74 §4). 보기·미리보기·시험 발송 = 운영자, 켜고 끄기 = 최고관리자 */
AdminApi::run(static function (): void {
    $auth = AdminApi::requireAdmin();
    $operator = (string) ($auth['email'] ?? '');
    $isMaster = (new AdminRoleService())->isSuperAdmin($auth);
    $pdo = Connection::get();
    $settings = new MemberMailSettings($pdo);
    $service = new MemberMailAdminService($pdo, $settings);
    $method = AdminApi::method();

    try {
        if ($method === 'GET') {
            AdminApi::ok($service->view($isMaster, $operator));
        }
        if ($method === 'PATCH') {
            AdminApi::requireMaster($auth);
            $body = AdminApi::readJson();
            if (!is_bool($body['enabled'] ?? null)) {
                AdminApi::fail(422, 'validation', 'enabled 값이 필요합니다.');
            }
            $service->setEnabled((string) ($body['kind'] ?? ''), $body['enabled'], $operator);
            AdminApi::ok($service->view($isMaster, $operator));
        }
        if ($method === 'POST') {
            $body = AdminApi::readJson();
            $kind = (string) ($body['kind'] ?? '');
            $variant = (string) ($body['variant'] ?? '');
            $action = (string) ($body['action'] ?? '');
            if ($action === 'preview') {
                AdminApi::ok(['mail' => $service->preview($kind, $variant)]);
            }
            if ($action === 'test') {
                $to = $service->sendTest($kind, $variant, $operator);
                AdminApi::ok(['to' => $to, 'view' => $service->view($isMaster, $operator)]);
            }
            AdminApi::fail(422, 'validation', 'action 은 preview 또는 test 입니다.');
        }
        AdminApi::fail(405, 'method_not_allowed', 'GET · POST · PATCH만 허용됩니다.');
    } catch (RuntimeException $e) {
        match ($e->getMessage()) {
            MemberMailSettings::SCHEMA_MISSING => AdminApi::fail(503, 'schema_missing', '설정 저장 테이블이 없습니다. sql/schema/070_site_settings.sql 을 적용해 주세요.'),
            'test_limit' => AdminApi::fail(429, 'test_limit', '오늘 보낼 수 있는 시험 메일을 모두 썼어요. 내일 다시 보내 주세요.'),
            'send_failed' => AdminApi::fail(502, 'send_failed', '시험 메일을 보내지 못했어요. 잠시 뒤 다시 시도해 주세요.'),
            default => throw $e,
        };
    }
});
