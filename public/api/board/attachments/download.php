<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Board\BoardAttachmentService;
use Study114\Board\BoardApi;

BoardApi::bootstrap();

BoardApi::run(static function (): void {
    if (BoardApi::method() !== 'GET') {
        BoardApi::fail(405, 'method_not_allowed', 'GET만 허용됩니다.');
    }

    $token = BoardApi::queryString('token', '');
    if ($token === null || $token === '') {
        BoardApi::fail(422, 'validation', 'token이 필요합니다.');
    }

    try {
        $service = new BoardAttachmentService();
        $service->streamDownload($token);
    } catch (InvalidArgumentException $e) {
        BoardApi::fail(403, 'forbidden', $e->getMessage());
    }
});
