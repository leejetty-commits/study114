<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Board\BoardApi;
use Study114\Board\ConcernService;

BoardApi::bootstrap();

BoardApi::run(static function (): void {
    $service = new ConcernService();
    $method = BoardApi::method();

    if ($method === 'POST') {
        $auth = BoardApi::requireAuth();
        $json = BoardApi::readJson();
        $postId = (int) ($json['post_id'] ?? 0);
        if ($postId <= 0) {
            BoardApi::fail(422, 'validation', 'post_id가 필요합니다.');
        }
        $kind = trim((string) ($json['kind'] ?? ''));
        if ($kind === '') {
            BoardApi::fail(422, 'validation', 'kind(empathy · helpful · cheer)가 필요합니다.');
        }
        $commentId = isset($json['comment_id']) && $json['comment_id'] !== null
            ? (int) $json['comment_id']
            : null;
        $result = $service->toggleReaction($postId, $commentId, $kind, $auth);
        BoardApi::ok($result);
    }

    BoardApi::fail(405, 'method_not_allowed', 'POST만 허용됩니다.');
});
