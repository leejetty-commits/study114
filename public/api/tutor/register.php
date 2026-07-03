<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Tutor\TutorRegisterService;

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
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'POST만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . ($origin !== '' ? $origin : '*'));
header('Access-Control-Allow-Credentials: true');

$raw = file_get_contents('php://input');
/** @var array<string, mixed> $input */
$input = json_decode($raw ?: '{}', true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_json', 'message' => 'JSON 본문이 필요합니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$action = (string) ($input['action'] ?? '');
$service = new TutorRegisterService();

try {
    if ($action === 'masters') {
        echo json_encode(['ok' => true, 'masters' => $service->getMasters()], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $auth = AuthSession::user();
    if ($auth === null) {
        http_response_code(401);
        echo json_encode([
            'ok'      => false,
            'error'   => 'unauthenticated',
            'message' => '로그인이 필요합니다. (tutor-owner1@dev.local / password)',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $userId = (int) $auth['user_id'];

    if ($action === 'load') {
        echo json_encode(['ok' => true, 'tutor' => $service->loadForUser($userId)], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'save') {
        $step = (string) ($input['step'] ?? '');
        $tutorId = isset($input['tutor_id']) && $input['tutor_id'] !== ''
            ? (int) $input['tutor_id']
            : null;
        /** @var array<string, mixed> $payload */
        $payload = isset($input['payload']) && is_array($input['payload']) ? $input['payload'] : [];

        $result = $service->saveStep($userId, $tutorId, $step, $payload);

        echo json_encode(['ok' => true, ...$result], JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(400);
    echo json_encode([
        'ok'      => false,
        'error'   => 'invalid_action',
        'message' => 'action: masters | load | save',
    ], JSON_UNESCAPED_UNICODE);
} catch (InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode([
        'ok'      => false,
        'error'   => 'validation',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[tutor/register] error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok'      => false,
        'error'   => 'server_error',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
