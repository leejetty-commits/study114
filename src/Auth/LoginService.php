<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use PDO;
use Study114\Database\Connection;

final class LoginService
{
    /**
     * @return array{
     *   user_id: int,
     *   email: string,
     *   role_type: string,
     *   name: string,
     *   admin_level: ?string,
     *   must_change_password: bool
     * }
     */
    public function attempt(string $email, string $password): array
    {
        $email = EmailNormalizer::normalize($email);
        if ($email === '' || $password === '') {
            throw new InvalidArgumentException('이메일과 비밀번호를 입력해 주세요.');
        }

        $pdo = Connection::get();
        try {
            $stmt = $pdo->prepare(
                'SELECT u.id, u.email, u.password_hash, u.status, u.admin_level, u.must_change_password,
                        p.real_name, r.role_type
                 FROM users u
                 INNER JOIN user_profiles p ON p.user_id = u.id
                 LEFT JOIN user_roles r ON r.user_id = u.id AND r.is_primary = 1 AND r.status = ?
                 WHERE u.email = ?
                 LIMIT 1'
            );
            $stmt->execute(['active', $email]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (\Throwable) {
            // 036 마이그레이션 전 호환
            $stmt = $pdo->prepare(
                'SELECT u.id, u.email, u.password_hash, u.status, p.real_name, r.role_type
                 FROM users u
                 INNER JOIN user_profiles p ON p.user_id = u.id
                 LEFT JOIN user_roles r ON r.user_id = u.id AND r.is_primary = 1 AND r.status = ?
                 WHERE u.email = ?
                 LIMIT 1'
            );
            $stmt->execute(['active', $email]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (is_array($row)) {
                $row['admin_level'] = null;
                $row['must_change_password'] = 0;
            }
        }

        if (!$row || !password_verify($password, (string) $row['password_hash'])) {
            throw new InvalidArgumentException('이메일 또는 비밀번호를 확인해 주세요.');
        }

        if ($row['status'] !== 'active') {
            throw new InvalidArgumentException('로그인할 수 없는 계정 상태입니다.');
        }

        $pdo->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?')
            ->execute([(int) $row['id']]);

        $adminLevel = $row['admin_level'] ?? null;
        $adminLevel = $adminLevel !== null && $adminLevel !== '' ? (string) $adminLevel : null;

        return [
            'user_id' => (int) $row['id'],
            'email' => (string) $row['email'],
            'role_type' => (string) ($row['role_type'] ?? 'guardian_student'),
            'name' => (string) $row['real_name'],
            'admin_level' => $adminLevel,
            'must_change_password' => (int) ($row['must_change_password'] ?? 0) === 1,
        ];
    }
}
