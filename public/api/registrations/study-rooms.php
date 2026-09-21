<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Registration\RegistrationApi;
use Study114\Registration\StudyRoomHubService;

RegistrationApi::bootstrap();

RegistrationApi::run(static function (): void {
    $auth = RegistrationApi::requireAuth();
    RegistrationApi::requireRole($auth, 'study_room_owner');
    $userId = (int) $auth['user_id'];
    $service = new StudyRoomHubService();
    $method = RegistrationApi::method();

    if ($method === 'GET') {
        $id = RegistrationApi::queryInt('id');
        if ($id > 0) {
            $room = $service->get($userId, $id);
            if ($room === null) {
                RegistrationApi::fail(404, 'not_found', '공부방을 찾을 수 없습니다.');
            }
            RegistrationApi::ok(['room' => $room]);
        }
        RegistrationApi::ok(['rooms' => $service->listForOwner($userId)]);
    }

    if ($method === 'PATCH') {
        $input = RegistrationApi::readJson();
        $id = (int) ($input['id'] ?? RegistrationApi::queryInt('id'));
        $action = (string) ($input['action'] ?? '');
        if ($id <= 0 || $action === '') {
            RegistrationApi::fail(422, 'validation', 'id와 action이 필요합니다.');
        }
        $result = $service->applyAction($userId, $id, $action, $input);
        if (isset($result['ok']) && $result['ok'] === false) {
            RegistrationApi::ok($result);
        }
        RegistrationApi::ok($result);
    }

    RegistrationApi::fail(405, 'method_not_allowed', 'GET · PATCH만 허용됩니다.');
});
