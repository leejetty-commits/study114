<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use RuntimeException;
use Study114\Database\Connection;

final class AccountWithdrawService
{
    public const CONFIRM_TEXT = '탈퇴합니다';

    /**
     * @return array{user_id: int, status: string}
     */
    public function withdraw(int $userId, string $confirmText): array
    {
        if ($userId < 1) {
            throw new InvalidArgumentException('로그인이 필요합니다.');
        }
        if (trim($confirmText) !== self::CONFIRM_TEXT) {
            throw new InvalidArgumentException('확인 문구가 올바르지 않습니다. 「탈퇴합니다」를 입력해 주세요.');
        }

        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT id, status FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            throw new RuntimeException('계정을 찾을 수 없습니다.');
        }

        if ((string) ($row['status'] ?? '') === 'withdrawn') {
            throw new RuntimeException('이미 탈퇴 처리된 계정입니다.');
        }

        $upd = $pdo->prepare(
            'UPDATE users SET status = ?, deleted_at = ?, updated_at = NOW() WHERE id = ? AND status <> ? LIMIT 1'
        );
        $ok = $upd->execute(['withdrawn', date('Y-m-d H:i:s'), $userId, 'withdrawn']);
        if (!$ok || $upd->rowCount() < 1) {
            throw new RuntimeException('탈퇴 처리에 실패했습니다.');
        }

        return [
            'user_id' => $userId,
            'status' => 'withdrawn',
        ];
    }
}
