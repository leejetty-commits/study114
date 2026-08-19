<?php

declare(strict_types=1);

namespace Study114\Auth;

use PDO;
use Study114\Database\Connection;

/**
 * 가입 완료 조건 — users.email_verified_at 만.
 * 소셜 행·세션·admin_level·운영 테스트 allowlist는 통과가 아니다.
 */
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

    /**
     * 공개 GET용. 세션이 있어도 미확인이면 비로그인(게스트)으로 취급한다.
     * 개인 메타·보호 목록을 내려주면 안 되는 경로에서만 쓴다.
     *
     * @param array{user_id?: int}|null $auth
     * @return array{user_id?: int}|null
     */
    public function optionalVerifiedUser(?array $auth): ?array
    {
        if ($auth === null) {
            return null;
        }
        $userId = (int) ($auth['user_id'] ?? 0);
        if ($userId < 1 || !$this->isVerified($userId)) {
            return null;
        }

        return $auth;
    }
}
