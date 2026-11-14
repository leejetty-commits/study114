<?php

declare(strict_types=1);

namespace Study114\Database;

use PDO;
use PDOException;
use RuntimeException;

final class Connection
{
    private static ?PDO $pdo = null;

    public static function get(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $cfg = study114_config('database');
        $dsn = sprintf(
            '%s:host=%s;port=%d;dbname=%s;charset=%s',
            $cfg['driver'],
            $cfg['host'],
            (int) $cfg['port'],
            $cfg['database'],
            $cfg['charset']
        );

        try {
            self::$pdo = new PDO($dsn, $cfg['username'], $cfg['password'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            throw new RuntimeException('DB connection failed: ' . $e->getMessage(), 0, $e);
        }

        return self::$pdo;
    }

    /**
     * 트랜잭션과 분리된 새 연결 (ops 로그 등 롤백에 묶이지 않아야 하는 기록용).
     */
    public static function openIndependent(): PDO
    {
        $cfg = study114_config('database');
        $dsn = sprintf(
            '%s:host=%s;port=%d;dbname=%s;charset=%s',
            $cfg['driver'],
            $cfg['host'],
            (int) $cfg['port'],
            $cfg['database'],
            $cfg['charset']
        );

        try {
            return new PDO($dsn, $cfg['username'], $cfg['password'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            throw new RuntimeException('DB independent connection failed: ' . $e->getMessage(), 0, $e);
        }
    }
}
