<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use PDO;
use Study114\Admin\AdminOperationLogRepository;

/**
 * Gmail 별칭(+·점·googlemail) 활성 계정 중복 검사.
 * 스키마 변경 없이 SQL 비교. 허용목록(정확 일치)은 canonical 검사 스킵.
 */
final class GmailAliasAvailability
{
    public const MESSAGE = '이미 가입된 이메일과 같은 Gmail 주소예요. Gmail은 점(.)이나 +뒤 글자가 달라도 같은 메일함으로 들어가서 하나의 계정만 만들 수 있어요. 기존 계정으로 로그인해 주세요.';

    public const ACTION_ALLOWLISTED = 'signup_alias_allowlisted';

    /**
     * 활성 Gmail canonical 충돌이면 예외.
     * 허용목록 정확 일치·비 Gmail·탈퇴만 있는 경우는 통과.
     */
    public static function assertNoActiveConflict(PDO $pdo, string $normalizedEmail, ?int $excludeUserId = null): void
    {
        $email = EmailNormalizer::normalize($normalizedEmail);
        if ($email === '' || !EmailNormalizer::isGmailFamily($email)) {
            return;
        }
        if (TestAccountAllowlist::contains($email)) {
            return;
        }

        $canonical = EmailNormalizer::canonical($email);
        $at = strrpos($canonical, '@');
        $local = $at === false ? $canonical : substr($canonical, 0, $at);
        if ($local === '') {
            return;
        }

        $sql = "SELECT id, email, status
                  FROM users
                 WHERE status <> 'withdrawn'
                   AND SUBSTRING_INDEX(LOWER(TRIM(email)), '@', -1) IN ('gmail.com', 'googlemail.com')
                   AND REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(LOWER(TRIM(email)), '@', 1), '+', 1), '.', '') = ?";
        $params = [$local];
        if ($excludeUserId !== null && $excludeUserId > 0) {
            $sql .= ' AND id <> ?';
            $params[] = $excludeUserId;
        }
        $sql .= ' LIMIT 1';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (is_array($row)) {
            throw new InvalidArgumentException(self::MESSAGE);
        }
    }

    public static function shouldLogAllowlistBypass(string $normalizedEmail): bool
    {
        $email = EmailNormalizer::normalize($normalizedEmail);

        return EmailNormalizer::isGmailFamily($email) && TestAccountAllowlist::contains($email);
    }

    public static function logAllowlistedSignup(PDO $pdo, int $userId, string $normalizedEmail): void
    {
        if ($userId <= 0 || !self::shouldLogAllowlistBypass($normalizedEmail)) {
            return;
        }

        (new AdminOperationLogRepository($pdo))->insert(
            'system',
            'user',
            (string) $userId,
            self::ACTION_ALLOWLISTED,
            null,
            'masked=' . EmailMasker::mask($normalizedEmail),
            false,
            false,
        );
    }
}
