<?php

declare(strict_types=1);

/**
 * 게스트 지도 박스 live COUNT.
 *
 * POST /api/search/region-stats.php
 * req: {}
 *   축은 서버 고정. 본문 지역값은 받지 않는다.
 *   공부방 region_label=대치동
 *   과외쌤 tutor_region_label=서울시
 *   학생 preferred_region_label=서울시
 *   각 축은 SearchService::search() 목록 필터의 total (유료만 아님).
 * res 200:
 *   { "ok": true, "studyRooms": 0, "tutors": 0, "studentRequests": 0,
 *     "axes": { "room": "대치동", "tutor": "서울시", "student": "서울시" } }
 * res 405: { "ok": false, "error": "method_not_allowed" }
 * res 500: { "ok": false, "error": "server_error", "message": "..." }
 * 실패 시 클라이언트는 더미 숫자를 넣지 않는다.
 */

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Search\SearchService;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    study114_send_cors_headers(false);
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'POST만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

study114_send_cors_headers(false);

try {
    $counts = (new SearchService())->guestAxisCounts();
    echo json_encode([
        'ok' => true,
        'studyRooms' => $counts['studyRooms'],
        'tutors' => $counts['tutors'],
        'studentRequests' => $counts['studentRequests'],
        'axes' => $counts['axes'],
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[region-stats] error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'server_error',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
