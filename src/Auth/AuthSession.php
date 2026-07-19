<?php

declare(strict_types=1);

namespace Study114\Auth;

use Study114\Admin\AdminRoleService;

final class AuthSession
{
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            $secure = function_exists('study114_request_origin')
                && str_starts_with((string) study114_request_origin(), 'https://');
            session_start([
                'cookie_httponly' => true,
                'cookie_samesite' => 'Lax',
                'cookie_secure'   => $secure,
                'cookie_path'     => '/',
            ]);
        }
    }

    /**
     * 시장 역할(primary)과 운영 권한(admin_level)을 분리한다.
     * admin_level이 있어도 role_type을 admin으로 덮지 않는다 — 기본 홈은 시장 역할 홈.
     *
     * @param array{admin_level?: ?string, must_change_password?: bool} $extra
     */
    public static function login(
        int $userId,
        string $email,
        string $roleType,
        string $name,
        array $extra = [],
    ): void {
        self::start();
        $roles = new AdminRoleService();
        $adminLevel = $roles->normalizeLevel($extra['admin_level'] ?? null);
        if ($adminLevel === null) {
            $flags = $roles->fetchAuthFlags($userId);
            $adminLevel = $flags['admin_level'] ?? null;
        }
        // 순수 admin 전용 계정(primary=admin)인데 등급만 비어 있으면 resolve
        if ($roleType === 'admin' && $adminLevel === null) {
            $adminLevel = $roles->resolveLevel([
                'user_id' => $userId,
                'email' => $email,
                'role_type' => 'admin',
            ]);
        }
        $_SESSION['auth'] = [
            'user_id' => $userId,
            'email' => $email,
            'role_type' => $roleType,
            'name' => $name,
            'admin_level' => $adminLevel,
            'must_change_password' => !empty($extra['must_change_password']),
        ];
    }

    public static function logout(): void
    {
        self::start();
        unset($_SESSION['auth'], $_SESSION['signup']);
    }

    /**
     * @return array{
     *   user_id: int,
     *   email: string,
     *   role_type: string,
     *   name: string,
     *   admin_level?: ?string,
     *   must_change_password?: bool
     * }|null
     */
    public static function user(): ?array
    {
        self::start();
        $auth = $_SESSION['auth'] ?? null;
        return is_array($auth) ? $auth : null;
    }

    /** 비밀번호 변경 후 세션 플래그 갱신 */
    public static function clearMustChangePassword(): void
    {
        self::start();
        if (isset($_SESSION['auth']) && is_array($_SESSION['auth'])) {
            $_SESSION['auth']['must_change_password'] = false;
        }
    }

    /** 사이트 표시명(real_name) 변경 후 세션 name 동기화 — auth email 불변 */
    public static function updateName(string $name): void
    {
        self::start();
        if (isset($_SESSION['auth']) && is_array($_SESSION['auth'])) {
            $_SESSION['auth']['name'] = $name;
        }
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
