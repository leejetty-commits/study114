<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\WithdrawReasonService;
use Study114\Database\Connection;

/**
 * 탈퇴 완료 메일의 「떠나는 이유 알려 주기」 (정본 74 §1-4). 로그인 없음 — 30일 동안 한 번 쓰는 링크 값(t)만 받는다.
 * 닷홈은 4xx 본문을 바꾸므로 쓸 수 없는 링크는 200 + valid/saved=false 로 돌려준다.
 *
 * GET  ?t=           → { ok, valid, role }
 * POST { t, code, note } → { ok, saved }   선택지가 틀리면 422(링크는 쓰지 않음)
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
study114_send_cors_headers(false);

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
if ($method === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

/** @param array<string, mixed> $body */
$send = static function (int $status, array $body): never {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
};

try {
    $service = new WithdrawReasonService(Connection::get());

    if ($method === 'GET') {
        $link = $service->peekLink((string) ($_GET['t'] ?? ''));
        $send(200, ['ok' => true, 'valid' => $link !== null, 'role' => $link['role'] ?? '']);
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input') ?: '{}', true);
        if (!is_array($input)) {
            $input = [];
        }
        $saved = $service->answerLink((string) ($input['t'] ?? ''), $input['code'] ?? null, $input['note'] ?? null);
        if ($saved === null) {
            $send(422, ['ok' => false, 'error' => 'validation', 'message' => '이유를 하나 골라 주세요.']);
        }
        $send(200, ['ok' => true, 'saved' => $saved]);
    }

    $send(405, ['ok' => false, 'error' => 'method_not_allowed', 'message' => 'GET · POST만 허용됩니다.']);
} catch (Throwable $e) {
    error_log('[withdraw-reason] api: ' . $e->getMessage());
    $send(500, ['ok' => false, 'error' => 'server_error', 'message' => '잠시 뒤 다시 시도해 주세요.']);
}
