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
        $effectiveRole = $roleType;
        $adminLevel = $roles->normalizeLevel($extra['admin_level'] ?? null);
        // bootstrap 이메일이라도 DB에 admin_level이 있을 때만 admin 세션
        if ($effectiveRole !== 'admin' && $roles->isBootstrapSuperAdminEmail($email)) {
            $flags = $roles->fetchAuthFlags($userId);
            if (($flags['admin_level'] ?? null) !== null) {
                $effectiveRole = 'admin';
                $adminLevel = $flags['admin_level'];
            }
        }
        if ($effectiveRole === 'admin' && $adminLevel === null) {
            $adminLevel = $roles->resolveLevel([
                'user_id' => $userId,
                'email' => $email,
                'role_type' => 'admin',
            ]);
        }
        $_SESSION['auth'] = [
            'user_id' => $userId,
            'email' => $email,
            'role_type' => $effectiveRole,
            'name' => $name,
            'admin_level' => $effectiveRole === 'admin' ? $adminLevel : null,
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
