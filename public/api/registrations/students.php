<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Registration\RegistrationApi;
use Study114\Registration\StudentHubService;

RegistrationApi::bootstrap();

RegistrationApi::run(static function (): void {
    try {
        $auth = RegistrationApi::requireAuth();
        RegistrationApi::requireRole($auth, 'guardian_student');
        $userId = (int) $auth['user_id'];
        $service = new StudentHubService();
        $method = RegistrationApi::method();

        if ($method === 'GET') {
            $id = RegistrationApi::queryInt('id');
            if ($id > 0) {
                $student = $service->get($userId, $id);
                if ($student === null) {
                    RegistrationApi::fail(404, 'not_found', '학생 의뢰를 찾을 수 없습니다.');
                }
                RegistrationApi::ok(['student' => $student]);
            }
            RegistrationApi::ok(['students' => $service->listForGuardian($userId)]);
        }

        if ($method === 'PATCH') {
            $input = RegistrationApi::readJson();
            $id = (int) ($input['id'] ?? RegistrationApi::queryInt('id'));
            $action = (string) ($input['action'] ?? '');
            if ($id <= 0 || $action === '') {
                RegistrationApi::fail(422, 'validation', 'id와 action이 필요합니다.');
            }
            RegistrationApi::ok($service->applyAction($userId, $id, $action, $input));
        }

        RegistrationApi::fail(405, 'method_not_allowed', 'GET · PATCH만 허용됩니다.');
    } catch (
        InvalidArgumentException
        | \Study114\Registration\SchemaPrerequisiteException
        | \Study114\Auth\EmailVerificationRequiredException
        | \Study114\Auth\PhoneVerifyRequiredException
        | \Study114\Messages\PaidGateException $e
    ) {
        // 사용자 안내용 예외는 공통 처리(422·403·503)로 넘긴다.
        throw $e;
    } catch (Throwable $e) {
        error_log('[registration/students] ' . get_class($e) . ': ' . $e->getMessage());
        RegistrationApi::fail(500, 'server_error', '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
});
