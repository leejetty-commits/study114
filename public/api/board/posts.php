<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Board\BoardApi;
use Study114\Board\BoardChannelAcl;
use Study114\Board\BoardPostService;
use Study114\Board\ConcernService;

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
        $view = BoardApi::queryString('view');
        $limitRaw = BoardApi::queryString('limit');
        if (BoardChannelAcl::isConcern($boardKey)) {
            // 고민방: sort(recent|hot|comments) · type · limit(기본 20, 상한 50) · offset
            $concernQuery = ConcernService::parseListQuery(
                BoardApi::queryString('sort'),
                BoardApi::queryString('type'),
                $limitRaw,
                BoardApi::queryString('offset'),
            );
            BoardApi::ok($service->list($boardKey, $authorRole, $postKey, BoardApi::optionalVerifiedAuth(), $view, null, $concernQuery));
        }
        $limit = ($limitRaw !== null && $limitRaw !== '') ? max(1, min((int) $limitRaw, 20)) : null;
        BoardApi::ok($service->list($boardKey, $authorRole, $postKey, BoardApi::optionalVerifiedAuth(), $view, $limit));
    }

    if ($method === 'POST') {
        $auth = BoardApi::requireAuth();
        $post = $service->save(BoardApi::readJson(), $auth);
        BoardApi::ok(['post' => $post]);
    }

    if ($method === 'DELETE') {
        $auth = BoardApi::requireAuth();
        $boardKey = BoardApi::queryString('board_key', '');
        $postKey = BoardApi::queryString('post_key') ?? BoardApi::queryString('id');
        $authorRole = BoardApi::queryString('author_role', '');
        if ($boardKey === null || $boardKey === '' || $postKey === null || $postKey === '') {
            BoardApi::fail(422, 'validation', 'board_key, post_key가 필요합니다.');
        }
        $service->delete($boardKey, $postKey, $authorRole ?? '', $auth);
        BoardApi::ok(['deleted' => true]);
    }

    BoardApi::fail(405, 'method_not_allowed', 'GET · POST · DELETE만 허용됩니다.');
});
