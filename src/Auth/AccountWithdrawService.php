<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use PDO;
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
            $this->releaseLoginIdentifiers($pdo, $userId);
            return [
                'user_id' => $userId,
                'status' => 'withdrawn',
            ];
        }

        $pdo->beginTransaction();
        try {
            $upd = $pdo->prepare(
                'UPDATE users SET status = ?, deleted_at = ?, updated_at = NOW() WHERE id = ? AND status <> ? LIMIT 1'
            );
            $ok = $upd->execute(['withdrawn', date('Y-m-d H:i:s'), $userId, 'withdrawn']);
            if (!$ok || $upd->rowCount() < 1) {
                throw new RuntimeException('탈퇴 처리에 실패했습니다.');
            }
            $this->releaseLoginIdentifiers($pdo, $userId);
            $pdo->commit();
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        return [
            'user_id' => $userId,
            'status' => 'withdrawn',
        ];
    }

    /**
     * 탈퇴 행이 로그인 ID(이메일)·소셜 연동을 붙잡고 있지 않게 한다.
     * UNIQUE(email) 때문에 같은 메일로 재가입이 막히던 상태를 푼다.
     */
    public function releaseLoginIdentifiers(PDO $pdo, int $userId): void
    {
        if ($userId < 1) {
            return;
        }
        $tombstone = sprintf(
            'withdrawn.%d.%s@users.study114.local',
            $userId,
            bin2hex(random_bytes(4))
        );
        $pdo->prepare(
            'UPDATE users SET email = ?, email_verified_at = NULL, updated_at = NOW() WHERE id = ? LIMIT 1'
        )->execute([$tombstone, $userId]);

        try {
            $pdo->prepare('DELETE FROM user_oauth_accounts WHERE user_id = ?')->execute([$userId]);
        } catch (\Throwable $e) {
            error_log('[withdraw] oauth unlink: ' . $e->getMessage());
        }
        try {
            (new AuthTokenRepository($pdo))->invalidateAll($userId);
        } catch (\Throwable $e) {
            error_log('[withdraw] tokens: ' . $e->getMessage());
        }
    }
}
