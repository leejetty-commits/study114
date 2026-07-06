<?php

declare(strict_types=1);

namespace Study114\Paid;

use PDO;

/** 18a — P18-02 ROI 집계 · 조회 기록 */
final class ProviderRoiRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function recordProfileView(string $targetType, int $targetId, ?int $viewerUserId): void
    {
        if ($viewerUserId !== null) {
            $ownerId = $this->findOwnerUserId($targetType, $targetId);
            if ($ownerId !== null && $ownerId === $viewerUserId) {
                return;
            }
        }

        $stmt = $this->pdo->prepare(
            'INSERT INTO provider_profile_views (target_type, target_id, viewer_user_id, viewed_at)
             VALUES (?, ?, ?, NOW())'
        );
        $stmt->execute([$targetType, $targetId, $viewerUserId]);
    }

    public function countViewsForProvider(int $providerUserId, int $days): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM provider_profile_views pv
             WHERE pv.viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
               AND (
                 (pv.target_type = \'study_room\' AND pv.target_id IN (
                   SELECT id FROM study_rooms WHERE user_id = ? AND deleted_at IS NULL
                 ))
                 OR (pv.target_type = \'tutor\' AND pv.target_id IN (
                   SELECT id FROM tutors WHERE user_id = ?
                 ))
               )
               AND (pv.viewer_user_id IS NULL OR pv.viewer_user_id <> ?)'
        );
        $stmt->execute([$days, $providerUserId, $providerUserId, $providerUserId]);

        return (int) $stmt->fetchColumn();
    }

    public function countFavoritesForProvider(int $providerUserId): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM user_favorites uf
             WHERE (uf.target_type = \'study_room\' AND uf.target_id IN (
               SELECT id FROM study_rooms WHERE user_id = ? AND deleted_at IS NULL
             ))
             OR (uf.target_type = \'tutor\' AND uf.target_id IN (
               SELECT id FROM tutors WHERE user_id = ?
             ))'
        );
        $stmt->execute([$providerUserId, $providerUserId]);

        return (int) $stmt->fetchColumn();
    }

    public function countCompareForProvider(int $providerUserId): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM user_compare_items uc
             WHERE (uc.target_type = \'study_room\' AND uc.target_id IN (
               SELECT id FROM study_rooms WHERE user_id = ? AND deleted_at IS NULL
             ))
             OR (uc.target_type = \'tutor\' AND uc.target_id IN (
               SELECT id FROM tutors WHERE user_id = ?
             ))'
        );
        $stmt->execute([$providerUserId, $providerUserId]);

        return (int) $stmt->fetchColumn();
    }

    private function findOwnerUserId(string $targetType, int $targetId): ?int
    {
        if ($targetType === 'study_room') {
            $stmt = $this->pdo->prepare(
                'SELECT user_id FROM study_rooms WHERE id = ? AND deleted_at IS NULL LIMIT 1'
            );
        } else {
            $stmt = $this->pdo->prepare(
                'SELECT user_id FROM tutors WHERE id = ? LIMIT 1'
            );
        }
        $stmt->execute([$targetId]);
        $val = $stmt->fetchColumn();

        return $val !== false ? (int) $val : null;
    }
}
