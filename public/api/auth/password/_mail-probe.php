<?php

declare(strict_types=1);

/**
 * SMTP 발송 점검 — 운영자만 사용. 운영 실행은 별도 승인 후.
 *
 * 예: /api/auth/password/_mail-probe.php?key=...&to=you@example.com
 */
require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\AuthMailer;
use Study114\Mail\MailAddressMasker;

header('Content-Type: application/json; charset=utf-8');

$expected = study114_env('STUDY114_MAIL_PROBE_KEY', '');
$key = (string) ($_GET['key'] ?? '');
$to = trim((string) ($_GET['to'] ?? ''));

if ($expected === '' || !hash_equals($expected, $key)) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'message' => 'not found'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'to 이메일이 필요합니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$auth = study114_config('auth');
$from = (string) ($auth['mail_from'] ?? '');
$mailer = new AuthMailer();
$subject = '[우동공과] 메일 발송 테스트';
$plain = "이 메일이 도착했다면 SMTP 발송이 정상입니다.\nFrom 설정: {$from}\n시간: " . date('c');
$html = '<p>이 메일이 도착했다면 SMTP 발송이 정상입니다.</p>'
    . '<p>From: ' . htmlspecialchars($from, ENT_QUOTES, 'UTF-8') . '</p>'
    . '<p>' . htmlspecialchars(date('c'), ENT_QUOTES, 'UTF-8') . '</p>';

try {
    $sent = $mailer->send($to, $subject, $plain, $html);
    $result = $mailer->lastResult();
    $payload = [
        'ok'      => $sent,
        'code'    => $result?->code ?? ($sent ? 'smtp_accepted' : 'send_failed'),
        'message' => $sent
            ? '전송 성공. 수신함·스팸함을 확인하세요.'
            : ('전송 실패: ' . ($result?->safeSummary ?? 'unknown')),
        'from'    => $from,
        'to'      => MailAddressMasker::mask($to),
    ];
    if (!$sent) {
        http_response_code(502);
    }
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[mail-probe] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok'      => false,
        'code'    => 'probe_error',
        'message' => '전송 중 오류가 발생했습니다.',
        'from'    => $from,
        'to'      => MailAddressMasker::mask($to),
    ], JSON_UNESCAPED_UNICODE);
}
