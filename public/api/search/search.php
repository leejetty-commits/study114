<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Paid\StudentRequestTextAccess;
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

$raw = file_get_contents('php://input');
/** @var array<string, mixed> $input */
$input = json_decode($raw ?: '{}', true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_json', 'message' => 'JSON 본문이 필요합니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$tab = isset($input['tab']) ? (string) $input['tab'] : '';
/** @var array<string, mixed> $filters */
$filters = isset($input['filters']) && is_array($input['filters']) ? $input['filters'] : [];
$page = isset($input['page']) ? (int) $input['page'] : 1;
$limit = isset($input['limit']) ? (int) $input['limit'] : 20;

$sort = isset($input['sort']) ? (string) $input['sort'] : 'latest';

try {
    $authUser = null;
    $sessionCookie = session_name();
    $hasSession = session_status() === PHP_SESSION_ACTIVE
        || (isset($_COOKIE[$sessionCookie]) && $_COOKIE[$sessionCookie] !== '');
    if ($hasSession) {
        $auth = AuthSession::user();
        AuthSession::close();
        if (is_array($auth) && (int) ($auth['user_id'] ?? 0) > 0) {
            $authUser = $auth;
        }
    }

    $service = new SearchService();

    // 비로그인: 게스트 기준 지역(공부방 대치동 · 과외쌤·학생 서울시 강남구) 밖의 카드는 응답하지 않는다.
    if ($authUser === null) {
        $scoped = $service->guestScopedFilters($tab, $filters);
        if ($scoped === null) {
            echo json_encode([
                'ok'    => true,
                'tab'   => $tab,
                'sort'  => $sort,
                'total' => 0,
                'rows'  => [],
                'items' => [],
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $filters = $scoped;
    }

    $includeStudentRequestText = false;
    if ($tab === 'student' && $authUser !== null) {
        $includeStudentRequestText = (new StudentRequestTextAccess())->canReceive(
            (int) $authUser['user_id'],
            (string) ($authUser['role_type'] ?? '')
        );
    }

    $result = $service->search($tab, $filters, $page, $limit, $sort, $includeStudentRequestText);

    echo json_encode([
        'ok'    => true,
        'tab'   => $result['tab'],
        'sort'  => $result['sort'] ?? $sort,
        'total' => $result['total'],
        'rows'  => $result['rows'],
        'items' => $result['items'],
    ], JSON_UNESCAPED_UNICODE);
} catch (InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode([
        'ok'      => false,
        'error'   => 'validation',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[search] error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok'      => false,
        'error'   => 'server_error',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
