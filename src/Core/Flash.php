<?php

declare(strict_types=1);

namespace Study114\Core;

use Study114\Auth\AuthSession;

final class Flash
{
    public static function set(string $key, mixed $value): void
    {
        AuthSession::start();
        $_SESSION['_flash'][$key] = $value;
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        AuthSession::start();
        if (!isset($_SESSION['_flash'][$key])) {
            return $default;
        }
        $value = $_SESSION['_flash'][$key];
        unset($_SESSION['_flash'][$key]);
        return $value;
    }

    /** @return list<string> */
    public static function pullErrors(): array
    {
        $errors = self::get('errors');
        return is_array($errors) ? $errors : [];
    }
}
