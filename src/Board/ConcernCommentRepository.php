<?php

declare(strict_types=1);

namespace Study114\Board;

use PDO;
use Study114\Database\Connection;

final class ConcernCommentRepository
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Connection::get();
    }

    /**
     * @return array<string, mixed>
     */
    public function insert(int $postId, ?int $parentCommentId, int $authorUserId, string $authorRole, string $authorDisplayName, string $body): array
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO board_post_comments
             (post_id, parent_comment_id, author_user_id, author_role, author_display_name, body)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$postId, $parentCommentId, $authorUserId, $authorRole, $authorDisplayName, $body]);

        return $this->findById((int) $this->pdo->lastInsertId());
    }

    /** @return array<string, mixed>|null */
    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM board_post_comments WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        return $row !== false ? $row : null;
    }

    /**
     * 글별 댓글 목록 (2단계). deleted 댓글도 대댓글이 있으면 포함.
     *
     * @return list<array<string, mixed>>
     */
    public function listByPost(int $postId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM board_post_comments
             WHERE post_id = ?
             ORDER BY created_at ASC, id ASC'
        );
        $stmt->execute([$postId]);

        return $stmt->fetchAll();
    }

    public function softDelete(int $id): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE board_post_comments SET status = ?, updated_at = NOW() WHERE id = ?'
        );
        $stmt->execute(['deleted', $id]);
    }

    public function setStatus(int $id, string $status): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE board_post_comments SET status = ?, updated_at = NOW() WHERE id = ?'
        );
        $stmt->execute([$status, $id]);
    }

    public function countByPost(int $postId): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM board_post_comments WHERE post_id = ? AND status = ?'
        );
        $stmt->execute([$postId, 'visible']);

        return (int) $stmt->fetchColumn();
    }

    public function hasChildren(int $commentId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM board_post_comments WHERE parent_comment_id = ? LIMIT 1'
        );
        $stmt->execute([$commentId]);

        return $stmt->fetchColumn() !== false;
    }

    /** 신고 3건 이상 자동 숨김 */
    public function autoHide(int $commentId): void
    {
        $this->setStatus($commentId, 'hidden');
    }
}
