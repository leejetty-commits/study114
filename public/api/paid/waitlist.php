<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Paid\PaidApi;
use Study114\Paid\ProviderWaitlistService;

PaidApi::bootstrap();

PaidApi::run(static function (): void {
    $auth = PaidApi::requireProvider();
    $userId = (int) $auth['user_id'];
    $method = PaidApi::method();
    $service = new ProviderWaitlistService(Connection::get());

    if ($method === 'GET') {
        $studyRoomId = (int) ($_GET['study_room_id'] ?? $_GET['provider_id'] ?? 0);
        if ($studyRoomId <= 0) {
            PaidApi::fail(422, 'validation', 'study_room_id가 필요합니다.');
        }
        PaidApi::ok($service->listMine($userId, $studyRoomId));
    }

    if ($method !== 'POST') {
        PaidApi::fail(405, 'method_not_allowed', 'GET · POST만 허용됩니다.');
    }

    $input = PaidApi::readJson();
    $action = trim((string) ($input['action'] ?? 'register'));
    $studyRoomId = (int) ($input['study_room_id'] ?? $input['provider_id'] ?? 0);
    if ($studyRoomId <= 0) {
        PaidApi::fail(422, 'validation', 'study_room_id가 필요합니다.');
    }

    // 과외쌤·Pick 대기 요청 차단
    $providerType = trim((string) ($input['provider_type'] ?? 'study_room'));
    if ($providerType !== '' && $providerType !== 'study_room') {
        PaidApi::fail(422, 'validation', '예약대기는 공부방 Prime에만 사용할 수 있습니다.');
    }
    $exposureType = trim((string) ($input['exposure_type'] ?? 'prime'));
    if ($exposureType !== '' && $exposureType !== 'prime') {
        PaidApi::fail(422, 'validation', '예약대기는 공부방 Prime에만 사용할 수 있습니다.');
    }

    if ($action === 'cancel') {
        $waitlistId = (int) ($input['waitlist_id'] ?? $input['id'] ?? 0);
        if ($waitlistId <= 0) {
            PaidApi::fail(422, 'validation', 'waitlist_id가 필요합니다.');
        }
        PaidApi::ok($service->cancel($userId, $studyRoomId, $waitlistId));
    }

    if ($action !== 'register') {
        PaidApi::fail(422, 'validation', 'action은 register | cancel 만 허용합니다.');
    }

    PaidApi::ok($service->register($userId, $studyRoomId, $input));
});
