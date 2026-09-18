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

    $schemaFix = ['attempted' => false, 'errors' => []];
    $probeExpected = study114_env('STUDY114_MAIL_PROBE_KEY', '');
    $probeKey = (string) ($_GET['key'] ?? '');
    $probeOk = $probeExpected !== '' && hash_equals($probeExpected, $probeKey);
    if (isset($_GET['apply_067']) && (string) $_GET['apply_067'] === '1') {
        if (!$probeOk) {
            $schemaFix['attempted'] = true;
            $schemaFix['errors'][] = 'apply_067 requires STUDY114_MAIL_PROBE_KEY';
        } else {
        $schemaFix['attempted'] = true;
        if (!$hasZip) {
            try {
                $pdo->exec(
                    "ALTER TABLE study_rooms ADD COLUMN address_zip VARCHAR(10) NULL COMMENT 'business zip' AFTER address_text"
                );
                $hasZip = true;
                $schemaFix['study_rooms.address_zip'] = 'added';
            } catch (Throwable $e) {
                $schemaFix['errors'][] = 'study_rooms.address_zip: ' . $e->getMessage();
            }
        }
        if (!$hasRegionZip) {
            try {
                $pdo->exec(
                    "ALTER TABLE study_room_regions ADD COLUMN address_zip VARCHAR(10) NULL COMMENT 'region zip' AFTER region_basis_type"
                );
                $hasRegionZip = true;
                $schemaFix['study_room_regions.address_zip'] = 'added';
            } catch (Throwable $e) {
                $schemaFix['errors'][] = 'study_room_regions.address_zip: ' . $e->getMessage();
            }
        }
        try {
            $pdo->exec(
                "ALTER TABLE study_rooms MODIFY COLUMN inquiry_status ENUM('open','paused','capacity_full','waiting_only') NOT NULL DEFAULT 'open'"
            );
            $inqDef = $pdo->query("SHOW COLUMNS FROM study_rooms LIKE 'inquiry_status'")->fetch(PDO::FETCH_ASSOC);
            $schemaFix['inquiry_status_default'] = $inqDef['Default'] ?? null;
        } catch (Throwable $e) {
            $schemaFix['errors'][] = 'inquiry_status default: ' . $e->getMessage();
        }
        } // probeOk
    }

    if (isset($_GET['seed_primary_regions']) && (string) $_GET['seed_primary_regions'] === '1') {
        $schemaFix['seed_primary_regions'] = ['attempted' => true, 'inserted' => 0, 'errors' => []];
        if (!$probeOk) {
            $schemaFix['seed_primary_regions']['errors'][] = 'seed requires STUDY114_MAIL_PROBE_KEY';
        } else {
        try {
            $missing = $pdo->query(
                "SELECT sr.id, sr.region_id, sr.complex_id, sr.region_basis_type, sr.address_zip
                 FROM study_rooms sr
                 LEFT JOIN study_room_regions srr ON srr.study_room_id = sr.id
                 WHERE sr.deleted_at IS NULL
                   AND srr.id IS NULL
                   AND (sr.region_id IS NOT NULL OR sr.complex_id IS NOT NULL)"
            );
            $ins = $pdo->prepare(
                'INSERT INTO study_room_regions (study_room_id, slot, region_id, complex_id, region_basis_type, address_zip, is_primary)
                 VALUES (?, 1, ?, ?, ?, ?, 1)'
            );
            $insLegacy = $pdo->prepare(
                'INSERT INTO study_room_regions (study_room_id, slot, region_id, complex_id, region_basis_type, is_primary)
                 VALUES (?, 1, ?, ?, ?, 1)'
            );
            while ($row = $missing->fetch(PDO::FETCH_ASSOC)) {
                $rid = (int) $row['id'];
                $regionId = isset($row['region_id']) ? (int) $row['region_id'] : 0;
                $complexId = isset($row['complex_id']) && $row['complex_id'] !== null && $row['complex_id'] !== ''
                    ? (int) $row['complex_id'] : null;
                if ($regionId <= 0 && ($complexId === null || $complexId <= 0)) {
                    continue;
                }
                $basis = isset($row['region_basis_type']) && in_array((string) $row['region_basis_type'], ['dong', 'complex'], true)
                    ? (string) $row['region_basis_type']
                    : (($complexId !== null && $complexId > 0) ? 'complex' : 'dong');
                if ($basis === 'dong') {
                    $complexId = null;
                }
                $zip = isset($row['address_zip']) ? (string) $row['address_zip'] : null;
                try {
                    $ins->execute([
                        $rid,
                        $regionId > 0 ? $regionId : null,
                        $complexId,
                        $basis,
                        ($zip !== null && $zip !== '') ? $zip : null,
                    ]);
                    $schemaFix['seed_primary_regions']['inserted']++;
                } catch (Throwable $e1) {
                    try {
                        $insLegacy->execute([
                            $rid,
                            $regionId > 0 ? $regionId : null,
                            $complexId,
                            $basis,
                        ]);
                        $schemaFix['seed_primary_regions']['inserted']++;
                    } catch (Throwable $e2) {
                        $schemaFix['seed_primary_regions']['errors'][] = "room {$rid}: " . $e2->getMessage();
                    }
                }
            }
        } catch (Throwable $e) {
            $schemaFix['seed_primary_regions']['errors'][] = $e->getMessage();
        }
        } // probeOk seed
    }

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
        'schema_fix' => $schemaFix,
    ];

    // Non-secret readiness counts for a single email (no field dumps).
    $emailOnly = trim((string) ($_GET['email'] ?? ''));
    if ($emailOnly !== '' && (!isset($_GET['key']) || (string) $_GET['key'] === '')) {
        $u = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $u->execute([$emailOnly]);
        $uidOnly = (int) ($u->fetchColumn() ?: 0);
        if ($uidOnly <= 0) {
            $payload['email_probe'] = ['exists' => false];
        } else {
            $rooms = $pdo->prepare(
                'SELECT id, region_id, complex_id, profile_status, detail_completion_status, inquiry_status'
                . ($hasZip ? ', address_zip, address_text' : ', NULL AS address_zip, address_text')
                . ' FROM study_rooms WHERE user_id = ? AND deleted_at IS NULL'
            );
            $rooms->execute([$uidOnly]);
            $summary = [];
            foreach ($rooms->fetchAll(PDO::FETCH_ASSOC) as $r) {
                $rid = (int) $r['id'];
                $regs = $pdo->prepare(
                    'SELECT region_id, complex_id, region_basis_type, is_primary FROM study_room_regions WHERE study_room_id = ?'
                );
                $regs->execute([$rid]);
                $regRows = $regs->fetchAll(PDO::FETCH_ASSOC);
                $idReady = 0;
                foreach ($regRows as $rr) {
                    if ((int) ($rr['region_id'] ?? 0) > 0 || (int) ($rr['complex_id'] ?? 0) > 0) {
                        $idReady++;
                    }
                }
                $topReady = (int) ($r['region_id'] ?? 0) > 0 || (int) ($r['complex_id'] ?? 0) > 0;
                $summary[] = [
                    'study_room_id' => $rid,
                    'profile_status' => (string) ($r['profile_status'] ?? ''),
                    'detail_completion_status' => (string) ($r['detail_completion_status'] ?? ''),
                    'inquiry_status' => (string) ($r['inquiry_status'] ?? ''),
                    'top_region_id_set' => (int) ($r['region_id'] ?? 0) > 0,
                    'top_complex_id_set' => (int) ($r['complex_id'] ?? 0) > 0,
                    'address_text_set' => trim((string) ($r['address_text'] ?? '')) !== '',
                    'address_zip_set' => trim((string) ($r['address_zip'] ?? '')) !== '',
                    'study_room_regions_rows' => count($regRows),
                    'study_room_regions_with_id' => $idReady,
                    'positions_region_ready' => $idReady > 0 || $topReady,
                ];
            }
            $payload['email_probe'] = ['exists' => true, 'rooms' => $summary];
        }
    }

    // Optional room dump — requires STUDY114_MAIL_PROBE_KEY
    $expected = study114_env('STUDY114_MAIL_PROBE_KEY', '');
    $key = (string) ($_GET['key'] ?? '');
    $email = trim((string) ($_GET['email'] ?? ''));
    if ($email !== '' && $expected !== '' && $key !== '' && hash_equals($expected, $key)) {
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
