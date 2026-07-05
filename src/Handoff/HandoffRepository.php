<?php

declare(strict_types=1);

namespace Study114\Handoff;

use PDO;

/** 25장 부록 B — basket persistence (DDL 013) */
final class HandoffRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<array<string, mixed>> */
    public function listFavorites(int $userId, ?string $targetType = null): array
    {
        $sql = 'SELECT id, target_type, target_id, created_at FROM user_favorites WHERE user_id = ?';
        $params = [$userId];
        if ($targetType !== null) {
            $sql .= ' AND target_type = ?';
            $params[] = $targetType;
        }
        $sql .= ' ORDER BY created_at DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function addFavorite(int $userId, string $targetType, int $targetId): void
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO user_favorites (user_id, target_type, target_id) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE created_at = created_at'
        );
        $stmt->execute([$userId, $targetType, $targetId]);
    }

    public function removeFavorite(int $userId, string $targetType, int $targetId): void
    {
        $stmt = $this->pdo->prepare(
            'DELETE FROM user_favorites WHERE user_id = ? AND target_type = ? AND target_id = ?'
        );
        $stmt->execute([$userId, $targetType, $targetId]);
    }

    public function isFavorite(int $userId, string $targetType, int $targetId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM user_favorites WHERE user_id = ? AND target_type = ? AND target_id = ? LIMIT 1'
        );
        $stmt->execute([$userId, $targetType, $targetId]);

        return (bool) $stmt->fetchColumn();
    }

    /** @return list<array<string, mixed>> */
    public function listCompare(int $userId, string $targetType): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, target_id, sort_order, created_at FROM user_compare_items
             WHERE user_id = ? AND target_type = ? ORDER BY sort_order ASC, id ASC'
        );
        $stmt->execute([$userId, $targetType]);

        return $stmt->fetchAll();
    }

    public function countCompare(int $userId, string $targetType): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM user_compare_items WHERE user_id = ? AND target_type = ?'
        );
        $stmt->execute([$userId, $targetType]);

        return (int) $stmt->fetchColumn();
    }

    public function addCompare(int $userId, string $targetType, int $targetId, int $sortOrder): void
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO user_compare_items (user_id, target_type, target_id, sort_order)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order)'
        );
        $stmt->execute([$userId, $targetType, $targetId, $sortOrder]);
    }

    public function removeCompare(int $userId, string $targetType, int $targetId): void
    {
        $stmt = $this->pdo->prepare(
            'DELETE FROM user_compare_items WHERE user_id = ? AND target_type = ? AND target_id = ?'
        );
        $stmt->execute([$userId, $targetType, $targetId]);
    }

    public function clearCompare(int $userId, string $targetType): void
    {
        $stmt = $this->pdo->prepare(
            'DELETE FROM user_compare_items WHERE user_id = ? AND target_type = ?'
        );
        $stmt->execute([$userId, $targetType]);
    }

    public function isInCompare(int $userId, string $targetType, int $targetId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM user_compare_items WHERE user_id = ? AND target_type = ? AND target_id = ? LIMIT 1'
        );
        $stmt->execute([$userId, $targetType, $targetId]);

        return (bool) $stmt->fetchColumn();
    }

    /** @return list<array<string, mixed>> */
    public function listRecent(int $userId, int $limit = 30): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT target_type, target_id, title_snapshot, last_route, last_action, viewed_at
             FROM user_recent_views WHERE user_id = ? ORDER BY viewed_at DESC LIMIT ?'
        );
        $stmt->bindValue(1, $userId, PDO::PARAM_INT);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function upsertRecent(
        int $userId,
        string $targetType,
        int $targetId,
        string $titleSnapshot,
        ?string $lastRoute,
        string $lastAction = 'view_detail',
    ): void {
        $stmt = $this->pdo->prepare(
            'INSERT INTO user_recent_views
               (user_id, target_type, target_id, title_snapshot, last_route, last_action, viewed_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE
               title_snapshot = VALUES(title_snapshot),
               last_route = VALUES(last_route),
               last_action = VALUES(last_action),
               viewed_at = NOW()'
        );
        $stmt->execute([$userId, $targetType, $targetId, $titleSnapshot, $lastRoute, $lastAction]);
    }

    public function pruneRecent(int $userId, int $keep = 30): void
    {
        $stmt = $this->pdo->prepare(
            'DELETE FROM user_recent_views WHERE user_id = ? AND id NOT IN (
               SELECT id FROM (
                 SELECT id FROM user_recent_views WHERE user_id = ? ORDER BY viewed_at DESC LIMIT ?
               ) AS kept
             )'
        );
        $stmt->execute([$userId, $userId, $keep]);
    }

    /** @return list<array<string, mixed>> */
    public function listStudentReviews(int $providerUserId, int $limit = 50): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT student_id, provider_role, saved_at FROM provider_student_reviews
             WHERE provider_user_id = ? ORDER BY saved_at DESC LIMIT ?'
        );
        $stmt->bindValue(1, $providerUserId, PDO::PARAM_INT);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function addStudentReview(int $providerUserId, int $studentId, string $providerRole): void
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO provider_student_reviews (provider_user_id, student_id, provider_role, saved_at)
             VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE provider_role = VALUES(provider_role), saved_at = NOW()'
        );
        $stmt->execute([$providerUserId, $studentId, $providerRole]);
    }

    public function removeStudentReview(int $providerUserId, int $studentId): void
    {
        $stmt = $this->pdo->prepare(
            'DELETE FROM provider_student_reviews WHERE provider_user_id = ? AND student_id = ?'
        );
        $stmt->execute([$providerUserId, $studentId]);
    }

    public function isInStudentReview(int $providerUserId, int $studentId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM provider_student_reviews WHERE provider_user_id = ? AND student_id = ? LIMIT 1'
        );
        $stmt->execute([$providerUserId, $studentId]);

        return (bool) $stmt->fetchColumn();
    }

    public function pruneStudentReviews(int $providerUserId, int $keep = 50): void
    {
        $stmt = $this->pdo->prepare(
            'DELETE FROM provider_student_reviews WHERE provider_user_id = ? AND id NOT IN (
               SELECT id FROM (
                 SELECT id FROM provider_student_reviews
                 WHERE provider_user_id = ? ORDER BY saved_at DESC LIMIT ?
               ) AS kept
             )'
        );
        $stmt->execute([$providerUserId, $providerUserId, $keep]);
    }
}
