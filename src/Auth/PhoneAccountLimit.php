<?php

declare(strict_types=1);

namespace Study114\Auth;

use PDO;

/**
 * 같은 휴대폰 번호로 가입 가능한 활성 계정 상한.
 * 탈퇴·테스트 허용목록 계정은 기본으로 세지 않는다.
 */
final class PhoneAccountLimit
{
    public const MAX_ACCOUNTS_PER_PHONE = 3;

    /**
     * true면 탈퇴(status=withdrawn)도 카운트에 포함.
     * 권장안(우동공과3): false — 탈퇴 시 번호가 비워지고 재가입을 막지 않기 위함.
     */
    public const COUNT_WITHDRAWN = false;

    public const ERROR_CODE = 'phone_account_limit';

    public const MESSAGE = '이 휴대폰 번호로는 이미 3개의 계정이 가입되어 있어요. 한 번호로는 최대 3개 계정까지 만들 수 있어요. 기존 계정으로 로그인하시거나, 아이디가 기억나지 않으시면 아이디 찾기를 이용해 주세요.';

    /**
     * 활성(비탈퇴) · 비허용목록 계정 수. $excludeUserId 는 번호 변경 시 자기 자신.
     * $forUpdate=true 이면 매칭 행을 FOR UPDATE 로 잠근 뒤 센다(가입 트랜잭션용).
     */
    public static function countActiveAccounts(
        PDO $pdo,
        string $phoneDigits,
        ?int $excludeUserId = null,
        bool $forUpdate = false,
    ): int {
        $phone = PhoneNormalizer::digits($phoneDigits);
        if ($phone === '' || !PhoneNormalizer::isValidMobile($phone)) {
            return 0;
        }

        $allowEmails = TestAccountAllowlist::emails();
        $sql = 'SELECT p.user_id
                  FROM user_profiles p
                  INNER JOIN users u ON u.id = p.user_id
                 WHERE p.phone = ?';
        $params = [$phone];

        if (!self::COUNT_WITHDRAWN) {
            $sql .= " AND u.status <> 'withdrawn'";
        }

        if ($allowEmails !== []) {
            $placeholders = implode(',', array_fill(0, count($allowEmails), '?'));
            $sql .= " AND LOWER(TRIM(u.email)) NOT IN ({$placeholders})";
            foreach ($allowEmails as $email) {
                $params[] = $email;
            }
        }

        if ($excludeUserId !== null && $excludeUserId > 0) {
            $sql .= ' AND p.user_id <> ?';
            $params[] = $excludeUserId;
        }

        if ($forUpdate) {
            $sql .= ' FOR UPDATE';
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);

        return is_array($rows) ? count($rows) : 0;
    }

    /**
     * 상한 도달 시 PhoneAccountLimitException.
     * $actorEmail 이 테스트 허용목록이면 검사 자체를 건너뛴다.
     */
    public static function assertUnderLimit(
        PDO $pdo,
        string $phoneDigits,
        ?int $excludeUserId = null,
        ?string $actorEmail = null,
        bool $forUpdate = false,
    ): void {
        if ($actorEmail !== null && TestAccountAllowlist::contains($actorEmail)) {
            return;
        }

        $count = self::countActiveAccounts($pdo, $phoneDigits, $excludeUserId, $forUpdate);
        if ($count >= self::MAX_ACCOUNTS_PER_PHONE) {
            throw new PhoneAccountLimitException();
        }
    }
}
