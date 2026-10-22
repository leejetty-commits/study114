<?php

declare(strict_types=1);

namespace Study114\Board;

use InvalidArgumentException;
use Study114\Database\Connection;
use Study114\Media\PromoImageProcessor;

final class BoardAttachmentService
{
    private const BOARD_KEY = 'submission';
    private const ATTACHMENT_KEY = 'primary';
    /** @var list<string> */
    private const CONCERN_PHOTO_KEYS = ['photo-1', 'photo-2', 'photo-3'];

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
    public function uploadSubmission(
        string $postKey,
        string $authorRole,
        array $file,
        ?int $sessionUserId = null,
    ): array {
        $this->assertAuthorRole($authorRole);
        $post = $this->assertOwnedPost($postKey, $authorRole, $sessionUserId);
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
        ?int $sessionUserId = null,
    ): array {
        if ($audience === 'owner') {
            $this->assertAuthorRole((string) $authorRole);
            $this->assertOwnedPost($postKey, (string) $authorRole, $sessionUserId);
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

        // 토큰만으로 우회 금지 — 세션 + 이메일 확인 + board ACL 재검증
        $auth = \Study114\Auth\AuthSession::user();
        if ($auth === null) {
            throw new BoardAccessException(401, 'unauthorized', '로그인이 필요합니다.');
        }
        (new \Study114\Auth\EmailVerificationGate())->assertVerified((int) $auth['user_id']);
        $boardRole = BoardChannelAcl::boardRoleFromAuth($auth);
        $aud = (string) ($payload['aud'] ?? 'owner');
        if ($aud === 'admin') {
            if (($auth['role_type'] ?? '') !== 'admin' && empty($auth['admin_level'])) {
                throw new BoardAccessException(403, 'forbidden', '운영자 권한이 필요합니다.');
            }
        } elseif (!BoardChannelAcl::canDownload($boardKey, $boardRole)) {
            throw new BoardAccessException(403, 'forbidden', '첨부 다운로드 권한이 없습니다.');
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

    /**
     * 요청 board_key 가 아니라 DB 행의 실제 채널·소유자를 본다.
     * author_user_id 가 없는 레거시 글은 소유자를 확정할 수 없으므로 admin 외 fail-closed.
     *
     * @return array<string, mixed>
     */
    private function assertOwnedPost(string $postKey, string $authorRole, ?int $sessionUserId = null): array
    {
        $rows = $this->posts->findAllByPostKey($postKey);
        if ($rows === []) {
            throw new InvalidArgumentException('게시물을 찾을 수 없습니다.');
        }
        if (count($rows) > 1) {
            throw new BoardAccessException(409, 'conflict', '동일한 post_key가 여러 채널에 있습니다.');
        }
        $post = $rows[0];
        $actualKey = BoardChannelAcl::normalizeBoardKey((string) $post['board_key']);
        if ($actualKey !== self::BOARD_KEY) {
            throw new BoardAccessException(403, 'forbidden', '제출함 게시글이 아닙니다.');
        }
        if ((string) $post['author_role'] !== $authorRole) {
            throw new InvalidArgumentException('작성자 역할이 일치하지 않습니다.');
        }
        if ($authorRole !== 'admin') {
            $ownerId = (int) ($post['author_user_id'] ?? 0);
            if ($ownerId <= 0) {
                throw new BoardAccessException(
                    403,
                    'forbidden',
                    '작성자 정보가 없는 글입니다. 운영자에게 문의해 주세요.',
                );
            }
            if ($sessionUserId === null || $sessionUserId <= 0 || $ownerId !== $sessionUserId) {
                throw new BoardAccessException(403, 'forbidden', '작성자만 접근할 수 있습니다.');
            }
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

    /**
     * 고민방 글 사진 1장. 원본은 저장하지 않고 줄인 WebP만 남긴다.
     *
     * @param array<string, mixed> $file $_FILES entry
     * @return array<string, mixed>
     */
    public function uploadConcernPhoto(string $boardKey, string $postKey, array $file, int $sessionUserId): array
    {
        $post = $this->assertConcernAuthor($boardKey, $postKey, $sessionUserId);
        $rules = $this->concernRules();
        $existing = $this->attachments->listByKeys((string) $post['board_key'], $postKey, self::CONCERN_PHOTO_KEYS);
        $maxFiles = (int) ($rules['max_files'] ?? 3);
        if (count($existing) >= $maxFiles) {
            throw new InvalidArgumentException('사진은 3장까지 올릴 수 있어요.');
        }

        [$originalName, $sizeBytes, $tmp] = $this->readConcernUpload($file, $rules);
        try {
            $info = (new PromoImageProcessor())->inspect($tmp);
        } catch (InvalidArgumentException) {
            throw new InvalidArgumentException('사진만 올릴 수 있어요. JPG, PNG, WebP 중에서 골라 주세요.');
        }
        $width = (int) ($info['width'] ?? 0);
        $height = (int) ($info['height'] ?? 0);
        if (
            max($width, $height) > 12000
            || ($width > 0 && $height > intdiv(40000000, $width))
        ) {
            throw new InvalidArgumentException('사진이 너무 커요. 더 작은 사진을 올려 주세요.');
        }
        $mime = (string) ($info['mime'] ?? '');
        /** @var list<string> $allowedMimes */
        $allowedMimes = $rules['allowed_mimes'] ?? ['image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($mime, $allowedMimes, true)) {
            throw new InvalidArgumentException('사진만 올릴 수 있어요. JPG, PNG, WebP 중에서 골라 주세요.');
        }

        $used = array_map(static fn (array $row): string => (string) $row['attachment_key'], $existing);
        $attachmentKey = '';
        foreach (self::CONCERN_PHOTO_KEYS as $key) {
            if (!in_array($key, $used, true)) {
                $attachmentKey = $key;
                break;
            }
        }
        if ($attachmentKey === '') {
            throw new InvalidArgumentException('사진은 3장까지 올릴 수 있어요.');
        }

        $storageFileName = $attachmentKey . '.webp';
        $relativePath = $this->storage->buildRelativePath((string) $post['board_key'], $postKey, $storageFileName);
        $shrunk = $this->writeShrunkWebp($tmp, $rules);
        $stream = fopen($shrunk['path'], 'rb');
        if ($stream === false) {
            @unlink($shrunk['path']);
            throw new InvalidArgumentException('사진을 저장하지 못했어요.');
        }
        try {
            $this->storage->store($relativePath, $stream);
        } finally {
            fclose($stream);
            @unlink($shrunk['path']);
        }

        $row = $this->attachments->insertKeyed(
            (string) $post['board_key'],
            $postKey,
            $attachmentKey,
            $originalName,
            $relativePath,
            'image/webp',
            $shrunk['bytes'],
        );

        return $this->mapConcernPhoto($row, (string) $post['board_key'], $postKey);
    }

    /** @return list<array<string, mixed>> */
    public function listConcernPhotos(string $boardKey, string $postKey): array
    {
        $post = $this->requireConcernPost($boardKey, $postKey);
        $rows = $this->attachments->listByKeys((string) $post['board_key'], $postKey, self::CONCERN_PHOTO_KEYS);
        $out = [];
        foreach ($rows as $row) {
            $out[] = $this->mapConcernPhoto($row, (string) $post['board_key'], $postKey);
        }

        return $out;
    }

    public function deleteConcernPhoto(string $boardKey, string $postKey, string $attachmentKey, int $sessionUserId): void
    {
        if (!in_array($attachmentKey, self::CONCERN_PHOTO_KEYS, true)) {
            throw new InvalidArgumentException('사진을 찾을 수 없어요.');
        }
        $post = $this->assertConcernAuthor($boardKey, $postKey, $sessionUserId);
        $path = $this->attachments->deleteKeyed((string) $post['board_key'], $postKey, $attachmentKey);
        if ($path === null) {
            throw new InvalidArgumentException('사진을 찾을 수 없어요.');
        }
        try {
            $this->storage->delete($path);
        } catch (InvalidArgumentException) {
            // 파일이 이미 없으면 목록에서만 뺀다.
        }
    }

    /**
     * 고민방 글을 지울 때 그 글의 사진 파일과 첨부 기록만 지운다.
     * photo-1~3 만 대상이다. submission primary 와 쪽지 첨부는 다루지 않는다.
     */
    public function deleteConcernPhotosForPost(string $boardKey, string $postKey): void
    {
        $key = BoardChannelAcl::normalizeBoardKey($boardKey);
        if (!BoardChannelAcl::isConcern($key) || $postKey === '') {
            return;
        }
        $rows = $this->attachments->listByKeys($key, $postKey, self::CONCERN_PHOTO_KEYS);
        foreach ($rows as $row) {
            $attachmentKey = (string) ($row['attachment_key'] ?? '');
            $path = $this->attachments->deleteKeyed($key, $postKey, $attachmentKey);
            if ($path === null) {
                continue;
            }
            try {
                $this->storage->delete($path);
            } catch (InvalidArgumentException) {
                // 파일이 이미 없으면 기록만 뺀다.
            }
        }
    }

    public function streamConcernPhoto(string $boardKey, string $postKey, string $attachmentKey): never
    {
        if (!in_array($attachmentKey, self::CONCERN_PHOTO_KEYS, true)) {
            throw new InvalidArgumentException('사진을 찾을 수 없어요.');
        }
        $post = $this->requireConcernPost($boardKey, $postKey);
        $rows = $this->attachments->listByKeys((string) $post['board_key'], $postKey, [$attachmentKey]);
        if ($rows === []) {
            throw new InvalidArgumentException('사진을 찾을 수 없어요.');
        }
        $path = $this->storage->absolutePath((string) $rows[0]['storage_path']);
        header('Content-Type: image/webp');
        header('Content-Length: ' . (string) filesize($path));
        header('Content-Disposition: inline; filename="' . $attachmentKey . '.webp"');
        header('Cache-Control: private, max-age=300');
        readfile($path);
        exit;
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function mapConcernPhoto(array $row, string $boardKey, string $postKey): array
    {
        $key = (string) $row['attachment_key'];
        $query = http_build_query([
            'board_key' => $boardKey,
            'post_key' => $postKey,
            'file' => $key,
        ]);

        return [
            'key' => $key,
            'url' => '/api/board/concern-photos.php?' . $query,
            'sizeBytes' => (int) $row['size_bytes'],
        ];
    }

    /** @return array<string, mixed> */
    private function requireConcernPost(string $boardKey, string $postKey): array
    {
        $key = BoardChannelAcl::normalizeBoardKey($boardKey);
        if (!BoardChannelAcl::isConcern($key) || $postKey === '') {
            throw new InvalidArgumentException('고민방 글이 아닙니다.');
        }
        $post = $this->posts->findByKey($key, $postKey);
        if ($post === null || (string) ($post['status'] ?? '') !== 'published') {
            throw new InvalidArgumentException('글을 찾을 수 없어요.');
        }

        return $post;
    }

    /** @return array<string, mixed> */
    private function assertConcernAuthor(string $boardKey, string $postKey, int $sessionUserId): array
    {
        $post = $this->requireConcernPost($boardKey, $postKey);
        $ownerId = (int) ($post['author_user_id'] ?? 0);
        if ($sessionUserId <= 0 || $ownerId <= 0 || $ownerId !== $sessionUserId) {
            throw new BoardAccessException(403, 'forbidden', '글을 쓴 사람만 사진을 올릴 수 있어요.');
        }

        return $post;
    }

    /** @return array<string, mixed> */
    private function concernRules(): array
    {
        $rules = $this->config['concern'] ?? [];

        return is_array($rules) ? $rules : [];
    }

    /**
     * @param array<string, mixed> $file
     * @param array<string, mixed> $rules
     * @return array{0: string, 1: int, 2: string}
     */
    private function readConcernUpload(array $file, array $rules): array
    {
        $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($error === UPLOAD_ERR_INI_SIZE || $error === UPLOAD_ERR_FORM_SIZE) {
            throw new InvalidArgumentException('사진 한 장은 10MB까지 올릴 수 있어요.');
        }
        if ($error === UPLOAD_ERR_NO_FILE) {
            throw new InvalidArgumentException('사진을 골라 주세요.');
        }
        if ($error !== UPLOAD_ERR_OK) {
            throw new InvalidArgumentException('사진을 올리지 못했어요. 다시 골라 주세요.');
        }
        $tmp = (string) ($file['tmp_name'] ?? '');
        $originalName = (string) ($file['name'] ?? '사진');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            throw new InvalidArgumentException('사진을 올리지 못했어요. 다시 골라 주세요.');
        }
        $sizeBytes = (int) ($file['size'] ?? 0);
        $maxSize = (int) ($rules['max_size_bytes'] ?? (10 * 1024 * 1024));
        if ($sizeBytes <= 0 || $sizeBytes > $maxSize) {
            throw new InvalidArgumentException('사진 한 장은 10MB까지 올릴 수 있어요.');
        }
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        /** @var list<string> $allowedExt */
        $allowedExt = $rules['allowed_extensions'] ?? ['jpg', 'jpeg', 'png', 'webp'];
        if ($ext === '' || !in_array($ext, $allowedExt, true)) {
            throw new InvalidArgumentException('사진만 올릴 수 있어요. JPG, PNG, WebP 중에서 골라 주세요.');
        }

        return [$originalName, $sizeBytes, $tmp];
    }

    /**
     * @param array<string, mixed> $rules
     * @return array{path: string, bytes: int}
     */
    private function writeShrunkWebp(string $sourceTmp, array $rules): array
    {
        $dest = tempnam(sys_get_temp_dir(), 'cphoto');
        if ($dest === false) {
            throw new InvalidArgumentException('사진을 저장하지 못했어요.');
        }
        $webp = $dest . '.webp';
        @unlink($dest);
        $maxEdge = (int) ($rules['max_long_edge'] ?? 1600);
        $quality = (int) ($rules['webp_quality'] ?? 82);
        $target = (int) ($rules['target_bytes'] ?? (1024 * 1024));
        try {
            $saved = (new PromoImageProcessor())->shrinkLongEdgeWebp($sourceTmp, $webp, $maxEdge, $quality, $target);
        } catch (\Throwable $e) {
            @unlink($webp);
            throw new InvalidArgumentException('사진을 저장하지 못했어요.');
        }

        return ['path' => $webp, 'bytes' => (int) $saved['bytes']];
    }
}
