<?php

declare(strict_types=1);

namespace Study114\QuickMatch;

use PDO;

/** 089 칸·표가 없으면 퀵매칭만 끈다. */
final class QuickMatchSchema
{
    public static function ready(PDO $pdo): bool
    {
        return self::hasColumn($pdo, 'study_rooms', 'director_age_band')
            && self::hasColumn($pdo, 'students', 'preferred_director_age_bands')
            && self::hasColumn($pdo, 'students', 'preferred_tutor_age_bands')
            && self::hasColumn($pdo, 'students', 'quick_match_prefs')
            && self::hasColumn($pdo, 'message_threads', 'thread_origin')
            && self::hasTable($pdo, 'quick_match_provider_settings')
            && self::hasTable($pdo, 'quick_match_dispatches')
            && self::hasTable($pdo, 'quick_match_student_runs');
    }

    public static function hasColumn(PDO $pdo, string $table, string $column): bool
    {
        $stmt = $pdo->prepare(
            'SELECT 1 FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1'
        );
        $stmt->execute([$table, $column]);

        return (bool) $stmt->fetchColumn();
    }

    public static function hasTable(PDO $pdo, string $table): bool
    {
        $stmt = $pdo->prepare(
            'SELECT 1 FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1'
        );
        $stmt->execute([$table]);

        return (bool) $stmt->fetchColumn();
    }
}
