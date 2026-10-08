<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\BasicRegisterService;
use Study114\Database\Connection;
use Study114\Region\RegionEnsure;

header('Content-Type: application/json; charset=utf-8');
study114_send_cors_headers(false);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

$method = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');
$action = (string) ($_GET['action'] ?? '');
$input = [];
if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw ?: '{}', true);
    if (is_array($decoded)) {
        $input = $decoded;
        if ($action === '') {
            $action = (string) ($input['action'] ?? 'list');
        }
    }
}
if ($action === '') {
    $action = 'list';
}

/**
 * 닷홈 Apache가 4xx/5xx 본문을 HTML 에러 페이지로 바꿔, JSON을 숨긴다.
 * 클라이언트는 HTTP 200 + ok 필드로 성공/실패를 본다.
 */
function study114_regions_json(array $payload): void
{
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
}

try {
    $service = new BasicRegisterService();

    if ($action === 'cities') {
        study114_regions_json([
            'ok' => true,
            'cities' => $service->listCities(),
        ]);
        exit;
    }

    if ($action === 'tutor_units') {
        study114_regions_json([
            'ok' => true,
            'tutor_units' => $service->listTutorUnits(),
        ]);
        exit;
    }

    if ($action === 'ensure') {
        $region = RegionEnsure::fromKakao(Connection::get(), $input);
        study114_regions_json([
            'ok' => true,
            'region' => $region,
        ]);
        exit;
    }

    if ($action === 'complex-by-name') {
        $regionId = (int) ($input['region_id'] ?? $_GET['region_id'] ?? 0);
        $name = trim((string) ($input['name'] ?? $_GET['name'] ?? ''));
        $complex = null;
        if ($regionId > 0 && $name !== '') {
            $stmt = Connection::get()->prepare(
                'SELECT id FROM complexes WHERE region_id = ? AND name = ? AND is_active = 1 LIMIT 1'
            );
            $stmt->execute([$regionId, $name]);
            $id = $stmt->fetchColumn();
            if ($id !== false && $id !== null) {
                $complex = ['id' => (int) $id];
            }
        }
        study114_regions_json([
            'ok' => true,
            'complex' => $complex,
        ]);
        exit;
    }

    if ($method !== 'POST' && $method !== 'GET') {
        study114_regions_json([
            'ok' => false,
            'error' => 'method_not_allowed',
            'message' => 'GET 또는 POST만 허용됩니다.',
        ]);
        exit;
    }

    $cities = [];
    $regions = [];
    $complexes = [];
    $tutorUnits = [];
    $warnings = [];

    try {
        $cities = $service->listCities();
    } catch (Throwable $e) {
        error_log('[regions] cities: ' . $e->getMessage());
        $warnings[] = 'cities';
    }
    try {
        $tutorUnits = $service->listTutorUnits();
    } catch (Throwable $e) {
        error_log('[regions] tutor_units: ' . $e->getMessage());
        $warnings[] = 'tutor_units';
    }
    try {
        $regions = $service->listRegions();
    } catch (Throwable $e) {
        error_log('[regions] regions: ' . $e->getMessage());
        $warnings[] = 'regions';
    }
    try {
        $complexes = $service->listComplexes();
    } catch (Throwable $e) {
        error_log('[regions] complexes: ' . $e->getMessage());
        $warnings[] = 'complexes';
    }

    $payload = [
        'ok' => true,
        'regions' => $regions,
        'complexes' => $complexes,
        'cities' => $cities,
        'tutor_units' => $tutorUnits,
    ];
    if ($warnings) {
        $payload['warnings'] = $warnings;
    }
    study114_regions_json($payload);
} catch (InvalidArgumentException $e) {
    study114_regions_json([
        'ok' => false,
        'error' => 'validation',
        'message' => $e->getMessage(),
    ]);
} catch (Throwable $e) {
    error_log('[regions] error: ' . $e->getMessage());
    study114_regions_json([
        'ok' => false,
        'error' => 'server_error',
        'message' => $e->getMessage(),
        'cities' => [],
        'tutor_units' => [],
    ]);
}
