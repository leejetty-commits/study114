<?php

declare(strict_types=1);

namespace Study114\Reviews;

use PDO;
use PDOException;

final class ProviderReviewRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function countVisible(string $providerType, int $providerId): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM provider_reviews
             WHERE provider_type = ? AND provider_id = ? AND review_status = ?'
        );
        $stmt->execute([$providerType, $providerId, ReviewPolicy::STATUS_VISIBLE]);

        return (int) $stmt->fetchColumn();
    }

    /** @return list<array<string, mixed>> */
    public function listVisible(string $providerType, int $providerId, int $limit = 5, int $offset = 0): array
    {
        $limit = max(1, min(ReviewPolicy::PAGE_SIZE_MAX, $limit));
        $offset = max(0, $offset);
        $stmt = $this->pdo->prepare(
            "SELECT r.id, r.provider_type, r.provider_id, r.author_user_id, r.review_origin_type,
                    r.review_status, r.review_body, r.point_tags_json, r.created_at, r.updated_at
             FROM provider_reviews r
             WHERE r.provider_type = ? AND r.provider_id = ? AND r.review_status = 'visible'
             ORDER BY r.created_at DESC
             LIMIT {$limit} OFFSET {$offset}"
        );
        $stmt->execute([$providerType, $providerId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return is_array($rows) ? $rows : [];
    }

    /** @return list<string> */
    public function aggregateTags(string $providerType, int $providerId, int $max = 6): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT point_tags_json FROM provider_reviews
             WHERE provider_type = ? AND provider_id = ? AND review_status = 'visible'
             ORDER BY created_at DESC LIMIT 50"
        );
        $stmt->execute([$providerType, $providerId]);
        $freq = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $tags = json_decode((string) ($row['point_tags_json'] ?? '[]'), true);
            if (!is_array($tags)) {
                continue;
            }
            foreach ($tags as $tag) {
                $t = trim((string) $tag);
                if ($t === '') {
                    continue;
                }
                $freq[$t] = ($freq[$t] ?? 0) + 1;
            }
        }
        arsort($freq);

        return array_slice(array_keys($freq), 0, $max);
    }

    public function getCreatedCount(string $providerType, int $providerId, int $authorUserId): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT created_count FROM provider_review_quotas
             WHERE provider_type = ? AND provider_id = ? AND author_user_id = ?
             LIMIT 1'
        );
        $stmt->execute([$providerType, $providerId, $authorUserId]);
        $val = $stmt->fetchColumn();
        if ($val !== false) {
            return (int) $val;
        }

        $fallback = $this->pdo->prepare(
            'SELECT COUNT(*) FROM provider_reviews
             WHERE provider_type = ? AND provider_id = ? AND author_user_id = ?'
        );
        $fallback->execute([$providerType, $providerId, $authorUserId]);

        return (int) $fallback->fetchColumn();
    }

    /** @return list<array<string, mixed>> */
    public function listByAuthorOnTarget(string $providerType, int $providerId, int $authorUserId): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM provider_reviews
             WHERE provider_type = ? AND provider_id = ? AND author_user_id = ?
               AND review_status IN ('visible', 'hidden')
             ORDER BY created_at DESC"
        );
        $stmt->execute([$providerType, $providerId, $authorUserId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return is_array($rows) ? $rows : [];
    }

    public function insertReview(
        string $providerType,
        int $providerId,
        int $authorUserId,
        string $originType,
        string $body,
        array $tags,
        string $status = ReviewPolicy::STATUS_VISIBLE,
    ): int {
        $stmt = $this->pdo->prepare(
            'INSERT INTO provider_reviews
             (provider_type, provider_id, author_user_id, review_origin_type, review_status, review_body, point_tags_json)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $providerType,
            $providerId,
            $authorUserId,
            $originType,
            $status,
            $body,
            json_encode(array_values($tags), JSON_UNESCAPED_UNICODE),
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    public function consumeQuotaOrFail(string $providerType, int $providerId, int $authorUserId): void
    {
        if (!$this->quotaTableReady()) {
            $n = $this->getCreatedCount($providerType, $providerId, $authorUserId);
            if ($n >= ReviewPolicy::MAX_CREATES_PER_TARGET) {
                throw new ReviewPolicyException(
                    ReviewPolicy::ERR_QUOTA,
                    '이 대상에는 후기를 더 남길 수 없습니다. (최대 3회)',
                );
            }

            return;
        }

        $max = ReviewPolicy::MAX_CREATES_PER_TARGET;
        $before = $this->getCreatedCount($providerType, $providerId, $authorUserId);
        if ($before >= $max) {
            throw new ReviewPolicyException(
                ReviewPolicy::ERR_QUOTA,
                '이 대상에는 후기를 더 남길 수 없습니다. (최대 3회)',
            );
        }
        $stmt = $this->pdo->prepare(
            "INSERT INTO provider_review_quotas (provider_type, provider_id, author_user_id, created_count)
             VALUES (?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE created_count = IF(created_count < {$max}, created_count + 1, created_count)"
        );
        $stmt->execute([$providerType, $providerId, $authorUserId]);
        $after = $this->getCreatedCount($providerType, $providerId, $authorUserId);
        if ($after <= $before) {
            throw new ReviewPolicyException(
                ReviewPolicy::ERR_QUOTA,
                '이 대상에는 후기를 더 남길 수 없습니다. (최대 3회)',
            );
        }
    }

    public function updateReview(int $reviewId, string $body, array $tags): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE provider_reviews
             SET review_body = ?, point_tags_json = ?
             WHERE id = ? AND review_status IN (?, ?)'
        );
        $stmt->execute([
            $body,
            json_encode(array_values($tags), JSON_UNESCAPED_UNICODE),
            $reviewId,
            ReviewPolicy::STATUS_VISIBLE,
            ReviewPolicy::STATUS_HIDDEN,
        ]);
    }

    public function setVisibility(int $reviewId, string $status): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE provider_reviews SET review_status = ?, deleted_at = NULL WHERE id = ?'
        );
        $stmt->execute([$status, $reviewId]);
    }

    public function softDelete(int $reviewId): void
    {
        $stmt = $this->pdo->prepare(
            "UPDATE provider_reviews
             SET review_status = ?, deleted_at = NOW()
             WHERE id = ? AND review_status <> ?"
        );
        $stmt->execute([ReviewPolicy::STATUS_DELETED, $reviewId, ReviewPolicy::STATUS_DELETED]);
    }

    public function getReviewById(int $reviewId): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM provider_reviews WHERE id = ? LIMIT 1');
        $stmt->execute([$reviewId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    public function getProviderOwnerUserId(string $providerType, int $providerId): ?int
    {
        if ($providerType === 'study_room') {
            $stmt = $this->pdo->prepare('SELECT user_id FROM study_rooms WHERE id = ? LIMIT 1');
        } elseif ($providerType === 'tutor') {
            $stmt = $this->pdo->prepare('SELECT user_id FROM tutors WHERE id = ? LIMIT 1');
        } else {
            return null;
        }
        $stmt->execute([$providerId]);
        $val = $stmt->fetchColumn();

        return $val !== false ? (int) $val : null;
    }

    public function getReviewWriteStatus(string $providerType, int $providerId): string
    {
        $table = $providerType === 'tutor' ? 'tutors' : 'study_rooms';
        if (!$this->columnExists($table, 'review_write_status')) {
            return ReviewPolicy::WRITE_OPEN;
        }
        $stmt = $this->pdo->prepare("SELECT review_write_status FROM {$table} WHERE id = ? LIMIT 1");
        $stmt->execute([$providerId]);
        $val = $stmt->fetchColumn();

        return $val === ReviewPolicy::WRITE_CLOSED ? ReviewPolicy::WRITE_CLOSED : ReviewPolicy::WRITE_OPEN;
    }

    public function setReviewWriteStatus(string $providerType, int $providerId, string $status): void
    {
        $table = $providerType === 'tutor' ? 'tutors' : 'study_rooms';
        if (!$this->columnExists($table, 'review_write_status')) {
            return;
        }
        $stmt = $this->pdo->prepare("UPDATE {$table} SET review_write_status = ? WHERE id = ?");
        $stmt->execute([$status, $providerId]);
    }

    public function hasReviewBlock(string $providerType, int $providerId, int $authorUserId): bool
    {
        if (!$this->tableExists('provider_review_blocks')) {
            return false;
        }
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM provider_review_blocks
             WHERE provider_type = ? AND provider_id = ? AND blocked_author_user_id = ?
             LIMIT 1'
        );
        $stmt->execute([$providerType, $providerId, $authorUserId]);

        return (bool) $stmt->fetchColumn();
    }

    public function insertReviewBlock(
        string $providerType,
        int $providerId,
        int $blockedAuthorUserId,
        int $blockedByUserId,
    ): void {
        $stmt = $this->pdo->prepare(
            'INSERT INTO provider_review_blocks
             (provider_type, provider_id, blocked_author_user_id, blocked_by_user_id)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE blocked_by_user_id = VALUES(blocked_by_user_id)'
        );
        $stmt->execute([$providerType, $providerId, $blockedAuthorUserId, $blockedByUserId]);
    }

    public function deleteReviewBlock(string $providerType, int $providerId, int $blockedAuthorUserId): void
    {
        $stmt = $this->pdo->prepare(
            'DELETE FROM provider_review_blocks
             WHERE provider_type = ? AND provider_id = ? AND blocked_author_user_id = ?'
        );
        $stmt->execute([$providerType, $providerId, $blockedAuthorUserId]);
    }

    /** 쪽지 thread 1건 이상 = 작성 자격. 쪽지차단 여부는 보지 않는다. */
    public function hasMessageThread(string $providerType, int $providerId, int $userUserId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM message_threads
             WHERE context_kind = ? AND context_id = ?
               AND (participant_low_user_id = ? OR participant_high_user_id = ?)
             LIMIT 1'
        );
        $stmt->execute([$providerType, $providerId, $userUserId, $userUserId]);

        return (bool) $stmt->fetchColumn();
    }

    /** @return list<array<string, mixed>> */
    public function listReceivedByOwner(int $ownerUserId, string $providerType, int $limit = 10, int $offset = 0): array
    {
        $limit = max(1, min(ReviewPolicy::PAGE_SIZE_MAX, $limit));
        $offset = max(0, $offset);
        if ($providerType === 'study_room') {
            $sql = "SELECT r.*
                    FROM provider_reviews r
                    INNER JOIN study_rooms sr ON sr.id = r.provider_id AND r.provider_type = 'study_room'
                    WHERE sr.user_id = ? AND r.review_status = 'visible'
                    ORDER BY r.created_at DESC LIMIT {$limit} OFFSET {$offset}";
        } else {
            $sql = "SELECT r.*
                    FROM provider_reviews r
                    INNER JOIN tutors t ON t.id = r.provider_id AND r.provider_type = 'tutor'
                    WHERE t.user_id = ? AND r.review_status = 'visible'
                    ORDER BY r.created_at DESC LIMIT {$limit} OFFSET {$offset}";
        }
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$ownerUserId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return is_array($rows) ? $rows : [];
    }

    public function countReceivedByOwner(int $ownerUserId, string $providerType): int
    {
        if ($providerType === 'study_room') {
            $sql = "SELECT COUNT(*) FROM provider_reviews r
                    INNER JOIN study_rooms sr ON sr.id = r.provider_id AND r.provider_type = 'study_room'
                    WHERE sr.user_id = ? AND r.review_status = 'visible'";
        } else {
            $sql = "SELECT COUNT(*) FROM provider_reviews r
                    INNER JOIN tutors t ON t.id = r.provider_id AND r.provider_type = 'tutor'
                    WHERE t.user_id = ? AND r.review_status = 'visible'";
        }
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$ownerUserId]);

        return (int) $stmt->fetchColumn();
    }

    /** @return list<array<string, mixed>> */
    public function listWrittenByAuthor(int $authorUserId, int $limit = 20, int $offset = 0, bool $includeHidden = true): array
    {
        $limit = max(1, min(50, $limit));
        $offset = max(0, $offset);
        $statuses = $includeHidden ? "'visible', 'hidden'" : "'visible'";
        $stmt = $this->pdo->prepare(
            "SELECT r.*
             FROM provider_reviews r
             WHERE r.author_user_id = ? AND r.review_status IN ({$statuses})
             ORDER BY r.created_at DESC
             LIMIT {$limit} OFFSET {$offset}"
        );
        $stmt->execute([$authorUserId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return is_array($rows) ? $rows : [];
    }

    public function countWrittenByAuthor(int $authorUserId, bool $includeHidden = true): int
    {
        $statuses = $includeHidden ? "'visible', 'hidden'" : "'visible'";
        $stmt = $this->pdo->prepare(
            "SELECT COUNT(*) FROM provider_reviews
             WHERE author_user_id = ? AND review_status IN ({$statuses})"
        );
        $stmt->execute([$authorUserId]);

        return (int) $stmt->fetchColumn();
    }

    public function begin(): void
    {
        $this->pdo->beginTransaction();
    }

    public function commit(): void
    {
        if ($this->pdo->inTransaction()) {
            $this->pdo->commit();
        }
    }

    public function rollBack(): void
    {
        if ($this->pdo->inTransaction()) {
            $this->pdo->rollBack();
        }
    }

    /** @deprecated 답글은 MVP 제외. 기존 테이블 호환만 유지 */
    public function insertReply(int $reviewId, int $providerUserId, string $body): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO provider_review_replies (review_id, provider_user_id, body)
             VALUES (?, ?, ?)'
        );
        $stmt->execute([$reviewId, $providerUserId, $body]);

        return (int) $this->pdo->lastInsertId();
    }

    /** @deprecated */
    public function hasReply(int $reviewId): bool
    {
        $stmt = $this->pdo->prepare('SELECT 1 FROM provider_review_replies WHERE review_id = ? LIMIT 1');
        $stmt->execute([$reviewId]);

        return (bool) $stmt->fetchColumn();
    }

    /** @deprecated 1인 1건 시절 호환 */
    public function findByAuthor(string $providerType, int $providerId, int $authorUserId): ?array
    {
        $rows = $this->listByAuthorOnTarget($providerType, $providerId, $authorUserId);

        return $rows[0] ?? null;
    }

    private function quotaTableReady(): bool
    {
        return $this->tableExists('provider_review_quotas');
    }

    private function tableExists(string $table): bool
    {
        try {
            $stmt = $this->pdo->prepare(
                'SELECT 1 FROM information_schema.TABLES
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1'
            );
            $stmt->execute([$table]);

            return (bool) $stmt->fetchColumn();
        } catch (PDOException) {
            return false;
        }
    }

    private function columnExists(string $table, string $column): bool
    {
        try {
            $stmt = $this->pdo->prepare(
                'SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1'
            );
            $stmt->execute([$table, $column]);

            return (bool) $stmt->fetchColumn();
        } catch (PDOException) {
            return false;
        }
    }
}
