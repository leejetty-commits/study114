<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\WithdrawReasonService;
use Study114\Database\Connection;
use Study114\Mail\MemberLifecycleMailer;
use Study114\Mail\MemberMailScheduler;

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'POST만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$expected = study114_env('STUDY114_REPORT_CRON_KEY', '');
if ($expected === '' || str_starts_with($expected, '__') || strlen($expected) < 32 || $expected === 'dev-cron-key') {
    http_response_code(503);
    echo json_encode([
        'ok' => false,
        'error' => 'cron_key_unconfigured',
        'message' => 'cron 키가 준비되지 않았습니다.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$given = (string) ($_SERVER['HTTP_X_CRON_KEY'] ?? '');
if ($given === '' || !hash_equals($expected, $given)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'forbidden', 'message' => 'cron key가 올바르지 않습니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = Connection::get();
    // 탈퇴 사유의 회원 번호 1년 보관(정본 74 §1-4) — 메일 발송과 따로, 실패해도 메일은 보낸다
    try {
        $withdrawReasons = (new WithdrawReasonService($pdo))->forgetExpired();
    } catch (Throwable $e) {
        error_log('[cron/member-mail] withdraw reasons: ' . $e->getMessage());
        $withdrawReasons = ['error' => 'failed'];
    }
    $scheduler = new MemberMailScheduler($pdo, new MemberLifecycleMailer($pdo));
    echo json_encode(array_merge(['ok' => true], $scheduler->run(), ['withdraw_reasons' => $withdrawReasons]), JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[cron/member-mail] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error', 'message' => '회원 메일 처리 중 오류가 발생했습니다.'], JSON_UNESCAPED_UNICODE);
}
