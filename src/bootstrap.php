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
