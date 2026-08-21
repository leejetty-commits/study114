<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Reviews\ProviderReviewApi;
use Study114\Reviews\ProviderReviewService;
use Study114\Reviews\ReviewPolicy;

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

    if ($method === 'GET' && $action === 'list') {
        $type = ProviderReviewApi::queryString('provider_type', '') ?? '';
        $id = ProviderReviewApi::queryInt('provider_id');
        $page = ProviderReviewApi::queryInt('page', 1);
        $limit = ProviderReviewApi::queryInt('limit', ReviewPolicy::PAGE_SIZE);
        $auth = ProviderReviewApi::optionalAuth();
        ProviderReviewApi::ok($service->listPublic($type, $id, $page, $limit, $auth));
    }

    if ($method === 'GET' && $action === 'mypage') {
        $auth = ProviderReviewApi::requireAuth();
        ProviderReviewApi::ok($service->mypageSnapshot($auth));
    }

    if ($method === 'GET' && $action === 'inbox') {
        $auth = ProviderReviewApi::requireAuth();
        // lane: written | received | targets | ''(역할 기본: 공급자 received / 그 외 written)
        $lane = ProviderReviewApi::queryString('lane', '') ?? '';
        $page = ProviderReviewApi::queryInt('page', 1);
        $limit = ProviderReviewApi::queryInt('limit', ReviewPolicy::PAGE_SIZE);
        ProviderReviewApi::ok($service->inbox($auth, $lane, $page, $limit));
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
        $consent = !empty($input['public_consent']);
        ProviderReviewApi::ok($service->createReview($auth, $type, $id, $origin, $body, $tags, $consent));
    }

    if ($method === 'POST' && $action === 'update') {
        $auth = ProviderReviewApi::requireAuth();
        $input = ProviderReviewApi::readJson();
        $reviewId = (int) ($input['review_id'] ?? 0);
        $body = (string) ($input['review_body'] ?? '');
        $tags = $input['point_tags'] ?? [];
        if (!is_array($tags)) {
            $tags = [];
        }
        if ($reviewId <= 0) {
            ProviderReviewApi::fail(422, 'validation', 'review_id가 필요합니다.');
        }
        ProviderReviewApi::ok($service->updateReview($auth, $reviewId, $body, $tags));
    }

    if ($method === 'POST' && $action === 'hide') {
        $auth = ProviderReviewApi::requireAuth();
        $input = ProviderReviewApi::readJson();
        $reviewId = (int) ($input['review_id'] ?? 0);
        if ($reviewId <= 0) {
            ProviderReviewApi::fail(422, 'validation', 'review_id가 필요합니다.');
        }
        ProviderReviewApi::ok($service->hideReview($auth, $reviewId));
    }

    if ($method === 'POST' && $action === 'unhide') {
        $auth = ProviderReviewApi::requireAuth();
        $input = ProviderReviewApi::readJson();
        $reviewId = (int) ($input['review_id'] ?? 0);
        if ($reviewId <= 0) {
            ProviderReviewApi::fail(422, 'validation', 'review_id가 필요합니다.');
        }
        ProviderReviewApi::ok($service->unhideReview($auth, $reviewId));
    }

    if ($method === 'POST' && $action === 'delete') {
        $auth = ProviderReviewApi::requireAuth();
        $input = ProviderReviewApi::readJson();
        $reviewId = (int) ($input['review_id'] ?? 0);
        if ($reviewId <= 0) {
            ProviderReviewApi::fail(422, 'validation', 'review_id가 필요합니다.');
        }
        ProviderReviewApi::ok($service->deleteReview($auth, $reviewId));
    }

    if ($method === 'POST' && $action === 'block') {
        $auth = ProviderReviewApi::requireAuth();
        $input = ProviderReviewApi::readJson();
        $type = (string) ($input['provider_type'] ?? '');
        $id = (int) ($input['provider_id'] ?? 0);
        $authorId = (int) ($input['blocked_author_user_id'] ?? 0);
        ProviderReviewApi::ok($service->blockAuthor($auth, $type, $id, $authorId));
    }

    if ($method === 'POST' && $action === 'unblock') {
        $auth = ProviderReviewApi::requireAuth();
        $input = ProviderReviewApi::readJson();
        $type = (string) ($input['provider_type'] ?? '');
        $id = (int) ($input['provider_id'] ?? 0);
        $authorId = (int) ($input['blocked_author_user_id'] ?? 0);
        ProviderReviewApi::ok($service->unblockAuthor($auth, $type, $id, $authorId));
    }

    if ($method === 'POST' && $action === 'set_write_status') {
        $auth = ProviderReviewApi::requireAuth();
        $input = ProviderReviewApi::readJson();
        $type = (string) ($input['provider_type'] ?? '');
        $id = (int) ($input['provider_id'] ?? 0);
        $status = (string) ($input['review_write_status'] ?? '');
        ProviderReviewApi::ok($service->setWriteStatus($auth, $type, $id, $status));
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
