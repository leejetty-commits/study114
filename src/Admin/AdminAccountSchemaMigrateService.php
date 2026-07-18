<?php

declare(strict_types=1);

namespace Study114\Admin;

use PDO;
use Study114\Database\Connection;
use Throwable;

/**
 * 036 멱등 적용 — admin_level · must_change_password
 * 닷홈은 원격 MySQL이 없어 서버 PDO로 적용한다.
 */
final class AdminAccountSchemaMigrateService
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Connection::get();
    }

    /** @return array<string, mixed> */
    public function status(): array
    {
        return [
            'has_admin_level' => $this->columnExists('users', 'admin_level'),
            'has_must_change_password' => $this->columnExists('users', 'must_change_password'),
            'super_admin_count' => $this->columnExists('users', 'admin_level')
                ? $this->countLevel('super_admin')
                : 0,
            'sub_master_count' => $this->columnExists('users', 'admin_level')
                ? $this->countLevel('sub_master')
                : 0,
            'jetty_level' => $this->jettyLevel(),
        ];
    }

    /** @return array<string, mixed> */
    public function apply(): array
    {
        $before = $this->status();
        $steps = [];
        $this->pdo->exec('SET NAMES utf8mb4');

        $steps[] = $this->step('add_must_change_password', function (): string {
            if ($this->columnExists('users', 'must_change_password')) {
                return 'skip';
            }
            $this->pdo->exec(
                "ALTER TABLE users
                 ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0
                   COMMENT '임시비번 발급 후 강제 변경' AFTER password_hash"
            );

            return 'added';
        });

        $steps[] = $this->step('add_admin_level', function (): string {
            if ($this->columnExists('users', 'admin_level')) {
                return 'skip';
            }
            $this->pdo->exec(
                "ALTER TABLE users
                 ADD COLUMN admin_level ENUM('super_admin', 'sub_master') NULL
                   COMMENT 'NULL=비운영 · role_type=admin일 때만 의미' AFTER status"
            );

            return 'added';
        });

        $steps[] = $this->step('backfill_jetty_super_admin', function (): string {
            if (!$this->columnExists('users', 'admin_level')) {
                return 'skip: no column';
            }
            $stmt = $this->pdo->prepare(
                "UPDATE users
                 SET admin_level = 'super_admin', must_change_password = 0
                 WHERE email = 'jetty@naver.com'"
            );
            $stmt->execute();

            return 'updated:' . $stmt->rowCount();
        });

        $steps[] = $this->step('backfill_sub_masters', function (): string {
            if (!$this->columnExists('users', 'admin_level')) {
                return 'skip: no column';
            }
            $sql = "UPDATE users u
                    INNER JOIN user_roles r
                      ON r.user_id = u.id
                     AND r.role_type = 'admin'
                     AND r.is_primary = 1
                     AND r.status = 'active'
                    SET u.admin_level = 'sub_master'
                    WHERE u.admin_level IS NULL
                      AND u.email <> 'jetty@naver.com'";
            $n = $this->pdo->exec($sql);

            return 'updated:' . (int) $n;
        });

        return [
            'before' => $before,
            'after' => $this->status(),
            'steps' => $steps,
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

    private function columnExists(string $table, string $column): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?'
        );
        $stmt->execute([$table, $column]);

        return (int) $stmt->fetchColumn() > 0;
    }

    private function countLevel(string $level): int
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM users WHERE admin_level = ?');
        $stmt->execute([$level]);

        return (int) $stmt->fetchColumn();
    }

    private function jettyLevel(): ?string
    {
        if (!$this->columnExists('users', 'admin_level')) {
            return null;
        }
        $stmt = $this->pdo->prepare('SELECT admin_level FROM users WHERE email = ? LIMIT 1');
        $stmt->execute(['jetty@naver.com']);
        $v = $stmt->fetchColumn();

        return $v === false || $v === null || $v === '' ? null : (string) $v;
    }
}
