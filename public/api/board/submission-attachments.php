<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Board\BoardApi;
use Study114\Board\BoardAttachmentService;
use Study114\Board\BoardChannelAcl;

BoardApi::bootstrap();

BoardApi::run(static function (): void {
    if (BoardApi::method() !== 'POST') {
        BoardApi::fail(405, 'method_not_allowed', 'POST만 허용됩니다.');
    }

    $auth = BoardApi::requireAuth();

    $boardRole = BoardChannelAcl::boardRoleFromAuth($auth);
    if (!BoardChannelAcl::canCompose('submission', $boardRole)) {
        BoardApi::fail(403, 'forbidden', '신뢰·증빙자료 제출은 과외쌤만 이용할 수 있습니다.');
    }

    $postKey = trim((string) ($_POST['post_key'] ?? $_POST['id'] ?? ''));
    if ($postKey === '') {
        BoardApi::fail(422, 'validation', 'post_key가 필요합니다.');
    }
    if (!isset($_FILES['file'])) {
        BoardApi::fail(422, 'validation', 'file이 필요합니다.');
    }

    $roleType = (string) ($auth['role_type'] ?? '');
    $authorRole = $roleType === 'tutor' ? 'tutor' : ($roleType === 'admin' ? 'admin' : '');
    if ($authorRole === '') {
        BoardApi::fail(403, 'forbidden', '신뢰·증빙자료 제출은 과외쌤만 이용할 수 있습니다.');
    }

    $service = new BoardAttachmentService();
    /** @var array<string, mixed> $file */
    $file = $_FILES['file'];
    $attachment = $service->uploadSubmission($postKey, $authorRole, $file, (int) ($auth['user_id'] ?? 0));
    BoardApi::ok(['attachment' => $attachment]);
});
