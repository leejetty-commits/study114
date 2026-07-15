<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\FindIdService;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'POST만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');

$input = json_decode(file_get_contents('php://input') ?: '{}', true);
$name = is_array($input) ? (string) ($input['name'] ?? '') : '';
$phone = is_array($input) ? (string) ($input['phone'] ?? '') : '';

try {
    // 단순 세션 레이트리밋 (분당 8회) — 이름·번호 스크래핑 완화
    AuthSession::start();
    $bucket = 'find_id_' . date('YmdHi');
    $count = (int) ($_SESSION[$bucket] ?? 0);
    if ($count >= 8) {
        http_response_code(429);
        echo json_encode([
            'ok'      => false,
            'message' => '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $_SESSION[$bucket] = $count + 1;

    $result = (new FindIdService())->findByNameAndPhone($name, $phone);
    echo json_encode($result, JSON_UNESCAPED_UNICODE);
} catch (InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode([
        'ok'      => false,
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[auth/find-id] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok'      => false,
        'message' => '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    ], JSON_UNESCAPED_UNICODE);
}
