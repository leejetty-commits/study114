<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Support\SupportApi;
use Study114\Support\SupportTicketService;

SupportApi::bootstrap();

SupportApi::run(static function (): void {
    $service = new SupportTicketService();
    $method = SupportApi::method();

    if ($method === 'GET') {
        $admin = SupportApi::queryString('admin');
        $mine = SupportApi::queryString('mine');
        $email = SupportApi::queryString('email');
        if ($admin === '1') {
            SupportApi::requireAdmin();
            $userId = SupportApi::queryInt('user_id', 0);
            if ($userId > 0) {
                SupportApi::ok(['tickets' => $service->listForUserId($userId)]);
            }
            $group = SupportApi::queryString('group') ?? 'open';
            $q = SupportApi::queryString('q') ?? '';
            $page = max(1, SupportApi::queryInt('page', 1));
            SupportApi::ok($service->listAdmin($group, $q, $page));
        }
        if ($mine === '1' || ($email !== null && $email !== '')) {
            $auth = SupportApi::requireUser();
            SupportApi::ok(['tickets' => $service->listMine((int) $auth['user_id'])]);
        }
        SupportApi::requireAdmin();
        SupportApi::ok(['tickets' => $service->list(null)]);
    }

    if ($method === 'POST') {
        $auth = SupportApi::requireUser();
        $ticket = $service->create($auth, SupportApi::readJson());
        SupportApi::ok(['ticket' => $ticket]);
    }

    if ($method === 'PATCH') {
        SupportApi::requireAdmin();
        $input = SupportApi::readJson();
        $id = trim((string) ($input['id'] ?? ''));
        try {
            $ticket = $service->patch($id, $input);
        } catch (\RuntimeException $e) {
            if (str_starts_with($e->getMessage(), 'schema_missing')) {
                SupportApi::fail(503, 'schema_missing', '운영자 답변 컬럼이 없습니다. sql/schema/068_support_ticket_admin_reply.sql 을 적용해 주세요.');
            }
            throw $e;
        }
        if ($ticket === null) {
            SupportApi::fail(404, 'not_found', '티켓을 찾을 수 없습니다.');
        }
        SupportApi::ok(['ticket' => $ticket]);
    }

    SupportApi::fail(405, 'method_not_allowed', 'GET · POST · PATCH만 허용됩니다.');
});
