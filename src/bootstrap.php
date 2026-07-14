<?php

declare(strict_types=1);

spl_autoload_register(static function (string $class): void {
    $prefix = 'Study114\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $relative = str_replace('\\', DIRECTORY_SEPARATOR, substr($class, strlen($prefix)));
    $file = dirname(__DIR__) . '/src/' . $relative . '.php';
    if (is_file($file)) {
        require $file;
    }
});

function study114_config(string $name): array
{
    $path = dirname(__DIR__) . '/config/' . $name . '.php';
    if (!is_file($path)) {
        throw new RuntimeException("Config not found: {$name}");
    }
    /** @var array $config */
    $config = require $path;
    return $config;
}

/** SetEnv / putenv / $_SERVER 순으로 환경값을 읽는다. */
function study114_env(string $key, string $default = ''): string
{
    $value = getenv($key);
    if (is_string($value) && $value !== '') {
        return $value;
    }
    if (isset($_ENV[$key]) && is_string($_ENV[$key]) && $_ENV[$key] !== '') {
        return $_ENV[$key];
    }
    if (isset($_SERVER[$key]) && is_string($_SERVER[$key]) && $_SERVER[$key] !== '') {
        return $_SERVER[$key];
    }

    return $default;
}

/** 현재 요청의 공개 origin (http/https + host). CLI·비웹이면 null. */
function study114_request_origin(): ?string
{
    $host = (string) ($_SERVER['HTTP_HOST'] ?? '');
    if ($host === '') {
        return null;
    }
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (string) ($_SERVER['SERVER_PORT'] ?? '') === '443'
        || strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';

    return ($https ? 'https' : 'http') . '://' . $host;
}
