<?php

declare(strict_types=1);

namespace Study114\Visibility;

use PDO;
use Study114\Auth\TestAccountAllowlist;

/**
 * 공개 목록·검색에서 테스트 계정 주인 카드를 거른다.
 * 보는 사람이 테스트 계정이면 거르지 않는다. env 비면 무동작.
 */
final class TestOwnerVisibility
{
    private static bool $viewerIsTest = false;

    /** @var list<int>|null */
    private static ?array $hiddenOwnerIds = null;

    public static function reset(): void
    {
        self::$viewerIsTest = false;
        self::$hiddenOwnerIds = null;
    }

    /**
     * @param array{email?: string}|null $authUser
     */
    public static function bindViewer(?array $authUser): void
    {
        self::$hiddenOwnerIds = null;
        $email = strtolower(trim((string) ($authUser['email'] ?? '')));
        self::$viewerIsTest = $email !== '' && TestAccountAllowlist::contains($email);
    }

    public static function viewerIsTest(): bool
    {
        return self::$viewerIsTest;
    }

    /**
     * WithdrawnOwnerSql 옆에 AND 로 붙인다.
     */
    public static function sql(PDO $pdo, string $userIdColumn): string
    {
        self::assertUserIdColumn($userIdColumn);

        if (self::$viewerIsTest) {
            return '1=1';
        }

        $ids = self::hiddenOwnerIds($pdo);
        if ($ids === []) {
            return '1=1';
        }

        $list = implode(',', array_map(static fn (int $id): string => (string) $id, $ids));

        return $userIdColumn . ' NOT IN (' . $list . ')';
    }

    /**
     * @return list<int>
     */
    private static function hiddenOwnerIds(PDO $pdo): array
    {
        if (self::$hiddenOwnerIds !== null) {
            return self::$hiddenOwnerIds;
        }
        self::$hiddenOwnerIds = TestAccountAllowlist::userIds($pdo);

        return self::$hiddenOwnerIds;
    }

    private static function assertUserIdColumn(string $userIdColumn): void
    {
        if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*$/', $userIdColumn)) {
            throw new \InvalidArgumentException('owner column');
        }
    }
}
