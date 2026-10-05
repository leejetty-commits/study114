<?php

declare(strict_types=1);

/**
 * 게스트 지도 박스 live COUNT.
 *
 * POST /api/search/region-stats.php
 * req: {}
 *   축은 서버 고정. 본문 지역값은 받지 않는다.
 *   공부방: 서울 강남구 대치동 동 행 id — 이름 또는 dong_code 11680101(개발 시드)·1168010600(법정동코드)
 *     매칭은 홍보 study_room_regions.region_id (슬롯 1·2·3). RegionGuLink::guestBaseDongId()
 *   과외쌤: official_code 1168000000 이고 is_selectable=1 인 행 id (tutor_regions.region_id)
 *   학생: 그 구 id(preferred_tutor_region_id) 또는 그 구 소속 동 id(preferred_studyroom_region_id)
 *   각 축은 기존 목록 노출 조건의 total (유료만 아님).
 *   axes 문자열은 그 행의 dong_name / sigungu_name. 기준 행이 없으면 빈 문자열.
 *   regionIds 는 같은 기준 행 id. 게스트 목록이 search.php 필터
 *   (region_id / tutor_region_id / preferred_region_id)로 그대로 보낸다. 기준 행이 없으면 null.
 * res 200:
 *   { "ok": true, "studyRooms": 0, "tutors": 0, "studentRequests": 0,
 *     "axes": { "room": "", "tutor": "", "student": "" },
 *     "regionIds": { "room": null, "tutor": null, "student": null } }
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
        'regionIds' => $counts['regionIds'],
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
