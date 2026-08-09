<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Board\BoardApi;
use Study114\Board\BoardAttachmentService;
use Study114\Board\BoardChannelAcl;

BoardApi::bootstrap();

BoardApi::run(static function (): void {
    if (BoardApi::method() !== 'POST') {
        BoardApi::fail(405, 'method_not_allowed', 'POST만 허용됩니다.');
    }

    $auth = AuthSession::user();
    if ($auth === null) {
        BoardApi::fail(401, 'unauthorized', '로그인이 필요합니다.');
    }

    $boardRole = BoardChannelAcl::boardRoleFromAuth($auth);
    if (!BoardChannelAcl::canCompose('submission', $boardRole)) {
        BoardApi::fail(403, 'forbidden', '제출함은 공부방·과외쌤만 이용할 수 있습니다.');
    }

    $postKey = trim((string) ($_POST['post_key'] ?? $_POST['id'] ?? ''));
    if ($postKey === '') {
        BoardApi::fail(422, 'validation', 'post_key가 필요합니다.');
    }
    if (!isset($_FILES['file'])) {
        BoardApi::fail(422, 'validation', 'file이 필요합니다.');
    }

    $roleType = (string) ($auth['role_type'] ?? '');
    $authorRole = $roleType === 'tutor' ? 'tutor' : ($roleType === 'study_room' ? 'study_room' : '');
    if ($authorRole === '') {
        BoardApi::fail(403, 'forbidden', '제출함은 공부방·과외쌤만 이용할 수 있습니다.');
    }

    $service = new BoardAttachmentService();
    /** @var array<string, mixed> $file */
    $file = $_FILES['file'];
    $attachment = $service->uploadSubmission($postKey, $authorRole, $file);
    BoardApi::ok(['attachment' => $attachment]);
});
