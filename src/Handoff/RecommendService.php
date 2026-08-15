<?php

declare(strict_types=1);

namespace Study114\Handoff;

use InvalidArgumentException;
use PDO;
use RuntimeException;
use Study114\Database\Connection;
use Throwable;

/**
 * 카드 추천(엄지) — user_recommendations + study_rooms/tutors.recommend_count
 */
final class RecommendService
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Connection::get();
    }

    /** @return array{ready: bool, has_table: bool, has_room_column: bool, has_tutor_column: bool} */
    public function status(): array
    {
        $hasTable = $this->tableExists('user_recommendations');
        $hasRoom = $this->columnExists('study_rooms', 'recommend_count');
        $hasTutor = $this->columnExists('tutors', 'recommend_count');

        return [
            'has_table' => $hasTable,
            'has_room_column' => $hasRoom,
            'has_tutor_column' => $hasTutor,
            'ready' => $hasTable && $hasRoom && $hasTutor,
        ];
    }

    public function isRecommended(int $userId, string $targetType, int $targetId): bool
    {
        $this->assertReady();
        $this->assertTarget($targetType, $targetId);
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM user_recommendations
             WHERE user_id = ? AND target_type = ? AND target_id = ? LIMIT 1'
        );
        $stmt->execute([$userId, $targetType, $targetId]);

        return (bool) $stmt->fetchColumn();
    }

    /**
     * @return array{recommended: bool, recommend_count: int}
     */
    public function toggle(int $userId, string $targetType, int $targetId): array
    {
        $this->assertReady();
        $this->assertTarget($targetType, $targetId);

        $this->pdo->beginTransaction();
        try {
            if ($this->isRecommended($userId, $targetType, $targetId)) {
                $del = $this->pdo->prepare(
                    'DELETE FROM user_recommendations
                     WHERE user_id = ? AND target_type = ? AND target_id = ?'
                );
                $del->execute([$userId, $targetType, $targetId]);
                $this->adjustCount($targetType, $targetId, -1);
                $recommended = false;
            } else {
                $ins = $this->pdo->prepare(
                    'INSERT INTO user_recommendations (user_id, target_type, target_id)
                     VALUES (?, ?, ?)'
                );
                $ins->execute([$userId, $targetType, $targetId]);
                $this->adjustCount($targetType, $targetId, 1);
                $recommended = true;
            }
            $this->pdo->commit();
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }

        return [
            'recommended' => $recommended,
            'recommend_count' => $this->readCount($targetType, $targetId),
        ];
    }

    private function adjustCount(string $targetType, int $targetId, int $delta): void
    {
        $table = $targetType === 'tutor' ? 'tutors' : 'study_rooms';
        if ($delta >= 0) {
            $sql = "UPDATE {$table} SET recommend_count = recommend_count + 1 WHERE id = ?";
        } else {
            $sql = "UPDATE {$table}
                    SET recommend_count = IF(recommend_count > 0, recommend_count - 1, 0)
                    WHERE id = ?";
        }
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$targetId]);
    }

    private function readCount(string $targetType, int $targetId): int
    {
        $table = $targetType === 'tutor' ? 'tutors' : 'study_rooms';
        $stmt = $this->pdo->prepare("SELECT recommend_count FROM {$table} WHERE id = ? LIMIT 1");
        $stmt->execute([$targetId]);

        return (int) $stmt->fetchColumn();
    }

    private function assertReady(): void
    {
        $st = $this->status();
        if (!$st['ready']) {
            throw new RuntimeException(
                '추천 기능 DB 미적용: 041 recommend_count + 042 user_recommendations 필요'
            );
        }
    }

    private function assertTarget(string $targetType, int $targetId): void
    {
        if (!in_array($targetType, ['study_room', 'tutor'], true)) {
            throw new InvalidArgumentException('target_type: study_room|tutor');
        }
        if ($targetId <= 0) {
            throw new InvalidArgumentException('target_id가 필요합니다.');
        }
        $table = $targetType === 'tutor' ? 'tutors' : 'study_rooms';
        $stmt = $this->pdo->prepare("SELECT 1 FROM {$table} WHERE id = ? LIMIT 1");
        $stmt->execute([$targetId]);
        if (!$stmt->fetchColumn()) {
            throw new InvalidArgumentException('대상을 찾을 수 없습니다.');
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

    private function tableExists(string $table): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?'
        );
        $stmt->execute([$table]);

        return (int) $stmt->fetchColumn() > 0;
    }
}
