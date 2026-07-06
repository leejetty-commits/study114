<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Registration\RegistrationApi;
use Study114\Registration\TutorHubService;

RegistrationApi::bootstrap();

RegistrationApi::run(static function (): void {
    $auth = RegistrationApi::requireAuth();
    RegistrationApi::requireRole($auth, 'tutor');
    $userId = (int) $auth['user_id'];
    $service = new TutorHubService();
    $method = RegistrationApi::method();

    if ($method === 'GET') {
        $id = RegistrationApi::queryInt('id');
        if ($id > 0) {
            $tutor = $service->get($userId, $id);
            if ($tutor === null) {
                RegistrationApi::fail(404, 'not_found', '과외 프로필을 찾을 수 없습니다.');
            }
            RegistrationApi::ok(['tutor' => $tutor]);
        }
        RegistrationApi::ok(['tutors' => $service->listForOwner($userId)]);
    }

    if ($method === 'PATCH') {
        $input = RegistrationApi::readJson();
        $id = (int) ($input['id'] ?? RegistrationApi::queryInt('id'));
        $action = (string) ($input['action'] ?? '');
        if ($id <= 0 || $action === '') {
            RegistrationApi::fail(422, 'validation', 'id와 action이 필요합니다.');
        }
        $result = $service->applyAction($userId, $id, $action);
        if (isset($result['ok']) && $result['ok'] === false) {
            RegistrationApi::ok($result);
        }
        RegistrationApi::ok($result);
    }

    RegistrationApi::fail(405, 'method_not_allowed', 'GET · PATCH만 허용됩니다.');
});
