<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\PasswordResetService;

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
$email = is_array($input) ? (string) ($input['email'] ?? '') : '';

$message = '입력한 이메일로 비밀번호 재설정 안내를 보냈습니다. 잠시 후 메일함을 확인해 주세요.';

try {
    $result = (new PasswordResetService())->requestReset($email);
    $payload = [
        'ok'      => true,
        'message' => $message,
    ];
    if ($result['resend_available_in'] > 0) {
        $payload['resend_available_in'] = $result['resend_available_in'];
    }
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[password/forgot] ' . $e->getMessage());
    echo json_encode([
        'ok'      => true,
        'message' => $message,
    ], JSON_UNESCAPED_UNICODE);
}
