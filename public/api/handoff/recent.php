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
        HandoffApi::ok([
            'items' => $service->listRecent($userId),
            'max'   => HandoffService::RECENT_MAX,
        ]);
    }

    if ($method === 'POST') {
        $input = HandoffApi::readJson();
        $action = (string) ($input['action'] ?? 'record');
        $targetType = (string) ($input['target_type'] ?? '');
        $targetId = (int) ($input['target_id'] ?? 0);
        HandoffApi::assertRecentTargetType($targetType);
        if ($targetId <= 0) {
            HandoffApi::fail(422, 'validation', 'target_id가 필요합니다.');
        }

        if ($action === 'patch') {
            $service->patchRecentHandoff(
                $userId,
                $targetType,
                $targetId,
                isset($input['last_route']) ? (string) $input['last_route'] : null,
                (string) ($input['last_action'] ?? 'view_detail'),
            );
            HandoffApi::ok(['patched' => true]);
        }

        $title = (string) ($input['title_snapshot'] ?? $input['title'] ?? '');
        if ($title === '') {
            HandoffApi::fail(422, 'validation', 'title_snapshot이 필요합니다.');
        }
        $service->recordRecentView(
            $userId,
            $targetType,
            $targetId,
            $title,
            isset($input['last_route']) ? (string) $input['last_route'] : null,
            (string) ($input['last_action'] ?? 'view_detail'),
        );
        HandoffApi::ok(['recorded' => true]);
    }

    HandoffApi::fail(405, 'method_not_allowed', 'GET · POST만 허용됩니다.');
});
