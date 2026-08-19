<?php

declare(strict_types=1);

namespace Study114\Auth;

use PDO;
use Study114\Database\Connection;

/** user_profiles.phone_verified_at — 쪽지 수신 ON 내부 신뢰도 점검 */
final class PhoneVerificationService
{
    public function isVerified(int $userId): bool
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            'SELECT phone_verified_at FROM user_profiles WHERE user_id = ? LIMIT 1'
        );
        $stmt->execute([$userId]);
        $val = $stmt->fetchColumn();

        return $val !== false && $val !== null && $val !== '';
    }

    public function markVerified(int $userId): void
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            'UPDATE user_profiles SET phone_verified_at = COALESCE(phone_verified_at, NOW()), updated_at = NOW()
             WHERE user_id = ?'
        );
        $stmt->execute([$userId]);
    }
}
