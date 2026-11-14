<?php

declare(strict_types=1);

/**
 * H1 — 포트원 결제 후 지급 충돌이면 전액 자동취소.
 * 실포트원 호출 없음. SQLite 메모리. php scripts/verify-paid-conflict-auto-cancel.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Paid\PaidConflictException;
use Study114\Paid\Pg\PortOneApi;
use Study114\Paid\Pg\PortOneCheckout;
use Study114\Paid\ProviderCheckoutService;

putenv('STUDY114_PAYMENTS_ENABLED=1');
putenv('STUDY114_PAID_MOCK_COMPLETE=1');
$logFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'h1-auto-cancel-log.txt';
@unlink($logFile);
ini_set('error_log', $logFile);

$failed = 0;
$passed = 0;

function check(string $name, bool $ok, string $detail = ''): void
{
    global $failed, $passed;
    if ($ok) {
        $passed++;
        echo 'PASS ' . $name . ($detail !== '' ? ' — ' . $detail : '') . "\n";

        return;
    }
    $failed++;
    fwrite(STDERR, 'FAIL ' . $name . ($detail !== '' ? ' — ' . $detail : '') . "\n");
}

final class H1ProbePdo extends PDO
{
    public function __construct()
    {
        parent::__construct('sqlite::memory:');
        $this->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    }

    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        return parent::prepare($this->rewrite($query), $options);
    }

    public function exec(string $statement): int|false
    {
        return parent::exec($this->rewrite($statement));
    }

    private function rewrite(string $sql): string
    {
        if (stripos($sql, 'information_schema') !== false) {
            $marks = substr_count($sql, '?');
            if ($marks <= 0) {
                return 'SELECT 1';
            }
            $conds = [];
            for ($i = 0; $i < $marks; $i++) {
                $conds[] = '? IS NOT NULL';
            }

            return 'SELECT 1 WHERE ' . implode(' AND ', $conds);
        }
        $sql = preg_replace('/GET_LOCK\s*\(\s*\?\s*,\s*\d+\s*\)/i', '(CASE WHEN ? IS NOT NULL THEN 1 ELSE 0 END)', $sql) ?? $sql;
        $sql = preg_replace('/RELEASE_LOCK\s*\(\s*\?\s*\)/i', '(CASE WHEN ? IS NOT NULL THEN 1 ELSE 0 END)', $sql) ?? $sql;
        $sql = preg_replace('/\s+FOR\s+UPDATE\b/i', '', $sql) ?? $sql;
        $sql = preg_replace('/\bNOW\s*\(\s*\)/i', "datetime('now')", $sql) ?? $sql;
        $sql = preg_replace('/\bCURDATE\s*\(\s*\)/i', "date('now')", $sql) ?? $sql;
        $sql = preg_replace('/\bDATABASE\s*\(\s*\)/i', "''", $sql) ?? $sql;

        return $sql;
    }
}

final class H1FakePortOne implements PortOneApi
{
    public int $cancels = 0;
    public int $gets = 0;
    public bool $throwOnCancel = false;
    public ?int $lastAmount = null;
    public ?string $lastReason = null;
    /** @var array<string, int> */
    public array $amounts = [];

    public function getPayment(string $paymentId): array
    {
        $this->gets++;

        return [
            'status' => 'PAID',
            'amount' => [
                'total' => $this->amounts[$paymentId] ?? 0,
                'currency' => 'KRW',
            ],
        ];
    }

    public function cancelPayment(string $paymentId, int $amountWon, string $reason, ?int $currentCancellableAmount = null): array
    {
        if ($this->throwOnCancel) {
            throw new RuntimeException('cancel down');
        }
        $this->cancels++;
        $this->lastAmount = $amountWon;
        $this->lastReason = $reason;

        return [
            'cancel_id' => 'cancel_h1_' . $this->cancels,
            'cancelled_at' => null,
            'cancel_amount_won' => $amountWon,
            'remaining_won' => 0,
            'raw' => [],
        ];
    }

    public function extractTotalAmount(array $payment): int
    {
        $amount = $payment['amount'] ?? null;
        if (is_array($amount) && isset($amount['total'])) {
            return (int) $amount['total'];
        }

        return (int) ($payment['totalAmount'] ?? 0);
    }

    public function extractCurrency(array $payment): string
    {
        $amount = $payment['amount'] ?? null;
        if (is_array($amount) && isset($amount['currency'])) {
            return strtoupper((string) $amount['currency']);
        }

        return 'KRW';
    }

    public function extractCancellableAmount(array $payment): int
    {
        return $this->extractTotalAmount($payment);
    }
}

function boot(): array
{
    $pdo = new H1ProbePdo();
    $pdo->exec(
        'CREATE TABLE provider_payment_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            order_ref TEXT NOT NULL UNIQUE,
            product_id TEXT NOT NULL,
            variant_label TEXT NOT NULL,
            product_kind TEXT NOT NULL,
            provider_type TEXT,
            provider_id INTEGER,
            amount_won INTEGER NOT NULL,
            catalog_version TEXT,
            list_price_won INTEGER,
            discount_won INTEGER,
            price_snapshot_json TEXT,
            status TEXT NOT NULL,
            pg_provider TEXT NOT NULL,
            pg_payment_id TEXT,
            fulfillment_status TEXT,
            fulfillment_error TEXT,
            paid_at TEXT,
            created_at TEXT DEFAULT (datetime(\'now\'))
        )'
    );
    $pdo->exec(
        'CREATE TABLE provider_ticket_packs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            provider_type TEXT,
            provider_id INTEGER,
            ticket_type TEXT NOT NULL,
            pack_size INTEGER NOT NULL,
            remaining INTEGER NOT NULL,
            purchased_at TEXT,
            expires_at TEXT,
            source TEXT,
            source_order_ref TEXT,
            grant_kind TEXT
        )'
    );
    $pdo->exec(
        'CREATE TABLE study_rooms (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            deleted_at TEXT
        )'
    );
    $pdo->exec(
        'CREATE TABLE study_room_regions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            study_room_id INTEGER NOT NULL,
            region_id INTEGER,
            complex_id INTEGER
        )'
    );
    $pdo->exec(
        'CREATE TABLE provider_position_subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            provider_type TEXT,
            provider_id INTEGER,
            sku_code TEXT,
            started_on TEXT,
            end_exclusive_on TEXT,
            duration_type TEXT,
            duration_value INTEGER,
            period_days INTEGER,
            region_basis_type TEXT,
            region_id INTEGER,
            complex_id INTEGER,
            slot_group TEXT,
            source TEXT
        )'
    );
    $fake = new H1FakePortOne();
    $service = new ProviderCheckoutService(
        null,
        null,
        null,
        $pdo,
        null,
        null,
        new PortOneCheckout($fake),
    );

    return [$pdo, $fake, $service];
}

function insertOrder(
    PDO $pdo,
    int $userId,
    string $orderRef,
    string $payId,
    string $status,
    string $pg,
    int $providerId,
    string $providerType = 'tutor',
    string $productId = 'memo_ticket',
    string $variant = '5회권',
    string $kind = 'count',
    int $amount = 2250,
    ?string $snapshot = null,
    ?string $fulfillment = null,
    ?string $fulfillmentError = null,
    ?string $paidAt = null,
): void {
    $stmt = $pdo->prepare(
        'INSERT INTO provider_payment_orders
         (user_id, order_ref, product_id, variant_label, product_kind, provider_type, provider_id,
          amount_won, status, pg_provider, pg_payment_id, price_snapshot_json,
          fulfillment_status, fulfillment_error, paid_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $userId,
        $orderRef,
        $productId,
        $variant,
        $kind,
        $providerType,
        $providerId,
        $amount,
        $status,
        $pg,
        $payId,
        $snapshot,
        $fulfillment,
        $fulfillmentError,
        $paidAt,
    ]);
}

function insertPack(PDO $pdo, int $userId, int $providerId, string $orderRef, string $providerType = 'tutor'): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO provider_ticket_packs
         (user_id, provider_type, provider_id, ticket_type, pack_size, remaining, purchased_at, expires_at, source, source_order_ref, grant_kind)
         VALUES (?, ?, ?, \'memo\', 5, 5, datetime(\'now\'), \'2099-01-01 00:00:00\', \'payment\', ?, \'payment_pack\')'
    );
    $stmt->execute([$userId, $providerType, $providerId, $orderRef]);
}

function orderStatus(PDO $pdo, string $orderRef): string
{
    $stmt = $pdo->prepare('SELECT status FROM provider_payment_orders WHERE order_ref = ?');
    $stmt->execute([$orderRef]);

    return (string) $stmt->fetchColumn();
}

function orderError(PDO $pdo, string $orderRef): string
{
    $stmt = $pdo->prepare('SELECT fulfillment_error FROM provider_payment_orders WHERE order_ref = ?');
    $stmt->execute([$orderRef]);
    $value = $stmt->fetchColumn();

    return $value === false || $value === null ? '' : (string) $value;
}

/** @var H1ProbePdo $pdo */
/** @var H1FakePortOne $fake */
/** @var ProviderCheckoutService $service */
[$pdo, $fake, $service] = boot();

$customer = ProviderCheckoutService::AUTO_CANCEL_CUSTOMER_MESSAGE;

// 1. 묶음권 두 건. 둘째는 자동취소.
$fake->amounts['pay_h1_a'] = 2250;
$fake->amounts['pay_h1_b'] = 2250;
insertOrder($pdo, 7, 'h1-pack-a', 'pay_h1_a', 'pending', 'portone_test', 70);
insertOrder($pdo, 7, 'h1-pack-b', 'pay_h1_b', 'pending', 'portone_test', 70);
$first = $service->completePortOneOrder(7, 'h1-pack-a', 'pay_h1_a');
check('1a first pack fulfills', ($first['fulfilled'] ?? false) === true && ($first['status'] ?? '') === 'paid' && $fake->cancels === 0, 'status=' . ($first['status'] ?? ''));
$second = $service->completePortOneOrder(7, 'h1-pack-b', 'pay_h1_b');
check(
    '1b second pack auto-cancels',
    ($second['auto_cancelled'] ?? false) === true
        && ($second['status'] ?? '') === 'cancelled'
        && ($second['fulfilled'] ?? true) === false
        && ($second['message'] ?? '') === $customer
        && $fake->cancels === 1
        && $fake->lastAmount === 2250
        && $fake->lastReason === '지급 불가 자동취소'
        && orderStatus($pdo, 'h1-pack-b') === 'cancelled'
        && str_starts_with(orderError($pdo, 'h1-pack-b'), 'auto_cancelled: pack_conflict'),
    'cancels=' . $fake->cancels . ' amount=' . (string) $fake->lastAmount,
);

// 2. 웹훅 재진입. 추가 취소·재조회 없음.
$gets = $fake->gets;
$cancels = $fake->cancels;
$again = $service->completePortOneByPaymentId('pay_h1_b');
check(
    '2 webhook replay',
    is_array($again)
        && ($again['auto_cancelled'] ?? false) === true
        && ($again['message'] ?? '') === $customer
        && $fake->cancels === $cancels
        && $fake->gets === $gets,
    'cancels=' . $fake->cancels . ' gets_delta=' . ($fake->gets - $gets),
);

// 6. 충돌 없음. 취소 0.
$before = $fake->cancels;
$fake->amounts['pay_h1_ok'] = 2250;
insertOrder($pdo, 8, 'h1-pack-ok', 'pay_h1_ok', 'pending', 'portone_test', 80);
$ok = $service->completePortOneOrder(8, 'h1-pack-ok', 'pay_h1_ok');
$packStmt = $pdo->prepare('SELECT COUNT(*) FROM provider_ticket_packs WHERE source_order_ref = ?');
$packStmt->execute(['h1-pack-ok']);
check(
    '6 no conflict',
    ($ok['fulfilled'] ?? false) === true
        && ($ok['auto_cancelled'] ?? false) === false
        && orderStatus($pdo, 'h1-pack-ok') === 'paid'
        && (int) $packStmt->fetchColumn() === 1
        && $fake->cancels === $before,
    'cancels_delta=' . ($fake->cancels - $before),
);

// 7. dev_mock 충돌은 예외. 취소하지 않음.
insertPack($pdo, 9, 90, 'h1-mock-existing');
insertOrder($pdo, 9, 'h1-mock', 'pay_h1_mock', 'pending', 'dev_mock', 90);
$mockThrew = false;
try {
    $service->completeOrder(9, 'h1-mock', false);
} catch (PaidConflictException) {
    $mockThrew = true;
}
check(
    '7 mock conflict does not cancel',
    $mockThrew && orderStatus($pdo, 'h1-mock') === 'pending' && $fake->cancels === $before,
    'status=' . orderStatus($pdo, 'h1-mock'),
);

// 4. 취소 API 실패. 주문은 pending 유지. 로그에 auto_cancel_failed.
@unlink($logFile);
$fake->throwOnCancel = true;
$fake->amounts['pay_h1_fail'] = 2250;
insertPack($pdo, 10, 100, 'h1-fail-existing');
insertOrder($pdo, 10, 'h1-fail', 'pay_h1_fail', 'pending', 'portone_test', 100);
$failThrew = false;
try {
    $service->completePortOneOrder(10, 'h1-fail', 'pay_h1_fail');
} catch (Throwable) {
    $failThrew = true;
}
$fake->throwOnCancel = false;
$log = is_file($logFile) ? (string) file_get_contents($logFile) : '';
check(
    '4 cancel failure keeps order',
    $failThrew
        && orderStatus($pdo, 'h1-fail') === 'pending'
        && str_contains($log, 'auto_cancel_failed')
        && str_contains($log, 'order_ref=h1-fail'),
    'status=' . orderStatus($pdo, 'h1-fail'),
);

// 5. 이미 paid 인데 이 주문 팩은 없고 다른 팩이 활성.
$paidAt = '2026-11-01 00:00:00';
$fake->amounts['pay_h1_paid'] = 2250;
insertPack($pdo, 11, 110, 'h1-paid-other');
insertOrder($pdo, 11, 'h1-paid-gap', 'pay_h1_paid', 'paid', 'portone_test', 110, 'tutor', 'memo_ticket', '5회권', 'count', 2250, null, 'pending', null, $paidAt);
$gap = $service->completePortOneOrder(11, 'h1-paid-gap', 'pay_h1_paid');
$paidAtStmt = $pdo->prepare('SELECT paid_at FROM provider_payment_orders WHERE order_ref = ?');
$paidAtStmt->execute(['h1-paid-gap']);
check(
    '5 paid without pack auto-cancels',
    ($gap['auto_cancelled'] ?? false) === true
        && orderStatus($pdo, 'h1-paid-gap') === 'cancelled'
        && str_starts_with(orderError($pdo, 'h1-paid-gap'), 'auto_cancelled: pack_not_granted')
        && (string) $paidAtStmt->fetchColumn() === $paidAt,
    'status=' . orderStatus($pdo, 'h1-paid-gap'),
);

// 3. Prime 자리 3석. 이 공부방 포지션은 늘지 않음.
$pdo->exec('INSERT INTO study_rooms (id, user_id, deleted_at) VALUES (120, 12, NULL)');
$pdo->exec('INSERT INTO study_room_regions (study_room_id, region_id, complex_id) VALUES (120, 55, NULL)');
for ($seat = 1; $seat <= 3; $seat++) {
    $roomId = 200 + $seat;
    $pdo->exec('INSERT INTO study_rooms (id, user_id, deleted_at) VALUES (' . $roomId . ', ' . (20 + $seat) . ', NULL)');
    $stmt = $pdo->prepare(
        'INSERT INTO provider_position_subscriptions
         (user_id, provider_type, provider_id, sku_code, started_on, end_exclusive_on, duration_type, duration_value, period_days, region_basis_type, region_id, complex_id, slot_group, source)
         VALUES (?, \'study_room\', ?, \'prime\', \'2020-01-01\', \'2099-01-01\', \'day\', 30, 30, \'dong\', 55, NULL, \'dong:55\', \'payment\')'
    );
    $stmt->execute([20 + $seat, $roomId]);
}
$snapshot = json_encode([
    'prime_region' => [
        'region_basis_type' => 'dong',
        'region_id' => 55,
        'complex_id' => null,
        'slot_group' => 'dong:55',
        'inventory_key' => 'dong:55',
    ],
], JSON_UNESCAPED_UNICODE);
$fake->amounts['pay_h1_prime'] = 10000;
insertOrder($pdo, 12, 'h1-prime', 'pay_h1_prime', 'pending', 'portone_test', 120, 'study_room', 'prime', '30일', 'position', 10000, $snapshot);
$primeCount = static function () use ($pdo): int {
    return (int) $pdo->query('SELECT COUNT(*) FROM provider_position_subscriptions WHERE provider_id = 120')->fetchColumn();
};
$beforePrime = $primeCount();
$prime = $service->completePortOneOrder(12, 'h1-prime', 'pay_h1_prime');
check(
    '3 prime full auto-cancels',
    $beforePrime === 0
        && $primeCount() === 0
        && ($prime['auto_cancelled'] ?? false) === true
        && ($prime['message'] ?? '') === $customer
        && orderStatus($pdo, 'h1-prime') === 'cancelled'
        && str_starts_with(orderError($pdo, 'h1-prime'), 'auto_cancelled: prime_full'),
    'positions=' . $primeCount(),
);

// 8. 구매이력: 자동취소만 보이고, pending·일반 취소는 숨김.
insertOrder($pdo, 13, 'h1-hist-auto', 'pay_h1_hist_auto', 'cancelled', 'portone_test', 130, 'tutor', 'memo_ticket', '5회권', 'count', 2250, null, 'failed', 'auto_cancelled: pack_conflict');
insertOrder($pdo, 13, 'h1-hist-pending', 'pay_h1_hist_pending', 'pending', 'portone_test', 130);
insertOrder($pdo, 13, 'h1-hist-plain', 'pay_h1_hist_plain', 'cancelled', 'portone_test', 130, 'tutor', 'memo_ticket', '5회권', 'count', 2250, null, 'failed', 'manual');
insertOrder($pdo, 13, 'h1-hist-paid', 'pay_h1_hist_paid', 'paid', 'portone_test', 130, 'tutor', 'memo_ticket', '5회권', 'count', 2250, null, 'succeeded', null, '2026-11-02 00:00:00');
$listed = $service->listOrders(13);
$refs = array_map(static fn (array $row): string => (string) ($row['order_ref'] ?? ''), $listed['orders'] ?? []);
sort($refs);
$expect = ['h1-hist-auto', 'h1-hist-paid'];
sort($expect);
$repoSource = (string) file_get_contents(dirname(__DIR__) . '/src/Paid/ProviderCheckoutRepository.php');
$keepsMysqlEscape = str_contains($repoSource, "LIKE 'auto\\\\_cancelled:%'");
$hidesOthers = !in_array('h1-hist-pending', $refs, true)
    && !in_array('h1-hist-plain', $refs, true)
    && in_array('h1-hist-paid', $refs, true);
if ($refs === $expect && $keepsMysqlEscape) {
    check('8 history lists auto-cancel only', true, 'refs=' . implode(',', $refs));
} else {
    // SQLite는 백슬래시를 LIKE 이스케이프로 보지 않는다. 운영 SQL은 MySQL 이스케이프를 유지한다.
    $plain = $pdo->prepare("SELECT order_ref FROM provider_payment_orders WHERE user_id = 13 AND fulfillment_error LIKE 'auto_cancelled:%'");
    $plain->execute();
    $plainRefs = $plain->fetchAll(PDO::FETCH_COLUMN);
    $escaped = $pdo->prepare("SELECT COUNT(*) FROM provider_payment_orders WHERE user_id = 13 AND fulfillment_error LIKE 'auto\\_cancelled:%'");
    $escaped->execute();
    check(
        '8 history lists auto-cancel only',
        $hidesOthers
            && $keepsMysqlEscape
            && !in_array('h1-hist-auto', $refs, true)
            && $plainRefs === ['h1-hist-auto']
            && (int) $escaped->fetchColumn() === 0,
        'sqlite keeps MySQL LIKE escape; driver does not treat backslash as escape',
    );
}

echo "RESULT pass={$passed} fail={$failed}\n";
exit($failed > 0 ? 1 : 0);
