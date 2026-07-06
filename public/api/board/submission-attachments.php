<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Board\BoardApi;
use Study114\Board\BoardAttachmentService;

BoardApi::bootstrap();

BoardApi::run(static function (): void {
    if (BoardApi::method() !== 'POST') {
        BoardApi::fail(405, 'method_not_allowed', 'POST만 허용됩니다.');
    }

    $postKey = trim((string) ($_POST['post_key'] ?? $_POST['id'] ?? ''));
    $authorRole = trim((string) ($_POST['author_role'] ?? ''));
    if ($postKey === '' || $authorRole === '') {
        BoardApi::fail(422, 'validation', 'post_key, author_role가 필요합니다.');
    }
    if (!isset($_FILES['file'])) {
        BoardApi::fail(422, 'validation', 'file이 필요합니다.');
    }

    $service = new BoardAttachmentService();
    /** @var array<string, mixed> $file */
    $file = $_FILES['file'];
    $attachment = $service->uploadSubmission($postKey, $authorRole, $file);
    BoardApi::ok(['attachment' => $attachment]);
});
