<?php

declare(strict_types=1);

namespace Study114\Board;

/**
 * Channel ACL — FE board-channel-acl.js 와 동일 규칙
 * concern-family ≡ concern-parent
 */
final class BoardChannelAcl
{
    /** @var list<string> */
    private const BOARD_ROLES = ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'verified', 'admin'];

    /** @var array<string, list<string>> */
    private const LIST_ROLES = [
        'notice' => ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
        'faq' => ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
        'safe-guide' => ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
        'library' => ['member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
        'library-template' => ['member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
        'library-guide-pdf' => ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
        'submission' => ['supply-room', 'supply-tutor', 'admin'],
        'concern-director' => ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
        'concern-tutor' => ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
        'concern-parent' => ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
        'concern-solved' => ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
    ];

    /** @var array<string, list<string>> */
    private const DETAIL_ROLES = [
        'notice' => ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
        'faq' => ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
        'safe-guide' => ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
        'library' => ['member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
        'library-template' => ['member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
        'library-guide-pdf' => ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
        'submission' => ['supply-room', 'supply-tutor', 'admin'],
        'concern-director' => ['supply-room', 'admin'],
        'concern-tutor' => ['supply-tutor', 'admin'],
        'concern-parent' => ['demand', 'member', 'admin'],
        'concern-solved' => ['member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
    ];

    /** @var array<string, list<string>> */
    private const COMPOSE_ROLES = [
        'notice' => ['admin'],
        'faq' => ['admin'],
        'safe-guide' => ['admin'],
        'library' => ['admin'],
        'library-template' => ['admin'],
        'library-guide-pdf' => ['admin'],
        'submission' => ['supply-room', 'supply-tutor'],
        'concern-director' => ['supply-room'],
        'concern-tutor' => ['supply-tutor'],
        'concern-parent' => ['demand', 'member'],
        'concern-solved' => ['member', 'demand', 'supply-room', 'supply-tutor'],
    ];

    /** @var array<string, list<string>> */
    private const DOWNLOAD_ROLES = [
        'library' => ['member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
        'library-template' => ['member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
        'library-guide-pdf' => ['member', 'demand', 'supply-room', 'supply-tutor', 'admin'],
        'submission' => ['supply-room', 'supply-tutor', 'admin'],
    ];

    public static function normalizeBoardKey(string $boardKey): string
    {
        $key = trim($boardKey);
        if ($key === 'concern-family') {
            return 'concern-parent';
        }

        return $key;
    }

    /**
     * @param array{role_type?: string}|null $auth
     */
    public static function boardRoleFromAuth(?array $auth): string
    {
        if ($auth === null) {
            return 'guest';
        }
        $roleType = (string) ($auth['role_type'] ?? '');
        if ($roleType === 'guardian_student' || $roleType === 'parent' || $roleType === 'student') {
            return 'demand';
        }
        if ($roleType === 'study_room') {
            return 'supply-room';
        }
        if ($roleType === 'tutor') {
            return 'supply-tutor';
        }
        if ($roleType === 'admin') {
            return 'admin';
        }

        return 'member';
    }

    public static function canList(string $boardKey, string $boardRole): bool
    {
        $key = self::normalizeBoardKey($boardKey);
        $roles = self::LIST_ROLES[$key] ?? null;
        if ($roles === null) {
            return false;
        }

        return in_array($boardRole, $roles, true);
    }

    public static function canDetail(string $boardKey, string $boardRole): bool
    {
        $key = self::normalizeBoardKey($boardKey);
        $roles = self::DETAIL_ROLES[$key] ?? null;
        if ($roles === null) {
            return false;
        }

        return in_array($boardRole, $roles, true);
    }

    public static function canCompose(string $boardKey, string $boardRole): bool
    {
        if ($boardRole === 'guest') {
            return false;
        }
        $key = self::normalizeBoardKey($boardKey);
        $roles = self::COMPOSE_ROLES[$key] ?? [];

        return in_array($boardRole, $roles, true);
    }

    public static function canComment(string $boardKey, string $boardRole): bool
    {
        if ($boardRole === 'guest') {
            return false;
        }
        $key = self::normalizeBoardKey($boardKey);
        if ($key === 'concern-solved') {
            return self::canDetail($key, $boardRole);
        }
        if (str_starts_with($key, 'concern-')) {
            return self::canCompose($key, $boardRole);
        }

        return self::canCompose($key, $boardRole);
    }

    public static function canDownload(string $boardKey, string $boardRole): bool
    {
        if ($boardRole === 'guest') {
            return false;
        }
        $key = self::normalizeBoardKey($boardKey);
        $roles = self::DOWNLOAD_ROLES[$key] ?? [];

        return in_array($boardRole, $roles, true);
    }

    public static function isConcern(string $boardKey): bool
    {
        return str_starts_with(self::normalizeBoardKey($boardKey), 'concern-');
    }

    /** @return list<string> */
    public static function knownBoardRoles(): array
    {
        return self::BOARD_ROLES;
    }
}
