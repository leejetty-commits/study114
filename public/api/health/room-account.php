<?php

declare(strict_types=1);

/**
 * Study-room account diagnostics (one-shot after deploy).
 * GET /api/health/room-account.php?email=...&key=STUDY114_MAIL_PROBE_KEY
 */

require dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Registration\StudyRoomHubService;
use Study114\StudyRoom\StudyRoomRegisterService;

header('Content-Type: application/json; charset=utf-8');

$expected = study114_env('STUDY114_MAIL_PROBE_KEY', '');
$key = (string) ($_GET['key'] ?? '');
if ($expected === '' || !hash_equals($expected, $key)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'forbidden'], JSON_UNESCAPED_UNICODE);
    exit;
}

$email = trim((string) ($_GET['email'] ?? 'leejetty+room@gmail.com'));

try {
    $pdo = Connection::get();
    $u = $pdo->prepare('SELECT id, email, role_type FROM users WHERE email = ? LIMIT 1');
    $u->execute([$email]);
    $user = $u->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        echo json_encode(['ok' => false, 'error' => 'user_not_found', 'email' => $email], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $uid = (int) $user['id'];
    $hasZip = (bool) $pdo->query("SHOW COLUMNS FROM study_rooms LIKE 'address_zip'")->fetch();
    $hasRegionZip = (bool) $pdo->query("SHOW COLUMNS FROM study_room_regions LIKE 'address_zip'")->fetch();
    $inqDef = $pdo->query("SHOW COLUMNS FROM study_rooms LIKE 'inquiry_status'")->fetch(PDO::FETCH_ASSOC);

    $rooms = $pdo->prepare(
        'SELECT id, study_room_name, profile_status, detail_completion_status, inquiry_status,
                lesson_place_type, main_subject_note, slogan, region_id, complex_id, region_basis_type,
                address_text, address_line2, contact_time_note, intro_short, intro_long'
        . ($hasZip ? ', address_zip' : '')
        . ' FROM study_rooms WHERE user_id = ? AND deleted_at IS NULL'
    );
    $rooms->execute([$uid]);
    $hub = new StudyRoomHubService();
    $reg = new StudyRoomRegisterService();
    $outRooms = [];
    foreach ($rooms->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $rid = (int) $r['id'];
        $regs = $pdo->prepare('SELECT * FROM study_room_regions WHERE study_room_id = ? ORDER BY slot');
        $regs->execute([$rid]);
        $hubRow = $hub->get($uid, $rid);
        $hydrated = $reg->loadForUser($uid, $rid);
        $candidates = [];
        if (is_array($hubRow) && isset($hubRow['saved_regions']) && is_array($hubRow['saved_regions'])) {
            foreach ($hubRow['saved_regions'] as $s) {
                if (!is_array($s)) {
                    continue;
                }
                $candidates[] = [
                    'region_id' => (string) ($s['region_id'] ?? ''),
                    'complex_id' => (string) ($s['complex_id'] ?? ''),
                    'region_basis_type' => (string) ($s['region_basis_type'] ?? ''),
                    'region_label' => (string) ($s['region_label'] ?? ''),
                ];
            }
        }
        $outRooms[] = [
            'db' => $r,
            'db_regions' => $regs->fetchAll(PDO::FETCH_ASSOC),
            'hub' => [
                'profile_status' => $hubRow['profile_status'] ?? null,
                'inquiry_status' => $hubRow['inquiry_status'] ?? null,
                'detail_completion_status' => $hubRow['detail_completion_status'] ?? null,
                'region_label' => $hubRow['region_label'] ?? null,
                'region_id' => $hubRow['region_id'] ?? null,
                'complex_id' => $hubRow['complex_id'] ?? null,
                'saved_regions' => $hubRow['saved_regions'] ?? null,
                'contact_method_set' => $hubRow['contact_method_set'] ?? null,
                'has_regions' => $hubRow['has_regions'] ?? null,
            ],
            'hydrate_address' => [
                'address_text' => $hydrated['address_text'] ?? null,
                'address_zip' => $hydrated['address_zip'] ?? '__MISSING__',
                'address_line2' => $hydrated['address_line2'] ?? null,
                'home_address' => $hydrated['home_address'] ?? null,
                'home_address_zip' => $hydrated['home_address_zip'] ?? null,
                'saved_regions' => $hydrated['saved_regions'] ?? null,
            ],
            'positions_candidates' => $candidates,
            'region_ready' => $candidates !== [],
        ];
    }

    echo json_encode([
        'ok' => true,
        'user' => $user,
        'schema' => [
            'study_rooms.address_zip' => $hasZip,
            'study_room_regions.address_zip' => $hasRegionZip,
            'inquiry_status_default' => $inqDef['Default'] ?? null,
        ],
        'rooms' => $outRooms,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
