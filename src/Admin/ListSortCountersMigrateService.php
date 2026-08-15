<?php

declare(strict_types=1);

namespace Study114\Admin;

use PDO;
use Study114\Database\Connection;
use Throwable;

/**
 * 041 멱등 적용 — study_rooms / tutors.recommend_count
 * 닷홈은 원격 MySQL CLI 대신 서버 PDO로 적용한다.
 */
final class ListSortCountersMigrateService
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Connection::get();
    }

    /** @return array<string, mixed> */
    public function status(): array
    {
        $rooms = $this->columnExists('study_rooms', 'recommend_count');
        $tutors = $this->columnExists('tutors', 'recommend_count');
        $recs = $this->tableExists('user_recommendations');

        return [
            'has_study_rooms_recommend_count' => $rooms,
            'has_tutors_recommend_count' => $tutors,
            'has_user_recommendations' => $recs,
            'ready' => $rooms && $tutors,
            'recommend_write_ready' => $rooms && $tutors && $recs,
        ];
    }

    /**
     * @param bool $seedDemo 로컬 정렬 확인용 가짜 카운터. 운영에서는 false.
     * @return array<string, mixed>
     */
    public function apply(bool $seedDemo = false): array
    {
        $before = $this->status();
        $steps = [];
        $this->pdo->exec('SET NAMES utf8mb4');

        $steps[] = $this->step('add_study_rooms_recommend_count', function (): string {
            if ($this->columnExists('study_rooms', 'recommend_count')) {
                return 'skip';
            }
            $this->pdo->exec(
                "ALTER TABLE study_rooms
                 ADD COLUMN recommend_count INT UNSIGNED NOT NULL DEFAULT 0
                   COMMENT '카드 추천(엄지) 수 · 목록 정렬용'
                   AFTER feature_3"
            );
            return 'added';
        });

        $steps[] = $this->step('add_tutors_recommend_count', function (): string {
            if ($this->columnExists('tutors', 'recommend_count')) {
                return 'skip';
            }
            $this->pdo->exec(
                "ALTER TABLE tutors
                 ADD COLUMN recommend_count INT UNSIGNED NOT NULL DEFAULT 0
                   COMMENT '카드 추천(엄지) 수 · 목록 정렬용'
                   AFTER feature_1"
            );
            return 'added';
        });

        $steps[] = $this->step('create_user_recommendations', function (): string {
            if ($this->tableExists('user_recommendations')) {
                return 'skip';
            }
            $this->pdo->exec(
                "CREATE TABLE user_recommendations (
                  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                  user_id      BIGINT UNSIGNED NOT NULL,
                  target_type  ENUM('study_room', 'tutor') NOT NULL,
                  target_id    BIGINT UNSIGNED NOT NULL,
                  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  UNIQUE KEY uk_user_recommendations (user_id, target_type, target_id),
                  KEY idx_user_recommendations_target (target_type, target_id, created_at),
                  CONSTRAINT fk_user_recommendations_user
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                  COMMENT='카드 추천(엄지) · recommend_count 캐시와 동기'"
            );
            return 'created';
        });

        if ($seedDemo) {
            $steps[] = $this->step('seed_study_rooms_demo_counts', function (): string {
                if (!$this->columnExists('study_rooms', 'recommend_count')) {
                    return 'skip';
                }
                $n = $this->pdo->exec(
                    "UPDATE study_rooms
                     SET recommend_count = ((id % 7) + 2)
                     WHERE recommend_count = 0 AND profile_status = 'published'"
                );
                return 'updated:' . (string) $n;
            });

            $steps[] = $this->step('seed_tutors_demo_counts', function (): string {
                if (!$this->columnExists('tutors', 'recommend_count')) {
                    return 'skip';
                }
                $n = $this->pdo->exec(
                    "UPDATE tutors
                     SET recommend_count = ((id % 9) + 1)
                     WHERE recommend_count = 0 AND profile_status = 'published'"
                );
                return 'updated:' . (string) $n;
            });
        }

        return [
            'before' => $before,
            'after' => $this->status(),
            'seed_demo' => $seedDemo,
            'steps' => $steps,
        ];
    }

    private function tableExists(string $table): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?'
        );
        $stmt->execute([$table]);

        return (int) $stmt->fetchColumn() > 0;
    }

    /**
     * @param callable(): string $fn
     * @return array{name: string, ok: bool, detail: string}
     */
    private function step(string $name, callable $fn): array
    {
        try {
            return ['name' => $name, 'ok' => true, 'detail' => $fn()];
        } catch (Throwable $e) {
            return ['name' => $name, 'ok' => false, 'detail' => $e->getMessage()];
        }
    }

    private function columnExists(string $table, string $column): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
        );
        $stmt->execute([$table, $column]);

        return (int) $stmt->fetchColumn() > 0;
    }
}
