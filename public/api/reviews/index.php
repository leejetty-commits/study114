<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Reviews\ProviderReviewApi;
use Study114\Reviews\ProviderReviewService;

ProviderReviewApi::bootstrap();

ProviderReviewApi::run(static function (): void {
    $service = new ProviderReviewService();
    $method = ProviderReviewApi::method();
    $action = ProviderReviewApi::queryString('action', 'summary') ?? 'summary';

    if ($method === 'GET' && $action === 'summary') {
        $type = ProviderReviewApi::queryString('provider_type', '') ?? '';
        $id = ProviderReviewApi::queryInt('provider_id');
        $auth = ProviderReviewApi::optionalAuth();
        ProviderReviewApi::ok($service->getSummary($type, $id, $auth));
    }

    if ($method === 'GET' && $action === 'mypage') {
        $auth = ProviderReviewApi::requireAuth();
        ProviderReviewApi::ok($service->mypageSnapshot($auth));
    }

    if ($method === 'GET' && $action === 'count') {
        $type = ProviderReviewApi::queryString('provider_type', '') ?? '';
        $id = ProviderReviewApi::queryInt('provider_id');
        $summary = $service->getSummary($type, $id, null);
        ProviderReviewApi::ok([
            'provider_type' => $type,
            'provider_id' => $id,
            'review_count' => (int) ($summary['review_count'] ?? 0),
        ]);
    }

    if ($method === 'POST' && $action === 'create') {
        $auth = ProviderReviewApi::requireAuth();
        $input = ProviderReviewApi::readJson();
        $type = (string) ($input['provider_type'] ?? '');
        $id = (int) ($input['provider_id'] ?? 0);
        $origin = (string) ($input['review_origin_type'] ?? 'consultation');
        $body = (string) ($input['review_body'] ?? '');
        $tags = $input['point_tags'] ?? [];
        if (!is_array($tags)) {
            $tags = [];
        }
        ProviderReviewApi::ok($service->createReview($auth, $type, $id, $origin, $body, $tags));
    }

    if ($method === 'POST' && $action === 'reply') {
        $auth = ProviderReviewApi::requireAuth();
        $input = ProviderReviewApi::readJson();
        $reviewId = (int) ($input['review_id'] ?? 0);
        $body = (string) ($input['body'] ?? '');
        if ($reviewId <= 0) {
            ProviderReviewApi::fail(422, 'validation', 'review_id가 필요합니다.');
        }
        ProviderReviewApi::ok($service->createReply($auth, $reviewId, $body));
    }

    ProviderReviewApi::fail(405, 'method_not_allowed', '지원하지 않는 요청입니다.');
});
