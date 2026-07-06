<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Messages\MessagesApi;
use Study114\Messages\MessagesService;

MessagesApi::bootstrap();

MessagesApi::run(static function (): void {
    $service = new MessagesService();
    $auth = MessagesApi::requireAuth();
    $userId = (int) $auth['user_id'];
    $method = MessagesApi::method();

    if ($method === 'GET') {
        $threadId = MessagesApi::queryInt('thread_id');
        if ($threadId > 0) {
            $thread = $service->getThread($userId, $threadId);
            if ($thread === null) {
                MessagesApi::fail(404, 'not_found', '대화를 찾을 수 없습니다.');
            }
            MessagesApi::ok(['thread' => $thread]);
        }

        $countsOnly = MessagesApi::queryString('counts');
        if ($countsOnly === '1') {
            MessagesApi::ok($service->summaryCounts($userId));
        }

        MessagesApi::ok([
            'threads' => $service->listThreads($userId),
        ]);
    }

    if ($method === 'POST') {
        $input = MessagesApi::readJson();
        $action = (string) ($input['action'] ?? 'compose');

        if ($action === 'reply') {
            $threadId = (int) ($input['thread_id'] ?? 0);
            $body = (string) ($input['body'] ?? '');
            if ($threadId <= 0) {
                MessagesApi::fail(422, 'validation', 'thread_id가 필요합니다.');
            }
            $thread = $service->replyMessage($userId, $threadId, $body);
            MessagesApi::ok(['thread' => $thread]);
        }

        $thread = $service->composeMessage($userId, $input);
        MessagesApi::ok(['thread' => $thread]);
    }

    if ($method === 'PATCH') {
        $input = MessagesApi::readJson();
        $action = (string) ($input['action'] ?? 'mark_read');
        $threadId = (int) ($input['thread_id'] ?? MessagesApi::queryInt('thread_id'));

        if ($threadId <= 0) {
            MessagesApi::fail(422, 'validation', 'thread_id가 필요합니다.');
        }

        if ($action === 'mark_read') {
            $service->markThreadRead($userId, $threadId);
            MessagesApi::ok(['read' => true]);
        }

        if ($action === 'archive') {
            $service->archiveThread($userId, $threadId, true);
            MessagesApi::ok(['archived' => true, 'thread' => $service->getThread($userId, $threadId)]);
        }

        if ($action === 'unarchive') {
            $service->archiveThread($userId, $threadId, false);
            MessagesApi::ok(['archived' => false, 'thread' => $service->getThread($userId, $threadId)]);
        }

        if ($action === 'block') {
            $reason = (string) ($input['reason'] ?? '차단됨');
            $service->blockThread($userId, $threadId, $reason);
            MessagesApi::ok(['blocked' => true, 'thread' => $service->getThread($userId, $threadId)]);
        }

        if ($action === 'report') {
            $reason = (string) ($input['reason'] ?? '');
            $service->reportThread($userId, $threadId, $reason);
            MessagesApi::ok(['reported' => true, 'thread' => $service->getThread($userId, $threadId)]);
        }

        MessagesApi::fail(422, 'validation', 'action: mark_read | archive | unarchive | block | report');
    }

    MessagesApi::fail(405, 'method_not_allowed', 'GET · POST · PATCH만 허용됩니다.');
});
