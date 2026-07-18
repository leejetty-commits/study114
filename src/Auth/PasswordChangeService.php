<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use PDO;
use RuntimeException;
use Study114\Database\Connection;

/** 로그인 세션 기준 — 마이페이지 비밀번호 변경 */
final class PasswordChangeService
{
    /**
     * @throws InvalidArgumentException
     */
    public function change(
        int $userId,
        string $currentPassword,
        string $newPassword,
        string $confirmPassword
    ): void {
        if ($userId < 1) {
            throw new InvalidArgumentException('로그인이 필요합니다.');
        }

        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            'SELECT u.email, u.password_hash, p.real_name AS name, p.phone
             FROM users u
             INNER JOIN user_profiles p ON p.user_id = u.id
             WHERE u.id = ? AND u.status = ?
             LIMIT 1'
        );
        $stmt->execute([$userId, 'active']);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            throw new InvalidArgumentException('계정을 찾을 수 없습니다.');
        }

        $hash = (string) ($row['password_hash'] ?? '');
        if ($hash === '' || !password_verify($currentPassword, $hash)) {
            throw new InvalidArgumentException('현재 비밀번호가 올바르지 않습니다.');
        }

        if ($currentPassword === $newPassword) {
            throw new InvalidArgumentException('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
        }

        try {
            (new PasswordPolicy())->validate($newPassword, $confirmPassword, [
                'email' => (string) ($row['email'] ?? ''),
                'name'  => (string) ($row['name'] ?? ''),
                'phone' => (string) ($row['phone'] ?? ''),
            ]);
        } catch (InvalidArgumentException $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, '일치')) {
                throw new InvalidArgumentException('비밀번호가 서로 일치하지 않습니다.', 0, $e);
            }
            if (str_contains($msg, '8~14')) {
                throw new InvalidArgumentException('8~14자 이내로 입력해 주세요.', 0, $e);
            }
            if (str_contains($msg, '영문') || str_contains($msg, '숫자') || str_contains($msg, '특수')) {
                throw new InvalidArgumentException('영문, 숫자, 특수문자를 모두 포함해 주세요.', 0, $e);
            }
            throw new InvalidArgumentException(
                '사용할 수 없는 비밀번호입니다. 더 안전한 비밀번호로 다시 입력해 주세요.',
                0,
                $e
            );
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
        if ($newHash === false) {
            throw new RuntimeException('비밀번호 저장에 실패했습니다.');
        }

        try {
            $pdo->prepare(
                'UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = NOW() WHERE id = ?'
            )->execute([$newHash, $userId]);
        } catch (\Throwable) {
            $pdo->prepare('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?')
                ->execute([$newHash, $userId]);
        }

        (new AuthTokenRepository($pdo))->invalidatePurpose($userId, 'password_reset');
        AuthSession::clearMustChangePassword();
    }
}
