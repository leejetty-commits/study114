<?php

declare(strict_types=1);

namespace Study114\Messages;

use InvalidArgumentException;
use Study114\Board\AttachmentStorage;
use Study114\Database\Connection;

final class MessageAttachmentService
{
    private AttachmentStorage $storage;
    /** @var array<string, mixed> */
    private array $rules;

    public function __construct(?AttachmentStorage $storage = null)
    {
        $this->storage = $storage ?? new AttachmentStorage();
        $config = study114_config('storage');
        $this->rules = is_array($config['message'] ?? null) ? $config['message'] : [];
    }

    public function maxFiles(): int
    {
        return (int) ($this->rules['max_files'] ?? 3);
    }

    public function maxBytes(): int
    {
        return (int) ($this->rules['max_size_bytes'] ?? 5_242_880);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function collectFromRequest(): array
    {
        $bag = $_FILES['files'] ?? $_FILES['files[]'] ?? null;
        if (!is_array($bag) || !isset($bag['name'])) {
            return [];
        }
        if (is_array($bag['name'])) {
            $out = [];
            foreach ($bag['name'] as $i => $name) {
                $error = (int) ($bag['error'][$i] ?? UPLOAD_ERR_NO_FILE);
                if ($error === UPLOAD_ERR_NO_FILE) {
                    continue;
                }
                $out[] = [
                    'name' => (string) $name,
                    'type' => (string) ($bag['type'][$i] ?? ''),
                    'tmp_name' => (string) ($bag['tmp_name'][$i] ?? ''),
                    'error' => $error,
                    'size' => (int) ($bag['size'][$i] ?? 0),
                ];
            }

            return $out;
        }

        $error = (int) ($bag['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($error === UPLOAD_ERR_NO_FILE) {
            return [];
        }

        return [[
            'name' => (string) $bag['name'],
            'type' => (string) ($bag['type'] ?? ''),
            'tmp_name' => (string) ($bag['tmp_name'] ?? ''),
            'error' => $error,
            'size' => (int) ($bag['size'] ?? 0),
        ]];
    }

    /**
     * @param list<array<string, mixed>> $files
     * @return list<array<string, mixed>>
     */
    public function storeForMessage(int $threadId, int $messageId, array $files): array
    {
        if ($files === []) {
            return [];
        }
        if (count($files) > $this->maxFiles()) {
            throw new InvalidArgumentException('파일은 메시지당 최대 ' . $this->maxFiles() . '개까지 첨부할 수 있습니다.');
        }

        $repo = new MessagesRepository(Connection::get());
        $stored = [];
        $paths = [];
        try {
            foreach ($files as $file) {
                [$originalName, $mimeType, $sizeBytes, $stream] = $this->parseUploadedFile($file);
                $this->validateFile($originalName, $mimeType, $sizeBytes);

                $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
                $storageFileName = bin2hex(random_bytes(16)) . ($ext !== '' ? '.' . $ext : '');
                $relativePath = $this->storage->buildRelativePath('messages', (string) $threadId, $storageFileName);
                $this->storage->store($relativePath, $stream);
                fclose($stream);
                $paths[] = $relativePath;

                $row = $repo->insertAttachment(
                    $messageId,
                    $threadId,
                    $this->safeOriginalName($originalName),
                    $relativePath,
                    $mimeType,
                    $sizeBytes,
                );
                $stored[] = $this->mapAttachment($row);
            }
        } catch (\Throwable $e) {
            foreach ($paths as $path) {
                try {
                    $this->storage->delete($path);
                } catch (InvalidArgumentException) {
                    // ignore
                }
            }
            throw $e;
        }

        return $stored;
    }

    public function streamDownload(int $userId, int $attachmentId): never
    {
        $repo = new MessagesRepository(Connection::get());
        $row = $repo->findAttachmentForUser($attachmentId, $userId);
        if ($row === null) {
            throw new InvalidArgumentException('첨부 파일을 찾을 수 없습니다.');
        }

        $path = $this->storage->absolutePath((string) $row['storage_path']);
        $mime = (string) $row['mime_type'];
        $name = (string) $row['original_name'];

        header('Content-Type: ' . $mime);
        header('Content-Length: ' . (string) filesize($path));
        header(
            'Content-Disposition: attachment; filename="' . rawurlencode($name)
            . '"; filename*=UTF-8\'\'' . rawurlencode($name)
        );
        header('Cache-Control: no-store');
        readfile($path);
        exit;
    }

    /**
     * @param array<string, mixed> $file
     * @return array{0: string, 1: string, 2: int, 3: resource}
     */
    private function parseUploadedFile(array $file): array
    {
        $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($error === UPLOAD_ERR_INI_SIZE || $error === UPLOAD_ERR_FORM_SIZE) {
            throw new InvalidArgumentException('파일 용량이 서버 한도를 초과했습니다.');
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

        $detected = mime_content_type($tmp);
        $mime = is_string($detected) && $detected !== ''
            ? $detected
            : (string) ($file['type'] ?? 'application/octet-stream');

        return [$originalName, $mime, (int) ($file['size'] ?? 0), $stream];
    }

    private function validateFile(string $originalName, string $mimeType, int $sizeBytes): void
    {
        $maxSize = $this->maxBytes();
        if ($sizeBytes <= 0 || $sizeBytes > $maxSize) {
            throw new InvalidArgumentException('파일은 개당 5MB까지 첨부할 수 있습니다.');
        }

        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        /** @var list<string> $allowedExt */
        $allowedExt = $this->rules['allowed_extensions'] ?? ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
        if ($ext === '' || !in_array($ext, $allowedExt, true)) {
            throw new InvalidArgumentException('PDF, JPG, PNG, WebP만 첨부할 수 있습니다.');
        }

        $mimeType = strtolower($mimeType);
        if ($mimeType === 'image/jpg' || $mimeType === 'image/pjpeg') {
            $mimeType = 'image/jpeg';
        }
        if ($mimeType === 'application/x-pdf') {
            $mimeType = 'application/pdf';
        }

        /** @var list<string> $allowedMimes */
        $allowedMimes = $this->rules['allowed_mimes'] ?? [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
        ];
        $normalizedAllowed = array_map(static function (string $m): string {
            $m = strtolower($m);
            if ($m === 'image/jpg' || $m === 'image/pjpeg') {
                return 'image/jpeg';
            }
            if ($m === 'application/x-pdf') {
                return 'application/pdf';
            }

            return $m;
        }, $allowedMimes);

        if (!in_array($mimeType, $normalizedAllowed, true)) {
            throw new InvalidArgumentException('허용되지 않는 파일 형식입니다.');
        }
    }

    private function safeOriginalName(string $name): string
    {
        $base = basename(str_replace('\\', '/', $name));
        $base = trim($base);
        if ($base === '') {
            $base = 'attachment.bin';
        }

        return mb_substr($base, 0, 180);
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    public function mapAttachment(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'originalName' => (string) $row['original_name'],
            'sizeBytes' => (int) $row['size_bytes'],
            'mimeType' => (string) $row['mime_type'],
        ];
    }
}
