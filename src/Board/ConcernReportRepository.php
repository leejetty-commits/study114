<?php

declare(strict_types=1);

namespace Study114\Board;

use PDO;
use PDOException;
use Study114\Database\Connection;

final class ConcernReportRepository
{
    /** 자동 숨김 기준 신고자 수 */
    public const AUTO_HIDE_THRESHOLD = 3;

    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Connection::get();
    }

    /** @return array<string, mixed>|null */
    public function findExisting(int $postId, ?int $commentId, int $reporterUserId): ?array
    {
        $cid = $commentId ?? 0;
        $stmt = $this->pdo->prepare(
            'SELECT * FROM board_post_reports
             WHERE post_id = ? AND comment_id = ? AND reporter_user_id = ?
             LIMIT 1'
        );
        $stmt->execute([$postId, $cid, $reporterUserId]);
        $row = $stmt->fetch();

        return $row !== false ? $row : null;
    }

    /** @return array<string, mixed> */
    public function insert(int $postId, ?int $commentId, int $reporterUserId, string $reason): array
    {
        $cid = $commentId ?? 0;
        try {
            $stmt = $this->pdo->prepare(
                'INSERT INTO board_post_reports (post_id, comment_id, reporter_user_id, reason)
                 VALUES (?, ?, ?, ?)'
            );
            $stmt->execute([$postId, $cid, $reporterUserId, $reason]);
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'Duplicate entry') || (int) $e->getCode() === 23000) {
                throw new \InvalidArgumentException('이미 신고한 대상입니다.');
            }
            throw $e;
        }

        $id = (int) $this->pdo->lastInsertId();
        $stmt2 = $this->pdo->prepare('SELECT * FROM board_post_reports WHERE id = ? LIMIT 1');
        $stmt2->execute([$id]);

        return $stmt2->fetch();
    }

    /**
     * 특정 대상의 고유 신고자 수.
     */
    public function countDistinctReporters(int $postId, ?int $commentId): int
    {
        $cid = $commentId ?? 0;
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(DISTINCT reporter_user_id) FROM board_post_reports
             WHERE post_id = ? AND comment_id = ?'
        );
        $stmt->execute([$postId, $cid]);

        return (int) $stmt->fetchColumn();
    }

    /**
     * 자동 숨김 기준 도달 여부.
     */
    public function shouldAutoHide(int $postId, ?int $commentId): bool
    {
        return $this->countDistinctReporters($postId, $commentId) >= self::AUTO_HIDE_THRESHOLD;
    }
}
