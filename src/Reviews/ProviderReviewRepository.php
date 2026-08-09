<?php

declare(strict_types=1);

namespace Study114\Reviews;

use PDO;

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
        $stmt->execute([$providerType, $providerId, 'visible']);

        return (int) $stmt->fetchColumn();
    }

    /** @return list<array<string, mixed>> */
    public function listVisible(string $providerType, int $providerId, int $limit = 3): array
    {
        $limit = max(1, min(20, $limit));
        $stmt = $this->pdo->prepare(
            "SELECT r.id, r.provider_type, r.provider_id, r.author_user_id, r.review_origin_type,
                    r.review_status, r.review_body, r.point_tags_json, r.created_at,
                    rp.body AS reply_body, rp.created_at AS reply_created_at
             FROM provider_reviews r
             LEFT JOIN provider_review_replies rp ON rp.review_id = r.id
             WHERE r.provider_type = ? AND r.provider_id = ? AND r.review_status = 'visible'
             ORDER BY r.created_at DESC
             LIMIT {$limit}"
        );
        $stmt->execute([$providerType, $providerId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return is_array($rows) ? $rows : [];
    }

    /** @return list<string> */
    public function aggregateTags(string $providerType, int $providerId, int $max = 4): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT point_tags_json FROM provider_reviews
             WHERE provider_type = ? AND provider_id = ? AND review_status = 'visible'
             ORDER BY created_at DESC LIMIT 30"
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

    public function findByAuthor(string $providerType, int $providerId, int $authorUserId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM provider_reviews
             WHERE provider_type = ? AND provider_id = ? AND author_user_id = ?
             LIMIT 1'
        );
        $stmt->execute([$providerType, $providerId, $authorUserId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    public function insertReview(
        string $providerType,
        int $providerId,
        int $authorUserId,
        string $originType,
        string $body,
        array $tags,
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
            'visible',
            $body,
            json_encode(array_values($tags), JSON_UNESCAPED_UNICODE),
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    public function insertReply(int $reviewId, int $providerUserId, string $body): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO provider_review_replies (review_id, provider_user_id, body)
             VALUES (?, ?, ?)'
        );
        $stmt->execute([$reviewId, $providerUserId, $body]);

        return (int) $this->pdo->lastInsertId();
    }

    public function getReviewById(int $reviewId): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM provider_reviews WHERE id = ? LIMIT 1');
        $stmt->execute([$reviewId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    public function hasReply(int $reviewId): bool
    {
        $stmt = $this->pdo->prepare('SELECT 1 FROM provider_review_replies WHERE review_id = ? LIMIT 1');
        $stmt->execute([$reviewId]);

        return (bool) $stmt->fetchColumn();
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

    /** 쪽지 thread 1건 이상 = 작성 자격 */
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
    public function listReceivedByOwner(int $ownerUserId, string $providerType, int $limit = 10): array
    {
        $limit = max(1, min(30, $limit));
        if ($providerType === 'study_room') {
            $sql = "SELECT r.*, rp.body AS reply_body
                    FROM provider_reviews r
                    INNER JOIN study_rooms sr ON sr.id = r.provider_id AND r.provider_type = 'study_room'
                    LEFT JOIN provider_review_replies rp ON rp.review_id = r.id
                    WHERE sr.user_id = ? AND r.review_status = 'visible'
                    ORDER BY r.created_at DESC LIMIT {$limit}";
        } else {
            $sql = "SELECT r.*, rp.body AS reply_body
                    FROM provider_reviews r
                    INNER JOIN tutors t ON t.id = r.provider_id AND r.provider_type = 'tutor'
                    LEFT JOIN provider_review_replies rp ON rp.review_id = r.id
                    WHERE t.user_id = ? AND r.review_status = 'visible'
                    ORDER BY r.created_at DESC LIMIT {$limit}";
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
    public function listWrittenByAuthor(int $authorUserId, int $limit = 20): array
    {
        $limit = max(1, min(50, $limit));
        $stmt = $this->pdo->prepare(
            "SELECT r.*, rp.body AS reply_body
             FROM provider_reviews r
             LEFT JOIN provider_review_replies rp ON rp.review_id = r.id
             WHERE r.author_user_id = ? AND r.review_status = 'visible'
             ORDER BY r.created_at DESC
             LIMIT {$limit}"
        );
        $stmt->execute([$authorUserId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return is_array($rows) ? $rows : [];
    }
}
