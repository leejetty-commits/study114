<?php

declare(strict_types=1);

/**
 * 273 — 판정·강의스타일 4개 제한.
 * 결제 완료는 STUDY114_PAID_MOCK_COMPLETE=1 이 아니면 건너뛴다.
 *
 * php scripts/verify-pickprime-purchase-gate.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Paid\TierRequirement;
use Study114\Tutor\TutorRegisterService;

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

/** @param list<array{id: string, label: string}> $rows */
function ids(array $rows): array
{
    return array_map(static fn (array $row): string => $row['id'], $rows);
}

$emptyTutor = TierRequirement::missingFromRecord('tutor', 'pick', []);
check('tutor_empty_pick', ids($emptyTutor) === TierRequirement::TUTOR_PICK_IDS, implode(',', ids($emptyTutor)));

$pickTutor = TierRequirement::missingFromRecord('tutor', 'pick', [
    'university_name' => '서울대',
    'main_material_note' => '정석',
    'teaching_style_badges' => ['passion'],
]);
check('tutor_pick_open', $pickTutor === []);

$primeTutor = TierRequirement::missingFromRecord('tutor', 'prime', [
    'university_name' => '서울대',
    'main_material_note' => '정석',
    'teaching_style_badges' => ['passion'],
]);
check(
    'tutor_prime_names',
    ids($primeTutor) === ['intro_long', 'feature_2', 'feature_3'],
    implode(',', ids($primeTutor)),
);
check('tutor_one_style', TierRequirement::missingFromRecord('tutor', 'pick', [
    'career_year_band' => 'y1_3',
    'main_material_note' => '정석',
    'teaching_style_badges' => ['passion'],
]) === []);

$emptyRoom = TierRequirement::missingFromRecord('study_room', 'pick', []);
check('room_empty_pick', ids($emptyRoom) === TierRequirement::ROOM_PICK_IDS, implode(',', ids($emptyRoom)));
$roomPick = TierRequirement::missingFromRecord('study_room', 'pick', [
    'images' => [['image_type' => 'cover', 'image_path' => '/uploads/cover.jpg']],
    'intro_short' => '한 줄',
    'monthly_fee_manwon' => '30',
    'teaching_style_ids' => ['kind'],
]);
check('room_pick_open_without_expanded', $roomPick === []);

$checkout = file_get_contents(dirname(__DIR__) . '/src/Paid/ProviderCheckoutService.php');
$createAt = strpos($checkout, 'function createOrder');
$insertAt = strpos($checkout, 'insertPending', $createAt === false ? 0 : $createAt);
$checkAt = strpos($checkout, 'assertTierFieldsForOrder', $createAt === false ? 0 : $createAt);
$completeAt = strpos($checkout, 'function completeOrder');
check('create_order_checks_before_insert', $createAt !== false && $checkAt !== false && $insertAt !== false && $checkAt < $insertAt);
$completeBody = $completeAt === false ? '' : substr($checkout, $completeAt, 800);
check('complete_order_has_no_tier_check', !str_contains($completeBody, 'TierRequirement'));

if (!in_array('sqlite', PDO::getAvailableDrivers(), true)) {
    echo "건너뜀 sqlite_probe — pdo_sqlite 없음\n";
} else {
$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec(
    'CREATE TABLE tutors (
        id INTEGER PRIMARY KEY,
        university_name TEXT,
        career_year_band TEXT,
        main_material_note TEXT,
        intro_long TEXT,
        feature_2 TEXT,
        feature_3 TEXT
    )'
);
$pdo->exec(
    'CREATE TABLE tutor_teaching_style_badges (
        tutor_id INTEGER,
        badge_name TEXT,
        display_order INTEGER
    )'
);
$pdo->exec("INSERT INTO tutors (id, university_name) VALUES (7, '')");
$loaded = TierRequirement::missingFor($pdo, 'tutor', 7, 'pick');
check('pdo_empty_tutor', count($loaded) === 3, (string) count($loaded));

$stylePdo = new PDO('sqlite::memory:');
$stylePdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$stylePdo->exec(
    'CREATE TABLE tutor_teaching_style_badges (
        tutor_id INTEGER,
        badge_name TEXT,
        display_order INTEGER
    )'
);
$service = new TutorRegisterService();
$method = new ReflectionMethod(TutorRegisterService::class, 'syncStyleBadges');
$method->setAccessible(true);

$five = ['passion', 'meticulous', 'kind', 'from_basics', 'concept_focus'];
try {
    $method->invoke($service, $stylePdo, 1, ['teaching_style_badges' => $five]);
    check('reject_new_five', false, '예외가 없음');
} catch (InvalidArgumentException $e) {
    $left = (int) $stylePdo->query('SELECT COUNT(*) FROM tutor_teaching_style_badges')->fetchColumn();
    check('reject_new_five', $e->getMessage() === '강의스타일은 4개까지 고를 수 있어요' && $left === 0, $e->getMessage());
}

$insert = $stylePdo->prepare('INSERT INTO tutor_teaching_style_badges (tutor_id, badge_name, display_order) VALUES (2, ?, ?)');
foreach ($five as $i => $code) {
    $insert->execute([$code, $i]);
}
try {
    $method->invoke($service, $stylePdo, 2, ['teaching_style_badges' => array_reverse($five)]);
    $kept = $stylePdo->query('SELECT badge_name FROM tutor_teaching_style_badges WHERE tutor_id = 2 ORDER BY display_order ASC')->fetchAll(PDO::FETCH_COLUMN);
    check('keep_same_five', count($kept) === 5, implode(',', $kept));
} catch (Throwable $e) {
    check('keep_same_five', false, $e->getMessage());
}

try {
    $method->invoke($service, $stylePdo, 2, ['teaching_style_badges' => ['passion', 'meticulous', 'kind', 'from_basics', 'solution_focus']]);
    check('reject_changed_five', false, '예외가 없음');
} catch (InvalidArgumentException $e) {
    check('reject_changed_five', $e->getMessage() === '강의스타일은 4개까지 고를 수 있어요');
}

$fourOk = false;
try {
    $method->invoke($service, $stylePdo, 3, ['teaching_style_badges' => ['passion', 'meticulous', 'kind', 'from_basics']]);
    $fourOk = (int) $stylePdo->query('SELECT COUNT(*) FROM tutor_teaching_style_badges WHERE tutor_id = 3')->fetchColumn() === 4;
} catch (Throwable $e) {
    $fourOk = false;
}
check('allow_four', $fourOk);
}

if (getenv('STUDY114_PAID_MOCK_COMPLETE') !== '1') {
    echo "건너뜀 payment_complete — STUDY114_PAID_MOCK_COMPLETE 없음\n";
} else {
    echo "건너뜀 payment_complete — 결제 완료·노출은 우동공과2 5-2\n";
}

if ($failed > 0) {
    fwrite(STDERR, "verify-pickprime-purchase-gate.php: {$failed} failed\n");
    exit(1);
}
echo "verify-pickprime-purchase-gate.php: ok\n";
