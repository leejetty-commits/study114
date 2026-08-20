<?php

declare(strict_types=1);

namespace Study114\Media;

use PDO;

/**
 * 공부방 카드 기본 이미지 — 가입 시 자동 삽입, 상세1 실사진 업로드 시 교체.
 */
final class StudyRoomDefaultImageService
{
    public const BASIC_PATH = '/assets/brand/room-card-default-basic.svg';
    public const PICK_PATH = '/assets/brand/room-card-default-pick.svg';
    public const PRIME_PATH = '/assets/brand/room-card-default-prime.svg';
    public const MARKER_FILENAME = '__system_default__';

    public function ensureColumns(PDO $pdo): void
    {
        if (!$this->tableExists($pdo, 'study_room_images')) {
            return;
        }
        if (!$this->columnExists($pdo, 'study_room_images', 'is_system_default')) {
            $pdo->exec(
                "ALTER TABLE study_room_images
                 ADD COLUMN is_system_default TINYINT(1) NOT NULL DEFAULT 0
                 COMMENT '시스템 기본 카드 이미지' AFTER caption"
            );
        }
    }

    /** 실사진이 없으면 브랜드 기본 이미지를 sort_order=1 로 넣는다. */
    public function ensureDefaultForRoom(PDO $pdo, int $roomId): void
    {
        if ($roomId < 1 || !$this->tableExists($pdo, 'study_room_images')) {
            return;
        }
        $this->ensureColumns($pdo);

        $stmt = $pdo->prepare(
            'SELECT id, is_system_default FROM study_room_images WHERE study_room_id = ? ORDER BY sort_order ASC, id ASC'
        );
        $stmt->execute([$roomId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $row) {
            if (!(int) ($row['is_system_default'] ?? 0)) {
                return; // 실사진 있음
            }
        }
        if ($rows) {
            return; // 이미 기본 이미지만 있음
        }

        $hasImagePath = $this->columnExists($pdo, 'study_room_images', 'image_path');
        $hasVariants = $this->columnExists($pdo, 'study_room_images', 'prime_1600_path');
        $hasType = $this->columnExists($pdo, 'study_room_images', 'image_type');
        $hasCaption = $this->columnExists($pdo, 'study_room_images', 'caption');
        $hasSys = $this->columnExists($pdo, 'study_room_images', 'is_system_default');

        if ($hasImagePath && $hasVariants && $hasType && $hasSys) {
            $cols = 'study_room_id, image_type, image_path, sort_order, original_filename';
            $vals = '?, ?, ?, 1, ?';
            $params = [$roomId, 'cover', self::PRIME_PATH, self::MARKER_FILENAME];
            if ($hasCaption) {
                $cols .= ', caption';
                $vals .= ', ?';
                $params[] = '우동공과 기본 이미지';
            }
            $cols .= ', original_path, prime_1280_path, prime_1600_path, basic_360_path, basic_720_path, is_system_default';
            $vals .= ', ?, ?, ?, ?, ?, 1';
            $params[] = self::PRIME_PATH;
            $params[] = self::PICK_PATH;
            $params[] = self::PRIME_PATH;
            $params[] = self::BASIC_PATH;
            $params[] = self::BASIC_PATH;
            $pdo->prepare("INSERT INTO study_room_images ($cols) VALUES ($vals)")->execute($params);
            return;
        }

        // 레거시 스키마 최소 삽입
        if ($this->columnExists($pdo, 'study_room_images', 'storage_path')) {
            $pdo->prepare(
                'INSERT INTO study_room_images (study_room_id, sort_order, storage_path, original_filename)
                 VALUES (?, 1, ?, ?)'
            )->execute([$roomId, self::PRIME_PATH, self::MARKER_FILENAME]);
        }
    }

    /** 실사진 업로드 직전 — 시스템 기본 행만 있으면 제거해 슬롯을 비운다. */
    public function clearSystemDefaults(PDO $pdo, int $roomId): void
    {
        if ($roomId < 1 || !$this->tableExists($pdo, 'study_room_images')) {
            return;
        }
        $this->ensureColumns($pdo);
        if (!$this->columnExists($pdo, 'study_room_images', 'is_system_default')) {
            $pdo->prepare(
                'DELETE FROM study_room_images WHERE study_room_id = ? AND original_filename = ?'
            )->execute([$roomId, self::MARKER_FILENAME]);
            return;
        }
        $pdo->prepare(
            'DELETE FROM study_room_images WHERE study_room_id = ? AND is_system_default = 1'
        )->execute([$roomId]);
    }

    private function tableExists(PDO $pdo, string $table): bool
    {
        $stmt = $pdo->prepare(
            'SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1'
        );
        $stmt->execute([$table]);
        return (bool) $stmt->fetchColumn();
    }

    private function columnExists(PDO $pdo, string $table, string $column): bool
    {
        $stmt = $pdo->prepare(
            'SELECT 1 FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1'
        );
        $stmt->execute([$table, $column]);
        return (bool) $stmt->fetchColumn();
    }
}
