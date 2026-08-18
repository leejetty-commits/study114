<?php

declare(strict_types=1);

namespace Study114\Media;

use InvalidArgumentException;
use PDO;
use RuntimeException;
use Study114\Database\Connection;

final class PromoImageService
{
    private PromoImageProcessor $processor;

    public function __construct(?PromoImageProcessor $processor = null)
    {
        $this->processor = $processor ?? new PromoImageProcessor();
    }

    /**
     * @param array<string, mixed> $file $_FILES entry
     * @return array<string, mixed>
     */
    public function uploadForRoom(int $userId, int $roomId, array $file, float $cropX, float $cropY, string $imageType, int $sortOrder, string $caption = ''): array
    {
        $pdo = Connection::get();
        $this->ensureColumns($pdo);
        $this->assertRoomOwner($pdo, $userId, $roomId);

        $countStmt = $pdo->prepare('SELECT sort_order FROM study_room_images WHERE study_room_id = ?');
        $countStmt->execute([$roomId]);
        $used = array_map('intval', $countStmt->fetchAll(PDO::FETCH_COLUMN));
        if (count($used) >= PromoImageSpec::MAX_COUNT) {
            throw new InvalidArgumentException('홍보사진은 최대 5장까지입니다.');
        }
        $sortOrder = 0;
        for ($slot = 1; $slot <= PromoImageSpec::MAX_COUNT; $slot++) {
            if (!in_array($slot, $used, true)) {
                $sortOrder = $slot;
                break;
            }
        }
        if ($sortOrder < 1) {
            throw new InvalidArgumentException('홍보사진은 최대 5장까지입니다.');
        }

        [$tmp, $origName, $size, $clientMime] = $this->parseFile($file);
        $token = bin2hex(random_bytes(8));
        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION)) ?: 'jpg';
        if ($ext === 'jpeg') {
            $ext = 'jpg';
        }
        $relDir = 'uploads/promo/rooms/' . $roomId;
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
        $dests = [];
        foreach (array_keys(PromoImageSpec::VARIANTS) as $variant) {
            $dests[$variant] = $this->publicRoot() . '/' . $relDir . '/' . $token . '_' . $variant . '.webp';
        }
        $this->processor->writeVariants($originalAbs, $cropX, $cropY, $dests);

        $paths = [];
        foreach ($dests as $variant => $abs) {
            $use = is_file($abs) ? $abs : preg_replace('/\.webp$/i', '.jpg', $abs);
            $paths[$variant] = $this->publicUrlFromAbs((string) $use);
        }
        $imageType = $this->normalizeType($imageType);
        $caption = $this->clipCaption($caption);

        $stmt = $pdo->prepare(
            'INSERT INTO study_room_images
                (study_room_id, image_type, image_path, sort_order, original_filename, caption,
                 original_path, prime_1280_path, prime_1600_path, basic_360_path, basic_720_path,
                 crop_offset_x, crop_offset_y, original_width, original_height, original_bytes, original_mime)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $coverPath = $paths['prime_1600'] ?? $paths['prime_1280'] ?? '/' . $originalRel;
        $stmt->execute([
            $roomId,
            $imageType,
            $coverPath,
            $sortOrder,
            $origName,
            $caption !== '' ? $caption : null,
            '/' . $originalRel,
            $paths['prime_1280'] ?? '',
            $paths['prime_1600'] ?? '',
            $paths['basic_360'] ?? '',
            $paths['basic_720'] ?? '',
            $cropX,
            $cropY,
            $info['width'],
            $info['height'],
            $size,
            $info['mime'],
        ]);

        return $this->mapRow([
            'id' => (int) $pdo->lastInsertId(),
            'image_type' => $imageType,
            'image_path' => $coverPath,
            'sort_order' => $sortOrder,
            'original_filename' => $origName,
            'caption' => $caption,
            'original_path' => '/' . $originalRel,
            'prime_1280_path' => $paths['prime_1280'] ?? '',
            'prime_1600_path' => $paths['prime_1600'] ?? '',
            'basic_360_path' => $paths['basic_360'] ?? '',
            'basic_720_path' => $paths['basic_720'] ?? '',
            'crop_offset_x' => $cropX,
            'crop_offset_y' => $cropY,
        ]);
    }

    /** @return array<string, mixed> */
    public function recrop(int $userId, int $roomId, int $imageId, float $cropX, float $cropY): array
    {
        $pdo = Connection::get();
        $this->ensureColumns($pdo);
        $this->assertRoomOwner($pdo, $userId, $roomId);
        $row = $this->findImage($pdo, $roomId, $imageId);
        $origRel = ltrim((string) ($row['original_path'] ?? ''), '/');
        $origAbs = $this->publicRoot() . '/' . $origRel;
        if ($origRel === '' || !is_file($origAbs)) {
            throw new InvalidArgumentException('원본 파일이 없어 위치를 다시 맞출 수 없습니다.');
        }
        $token = pathinfo($origRel, PATHINFO_FILENAME);
        $token = preg_replace('/_orig$/i', '', (string) $token) ?: bin2hex(random_bytes(6));
        $relDir = dirname($origRel);
        $dests = [];
        foreach (array_keys(PromoImageSpec::VARIANTS) as $variant) {
            $dests[$variant] = $this->publicRoot() . '/' . $relDir . '/' . $token . '_' . $variant . '.webp';
        }
        $this->processor->writeVariants($origAbs, $cropX, $cropY, $dests);
        $paths = [];
        foreach ($dests as $variant => $abs) {
            $paths[$variant] = $this->publicUrlFromAbs($abs);
        }
        $coverPath = $paths['prime_1600'] ?? $paths['prime_1280'] ?? (string) $row['image_path'];
        $pdo->prepare(
            'UPDATE study_room_images
                SET image_path = ?, prime_1280_path = ?, prime_1600_path = ?, basic_360_path = ?, basic_720_path = ?,
                    crop_offset_x = ?, crop_offset_y = ?
              WHERE id = ? AND study_room_id = ?'
        )->execute([
            $coverPath,
            $paths['prime_1280'] ?? '',
            $paths['prime_1600'] ?? '',
            $paths['basic_360'] ?? '',
            $paths['basic_720'] ?? '',
            $cropX,
            $cropY,
            $imageId,
            $roomId,
        ]);
        $row['image_path'] = $coverPath;
        $row['prime_1280_path'] = $paths['prime_1280'] ?? '';
        $row['prime_1600_path'] = $paths['prime_1600'] ?? '';
        $row['basic_360_path'] = $paths['basic_360'] ?? '';
        $row['basic_720_path'] = $paths['basic_720'] ?? '';
        $row['crop_offset_x'] = $cropX;
        $row['crop_offset_y'] = $cropY;

        return $this->mapRow($row);
    }

    /** @return array<string, mixed> */
    public function updateCaption(int $userId, int $roomId, int $imageId, string $caption): array
    {
        $pdo = Connection::get();
        $this->ensureColumns($pdo);
        $this->assertRoomOwner($pdo, $userId, $roomId);
        $this->findImage($pdo, $roomId, $imageId);
        $caption = $this->clipCaption($caption);
        $pdo->prepare(
            'UPDATE study_room_images SET caption = ? WHERE id = ? AND study_room_id = ?'
        )->execute([$caption !== '' ? $caption : null, $imageId, $roomId]);

        return $this->mapRow($this->findImage($pdo, $roomId, $imageId));
    }

    public function delete(int $userId, int $roomId, int $imageId): void
    {
        $pdo = Connection::get();
        $this->ensureColumns($pdo);
        $this->assertRoomOwner($pdo, $userId, $roomId);
        $row = $this->findImage($pdo, $roomId, $imageId);
        $pdo->prepare('DELETE FROM study_room_images WHERE id = ? AND study_room_id = ?')->execute([$imageId, $roomId]);
        foreach (['original_path', 'image_path', 'prime_1280_path', 'prime_1600_path', 'basic_360_path', 'basic_720_path'] as $key) {
            $rel = ltrim((string) ($row[$key] ?? ''), '/');
            if ($rel === '' || str_contains($rel, '..')) {
                continue;
            }
            $abs = $this->publicRoot() . '/' . $rel;
            if (is_file($abs)) {
                @unlink($abs);
            }
        }
    }

    public function ensureColumns(PDO $pdo): void
    {
        $cols = [
            'original_path' => "VARCHAR(500) NULL COMMENT '원본 경로'",
            'prime_1280_path' => "VARCHAR(500) NULL COMMENT '프라임 1280x720'",
            'prime_1600_path' => "VARCHAR(500) NULL COMMENT '프라임 1600x900'",
            'basic_360_path' => "VARCHAR(500) NULL COMMENT '베이직 360x360'",
            'basic_720_path' => "VARCHAR(500) NULL COMMENT '베이직 720x720'",
            'crop_offset_x' => 'DECIMAL(6,4) NOT NULL DEFAULT 0.5000',
            'crop_offset_y' => 'DECIMAL(6,4) NOT NULL DEFAULT 0.5000',
            'original_width' => 'SMALLINT UNSIGNED NULL',
            'original_height' => 'SMALLINT UNSIGNED NULL',
            'original_bytes' => 'INT UNSIGNED NULL',
            'original_mime' => 'VARCHAR(40) NULL',
            'caption' => "VARCHAR(80) NULL COMMENT '홍보사진 한 줄 제목'",
        ];
        foreach ($cols as $name => $ddl) {
            $stmt = $pdo->prepare(
                'SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
            );
            $stmt->execute(['study_room_images', $name]);
            if ((int) $stmt->fetchColumn() > 0) {
                continue;
            }
            try {
                $pdo->exec('ALTER TABLE study_room_images ADD COLUMN ' . $name . ' ' . $ddl);
            } catch (\Throwable $e) {
                error_log('[promo-image] alter ' . $name . ': ' . $e->getMessage());
            }
        }
    }

    private function assertRoomOwner(PDO $pdo, int $userId, int $roomId): void
    {
        $stmt = $pdo->prepare(
            'SELECT 1 FROM study_rooms WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute([$roomId, $userId]);
        if (!$stmt->fetchColumn()) {
            throw new InvalidArgumentException('이 공부방의 사진을 수정할 권한이 없습니다.');
        }
    }

    /** @return array<string, mixed> */
    private function findImage(PDO $pdo, int $roomId, int $imageId): array
    {
        $stmt = $pdo->prepare('SELECT * FROM study_room_images WHERE id = ? AND study_room_id = ? LIMIT 1');
        $stmt->execute([$imageId, $roomId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            throw new InvalidArgumentException('사진을 찾을 수 없습니다.');
        }

        return $row;
    }

    /**
     * @param array<string, mixed> $file
     * @return array{0: string, 1: string, 2: int, 3: string}
     */
    private function parseFile(array $file): array
    {
        $err = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($err !== UPLOAD_ERR_OK) {
            throw new InvalidArgumentException('파일을 받지 못했습니다.');
        }
        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            throw new InvalidArgumentException('업로드 파일이 올바르지 않습니다.');
        }

        return [
            $tmp,
            (string) ($file['name'] ?? 'photo.jpg'),
            (int) ($file['size'] ?? 0),
            (string) ($file['type'] ?? ''),
        ];
    }

    private function normalizeType(string $type): string
    {
        return in_array($type, ['cover', 'interior', 'facility', 'other'], true) ? $type : 'cover';
    }

    private function clipCaption(string $caption): string
    {
        $caption = trim($caption);
        if ($caption === '') {
            return '';
        }
        if (function_exists('mb_substr')) {
            return (string) mb_substr($caption, 0, 80);
        }

        return substr($caption, 0, 80);
    }

    private function publicRoot(): string
    {
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

    /** @param array<string, mixed> $row */
    private function mapRow(array $row): array
    {
        return [
            'id' => (int) ($row['id'] ?? 0),
            'image_type' => (string) ($row['image_type'] ?? 'cover'),
            'sort_order' => (int) ($row['sort_order'] ?? 0),
            'name' => (string) ($row['original_filename'] ?? $row['image_path'] ?? ''),
            'original_filename' => (string) ($row['original_filename'] ?? ''),
            'caption' => (string) ($row['caption'] ?? ''),
            'image_path' => (string) ($row['image_path'] ?? ''),
            'original_path' => (string) ($row['original_path'] ?? ''),
            'prime_1280_path' => (string) ($row['prime_1280_path'] ?? ''),
            'prime_1600_path' => (string) ($row['prime_1600_path'] ?? ''),
            'basic_360_path' => (string) ($row['basic_360_path'] ?? ''),
            'basic_720_path' => (string) ($row['basic_720_path'] ?? ''),
            'crop_offset_x' => (float) ($row['crop_offset_x'] ?? 0.5),
            'crop_offset_y' => (float) ($row['crop_offset_y'] ?? 0.5),
        ];
    }
}
