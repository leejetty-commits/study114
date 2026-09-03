<?php

declare(strict_types=1);

/**
 * PR-A — PaidCatalog SSOT 검증 (DB 불필요)
 * 사용: php scripts/verify-paid-catalog.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Paid\PaidCatalog;
use Study114\Paid\PositionPeriodCalculator;
use Study114\Paid\TutorPositionMemoBundle;

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

function expectQuote(string $product, string $variant, ?string $role, int $sale): void
{
    $q = PaidCatalog::quote($product, $variant, $role);
    check(
        "quote_{$role}_{$product}_{$variant}",
        (int) $q['amount_won'] === $sale && (int) $q['sale_price_krw'] === $sale,
        "got={$q['amount_won']} want={$sale}",
    );
}

// --- version / periods ---
check('catalog_version', PaidCatalog::version() === '2026-09-04.1');
check('periods_5', PaidCatalog::periods() === ['2주', '1개월', '2개월', '3개월', '6개월']);
check('calc_6m', PositionPeriodCalculator::VARIANT_MAP['6개월'] === ['month', 6]);

// --- position sale prices ---
$roomPrime = [30000, 50000, 90000, 127500, 240000];
$roomPick = [15000, 30000, 54000, 76500, 144000];
$tutorPrime = [18000, 30000, 57000, 81000, 153000];
$tutorPick = [10000, 20000, 38000, 54000, 102000];
$periods = PaidCatalog::PERIODS;

foreach ($periods as $i => $p) {
    expectQuote('prime', $p, 'study_room', $roomPrime[$i]);
    expectQuote('pick', $p, 'study_room', $roomPick[$i]);
    expectQuote('prime', $p, 'tutor', $tutorPrime[$i]);
    expectQuote('pick', $p, 'tutor', $tutorPick[$i]);
}

// --- badge sale prices ---
$roomBadge = [2500, 5000, 9000, 12750, 24000];
$tutorBadge = [5000, 10000, 19000, 27000, 51000];
foreach ($periods as $i => $p) {
    expectQuote('hot', $p, 'study_room', $roomBadge[$i]);
    expectQuote('subject_track', $p, 'study_room', $roomBadge[$i]);
    expectQuote('hot', $p, 'tutor', $tutorBadge[$i]);
    expectQuote('jjokjipge', $p, 'tutor', $tutorBadge[$i]);
    expectQuote('sky', $p, 'tutor', $tutorBadge[$i]);
}

// --- discount reconstruction ---
$q = PaidCatalog::quote('prime', '2개월', 'study_room');
check('room_prime_2m_discount_rate', abs((float) $q['discount_rate'] - 0.10) < 0.0001);
check('room_prime_2m_list', (int) $q['list_price_krw'] === 100000);
check('room_prime_2m_discount_krw', (int) $q['discount_krw'] === 10000);

$q = PaidCatalog::quote('pick', '6개월', 'tutor');
check('tutor_pick_6m_rate', abs((float) $q['discount_rate'] - 0.15) < 0.0001);
check('tutor_pick_6m_list', (int) $q['list_price_krw'] === 120000);

// --- tutor memo bundle ---
$primeBundle = [2, 5, 10, 15, 30];
$pickBundle = [1, 2, 4, 6, 12];
foreach ($periods as $i => $p) {
    check(
        "bundle_prime_{$p}",
        TutorPositionMemoBundle::memoCount('prime', $p, 'tutor') === $primeBundle[$i],
    );
    check(
        "bundle_pick_{$p}",
        TutorPositionMemoBundle::memoCount('pick', $p, 'tutor') === $pickBundle[$i],
    );
    check(
        "bundle_room_zero_{$p}",
        TutorPositionMemoBundle::memoCount('prime', $p, 'study_room') === 0,
    );
    $qq = PaidCatalog::quote('prime', $p, 'tutor');
    check("quote_bundle_prime_{$p}", (int) $qq['memo_bundle'] === $primeBundle[$i]);
}

// --- memo tickets ---
expectQuote('memo_ticket', '1회', null, 1000);
expectQuote('memo_ticket', '5회권', null, 4500);
expectQuote('memo_ticket', '10회권', null, 8000);
$m1 = PaidCatalog::quote('memo_ticket', '1회', null);
check('memo_1_immediate', $m1['ticket_kind'] === 'immediate' && $m1['balance_stored'] === false);
$m5 = PaidCatalog::quote('memo_ticket', '5회권', null);
check('memo_5_pack_120', $m5['ticket_kind'] === 'pack' && (int) $m5['expire_days'] === 120 && $m5['balance_stored'] === true);

// --- rejected SKUs ---
$rejects = [
    ['memo_ticket', '20회권', null],
    ['memo_ticket', '20회', null],
    ['request_view', '1회', 'tutor'],
    ['prime', '3주', 'study_room'],
    ['prime', '1개월', null], // role required
    ['hot', '포지션종속', 'tutor'],
    ['unknown_sku', '1개월', 'tutor'],
    ['subject_track', '1개월', 'tutor'], // wrong role badge
];
foreach ($rejects as [$pid, $var, $role]) {
    $threw = false;
    try {
        PaidCatalog::quote($pid, $var, $role);
    } catch (InvalidArgumentException $e) {
        $threw = true;
    }
    check("reject_{$pid}_{$var}_" . ($role ?? 'null'), $threw);
}

// --- export shape ---
$export = PaidCatalog::export();
check('export_version', $export['catalog_version'] === PaidCatalog::VERSION);
check('export_has_products', count($export['products']) >= 10);
check('export_removed_20', in_array('20회권', $export['removed_skus'], true));

$memoProduct = null;
foreach ($export['products'] as $p) {
    if ($p['product_code'] === 'memo_ticket') {
        $memoProduct = $p;
        break;
    }
}
check('export_memo_no_20', $memoProduct !== null && count($memoProduct['options']) === 3);

$badgeHot = null;
foreach ($export['products'] as $p) {
    if ($p['product_code'] === 'hot' && $p['provider_type'] === 'study_room') {
        $badgeHot = $p;
        break;
    }
}
check('badge_period_inherited', $badgeHot !== null && $badgeHot['period_inherited'] === true);
check('badge_options_5', $badgeHot !== null && count($badgeHot['options']) === 5);

// client amount tampering: quote ignores anything outside signature
$qA = PaidCatalog::quote('pick', '1개월', 'study_room');
$qB = PaidCatalog::quote('pick', '1개월', 'study_room');
check('quote_deterministic', $qA['amount_won'] === $qB['amount_won'] && $qA['amount_won'] === 30000);

if ($failed > 0) {
    fwrite(STDERR, "{$failed} failed\n");
    exit(1);
}
echo "all ok ({$failed} failed)\n";
