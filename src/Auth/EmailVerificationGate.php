<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use PDO;
use Study114\Database\Connection;

/** 가입 완료 조건 — 9장 부록 §16-2. 소셜은 제공자 인증으로 통과 */
final class EmailVerificationGate
{
    public function isVerified(int $userId): bool
    {
        $stmt = Connection::get()->prepare(
            'SELECT email_verified_at FROM users WHERE id = ? AND status = ? LIMIT 1'
        );
        $stmt->execute([$userId, 'active']);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (is_array($row) && ($row['email_verified_at'] ?? null) !== null) {
            return true;
        }

        return $this->hasOAuthAccount($userId);
    }

    public function hasOAuthAccount(int $userId): bool
    {
        $stmt = Connection::get()->prepare(
            'SELECT 1 FROM user_oauth_accounts WHERE user_id = ? LIMIT 1'
        );
        $stmt->execute([$userId]);

        return (bool) $stmt->fetchColumn();
    }

    public function assertVerified(int $userId): void
    {
        if (!$this->isVerified($userId)) {
            throw new EmailVerificationRequiredException(
                '이메일 인증이 필요합니다. 메일함에서 인증 링크를 확인해 주세요.'
            );
        }
    }
}
