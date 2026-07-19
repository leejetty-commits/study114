<?php

declare(strict_types=1);

namespace Study114\Admin;

use PDO;
use Study114\Database\Connection;

/**
 * A28 — 마스터(super_admin) / 부마스터(sub_master)
 * 등급 정본: users.admin_level (DB). bootstrap 이메일은 과도기 fallback.
 */
final class AdminRoleService
{
    public const LEVEL_SUPER_ADMIN = 'super_admin';
    public const LEVEL_SUB_MASTER = 'sub_master';

    /** @deprecated use LEVEL_SUPER_ADMIN */
    public const LEVEL_MASTER = self::LEVEL_SUPER_ADMIN;

    /** 초기 발급 최고관리자 — 시드 유지 · 이후 UI로만 추가 */
    private const BOOTSTRAP_SUPER_ADMIN_EMAIL = 'jetty@naver.com';

    /** @var list<string> 개발용 시드 (DB 미백필 시 fallback) */
    private const LEGACY_SUB_MASTER_EMAILS = [
        'ops@dev.local',
        'ops2@dev.local',
        'ops3@dev.local',
    ];

    /** @param array{email?: string, role_type?: string, admin_level?: ?string, user_id?: int} $auth */
    public function resolveLevel(array $auth): ?string
    {
        $fromAuth = $this->normalizeLevel($auth['admin_level'] ?? null);
        if ($fromAuth !== null) {
            return $fromAuth;
        }

        $userId = (int) ($auth['user_id'] ?? 0);
        $email = strtolower(trim((string) ($auth['email'] ?? '')));
        if ($userId > 0) {
            $fromDb = $this->fetchLevelByUserId($userId);
            if ($fromDb !== null) {
                return $fromDb;
            }
        }
        if ($email !== '') {
            $fromDb = $this->fetchLevelByEmail($email);
            if ($fromDb !== null) {
                return $fromDb;
            }
        }

        // 시장 역할 + admin_level 없음 → 운영 권한 없음 (bootstrap 이메일도 DB 없으면 미부여)
        if (($auth['role_type'] ?? '') !== 'admin') {
            return null;
        }

        if ($this->isBootstrapSuperAdminEmail($email)) {
            return self::LEVEL_SUPER_ADMIN;
        }
        if (in_array($email, self::LEGACY_SUB_MASTER_EMAILS, true) || str_ends_with($email, '@dev.local')) {
            return self::LEVEL_SUB_MASTER;
        }

        // admin 역할이지만 등급 없음 — 부마스터로 degrade
        return self::LEVEL_SUB_MASTER;
    }

    /** 시장 역할이어도 admin_level이 있으면 콘솔 접근 가능 */
    public function hasAdminCapability(array $auth): bool
    {
        return $this->resolveLevel($auth) !== null;
    }

    /** @param array{email?: string, role_type?: string, admin_level?: ?string, user_id?: int} $auth */
    public function isSuperAdmin(array $auth): bool
    {
        return $this->resolveLevel($auth) === self::LEVEL_SUPER_ADMIN;
    }

    /** @param array{email?: string, role_type?: string, admin_level?: ?string, user_id?: int} $auth */
    public function isMaster(array $auth): bool
    {
        return $this->isSuperAdmin($auth);
    }

    public function isBootstrapSuperAdminEmail(string $email): bool
    {
        return strtolower(trim($email)) === self::BOOTSTRAP_SUPER_ADMIN_EMAIL;
    }

    /** @deprecated use isBootstrapSuperAdminEmail */
    public function isMasterEmail(string $email): bool
    {
        return $this->isBootstrapSuperAdminEmail($email);
    }

    /** @return list<string> */
    public function listMasterEmails(): array
    {
        return [self::BOOTSTRAP_SUPER_ADMIN_EMAIL];
    }

    /** @return list<string> */
    public function listSubMasterEmails(): array
    {
        return self::LEGACY_SUB_MASTER_EMAILS;
    }

    /** @param array{email?: string, role_type?: string, admin_level?: ?string, user_id?: int} $auth */
    public function canAccessMenu(array $auth, string $menuId): bool
    {
        $level = $this->resolveLevel($auth);
        if ($level === null) {
            return false;
        }
        if ($level === self::LEVEL_SUPER_ADMIN) {
            return true;
        }

        return !in_array($menuId, [
            'permissions',
            'settings',
            'system',
        ], true);
    }

    /** @param array{email?: string, role_type?: string, admin_level?: ?string, user_id?: int} $auth */
    public function canWriteCommerceCorrection(array $auth, string $action): bool
    {
        $level = $this->resolveLevel($auth);
        if ($level === self::LEVEL_SUPER_ADMIN) {
            return true;
        }
        if ($level === self::LEVEL_SUB_MASTER) {
            return in_array($action, ['hide', 'publish', 'internal_note'], true);
        }

        return false;
    }

    public function normalizeLevel(mixed $level): ?string
    {
        $v = strtolower(trim((string) $level));
        if ($v === 'master') {
            $v = self::LEVEL_SUPER_ADMIN;
        }
        if ($v === self::LEVEL_SUPER_ADMIN || $v === self::LEVEL_SUB_MASTER) {
            return $v;
        }

        return null;
    }

    public function fetchLevelByUserId(int $userId): ?string
    {
        if ($userId < 1) {
            return null;
        }
        try {
            $pdo = Connection::get();
            $stmt = $pdo->prepare('SELECT admin_level FROM users WHERE id = ? LIMIT 1');
            $stmt->execute([$userId]);
            $raw = $stmt->fetchColumn();

            return $this->normalizeLevel($raw !== false ? $raw : null);
        } catch (\Throwable) {
            return null;
        }
    }

    public function fetchLevelByEmail(string $email): ?string
    {
        $email = strtolower(trim($email));
        if ($email === '') {
            return null;
        }
        try {
            $pdo = Connection::get();
            $stmt = $pdo->prepare('SELECT admin_level FROM users WHERE email = ? LIMIT 1');
            $stmt->execute([$email]);
            $raw = $stmt->fetchColumn();

            return $this->normalizeLevel($raw !== false ? $raw : null);
        } catch (\Throwable) {
            return null;
        }
    }

    /** @return array{must_change_password: bool, admin_level: ?string}|null */
    public function fetchAuthFlags(int $userId): ?array
    {
        if ($userId < 1) {
            return null;
        }
        try {
            $pdo = Connection::get();
            $stmt = $pdo->prepare(
                'SELECT admin_level, must_change_password FROM users WHERE id = ? LIMIT 1'
            );
            $stmt->execute([$userId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!is_array($row)) {
                return null;
            }

            return [
                'admin_level' => $this->normalizeLevel($row['admin_level'] ?? null),
                'must_change_password' => (int) ($row['must_change_password'] ?? 0) === 1,
            ];
        } catch (\Throwable) {
            return null;
        }
    }

    public function countActiveSuperAdmins(?PDO $pdo = null): int
    {
        $pdo ??= Connection::get();
        $stmt = $pdo->query(
            "SELECT COUNT(*) FROM users u
             WHERE u.admin_level = 'super_admin' AND u.status = 'active'"
        );

        return (int) ($stmt ? $stmt->fetchColumn() : 0);
    }
}
