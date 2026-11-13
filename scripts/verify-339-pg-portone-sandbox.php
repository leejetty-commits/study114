<?php

declare(strict_types=1);

/**
 * 339 — 포트원 샌드박스 검증 (키 값 출력 금지).
 * 모의 PortOneApi 주입으로 위조·멱등·환불 취소·롤백·철회·1회권·팩 매칭을 검사한다.
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Paid\ImmediateMemoRepository;
use Study114\Paid\Pg\PgProvider;
use Study114\Paid\Pg\PortOneApi;
use Study114\Paid\Pg\PortOneCancelOpsLog;
use Study114\Paid\Pg\PortOneCheckout;
use Study114\Paid\ProviderCheckoutRepository;
use Study114\Paid\ProviderCheckoutService;
use Study114\Paid\ProviderTicketRepository;
use Study114\Paid\RefundRepository;
use Study114\Paid\RefundService;

$failed = 0;
$passed = 0;

function check(string $name, bool $ok, string $detail = ''): void
{
    global $failed, $passed;
    if ($ok) {
        $passed++;
        echo "OK  {$name}" . ($detail !== '' ? " — {$detail}" : '') . PHP_EOL;
    } else {
        $failed++;
        echo "FAIL {$name}" . ($detail !== '' ? " — {$detail}" : '') . PHP_EOL;
    }
}

final class MockPortOneApi implements PortOneApi
{
    /** @var array<string, array<string, mixed>> */
    public array $payments = [];
    /** @var list<array{paymentId: string, amount: int}> */
    public array $cancels = [];
    public ?string $failCancelPaymentId = null;
    public int $cancelCalls = 0;

    public function getPayment(string $paymentId): array
    {
        if (!isset($this->payments[$paymentId])) {
            throw new RuntimeException('not found');
        }

        return $this->payments[$paymentId];
    }

    public function cancelPayment(
        string $paymentId,
        int $amountWon,
        string $reason,
        ?int $currentCancellableAmount = null,
    ): array {
        $this->cancelCalls++;
        if ($this->failCancelPaymentId !== null && $this->failCancelPaymentId === $paymentId) {
            throw new RuntimeException('mock cancel fail');
        }
        $this->cancels[] = ['paymentId' => $paymentId, 'amount' => $amountWon];
        $pay = $this->payments[$paymentId] ?? [
            'status' => 'PAID',
            'amount' => ['total' => $amountWon, 'currency' => 'KRW', 'cancelled' => 0],
        ];
        $total = (int) ($pay['amount']['total'] ?? $amountWon);
        $cancelled = (int) ($pay['amount']['cancelled'] ?? 0) + $amountWon;
        $this->payments[$paymentId] = [
            'status' => 'PAID',
            'amount' => [
                'total' => $total,
                'currency' => 'KRW',
                'cancelled' => $cancelled,
                'remainingPayment' => max(0, $total - $cancelled),
            ],
        ];

        return [
            'cancel_id' => 'cancel-mock-' . $this->cancelCalls,
            'cancelled_at' => date('c'),
            'cancel_amount_won' => $amountWon,
            'remaining_won' => max(0, $total - $cancelled),
            'raw' => [],
        ];
    }

    public function extractTotalAmount(array $payment): int
    {
        return (int) ($payment['amount']['total'] ?? 0);
    }

    public function extractCurrency(array $payment): string
    {
        return strtoupper((string) ($payment['amount']['currency'] ?? ''));
    }

    public function extractCancellableAmount(array $payment): int
    {
        if (isset($payment['amount']['remainingPayment'])) {
            return (int) $payment['amount']['remainingPayment'];
        }
        $total = (int) ($payment['amount']['total'] ?? 0);
        $cancelled = (int) ($payment['amount']['cancelled'] ?? 0);

        return max(0, $total - $cancelled);
    }
}

/* ── 기본 게이트 ── */
$prevPg = getenv('PG_PROVIDER');
putenv('PG_PROVIDER');
check('unset => dev_mock', PgProvider::id() === 'dev_mock');
putenv('PG_PROVIDER=portone_test');
check('portone_test => portone_test', PgProvider::id() === 'portone_test');

$pdo = Connection::get();
$hasPay = (bool) $pdo->query(
    "SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='provider_payment_orders' AND COLUMN_NAME='pg_payment_id'"
)->fetchColumn();
check('schema pg_payment_id', $hasPay);

$refundPhp = file_get_contents(dirname(__DIR__) . '/public/api/paid/refund.php') ?: '';
check('pg_partial_cancel removed from API', !str_contains($refundPhp, 'pg_partial_cancel'));
check('partial cancel CLI exists', is_file(dirname(__DIR__) . '/scripts/339-portone-partial-cancel-cli.php'));

$bootstrap = file_get_contents(dirname(__DIR__) . '/src/bootstrap.php') ?: '';
check('dotenv uses study114_env APP_ENV', str_contains($bootstrap, "study114_env('STUDY114_APP_ENV'"));
check('dotenv PG_/PORTONE_ only', str_contains($bootstrap, "str_starts_with(\$key, 'PG_')"));

/* ── 모의: 통화·금액·paymentId ── */
$mock = new MockPortOneApi();
$checkout = new PortOneCheckout($mock);
$mock->payments['pay_ok'] = [
    'status' => 'PAID',
    'amount' => ['total' => 1000, 'currency' => 'KRW'],
];
try {
    $checkout->assertPaidMatchesOrder([
        'pg_payment_id' => 'pay_ok',
        'amount_won' => 1000,
    ]);
    check('assertPaid KRW+amount ok', true);
} catch (Throwable $e) {
    check('assertPaid KRW+amount ok', false, $e->getMessage());
}

try {
    $checkout->assertPaidMatchesOrder([
        'pg_payment_id' => 'pay_ok',
        'amount_won' => 999,
    ]);
    check('forged amount rejected', false);
} catch (InvalidArgumentException $e) {
    check('forged amount rejected', true);
}

try {
    $checkout->assertPaidMatchesOrder([
        'pg_payment_id' => 'pay_ok',
        'amount_won' => 1000,
    ], 'pay_other');
    check('forged paymentId rejected', false);
} catch (InvalidArgumentException $e) {
    check('forged paymentId rejected', true);
}

$mock->payments['pay_empty_cur'] = [
    'status' => 'PAID',
    'amount' => ['total' => 1000, 'currency' => ''],
];
try {
    $checkout->assertPaidMatchesOrder([
        'pg_payment_id' => 'pay_empty_cur',
        'amount_won' => 1000,
    ]);
    check('empty currency rejected', false);
} catch (InvalidArgumentException $e) {
    check('empty currency rejected', true);
}

/* ── savePgCancelMeta 누적 ── */
$refunds = new RefundRepository($pdo);
$orders = new ProviderCheckoutRepository($pdo);
$userId = (int) ($pdo->query('SELECT id FROM users ORDER BY id ASC LIMIT 1')->fetchColumn() ?: 0);
check('has user for DB tests', $userId > 0);

if ($userId > 0 && $hasPay) {
    $orderRef = 'dev-339v-' . bin2hex(random_bytes(4));
    $payId = PortOneCheckout::makePaymentId($orderRef);
    $mock->payments[$payId] = [
        'status' => 'PAID',
        'amount' => ['total' => 5000, 'currency' => 'KRW', 'cancelled' => 0, 'remainingPayment' => 5000],
    ];

    $orders->insertPending(
        $userId,
        $orderRef,
        'memo_ticket',
        '5회권',
        'count',
        5000,
        'tutor',
        1,
        'test',
        5000,
        0,
        null,
        'portone_test',
        $payId,
    );
    // mark paid without fulfill for refund path tests that need paid status
    $pdo->prepare("UPDATE provider_payment_orders SET status='paid', paid_at=NOW() WHERE order_ref=?")
        ->execute([$orderRef]);

    $refunds->insert([
        'order_ref' => $orderRef,
        'user_id' => $userId,
        'product_kind' => 'count',
        'variant' => '5회권',
        'amount_won' => 5000,
        'table_won' => 5000,
        'refund_won' => 5000,
        'reason_code' => 'within7_used0',
        'reason_text' => json_encode(['frozen_remaining' => 0], JSON_UNESCAPED_UNICODE),
        'status' => 'requested',
    ]);
    $refunds->savePgCancelMeta($orderRef, 'cancel-a', date('c'), 2000, 3000);
    $refunds->savePgCancelMeta($orderRef, 'cancel-b', date('c'), 1000, 2000);
    $row = $refunds->findByOrderRef($orderRef);
    $reason = json_decode((string) ($row['reason_text'] ?? ''), true);
    $cancels = is_array($reason['pg_cancels'] ?? null) ? $reason['pg_cancels'] : [];
    check('pg_cancel_id keeps first', (string) ($row['pg_cancel_id'] ?? '') === 'cancel-a');
    check('pg_cancels accumulated', count($cancels) === 2);
    check('pg_cancel_amount cumulative', (int) ($row['pg_cancel_amount_won'] ?? 0) === 3000);

    /* 철회: refunded / pg_cancel_id 거절 */
    $svc = new RefundService($pdo, $refunds, $orders, null, null, null, new PortOneCheckout($mock));
    try {
        $svc->withdraw($userId, $orderRef, RefundService::WITHDRAW_CONFIRM_TEXT);
        check('withdraw blocked when pg_cancel_id', false);
    } catch (InvalidArgumentException $e) {
        check('withdraw blocked when pg_cancel_id', str_contains($e->getMessage(), '이미 환불이 완료'));
    }

    $refunds->markRefunded($orderRef);
    $pdo->prepare("UPDATE provider_payment_orders SET status='refunded' WHERE order_ref=?")->execute([$orderRef]);
    try {
        $svc->withdraw($userId, $orderRef, RefundService::WITHDRAW_CONFIRM_TEXT);
        check('withdraw blocked when refunded', false);
    } catch (InvalidArgumentException $e) {
        check('withdraw blocked when refunded', str_contains($e->getMessage(), '이미 환불이 완료'));
    }

    /* 노출상품 submit 전체 흐름: 배지 취소 중간 실패 → DB 전체 롤백 */
    $tutorRow = $pdo->query('SELECT id, user_id FROM tutors ORDER BY id ASC LIMIT 1')->fetch(PDO::FETCH_ASSOC);
    $tutorId = is_array($tutorRow) ? (int) $tutorRow['id'] : 0;
    $tutorUserId = is_array($tutorRow) ? (int) $tutorRow['user_id'] : 0;
    check('has tutor for position submit', $tutorId > 0 && $tutorUserId > 0);

    if ($tutorId > 0) {
        $posRef = 'dev-339p-' . bin2hex(random_bytes(4));
        $badgeRef = 'dev-339b-' . bin2hex(random_bytes(4));
        $posPay = PortOneCheckout::makePaymentId($posRef);
        $badgePay = PortOneCheckout::makePaymentId($badgeRef);
        $start = date('Y-m-d', strtotime('+3 days'));
        $endEx = date('Y-m-d', strtotime('+17 days'));
        $endsOn = date('Y-m-d', strtotime('+16 days'));
        $mock2 = new MockPortOneApi();
        $mock2->payments[$posPay] = [
            'status' => 'PAID',
            'amount' => ['total' => 10000, 'currency' => 'KRW', 'cancelled' => 0, 'remainingPayment' => 10000],
        ];
        $mock2->payments[$badgePay] = [
            'status' => 'PAID',
            'amount' => ['total' => 2000, 'currency' => 'KRW', 'cancelled' => 0, 'remainingPayment' => 2000],
        ];
        $mock2->failCancelPaymentId = $badgePay;

        $orders->insertPending($tutorUserId, $posRef, 'prime', '2주', 'position', 10000, 'tutor', $tutorId, 't', 10000, 0, [
            'started_on' => $start,
            'ends_on' => $endsOn,
            'end_exclusive_on' => $endEx,
            'grant_mode' => 'new',
        ], 'portone_test', $posPay);
        $orders->insertPending($tutorUserId, $badgeRef, 'hot', '2주', 'badge_addon', 2000, 'tutor', $tutorId, 't', 2000, 0, [
            'parent_order_ref' => $posRef,
            'started_on' => $start,
            'ends_on' => $endsOn,
            'end_exclusive_on' => $endEx,
            'grant_mode' => 'new',
        ], 'portone_test', $badgePay);
        $pdo->prepare("UPDATE provider_payment_orders SET status='paid', paid_at=NOW() WHERE order_ref IN (?,?)")
            ->execute([$posRef, $badgeRef]);

        $tickets = new ProviderTicketRepository($pdo);
        $axisStmt = $pdo->prepare('SELECT region_id FROM tutor_regions WHERE tutor_id=? LIMIT 1');
        $axisStmt->execute([$tutorId]);
        $axisCity = (int) ($axisStmt->fetchColumn() ?: 0);
        $axisSubj = (int) ($pdo->query('SELECT id FROM subject_masters ORDER BY id ASC LIMIT 1')->fetchColumn() ?: 0);
        check('tutor axis ids for position', $axisCity > 0 && $axisSubj > 0);
        $tickets->addPositionSubscription($tutorUserId, 'prime', [
            'duration_type' => 'day',
            'duration_value' => 14,
            'started_on' => $start,
            'end_exclusive_on' => $endEx,
            'period_days' => 14,
            'starts_at' => $start . ' 00:00:00',
            'ends_at' => $endEx . ' 00:00:00',
        ], 'payment', 'tutor', $tutorId, null, [
            'city_id' => $axisCity,
            'primary_subject_id' => $axisSubj,
        ]);

        $subBefore = (string) ($pdo->query(
            "SELECT end_exclusive_on FROM provider_position_subscriptions
             WHERE provider_type='tutor' AND provider_id={$tutorId} AND sku_code='prime'
             ORDER BY id DESC LIMIT 1"
        )->fetchColumn() ?: '');

        $opsBefore = (int) ($pdo->query('SELECT COUNT(*) FROM provider_pg_cancel_ops_log')->fetchColumn() ?: 0);
        $svcPos = new RefundService($pdo, new RefundRepository($pdo), $orders, $tickets, null, null, new PortOneCheckout($mock2));
        try {
            $svcPos->submit($tutorUserId, $posRef, ['reason_choice' => 'test', 'detail' => '']);
            check('position submit fails on badge cancel', false);
        } catch (RuntimeException $e) {
            check('position submit fails on badge cancel', str_contains($e->getMessage(), '고객센터'));
        }

        $refundPos = $pdo->prepare('SELECT COUNT(*) FROM provider_refund_requests WHERE order_ref IN (?,?)');
        $refundPos->execute([$posRef, $badgeRef]);
        check('position submit rollback no refund rows', (int) $refundPos->fetchColumn() === 0);

        $stPos = $pdo->prepare('SELECT status FROM provider_payment_orders WHERE order_ref=?');
        $stPos->execute([$posRef]);
        $stBadge = $pdo->prepare('SELECT status FROM provider_payment_orders WHERE order_ref=?');
        $stBadge->execute([$badgeRef]);
        check('position orders stay paid after rollback', $stPos->fetchColumn() === 'paid' && $stBadge->fetchColumn() === 'paid');

        $subAfter = (string) ($pdo->query(
            "SELECT end_exclusive_on FROM provider_position_subscriptions
             WHERE provider_type='tutor' AND provider_id={$tutorId} AND sku_code='prime'
             ORDER BY id DESC LIMIT 1"
        )->fetchColumn() ?: '');
        check('position subscription not frozen after rollback', $subBefore === $subAfter);

        check('main cancel before badge fail', count($mock2->cancels) === 1 && $mock2->cancels[0]['paymentId'] === $posPay);
        $opsAfter = (int) ($pdo->query('SELECT COUNT(*) FROM provider_pg_cancel_ops_log')->fetchColumn() ?: 0);
        check('orphan cancel persisted in ops log', $opsAfter > $opsBefore);
    }

    /* 취소 성공 후 savePgCancelMeta 실패 → ops 로그 남고 롤백 */
    if (PortOneCancelOpsLog::tableReady()) {
        $metaRef = 'dev-339m-' . bin2hex(random_bytes(4));
        $metaPay = PortOneCheckout::makePaymentId($metaRef);
        $mockMeta = new MockPortOneApi();
        $mockMeta->payments[$metaPay] = [
            'status' => 'PAID',
            'amount' => ['total' => 3000, 'currency' => 'KRW', 'cancelled' => 0, 'remainingPayment' => 3000],
        ];
        $orders->insertPending($userId, $metaRef, 'memo_ticket', '5회권', 'count', 3000, 'tutor', 1, 't', 3000, 0, null, 'portone_test', $metaPay);
        $pdo->prepare("UPDATE provider_payment_orders SET status='paid', paid_at=NOW() WHERE order_ref=?")->execute([$metaRef]);
        $pdo->prepare(
            "INSERT INTO provider_ticket_packs
             (user_id, provider_type, provider_id, ticket_type, pack_size, remaining, expires_at, source, source_order_ref)
             VALUES (?,?,?,?,?,?, DATE_ADD(NOW(), INTERVAL 180 DAY), 'payment', ?)"
        )->execute([$userId, 'tutor', 1, 'memo', 5, 5, $metaRef]);

        $failRepo = new class ($pdo) extends RefundRepository {
            public function savePgCancelMeta(
                string $orderRef,
                string $cancelId,
                ?string $cancelledAt,
                int $cancelAmountWon,
                int $remainingWon,
            ): bool {
                throw new RuntimeException('mock meta fail');
            }
        };
        $opsBeforeMeta = (int) $pdo->query('SELECT COUNT(*) FROM provider_pg_cancel_ops_log')->fetchColumn();
        $svcMeta = new RefundService($pdo, $failRepo, $orders, null, null, null, new PortOneCheckout($mockMeta));
        try {
            $svcMeta->submit($userId, $metaRef, ['reason_choice' => 'test']);
            check('meta fail aborts submit', false);
        } catch (RuntimeException $e) {
            check('meta fail aborts submit', str_contains($e->getMessage(), '고객센터'));
        }
        $opsAfterMeta = (int) $pdo->query('SELECT COUNT(*) FROM provider_pg_cancel_ops_log')->fetchColumn();
        check('meta fail still writes ops log once', $opsAfterMeta === $opsBeforeMeta + 1);
        $refundMeta = $pdo->prepare('SELECT COUNT(*) FROM provider_refund_requests WHERE order_ref=?');
        $refundMeta->execute([$metaRef]);
        check('meta fail rolls back refund row', (int) $refundMeta->fetchColumn() === 0);

        /* 취소 전부 성공 후 finalize 실패 → ops 1줄 · 환불 행 0 · 주문 paid */
        $finRef = 'dev-339f-' . bin2hex(random_bytes(4));
        $finPay = PortOneCheckout::makePaymentId($finRef);
        $mockFin = new MockPortOneApi();
        $mockFin->payments[$finPay] = [
            'status' => 'PAID',
            'amount' => ['total' => 3000, 'currency' => 'KRW', 'cancelled' => 0, 'remainingPayment' => 3000],
        ];
        $orders->insertPending($userId, $finRef, 'memo_ticket', '5회권', 'count', 3000, 'tutor', 1, 't', 3000, 0, null, 'portone_test', $finPay);
        $pdo->prepare("UPDATE provider_payment_orders SET status='paid', paid_at=NOW() WHERE order_ref=?")->execute([$finRef]);
        $pdo->prepare(
            "INSERT INTO provider_ticket_packs
             (user_id, provider_type, provider_id, ticket_type, pack_size, remaining, expires_at, source, source_order_ref)
             VALUES (?,?,?,?,?,?, DATE_ADD(NOW(), INTERVAL 180 DAY), 'payment', ?)"
        )->execute([$userId, 'tutor', 1, 'memo', 5, 5, $finRef]);

        $failFinalize = new class ($pdo) extends RefundRepository {
            public function markRefunded(string $orderRef): bool
            {
                throw new RuntimeException('mock finalize fail');
            }
        };
        $opsBeforeFin = (int) $pdo->query('SELECT COUNT(*) FROM provider_pg_cancel_ops_log')->fetchColumn();
        $svcFin = new RefundService($pdo, $failFinalize, $orders, null, null, null, new PortOneCheckout($mockFin));
        try {
            $svcFin->submit($userId, $finRef, ['reason_choice' => 'test']);
            check('finalize fail aborts submit', false);
        } catch (RuntimeException $e) {
            check('finalize fail aborts submit', str_contains($e->getMessage(), 'mock finalize fail'));
        }
        $opsAfterFin = (int) $pdo->query('SELECT COUNT(*) FROM provider_pg_cancel_ops_log')->fetchColumn();
        check('finalize fail ops log once', $opsAfterFin === $opsBeforeFin + 1);
        $noteFin = $pdo->prepare(
            'SELECT note FROM provider_pg_cancel_ops_log WHERE payment_id=? ORDER BY id DESC LIMIT 1'
        );
        $noteFin->execute([$finPay]);
        check('finalize fail note orphan_after_commit_fail', (string) $noteFin->fetchColumn() === 'orphan_after_commit_fail');
        $refundFin = $pdo->prepare('SELECT COUNT(*) FROM provider_refund_requests WHERE order_ref=?');
        $refundFin->execute([$finRef]);
        check('finalize fail rolls back refund row', (int) $refundFin->fetchColumn() === 0);
        $stFin = $pdo->prepare('SELECT status FROM provider_payment_orders WHERE order_ref=?');
        $stFin->execute([$finRef]);
        check('finalize fail order stays paid', (string) $stFin->fetchColumn() === 'paid');
    } else {
        echo "SKIP ops log table\n";
    }

    /* 1회권 sent 거절: buildCalcInput + calculator */
    $immRef = 'dev-339i-' . bin2hex(random_bytes(4));
    $imm = new ImmediateMemoRepository($pdo);
    if ($imm->tableReady()) {
        $orders->insertPending($userId, $immRef, 'memo_ticket', '1회', 'count', 1000, 'tutor', 1, 't', 1000, 0, null, 'dev_mock', null);
        $pdo->prepare("UPDATE provider_payment_orders SET status='paid', paid_at=NOW() WHERE order_ref=?")->execute([$immRef]);
        $imm->insertPending([
            'order_ref' => $immRef,
            'user_id' => $userId,
            'provider_type' => 'tutor',
            'provider_id' => 1,
            'student_id' => 1,
            'body' => 'hi',
        ]);
        $imm->markSent($immRef, 1);
        $svcImm = new RefundService($pdo, new RefundRepository($pdo), $orders, null, null, $imm, new PortOneCheckout($mock));
        $elig = $svcImm->checkEligibility($userId, $immRef);
        check('sent immediate not refundable', ($elig['eligible'] ?? true) === false && ($elig['reason_code'] ?? '') === 'sent');
    } else {
        echo "SKIP immediate memo table\n";
    }

    /* 팩: source_order_ref만 — 다른 주문 팩 미사용 */
    $packCol = (bool) $pdo->query(
        "SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='provider_ticket_packs' AND COLUMN_NAME='source_order_ref'"
    )->fetchColumn();
    if ($packCol) {
        $packOrder = 'dev-339k-' . bin2hex(random_bytes(4));
        $otherOrder = 'dev-339k2-' . bin2hex(random_bytes(4));
        $orders->insertPending($userId, $packOrder, 'memo_ticket', '5회권', 'count', 5000, 'tutor', 1, 't', 5000, 0, null, 'dev_mock', null);
        $orders->insertPending($userId, $otherOrder, 'memo_ticket', '5회권', 'count', 5000, 'tutor', 1, 't', 5000, 0, null, 'dev_mock', null);
        $pdo->prepare("UPDATE provider_payment_orders SET status='paid', paid_at=NOW() WHERE order_ref IN (?,?)")
            ->execute([$packOrder, $otherOrder]);
        // only otherOrder has a pack
        $pdo->prepare(
            "INSERT INTO provider_ticket_packs
             (user_id, provider_type, provider_id, ticket_type, pack_size, remaining, expires_at, source, source_order_ref)
             VALUES (?,?,?,?,?,?, DATE_ADD(NOW(), INTERVAL 180 DAY), 'paid_purchase', ?)"
        )->execute([$userId, 'tutor', 1, 'memo', 5, 5, $otherOrder]);
        $svcPack = new RefundService($pdo, new RefundRepository($pdo), $orders);
        $eligPack = $svcPack->checkEligibility($userId, $packOrder);
        check(
            'other order pack not used',
            ($eligPack['eligible'] ?? true) === false && ($eligPack['reason_code'] ?? '') === 'pack_not_found',
        );
    } else {
        echo "SKIP pack source_order_ref column\n";
    }

    /* 중복 complete — 팩 지급 횟수 실제 1회 */
    if ($tutorId > 0) {
        $dupRef = 'dev-339d-' . bin2hex(random_bytes(4));
        $dupPay = PortOneCheckout::makePaymentId($dupRef);
        $mockDup = new MockPortOneApi();
        $mockDup->payments[$dupPay] = [
            'status' => 'PAID',
            'amount' => ['total' => 5000, 'currency' => 'KRW'],
        ];
        // 활성 팩 전부 비워 complete 허용 (source 무관)
        $pdo->prepare(
            "UPDATE provider_ticket_packs SET remaining = 0, expires_at = DATE_SUB(NOW(), INTERVAL 1 DAY)
             WHERE provider_type='tutor' AND provider_id=? AND remaining > 0"
        )->execute([$tutorId]);

        $orders->insertPending(
            $tutorUserId,
            $dupRef,
            'memo_ticket',
            '5회권',
            'count',
            5000,
            'tutor',
            $tutorId,
            't',
            5000,
            0,
            null,
            'portone_test',
            $dupPay,
        );
        putenv('STUDY114_PAYMENTS_ENABLED=1');
        putenv('STUDY114_PAID_MOCK_COMPLETE=1');
        $ticketsDup = new ProviderTicketRepository($pdo);
        $checkoutSvc = new ProviderCheckoutService(
            $orders,
            $ticketsDup,
            null,
            $pdo,
            $imm,
            null,
            new PortOneCheckout($mockDup),
        );

        $countPacks = static function (string $ref) use ($pdo): int {
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM provider_ticket_packs WHERE source_order_ref = ?');
            $stmt->execute([$ref]);

            return (int) $stmt->fetchColumn();
        };

        $before = $countPacks($dupRef);
        $r1 = $checkoutSvc->completePortOneOrder($tutorUserId, $dupRef, $dupPay);
        $mid = $countPacks($dupRef);
        $r2 = $checkoutSvc->completePortOneOrder($tutorUserId, $dupRef, $dupPay);
        $after = $countPacks($dupRef);

        check('duplicate complete first grant', ($r1['fulfilled'] ?? false) === true && $mid === $before + 1);
        check('duplicate complete pack count stays 1', $after === $mid && $after === 1);
        check('duplicate complete second still paid', (string) (($orders->getByRef($dupRef)['status'] ?? '')) === 'paid');
        check('duplicate complete second fulfilled flag', ($r2['fulfilled'] ?? false) === true);
    } else {
        check('duplicate complete first grant', false, 'no tutor');
        check('duplicate complete pack count stays 1', false, 'no tutor');
    }
} else {
    echo "SKIP DB-backed behavior tests\n";
}

/* ── checkout.php complete 경로: ProviderCheckoutRepository(PDO) 생성자 회귀 ──
 * checkout.php 의 action=complete 분기는 new ProviderCheckoutRepository(Connection::get()) 를 쓴다.
 * 이 경로는 이전에 인자 없이 호출돼 Fatal Error 가 발생했고(166b9edf), 단위 테스트가 HTTP 엔드포인트를
 * 직접 요청하지 않아 잡히지 않았다. 아래 테스트로 생성자+getByRef 경로를 직접 검증한다.
 */
$repoFromPdo = new ProviderCheckoutRepository($pdo);
$ghostRef = 'verify-ghost-' . bin2hex(random_bytes(4));
check('checkout_complete: ProviderCheckoutRepository(PDO) 생성자+getByRef', $repoFromPdo->getByRef($ghostRef) === null);

if (is_string($prevPg) && $prevPg !== '') {
    putenv('PG_PROVIDER=' . $prevPg);
} else {
    putenv('PG_PROVIDER');
}

echo PHP_EOL . "passed={$passed} failed={$failed}" . PHP_EOL;
exit($failed > 0 ? 1 : 0);
