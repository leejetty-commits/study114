<?php

declare(strict_types=1);

namespace Study114\Media;

use InvalidArgumentException;
use PDO;
use RuntimeException;
use Study114\Database\Connection;

/** 과외쌤 프로필 사진 — 최대 3장. 1번(sort_order 최소) = 대표(profile). */
final class TutorProfileImageService
{
    public const MAX_COUNT = 3;

    private PromoImageProcessor $processor;

    public function __construct(?PromoImageProcessor $processor = null)
    {
        $this->processor = $processor ?? new PromoImageProcessor();
    }

    /**
     * @param array<string, mixed> $file $_FILES entry
     * @return array<string, mixed>
     */
    public function upload(int $userId, int $tutorId, array $file, float $cropX, float $cropY): array
    {
        $pdo = Connection::get();
        $this->assertTutorOwner($pdo, $userId, $tutorId);

        $countStmt = $pdo->prepare('SELECT COUNT(*) FROM tutor_images WHERE tutor_id = ?');
        $countStmt->execute([$tutorId]);
        $count = (int) $countStmt->fetchColumn();
        if ($count >= self::MAX_COUNT) {
            throw new InvalidArgumentException('프로필 사진은 최대 3장까지입니다.');
        }

        $sortStmt = $pdo->prepare('SELECT COALESCE(MAX(sort_order), 0) FROM tutor_images WHERE tutor_id = ?');
        $sortStmt->execute([$tutorId]);
        $sortOrder = (int) $sortStmt->fetchColumn() + 1;

        [$tmp, $origName, $size, $clientMime] = $this->parseFile($file);
        $token = bin2hex(random_bytes(8));
        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION)) ?: 'jpg';
        if ($ext === 'jpeg') {
            $ext = 'jpg';
        }
        $relDir = 'uploads/tutor/' . $tutorId;
        $absDir = $this->publicRoot() . '/' . $relDir;
        if (!is_dir($absDir) && !mkdir($absDir, 0775, true) && !is_dir($absDir)) {
            throw new RuntimeException('사진 저장 폴더를 만들 수 없습니다.');
        }

        $originalRel = $relDir . '/' . $token . '_orig.' . $ext;
        $originalAbs = $this->publicRoot() . '/' . $originalRel;
        if (!@move_uploaded_file($tmp, $originalAbs) && !@rename($tmp, $originalAbs)) {
            if (!@copy($tmp, $originalAbs)) {
                throw new RuntimeException('원본 사진을 저장하지 못했습니다.');
            }
        }

        $info = $this->processor->assertUpload($originalAbs, $size, $origName, $clientMime);
        if ($info['width'] < 800 || $info['height'] < 800) {
            @unlink($originalAbs);
            throw new InvalidArgumentException('최소 800×800 픽셀 이상이어야 합니다.');
        }

        $dests = [
            'basic_720' => $this->publicRoot() . '/' . $relDir . '/' . $token . '_basic_720.webp',
            'prime_1280' => $this->publicRoot() . '/' . $relDir . '/' . $token . '_prime_1280.webp',
        ];
        $this->processor->writeVariants($originalAbs, $cropX, $cropY, $dests);

        $paths = [];
        foreach ($dests as $variant => $abs) {
            $use = is_file($abs) ? $abs : preg_replace('/\.webp$/i', '.jpg', $abs);
            $paths[$variant] = $this->publicUrlFromAbs((string) $use);
        }

        $basicPath = $paths['basic_720'] ?? ('/' . $originalRel);
        $imageType = $count === 0 ? 'profile' : 'intro';

        $stmt = $pdo->prepare(
            'INSERT INTO tutor_images (tutor_id, image_type, image_path, sort_order) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$tutorId, $imageType, $basicPath, $sortOrder]);
        $id = (int) $pdo->lastInsertId();

        return [
            'id' => $id,
            'image_type' => $imageType,
            'sort_order' => $sortOrder,
            'name' => $origName,
            'original_filename' => $origName,
            'image_path' => $basicPath,
            'basic_720_path' => $basicPath,
            'prime_1280_path' => $paths['prime_1280'] ?? $basicPath,
            'crop_offset_x' => $cropX,
            'crop_offset_y' => $cropY,
        ];
    }

    /**
     * @param list<int> $orderedIds
     * @return list<array<string, mixed>>
     */
    public function reorder(int $userId, int $tutorId, array $orderedIds): array
    {
        $pdo = Connection::get();
        $this->assertTutorOwner($pdo, $userId, $tutorId);
        $existing = $this->listImages($pdo, $tutorId);
        $byId = [];
        foreach ($existing as $row) {
            $byId[(int) $row['id']] = $row;
        }
        $ordered = [];
        foreach ($orderedIds as $id) {
            $id = (int) $id;
            if (!isset($byId[$id])) {
                continue;
            }
            $ordered[] = $byId[$id];
            unset($byId[$id]);
        }
        foreach ($byId as $row) {
            $ordered[] = $row;
        }
        $ordered = array_slice($ordered, 0, self::MAX_COUNT);
        $upd = $pdo->prepare('UPDATE tutor_images SET sort_order = ?, image_type = ? WHERE id = ? AND tutor_id = ?');
        foreach ($ordered as $i => $row) {
            $upd->execute([
                $i + 1,
                $i === 0 ? 'profile' : 'intro',
                (int) $row['id'],
                $tutorId,
            ]);
        }

        return $this->listMapped($pdo, $tutorId);
    }

    public function delete(int $userId, int $tutorId, int $imageId): void
    {
        $pdo = Connection::get();
        $this->assertTutorOwner($pdo, $userId, $tutorId);
        $stmt = $pdo->prepare('SELECT * FROM tutor_images WHERE id = ? AND tutor_id = ? LIMIT 1');
        $stmt->execute([$imageId, $tutorId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            throw new InvalidArgumentException('사진을 찾을 수 없습니다.');
        }
        $pdo->prepare('DELETE FROM tutor_images WHERE id = ? AND tutor_id = ?')->execute([$imageId, $tutorId]);
        $this->unlinkVariants((string) ($row['image_path'] ?? ''));
        $remaining = $this->listImages($pdo, $tutorId);
        $upd = $pdo->prepare('UPDATE tutor_images SET sort_order = ?, image_type = ? WHERE id = ? AND tutor_id = ?');
        foreach ($remaining as $i => $img) {
            $upd->execute([
                $i + 1,
                $i === 0 ? 'profile' : 'intro',
                (int) $img['id'],
                $tutorId,
            ]);
        }
    }

    /** @return list<array<string, mixed>> */
    public function listForTutor(int $userId, int $tutorId): array
    {
        $pdo = Connection::get();
        $this->assertTutorOwner($pdo, $userId, $tutorId);

        return $this->listMapped($pdo, $tutorId);
    }

    /** @return list<array<string, mixed>> */
    private function listImages(PDO $pdo, int $tutorId): array
    {
        $stmt = $pdo->prepare(
            'SELECT id, tutor_id, image_type, image_path, sort_order
             FROM tutor_images WHERE tutor_id = ? ORDER BY sort_order ASC, id ASC'
        );
        $stmt->execute([$tutorId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /** @return list<array<string, mixed>> */
    private function listMapped(PDO $pdo, int $tutorId): array
    {
        $out = [];
        foreach ($this->listImages($pdo, $tutorId) as $row) {
            $out[] = $this->mapRow($row);
        }

        return $out;
    }

    /** @param array<string, mixed> $row */
    private function mapRow(array $row): array
    {
        $basic = (string) ($row['image_path'] ?? '');
        $prime = $this->derivePrimePath($basic);

        return [
            'id' => (int) ($row['id'] ?? 0),
            'image_type' => (string) ($row['image_type'] ?? 'other'),
            'sort_order' => (int) ($row['sort_order'] ?? 0),
            'name' => basename($basic) ?: '',
            'original_filename' => basename($basic) ?: '',
            'image_path' => $basic,
            'basic_720_path' => $basic,
            'prime_1280_path' => $prime,
            'crop_offset_x' => 0.5,
            'crop_offset_y' => 0.5,
        ];
    }

    private function derivePrimePath(string $basicPath): string
    {
        if ($basicPath === '') {
            return '';
        }
        if (str_contains($basicPath, '_basic_720')) {
            return str_replace('_basic_720', '_prime_1280', $basicPath);
        }

        return $basicPath;
    }

    private function unlinkVariants(string $basicPath): void
    {
        $rel = ltrim($basicPath, '/');
        if ($rel === '' || str_contains($rel, '..')) {
            return;
        }
        $candidates = [$rel];
        if (str_contains($rel, '_basic_720')) {
            $candidates[] = str_replace('_basic_720', '_prime_1280', $rel);
            $candidates[] = preg_replace('/_basic_720\.(webp|jpg|jpeg|png)$/i', '_orig.$1', $rel) ?: '';
            $candidates[] = preg_replace('/_basic_720\.(webp|jpg|jpeg|png)$/i', '_orig.jpg', $rel) ?: '';
        }
        foreach ($candidates as $path) {
            if ($path === '') {
                continue;
            }
            $abs = $this->publicRoot() . '/' . ltrim($path, '/');
            if (is_file($abs)) {
                @unlink($abs);
            }
        }
    }

    private function assertTutorOwner(PDO $pdo, int $userId, int $tutorId): void
    {
        $stmt = $pdo->prepare(
            'SELECT 1 FROM tutors WHERE id = ? AND user_id = ? AND (deleted_at IS NULL OR deleted_at = \'0000-00-00 00:00:00\') LIMIT 1'
        );
        try {
            $stmt->execute([$tutorId, $userId]);
        } catch (\Throwable $e) {
            // deleted_at 없는 구스키마 호환
            $stmt = $pdo->prepare('SELECT 1 FROM tutors WHERE id = ? AND user_id = ? LIMIT 1');
            $stmt->execute([$tutorId, $userId]);
        }
        if (!$stmt->fetchColumn()) {
            throw new InvalidArgumentException('이 과외 프로필의 사진을 수정할 권한이 없습니다.');
        }
    }

    /**
     * @param array<string, mixed> $file
     * @return array{0: string, 1: string, 2: int, 3: string}
     */
    private function parseFile(array $file): array
    {
        $err = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($err !== UPLOAD_ERR_OK) {
            $hint = match ($err) {
                UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => '파일 용량이 서버 제한을 초과했습니다. 4MB 이하로 줄여 주세요.',
                UPLOAD_ERR_PARTIAL => '파일이 일부만 전송되었습니다. 다시 올려 주세요.',
                UPLOAD_ERR_NO_FILE => '파일을 선택해 주세요.',
                default => '파일을 받지 못했습니다. (코드 ' . $err . ')',
            };
            throw new InvalidArgumentException($hint);
        }
        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || (!is_uploaded_file($tmp) && !is_file($tmp))) {
            throw new InvalidArgumentException('업로드 파일이 올바르지 않습니다.');
        }

        return [
            $tmp,
            (string) ($file['name'] ?? 'photo.jpg'),
            (int) ($file['size'] ?? 0),
            (string) ($file['type'] ?? ''),
        ];
    }

    private function publicRoot(): string
    {
        $doc = (string) ($_SERVER['DOCUMENT_ROOT'] ?? '');
        if ($doc !== '' && is_dir($doc)) {
            return rtrim(str_replace('\\', '/', $doc), '/');
        }

        return dirname(__DIR__, 2) . '/public';
    }

    private function publicUrlFromAbs(string $abs): string
    {
        $root = str_replace('\\', '/', $this->publicRoot());
        $path = str_replace('\\', '/', $abs);
        if (str_starts_with($path, $root)) {
            return substr($path, strlen($root)) ?: '/';
        }

        return '/' . ltrim($path, '/');
    }
}
