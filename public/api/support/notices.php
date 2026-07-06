<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Support\SupportApi;
use Study114\Support\SupportNoticeService;

SupportApi::bootstrap();

SupportApi::run(static function (): void {
    $service = new SupportNoticeService();
    $method = SupportApi::method();

    if ($method === 'GET') {
        SupportApi::ok(['notices' => $service->list()]);
    }

    if ($method === 'POST') {
        $notice = $service->save(SupportApi::readJson());
        SupportApi::ok(['notice' => $notice]);
    }

    if ($method === 'DELETE') {
        $id = SupportApi::queryString('id', '');
        if ($id === '') {
            SupportApi::fail(422, 'validation', 'id가 필요합니다.');
        }
        $service->delete($id);
        SupportApi::ok(['deleted' => true]);
    }

    if ($method === 'PATCH') {
        $input = SupportApi::readJson();
        $action = (string) ($input['action'] ?? '');
        if ($action !== 'reset_seed') {
            SupportApi::fail(422, 'validation', 'action: reset_seed');
        }
        SupportApi::ok(['notices' => $service->resetSeed()]);
    }

    SupportApi::fail(405, 'method_not_allowed', 'GET · POST · PATCH · DELETE만 허용됩니다.');
});
