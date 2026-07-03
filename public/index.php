<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/src/bootstrap.php';
require_once dirname(__DIR__) . '/src/helpers.php';

use Study114\Core\Router;

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if ($uri !== '/' && $uri !== '/index.php') {
    $static = __DIR__ . $uri;
    if (is_file($static)) {
        return false;
    }
}

/** @var Router $router */
$router = require dirname(__DIR__) . '/src/routes/web.php';
$router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $uri);
