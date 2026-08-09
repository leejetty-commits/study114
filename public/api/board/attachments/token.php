<?php

declare(strict_types=1);

require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

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

    $input = BoardApi::readJson();
    $postKey = trim((string) ($input['post_key'] ?? $input['id'] ?? ''));
    $audience = trim((string) ($input['audience'] ?? 'owner'));

    if ($postKey === '') {
        BoardApi::fail(422, 'validation', 'post_key가 필요합니다.');
    }

    $boardRole = BoardChannelAcl::boardRoleFromAuth($auth);
    if (!BoardChannelAcl::canDownload('submission', $boardRole) && ($auth['role_type'] ?? '') !== 'admin') {
        BoardApi::fail(403, 'forbidden', '제출함 첨부 권한이 없습니다.');
    }

    $operatorId = null;
    $authorRole = null;

    if ($audience === 'admin') {
        if (($auth['role_type'] ?? '') !== 'admin' && empty($auth['admin_level'])) {
            BoardApi::fail(403, 'forbidden', '운영자 권한이 필요합니다.');
        }
        $operatorId = (string) $auth['email'];
    } else {
        $roleType = (string) ($auth['role_type'] ?? '');
        if ($roleType === 'study_room') {
            $authorRole = 'study_room';
        } elseif ($roleType === 'tutor') {
            $authorRole = 'tutor';
        } elseif ($roleType === 'admin') {
            $authorRole = 'admin';
        } else {
            BoardApi::fail(403, 'forbidden', '제출함은 공부방·과외쌤만 이용할 수 있습니다.');
        }
    }

    $service = new BoardAttachmentService();
    $token = $service->issueDownloadToken(
        $postKey,
        $audience === 'admin' ? 'admin' : 'owner',
        $authorRole,
        $operatorId,
    );
    BoardApi::ok($token);
});
