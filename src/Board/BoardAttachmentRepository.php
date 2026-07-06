<?php

declare(strict_types=1);

namespace Study114\Board;

use PDO;

final class BoardAttachmentRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return array<string, mixed>|null */
    public function findPrimary(string $boardKey, string $postKey): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, board_key, post_key, attachment_key, original_name, storage_path,
                    mime_type, size_bytes, created_at, updated_at
             FROM board_post_attachments
             WHERE board_key = ? AND post_key = ? AND attachment_key = ?
             LIMIT 1'
        );
        $stmt->execute([$boardKey, $postKey, 'primary']);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    /** @return array<string, mixed> */
    public function upsertPrimary(
        string $boardKey,
        string $postKey,
        string $originalName,
        string $storagePath,
        string $mimeType,
        int $sizeBytes,
    ): array {
        $existing = $this->findPrimary($boardKey, $postKey);
        if ($existing !== null) {
            $stmt = $this->pdo->prepare(
                'UPDATE board_post_attachments
                 SET original_name = ?, storage_path = ?, mime_type = ?, size_bytes = ?, updated_at = NOW()
                 WHERE board_key = ? AND post_key = ? AND attachment_key = ?'
            );
            $stmt->execute([
                $originalName,
                $storagePath,
                $mimeType,
                $sizeBytes,
                $boardKey,
                $postKey,
                'primary',
            ]);
        } else {
            $stmt = $this->pdo->prepare(
                'INSERT INTO board_post_attachments
                 (board_key, post_key, attachment_key, original_name, storage_path, mime_type, size_bytes)
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $boardKey,
                $postKey,
                'primary',
                $originalName,
                $storagePath,
                $mimeType,
                $sizeBytes,
            ]);
        }

        /** @var array<string, mixed> */
        return $this->findPrimary($boardKey, $postKey);
    }

    public function deletePrimary(string $boardKey, string $postKey): ?string
    {
        $row = $this->findPrimary($boardKey, $postKey);
        if ($row === null) {
            return null;
        }
        $stmt = $this->pdo->prepare(
            'DELETE FROM board_post_attachments WHERE board_key = ? AND post_key = ? AND attachment_key = ?'
        );
        $stmt->execute([$boardKey, $postKey, 'primary']);

        return (string) $row['storage_path'];
    }
}
