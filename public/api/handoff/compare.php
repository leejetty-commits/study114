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

    if ($method === 'GET') {
        $targetType = HandoffApi::queryString('target_type', '');
        HandoffApi::assertProviderTargetType($targetType);
        $items = $service->listCompare($userId, $targetType);
        HandoffApi::ok([
            'target_type' => $targetType,
            'count'       => count($items),
            'max'         => HandoffService::COMPARE_MAX,
            'items'       => $items,
        ]);
    }

    if ($method === 'POST') {
        $input = HandoffApi::readJson();
        $targetType = (string) ($input['target_type'] ?? '');
        $targetId = (int) ($input['target_id'] ?? 0);
        HandoffApi::assertProviderTargetType($targetType);
        if ($targetId <= 0) {
            HandoffApi::fail(422, 'validation', 'target_id가 필요합니다.');
        }
        $result = $service->toggleCompare($userId, $targetType, $targetId);
        HandoffApi::ok([
            ...$result,
            'target_type' => $targetType,
            'target_id'   => $targetId,
            'count'       => $service->countCompare($userId, $targetType),
            'max'         => HandoffService::COMPARE_MAX,
        ]);
    }

    if ($method === 'DELETE') {
        $targetType = HandoffApi::queryString('target_type', '');
        HandoffApi::assertProviderTargetType($targetType);
        $targetId = HandoffApi::queryInt('target_id');
        if ($targetId > 0) {
            $service->removeCompare($userId, $targetType, $targetId);
            HandoffApi::ok([
                'removed'     => true,
                'target_type' => $targetType,
                'target_id'   => $targetId,
                'count'       => $service->countCompare($userId, $targetType),
                'max'         => HandoffService::COMPARE_MAX,
            ]);
        }
        $service->clearCompare($userId, $targetType);
        HandoffApi::ok([
            'cleared'     => true,
            'target_type' => $targetType,
            'count'       => 0,
            'max'         => HandoffService::COMPARE_MAX,
        ]);
    }

    HandoffApi::fail(405, 'method_not_allowed', 'GET · POST · DELETE만 허용됩니다.');
});
