<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\EmailVerificationGate;
use Study114\Auth\EmailVerificationRequiredException;
use Study114\Media\TutorProfileImageService;

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

try {
    (new EmailVerificationGate())->assertVerified((int) $user['user_id']);
} catch (EmailVerificationRequiredException $e) {
    http_response_code(403);
    echo json_encode([
        'ok' => false,
        'error' => 'email_verify_required',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'POST만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$json = json_decode(file_get_contents('php://input') ?: '{}', true);
$input = is_array($json) ? $json : [];
$action = (string) ($_POST['action'] ?? $input['action'] ?? '');
if ($action === '' && isset($_FILES['file'])) {
    $action = 'upload';
}

$service = new TutorProfileImageService();
$userId = (int) $user['user_id'];

try {
    if ($action === 'upload') {
        $tutorId = (int) ($_POST['tutor_id'] ?? $input['tutor_id'] ?? 0);
        if ($tutorId < 1 || !isset($_FILES['file']) || !is_array($_FILES['file'])) {
            throw new InvalidArgumentException('과외 프로필과 사진 파일이 필요합니다.');
        }
        $image = $service->upload(
            $userId,
            $tutorId,
            $_FILES['file'],
            (float) ($_POST['crop_x'] ?? 0.5),
            (float) ($_POST['crop_y'] ?? 0.5),
        );
        echo json_encode(['ok' => true, 'image' => $image], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'reorder') {
        $tutorId = (int) ($input['tutor_id'] ?? 0);
        $ids = $input['image_ids'] ?? [];
        if ($tutorId < 1 || !is_array($ids)) {
            throw new InvalidArgumentException('사진 순서 정보가 필요합니다.');
        }
        $images = $service->reorder($userId, $tutorId, array_map('intval', $ids));
        echo json_encode(['ok' => true, 'images' => $images], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'delete') {
        $tutorId = (int) ($input['tutor_id'] ?? 0);
        $imageId = (int) ($input['image_id'] ?? 0);
        if ($tutorId < 1 || $imageId < 1) {
            throw new InvalidArgumentException('삭제할 사진이 필요합니다.');
        }
        $service->delete($userId, $tutorId, $imageId);
        echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'list') {
        $tutorId = (int) ($input['tutor_id'] ?? 0);
        if ($tutorId < 1) {
            throw new InvalidArgumentException('과외 프로필이 필요합니다.');
        }
        $images = $service->listForTutor($userId, $tutorId);
        echo json_encode(['ok' => true, 'images' => $images], JSON_UNESCAPED_UNICODE);
        exit;
    }

    throw new InvalidArgumentException('알 수 없는 동작입니다.');
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'validation', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[tutor-profile-image] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server', 'message' => '사진 처리 중 오류가 발생했습니다.'], JSON_UNESCAPED_UNICODE);
}
