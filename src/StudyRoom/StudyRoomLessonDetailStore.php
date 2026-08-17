<?php

declare(strict_types=1);

namespace Study114\StudyRoom;

use PDO;
use Throwable;

/**
 * 공부방 상세정보 — 수업요일·지도스타일·가격 행을 DB에 저장/로드.
 * 스키마 043을 멱등 적용한다.
 */
final class StudyRoomLessonDetailStore
{
    public const EXTRA_MARK = 'lesson_extra';

    /** @var array<string, bool> */
    private static array $ready = [];

    public function ensureSchema(PDO $pdo): bool
    {
        $key = spl_object_hash($pdo);
        if (isset(self::$ready[$key])) {
            return self::$ready[$key];
        }
        try {
            $this->addColumn($pdo, 'study_rooms', 'lesson_extra_json', 'TEXT NULL');
            $this->addColumn($pdo, 'study_rooms', 'attendance_days', 'VARCHAR(32) NULL');
            $this->addColumn($pdo, 'study_rooms', 'lessons_per_week', 'SMALLINT UNSIGNED NULL');
            $this->addColumn($pdo, 'study_rooms', 'minutes_per_lesson', 'SMALLINT UNSIGNED NULL');
            $this->addColumn($pdo, 'study_rooms', 'lesson_note', 'TEXT NULL');
            $this->addColumn($pdo, 'study_rooms', 'teaching_style_ids', 'VARCHAR(255) NULL');
            $this->addColumn($pdo, 'study_rooms', 'teaching_style_note', 'VARCHAR(500) NULL');
            $pdo->exec(
                'CREATE TABLE IF NOT EXISTS study_room_price_items (
                  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                  study_room_id BIGINT UNSIGNED NOT NULL,
                  item_label    VARCHAR(255)    NOT NULL DEFAULT \'\',
                  monthly_fee   VARCHAR(100)    NOT NULL DEFAULT \'\',
                  fee_note      VARCHAR(255)    NOT NULL DEFAULT \'\',
                  sort_order    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
                  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  KEY idx_srpi_room (study_room_id, sort_order)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
            );
            self::$ready[$key] = true;
            return true;
        } catch (Throwable $e) {
            error_log('[study-room lesson-detail schema] ' . $e->getMessage());
            self::$ready[$key] = false;
            return false;
        }
    }

    /**
     * @param array<string, mixed> $extra
     */
    public function save(PDO $pdo, int $roomId, array $extra): bool
    {
        if (!$this->ensureSchema($pdo)) {
            return false;
        }

        $days = implode(',', array_values(array_map('strval', $extra['attendance_days'] ?? [])));
        $styleIds = implode(',', array_values(array_map('strval', $extra['teaching_style_ids'] ?? [])));
        $week = $this->toUnsignedOrNull($extra['lessons_per_week'] ?? '');
        $minutes = $this->toUnsignedOrNull($extra['minutes_per_lesson'] ?? '');
        $json = json_encode($extra, JSON_UNESCAPED_UNICODE);
        if (!is_string($json)) {
            $json = '{"_s114":"lesson_extra"}';
        }

        $sets = [];
        $params = [];
        foreach (
            [
                'lesson_extra_json' => $json,
                'attendance_days' => $days !== '' ? $days : null,
                'lessons_per_week' => $week,
                'minutes_per_lesson' => $minutes,
                'lesson_note' => $this->nullIfEmpty($extra['lesson_note'] ?? ''),
                'teaching_style_ids' => $styleIds !== '' ? $styleIds : null,
                'teaching_style_note' => $this->nullIfEmpty($extra['teaching_style_note'] ?? ''),
            ] as $col => $val
        ) {
            if (!$this->columnExists($pdo, 'study_rooms', $col)) {
                continue;
            }
            $sets[] = "{$col} = ?";
            $params[] = $val;
        }
        if ($sets !== []) {
            $params[] = $roomId;
            $pdo->prepare('UPDATE study_rooms SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);
        }

        $this->syncPriceItems($pdo, $roomId, is_array($extra['price_items'] ?? null) ? $extra['price_items'] : []);
        return true;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    public function load(PDO $pdo, int $roomId, array $row): array
    {
        $this->ensureSchema($pdo);

        $extra = $this->decodeJson((string) ($row['lesson_extra_json'] ?? ''));
        if ($extra === null) {
            $extra = $this->decodeJson((string) ($row['price_description'] ?? ''));
        }
        if ($extra === null) {
            $extra = [
                '_s114' => self::EXTRA_MARK,
                'attendance_days' => [],
                'lessons_per_week' => '',
                'minutes_per_lesson' => '',
                'lesson_note' => '',
                'teaching_style_ids' => [],
                'teaching_style_note' => '',
                'price_items' => [],
            ];
        }

        if (!empty($row['attendance_days'])) {
            $extra['attendance_days'] = array_values(array_filter(explode(',', (string) $row['attendance_days'])));
        }
        if (isset($row['lessons_per_week']) && $row['lessons_per_week'] !== null && $row['lessons_per_week'] !== '') {
            $extra['lessons_per_week'] = (string) $row['lessons_per_week'];
        }
        if (isset($row['minutes_per_lesson']) && $row['minutes_per_lesson'] !== null && $row['minutes_per_lesson'] !== '') {
            $extra['minutes_per_lesson'] = (string) $row['minutes_per_lesson'];
        }
        if (isset($row['lesson_note']) && $row['lesson_note'] !== null) {
            $extra['lesson_note'] = (string) $row['lesson_note'];
        }
        if (!empty($row['teaching_style_ids'])) {
            $extra['teaching_style_ids'] = array_values(array_filter(explode(',', (string) $row['teaching_style_ids'])));
        }
        if (isset($row['teaching_style_note']) && $row['teaching_style_note'] !== null) {
            $extra['teaching_style_note'] = (string) $row['teaching_style_note'];
        }

        $fromTable = $this->loadPriceItems($pdo, $roomId);
        if ($fromTable !== []) {
            $extra['price_items'] = $fromTable;
        }

        return $extra;
    }

    /** @return list<array{id: int, value: string, label: string}> */
    public function subjectMasters(PDO $pdo): array
    {
        try {
            $rows = $pdo->query(
                'SELECT id, subject_name FROM subject_masters
                 WHERE is_active = 1 AND parent_subject_id IS NULL
                 ORDER BY sort_order ASC, id ASC'
            )->fetchAll(PDO::FETCH_ASSOC);
        } catch (Throwable $e) {
            error_log('[study-room subjects] ' . $e->getMessage());
            return [];
        }
        $out = [];
        foreach ($rows as $row) {
            $name = trim((string) ($row['subject_name'] ?? ''));
            if ($name === '') {
                continue;
            }
            $out[] = [
                'id' => (int) $row['id'],
                'value' => $name,
                'label' => $name,
            ];
        }
        return $out;
    }

    /**
     * @param list<array<string, mixed>> $items
     */
    private function syncPriceItems(PDO $pdo, int $roomId, array $items): void
    {
        try {
            $pdo->prepare('DELETE FROM study_room_price_items WHERE study_room_id = ?')->execute([$roomId]);
        } catch (Throwable $e) {
            error_log('[study-room price-items delete] ' . $e->getMessage());
            return;
        }

        $stmt = $pdo->prepare(
            'INSERT INTO study_room_price_items
             (study_room_id, item_label, monthly_fee, fee_note, sort_order)
             VALUES (?, ?, ?, ?, ?)'
        );
        $order = 0;
        foreach ($items as $row) {
            if (!is_array($row)) {
                continue;
            }
            $item = trim((string) ($row['item'] ?? ''));
            $fee = trim((string) ($row['fee'] ?? ''));
            $note = trim((string) ($row['note'] ?? ''));
            if ($item === '' && $fee === '' && $note === '') {
                continue;
            }
            $stmt->execute([$roomId, $item, $fee, $note, $order]);
            $order++;
        }
    }

    /** @return list<array{item: string, fee: string, note: string}> */
    private function loadPriceItems(PDO $pdo, int $roomId): array
    {
        try {
            $stmt = $pdo->prepare(
                'SELECT item_label, monthly_fee, fee_note
                 FROM study_room_price_items
                 WHERE study_room_id = ?
                 ORDER BY sort_order ASC, id ASC'
            );
            $stmt->execute([$roomId]);
        } catch (Throwable) {
            return [];
        }
        $out = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $out[] = [
                'item' => (string) ($row['item_label'] ?? ''),
                'fee' => (string) ($row['monthly_fee'] ?? ''),
                'note' => (string) ($row['fee_note'] ?? ''),
            ];
        }
        return $out;
    }

    private function addColumn(PDO $pdo, string $table, string $column, string $ddl): void
    {
        if ($this->columnExists($pdo, $table, $column)) {
            return;
        }
        $pdo->exec("ALTER TABLE {$table} ADD COLUMN {$column} {$ddl}");
    }

    private function columnExists(PDO $pdo, string $table, string $column): bool
    {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
        );
        $stmt->execute([$table, $column]);
        return (int) $stmt->fetchColumn() > 0;
    }

    /** @return array<string, mixed>|null */
    private function decodeJson(string $raw): ?array
    {
        $text = trim($raw);
        if ($text === '' || $text[0] !== '{') {
            return null;
        }
        $parsed = json_decode($text, true);
        if (!is_array($parsed) || ($parsed['_s114'] ?? '') !== self::EXTRA_MARK) {
            return null;
        }
        return $parsed;
    }

    private function toUnsignedOrNull(mixed $v): ?int
    {
        if ($v === null || $v === '') {
            return null;
        }
        $n = (int) $v;
        return $n > 0 ? $n : null;
    }

    private function nullIfEmpty(mixed $v): ?string
    {
        $s = trim((string) $v);
        return $s === '' ? null : $s;
    }
}
