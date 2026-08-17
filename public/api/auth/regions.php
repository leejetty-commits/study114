<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use InvalidArgumentException;
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

    if ($action === 'ensure') {
        $region = RegionEnsure::fromKakao(Connection::get(), $input);
        study114_regions_json([
            'ok' => true,
            'region' => $region,
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
    $warnings = [];

    try {
        $cities = $service->listCities();
    } catch (Throwable $e) {
        error_log('[regions] cities: ' . $e->getMessage());
        $warnings[] = 'cities';
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
    ]);
}
