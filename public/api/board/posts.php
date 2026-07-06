<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Board\BoardApi;
use Study114\Board\BoardPostService;

BoardApi::bootstrap();

BoardApi::run(static function (): void {
    $service = new BoardPostService();
    $method = BoardApi::method();

    if ($method === 'GET') {
        $boardKey = BoardApi::queryString('board_key', '');
        if ($boardKey === null || $boardKey === '') {
            BoardApi::fail(422, 'validation', 'board_key가 필요합니다.');
        }
        $authorRole = BoardApi::queryString('author_role');
        $postKey = BoardApi::queryString('post_key') ?? BoardApi::queryString('id');
        BoardApi::ok(['posts' => $service->list($boardKey, $authorRole, $postKey)]);
    }

    if ($method === 'POST') {
        $post = $service->save(BoardApi::readJson());
        BoardApi::ok(['post' => $post]);
    }

    if ($method === 'DELETE') {
        $boardKey = BoardApi::queryString('board_key', '');
        $postKey = BoardApi::queryString('post_key') ?? BoardApi::queryString('id');
        $authorRole = BoardApi::queryString('author_role', '');
        if ($boardKey === null || $boardKey === '' || $postKey === null || $postKey === '' || $authorRole === null || $authorRole === '') {
            BoardApi::fail(422, 'validation', 'board_key, post_key, author_role가 필요합니다.');
        }
        $service->delete($boardKey, $postKey, $authorRole);
        BoardApi::ok(['deleted' => true]);
    }

    BoardApi::fail(405, 'method_not_allowed', 'GET · POST · DELETE만 허용됩니다.');
});
