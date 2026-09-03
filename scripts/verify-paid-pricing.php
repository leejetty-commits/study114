<?php

declare(strict_types=1);

/**
 * AutoNewBadge · TutorPositionMemoBundle 검증 (DB 불필요)
 * 사용: php scripts/verify-paid-pricing.php
 * PR-A: 번들 수치는 PaidCatalog 정본(2026-09-04)을 따른다.
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Paid\AutoNewBadge;
use Study114\Paid\TutorPositionMemoBundle;

$failed = 0;
function check(string $name, bool $ok): void
{
    global $failed;
    if ($ok) {
        echo "OK {$name}\n";
        return;
    }
    $failed++;
    fwrite(STDERR, "FAIL {$name}\n");
}

$now = new DateTimeImmutable('2026-08-28 12:00:00');
check(
    'new_within_7d',
    AutoNewBadge::isActive('2026-08-22 12:00:00', null, $now) === true,
);
check(
    'new_exactly_7d_off',
    AutoNewBadge::isActive('2026-08-21 12:00:00', null, $now) === false,
);
check(
    'new_prefers_published',
    AutoNewBadge::isActive('2026-01-01 00:00:00', '2026-08-27 00:00:00', $now) === false,
);
check(
    'new_fallback_created',
    AutoNewBadge::isActive(null, '2026-08-27 00:00:00', $now) === true,
);
check('new_empty', AutoNewBadge::isActive(null, null, $now) === false);

check('bundle_room_zero', TutorPositionMemoBundle::memoCount('prime', '1개월', 'study_room') === 0);
check('bundle_pick_2w', TutorPositionMemoBundle::memoCount('pick', '2주', 'tutor') === 1);
check('bundle_pick_1m', TutorPositionMemoBundle::memoCount('pick', '1개월', 'tutor') === 2);
check('bundle_pick_2m', TutorPositionMemoBundle::memoCount('pick', '2개월', 'tutor') === 4);
check('bundle_pick_3m', TutorPositionMemoBundle::memoCount('pick', '3개월', 'tutor') === 6);
check('bundle_pick_6m', TutorPositionMemoBundle::memoCount('pick', '6개월', 'tutor') === 12);
check('bundle_prime_2w', TutorPositionMemoBundle::memoCount('prime', '2주', 'tutor') === 2);
check('bundle_prime_1m', TutorPositionMemoBundle::memoCount('prime', '1개월', 'tutor') === 5);
check('bundle_prime_2m', TutorPositionMemoBundle::memoCount('prime', '2개월', 'tutor') === 10);
check('bundle_prime_3m', TutorPositionMemoBundle::memoCount('prime', '3개월', 'tutor') === 15);
check('bundle_prime_6m', TutorPositionMemoBundle::memoCount('prime', '6개월', 'tutor') === 30);

if ($failed > 0) {
    fwrite(STDERR, "{$failed} failed\n");
    exit(1);
}
echo "all ok\n";
