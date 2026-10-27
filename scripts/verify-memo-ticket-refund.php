<?php

declare(strict_types=1);

/**
 * 324 — MemoTicketRefundCalculator verify (DB 불필요)
 * 사용: php scripts/verify-memo-ticket-refund.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Paid\MemoTicketRefundCalculator;
use Study114\Paid\PaidCatalog;

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

$tz = new DateTimeZone('Asia/Seoul');
$base = new DateTimeImmutable('2026-10-01 10:00:00', $tz);

function calc(array $in, DateTimeImmutable $now): array
{
    return MemoTicketRefundCalculator::calculate($in, $now);
}

function paidInput(string $variant, string $paidAt, int $amountWon, array $extra = []): array
{
    return array_merge([
        'variant' => $variant,
        'order_status' => 'paid',
        'amount_won' => $amountWon,
        'paid_at' => $paidAt,
    ], $extra);
}

// ── 1회권 ──────────────────────────────────────────

// day0 pending(미발송) → 500
$r = calc(paidInput('1회', $base->format('Y-m-d H:i:s'), 500, ['dispatch_status' => 'pending']), $base);
check('imm_day0_pending', $r['refundable'] && $r['refund_won'] === 500 && $r['reason_code'] === 'within7_used0', "got={$r['refund_won']} reason={$r['reason_code']}");

// day6 failed(미발송) → 500
$day6 = $base->modify('+6 days');
$r = calc(paidInput('1회', $base->format('Y-m-d H:i:s'), 500, ['dispatch_status' => 'failed']), $day6);
check('imm_day6_failed', $r['refundable'] && $r['refund_won'] === 500, "got={$r['refund_won']}");

// day0 sent → 0
$r = calc(paidInput('1회', $base->format('Y-m-d H:i:s'), 500, ['dispatch_status' => 'sent']), $base);
check('imm_day0_sent', !$r['refundable'] && $r['refund_won'] === 0 && $r['reason_code'] === 'sent', "reason={$r['reason_code']}");

// day8 pending → 0 (7일 경과)
$day8 = $base->modify('+8 days');
$r = calc(paidInput('1회', $base->format('Y-m-d H:i:s'), 500, ['dispatch_status' => 'pending']), $day8);
check('imm_day8_pending', !$r['refundable'] && $r['reason_code'] === 'over_7days', "reason={$r['reason_code']}");

// blocked(미발송) → 500
$r = calc(paidInput('1회', $base->format('Y-m-d H:i:s'), 500, ['dispatch_status' => 'blocked']), $base);
check('imm_day0_blocked', $r['refundable'] && $r['refund_won'] === 500);

// ── 5회권 ──────────────────────────────────────────

$exp5 = $base->modify('+120 days')->format('Y-m-d H:i:s');

// day3 remaining=5(사용0) → 2250
$day3 = $base->modify('+3 days');
$r = calc(paidInput('5회권', $base->format('Y-m-d H:i:s'), 2250, ['pack_size' => 5, 'remaining' => 5, 'expires_at' => $exp5]), $day3);
check('5pack_day3_rem5', $r['refundable'] && $r['refund_won'] === 2250 && $r['reason_code'] === 'within7_used0', "got={$r['refund_won']} reason={$r['reason_code']}");

// day3 remaining=4(사용1) → 1125
$r = calc(paidInput('5회권', $base->format('Y-m-d H:i:s'), 2250, ['pack_size' => 5, 'remaining' => 4, 'expires_at' => $exp5]), $day3);
check('5pack_day3_rem4', $r['refundable'] && $r['refund_won'] === 1125 && $r['reason_code'] === 'within7_used1', "got={$r['refund_won']}");

// day3 remaining=3(사용2) → 750
$r = calc(paidInput('5회권', $base->format('Y-m-d H:i:s'), 2250, ['pack_size' => 5, 'remaining' => 3, 'expires_at' => $exp5]), $day3);
check('5pack_day3_rem3', $r['refundable'] && $r['refund_won'] === 750 && $r['reason_code'] === 'within7_used2', "got={$r['refund_won']}");

// day3 remaining=2(사용3) → 0
$r = calc(paidInput('5회권', $base->format('Y-m-d H:i:s'), 2250, ['pack_size' => 5, 'remaining' => 2, 'expires_at' => $exp5]), $day3);
check('5pack_day3_rem2', !$r['refundable'] && $r['refund_won'] === 0 && $r['reason_code'] === 'used_over', "reason={$r['reason_code']}");

// day8 remaining=5 → 0 (7일 경과)
$r = calc(paidInput('5회권', $base->format('Y-m-d H:i:s'), 2250, ['pack_size' => 5, 'remaining' => 5, 'expires_at' => $exp5]), $day8);
check('5pack_day8_rem5', !$r['refundable'] && $r['reason_code'] === 'over_7days', "reason={$r['reason_code']}");

// expired → 0
$expiredNow = $base->modify('+121 days');
$r = calc(paidInput('5회권', $base->format('Y-m-d H:i:s'), 2250, ['pack_size' => 5, 'remaining' => 5, 'expires_at' => $exp5]), $expiredNow);
check('5pack_expired', !$r['refundable'] && $r['reason_code'] === 'expired', "reason={$r['reason_code']}");

// ── 10회권 ─────────────────────────────────────────

$exp10 = $base->modify('+120 days')->format('Y-m-d H:i:s');

// rem10(사용0) → 4000
$r = calc(paidInput('10회권', $base->format('Y-m-d H:i:s'), 4000, ['pack_size' => 10, 'remaining' => 10, 'expires_at' => $exp10]), $day3);
check('10pack_rem10', $r['refundable'] && $r['refund_won'] === 4000 && $r['reason_code'] === 'within7_used0', "got={$r['refund_won']}");

// rem9(사용1) → 2000
$r = calc(paidInput('10회권', $base->format('Y-m-d H:i:s'), 4000, ['pack_size' => 10, 'remaining' => 9, 'expires_at' => $exp10]), $day3);
check('10pack_rem9', $r['refundable'] && $r['refund_won'] === 2000 && $r['reason_code'] === 'within7_used1to3', "got={$r['refund_won']} reason={$r['reason_code']}");

// rem7(사용3) → 2000
$r = calc(paidInput('10회권', $base->format('Y-m-d H:i:s'), 4000, ['pack_size' => 10, 'remaining' => 7, 'expires_at' => $exp10]), $day3);
check('10pack_rem7', $r['refundable'] && $r['refund_won'] === 2000 && $r['reason_code'] === 'within7_used1to3', "got={$r['refund_won']}");

// rem6(사용4) → 1300
$r = calc(paidInput('10회권', $base->format('Y-m-d H:i:s'), 4000, ['pack_size' => 10, 'remaining' => 6, 'expires_at' => $exp10]), $day3);
check('10pack_rem6', $r['refundable'] && $r['refund_won'] === 1300 && $r['reason_code'] === 'within7_used4', "got={$r['refund_won']} reason={$r['reason_code']}");

// rem5(사용5) → 0
$r = calc(paidInput('10회권', $base->format('Y-m-d H:i:s'), 4000, ['pack_size' => 10, 'remaining' => 5, 'expires_at' => $exp10]), $day3);
check('10pack_rem5', !$r['refundable'] && $r['reason_code'] === 'used_over', "reason={$r['reason_code']}");

// day8 → 0
$r = calc(paidInput('10회권', $base->format('Y-m-d H:i:s'), 4000, ['pack_size' => 10, 'remaining' => 10, 'expires_at' => $exp10]), $day8);
check('10pack_day8', !$r['refundable'] && $r['reason_code'] === 'over_7days');

// ── 경계: 정확히 +7days 포함 ───────────────────────

$exactly7 = $base->modify('+7 days');
$r = calc(paidInput('5회권', $base->format('Y-m-d H:i:s'), 2250, ['pack_size' => 5, 'remaining' => 5, 'expires_at' => $exp5]), $exactly7);
check('boundary_exactly_7d_included', $r['refundable'] && $r['refund_won'] === 2250, "reason={$r['reason_code']}");

// +7days+1s → 0
$over7by1s = $base->modify('+7 days +1 second');
$r = calc(paidInput('5회권', $base->format('Y-m-d H:i:s'), 2250, ['pack_size' => 5, 'remaining' => 5, 'expires_at' => $exp5]), $over7by1s);
check('boundary_7d_plus_1s', !$r['refundable'] && $r['reason_code'] === 'over_7days', "reason={$r['reason_code']}");

// ── status cancelled/pending → not_paid ────────────

$r = MemoTicketRefundCalculator::calculate([
    'variant' => '5회권',
    'order_status' => 'cancelled',
    'amount_won' => 2250,
    'paid_at' => $base->format('Y-m-d H:i:s'),
    'pack_size' => 5,
    'remaining' => 5,
], $base);
check('status_cancelled', !$r['refundable'] && $r['reason_code'] === 'not_paid');

$r = MemoTicketRefundCalculator::calculate([
    'variant' => '10회권',
    'order_status' => 'pending',
    'amount_won' => 4000,
    'paid_at' => $base->format('Y-m-d H:i:s'),
    'pack_size' => 10,
    'remaining' => 10,
], $base);
check('status_pending', !$r['refundable'] && $r['reason_code'] === 'not_paid');

// ── amount_won=10 · 표 500 케이스 → refund 10 ─────

$r = calc(paidInput('1회', $base->format('Y-m-d H:i:s'), 10, ['dispatch_status' => 'pending']), $base);
check('amount_cap_10', $r['refundable'] && $r['refund_won'] === 10 && $r['table_won'] === 500, "refund={$r['refund_won']} table={$r['table_won']}");

// ── alias ──────────────────────────────────────────

$r = calc(paidInput('5회', $base->format('Y-m-d H:i:s'), 2250, ['pack_size' => 5, 'remaining' => 5, 'expires_at' => $exp5]), $day3);
check('alias_5회', $r['refundable'] && $r['refund_won'] === 2250);

$r = calc(paidInput('10회', $base->format('Y-m-d H:i:s'), 4000, ['pack_size' => 10, 'remaining' => 10, 'expires_at' => $exp10]), $day3);
check('alias_10회', $r['refundable'] && $r['refund_won'] === 4000);

// 20회권 → unknown
$r = calc(paidInput('20회권', $base->format('Y-m-d H:i:s'), 5000), $base);
check('alias_20_unknown', !$r['refundable'] && $r['reason_code'] === 'unknown_variant');

$r = calc(paidInput('20회', $base->format('Y-m-d H:i:s'), 5000), $base);
check('alias_20회_unknown', !$r['refundable'] && $r['reason_code'] === 'unknown_variant');

// ── 일관성: used0 표금액 == PaidCatalog sale ───────

$q1 = PaidCatalog::quote('memo_ticket', '1회', null);
$q5 = PaidCatalog::quote('memo_ticket', '5회권', null);
$q10 = PaidCatalog::quote('memo_ticket', '10회권', null);

$r1 = calc(paidInput('1회', $base->format('Y-m-d H:i:s'), 500, ['dispatch_status' => 'pending']), $base);
$r5 = calc(paidInput('5회권', $base->format('Y-m-d H:i:s'), 2250, ['pack_size' => 5, 'remaining' => 5, 'expires_at' => $exp5]), $base);
$r10 = calc(paidInput('10회권', $base->format('Y-m-d H:i:s'), 4000, ['pack_size' => 10, 'remaining' => 10, 'expires_at' => $exp10]), $base);

check('consistency_1회', $r1['table_won'] === (int) $q1['sale_price_krw'], "table={$r1['table_won']} catalog={$q1['sale_price_krw']}");
check('consistency_5회권', $r5['table_won'] === (int) $q5['sale_price_krw'], "table={$r5['table_won']} catalog={$q5['sale_price_krw']}");
check('consistency_10회권', $r10['table_won'] === (int) $q10['sale_price_krw'], "table={$r10['table_won']} catalog={$q10['sale_price_krw']}");

// ── expires_at == now → expired ────────────────────

$expNow = $base->modify('+5 days');
$r = calc(paidInput('5회권', $base->format('Y-m-d H:i:s'), 2250, [
    'pack_size' => 5,
    'remaining' => 5,
    'expires_at' => $expNow->format('Y-m-d H:i:s'),
]), $expNow);
check('expires_at_eq_now', !$r['refundable'] && $r['reason_code'] === 'expired', "reason={$r['reason_code']}");

echo "\n";
if ($failed > 0) {
    fwrite(STDERR, "{$failed} failed\n");
    exit(1);
}
echo "all ok ({$failed} failed)\n";
