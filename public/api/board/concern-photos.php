<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Auth\EmailVerificationGate;
use Study114\Board\BoardAccessException;
use Study114\Board\BoardApi;
use Study114\Board\BoardAttachmentService;
use Study114\Board\BoardChannelAcl;

$fileKey = trim((string) ($_GET['file'] ?? ''));
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET' && $fileKey !== '') {
    try {
        $boardKey = trim((string) ($_GET['board_key'] ?? ''));
        $postKey = trim((string) ($_GET['post_key'] ?? ''));
        $auth = (new EmailVerificationGate())->optionalVerifiedUser(AuthSession::user());
        $boardRole = BoardChannelAcl::boardRoleFromAuth($auth);
        if (!BoardChannelAcl::isConcern($boardKey) || !BoardChannelAcl::canDetail($boardKey, $boardRole)) {
            http_response_code(403);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['ok' => false, 'error' => 'forbidden', 'message' => '이 글의 사진을 볼 수 없어요.'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        (new BoardAttachmentService())->streamConcernPhoto($boardKey, $postKey, $fileKey);
    } catch (InvalidArgumentException $e) {
        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'not_found', 'message' => '사진을 찾을 수 없어요.'], JSON_UNESCAPED_UNICODE);
        exit;
    } catch (Throwable $e) {
        error_log('[concern-photo] ' . $e->getMessage());
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'server_error', 'message' => '사진을 불러오지 못했어요.'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

BoardApi::bootstrap();

BoardApi::run(static function () use ($method): void {
    $service = new BoardAttachmentService();

    if ($method === 'GET') {
        $auth = BoardApi::optionalVerifiedAuth();
        $boardRole = BoardChannelAcl::boardRoleFromAuth($auth);
        $boardKey = (string) BoardApi::queryString('board_key', '');
        $postKey = (string) BoardApi::queryString('post_key', '');
        if (!BoardChannelAcl::isConcern($boardKey) || !BoardChannelAcl::canDetail($boardKey, $boardRole)) {
            throw new BoardAccessException(403, 'forbidden', '이 글의 사진을 볼 수 없어요.');
        }
        BoardApi::ok(['photos' => $service->listConcernPhotos($boardKey, $postKey)]);
    }

    $auth = BoardApi::requireAuth();
    $boardRole = BoardChannelAcl::boardRoleFromAuth($auth);

    if ($method === 'POST') {
        $boardKey = trim((string) ($_POST['board_key'] ?? ''));
        $postKey = trim((string) ($_POST['post_key'] ?? ''));
        if (!BoardChannelAcl::isConcern($boardKey) || !BoardChannelAcl::canCompose($boardKey, $boardRole)) {
            throw new BoardAccessException(403, 'forbidden', '이 글에 사진을 올릴 수 없어요.');
        }
        if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
            BoardApi::fail(422, 'validation', '사진을 골라 주세요.');
        }
        /** @var array<string, mixed> $file */
        $file = $_FILES['file'];
        $photo = $service->uploadConcernPhoto($boardKey, $postKey, $file, (int) ($auth['user_id'] ?? 0));
        BoardApi::ok(['photo' => $photo]);
    }

    if ($method === 'DELETE') {
        $boardKey = (string) BoardApi::queryString('board_key', '');
        $postKey = (string) BoardApi::queryString('post_key', '');
        $file = (string) BoardApi::queryString('file', '');
        if (!BoardChannelAcl::isConcern($boardKey) || !BoardChannelAcl::canCompose($boardKey, $boardRole)) {
            throw new BoardAccessException(403, 'forbidden', '이 글의 사진을 지울 수 없어요.');
        }
        $service->deleteConcernPhoto($boardKey, $postKey, $file, (int) ($auth['user_id'] ?? 0));
        BoardApi::ok();
    }

    BoardApi::fail(405, 'method_not_allowed', '이 방법으로는 사진을 다룰 수 없어요.');
});
