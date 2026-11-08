<?php

declare(strict_types=1);

namespace Study114\Messages;

use InvalidArgumentException;
use Study114\Board\AttachmentStorage;
use Study114\Database\Connection;
use Study114\Media\PromoImageProcessor;

final class MessageAttachmentService
{
    private AttachmentStorage $storage;
    /** @var array<string, mixed> */
    private array $rules;
    /** @var list<string> */
    private array $lastStoredPaths = [];

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
        $this->lastStoredPaths = [];
        if ($files === []) {
            return [];
        }
        if (count($files) > $this->maxFiles()) {
            throw new InvalidArgumentException('파일은 메시지당 최대 ' . $this->maxFiles() . '개까지 첨부할 수 있습니다.');
        }

        $repo = new MessagesRepository(Connection::get());
        $stored = [];
        $paths = [];
        $scratchFiles = [];
        try {
            foreach ($files as $file) {
                [$originalName, $tmp, $sizeBytes] = $this->readUploadedTmp($file);
                $mimeType = $this->detectServerMime($tmp);
                $this->assertAllowedMime($mimeType, $sizeBytes, $tmp);

                $ext = $this->extensionForMime($mimeType);
                $storePath = $tmp;
                $storeMime = $mimeType;
                $storeSize = $sizeBytes;

                if ($mimeType === 'application/pdf') {
                    $this->assertPdfMagic($tmp);
                } else {
                    // 이미지는 픽셀 검사 후 GD로 다시 저장해 폴리글롯·숨은 페이로드를 줄인다.
                    (new PromoImageProcessor())->inspect($tmp);
                    $this->assertImageBounds($tmp);
                    $reencoded = $this->reencodeImage($tmp, $mimeType);
                    $scratchFiles[] = $reencoded['path'];
                    $storePath = $reencoded['path'];
                    $storeMime = $reencoded['mime'];
                    $storeSize = $reencoded['bytes'];
                    $ext = $this->extensionForMime($storeMime);
                }

                $stream = fopen($storePath, 'rb');
                if ($stream === false) {
                    throw new InvalidArgumentException('업로드 파일을 읽을 수 없습니다.');
                }
                try {
                    $storageFileName = bin2hex(random_bytes(16)) . '.' . $ext;
                    $relativePath = $this->storage->buildRelativePath('messages', (string) $threadId, $storageFileName);
                    $this->storage->store($relativePath, $stream);
                } finally {
                    fclose($stream);
                }
                $paths[] = $relativePath;

                $row = $repo->insertAttachment(
                    $messageId,
                    $threadId,
                    $this->safeOriginalName($originalName, $ext),
                    $relativePath,
                    $storeMime,
                    $storeSize,
                );
                $stored[] = $this->mapAttachment($row);
            }
        } catch (\Throwable $e) {
            $this->deleteStoredFiles($paths);
            throw $e;
        } finally {
            foreach ($scratchFiles as $scratch) {
                if (is_string($scratch) && is_file($scratch)) {
                    @unlink($scratch);
                }
            }
        }
        $this->lastStoredPaths = $paths;

        return $stored;
    }

    /**
     * 직전 storeForMessage 호출이 디스크에 새로 쓴 상대경로. DB 롤백 시 호출자가 정리한다.
     *
     * @return list<string>
     */
    public function lastStoredPaths(): array
    {
        return $this->lastStoredPaths;
    }

    /**
     * 삭제 실패는 무시한다 — 롤백 경로에서 원래 예외를 가리면 안 된다.
     *
     * @param list<string> $paths
     */
    public function deleteStoredFiles(array $paths): void
    {
        foreach ($paths as $path) {
            try {
                $this->storage->delete($path);
            } catch (\Throwable) {
                // ignore
            }
        }
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
     * @return array{0: string, 1: string, 2: int}
     */
    private function readUploadedTmp(array $file): array
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

        $sizeBytes = (int) ($file['size'] ?? 0);
        $onDisk = @filesize($tmp);
        if (is_int($onDisk) && $onDisk > 0) {
            $sizeBytes = $onDisk;
        }

        return [$originalName, $tmp, $sizeBytes];
    }

    private function detectServerMime(string $tmp): string
    {
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo !== false) {
                $detected = finfo_file($finfo, $tmp);
                finfo_close($finfo);
                if (is_string($detected) && $detected !== '') {
                    return $this->normalizeMime($detected);
                }
            }
        }

        $detected = @mime_content_type($tmp);
        if (is_string($detected) && $detected !== '') {
            return $this->normalizeMime($detected);
        }

        throw new InvalidArgumentException('파일 형식을 확인할 수 없습니다.');
    }

    private function normalizeMime(string $mimeType): string
    {
        $mimeType = strtolower(trim($mimeType));
        if ($mimeType === 'image/jpg' || $mimeType === 'image/pjpeg') {
            return 'image/jpeg';
        }
        if ($mimeType === 'application/x-pdf') {
            return 'application/pdf';
        }

        return $mimeType;
    }

    private function extensionForMime(string $mimeType): string
    {
        return match ($mimeType) {
            'application/pdf' => 'pdf',
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            default => '',
        };
    }

    private function assertAllowedMime(string $mimeType, int $sizeBytes, string $tmp): void
    {
        $maxSize = $this->maxBytes();
        $onDisk = @filesize($tmp);
        if ($sizeBytes <= 0 || $sizeBytes > $maxSize || (is_int($onDisk) && $onDisk > $maxSize)) {
            throw new InvalidArgumentException('파일은 개당 5MB까지 첨부할 수 있습니다.');
        }

        /** @var list<string> $allowedMimes */
        $allowedMimes = $this->rules['allowed_mimes'] ?? [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
        ];
        $normalizedAllowed = [];
        foreach ($allowedMimes as $m) {
            if (!is_string($m) || $m === '') {
                continue;
            }
            $normalizedAllowed[] = $this->normalizeMime($m);
        }
        $normalizedAllowed = array_values(array_unique($normalizedAllowed));

        if (!in_array($mimeType, $normalizedAllowed, true) || $this->extensionForMime($mimeType) === '') {
            throw new InvalidArgumentException('PDF, JPG, PNG, WebP만 첨부할 수 있습니다.');
        }
    }

    private function assertPdfMagic(string $tmp): void
    {
        $fh = fopen($tmp, 'rb');
        if ($fh === false) {
            throw new InvalidArgumentException('PDF 파일을 읽을 수 없습니다.');
        }
        $head = fread($fh, 5);
        fclose($fh);
        if (!is_string($head) || !str_starts_with($head, '%PDF-')) {
            throw new InvalidArgumentException('올바른 PDF 파일이 아닙니다.');
        }
    }

    private function assertImageBounds(string $tmp): void
    {
        $info = @getimagesize($tmp);
        if ($info === false) {
            throw new InvalidArgumentException('이미지 파일을 읽을 수 없습니다.');
        }
        $width = (int) ($info[0] ?? 0);
        $height = (int) ($info[1] ?? 0);
        if ($width < 1 || $height < 1) {
            throw new InvalidArgumentException('이미지 크기를 확인할 수 없습니다.');
        }
        if (
            max($width, $height) > 12000
            || ($width > 0 && $height > intdiv(40_000_000, $width))
        ) {
            throw new InvalidArgumentException('사진이 너무 커요. 더 작은 사진을 올려 주세요.');
        }
    }

    /**
     * @return array{path: string, bytes: int, mime: string}
     */
    private function reencodeImage(string $tmp, string $mimeType): array
    {
        $raw = @file_get_contents($tmp);
        if ($raw === false || $raw === '') {
            throw new InvalidArgumentException('이미지 파일을 읽을 수 없습니다.');
        }
        $img = @imagecreatefromstring($raw);
        if ($img === false) {
            throw new InvalidArgumentException('지원하지 않는 이미지 형식입니다.');
        }

        $out = tempnam(sys_get_temp_dir(), 'msgatt');
        if ($out === false) {
            imagedestroy($img);
            throw new InvalidArgumentException('임시 파일을 만들 수 없습니다.');
        }

        $ok = false;
        $storeMime = $mimeType;
        try {
            if ($mimeType === 'image/png') {
                imagesavealpha($img, true);
                $ok = imagepng($img, $out, 6);
            } elseif ($mimeType === 'image/webp' && function_exists('imagewebp')) {
                $ok = imagewebp($img, $out, 85);
            } else {
                // jpeg 기본 · webp 미지원 시 jpeg로 저장
                $storeMime = 'image/jpeg';
                $ok = imagejpeg($img, $out, 88);
            }
        } finally {
            imagedestroy($img);
        }

        if (!$ok || !is_file($out)) {
            @unlink($out);
            throw new InvalidArgumentException('이미지를 저장하지 못했습니다.');
        }

        $bytes = (int) filesize($out);
        if ($bytes < 1) {
            @unlink($out);
            throw new InvalidArgumentException('이미지를 저장하지 못했습니다.');
        }
        if ($bytes > $this->maxBytes()) {
            @unlink($out);
            throw new InvalidArgumentException('파일은 개당 5MB까지 첨부할 수 있습니다.');
        }

        return ['path' => $out, 'bytes' => $bytes, 'mime' => $storeMime];
    }

    /**
     * 다운로드 제안 파일명. 확장자는 서버가 정한 MIME 확장자만 붙인다.
     * (예: shell.php 가 실제 JPG면 shell.jpg)
     */
    private function safeOriginalName(string $name, string $serverExt): string
    {
        $base = basename(str_replace('\\', '/', $name));
        $base = trim($base);
        if ($base === '') {
            $base = 'attachment';
        }

        $dot = strrpos($base, '.');
        if ($dot !== false && $dot > 0) {
            $base = substr($base, 0, $dot);
        }
        $base = trim($base);
        if ($base === '') {
            $base = 'attachment';
        }

        $serverExt = strtolower(preg_replace('/[^a-z0-9]/i', '', $serverExt) ?? '');
        if ($serverExt === '') {
            $serverExt = 'bin';
        }

        return mb_substr($base . '.' . $serverExt, 0, 180);
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
