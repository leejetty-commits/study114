<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use PDO;
use Study114\Database\Connection;

/** 이메일 인증 완료 여부 — 9장 부록 §16-2 · §16-8 */
final class EmailVerificationGate
{
    public function isVerified(int $userId): bool
    {
        $stmt = Connection::get()->prepare(
            'SELECT email_verified_at FROM users WHERE id = ? AND status = ? LIMIT 1'
        );
        $stmt->execute([$userId, 'active']);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) && ($row['email_verified_at'] ?? null) !== null;
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
