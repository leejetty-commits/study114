<?php

declare(strict_types=1);

/**
 * 327 — PositionRefundCalculator 순수 계산 verify
 * 형식: scripts/verify-memo-ticket-refund.php (324) 그대로
 *
 * php scripts/verify-position-refund.php
 */

require_once __DIR__ . '/../src/bootstrap.php';

use Study114\Paid\PositionRefundCalculator;
use Study114\Paid\PositionPeriodCalculator;

$pass = 0;
$fail = 0;
$errors = [];

function check(string $id, bool $ok, string $label): void
{
    global $pass, $fail, $errors;
    if ($ok) {
        $pass++;
    } else {
        $fail++;
        $errors[] = "$id: $label";
    }
}

$tz = PositionPeriodCalculator::timezone();

/* ── 시작 전 → 전액 ─────────────────────────────────── */

$now1 = new DateTimeImmutable('2026-11-01', $tz);
$r1 = PositionRefundCalculator::calculate([
    'paid_at' => '2026-10-25',
    'amount_won' => 50000,
    'variant' => '1개월',
    'grant_mode' => 'new',
    'segment_started_on' => '2026-11-05',
    'segment_end_exclusive_on' => '2026-12-05',
], $now1);
check('P1', $r1['refundable'] === true, '시작 전 refundable');
check('P2', $r1['refund_won'] === 50000, '시작 전 전액 50000');
check('P3', $r1['reason_code'] === 'before_start_full', '시작 전 reason');
check('P4', $r1['table_won'] === $r1['refund_won'], 'table_won=refund_won');

/* ── 시작 당일 요청 → 일할 ──────────────────────────── */

$now2 = new DateTimeImmutable('2026-11-05', $tz);
$r2 = PositionRefundCalculator::calculate([
    'paid_at' => '2026-11-01',
    'amount_won' => 30000,
    'variant' => '1개월',
    'grant_mode' => 'new',
    'segment_started_on' => '2026-11-05',
    'segment_end_exclusive_on' => '2026-12-05',
], $now2);
check('P5', $r2['refundable'] === true, '시작 당일 refundable');
check('P6', $r2['reason_code'] === 'after_start_prorata', '시작 당일 reason');
$segDays2 = (int) (new DateTimeImmutable('2026-11-05', $tz))->diff(new DateTimeImmutable('2026-12-05', $tz))->format('%a');
$remaining2 = (int) (new DateTimeImmutable('2026-11-06', $tz))->diff(new DateTimeImmutable('2026-12-05', $tz))->format('%a');
$expected2 = (int) floor(30000 * $remaining2 / $segDays2);
check('P7', $r2['refund_won'] === $expected2, "시작 당일 일할: {$r2['refund_won']} vs expected {$expected2}");

/* ── 마지막 날 → 0 ──────────────────────────────────── */

$now3 = new DateTimeImmutable('2026-12-04', $tz);
$r3 = PositionRefundCalculator::calculate([
    'paid_at' => '2026-11-01',
    'amount_won' => 30000,
    'variant' => '1개월',
    'grant_mode' => 'new',
    'segment_started_on' => '2026-11-05',
    'segment_end_exclusive_on' => '2026-12-05',
], $now3);
check('P8', $r3['refundable'] === false, '마지막 날 refundable=false');
check('P9', $r3['reason_code'] === 'last_day', '마지막 날 reason');
check('P10', $r3['refund_won'] === 0, '마지막 날 0원');

/* ── 종료 후 → period_ended ──────────────────────────── */

$now4 = new DateTimeImmutable('2026-12-10', $tz);
$r4 = PositionRefundCalculator::calculate([
    'paid_at' => '2026-11-01',
    'amount_won' => 30000,
    'variant' => '1개월',
    'grant_mode' => 'new',
    'segment_started_on' => '2026-11-05',
    'segment_end_exclusive_on' => '2026-12-05',
], $now4);
check('P11', $r4['refundable'] === false, '종료 후 refundable=false');
check('P12', $r4['reason_code'] === 'period_ended', '종료 후 reason');

/* ── 월 상품 클램프 (1/31 시작 1개월) ────────────────── */

$p31 = PositionPeriodCalculator::compute('2026-01-31', 'month', 1);
$segDays31 = $p31['period_days'];
$now5 = new DateTimeImmutable('2026-02-15', $tz);
$r5 = PositionRefundCalculator::calculate([
    'paid_at' => '2026-01-30',
    'amount_won' => 60000,
    'variant' => '1개월',
    'grant_mode' => 'new',
    'segment_started_on' => $p31['started_on'],
    'segment_end_exclusive_on' => $p31['end_exclusive_on'],
], $now5);
check('P13', $r5['refundable'] === true, '클램프 refundable');
$rem5 = (int) (new DateTimeImmutable('2026-02-16', $tz))->diff(new DateTimeImmutable($p31['end_exclusive_on'], $tz))->format('%a');
$exp5 = (int) floor(60000 * $rem5 / $segDays31);
check('P14', $r5['refund_won'] === $exp5, "클램프 일할: {$r5['refund_won']} vs {$exp5}");

/* ── extend: 추가 구간 시작 전 → 그 주문 전액 ──────── */

$now6 = new DateTimeImmutable('2026-11-29', $tz);
$r6 = PositionRefundCalculator::calculate([
    'paid_at' => '2026-11-28',
    'amount_won' => 50000,
    'variant' => '1개월',
    'grant_mode' => 'extend',
    'segment_started_on' => '2026-12-01',
    'segment_end_exclusive_on' => '2027-01-01',
], $now6);
check('P15', $r6['refundable'] === true, 'extend 시작 전 refundable');
check('P16', $r6['refund_won'] === 50000, 'extend 시작 전 전액');
check('P17', $r6['reason_code'] === 'before_start_full', 'extend 시작 전 reason');

/* ── extend: 추가 구간 중 → 일할 ────────────────────── */

$now7 = new DateTimeImmutable('2026-12-15', $tz);
$r7 = PositionRefundCalculator::calculate([
    'paid_at' => '2026-11-28',
    'amount_won' => 50000,
    'variant' => '1개월',
    'grant_mode' => 'extend',
    'segment_started_on' => '2026-12-01',
    'segment_end_exclusive_on' => '2027-01-01',
], $now7);
check('P18', $r7['refundable'] === true, 'extend 중 refundable');
check('P19', $r7['reason_code'] === 'after_start_prorata', 'extend 중 reason');
$sDays7 = (int) (new DateTimeImmutable('2026-12-01', $tz))->diff(new DateTimeImmutable('2027-01-01', $tz))->format('%a');
$sRem7 = (int) (new DateTimeImmutable('2026-12-16', $tz))->diff(new DateTimeImmutable('2027-01-01', $tz))->format('%a');
$sExp7 = (int) floor(50000 * $sRem7 / $sDays7);
check('P20', $r7['refund_won'] === $sExp7, "extend 중 일할: {$r7['refund_won']} vs {$sExp7}");

/* ── extend: 추가 구간 종료 후 → period_ended ──────── */

$now8 = new DateTimeImmutable('2027-01-05', $tz);
$r8 = PositionRefundCalculator::calculate([
    'paid_at' => '2026-11-28',
    'amount_won' => 50000,
    'variant' => '1개월',
    'grant_mode' => 'extend',
    'segment_started_on' => '2026-12-01',
    'segment_end_exclusive_on' => '2027-01-01',
], $now8);
check('P21', $r8['refundable'] === false, 'extend 종료 후 refundable=false');
check('P22', $r8['reason_code'] === 'period_ended', 'extend 종료 후 reason');

/* ── floor 확인 ──────────────────────────────────────── */

$now9 = new DateTimeImmutable('2026-11-10', $tz);
$r9 = PositionRefundCalculator::calculate([
    'paid_at' => '2026-11-01',
    'amount_won' => 10000,
    'variant' => '1개월',
    'grant_mode' => 'new',
    'segment_started_on' => '2026-11-01',
    'segment_end_exclusive_on' => '2026-12-01',
], $now9);
check('P23', $r9['reason_code'] === 'after_start_prorata', 'floor test reason');
$sDays9 = 30; // Nov 1→Dec 1
$sRem9 = (int) (new DateTimeImmutable('2026-11-11', $tz))->diff(new DateTimeImmutable('2026-12-01', $tz))->format('%a');
$sExp9 = (int) floor(10000 * $sRem9 / $sDays9);
check('P24', $r9['refund_won'] === $sExp9, "floor: {$r9['refund_won']} vs {$sExp9}");

/* ── breakdown 존재 확인 ─────────────────────────────── */
check('P25', is_array($r1['breakdown']), 'breakdown is array');
check('P26', count($r1['breakdown']) >= 1, 'breakdown has items');
check('P27', ($r1['breakdown'][0]['label'] ?? '') === '노출분', 'breakdown first=노출분');

/* ── needs_owner_decision 문자열 0 ───────────────────── */
$calcSrc = file_get_contents(__DIR__ . '/../src/Paid/PositionRefundCalculator.php');
check('P28', strpos($calcSrc, 'needs_owner_decision') === false, 'no needs_owner_decision in calculator');

/* ── 보고 ────────────────────────────────────────────── */

echo "\n=== verify-position-refund.php ===\n";
echo "PASS: {$pass}  FAIL: {$fail}\n";
if ($errors !== []) {
    foreach ($errors as $e) {
        echo "  FAIL: {$e}\n";
    }
    exit(1);
}
echo "ALL PASS ✅\n";
