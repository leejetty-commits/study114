<?php

declare(strict_types=1);

/**
 * ⚠️ 임시 DB 연결 테스트 — 확인 후 반드시 삭제하세요.
 * URL: /api/health/db.php
 * 삭제 대상: public/api/health/db.php (폴더가 비면 health/ 도 삭제)
 */

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'GET only'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $cfg = study114_config('database');
    $pdo = Study114\Database\Connection::get();
    $version = $pdo->query('SELECT VERSION()')->fetchColumn();
    $dbName = $pdo->query('SELECT DATABASE()')->fetchColumn();

    $hasZip = (bool) $pdo->query("SHOW COLUMNS FROM study_rooms LIKE 'address_zip'")->fetch();
    $hasRegionZip = (bool) $pdo->query("SHOW COLUMNS FROM study_room_regions LIKE 'address_zip'")->fetch();
    $inqDef = $pdo->query("SHOW COLUMNS FROM study_rooms LIKE 'inquiry_status'")->fetch(PDO::FETCH_ASSOC);

    $payload = [
        'ok'        => true,
        'message'   => 'DB connection successful — 이 파일은 삭제하세요.',
        'database'  => $dbName,
        'version'   => $version,
        'host'      => $cfg['host'],
        'charset'   => $cfg['charset'],
        'checked_at'=> gmdate('c'),
        'schema'    => [
            'study_rooms.address_zip' => $hasZip,
            'study_room_regions.address_zip' => $hasRegionZip,
            'inquiry_status_default' => $inqDef['Default'] ?? null,
        ],
    ];

    // Optional room dump — requires STUDY114_MAIL_PROBE_KEY
    $expected = study114_env('STUDY114_MAIL_PROBE_KEY', '');
    $key = (string) ($_GET['key'] ?? '');
    $email = trim((string) ($_GET['email'] ?? ''));
    if ($email !== '' && $expected !== '' && hash_equals($expected, $key)) {
        $u = $pdo->prepare('SELECT id, email, role_type FROM users WHERE email = ? LIMIT 1');
        $u->execute([$email]);
        $user = $u->fetch(PDO::FETCH_ASSOC);
        if (!$user) {
            $payload['room_diag'] = ['ok' => false, 'error' => 'user_not_found'];
        } else {
            $uid = (int) $user['id'];
            $cols = 'id, study_room_name, profile_status, detail_completion_status, inquiry_status,
                lesson_place_type, main_subject_note, slogan, region_id, complex_id, region_basis_type,
                address_text, address_line2, contact_time_note, intro_short, intro_long';
            if ($hasZip) {
                $cols .= ', address_zip';
            }
            $rooms = $pdo->prepare("SELECT {$cols} FROM study_rooms WHERE user_id = ? AND deleted_at IS NULL");
            $rooms->execute([$uid]);
            $hub = new Study114\Registration\StudyRoomHubService();
            $reg = new Study114\StudyRoom\StudyRoomRegisterService();
            $out = [];
            foreach ($rooms->fetchAll(PDO::FETCH_ASSOC) as $r) {
                $rid = (int) $r['id'];
                $regs = $pdo->prepare('SELECT * FROM study_room_regions WHERE study_room_id = ? ORDER BY slot');
                $regs->execute([$rid]);
                $hubRow = $hub->get($uid, $rid);
                $hydrated = $reg->loadForUser($uid, $rid);
                $candidates = [];
                foreach (($hubRow['saved_regions'] ?? []) as $s) {
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
                $out[] = [
                    'db' => $r,
                    'db_regions' => $regs->fetchAll(PDO::FETCH_ASSOC),
                    'hub' => [
                        'profile_status' => $hubRow['profile_status'] ?? null,
                        'inquiry_status' => $hubRow['inquiry_status'] ?? null,
                        'detail_completion_status' => $hubRow['detail_completion_status'] ?? null,
                        'region_id' => $hubRow['region_id'] ?? null,
                        'complex_id' => $hubRow['complex_id'] ?? null,
                        'saved_regions' => $hubRow['saved_regions'] ?? null,
                        'contact_method_set' => $hubRow['contact_method_set'] ?? null,
                    ],
                    'hydrate_address' => [
                        'address_text' => $hydrated['address_text'] ?? null,
                        'address_zip' => $hydrated['address_zip'] ?? '__MISSING__',
                        'saved_regions' => $hydrated['saved_regions'] ?? null,
                    ],
                    'positions_candidates' => $candidates,
                    'region_ready' => $candidates !== [],
                ];
            }
            $payload['room_diag'] = ['ok' => true, 'user' => $user, 'rooms' => $out];
        }
    }

    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok'      => false,
        'message' => 'DB connection failed',
        'hint'    => 'config/database.php 호스트·DB명·비밀번호를 확인하세요.',
        'error'   => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
