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
$named = [];
foreach ($all as $row) {
    if ($row['deleted_at'] !== null && $row['deleted_at'] !== '') {
        continue;
    }
    $alive[] = $row;
    if (trim((string) $row['study_room_name']) === $keepName) {
        $named[] = $row;
    }
}

usort($named, static function (array $a, array $b): int {
    return strcmp((string) $b['updated_at'], (string) $a['updated_at']);
});
$keepRow = $named[0] ?? null;
$keepUserId = $keepRow !== null ? (int) $keepRow['user_id'] : 0;
$keepId = $keepRow !== null ? (int) $keepRow['id'] : 0;

$sameUser = [];
$toRemove = [];
if ($keepUserId > 0) {
    foreach ($alive as $row) {
        if ((int) $row['user_id'] !== $keepUserId) {
            continue;
        }
        $sameUser[] = $row;
        if ((int) $row['id'] !== $keepId) {
            $toRemove[] = $row;
        }
    }
}

$payload = [
    'ok' => true,
    'keep_name' => $keepName,
    'alive_count' => count($alive),
    'named_count' => count($named),
    'keep' => $keepRow,
    'same_user' => $sameUser,
    'to_remove' => $toRemove,
    'applied' => false,
    'already_locked' => is_file($lockPath),
    'note' => '같은 계정에서 이름이 우동공과 대치점인 행 중 가장 최근 수정본만 남깁니다. 다른 계정 시드는 건드리지 않습니다.',
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

if ($keepRow === null || $keepId < 1) {
    http_response_code(409);
    $payload['ok'] = false;
    $payload['error'] = 'keep_missing';
    $payload['message'] = '남길 공부방 이름을 찾지 못해 적용하지 않았습니다.';
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

$upd = $pdo->prepare(
    'UPDATE study_rooms
     SET deleted_at = NOW(), profile_status = "hidden", updated_at = NOW()
     WHERE deleted_at IS NULL AND id = ? AND user_id = ?'
);
$removed = [];
foreach ($toRemove as $row) {
    $upd->execute([(int) $row['id'], $keepUserId]);
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
