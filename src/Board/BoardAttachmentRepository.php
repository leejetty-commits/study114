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

    /**
     * 고민방 사진 키(photo-1~3)만. submission primary 는 건드리지 않는다.
     *
     * @param list<string> $keys
     * @return list<array<string, mixed>>
     */
    public function listByKeys(string $boardKey, string $postKey, array $keys): array
    {
        if ($keys === []) {
            return [];
        }
        $marks = implode(',', array_fill(0, count($keys), '?'));
        $stmt = $this->pdo->prepare(
            "SELECT id, board_key, post_key, attachment_key, original_name, storage_path,
                    mime_type, size_bytes, created_at, updated_at
             FROM board_post_attachments
             WHERE board_key = ? AND post_key = ? AND attachment_key IN ($marks)
             ORDER BY attachment_key ASC"
        );
        $stmt->execute(array_merge([$boardKey, $postKey], $keys));
        $rows = $stmt->fetchAll();

        return $rows === false ? [] : $rows;
    }

    /** @return array<string, mixed> */
    public function insertKeyed(
        string $boardKey,
        string $postKey,
        string $attachmentKey,
        string $originalName,
        string $storagePath,
        string $mimeType,
        int $sizeBytes,
    ): array {
        if (!str_starts_with($attachmentKey, 'photo-')) {
            throw new \InvalidArgumentException('고민방 사진 키가 아닙니다.');
        }
        $stmt = $this->pdo->prepare(
            'INSERT INTO board_post_attachments
             (board_key, post_key, attachment_key, original_name, storage_path, mime_type, size_bytes)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $boardKey,
            $postKey,
            $attachmentKey,
            $originalName,
            $storagePath,
            $mimeType,
            $sizeBytes,
        ]);
        $rows = $this->listByKeys($boardKey, $postKey, [$attachmentKey]);

        return $rows[0];
    }

    public function deleteKeyed(string $boardKey, string $postKey, string $attachmentKey): ?string
    {
        if (!str_starts_with($attachmentKey, 'photo-')) {
            throw new \InvalidArgumentException('고민방 사진 키가 아닙니다.');
        }
        $rows = $this->listByKeys($boardKey, $postKey, [$attachmentKey]);
        if ($rows === []) {
            return null;
        }
        $stmt = $this->pdo->prepare(
            'DELETE FROM board_post_attachments WHERE board_key = ? AND post_key = ? AND attachment_key = ?'
        );
        $stmt->execute([$boardKey, $postKey, $attachmentKey]);

        return (string) $rows[0]['storage_path'];
    }
}
