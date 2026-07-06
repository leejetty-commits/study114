<?php

declare(strict_types=1);

namespace Study114\Board;

use PDO;

final class BoardPostRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<array<string, mixed>> */
    public function listByBoard(string $boardKey, ?string $authorRole = null, ?string $postKey = null): array
    {
        $sql = 'SELECT id, board_key, post_key, author_user_id, author_role, status,
                       title, description, memo, internal_memo, category_id, file_label, meta_json,
                       created_at, updated_at
                FROM board_posts
                WHERE board_key = ?';
        $params = [$boardKey];

        if ($authorRole !== null && $authorRole !== '') {
            $sql .= ' AND author_role = ?';
            $params[] = $authorRole;
        }
        if ($postKey !== null && $postKey !== '') {
            $sql .= ' AND post_key = ?';
            $params[] = $postKey;
        }

        $sql .= ' ORDER BY updated_at DESC, id DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    /** @return list<array<string, mixed>> */
    public function listSubmissionQueue(string $boardKey, ?string $status = 'submitted'): array
    {
        $sql = 'SELECT id, board_key, post_key, author_user_id, author_role, status,
                       title, description, memo, internal_memo, category_id, file_label, meta_json,
                       created_at, updated_at
                FROM board_posts
                WHERE board_key = ?';
        $params = [$boardKey];

        if ($status !== null && $status !== '' && $status !== 'all') {
            $sql .= ' AND status = ?';
            $params[] = $status;
        }

        $sql .= ' ORDER BY updated_at DESC, id DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    /** @return array<string, mixed>|null */
    public function findByKey(string $boardKey, string $postKey): ?array
    {
        $rows = $this->listByBoard($boardKey, null, $postKey);

        return $rows[0] ?? null;
    }

    /**
     * @param array<string, mixed>|null $meta
     * @return array<string, mixed>
     */
    public function save(
        string $boardKey,
        ?string $postKey,
        string $authorRole,
        string $status,
        string $title,
        string $description,
        string $memo,
        ?string $categoryId,
        string $fileLabel,
        ?array $meta = null,
    ): array {
        $postKey = $postKey !== null && $postKey !== '' ? $postKey : $boardKey . '-' . time();
        $metaJson = $meta !== null ? json_encode($meta, JSON_UNESCAPED_UNICODE) : null;

        $existing = $this->findByKey($boardKey, $postKey);
        if ($existing !== null) {
            $stmt = $this->pdo->prepare(
                'UPDATE board_posts
                 SET status = ?, title = ?, description = ?, memo = ?, category_id = ?,
                     file_label = ?, meta_json = COALESCE(?, meta_json), updated_at = NOW()
                 WHERE board_key = ? AND post_key = ?'
            );
            $stmt->execute([
                $status,
                $title,
                $description,
                $memo,
                $categoryId,
                $fileLabel,
                $metaJson,
                $boardKey,
                $postKey,
            ]);
        } else {
            $stmt = $this->pdo->prepare(
                'INSERT INTO board_posts
                 (board_key, post_key, author_role, status, title, description, memo, category_id, file_label, meta_json)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $boardKey,
                $postKey,
                $authorRole,
                $status,
                $title,
                $description,
                $memo,
                $categoryId,
                $fileLabel,
                $metaJson,
            ]);
        }

        /** @var array<string, mixed> */
        return $this->findByKey($boardKey, $postKey);
    }

    /** @return array<string, mixed> */
    public function updateAdminReview(
        string $boardKey,
        string $postKey,
        string $status,
        ?string $internalMemo,
    ): array {
        $stmt = $this->pdo->prepare(
            'UPDATE board_posts
             SET status = ?, internal_memo = COALESCE(?, internal_memo), updated_at = NOW()
             WHERE board_key = ? AND post_key = ?'
        );
        $stmt->execute([$status, $internalMemo, $boardKey, $postKey]);

        /** @var array<string, mixed> */
        return $this->findByKey($boardKey, $postKey);
    }

    public function delete(string $boardKey, string $postKey): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM board_posts WHERE board_key = ? AND post_key = ?');
        $stmt->execute([$boardKey, $postKey]);
    }
}
