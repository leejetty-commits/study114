<?php

declare(strict_types=1);

/**
 * PositionPeriodCalculator 예시 케이스 검증 (DB 불필요)
 * 사용: php scripts/verify-position-period.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Paid\PositionPeriodCalculator;

/** @var list<array{0:string,1:string,2:int,3:string,4:string}> */
$cases = [
    // started, type, value, expected ends_on, expected end_exclusive
    ['2026-08-10', 'day', 14, '2026-08-23', '2026-08-24'],
    ['2026-08-10', 'day', 21, '2026-08-30', '2026-08-31'],
    ['2026-08-10', 'month', 1, '2026-09-09', '2026-09-10'],
    ['2026-08-10', 'month', 2, '2026-10-09', '2026-10-10'],
    ['2026-01-31', 'month', 1, '2026-02-28', '2026-03-01'],
];

$failed = 0;
foreach ($cases as [$start, $type, $value, $wantEnds, $wantExclusive]) {
    $got = PositionPeriodCalculator::compute($start, $type, $value);
    $ok = $got['ends_on'] === $wantEnds && $got['end_exclusive_on'] === $wantExclusive;
    $activeLast = PositionPeriodCalculator::isActiveOn($wantEnds, $got['end_exclusive_on']);
    $inactiveNext = !PositionPeriodCalculator::isActiveOn($wantExclusive, $got['end_exclusive_on']);
    if (!$ok || !$activeLast || !$inactiveNext) {
        $failed++;
        fwrite(STDERR, "FAIL {$start} {$type}={$value}\n");
        fwrite(STDERR, '  got ends_on=' . $got['ends_on'] . ' exclusive=' . $got['end_exclusive_on'] . "\n");
        fwrite(STDERR, "  want ends_on={$wantEnds} exclusive={$wantExclusive}\n");
        continue;
    }
    echo "OK {$start} {$type}={$value} → ends_on={$wantEnds} exclusive={$wantExclusive}\n";
}

$fromVariant = PositionPeriodCalculator::fromVariant('1개월', '2026-08-10');
if ($fromVariant['ends_on'] !== '2026-09-09') {
    $failed++;
    fwrite(STDERR, "FAIL fromVariant 1개월\n");
} else {
    echo "OK fromVariant 1개월\n";
}

exit($failed === 0 ? 0 : 1);
