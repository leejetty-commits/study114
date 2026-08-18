<?php

declare(strict_types=1);

namespace Study114\StudyRoom;

use PDO;
use Throwable;

/**
 * 공부방 상세정보 — 수업요일·지도스타일·가격 행·수업 그룹을 DB에 저장/로드.
 * 스키마 043·050을 멱등 적용한다.
 */
final class StudyRoomLessonDetailStore
{
    public const EXTRA_MARK = 'lesson_extra';

    /** 1일 평균 수업시간: 3시간 초과 */
    public const MINUTES_OVER_180 = 999;

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
            $this->addColumn($pdo, 'study_rooms', 'monthly_fee_manwon', 'VARCHAR(32) NULL');
            $this->addColumn($pdo, 'study_rooms', 'card_payment_available', 'TINYINT(1) NULL');
            $this->addColumn($pdo, 'study_rooms', 'cash_receipt_available', 'TINYINT(1) NULL');
            $this->addColumn($pdo, 'study_rooms', 'correction_available', 'TINYINT(1) NULL');
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
            $pdo->exec(
                'CREATE TABLE IF NOT EXISTS study_room_classes (
                  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                  study_room_id   BIGINT UNSIGNED NOT NULL,
                  class_name      VARCHAR(255)    NOT NULL DEFAULT \'\',
                  school_level    VARCHAR(32)     NULL,
                  grade_band      VARCHAR(64)     NULL,
                  subject_name    VARCHAR(100)    NULL,
                  subject_custom  VARCHAR(100)    NULL,
                  attendance_days VARCHAR(32)     NULL,
                  lessons_per_week SMALLINT UNSIGNED NULL,
                  monthly_fee     VARCHAR(100)    NOT NULL DEFAULT \'\',
                  fee_note        VARCHAR(255)    NOT NULL DEFAULT \'\',
                  lesson_note     TEXT            NULL,
                  sort_order      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
                  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  KEY idx_src_room (study_room_id, sort_order)
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
        $week = $this->weeklyToDb($extra['lessons_per_week'] ?? '');
        $minutes = $this->minutesToDb($extra['minutes_per_lesson'] ?? '');
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
                'monthly_fee_manwon' => $this->nullIfEmpty($extra['monthly_fee_manwon'] ?? ''),
                'card_payment_available' => !empty($extra['card_payment_available']) ? 1 : 0,
                'cash_receipt_available' => !empty($extra['cash_receipt_available']) ? 1 : 0,
                'correction_available' => !empty($extra['correction_available']) ? 1 : 0,
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
        $this->syncClasses($pdo, $roomId, is_array($extra['classes'] ?? null) ? $extra['classes'] : []);
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
                'classes' => [],
                'monthly_fee_manwon' => '',
                'card_payment_available' => false,
                'cash_receipt_available' => false,
                'correction_available' => false,
            ];
        }

        if (!empty($row['attendance_days'])) {
            $extra['attendance_days'] = array_values(array_filter(explode(',', (string) $row['attendance_days'])));
        }
        if (isset($row['lessons_per_week']) && $row['lessons_per_week'] !== null && $row['lessons_per_week'] !== '') {
            $extra['lessons_per_week'] = (string) $row['lessons_per_week'];
        }
        if (isset($row['minutes_per_lesson']) && $row['minutes_per_lesson'] !== null && $row['minutes_per_lesson'] !== '') {
            $extra['minutes_per_lesson'] = $this->minutesFromDb($row['minutes_per_lesson']);
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
        if (isset($row['monthly_fee_manwon']) && $row['monthly_fee_manwon'] !== null && $row['monthly_fee_manwon'] !== '') {
            $extra['monthly_fee_manwon'] = (string) $row['monthly_fee_manwon'];
        } elseif (empty($extra['monthly_fee_manwon']) && isset($row['price_amount']) && $row['price_amount'] !== null) {
            $won = (int) $row['price_amount'];
            if ($won > 0) {
                $extra['monthly_fee_manwon'] = (string) (int) round($won / 10000);
            }
        }
        if (array_key_exists('card_payment_available', $row) && $row['card_payment_available'] !== null) {
            $extra['card_payment_available'] = (bool) $row['card_payment_available'];
        }
        if (array_key_exists('cash_receipt_available', $row) && $row['cash_receipt_available'] !== null) {
            $extra['cash_receipt_available'] = (bool) $row['cash_receipt_available'];
        }
        if (array_key_exists('correction_available', $row) && $row['correction_available'] !== null) {
            $extra['correction_available'] = (bool) $row['correction_available'];
        }

        $fromTable = $this->loadPriceItems($pdo, $roomId);
        if ($fromTable !== []) {
            $extra['price_items'] = $fromTable;
        }

        $classes = $this->loadClasses($pdo, $roomId);
        if ($classes !== []) {
            $extra['classes'] = $classes;
        } elseif (!is_array($extra['classes'] ?? null)) {
            $extra['classes'] = [];
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

    /**
     * @param list<array<string, mixed>> $items
     */
    private function syncClasses(PDO $pdo, int $roomId, array $items): void
    {
        try {
            $pdo->prepare('DELETE FROM study_room_classes WHERE study_room_id = ?')->execute([$roomId]);
        } catch (Throwable $e) {
            error_log('[study-room classes delete] ' . $e->getMessage());
            return;
        }

        $stmt = $pdo->prepare(
            'INSERT INTO study_room_classes
             (study_room_id, class_name, school_level, grade_band, subject_name, subject_custom,
              attendance_days, lessons_per_week, monthly_fee, fee_note, lesson_note, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $order = 0;
        foreach ($items as $row) {
            if (!is_array($row)) {
                continue;
            }
            $className = trim((string) ($row['class_name'] ?? ''));
            $schoolLevel = $this->nullIfEmpty($row['school_level'] ?? '');
            $gradeBand = $this->nullIfEmpty($row['grade_band'] ?? '');
            $subjectName = $this->nullIfEmpty($row['subject_name'] ?? '');
            $subjectCustom = $this->nullIfEmpty($row['subject_custom'] ?? '');
            $days = $this->daysToCsv($row['attendance_days'] ?? []);
            $week = $this->weeklyToDb($row['lessons_per_week'] ?? '');
            $fee = trim((string) ($row['monthly_fee'] ?? ''));
            $feeNote = trim((string) ($row['fee_note'] ?? ''));
            $note = $this->nullIfEmpty($row['lesson_note'] ?? '');
            if (
                $className === ''
                && $schoolLevel === null
                && $gradeBand === null
                && $subjectName === null
                && $subjectCustom === null
                && $days === null
                && $week === null
                && $fee === ''
                && $feeNote === ''
                && $note === null
            ) {
                continue;
            }
            $stmt->execute([
                $roomId,
                $className,
                $schoolLevel,
                $gradeBand,
                $subjectName,
                $subjectCustom,
                $days,
                $week,
                $fee,
                $feeNote,
                $note,
                $order,
            ]);
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

    /** @return list<array<string, mixed>> */
    public function loadClasses(PDO $pdo, int $roomId): array
    {
        try {
            $stmt = $pdo->prepare(
                'SELECT class_name, school_level, grade_band, subject_name, subject_custom,
                        attendance_days, lessons_per_week, monthly_fee, fee_note, lesson_note
                 FROM study_room_classes
                 WHERE study_room_id = ?
                 ORDER BY sort_order ASC, id ASC'
            );
            $stmt->execute([$roomId]);
        } catch (Throwable) {
            return [];
        }
        $out = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $daysRaw = trim((string) ($row['attendance_days'] ?? ''));
            $out[] = [
                'class_name' => (string) ($row['class_name'] ?? ''),
                'school_level' => (string) ($row['school_level'] ?? ''),
                'grade_band' => (string) ($row['grade_band'] ?? ''),
                'subject_name' => (string) ($row['subject_name'] ?? ''),
                'subject_custom' => (string) ($row['subject_custom'] ?? ''),
                'attendance_days' => $daysRaw === '' ? [] : array_values(array_filter(explode(',', $daysRaw))),
                'lessons_per_week' => $row['lessons_per_week'] !== null ? (string) $row['lessons_per_week'] : '',
                'monthly_fee' => (string) ($row['monthly_fee'] ?? ''),
                'fee_note' => (string) ($row['fee_note'] ?? ''),
                'lesson_note' => (string) ($row['lesson_note'] ?? ''),
            ];
        }
        return $out;
    }

    /**
     * @param list<array<string, mixed>> $subjects
     * @param list<array{item: string, fee: string, note: string}> $priceItems
     * @param array<string, mixed> $extra
     * @return list<array<string, mixed>>
     */
    public function hydrateClassesFromLegacy(array $subjects, array $priceItems, array $extra): array
    {
        if ($subjects === [] && $priceItems === []) {
            return [];
        }
        $count = max(count($subjects), count($priceItems), 1);
        $out = [];
        $roomDays = is_array($extra['attendance_days'] ?? null)
            ? array_values(array_map('strval', $extra['attendance_days']))
            : [];
        $roomWeek = (string) ($extra['lessons_per_week'] ?? '');
        $roomNote = (string) ($extra['lesson_note'] ?? '');
        for ($i = 0; $i < $count; $i++) {
            $sub = is_array($subjects[$i] ?? null) ? $subjects[$i] : [];
            $price = is_array($priceItems[$i] ?? null) ? $priceItems[$i] : [];
            $name = trim((string) ($sub['subject_name'] ?? ''));
            $custom = trim((string) ($sub['subject_custom'] ?? ''));
            $out[] = [
                'class_name' => trim((string) ($price['item'] ?? '')),
                'school_level' => (string) ($sub['school_level'] ?? ''),
                'grade_band' => (string) ($sub['grade_band'] ?? ''),
                'subject_name' => $name,
                'subject_custom' => $custom,
                'attendance_days' => $i === 0 ? $roomDays : [],
                'lessons_per_week' => $i === 0 ? $roomWeek : '',
                'monthly_fee' => (string) ($price['fee'] ?? ''),
                'fee_note' => (string) ($price['note'] ?? ''),
                'lesson_note' => $i === 0 ? $roomNote : '',
            ];
        }
        return $out;
    }

    private function minutesToDb(mixed $v): ?int
    {
        $s = trim((string) $v);
        if ($s === '' || $s === '0') {
            return null;
        }
        if ($s === 'over_180' || $s === (string) self::MINUTES_OVER_180) {
            return self::MINUTES_OVER_180;
        }
        $allowed = [30, 60, 90, 120, 150, 180];
        $n = (int) $s;
        return in_array($n, $allowed, true) ? $n : null;
    }

    private function minutesFromDb(mixed $v): string
    {
        $n = (int) $v;
        if ($n === self::MINUTES_OVER_180) {
            return 'over_180';
        }
        return $n > 0 ? (string) $n : '';
    }

    private function weeklyToDb(mixed $v): ?int
    {
        $n = (int) $v;
        return ($n >= 1 && $n <= 7) ? $n : null;
    }

    /** @param mixed $days */
    private function daysToCsv(mixed $days): ?string
    {
        if (!is_array($days)) {
            return $this->nullIfEmpty($days);
        }
        $allowed = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        $clean = [];
        foreach ($days as $d) {
            $key = (string) $d;
            if (in_array($key, $allowed, true)) {
                $clean[] = $key;
            }
        }
        return $clean === [] ? null : implode(',', $clean);
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

    private function nullIfEmpty(mixed $v): ?string
    {
        $s = trim((string) $v);
        return $s === '' ? null : $s;
    }
}
