<?php

declare(strict_types=1);

namespace Study114\Auth;

final class AuthSession
{
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start([
                'cookie_httponly' => true,
                'cookie_samesite' => 'Lax',
            ]);
        }
    }

    public static function login(int $userId, string $email, string $roleType, string $name): void
    {
        self::start();
        $_SESSION['auth'] = [
            'user_id'   => $userId,
            'email'     => $email,
            'role_type' => $roleType,
            'name'      => $name,
        ];
    }

    public static function logout(): void
    {
        self::start();
        unset($_SESSION['auth'], $_SESSION['signup']);
    }

    /** @return array{user_id: int, email: string, role_type: string, name: string}|null */
    public static function user(): ?array
    {
        self::start();
        $auth = $_SESSION['auth'] ?? null;
        return is_array($auth) ? $auth : null;
    }

    public static function check(): bool
    {
        return self::user() !== null;
    }

    public static function signupRole(): ?string
    {
        self::start();
        $role = $_SESSION['signup']['role'] ?? null;
        return is_string($role) ? $role : null;
    }

    public static function setSignupRole(string $role): void
    {
        self::start();
        $_SESSION['signup']['role'] = $role;
    }

    public static function termsAgreed(): bool
    {
        self::start();
        return !empty($_SESSION['signup']['terms_agreed']);
    }

    public static function markTermsAgreed(): void
    {
        self::start();
        $_SESSION['signup']['terms_agreed'] = true;
    }

    public static function resetSignup(): void
    {
        self::start();
        unset($_SESSION['signup']);
    }
}
