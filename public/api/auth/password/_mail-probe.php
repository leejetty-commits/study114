<?php

declare(strict_types=1);

/**
 * Resend HTTPS API 발송 점검 — 운영자만 사용. 운영 실행은 별도 승인 후.
 *
 * POST /api/auth/password/_mail-probe.php
 * Header: X-Study114-Mail-Probe-Key: <probe key>
 * Body (JSON): {"to":"you@example.com"}
 *
 * probe key·원문 수신 이메일·메일 본문은 응답·로그에 출력하지 않는다.
 */
require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\AuthMailer;
use Study114\Mail\MailAddressMasker;

header('Content-Type: application/json; charset=utf-8');

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'ok' => false,
        'code' => 'method_not_allowed',
        'message' => 'POST only',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$expected = study114_env('STUDY114_MAIL_PROBE_KEY', '');
$key = trim((string) (
    $_SERVER['HTTP_X_STUDY114_MAIL_PROBE_KEY']
    ?? $_SERVER['REDIRECT_HTTP_X_STUDY114_MAIL_PROBE_KEY']
    ?? ''
));

if ($expected === '' || $key === '' || !hash_equals($expected, $key)) {
    http_response_code(403);
    echo json_encode([
        'ok' => false,
        'code' => 'forbidden',
        'message' => 'forbidden',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = file_get_contents('php://input');
$payloadIn = is_string($raw) && $raw !== '' ? json_decode($raw, true) : null;
$to = '';
if (is_array($payloadIn) && isset($payloadIn['to']) && is_string($payloadIn['to'])) {
    $to = trim($payloadIn['to']);
}

if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'code' => 'validation',
        'message' => 'to 이메일이 필요합니다.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$auth = study114_config('auth');
$from = (string) ($auth['mail_from'] ?? '');
$mailer = new AuthMailer();
$subject = '[우동공과] 메일 발송 테스트';
$plain = "이 메일이 도착했다면 Resend HTTPS API 발송이 정상입니다.\nFrom 설정: {$from}\n시간: " . date('c');
$html = '<p>이 메일이 도착했다면 Resend HTTPS API 발송이 정상입니다.</p>'
    . '<p>From: ' . htmlspecialchars($from, ENT_QUOTES, 'UTF-8') . '</p>'
    . '<p>' . htmlspecialchars(date('c'), ENT_QUOTES, 'UTF-8') . '</p>';

try {
    $sent = $mailer->send($to, $subject, $plain, $html);
    $result = $mailer->lastResult();
    $payload = [
        'ok'      => $sent,
        'code'    => $result?->code ?? ($sent ? 'resend_accepted' : 'send_failed'),
        'message' => $sent
            ? '전송 성공. 수신함·스팸함을 확인하세요.'
            : ('전송 실패: ' . ($result?->safeSummary ?? 'unknown')),
        'from'    => $from,
        'to'      => MailAddressMasker::mask($to),
    ];
    if ($sent && $result?->providerMessageId) {
        $payload['message_id'] = $result->providerMessageId;
    }
    if (!$sent) {
        http_response_code(502);
    }
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[mail-probe] send failed (details omitted)');
    http_response_code(500);
    echo json_encode([
        'ok'      => false,
        'code'    => 'probe_error',
        'message' => '전송 중 오류가 발생했습니다.',
        'from'    => $from,
        'to'      => MailAddressMasker::mask($to),
    ], JSON_UNESCAPED_UNICODE);
}
