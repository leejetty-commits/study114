<?php

declare(strict_types=1);

namespace Study114\Admin;

/** A28-08 — 마스터/부마스터 구분 (이메일 기준 seed, 추후 DB 치환) */
final class AdminRoleService
{
    public const LEVEL_MASTER = 'master';
    public const LEVEL_SUB_MASTER = 'sub_master';

    /** @var list<string> */
    private const MASTER_EMAILS = [
        'jetty@naver.com',
    ];

    /** @var list<string> */
    private const SUB_MASTER_EMAILS = [
        'ops@dev.local',
        'ops2@dev.local',
        'ops3@dev.local',
    ];

    /** @param array{email?: string, role_type?: string} $auth */
    public function resolveLevel(array $auth): ?string
    {
        if (($auth['role_type'] ?? '') !== 'admin') {
            return null;
        }
        $email = strtolower(trim((string) ($auth['email'] ?? '')));
        if ($email === '') {
            return null;
        }
        if (in_array($email, self::MASTER_EMAILS, true)) {
            return self::LEVEL_MASTER;
        }
        if (in_array($email, self::SUB_MASTER_EMAILS, true)) {
            return self::LEVEL_SUB_MASTER;
        }
        // admin 역할이지만 목록 밖 — 읽기 전용 부마스터 취급
        return self::LEVEL_SUB_MASTER;
    }

    public function isMaster(array $auth): bool
    {
        return $this->resolveLevel($auth) === self::LEVEL_MASTER;
    }

    /** @return list<string> */
    public function listMasterEmails(): array
    {
        return self::MASTER_EMAILS;
    }

    /** @return list<string> */
    public function listSubMasterEmails(): array
    {
        return self::SUB_MASTER_EMAILS;
    }

    /** @param array{email?: string, role_type?: string} $auth */
    public function canAccessMenu(array $auth, string $menuId): bool
    {
        $level = $this->resolveLevel($auth);
        if ($level === null) {
            return false;
        }
        if ($level === self::LEVEL_MASTER) {
            return true;
        }

        return !in_array($menuId, [
            'permissions',
            'settings',
            'system',
        ], true);
    }

    /** @param array{email?: string, role_type?: string} $auth */
    public function canWriteCommerceCorrection(array $auth, string $action): bool
    {
        $level = $this->resolveLevel($auth);
        if ($level === self::LEVEL_MASTER) {
            return true;
        }
        if ($level === self::LEVEL_SUB_MASTER) {
            return in_array($action, ['hide', 'publish', 'internal_note'], true);
        }

        return false;
    }
}
