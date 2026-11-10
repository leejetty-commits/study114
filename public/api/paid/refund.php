<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Paid\PaidApi;
use Study114\Paid\RefundService;

PaidApi::bootstrap();

PaidApi::run(static function (): void {
    $auth = PaidApi::requireProvider();
    $userId = (int) $auth['user_id'];
    $method = PaidApi::method();

    $service = new RefundService();

    /* GET  /api/paid/refund.php?order_ref=xxx  → 자격 확인 */
    if ($method === 'GET') {
        $orderRef = trim($_GET['order_ref'] ?? '');
        if ($orderRef === '') {
            PaidApi::fail(400, 'missing_order_ref', 'order_ref가 필요합니다.');
        }
        PaidApi::ok($service->checkEligibility($userId, $orderRef));
    }

    /* POST /api/paid/refund.php  → action=submit | action=withdraw */
    if ($method === 'POST') {
        $body = PaidApi::readJson();
        $action = trim($body['action'] ?? '');
        $orderRef = trim($body['order_ref'] ?? '');
        if ($orderRef === '') {
            PaidApi::fail(400, 'missing_order_ref', 'order_ref가 필요합니다.');
        }

        if ($action === 'submit') {
            $reason = [
                'reason_choice' => trim($body['reason_choice'] ?? ''),
                'detail' => trim($body['detail'] ?? ''),
            ];
            PaidApi::ok($service->submit($userId, $orderRef, $reason));
        }

        if ($action === 'withdraw') {
            $confirmText = trim($body['confirm_text'] ?? '');
            PaidApi::ok($service->withdraw($userId, $orderRef, $confirmText));
        }

        /* 339: 1차 환불 승인 후 남은 PG 금액 추가 부분취소 */
        if ($action === 'pg_partial_cancel') {
            $amountWon = (int) ($body['amount_won'] ?? 0);
            PaidApi::ok($service->cancelPortOneRemaining($userId, $orderRef, $amountWon));
        }

        PaidApi::fail(400, 'invalid_action', "action은 'submit', 'withdraw' 또는 'pg_partial_cancel'입니다.");
    }

    PaidApi::fail(405, 'method_not_allowed', 'GET 또는 POST만 허용됩니다.');
});
