<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Media\PromoImageService;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    study114_send_cors_headers();
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

study114_send_cors_headers();

$user = AuthSession::user();
if ($user === null) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'unauthenticated', 'message' => '로그인이 필요합니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$service = new PromoImageService();
$userId = (int) $user['user_id'];

$json = json_decode(file_get_contents('php://input') ?: '{}', true);
$input = is_array($json) ? $json : [];
$action = (string) ($_POST['action'] ?? $input['action'] ?? '');
if ($action === '' && isset($_FILES['file'])) {
    $action = 'upload';
}
if ($action === '' && $method === 'PATCH') {
    $action = 'recrop';
}
if ($action === '' && $method === 'DELETE') {
    $action = 'delete';
}

try {
    if ($method !== 'POST' && $method !== 'PATCH' && $method !== 'DELETE') {
        http_response_code(405);
        echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'POST만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'upload') {
        $roomId = (int) ($_POST['study_room_id'] ?? $input['study_room_id'] ?? 0);
        if ($roomId < 1 || !isset($_FILES['file']) || !is_array($_FILES['file'])) {
            throw new InvalidArgumentException('공부방과 사진 파일이 필요합니다.');
        }
        $image = $service->uploadForRoom(
            $userId,
            $roomId,
            $_FILES['file'],
            (float) ($_POST['crop_x'] ?? 0.5),
            (float) ($_POST['crop_y'] ?? 0.5),
            (string) ($_POST['image_type'] ?? 'cover'),
            (int) ($_POST['sort_order'] ?? 0),
        );
        echo json_encode(['ok' => true, 'image' => $image], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $roomId = (int) ($input['study_room_id'] ?? $_POST['study_room_id'] ?? 0);
    $imageId = (int) ($input['image_id'] ?? $_POST['image_id'] ?? 0);
    if ($roomId < 1 || $imageId < 1) {
        throw new InvalidArgumentException('study_room_id와 image_id가 필요합니다.');
    }

    if ($action === 'recrop') {
        $image = $service->recrop(
            $userId,
            $roomId,
            $imageId,
            (float) ($input['crop_x'] ?? $_POST['crop_x'] ?? 0.5),
            (float) ($input['crop_y'] ?? $_POST['crop_y'] ?? 0.5),
        );
        echo json_encode(['ok' => true, 'image' => $image], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'delete') {
        $service->delete($userId, $roomId, $imageId);
        echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
        exit;
    }

    throw new InvalidArgumentException('action: upload | recrop | delete');
} catch (InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'validation', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[promo-image] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error', 'message' => '사진 처리 중 오류가 발생했습니다.'], JSON_UNESCAPED_UNICODE);
}
