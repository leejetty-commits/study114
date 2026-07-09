<?php

declare(strict_types=1);

/**
 * ⚠️ 임시 DB 연결 테스트 — 확인 후 반드시 삭제하세요.
 * URL: /api/health/db.php
 * 삭제 대상: public/api/health/db.php (폴더가 비면 health/ 도 삭제)
 */

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'GET only'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $cfg = study114_config('database');
    $pdo = Study114\Database\Connection::get();
    $version = $pdo->query('SELECT VERSION()')->fetchColumn();
    $dbName = $pdo->query('SELECT DATABASE()')->fetchColumn();

    echo json_encode([
        'ok'        => true,
        'message'   => 'DB connection successful — 이 파일은 삭제하세요.',
        'database'  => $dbName,
        'version'   => $version,
        'host'      => $cfg['host'],
        'charset'   => $cfg['charset'],
        'checked_at'=> gmdate('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok'      => false,
        'message' => 'DB connection failed',
        'hint'    => 'config/database.php 호스트·DB명·비밀번호를 확인하세요.',
        'error'   => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
