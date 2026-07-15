<?php

declare(strict_types=1);

/**
 * 닷홈 mail() 발송 점검 — 운영자만 사용.
 * 사용 후 삭제하거나 STUDY114_MAIL_PROBE_KEY 를 긴 난수로 유지.
 *
 * 예: /api/auth/password/_mail-probe.php?key=...&to=you@gmail.com
 */
require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\AuthMailer;

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
$plain = "이 메일이 도착했다면 PHP mail() 발송이 정상입니다.\nFrom 설정: {$from}\n시간: " . date('c');
$html = '<p>이 메일이 도착했다면 PHP <code>mail()</code> 발송이 정상입니다.</p>'
    . '<p>From: ' . htmlspecialchars($from, ENT_QUOTES, 'UTF-8') . '</p>'
    . '<p>' . htmlspecialchars(date('c'), ENT_QUOTES, 'UTF-8') . '</p>';

try {
    $mailer->send($to, $subject, $plain, $html);
    echo json_encode([
        'ok'      => true,
        'message' => 'mail() 호출 완료. 수신함·스팸함을 확인하세요.',
        'from'    => $from,
        'to'      => $to,
        'log'     => (string) ($auth['mail_log_path'] ?? ''),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok'      => false,
        'message' => $e->getMessage(),
        'from'    => $from,
    ], JSON_UNESCAPED_UNICODE);
}
