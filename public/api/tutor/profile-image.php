<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\EmailVerificationGate;
use Study114\Auth\EmailVerificationRequiredException;
use Study114\Media\TutorProfileImageService;

header('Content-Type: application/json; charset=utf-8');

/**
 * 닷홈 ErrorDocument가 4xx/5xx 본문을 HTML로 덮어써서
 * 클라이언트가 JSON 메시지를 못 읽는 경우를 피한다. 상태는 ok 필드로 전달.
 */
function tutor_profile_image_json(array $payload, int $httpHint = 200): void
{
    // httpHint는 로깅용. 응답 코드는 항상 200 유지.
    if ($httpHint >= 400) {
        error_log('[tutor-profile-image] httpHint=' . $httpHint . ' ' . ($payload['message'] ?? ''));
    }
    http_response_code(200);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    study114_send_cors_headers();
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

study114_send_cors_headers();

try {
    $user = AuthSession::user();
    if ($user === null) {
        tutor_profile_image_json([
            'ok' => false,
            'error' => 'unauthenticated',
            'message' => '로그인이 필요합니다.',
        ], 401);
    }

    try {
        (new EmailVerificationGate())->assertVerified((int) $user['user_id']);
    } catch (EmailVerificationRequiredException $e) {
        tutor_profile_image_json([
            'ok' => false,
            'error' => 'email_verify_required',
            'message' => $e->getMessage(),
        ], 403);
    }

    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if ($method !== 'POST') {
        tutor_profile_image_json([
            'ok' => false,
            'error' => 'method_not_allowed',
            'message' => 'POST만 허용됩니다.',
        ], 405);
    }

    $input = [];
    if (empty($_FILES) && empty($_POST)) {
        $json = json_decode(file_get_contents('php://input') ?: '{}', true);
        $input = is_array($json) ? $json : [];
    } else {
        $input = $_POST;
    }

    $action = (string) ($input['action'] ?? '');
    if ($action === '' && isset($_FILES['file'])) {
        $action = 'upload';
    }

    $service = new TutorProfileImageService();
    $userId = (int) $user['user_id'];

    if ($action === 'upload') {
        $tutorId = (int) ($input['tutor_id'] ?? 0);
        if ($tutorId < 1 || !isset($_FILES['file']) || !is_array($_FILES['file'])) {
            throw new InvalidArgumentException('과외 프로필과 사진 파일이 필요합니다.');
        }
        $image = $service->upload(
            $userId,
            $tutorId,
            $_FILES['file'],
            (float) ($input['crop_x'] ?? 0.5),
            (float) ($input['crop_y'] ?? 0.5),
        );
        tutor_profile_image_json(['ok' => true, 'image' => $image]);
    }

    if ($action === 'reorder') {
        // reorder는 JSON body
        if ($input === $_POST && empty($input['image_ids'])) {
            $json = json_decode(file_get_contents('php://input') ?: '{}', true);
            if (is_array($json)) {
                $input = $json;
            }
        }
        $tutorId = (int) ($input['tutor_id'] ?? 0);
        $ids = $input['image_ids'] ?? [];
        if ($tutorId < 1 || !is_array($ids)) {
            throw new InvalidArgumentException('사진 순서 정보가 필요합니다.');
        }
        $images = $service->reorder($userId, $tutorId, array_map('intval', $ids));
        tutor_profile_image_json(['ok' => true, 'images' => $images]);
    }

    if ($action === 'delete') {
        if ($input === $_POST && empty($input['image_id'])) {
            $json = json_decode(file_get_contents('php://input') ?: '{}', true);
            if (is_array($json)) {
                $input = $json;
            }
        }
        $tutorId = (int) ($input['tutor_id'] ?? 0);
        $imageId = (int) ($input['image_id'] ?? 0);
        if ($tutorId < 1 || $imageId < 1) {
            throw new InvalidArgumentException('삭제할 사진이 필요합니다.');
        }
        $service->delete($userId, $tutorId, $imageId);
        tutor_profile_image_json(['ok' => true]);
    }

    if ($action === 'list') {
        if ($input === $_POST && empty($input['tutor_id'])) {
            $json = json_decode(file_get_contents('php://input') ?: '{}', true);
            if (is_array($json)) {
                $input = $json;
            }
        }
        $tutorId = (int) ($input['tutor_id'] ?? 0);
        if ($tutorId < 1) {
            throw new InvalidArgumentException('과외 프로필이 필요합니다.');
        }
        $images = $service->listForTutor($userId, $tutorId);
        tutor_profile_image_json(['ok' => true, 'images' => $images]);
    }

    throw new InvalidArgumentException('알 수 없는 동작입니다.');
} catch (InvalidArgumentException $e) {
    tutor_profile_image_json([
        'ok' => false,
        'error' => 'validation',
        'message' => $e->getMessage(),
    ], 400);
} catch (Throwable $e) {
    error_log('[tutor-profile-image] ' . $e->getMessage() . "\n" . $e->getTraceAsString());
    tutor_profile_image_json([
        'ok' => false,
        'error' => 'server',
        'message' => '사진 처리 중 오류: ' . $e->getMessage(),
    ], 500);
}
