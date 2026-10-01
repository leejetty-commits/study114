<?php

declare(strict_types=1);

/**
 * 기본정보 여덟 칸을 이미 다 채웠는데 draft 로 남은 학생 행을 published 로 올린다.
 * 판정은 StudentBasicCompleteness 하나만 쓴다. hidden·deleted 행은 대상이 아니다.
 *
 * 기본은 조회만 하고 대상 수·ID를 출력한다.
 *   php scripts/publish-complete-student-drafts.php
 * 반영은 --apply 를 줬을 때만.
 *   php scripts/publish-complete-student-drafts.php --apply
 */

require dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Auth\EmailVerificationGate;
use Study114\Database\Connection;
use Study114\Registration\StudentBasicCompleteness;
use Study114\Registration\StudentHubRepository;

$apply = in_array('--apply', $argv ?? [], true);
$pdo = Connection::get();
$repo = new StudentHubRepository($pdo);

$gate = new EmailVerificationGate();
$guardianOf = $pdo->prepare('SELECT guardian_user_id FROM students WHERE id = ? LIMIT 1');

$draftIds = $repo->listDraftIds();
$targets = [];
$skipped = [];
foreach ($draftIds as $id) {
    $student = $repo->findById($id);
    if ($student === null) {
        continue;
    }
    $guardianOf->execute([$id]);
    $guardianId = (int) $guardianOf->fetchColumn();
    if (!$gate->isVerified($guardianId)) {
        $skipped[$id] = ['이메일 인증 전 계정'];
        continue;
    }
    if (StudentBasicCompleteness::isComplete($student)) {
        $targets[] = $id;
    } else {
        $skipped[$id] = StudentBasicCompleteness::missingLabels($student);
    }
}

echo 'draft=' . count($draftIds) . ' complete=' . count($targets) . ' incomplete=' . count($skipped)
    . ($apply ? ' apply' : ' dry-run') . PHP_EOL;
echo 'target_ids=' . ($targets === [] ? '-' : implode(',', $targets)) . PHP_EOL;
foreach ($skipped as $id => $missing) {
    echo "keep_draft id={$id} missing=" . implode('/', $missing) . PHP_EOL;
}

if (!$apply) {
    exit(0);
}

$done = 0;
$failed = 0;
foreach ($targets as $id) {
    try {
        $changed = $repo->transaction(static function () use ($repo, $id): bool {
            $student = $repo->findById($id);
            if ($student === null || ($student['exposure_status'] ?? '') !== 'draft'
                || !StudentBasicCompleteness::isComplete($student)) {
                return false;
            }

            return $repo->transitionExposureStatus($id, 'draft', 'published', date('Y-m-d H:i:s'));
        });
        if ($changed) {
            $done++;
            echo "published id={$id}" . PHP_EOL;
        }
    } catch (Throwable $e) {
        $failed++;
        fwrite(STDERR, "fail id={$id} " . $e->getMessage() . PHP_EOL);
    }
}

echo "done={$done} failed={$failed}" . PHP_EOL;
exit($failed > 0 ? 1 : 0);
