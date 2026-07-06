<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use PDO;
use RuntimeException;
use Study114\Database\Connection;

final class OAuthRoleService
{
    /** @var array<string, string> */
    private const ROLE_MAP = [
        'student'    => 'guardian_student',
        'study_room' => 'study_room_owner',
        'tutor'      => 'tutor',
    ];

    /**
     * @return array{role_type: string, needs_basic_register: bool}
     */
    public function completeRole(int $userId, string $roleUi): array
    {
        if (!isset(self::ROLE_MAP[$roleUi])) {
            throw new InvalidArgumentException('student, study_room, tutor 중 하나를 선택해 주세요.');
        }

        $roleType = self::ROLE_MAP[$roleUi];
        $pdo = Connection::get();

        if (!$this->isRolePending($pdo, $userId)) {
            throw new InvalidArgumentException('회원 구분 선택이 필요하지 않은 계정입니다.');
        }

        $pdo->beginTransaction();
        try {
            $this->clearPrimaryRoles($pdo, $userId);
            $this->upsertPrimaryRole($pdo, $userId, $roleType);
            $stmt = $pdo->prepare('UPDATE users SET oauth_role_pending = 0 WHERE id = ?');
            $stmt->execute([$userId]);
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw new RuntimeException('회원 구분 저장에 실패했습니다.', 0, $e);
        }

        return [
            'role_type'            => $roleType,
            'needs_basic_register' => in_array($roleUi, ['study_room', 'tutor'], true),
        ];
    }

    public function isRolePendingForUser(int $userId): bool
    {
        return $this->isRolePending(Connection::get(), $userId);
    }

    private function isRolePending(PDO $pdo, int $userId): bool
    {
        $stmt = $pdo->prepare('SELECT oauth_role_pending FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return is_array($row) && (int) ($row['oauth_role_pending'] ?? 0) === 1;
    }

    private function clearPrimaryRoles(PDO $pdo, int $userId): void
    {
        $stmt = $pdo->prepare('UPDATE user_roles SET is_primary = 0 WHERE user_id = ?');
        $stmt->execute([$userId]);
    }

    private function upsertPrimaryRole(PDO $pdo, int $userId, string $roleType): void
    {
        $stmt = $pdo->prepare(
            'SELECT id FROM user_roles WHERE user_id = ? AND role_type = ? LIMIT 1'
        );
        $stmt->execute([$userId, $roleType]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if (is_array($existing)) {
            $stmt = $pdo->prepare(
                'UPDATE user_roles SET is_primary = 1, status = ? WHERE id = ?'
            );
            $stmt->execute(['active', $existing['id']]);
            return;
        }

        $stmt = $pdo->prepare(
            'INSERT INTO user_roles (user_id, role_type, is_primary, status) VALUES (?, ?, 1, ?)'
        );
        $stmt->execute([$userId, $roleType, 'active']);
    }
}
