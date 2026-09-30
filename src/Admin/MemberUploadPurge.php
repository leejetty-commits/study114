<?php

declare(strict_types=1);

namespace Study114\Admin;

/**
 * 회원 삭제 커밋 뒤에 호출한다.
 * public/uploads 안 파일만 지운다.
 */
final class MemberUploadPurge
{
    private string $publicDir;

    public function __construct(?string $publicDir = null)
    {
        $dir = $publicDir ?? dirname(__DIR__, 2) . '/public';
        $this->publicDir = rtrim(str_replace('\\', '/', $dir), '/');
    }

    /**
     * @param list<string> $paths
     * @param list<int> $roomIds
     * @param list<int> $tutorIds
     * @return array{skipped: int, failed: list<string>}
     */
    public function purge(array $paths, array $roomIds, array $tutorIds): array
    {
        $skipped = 0;
        $failed = [];
        $seen = [];
        foreach ($paths as $path) {
            $raw = trim((string) $path);
            if (isset($seen[$raw])) {
                continue;
            }
            $seen[$raw] = true;
            $result = $this->unlinkStoredPath($raw);
            if ($result === 'skip') {
                $skipped++;
            } elseif ($result === 'fail') {
                $failed[] = $raw;
            }
        }

        foreach ($roomIds as $roomId) {
            $this->removeCardDir('rooms', (int) $roomId, $failed);
        }
        foreach ($tutorIds as $tutorId) {
            $this->removeCardDir('tutors', (int) $tutorId, $failed);
        }

        return ['skipped' => $skipped, 'failed' => $failed];
    }

    private function unlinkStoredPath(string $raw): string
    {
        if ($raw === '' || $this->isExternal($raw) || $this->hasDotDot($raw)) {
            return 'skip';
        }

        $absolute = $this->absoluteFromStored($raw);
        if ($absolute === null) {
            return 'skip';
        }
        if (!is_file($absolute)) {
            return 'missing';
        }

        $root = realpath($this->publicDir . '/uploads');
        $resolved = realpath($absolute);
        if ($root === false || $resolved === false || !$this->isInside($resolved, $root) || !is_file($resolved)) {
            return 'skip';
        }

        return @unlink($resolved) ? 'ok' : 'fail';
    }

    /**
     * uploads/promo/rooms/{id}, uploads/promo/tutors/{id} 만.
     * 코드가 그 카드 사진만 넣는 폴더다.
     *
     * @param list<string> $failed
     */
    private function removeCardDir(string $kind, int $cardId, array &$failed): void
    {
        if ($cardId < 1 || !in_array($kind, ['rooms', 'tutors'], true)) {
            return;
        }
        $relative = 'uploads/promo/' . $kind . '/' . $cardId;
        $absolute = $this->publicDir . '/' . $relative;
        if (!is_dir($absolute)) {
            return;
        }
        $root = realpath($this->publicDir . '/uploads');
        $resolved = realpath($absolute);
        if ($root === false || $resolved === false || !$this->isInside($resolved, $root)) {
            return;
        }
        $this->removeTree($resolved, $root, $relative, $failed);
    }

    /**
     * @param list<string> $failed
     */
    private function removeTree(string $dir, string $uploadsRoot, string $label, array &$failed): void
    {
        $entries = scandir($dir);
        if ($entries === false) {
            $failed[] = $label;
            return;
        }
        foreach ($entries as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }
            $child = $dir . '/' . $entry;
            $childLabel = $label . '/' . $entry;
            if (is_link($child)) {
                $failed[] = $childLabel;
                continue;
            }
            if (is_dir($child)) {
                $resolved = realpath($child);
                if ($resolved === false || !$this->isInside($resolved, $uploadsRoot)) {
                    $failed[] = $childLabel;
                    continue;
                }
                $this->removeTree($resolved, $uploadsRoot, $childLabel, $failed);
                continue;
            }
            $resolved = realpath($child);
            if ($resolved === false || !$this->isInside($resolved, $uploadsRoot) || !is_file($resolved)) {
                $failed[] = $childLabel;
                continue;
            }
            if (!@unlink($resolved)) {
                $failed[] = $childLabel;
            }
        }
        if (is_dir($dir) && !@rmdir($dir)) {
            $left = scandir($dir);
            if ($left !== false && count($left) > 2) {
                $failed[] = $label;
            }
        }
    }

    private function absoluteFromStored(string $raw): ?string
    {
        $path = str_replace('\\', '/', $raw);
        $q = strpos($path, '?');
        if ($q !== false) {
            $path = substr($path, 0, $q);
        }
        if (str_starts_with($path, '/uploads/')) {
            return $this->publicDir . $path;
        }
        if (str_starts_with($path, 'uploads/')) {
            return $this->publicDir . '/' . $path;
        }

        return null;
    }

    private function isExternal(string $raw): bool
    {
        return (bool) preg_match('#^[a-z][a-z0-9+.-]*://#i', $raw);
    }

    private function hasDotDot(string $raw): bool
    {
        return (bool) preg_match('#(^|/|\\\\)\\.\\.(/|\\\\|$)#', str_replace('\\', '/', $raw));
    }

    private function isInside(string $path, string $root): bool
    {
        $path = rtrim(str_replace('\\', '/', $path), '/');
        $root = rtrim(str_replace('\\', '/', $root), '/');

        return $path !== $root && str_starts_with($path, $root . '/');
    }
}
