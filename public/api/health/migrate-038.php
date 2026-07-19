<?php

declare(strict_types=1);

/**
 * 임시 엔드포인트 — 038 dual-capability admin 적용 후 삭제
 * GET ?confirm=apply-038
 */

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Admin\DualCapabilityAdminMigrateService;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$confirm = (string) ($_GET['confirm'] ?? '');
$svc = new DualCapabilityAdminMigrateService();

if ($confirm === 'apply-038') {
    echo json_encode(['ok' => true, 'migrate' => $svc->apply()], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

echo json_encode([
    'ok' => true,
    'hint' => 'Append ?confirm=apply-038 to apply',
    'status' => $svc->status(),
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
