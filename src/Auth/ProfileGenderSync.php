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

    /**
     * @param array<string, mixed> $input
     */
    public static function sync(int $userId, array $input): void
    {
        $gender = self::requireFromInput($input);
        $current = self::get($userId);
        if ($current === null) {
            throw new InvalidArgumentException('gender: 프로필을 찾을 수 없습니다.');
        }
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
