<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Messages\MessagesApi;
use Study114\Paid\ProviderStatusService;

MessagesApi::bootstrap();

MessagesApi::run(static function (): void {
    $auth = MessagesApi::requireAuth();
    $userId = (int) $auth['user_id'];
    $roleType = (string) $auth['role_type'];

    if (MessagesApi::method() !== 'GET') {
        MessagesApi::fail(405, 'method_not_allowed', 'GET만 허용됩니다.');
    }

    $isProvider = in_array($roleType, ['tutor', 'study_room_owner'], true);
    $status = (new ProviderStatusService())->build($userId, $isProvider);

    MessagesApi::ok($status);
});
