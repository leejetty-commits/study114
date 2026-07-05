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
        $targetType = HandoffApi::queryString('target_type');
        if ($targetType !== null) {
            HandoffApi::assertProviderTargetType($targetType);
        }
        HandoffApi::ok([
            'items' => $service->listFavorites($userId, $targetType),
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
        $added = $service->toggleFavorite($userId, $targetType, $targetId);
        HandoffApi::ok([
            'in_favorite' => $added,
            'target_type' => $targetType,
            'target_id'   => $targetId,
        ]);
    }

    if ($method === 'DELETE') {
        $targetType = HandoffApi::queryString('target_type', '');
        $targetId = HandoffApi::queryInt('target_id');
        HandoffApi::assertProviderTargetType((string) $targetType);
        if ($targetId <= 0) {
            HandoffApi::fail(422, 'validation', 'target_id가 필요합니다.');
        }
        $service->removeFavorite($userId, (string) $targetType, $targetId);
        HandoffApi::ok(['removed' => true]);
    }

    HandoffApi::fail(405, 'method_not_allowed', 'GET · POST · DELETE만 허용됩니다.');
});
