<?php

declare(strict_types=1);

namespace Study114\Board;

use InvalidArgumentException;
use RuntimeException;

/** 로컬 파일시스템 첨부 저장 (경로 추상화 1차) */
final class AttachmentStorage
{
    private string $root;

    public function __construct(?string $root = null)
    {
        $config = study114_config('storage');
        $this->root = rtrim($root ?? (string) $config['attachments_root'], '/\\');
        if (!is_dir($this->root) && !mkdir($this->root, 0775, true) && !is_dir($this->root)) {
            throw new RuntimeException('첨부 저장 경로를 만들 수 없습니다.');
        }
    }

    public function getRoot(): string
    {
        return $this->root;
    }

    /**
     * @param resource $stream
     */
    public function store(string $relativePath, $stream): void
    {
        $full = $this->resolveWritable($relativePath);
        $dir = dirname($full);
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new RuntimeException('첨부 디렉터리를 만들 수 없습니다.');
        }

        $dest = fopen($full, 'wb');
        if ($dest === false) {
            throw new RuntimeException('첨부 파일을 저장할 수 없습니다.');
        }
        stream_copy_to_stream($stream, $dest);
        fclose($dest);
    }

    public function absolutePath(string $relativePath): string
    {
        return $this->resolveReadable($relativePath);
    }

    public function delete(string $relativePath): void
    {
        $full = $this->absolutePath($relativePath);
        if (is_file($full)) {
            unlink($full);
        }
    }

    public function buildRelativePath(string $boardKey, string $postKey, string $storageFileName): string
    {
        $safeBoard = preg_replace('/[^a-z0-9_-]/i', '', $boardKey) ?: 'board';
        $safePost = preg_replace('/[^a-z0-9_-]/i', '', $postKey) ?: 'post';

        return $safeBoard . '/' . $safePost . '/' . $storageFileName;
    }

    private function resolveWritable(string $relativePath): string
    {
        $relativePath = str_replace('\\', '/', $relativePath);
        if ($relativePath === '' || str_contains($relativePath, '..')) {
            throw new InvalidArgumentException('유효하지 않은 저장 경로입니다.');
        }

        return $this->root . '/' . $relativePath;
    }

    private function resolveReadable(string $relativePath): string
    {
        $full = $this->resolveWritable($relativePath);
        $realRoot = realpath($this->root);
        $realFile = realpath($full);
        if ($realRoot === false || $realFile === false || !str_starts_with($realFile, $realRoot)) {
            throw new InvalidArgumentException('첨부 파일을 찾을 수 없습니다.');
        }

        return $realFile;
    }
}
