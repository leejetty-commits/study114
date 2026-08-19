<?php



declare(strict_types=1);



require_once dirname(__DIR__, 3) . '/src/bootstrap.php';



use Study114\Auth\AuthSession;
use Study114\StudyRoom\StudyRoomRegisterService;



header('Content-Type: application/json; charset=utf-8');



if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {

    study114_send_cors_headers();

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



study114_send_cors_headers();



$raw = file_get_contents('php://input');

/** @var array<string, mixed> $input */

$input = json_decode($raw ?: '{}', true);

if (!is_array($input)) {

    http_response_code(400);

    echo json_encode(['ok' => false, 'error' => 'invalid_json', 'message' => 'JSON 본문이 필요합니다.'], JSON_UNESCAPED_UNICODE);

    exit;

}



$action = (string) ($input['action'] ?? '');

$service = new StudyRoomRegisterService();



try {

    if ($action === 'masters') {

        echo json_encode(['ok' => true, 'masters' => $service->getMasters()], JSON_UNESCAPED_UNICODE);

        exit;

    }



    $auth = AuthSession::user();
    AuthSession::close();

    if ($auth === null) {
        echo json_encode([
            'ok'      => false,
            'error'   => 'unauthenticated',
            'message' => '로그인이 필요합니다. 공부방 계정으로 다시 로그인해 주세요.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }



    $userId = (int) $auth['user_id'];

    try {
        (new \Study114\Auth\EmailVerificationGate())->assertVerified($userId);
    } catch (\Study114\Auth\EmailVerificationRequiredException $e) {
        http_response_code(403);
        echo json_encode([
            'ok'      => false,
            'error'   => 'email_verify_required',
            'message' => $e->getMessage(),
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'load') {

        $roomId = isset($input['study_room_id']) && $input['study_room_id'] !== ''
            ? (int) $input['study_room_id']
            : null;
        $room = $service->loadForUser($userId, $roomId);

        echo json_encode(['ok' => true, 'room' => $room], JSON_UNESCAPED_UNICODE);

        exit;

    }



    if ($action === 'save') {

        $step = (string) ($input['step'] ?? '');

        $roomId = isset($input['study_room_id']) && $input['study_room_id'] !== ''

            ? (int) $input['study_room_id']

            : null;

        /** @var array<string, mixed> $payload */

        $payload = isset($input['payload']) && is_array($input['payload']) ? $input['payload'] : [];



        $result = $service->saveStep($userId, $roomId, $step, $payload);



        echo json_encode(['ok' => true, ...$result], JSON_UNESCAPED_UNICODE);

        exit;

    }



    echo json_encode([
        'ok'      => false,
        'error'   => 'invalid_action',
        'message' => 'action: masters | load | save',
    ], JSON_UNESCAPED_UNICODE);

} catch (\Study114\Auth\EmailVerificationRequiredException $e) {
    http_response_code(403);
    echo json_encode([
        'ok'      => false,
        'error'   => 'email_verify_required',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
} catch (InvalidArgumentException $e) {
    echo json_encode([
        'ok'      => false,
        'error'   => 'validation',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[study-room/register] error: ' . $e->getMessage());
    echo json_encode([
        'ok'      => false,
        'error'   => 'server_error',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}

