<?php

declare(strict_types=1);

/**
 * GET /api/auth/password/validate-token.php?token=…
 *
 * Response contract (fixed — do not conflate ok with token validity):
 * - ok: true  → API call succeeded; inspect status for token state.
 * - ok: false → transport/handler failure only.
 * - status: valid | invalid | expired | used → business token state when ok is true.
 */

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\PasswordResetService;

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'GET만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

header('Access-Control-Allow-Origin: *');

$token = (string) ($_GET['token'] ?? '');
$status = (new PasswordResetService())->inspectResetToken($token);

echo json_encode([
    'ok'     => true,
    'status' => $status,
], JSON_UNESCAPED_UNICODE);
