<?php

declare(strict_types=1);

namespace Study114\Board;

use InvalidArgumentException;
use Study114\Database\Connection;

final class BoardAttachmentService
{
    private const BOARD_KEY = 'submission';
    private const ATTACHMENT_KEY = 'primary';

    private BoardPostRepository $posts;
    private BoardAttachmentRepository $attachments;
    private AttachmentStorage $storage;
    /** @var array<string, mixed> */
    private array $config;

    public function __construct(
        ?BoardPostRepository $posts = null,
        ?BoardAttachmentRepository $attachments = null,
        ?AttachmentStorage $storage = null,
    ) {
        $pdo = Connection::get();
        $this->posts = $posts ?? new BoardPostRepository($pdo);
        $this->attachments = $attachments ?? new BoardAttachmentRepository($pdo);
        $this->storage = $storage ?? new AttachmentStorage();
        $this->config = study114_config('storage');
    }

    /**
     * @param array<string, mixed> $file $_FILES entry
     * @return array<string, mixed>
     */
    public function uploadSubmission(string $postKey, string $authorRole, array $file): array
    {
        $this->assertAuthorRole($authorRole);
        $post = $this->assertOwnedPost($postKey, $authorRole);
        $this->assertEditableStatus((string) $post['status']);

        [$originalName, $mimeType, $sizeBytes, $stream] = $this->parseUploadedFile($file);
        $this->validateFile($originalName, $mimeType, $sizeBytes);

        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $storageFileName = bin2hex(random_bytes(16)) . ($ext !== '' ? '.' . $ext : '');
        $relativePath = $this->storage->buildRelativePath(self::BOARD_KEY, $postKey, $storageFileName);

        $oldPath = $this->attachments->deletePrimary(self::BOARD_KEY, $postKey);
        if ($oldPath !== null) {
            try {
                $this->storage->delete($oldPath);
            } catch (InvalidArgumentException) {
                // 이전 파일 누락은 무시
            }
        }

        $this->storage->store($relativePath, $stream);
        fclose($stream);

        $row = $this->attachments->upsertPrimary(
            self::BOARD_KEY,
            $postKey,
            $originalName,
            $relativePath,
            $mimeType,
            $sizeBytes,
        );

        $this->syncFileLabel($postKey, $originalName);

        return $this->mapAttachment($row);
    }

    /** @return array<string, mixed>|null */
    public function getPrimaryMeta(string $boardKey, string $postKey): ?array
    {
        $row = $this->attachments->findPrimary($boardKey, $postKey);

        return $row === null ? null : $this->mapAttachment($row);
    }

    /**
     * @param 'owner'|'admin' $audience
     * @return array<string, mixed>
     */
    public function issueDownloadToken(
        string $postKey,
        string $audience,
        ?string $authorRole = null,
        ?string $operatorId = null,
    ): array {
        if ($audience === 'owner') {
            $this->assertAuthorRole((string) $authorRole);
            $this->assertOwnedPost($postKey, (string) $authorRole);
        } elseif ($audience !== 'admin') {
            throw new InvalidArgumentException('audience는 owner 또는 admin이어야 합니다.');
        }

        $row = $this->attachments->findPrimary(self::BOARD_KEY, $postKey);
        if ($row === null) {
            throw new InvalidArgumentException('첨부 파일이 없습니다.');
        }

        $ttl = (int) ($this->config['download_token_ttl'] ?? 300);
        $secret = (string) ($this->config['download_token_secret'] ?? '');
        $token = AttachmentToken::issue([
            'board_key' => self::BOARD_KEY,
            'post_key' => $postKey,
            'attachment_key' => self::ATTACHMENT_KEY,
            'aud' => $audience,
            'author_role' => $authorRole,
            'operator_id' => $operatorId,
        ], $secret, $ttl);

        return [
            'token' => $token,
            'expiresIn' => $ttl,
            'originalName' => (string) $row['original_name'],
            'sizeBytes' => (int) $row['size_bytes'],
            'mimeType' => (string) $row['mime_type'],
        ];
    }

    public function streamDownload(string $token): never
    {
        $secret = (string) ($this->config['download_token_secret'] ?? '');
        $payload = AttachmentToken::verify($token, $secret);

        $boardKey = (string) ($payload['board_key'] ?? '');
        $postKey = (string) ($payload['post_key'] ?? '');
        if ($boardKey !== self::BOARD_KEY || $postKey === '') {
            throw new InvalidArgumentException('토큰 대상이 올바르지 않습니다.');
        }

        $row = $this->attachments->findPrimary($boardKey, $postKey);
        if ($row === null) {
            throw new InvalidArgumentException('첨부 파일이 없습니다.');
        }

        $path = $this->storage->absolutePath((string) $row['storage_path']);
        $mime = (string) $row['mime_type'];
        $name = (string) $row['original_name'];

        header('Content-Type: ' . $mime);
        header('Content-Length: ' . (string) filesize($path));
        header('Content-Disposition: attachment; filename="' . rawurlencode($name) . '"; filename*=UTF-8\'\'' . rawurlencode($name));
        header('Cache-Control: no-store');
        readfile($path);
        exit;
    }

    public function deleteForPost(string $boardKey, string $postKey): void
    {
        if ($boardKey !== self::BOARD_KEY) {
            return;
        }
        $oldPath = $this->attachments->deletePrimary($boardKey, $postKey);
        if ($oldPath !== null) {
            try {
                $this->storage->delete($oldPath);
            } catch (InvalidArgumentException) {
                // ignore
            }
        }
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function mapAttachment(array $row): array
    {
        return [
            'hasFile' => true,
            'attachmentKey' => (string) $row['attachment_key'],
            'originalName' => (string) $row['original_name'],
            'sizeBytes' => (int) $row['size_bytes'],
            'mimeType' => (string) $row['mime_type'],
            'updatedAt' => substr((string) $row['updated_at'], 0, 10),
        ];
    }

    /** @return array<string, mixed> */
    private function assertOwnedPost(string $postKey, string $authorRole): array
    {
        $post = $this->posts->findByKey(self::BOARD_KEY, $postKey);
        if ($post === null) {
            throw new InvalidArgumentException('게시물을 찾을 수 없습니다.');
        }
        if ((string) $post['author_role'] !== $authorRole) {
            throw new InvalidArgumentException('작성자 역할이 일치하지 않습니다.');
        }

        return $post;
    }

    private function assertEditableStatus(string $status): void
    {
        if ($status !== 'draft' && $status !== 'submitted') {
            throw new InvalidArgumentException('첨부를 변경할 수 없는 상태입니다.');
        }
    }

    private function assertAuthorRole(string $authorRole): void
    {
        $allowed = ['guest', 'parent', 'study_room', 'tutor', 'admin', 'system'];
        if ($authorRole === '' || !in_array($authorRole, $allowed, true)) {
            throw new InvalidArgumentException('유효하지 않은 author_role입니다.');
        }
    }

    /**
     * @param array<string, mixed> $file
     * @return array{0: string, 1: string, 2: int, 3: resource}
     */
    private function parseUploadedFile(array $file): array
    {
        $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($error === UPLOAD_ERR_NO_FILE) {
            throw new InvalidArgumentException('업로드 파일이 필요합니다.');
        }
        if ($error !== UPLOAD_ERR_OK) {
            throw new InvalidArgumentException('파일 업로드에 실패했습니다.');
        }

        $tmp = (string) ($file['tmp_name'] ?? '');
        $originalName = (string) ($file['name'] ?? 'attachment.bin');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            throw new InvalidArgumentException('업로드 파일이 올바르지 않습니다.');
        }

        $stream = fopen($tmp, 'rb');
        if ($stream === false) {
            throw new InvalidArgumentException('업로드 파일을 읽을 수 없습니다.');
        }

        $mime = (string) ($file['type'] ?? '');
        if ($mime === '') {
            $detected = mime_content_type($tmp);
            $mime = is_string($detected) ? $detected : 'application/octet-stream';
        }

        return [$originalName, $mime, (int) ($file['size'] ?? 0), $stream];
    }

    private function validateFile(string $originalName, string $mimeType, int $sizeBytes): void
    {
        $rules = $this->config['submission'] ?? [];
        $maxSize = (int) ($rules['max_size_bytes'] ?? 10485760);
        if ($sizeBytes <= 0 || $sizeBytes > $maxSize) {
            throw new InvalidArgumentException('파일 용량이 허용 범위를 벗어났습니다.');
        }

        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        /** @var list<string> $allowedExt */
        $allowedExt = $rules['allowed_extensions'] ?? ['pdf', 'jpg', 'jpeg', 'png'];
        if ($ext === '' || !in_array($ext, $allowedExt, true)) {
            throw new InvalidArgumentException('허용되지 않는 파일 형식입니다.');
        }

        /** @var list<string> $allowedMimes */
        $allowedMimes = $rules['allowed_mimes'] ?? ['application/pdf', 'image/jpeg', 'image/png'];
        if (!in_array($mimeType, $allowedMimes, true)) {
            throw new InvalidArgumentException('허용되지 않는 MIME 형식입니다.');
        }
    }

    private function syncFileLabel(string $postKey, string $originalName): void
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            'UPDATE board_posts SET file_label = ?, updated_at = NOW() WHERE board_key = ? AND post_key = ?'
        );
        $stmt->execute([$originalName, self::BOARD_KEY, $postKey]);
    }
}
