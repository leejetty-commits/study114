<?php

declare(strict_types=1);

/**
 * 일회성: 공부방 목록 확인 후 '우동공과 대치점'만 남기고 나머지 soft-delete.
 * 사용 후 이 파일을 삭제한다.
 *
 * 목록: GET  ?key=...
 * 적용: GET  ?key=...&apply=1
 */

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Database\Connection;

header('Content-Type: application/json; charset=utf-8');

$expected = 's114-keep-daechi-20260819-a7c91e44';
$given = (string) ($_GET['key'] ?? '');
if ($given === '' || !hash_equals($expected, $given)) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'not_found'], JSON_UNESCAPED_UNICODE);
    exit;
}

$keepName = '우동공과 대치점';
$apply = (string) ($_GET['apply'] ?? '') === '1';
$lockPath = dirname(__DIR__, 3) . '/storage/room-cleanup-once.lock';

try {
    $pdo = Connection::get();
    $stmt = $pdo->query(
        'SELECT id, user_id, study_room_name, profile_status, deleted_at, created_at, updated_at
         FROM study_rooms
         ORDER BY id ASC'
    );
    $all = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'db', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
}

$alive = [];
$keep = [];
foreach ($all as $row) {
    if ($row['deleted_at'] !== null && $row['deleted_at'] !== '') {
        continue;
    }
    $alive[] = $row;
    if (trim((string) $row['study_room_name']) === $keepName) {
        $keep[] = $row;
    }
}

$payload = [
    'ok' => true,
    'keep_name' => $keepName,
    'alive_count' => count($alive),
    'keep_count' => count($keep),
    'alive' => $alive,
    'keep' => $keep,
    'applied' => false,
    'already_locked' => is_file($lockPath),
];

if (!$apply) {
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

if (is_file($lockPath)) {
    http_response_code(409);
    $payload['ok'] = false;
    $payload['error'] = 'already_applied';
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

if (count($keep) !== 1) {
    http_response_code(409);
    $payload['ok'] = false;
    $payload['error'] = 'keep_mismatch';
    $payload['message'] = '남길 공부방 이름이 정확히 1개가 아니라서 적용하지 않았습니다.';
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

$keepId = (int) $keep[0]['id'];
$toRemove = array_values(array_filter($alive, static fn (array $r): bool => (int) $r['id'] !== $keepId));

$upd = $pdo->prepare(
    'UPDATE study_rooms
     SET deleted_at = NOW(), profile_status = "hidden", updated_at = NOW()
     WHERE deleted_at IS NULL AND id = ?'
);
$removed = [];
foreach ($toRemove as $row) {
    $upd->execute([(int) $row['id']]);
    $removed[] = [
        'id' => (int) $row['id'],
        'user_id' => (int) $row['user_id'],
        'study_room_name' => (string) $row['study_room_name'],
        'profile_status' => (string) $row['profile_status'],
    ];
}

@mkdir(dirname($lockPath), 0775, true);
file_put_contents(
    $lockPath,
    json_encode(
        ['kept_id' => $keepId, 'removed' => $removed, 'at' => date('c')],
        JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
    )
);

$payload['applied'] = true;
$payload['kept_id'] = $keepId;
$payload['removed'] = $removed;
$payload['removed_count'] = count($removed);

echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
