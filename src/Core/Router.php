<?php

declare(strict_types=1);

namespace Study114\Core;

use RuntimeException;

final class Router
{
    /** @var array<string, array<string, callable>> */
    private array $routes = [];

    public function get(string $path, callable $handler): self
    {
        return $this->map('GET', $path, $handler);
    }

    public function post(string $path, callable $handler): self
    {
        return $this->map('POST', $path, $handler);
    }

    public function map(string $method, string $path, callable $handler): self
    {
        $this->routes[strtoupper($method)][$this->normalize($path)] = $handler;
        return $this;
    }

    public function dispatch(string $method, string $path): void
    {
        $method = strtoupper($method);
        $path = $this->normalize($path);

        $handler = $this->routes[$method][$path] ?? null;
        if ($handler === null) {
            http_response_code(404);
            View::render('errors/not-found', ['path' => $path]);
            return;
        }

        $handler();
    }

    private function normalize(string $path): string
    {
        $path = parse_url($path, PHP_URL_PATH) ?: '/';
        if ($path !== '/' && str_ends_with($path, '/')) {
            $path = rtrim($path, '/');
        }
        return $path === '' ? '/' : $path;
    }
}
