<?php

declare(strict_types=1);

// 임시 진단용 — AuthSession 로그인/쿠키 왕복 확인 후 삭제한다.
require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;

header('Content-Type: application/json; charset=utf-8');

AuthSession::login(999999, 'diag@example.com', 'guardian_student', 'Diag User');

echo json_encode([
    'ok'                => true,
    'session_id'        => session_id(),
    'session_save_path' => session_save_path(),
    'user_after_login'  => AuthSession::user(),
], JSON_UNESCAPED_UNICODE);
