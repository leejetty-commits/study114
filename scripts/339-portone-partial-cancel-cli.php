<?php

declare(strict_types=1);

/**
 * 339 — 로컬 CLI 2차 부분취소 (HTTP API 아님).
 *
 * 사용: php scripts/339-portone-partial-cancel-cli.php <order_ref> <amount_won>
 * 조건: PG_PROVIDER=portone_test 이고 STUDY114_APP_ENV≠production
 * 상한: 해당 주문 환불 행의 refund_won − 기존 취소액
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Paid\Pg\PgProvider;
use Study114\Paid\RefundService;

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "CLI only\n");
    exit(1);
}

if (PgProvider::id() !== PgProvider::PORTONE_TEST) {
    fwrite(STDERR, "PG_PROVIDER=portone_test required\n");
    exit(1);
}
if (strtolower(study114_env('STUDY114_APP_ENV', 'local')) === 'production') {
    fwrite(STDERR, "production forbidden\n");
    exit(1);
}

$orderRef = trim((string) ($argv[1] ?? ''));
$amountWon = (int) ($argv[2] ?? 0);
if ($orderRef === '' || $amountWon <= 0) {
    fwrite(STDERR, "usage: php scripts/339-portone-partial-cancel-cli.php <order_ref> <amount_won>\n");
    exit(1);
}

try {
    $result = (new RefundService())->cancelPortOneRemainingForCli($orderRef, $amountWon);
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, $e->getMessage() . PHP_EOL);
    exit(1);
}
