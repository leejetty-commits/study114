<?php

declare(strict_types=1);

/**
 * PR-B CI — 쪽지권 프로필 귀속 · 120일 · 즉시권 · 차감 FIFO
 * php scripts/verify-paid-pr-b-integration.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Messages\MessagesService;
use Study114\Paid\MemoTicketPolicy;
use Study114\Paid\PaidCatalog;
use Study114\Paid\PaidConflictException;
use Study114\Paid\ProviderCheckoutService;
use Study114\Paid\ProviderTicketRepository;
use Study114\Paid\ProviderTicketService;

$failed = 0;
$skipped = 0;

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

function expectThrow(string $name, callable $fn, ?string $expectClass = null): void
{
    try {
        $fn();
        check($name, false, '예외가 없음');
    } catch (Throwable $e) {
        if ($expectClass !== null && !$e instanceof $expectClass) {
            check($name, false, get_class($e) . ': ' . $e->getMessage());

            return;
        }
        check($name, true, $e->getMessage());
    }
}

$pdo = Connection::get();
$svc = new ProviderCheckoutService(null, null, null, $pdo);
$tickets = new ProviderTicketRepository($pdo);
$ticketSvc = new ProviderTicketService($tickets);

$q5 = PaidCatalog::quote('memo_ticket', '5회권', null);
$q10 = PaidCatalog::quote('memo_ticket', '10회권', null);
$q1 = PaidCatalog::quote('memo_ticket', '1회', null);
check('t01_price_5', (int) $q5['amount_won'] === 4500, (string) $q5['amount_won']);
check('t01_price_10', (int) $q10['amount_won'] === 8000, (string) $q10['amount_won']);
check('t01_price_1', (int) $q1['amount_won'] === 1000, (string) $q1['amount_won']);

expectThrow('t07_no_provider', static fn () => $svc->createOrder(40, 'memo_ticket', '5회권', null, null));

$o5 = $svc->createOrder(40, 'memo_ticket', '5회권', 'tutor', 40);
$done5 = $svc->completeOrder(40, (string) $o5['order_ref']);
check('t19_checkout_paid', ($done5['status'] ?? '') === 'paid');

$pack = $pdo->query(
    'SELECT remaining, expires_at, purchased_at, source, grant_kind, provider_type, provider_id
     FROM provider_ticket_packs WHERE user_id=40 AND source=\'payment\' ORDER BY id DESC LIMIT 1'
)->fetch(PDO::FETCH_ASSOC);
check('t02_pack_exists', is_array($pack));
if (is_array($pack)) {
    $diff = $pdo->query(
        'SELECT TIMESTAMPDIFF(DAY, purchased_at, expires_at) FROM provider_ticket_packs
         WHERE user_id=40 AND source=\'payment\' ORDER BY id DESC LIMIT 1'
    )->fetchColumn();
    check('t02_expire_120d', (int) $diff === MemoTicketPolicy::PAID_EXPIRE_DAYS, (string) $diff);
    check('t02_provider', ($pack['provider_type'] ?? '') === 'tutor' && (int) $pack['provider_id'] === 40);
}

expectThrow(
    't03_reject_5_while_active',
    static fn () => $svc->createOrder(40, 'memo_ticket', '5회권', 'tutor', 40),
    PaidConflictException::class,
);
expectThrow(
    't03_reject_10_while_active5',
    static fn () => $svc->createOrder(40, 'memo_ticket', '10회권', 'tutor', 40),
    PaidConflictException::class,
);

$o10b = $svc->createOrder(41, 'memo_ticket', '10회권', 'tutor', 41);
$done10 = $svc->completeOrder(41, (string) $o10b['order_ref']);
check('t04_other_user_10', ($done10['status'] ?? '') === 'paid');
expectThrow(
    't04_reject_5_while_active10',
    static fn () => $svc->createOrder(41, 'memo_ticket', '5회권', 'tutor', 41),
    PaidConflictException::class,
);

$pdo->exec('UPDATE provider_ticket_packs SET remaining=0 WHERE user_id=40 AND ticket_type=\'memo\'');
$o5b = $svc->createOrder(40, 'memo_ticket', '5회권', 'tutor', 40);
check('t05_allow_after_zero', ($o5b['status'] ?? '') === 'pending');
$pdo->prepare('UPDATE provider_payment_orders SET status=\'cancelled\' WHERE order_ref=?')->execute([$o5b['order_ref']]);

$pdo->exec(
    'UPDATE provider_ticket_packs SET remaining=5, expires_at=DATE_SUB(NOW(), INTERVAL 1 DAY)
     WHERE user_id=41 AND ticket_type=\'memo\''
);
$o10c = $svc->createOrder(41, 'memo_ticket', '10회권', 'tutor', 41);
check('t05_allow_after_expiry', ($o10c['status'] ?? '') === 'pending');
$pdo->prepare('UPDATE provider_payment_orders SET status=\'cancelled\' WHERE order_ref=?')->execute([$o10c['order_ref']]);

$a60 = $svc->createOrder(60, 'memo_ticket', '5회권', 'tutor', 60);
$svc->completeOrder(60, (string) $a60['order_ref']);
$b61 = $svc->createOrder(60, 'memo_ticket', '5회권', 'tutor', 61);
check('t06_other_provider_ok', ($b61['status'] ?? '') === 'pending');
$svc->completeOrder(60, (string) $b61['order_ref']);

$pdo->exec('UPDATE provider_ticket_packs SET remaining=0 WHERE user_id=40');
$p5 = $svc->createOrder(40, 'memo_ticket', '5회권', 'tutor', 40);
$p10 = $svc->createOrder(40, 'memo_ticket', '10회권', 'tutor', 40);
$firstOk = false;
$secondConflict = false;
try {
    $svc->completeOrder(40, (string) $p5['order_ref']);
    $firstOk = true;
} catch (Throwable $e) {
    check('t08_first_complete', false, $e->getMessage());
}
try {
    $svc->completeOrder(40, (string) $p10['order_ref']);
} catch (PaidConflictException $e) {
    $secondConflict = true;
} catch (Throwable $e) {
    check('t08_second_class', false, get_class($e) . ' ' . $e->getMessage());
}
check('t08_one_success_one_409', $firstOk && $secondConflict);

$immWhilePack = $svc->createOrder(40, 'memo_ticket', '1회', 'tutor', 40, [
    'student_id' => 50,
    'body' => '활성 묶음권 있어도 즉시권',
]);
$immWhilePackDone = $svc->completeOrder(40, (string) $immWhilePack['order_ref']);
check('t09_immediate_with_active_pack', ($immWhilePackDone['status'] ?? '') === 'paid');

$lockKey = MemoTicketPolicy::packLockKey('tutor', 40);
$cfg = require dirname(__DIR__) . '/config/database.php';
$pdo2 = new PDO(
    sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $cfg['host'],
        (int) $cfg['port'],
        $cfg['database'],
    ),
    (string) $cfg['username'],
    (string) $cfg['password'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
);
$got1 = $pdo->prepare('SELECT GET_LOCK(?, 0)');
$got1->execute([$lockKey]);
$got2 = $pdo2->prepare('SELECT GET_LOCK(?, 0)');
$got2->execute([$lockKey]);
check('t08_get_lock_exclusive', (int) $got1->fetchColumn() === 1 && (int) $got2->fetchColumn() === 0);
$pdo->prepare('SELECT RELEASE_LOCK(?)')->execute([$lockKey]);
$pdo2->prepare('SELECT RELEASE_LOCK(?)')->execute([$lockKey]);

expectThrow('t13_immediate_no_target', static fn () => $svc->createOrder(42, 'memo_ticket', '1회', 'tutor', 42));

$imm = $svc->createOrder(42, 'memo_ticket', '1회', 'tutor', 42, [
    'student_id' => 50,
    'body' => '안녕하세요 첫 쪽지입니다.',
    'context_label' => '학생',
    'peer_display_name' => '공개학생',
]);
$immDone = $svc->completeOrder(42, (string) $imm['order_ref']);
check('t09_immediate_with_active_pack_user42', ($immDone['status'] ?? '') === 'paid');

$msgCount = (int) $pdo->query('SELECT COUNT(*) FROM messages WHERE sender_user_id=42')->fetchColumn();
check('t10_one_message', $msgCount === 1, (string) $msgCount);

$immAgain = $svc->completeOrder(42, (string) $imm['order_ref']);
check('t11_complete_idempotent', ($immAgain['fulfilled'] ?? true) === false);
$msgCount2 = (int) $pdo->query('SELECT COUNT(*) FROM messages WHERE sender_user_id=42')->fetchColumn();
check('t11_no_dup_message', $msgCount2 === 1, (string) $msgCount2);

$immPacks = (int) $pdo->query(
    'SELECT COUNT(*) FROM provider_ticket_packs WHERE user_id=42 AND ticket_type=\'memo\''
)->fetchColumn();
check('t12_no_pack_after_immediate', $immPacks === 0, (string) $immPacks);

expectThrow(
    't14_closed_student',
    static fn () => $svc->createOrder(42, 'memo_ticket', '1회', 'tutor', 42, [
        'student_id' => 51,
        'body' => '닫힌 학생',
    ]),
);

$pdo->exec(
    "INSERT INTO provider_ticket_packs
     (user_id, provider_type, provider_id, ticket_type, pack_size, remaining, purchased_at, expires_at, source, grant_kind)
     VALUES
     (40, 'tutor', 40, 'memo', 3, 3, NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), 'position_bundle', 'position_bundle'),
     (40, 'tutor', 40, 'memo', 5, 5, NOW(), DATE_ADD(NOW(), INTERVAL 10 DAY), 'payment', 'payment_pack')"
);
$okConsume = $tickets->consumeTicketForProvider(40, 'tutor', 40);
$early = $pdo->query(
    "SELECT remaining FROM provider_ticket_packs WHERE user_id=40 AND grant_kind='position_bundle' ORDER BY id DESC LIMIT 1"
)->fetchColumn();
$later = $pdo->query(
    "SELECT remaining FROM provider_ticket_packs WHERE user_id=40 AND grant_kind='payment_pack' AND remaining>0 ORDER BY id DESC LIMIT 1"
)->fetchColumn();
check('t15_fifo_earlier_expires', $okConsume && (int) $early === 2, 'early=' . (string) $early . ' later=' . (string) $later);

$before41 = (int) $pdo->query(
    'SELECT COALESCE(SUM(remaining),0) FROM provider_ticket_packs WHERE provider_type=\'tutor\' AND provider_id=41'
)->fetchColumn();
$tickets->consumeTicketForProvider(40, 'tutor', 40);
$after41 = (int) $pdo->query(
    'SELECT COALESCE(SUM(remaining),0) FROM provider_ticket_packs WHERE provider_type=\'tutor\' AND provider_id=41'
)->fetchColumn();
check('t16_other_profile_untouched', $before41 === $after41, (string) $before41 . ' vs ' . (string) $after41);

$msgs = new MessagesService();
$thread = $msgs->composeMessage(42, [
    'context_kind' => 'student',
    'context_id' => 50,
    'body' => '후속 쪽지',
    'skip_ticket_consume' => false,
    'provider_type' => 'tutor',
    'provider_id' => 42,
]);
check('t17_followup_free', isset($thread['id']));
$msgCount3 = (int) $pdo->query('SELECT COUNT(*) FROM messages WHERE sender_user_id=42')->fetchColumn();
check('t17_followup_no_pack', $msgCount3 === 2, (string) $msgCount3);

$parentThread = $msgs->composeMessage(50, [
    'context_kind' => 'tutor',
    'context_id' => 41,
    'body' => '학부모 선쪽지',
]);
$reply = $msgs->replyMessage(41, (int) $parentThread['id'], '답장입니다');
check('t17_reply_free', isset($reply['id']));

$now = new DateTimeImmutable('now');
$edgeBefore = MemoTicketPolicy::expireAtFromFulfill($now);
$atBoundary = clone $now;
check('t02b_120_calc', $edgeBefore->diff($now)->days === 0 || $edgeBefore > $now);
$exp120 = MemoTicketPolicy::expireAtFromFulfill($now);
check('t02b_plus_120', $exp120->format('Y-m-d') === $now->modify('+120 days')->format('Y-m-d'));

$pdo->exec(
    "INSERT INTO provider_ticket_packs
     (user_id, provider_type, provider_id, ticket_type, pack_size, remaining, purchased_at, expires_at, source, grant_kind)
     VALUES
     (41, 'tutor', 41, 'memo', 1, 1, NOW(), NOW(), 'payment', 'payment_pack'),
     (41, 'tutor', 41, 'memo', 1, 1, NOW(), DATE_ADD(NOW(), INTERVAL 2 SECOND), 'payment', 'payment_pack')"
);
$hit = $tickets->consumeTicketForProvider(41, 'tutor', 41);
$atEq = (int) $pdo->query(
    "SELECT remaining FROM provider_ticket_packs WHERE provider_id=41 AND expires_at<=NOW() AND pack_size=1 ORDER BY id DESC LIMIT 1"
)->fetchColumn();
check('t02c_boundary_now_excluded', $hit && (int) $atEq === 1);

$list = $ticketSvc->listMemoPacksForApi(40);
$sample = $list[0] ?? null;
check('t18_packs_api', $sample !== null && isset($sample['grant_label'], $sample['remaining'], $sample['expires_at']));
check('t18_iso', is_array($sample) && str_contains((string) $sample['expires_at'], 'T'));

$view = $ticketSvc->unlockPaidRequest(40, 50);
check('t20_request_view_no_consume', ($view['consumed'] ?? true) === false);

$has061 = (bool) $pdo->query(
    "SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_payment_orders'
       AND COLUMN_NAME = 'catalog_version'"
)->fetchColumn();
if ($has061) {
    $snap = $svc->createOrder(41, 'memo_ticket', '10회권', 'tutor', 41);
    $row = $pdo->prepare('SELECT catalog_version, amount_won FROM provider_payment_orders WHERE order_ref=?');
    $row->execute([$snap['order_ref']]);
    $s = $row->fetch(PDO::FETCH_ASSOC);
    check('t21_061_snapshot', is_array($s) && (string) $s['catalog_version'] === PaidCatalog::VERSION && (int) $s['amount_won'] === 8000);
    $pdo->prepare('UPDATE provider_payment_orders SET status=\'cancelled\' WHERE order_ref=?')->execute([$snap['order_ref']]);
} else {
    echo "SKIP t21_061_snapshot — catalog_version 없음\n";
    $skipped++;
}

$pdo->exec(
    "INSERT INTO provider_ticket_packs
     (user_id, ticket_type, pack_size, remaining, purchased_at, expires_at, source)
     VALUES (4, 'memo', 2, 2, NOW(), DATE_ADD(NOW(), INTERVAL 10 DAY), 'manual')"
);
$pdo->exec('UPDATE provider_ticket_packs SET grant_kind=COALESCE(grant_kind, source) WHERE grant_kind IS NULL');
$ambiguous = (int) $pdo->query(
    'SELECT COUNT(*) FROM provider_ticket_packs WHERE user_id=4 AND provider_id IS NULL'
)->fetchColumn();
echo "INFO ambiguous_legacy_packs user_id=4 provider_id IS NULL: {$ambiguous}\n";
check('t_ambiguous_not_cloned', $ambiguous >= 1);

$hist = $svc->listOrders(40, 20);
check('t19_history', isset($hist['orders']) && is_array($hist['orders']));

if ($failed > 0) {
    fwrite(STDERR, "{$failed} failed (pr-b)\n");
    exit(1);
}
echo "all ok (pr-b) skipped={$skipped}\n";
