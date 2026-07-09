<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/src/bootstrap.php';
require_once dirname(__DIR__) . '/src/helpers.php';

use Study114\Core\Router;

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

// 정적 파일 우선 (api/*.php, assets/*, 빌드된 SPA 자산)
// 루트 / 는 DirectoryIndex index.html(home-ui) → index.php 순 (.htaccess)
if ($uri !== '/' && $uri !== '/index.php') {
    $static = __DIR__ . $uri;
    if (is_file($static)) {
        return false;
    }
}

/** @var Router $router */
$router = require dirname(__DIR__) . '/src/routes/web.php';
$router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $uri);
