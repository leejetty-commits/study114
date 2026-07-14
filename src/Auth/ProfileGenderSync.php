<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use Study114\Database\Connection;

final class ProfileGenderSync
{
    public static function get(int $userId): ?string
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT gender FROM user_profiles WHERE user_id = ?');
        $stmt->execute([$userId]);
        $gender = $stmt->fetchColumn();

        return is_string($gender) && $gender !== '' ? $gender : null;
    }

    public static function profileExists(int $userId): bool
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT 1 FROM user_profiles WHERE user_id = ? LIMIT 1');
        $stmt->execute([$userId]);

        return (bool) $stmt->fetchColumn();
    }

    /**
     * @param array<string, mixed> $input
     */
    public static function sync(int $userId, array $input): void
    {
        $gender = self::requireFromInput($input);
        if (!self::profileExists($userId)) {
            throw new InvalidArgumentException('gender: 프로필을 찾을 수 없습니다.');
        }
        $current = self::get($userId);
        // OAuth 가입 시 gender는 NULL — 기본등록에서 최초 설정 허용
        if ($current === $gender) {
            return;
        }
        $pdo = Connection::get();
        $stmt = $pdo->prepare('UPDATE user_profiles SET gender = ? WHERE user_id = ?');
        $stmt->execute([$gender, $userId]);
    }

    /**
     * @param array<string, mixed> $input
     */
    public static function requireFromInput(array $input): string
    {
        $value = (string) ($input['gender'] ?? '');
        if (!in_array($value, ['male', 'female'], true)) {
            throw new InvalidArgumentException('gender: 필수 입력입니다.');
        }

        return $value;
    }
}
