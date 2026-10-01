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
        $auth = BoardApi::optionalVerifiedAuth();
        $view = BoardApi::queryString('view', 'hot');

        if ($view === 'best') {
            $best = $service->listBest($auth);
            BoardApi::ok(['view' => 'best', 'boards' => $best]);
        }

        $limitRaw = BoardApi::queryString('limit');

        if ($view === 'latest') {
            $latestLimit = ($limitRaw !== null && $limitRaw !== '')
                ? max(1, min((int) $limitRaw, ConcernService::LATEST_LIMIT_MAX))
                : ConcernService::LATEST_LIMIT_DEFAULT;
            BoardApi::ok(['view' => 'latest', 'posts' => $service->listLatest($auth, $latestLimit)]);
        }

        $limit = ($limitRaw !== null && $limitRaw !== '') ? max(1, min((int) $limitRaw, 20)) : 10;
        $hot = $service->listHot($auth, $limit);
        BoardApi::ok(['view' => 'hot', 'posts' => $hot]);
    }

    BoardApi::fail(405, 'method_not_allowed', 'GET만 허용됩니다.');
});
