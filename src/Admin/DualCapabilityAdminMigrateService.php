<?php

declare(strict_types=1);

namespace Study114\Admin;

use PDO;
use Study114\Database\Connection;
use Throwable;

/**
 * 038 — 실계정 dual-capability 승격
 * 시장 역할(primary) 유지 + users.admin_level=super_admin + secondary admin role
 * oauth 내부 email은 유지하고 표시명만 정리
 */
final class DualCapabilityAdminMigrateService
{
    private const TARGETS = [
        [
            'email' => 'jetty@naver.com',
            'market_role' => 'study_room_owner',
            'display_name' => null,
            'tutor_display_name' => null,
        ],
        [
            'email' => 'oauth_4991290476_68f30aa0@users.study114.local',
            'market_role' => 'tutor',
            'display_name' => '카카오 과외쌤',
            'tutor_display_name' => '카카오 과외쌤',
        ],
        [
            'email' => 'leejetty@gmail.com',
            'market_role' => 'guardian_student',
            'display_name' => null,
            'tutor_display_name' => null,
        ],
    ];

    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Connection::get();
    }

    /** @return array<string, mixed> */
    public function status(): array
    {
        $accounts = [];
        foreach (self::TARGETS as $t) {
            $accounts[] = $this->inspect($t['email'], $t['market_role']);
        }

        $ready = true;
        foreach ($accounts as $a) {
            if (empty($a['found'])) {
                $ready = false;
                continue;
            }
            if (($a['admin_level'] ?? null) !== 'super_admin') {
                $ready = false;
            }
            if (($a['primary_role'] ?? null) !== ($a['expected_market_role'] ?? null)) {
                $ready = false;
            }
            if (empty($a['has_admin_role_secondary']) && empty($a['has_admin_role'])) {
                $ready = false;
            }
        }

        return [
            'accounts' => $accounts,
            'ready' => $ready,
        ];
    }

    /** @return array<string, mixed> */
    public function apply(): array
    {
        $before = $this->status();
        $steps = [];
        $this->pdo->exec('SET NAMES utf8mb4');

        foreach (self::TARGETS as $t) {
            $steps[] = $this->step('elevate:' . $t['email'], function () use ($t): string {
                return $this->elevateOne($t);
            });
        }

        return [
            'before' => $before,
            'after' => $this->status(),
            'steps' => $steps,
        ];
    }

    /**
     * @param array{email: string, market_role: string, display_name: ?string, tutor_display_name: ?string} $t
     */
    private function elevateOne(array $t): string
    {
        $email = $t['email'];
        $market = $t['market_role'];

        $stmt = $this->pdo->prepare(
            'SELECT u.id, u.email, u.status, u.admin_level, p.real_name
             FROM users u
             LEFT JOIN user_profiles p ON p.user_id = u.id
             WHERE u.email = ?
             LIMIT 1'
        );
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($user)) {
            return 'error: user_not_found';
        }

        $userId = (int) $user['id'];
        $parts = [];

        $upd = $this->pdo->prepare(
            "UPDATE users SET admin_level = 'super_admin', must_change_password = 0, updated_at = NOW() WHERE id = ?"
        );
        $upd->execute([$userId]);
        $parts[] = 'admin_level=super_admin';

        // 모든 역할 is_primary=0 후 시장 역할만 primary
        $this->pdo->prepare('UPDATE user_roles SET is_primary = 0 WHERE user_id = ?')->execute([$userId]);

        $marketId = $this->ensureRole($userId, $market, true);
        $parts[] = "primary={$market}:{$marketId}";

        $adminId = $this->ensureRole($userId, 'admin', false);
        $parts[] = "admin_secondary={$adminId}";

        if ($t['display_name'] !== null && $t['display_name'] !== '') {
            $name = $t['display_name'];
            $this->pdo->prepare('UPDATE user_profiles SET real_name = ? WHERE user_id = ?')
                ->execute([$name, $userId]);
            $parts[] = 'real_name=' . $name;
        }

        if ($t['tutor_display_name'] !== null && $t['tutor_display_name'] !== '') {
            if ($this->tableExists('tutors')) {
                $chk = $this->pdo->prepare('SELECT id FROM tutors WHERE user_id = ? LIMIT 1');
                $chk->execute([$userId]);
                if ($chk->fetchColumn()) {
                    $this->pdo->prepare('UPDATE tutors SET tutor_display_name = ? WHERE user_id = ?')
                        ->execute([$t['tutor_display_name'], $userId]);
                    $parts[] = 'tutor_display_name=' . $t['tutor_display_name'];
                }
            }
        }

        // auth identity(email) · oauth provider 바인딩은 변경하지 않음
        $parts[] = 'auth_email_unchanged';

        return implode('; ', $parts);
    }

    private function ensureRole(int $userId, string $roleType, bool $primary): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT id FROM user_roles WHERE user_id = ? AND role_type = ? LIMIT 1'
        );
        $stmt->execute([$userId, $roleType]);
        $id = $stmt->fetchColumn();
        if ($id !== false) {
            $this->pdo->prepare(
                "UPDATE user_roles SET is_primary = ?, status = 'active' WHERE id = ?"
            )->execute([$primary ? 1 : 0, (int) $id]);

            return (int) $id;
        }

        $ins = $this->pdo->prepare(
            'INSERT INTO user_roles (user_id, role_type, is_primary, status) VALUES (?, ?, ?, ?)'
        );
        $ins->execute([$userId, $roleType, $primary ? 1 : 0, 'active']);

        return (int) $this->pdo->lastInsertId();
    }

    /** @return array<string, mixed> */
    private function inspect(string $email, string $expectedMarket): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT u.id, u.email, u.status, u.admin_level, p.real_name
             FROM users u
             LEFT JOIN user_profiles p ON p.user_id = u.id
             WHERE u.email = ?
             LIMIT 1'
        );
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($user)) {
            return [
                'email' => $email,
                'found' => false,
                'expected_market_role' => $expectedMarket,
            ];
        }

        $userId = (int) $user['id'];
        $rolesStmt = $this->pdo->prepare(
            'SELECT role_type, is_primary, status FROM user_roles WHERE user_id = ? ORDER BY is_primary DESC, role_type'
        );
        $rolesStmt->execute([$userId]);
        $roles = $rolesStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        $primary = null;
        $hasAdmin = false;
        $adminIsPrimary = false;
        foreach ($roles as $r) {
            if ((int) ($r['is_primary'] ?? 0) === 1) {
                $primary = (string) $r['role_type'];
            }
            if (($r['role_type'] ?? '') === 'admin' && ($r['status'] ?? '') === 'active') {
                $hasAdmin = true;
                if ((int) ($r['is_primary'] ?? 0) === 1) {
                    $adminIsPrimary = true;
                }
            }
        }

        $providers = [];
        if ($this->tableExists('user_oauth_accounts')) {
            try {
                $pStmt = $this->pdo->prepare(
                    'SELECT provider, provider_user_id FROM user_oauth_accounts WHERE user_id = ?'
                );
                $pStmt->execute([$userId]);
                $providers = $pStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
            } catch (Throwable) {
                $providers = [];
            }
        }

        return [
            'email' => $email,
            'found' => true,
            'user_id' => $userId,
            'status' => $user['status'] ?? null,
            'admin_level' => $user['admin_level'] ?? null,
            'real_name' => $user['real_name'] ?? null,
            'primary_role' => $primary,
            'expected_market_role' => $expectedMarket,
            'roles' => $roles,
            'has_admin_role' => $hasAdmin,
            'has_admin_role_secondary' => $hasAdmin && !$adminIsPrimary,
            'providers' => $providers,
        ];
    }

    /** @param callable(): string $fn @return array{name: string, result: string} */
    private function step(string $name, callable $fn): array
    {
        try {
            return ['name' => $name, 'result' => $fn()];
        } catch (Throwable $e) {
            return ['name' => $name, 'result' => 'error: ' . $e->getMessage()];
        }
    }

    private function tableExists(string $table): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = ?'
        );
        $stmt->execute([$table]);

        return (int) $stmt->fetchColumn() > 0;
    }
}
