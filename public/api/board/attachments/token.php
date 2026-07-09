<?php



declare(strict_types=1);



require_once dirname(__DIR__, 4) . '/src/bootstrap.php';



use Study114\Auth\AuthSession;

use Study114\Board\BoardApi;

use Study114\Board\BoardAttachmentService;



BoardApi::bootstrap();



BoardApi::run(static function (): void {

    if (BoardApi::method() !== 'POST') {

        BoardApi::fail(405, 'method_not_allowed', 'POST만 허용됩니다.');

    }



    $input = BoardApi::readJson();

    $postKey = trim((string) ($input['post_key'] ?? $input['id'] ?? ''));

    $audience = trim((string) ($input['audience'] ?? 'owner'));

    $authorRole = trim((string) ($input['author_role'] ?? $input['authorRole'] ?? ''));



    if ($postKey === '') {

        BoardApi::fail(422, 'validation', 'post_key가 필요합니다.');

    }



    $operatorId = null;

    if ($audience === 'admin') {

        $auth = AuthSession::user();

        if ($auth === null) {

            BoardApi::fail(401, 'unauthorized', '로그인이 필요합니다.');

        }

        if (($auth['role_type'] ?? '') !== 'admin') {

            BoardApi::fail(403, 'forbidden', '운영자 권한이 필요합니다.');

        }

        $operatorId = (string) $auth['email'];

    }



    $service = new BoardAttachmentService();

    $token = $service->issueDownloadToken(

        $postKey,

        $audience === 'admin' ? 'admin' : 'owner',

        $authorRole !== '' ? $authorRole : null,

        $operatorId,

    );

    BoardApi::ok($token);

});

