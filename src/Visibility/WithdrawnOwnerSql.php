<?php

declare(strict_types=1);

namespace Study114\Visibility;

use InvalidArgumentException;

/**
 * 공개 카드 노출 조건.
 * 주인 users.status 가 withdrawn 이 아니면 포함한다. blocked 등 다른 상태는 그대로 둔다.
 */
final class WithdrawnOwnerSql
{
    public static function notWithdrawn(string $userIdColumn): string
    {
        if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*$/', $userIdColumn)) {
            throw new InvalidArgumentException('owner column');
        }

        return 'EXISTS (SELECT 1 FROM users owner_user WHERE owner_user.id = '
            . $userIdColumn
            . " AND owner_user.status <> 'withdrawn')";
    }
}
