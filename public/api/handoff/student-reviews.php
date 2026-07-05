<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Handoff\HandoffApi;
use Study114\Handoff\HandoffService;

HandoffApi::bootstrap();

HandoffApi::run(static function (): void {
    $service = new HandoffService();
    $auth = HandoffApi::requireAuth();
    $userId = (int) $auth['user_id'];
    $method = HandoffApi::method();

    $defaultRole = HandoffApi::resolveProviderRole($auth);

    if ($method === 'GET') {
        HandoffApi::ok([
            'items' => $service->listStudentReviews($userId),
            'max'   => HandoffService::STUDENT_REVIEW_MAX,
        ]);
    }

    if ($method === 'POST') {
        if ($defaultRole === null) {
            HandoffApi::fail(403, 'forbidden', '공급자(과외·공부방)만 검토함을 사용할 수 있습니다.');
        }
        $input = HandoffApi::readJson();
        $studentId = (int) ($input['student_id'] ?? $input['target_id'] ?? 0);
        $providerRole = (string) ($input['provider_role'] ?? $defaultRole);
        if ($studentId <= 0) {
            HandoffApi::fail(422, 'validation', 'student_id가 필요합니다.');
        }
        $added = $service->toggleStudentReview($userId, $studentId, $providerRole);
        HandoffApi::ok([
            'in_review'      => $added,
            'student_id'     => $studentId,
            'provider_role'  => $providerRole,
        ]);
    }

    if ($method === 'DELETE') {
        $studentId = HandoffApi::queryInt('student_id') ?: HandoffApi::queryInt('target_id');
        if ($studentId <= 0) {
            HandoffApi::fail(422, 'validation', 'student_id가 필요합니다.');
        }
        $service->removeStudentReview($userId, $studentId);
        HandoffApi::ok(['removed' => true, 'student_id' => $studentId]);
    }

    HandoffApi::fail(405, 'method_not_allowed', 'GET · POST · DELETE만 허용됩니다.');
});
