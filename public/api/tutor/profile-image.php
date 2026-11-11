<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\EmailVerificationGate;
use Study114\Auth\EmailVerificationRequiredException;
use Study114\Media\PromoImageSpec;
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
            PromoImageSpec::normalizeCropOffset($input['crop_x'] ?? null),
            PromoImageSpec::normalizeCropOffset($input['crop_y'] ?? null),
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
    [$code, $userMsg] = tutor_profile_image_error_parts($e->getMessage(), true);
    error_log('[tutor-profile-image] ' . $code . ' ' . $e->getMessage());
    tutor_profile_image_json([
        'ok' => false,
        'error' => $code,
        'message' => $userMsg,
    ], 400);
} catch (Throwable $e) {
    [$code, $userMsg] = tutor_profile_image_error_parts($e->getMessage(), false);
    error_log('[tutor-profile-image] ' . $code . ' ' . $e->getMessage() . "\n" . $e->getTraceAsString());
    tutor_profile_image_json([
        'ok' => false,
        'error' => $code,
        'message' => $userMsg,
    ], 500);
}

/**
 * @return array{0: string, 1: string}
 */
function tutor_profile_image_error_parts(string $raw, bool $keepPlainValidation): array
{
    $known = ['gd_missing', 'write_failed', 'db_failed', 'too_large', 'bad_type'];
    foreach ($known as $code) {
        if (str_starts_with($raw, $code . ':')) {
            return [$code, tutor_profile_image_user_message($code, $raw)];
        }
    }
    if (str_contains($raw, 'undefined function') && (str_contains($raw, 'image') || str_contains($raw, 'gd'))) {
        return ['gd_missing', tutor_profile_image_user_message('gd_missing', $raw)];
    }
    if ($keepPlainValidation && $raw !== '') {
        return ['validation', $raw];
    }

    return ['server_error', tutor_profile_image_user_message('server_error', $raw)];
}

function tutor_profile_image_user_message(string $code, string $raw): string
{
    return match ($code) {
        'too_large' => '파일이 너무 커요. 4MB 이하로 줄여 주세요.',
        'bad_type' => str_contains($raw, '형식은 아직') || str_contains($raw, 'HEIC')
            ? '이 형식은 아직 지원하지 않아요. JPG나 PNG로 바꿔 올려 주세요.'
            : 'JPG, PNG, WebP 파일만 올릴 수 있어요.',
        'gd_missing' => '지금은 사진을 처리할 수 없어요. 잠시 후 다시 시도해 주세요.',
        'write_failed' => '사진을 저장하지 못했어요. 다시 시도해 주세요.',
        'db_failed' => '사진 정보를 저장하지 못했어요. 다시 시도해 주세요.',
        default => '사진을 처리하지 못했어요. 다시 시도해 주세요.',
    };
}
