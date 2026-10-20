<?php

declare(strict_types=1);

/**
 * 274 — 플래그가 1이 아니면 completeOrder 가 주문·지급을 바꾸지 않는지 확인한다.
 * php scripts/verify-paid-complete-gate.php
 *
 * 거절 경로(트랜잭션 시작 전)는 SQLite 프로브로 항상 확인한다.
 * pending 유지·지급 행 수·플래그 1 완료는 config/database.php 의 MySQL 이 있을 때만 확인한다.
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Paid\PaidCheckoutGate;
use Study114\Paid\ProviderCheckoutService;

$failed = 0;

function check(string $name, bool $ok, string $detail = ''): void
{
    global $failed;
    if ($ok) {
        echo "OK  {$name}" . ($detail !== '' ? " — {$detail}" : '') . "\n";

        return;
    }
    $failed++;
    fwrite(STDERR, "FAIL {$name}" . ($detail !== '' ? " — {$detail}" : '') . "\n");
}

function setFlag(?string $value): void
{
    if ($value === null) {
        putenv('STUDY114_PAID_MOCK_COMPLETE');

        return;
    }
    putenv('STUDY114_PAID_MOCK_COMPLETE=' . $value);
}

/** @var array<string, string|null> $closed */
$closed = [
    'unset' => null,
    'zero' => '0',
    'true' => 'true',
    'empty' => '',
];

foreach ($closed as $label => $value) {
    setFlag($value);
    $seen = getenv('STUDY114_PAID_MOCK_COMPLETE');
    check('gate_closed_' . $label, PaidCheckoutGate::mockCompleteAllowed() === false, var_export($seen, true));
}
setFlag('1');
check('gate_open_1', PaidCheckoutGate::mockCompleteAllowed() === true);

final class GateProbePdo extends PDO
{
    public int $begins = 0;

    public function __construct()
    {
        parent::__construct('sqlite::memory:');
        $this->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    public function beginTransaction(): bool
    {
        $this->begins++;

        return parent::beginTransaction();
    }
}

try {
    $probe = new GateProbePdo();
    $probeSvc = new ProviderCheckoutService(null, null, null, $probe);
    foreach ($closed as $label => $value) {
        setFlag($value);
        $before = $probe->begins;
        try {
            $probeSvc->completeOrder(274, 'gate-closed-' . $label);
            check('complete_rejected_' . $label, false, '예외가 없음');
        } catch (Throwable $e) {
            check(
                'complete_rejected_' . $label,
                $e->getMessage() === PaidCheckoutGate::CLOSED_MESSAGE && $probe->begins === $before,
                $e->getMessage(),
            );
        }
    }
} catch (Throwable $e) {
    echo "SKIP complete_rejected_probe — {$e->getMessage()}\n";
}

$tables = ['provider_position_subscriptions', 'provider_ticket_packs', 'provider_paid_badges'];

function tableCount(PDO $db, string $table): int
{
    return (int) $db->query('SELECT COUNT(*) FROM ' . $table)->fetchColumn();
}

setFlag(null);
try {
    $db = Connection::get();
} catch (Throwable $e) {
    fwrite(STDERR, "FAIL mysql_connect — {$e->getMessage()}\n");
    exit(1);
}

try {
    $beforeCounts = [];
    foreach ($tables as $table) {
        $beforeCounts[$table] = tableCount($db, $table);
    }
} catch (Throwable $e) {
    check('count_tables', false, $e->getMessage());
    exit(1);
}

$svc = new ProviderCheckoutService(null, null, null, $db);
try {
    $created = $svc->createOrder(274001, 'memo_ticket', '5회권', 'tutor', 274001);
} catch (Throwable $e) {
    check('create_pending', false, $e->getMessage());
    exit(1);
}
$ref = (string) ($created['order_ref'] ?? '');
check('create_pending', ($created['status'] ?? '') === 'pending' && $ref !== '', $ref);

foreach ($closed as $label => $value) {
    setFlag($value);
    $snap = [];
    foreach ($tables as $table) {
        $snap[$table] = tableCount($db, $table);
    }
    try {
        $svc->completeOrder(274001, $ref);
        check('db_rejected_' . $label, false, '예외가 없음');
    } catch (Throwable $e) {
        $statusStmt = $db->prepare('SELECT status FROM provider_payment_orders WHERE order_ref = ?');
        $statusStmt->execute([$ref]);
        $rowStatus = (string) $statusStmt->fetchColumn();
        $same = true;
        foreach ($tables as $table) {
            if (tableCount($db, $table) !== $snap[$table]) {
                $same = false;
            }
        }
        check(
            'db_rejected_' . $label,
            $e->getMessage() === PaidCheckoutGate::CLOSED_MESSAGE && $rowStatus === 'pending' && $same,
            $rowStatus . ' / ' . $e->getMessage(),
        );
    }
}

setFlag('1');
try {
    $done = $svc->completeOrder(274001, $ref);
    $packsAfter = tableCount($db, 'provider_ticket_packs');
    check(
        'flag_1_paid',
        ($done['status'] ?? '') === 'paid' && $packsAfter === $beforeCounts['provider_ticket_packs'] + 1,
        'status=' . (string) ($done['status'] ?? '') . ' packs ' . $beforeCounts['provider_ticket_packs'] . '→' . $packsAfter,
    );
} catch (Throwable $e) {
    check('flag_1_paid', false, $e->getMessage());
}

exit($failed > 0 ? 1 : 0);
