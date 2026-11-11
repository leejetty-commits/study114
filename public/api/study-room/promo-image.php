<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\EmailVerificationGate;
use Study114\Auth\EmailVerificationRequiredException;
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
            (string) ($_POST['caption'] ?? ''),
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

    if ($action === 'caption') {
        $image = $service->updateCaption(
            $userId,
            $roomId,
            $imageId,
            (string) ($input['caption'] ?? $_POST['caption'] ?? ''),
        );
        echo json_encode(['ok' => true, 'image' => $image], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'delete') {
        $service->delete($userId, $roomId, $imageId);
        echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
        exit;
    }

    throw new InvalidArgumentException('action: upload | recrop | caption | delete');
} catch (InvalidArgumentException $e) {
    [$code, $userMsg] = study114_promo_image_error_parts($e->getMessage(), true);
    error_log('[promo-image] ' . $code . ' ' . $e->getMessage());
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => $code, 'message' => $userMsg], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    [$code, $userMsg] = study114_promo_image_error_parts($e->getMessage(), false);
    error_log('[promo-image] ' . $code . ' ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $code, 'message' => $userMsg], JSON_UNESCAPED_UNICODE);
}

/**
 * @return array{0: string, 1: string} code, user message
 */
function study114_promo_image_error_parts(string $raw, bool $keepPlainValidation): array
{
    $known = ['gd_missing', 'write_failed', 'db_failed', 'too_large', 'bad_type'];
    foreach ($known as $code) {
        if (str_starts_with($raw, $code . ':')) {
            return [$code, study114_promo_image_user_message($code, $raw)];
        }
    }
    if (str_contains($raw, 'undefined function') && (str_contains($raw, 'image') || str_contains($raw, 'gd'))) {
        return ['gd_missing', study114_promo_image_user_message('gd_missing', $raw)];
    }
    if ($keepPlainValidation && $raw !== '') {
        // "too_large: …" 형태가 아니면 기존 검증 문구 유지(픽셀 숫자 문구는 이미 제거됨)
        return ['validation', $raw];
    }

    return ['server_error', study114_promo_image_user_message('server_error', $raw)];
}

function study114_promo_image_user_message(string $code, string $raw): string
{
    return match ($code) {
        'too_large' => '파일이 너무 커요. 4MB 이하로 줄여 주세요.',
        'bad_type' => str_contains($raw, 'HEIC') || str_contains($raw, '형식은 아직')
            ? '이 형식은 아직 지원하지 않아요. JPG나 PNG로 바꿔 올려 주세요.'
            : 'JPG, PNG, WebP 파일만 올릴 수 있어요.',
        'gd_missing' => '지금은 사진을 처리할 수 없어요. 잠시 후 다시 시도해 주세요.',
        'write_failed' => '사진을 저장하지 못했어요. 다시 시도해 주세요.',
        'db_failed' => '사진 정보를 저장하지 못했어요. 다시 시도해 주세요.',
        default => '사진을 처리하지 못했어요. 다시 시도해 주세요.',
    };
}
