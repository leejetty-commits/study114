<?php

declare(strict_types=1);

/**
 * 운영 DB live 증명 — 055 적용 후 CLI에서 실행
 *
 *   php scripts/smoke-paid-badges-live.php [--grant]
 *
 * --grant: 첫 published 공부방/과외쌤에 hot / jjokjipge 행을 시드(또는 연장) 후 resolver 출력
 * 기본: 기존 active 행만 읽어 paid_badges[] shape 출력
 */

require dirname(__DIR__) . '/vendor/autoload.php';

use Study114\Database\Connection;
use Study114\Paid\PaidBadgeRepository;
use Study114\Paid\PaidBadgeResolver;

$pdo = Connection::get();
$repo = new PaidBadgeRepository($pdo);
$resolver = new PaidBadgeResolver($pdo);

if (!$repo->tableReady()) {
    fwrite(STDERR, "FAIL: provider_paid_badges 없음 — sql/schema/055_provider_paid_badges.sql 적용 필요\n");
    exit(1);
}

$grant = in_array('--grant', $argv, true);

$roomId = (int) $pdo->query(
    "SELECT id FROM study_rooms WHERE profile_status='published' ORDER BY id ASC LIMIT 1"
)->fetchColumn();
$tutorId = (int) $pdo->query(
    "SELECT id FROM tutors WHERE profile_status='published' ORDER BY id ASC LIMIT 1"
)->fetchColumn();

$starts = date('Y-m-d');
$end = date('Y-m-d', strtotime('+30 days'));

if ($grant) {
    if ($roomId > 0) {
        $g = $repo->grantFromOrder('study_room', $roomId, 'hot', $starts, $end, 'smoke-room-' . $starts);
        echo "GRANT room: " . json_encode($g, JSON_UNESCAPED_UNICODE) . "\n";
    }
    if ($tutorId > 0) {
        $g = $repo->grantFromOrder('tutor', $tutorId, 'jjokjipge', $starts, $end, 'smoke-tutor-' . $starts);
        echo "GRANT tutor: " . json_encode($g, JSON_UNESCAPED_UNICODE) . "\n";
    }
}

$out = [
    'table' => 'provider_paid_badges',
    'study_room' => $roomId > 0 ? [
        'provider_id' => $roomId,
        'paid_badges' => $resolver->forProvider('study_room', $roomId),
    ] : null,
    'tutor' => $tutorId > 0 ? [
        'provider_id' => $tutorId,
        'paid_badges' => $resolver->forProvider('tutor', $tutorId),
    ] : null,
];

$rows = $pdo->query(
    "SELECT id, provider_type, provider_id, badge_code, status, starts_on, end_exclusive_on, source_order_ref
     FROM provider_paid_badges
     WHERE status='active' AND end_exclusive_on > CURDATE()
     ORDER BY id DESC LIMIT 20"
)->fetchAll(PDO::FETCH_ASSOC);

$out['active_rows'] = $rows;
echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";

$ok = ($out['study_room']['paid_badges'] ?? []) !== [] || ($out['tutor']['paid_badges'] ?? []) !== [];
if (!$ok) {
    fwrite(STDERR, "WARN: active paid_badges 비어 있음. --grant 로 시드하거나 checkout fulfill 후 재실행\n");
    exit(2);
}
echo "PASS: paid_badges live rows present\n";
