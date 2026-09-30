<?php

declare(strict_types=1);

/**
 * 이미 탈퇴(status=withdrawn)된 계정에 156-2c 정리를 적용한다.
 *
 * 기본은 조회만 하고 대상 수를 출력한다.
 *   php scripts/purge-withdrawn-accounts.php
 * 반영은 --apply 를 줬을 때만.
 *   php scripts/purge-withdrawn-accounts.php --apply
 */

require dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Auth\AccountWithdrawService;
use Study114\Database\Connection;

$apply = in_array('--apply', $argv ?? [], true);
$pdo = Connection::get();
$ids = $pdo->query("SELECT id FROM users WHERE status = 'withdrawn' ORDER BY id ASC")->fetchAll(PDO::FETCH_COLUMN);
$ids = array_map(static fn ($id): int => (int) $id, is_array($ids) ? $ids : []);

echo 'withdrawn=' . count($ids) . ($apply ? ' apply' : ' dry-run') . PHP_EOL;

if (!$apply) {
    exit(0);
}

$service = new AccountWithdrawService();
$done = 0;
$failed = 0;
foreach ($ids as $userId) {
    $pdo->beginTransaction();
    try {
        $service->purgeWithdrawnAccount($pdo, $userId);
        $pdo->commit();
        $done++;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        $failed++;
        fwrite(STDERR, "fail user_id={$userId} " . $e->getMessage() . PHP_EOL);
    }
}

echo "done={$done} failed={$failed}" . PHP_EOL;
exit($failed > 0 ? 1 : 0);
