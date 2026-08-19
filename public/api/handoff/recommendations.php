<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Handoff\HandoffApi;
use Study114\Handoff\RecommendService;

HandoffApi::bootstrap();

HandoffApi::run(static function (): void {
    $service = new RecommendService();
    $method = HandoffApi::method();

    if ($method === 'GET') {
        // 공개 집계(status) + 확인 완료 세션만 개인 recommended. 미확인은 게스트.
        $auth = HandoffApi::optionalAuth();
        $status = $service->status();
        $payload = ['status' => $status];
        $targetType = HandoffApi::queryString('target_type');
        $targetId = HandoffApi::queryInt('target_id');
        if ($auth && $targetType && $targetId > 0 && $status['ready']) {
            HandoffApi::assertProviderTargetType($targetType);
            $payload['recommended'] = $service->isRecommended(
                (int) $auth['user_id'],
                $targetType,
                $targetId
            );
        }
        HandoffApi::ok($payload);
    }

    if ($method === 'POST') {
        $auth = HandoffApi::requireAuth();
        $input = HandoffApi::readJson();
        $targetType = (string) ($input['target_type'] ?? '');
        $targetId = (int) ($input['target_id'] ?? 0);
        HandoffApi::assertProviderTargetType($targetType);
        if ($targetId <= 0) {
            HandoffApi::fail(422, 'validation', 'target_id가 필요합니다.');
        }
        $result = $service->toggle((int) $auth['user_id'], $targetType, $targetId);
        HandoffApi::ok([
            'target_type' => $targetType,
            'target_id' => $targetId,
            'recommended' => $result['recommended'],
            'recommend_count' => $result['recommend_count'],
        ]);
    }

    HandoffApi::fail(405, 'method_not_allowed', 'GET · POST만 허용됩니다.');
});
