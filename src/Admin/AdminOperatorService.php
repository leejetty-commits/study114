<?php

declare(strict_types=1);

namespace Study114\Admin;

use InvalidArgumentException;
use PDO;
use RuntimeException;
use Study114\Auth\EmailNormalizer;
use Study114\Auth\PasswordPolicy;
use Study114\Database\Connection;

/** A28-08b — 운영 계정(super_admin / sub_master) 발급·관리 */
final class AdminOperatorService
{
    private AdminRoleService $roles;
    private AdminOperationLogRepository $logs;

    public function __construct(
        ?AdminRoleService $roles = null,
        ?AdminOperationLogRepository $logs = null,
    ) {
        $this->roles = $roles ?? new AdminRoleService();
        $pdo = Connection::get();
        $this->logs = $logs ?? new AdminOperationLogRepository($pdo);
    }

    /** @param array{user_id: int, email: string, role_type: string} $auth */
    private function assertSuperAdmin(array $auth): void
    {
        if (!$this->roles->isSuperAdmin($auth)) {
            throw new InvalidArgumentException('최고관리자만 운영 계정을 관리할 수 있습니다.');
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listOperators(array $auth): array
    {
        $this->assertSuperAdmin($auth);
        $pdo = Connection::get();
        $stmt = $pdo->query(
            "SELECT u.id, u.email, u.status, u.admin_level, u.must_change_password,
                    u.last_login_at, u.created_at, p.real_name
             FROM users u
             INNER JOIN user_roles r
               ON r.user_id = u.id AND r.role_type = 'admin' AND r.is_primary = 1
             LEFT JOIN user_profiles p ON p.user_id = u.id
             WHERE u.admin_level IN ('super_admin', 'sub_master')
             ORDER BY
               CASE u.admin_level WHEN 'super_admin' THEN 0 ELSE 1 END,
               u.id ASC"
        );
        $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
        $out = [];
        foreach ($rows as $row) {
            $out[] = $this->mapRow($row);
        }

        return $out;
    }

    /**
     * @param array{user_id: int, email: string, role_type: string} $auth
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function create(array $auth, array $input): array
    {
        $this->assertSuperAdmin($auth);

        $name = trim((string) ($input['name'] ?? ''));
        $email = EmailNormalizer::normalize((string) ($input['email'] ?? ''));
        $password = (string) ($input['password'] ?? '');
        $passwordConfirm = (string) ($input['password_confirm'] ?? $password);
        $level = $this->roles->normalizeLevel($input['admin_level'] ?? '');
        $statusUi = strtolower(trim((string) ($input['status'] ?? 'active')));

        if ($name === '') {
            throw new InvalidArgumentException('이름: 필수 입력입니다.');
        }
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('email: 유효한 이메일 형식이 아닙니다.');
        }
        if ($level === null) {
            throw new InvalidArgumentException('admin_level: super_admin 또는 sub_master여야 합니다.');
        }
        if (!in_array($statusUi, ['active', 'inactive', 'blocked'], true)) {
            throw new InvalidArgumentException('status: active 또는 inactive여야 합니다.');
        }
        $userStatus = $statusUi === 'active' ? 'active' : 'blocked';

        (new PasswordPolicy())->validate($password, $passwordConfirm, [
            'email' => $email,
            'name' => $name,
            'phone' => '',
        ]);

        $pdo = Connection::get();
        $exists = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $exists->execute([$email]);
        if ($exists->fetchColumn()) {
            throw new InvalidArgumentException('email: 이미 사용 중인 이메일입니다. 운영 전용 이메일로만 발급합니다.');
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        if ($hash === false) {
            throw new RuntimeException('password_hash failed');
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO users (email, password_hash, status, must_change_password, admin_level)
                 VALUES (?, ?, ?, 1, ?)'
            );
            $stmt->execute([$email, $hash, $userStatus, $level]);
            $userId = (int) $pdo->lastInsertId();

            $stmt = $pdo->prepare(
                'INSERT INTO user_profiles (user_id, real_name, phone, gender, address_line1)
                 VALUES (?, ?, NULL, NULL, ?)'
            );
            $stmt->execute([$userId, $name, '내부']);

            $stmt = $pdo->prepare(
                "INSERT INTO user_roles (user_id, role_type, is_primary, status) VALUES (?, 'admin', 1, 'active')"
            );
            $stmt->execute([$userId]);

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        $this->logs->insert(
            (string) $auth['email'],
            'admin_user',
            (string) $userId,
            'admin_account_create',
            'ops_account',
            "level={$level}; status={$userStatus}; email={$email}",
            false,
            false,
        );

        return $this->getById($userId);
    }

    /**
     * @param array{user_id: int, email: string, role_type: string} $auth
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function patch(array $auth, int $userId, array $input): array
    {
        $this->assertSuperAdmin($auth);
        if ($userId < 1) {
            throw new InvalidArgumentException('user_id가 필요합니다.');
        }

        $pdo = Connection::get();
        $current = $this->fetchRaw($pdo, $userId);
        if ($current === null) {
            throw new InvalidArgumentException('운영 계정을 찾을 수 없습니다.');
        }

        $newLevel = array_key_exists('admin_level', $input)
            ? $this->roles->normalizeLevel($input['admin_level'])
            : $this->roles->normalizeLevel($current['admin_level'] ?? null);
        if ($newLevel === null) {
            throw new InvalidArgumentException('admin_level: super_admin 또는 sub_master여야 합니다.');
        }

        $statusUi = array_key_exists('status', $input)
            ? strtolower(trim((string) $input['status']))
            : ((string) $current['status'] === 'active' ? 'active' : 'inactive');
        if (!in_array($statusUi, ['active', 'inactive', 'blocked'], true)) {
            throw new InvalidArgumentException('status: active 또는 inactive여야 합니다.');
        }
        $userStatus = $statusUi === 'active' ? 'active' : 'blocked';

        $wasSuper = ($current['admin_level'] ?? '') === AdminRoleService::LEVEL_SUPER_ADMIN
            && ($current['status'] ?? '') === 'active';
        $willBeActiveSuper = $newLevel === AdminRoleService::LEVEL_SUPER_ADMIN && $userStatus === 'active';

        if ($wasSuper && !$willBeActiveSuper) {
            $count = $this->roles->countActiveSuperAdmins($pdo);
            if ($count <= 1) {
                throw new InvalidArgumentException('마지막 최고관리자는 비활성하거나 강등할 수 없습니다.');
            }
        }

        $name = array_key_exists('name', $input) ? trim((string) $input['name']) : null;
        if ($name !== null && $name === '') {
            throw new InvalidArgumentException('이름: 비울 수 없습니다.');
        }

        $oldLevel = (string) ($current['admin_level'] ?? '');
        $oldStatus = (string) ($current['status'] ?? '');

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                'UPDATE users SET admin_level = ?, status = ?, updated_at = NOW() WHERE id = ?'
            );
            $stmt->execute([$newLevel, $userStatus, $userId]);

            if ($name !== null) {
                $pdo->prepare('UPDATE user_profiles SET real_name = ? WHERE user_id = ?')
                    ->execute([$name, $userId]);
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        if ($oldLevel !== $newLevel) {
            $this->logs->insert(
                (string) $auth['email'],
                'admin_user',
                (string) $userId,
                'admin_account_level_change',
                'ops_account',
                "{$oldLevel}→{$newLevel}",
                true,
                false,
            );
        }
        if ($oldStatus !== $userStatus) {
            $action = $userStatus === 'active' ? 'admin_account_activate' : 'admin_account_deactivate';
            $this->logs->insert(
                (string) $auth['email'],
                'admin_user',
                (string) $userId,
                $action,
                'ops_account',
                "{$oldStatus}→{$userStatus}",
                true,
                false,
            );
        }

        return $this->getById($userId);
    }

    /**
     * @param array{user_id: int, email: string, role_type: string} $auth
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function resetPassword(array $auth, int $userId, array $input): array
    {
        $this->assertSuperAdmin($auth);
        if ($userId < 1) {
            throw new InvalidArgumentException('user_id가 필요합니다.');
        }

        $pdo = Connection::get();
        $current = $this->fetchRaw($pdo, $userId);
        if ($current === null) {
            throw new InvalidArgumentException('운영 계정을 찾을 수 없습니다.');
        }

        $password = (string) ($input['password'] ?? '');
        $confirm = (string) ($input['password_confirm'] ?? $password);
        (new PasswordPolicy())->validate($password, $confirm, [
            'email' => (string) $current['email'],
            'name' => (string) ($current['real_name'] ?? ''),
            'phone' => '',
        ]);

        $hash = password_hash($password, PASSWORD_BCRYPT);
        if ($hash === false) {
            throw new RuntimeException('password_hash failed');
        }

        $pdo->prepare(
            'UPDATE users SET password_hash = ?, must_change_password = 1, updated_at = NOW() WHERE id = ?'
        )->execute([$hash, $userId]);

        $this->logs->insert(
            (string) $auth['email'],
            'admin_user',
            (string) $userId,
            'admin_account_password_reset',
            'ops_account',
            'must_change_password=1',
            false,
            false,
        );

        return $this->getById($userId);
    }

    /** @return array<string, mixed> */
    public function getById(int $userId): array
    {
        $pdo = Connection::get();
        $row = $this->fetchRaw($pdo, $userId);
        if ($row === null) {
            throw new InvalidArgumentException('운영 계정을 찾을 수 없습니다.');
        }

        return $this->mapRow($row);
    }

    /** @return array<string, mixed>|null */
    private function fetchRaw(PDO $pdo, int $userId): ?array
    {
        $stmt = $pdo->prepare(
            "SELECT u.id, u.email, u.status, u.admin_level, u.must_change_password,
                    u.last_login_at, u.created_at, p.real_name
             FROM users u
             INNER JOIN user_roles r
               ON r.user_id = u.id AND r.role_type = 'admin' AND r.is_primary = 1
             LEFT JOIN user_profiles p ON p.user_id = u.id
             WHERE u.id = ? AND u.admin_level IN ('super_admin', 'sub_master')
             LIMIT 1"
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function mapRow(array $row): array
    {
        $status = (string) ($row['status'] ?? 'active');

        return [
            'id' => (int) $row['id'],
            'email' => (string) $row['email'],
            'name' => (string) ($row['real_name'] ?? ''),
            'admin_level' => (string) ($row['admin_level'] ?? ''),
            'status' => $status === 'active' ? 'active' : 'inactive',
            'user_status' => $status,
            'must_change_password' => (int) ($row['must_change_password'] ?? 0) === 1,
            'last_login_at' => $row['last_login_at'] ?? null,
            'created_at' => $row['created_at'] ?? null,
            'is_bootstrap' => $this->roles->isBootstrapSuperAdminEmail((string) $row['email']),
        ];
    }
}
