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
        $email = SupportApi::queryString('email');
        SupportApi::ok(['tickets' => $service->list($email)]);
    }

    if ($method === 'POST') {
        $ticket = $service->create(SupportApi::readJson());
        SupportApi::ok(['ticket' => $ticket]);
    }

    if ($method === 'PATCH') {
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
