<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Board\BoardApi;
use Study114\Board\ConcernService;

BoardApi::bootstrap();

BoardApi::run(static function (): void {
    $service = new ConcernService();
    $method = BoardApi::method();

    if ($method === 'GET') {
        $postId = (int) BoardApi::queryString('post_id', '0');
        if ($postId <= 0) {
            BoardApi::fail(422, 'validation', 'post_id가 필요합니다.');
        }
        $auth = BoardApi::optionalVerifiedAuth();
        $userId = $auth !== null ? (int) ($auth['user_id'] ?? 0) : null;
        $comments = $service->listComments($postId, $auth, $userId);
        BoardApi::ok(['comments' => $comments]);
    }

    if ($method === 'POST') {
        $auth = BoardApi::requireAuth();
        $json = BoardApi::readJson();
        $postId = (int) ($json['post_id'] ?? 0);
        if ($postId <= 0) {
            BoardApi::fail(422, 'validation', 'post_id가 필요합니다.');
        }
        $comment = $service->addComment($postId, $json, $auth);
        BoardApi::ok(['comment' => $comment]);
    }

    if ($method === 'DELETE') {
        $auth = BoardApi::requireAuth();
        $commentId = (int) BoardApi::queryString('comment_id', '0');
        if ($commentId <= 0) {
            BoardApi::fail(422, 'validation', 'comment_id가 필요합니다.');
        }
        $service->deleteComment($commentId, $auth);
        BoardApi::ok(['deleted' => true]);
    }

    BoardApi::fail(405, 'method_not_allowed', 'GET · POST · DELETE만 허용됩니다.');
});
