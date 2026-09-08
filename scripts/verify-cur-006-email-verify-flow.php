<?php

declare(strict_types=1);

/**
 * CUR-006 · 격리 Docker DB + API HTTP 통합 흐름 (실메일·운영 배포 없음)
 *
 * 사전:
 *   docker compose -f docker/docker-compose.dev.yml -f docker/docker-compose.cur006-mail.yml up -d
 *   .\scripts\apply-schema-dev.ps1   # 최초 1회
 *
 * 실행:
 *   php scripts/verify-cur-006-email-verify-flow.php
 *   # 또는: docker exec study114-api-dev php scripts/verify-cur-006-email-verify-flow.php
 */

$root = dirname(__DIR__);
$apiBase = rtrim(getenv('STUDY114_FLOW_API_BASE') ?: 'http://127.0.0.1:8080', '/');
$mailLog = getenv('STUDY114_MAIL_LOG_PATH') ?: ($root . '/storage/logs/mail-cur006-flow.log');
$dbHost = getenv('STUDY114_DB_HOST') ?: '127.0.0.1';
$dbPort = (int) (getenv('STUDY114_DB_PORT') ?: 3307);
$dbName = getenv('STUDY114_DB_NAME') ?: 'study114_dev';
$dbUser = getenv('STUDY114_DB_USER') ?: 'root';
$dbPass = getenv('STUDY114_DB_PASS') ?: 'study114dev';

$failed = 0;
$passed = 0;

function assert_true(bool $cond, string $msg): void
{
    global $failed, $passed;
    if ($cond) {
        echo "PASS: {$msg}\n";
        $passed++;
    } else {
        echo "FAIL: {$msg}\n";
        $failed++;
        fwrite(STDERR, "ASSERT_FAIL {$msg}\n");
    }
}

function db(): PDO
{
    global $dbHost, $dbPort, $dbName, $dbUser, $dbPass;
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    return $pdo;
}

/**
 * @return array{status:int, headers:array<string,string>, body:string, json:?array}
 */
function http_json(string $method, string $url, ?array $payload, string $cookieFile): array
{
    $ch = curl_init($url);
    if ($ch === false) {
        throw new RuntimeException('curl_init failed');
    }
    $headers = ['Content-Type: application/json', 'Accept: application/json'];
    $opts = [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_COOKIEJAR => $cookieFile,
        CURLOPT_COOKIEFILE => $cookieFile,
        CURLOPT_HTTPHEADER => $headers,
    ];
    if ($payload !== null) {
        $opts[CURLOPT_POSTFIELDS] = json_encode($payload, JSON_UNESCAPED_UNICODE);
    }
    curl_setopt_array($ch, $opts);
    $raw = curl_exec($ch);
    if ($raw === false) {
        $err = curl_error($ch);
        curl_close($ch);
        throw new RuntimeException('curl: ' . $err);
    }
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);
    $headerBlob = substr($raw, 0, $headerSize);
    $body = substr($raw, $headerSize);
    $parsedHeaders = [];
    foreach (explode("\r\n", $headerBlob) as $line) {
        if (str_contains($line, ':')) {
            [$k, $v] = explode(':', $line, 2);
            $parsedHeaders[strtolower(trim($k))] = trim($v);
        }
    }
    $json = json_decode($body, true);

    return [
        'status' => $status,
        'headers' => $parsedHeaders,
        'body' => $body,
        'json' => is_array($json) ? $json : null,
    ];
}

function http_get_follow(string $url, string $cookieFile): array
{
    $ch = curl_init($url);
    if ($ch === false) {
        throw new RuntimeException('curl_init failed');
    }
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_COOKIEJAR => $cookieFile,
        CURLOPT_COOKIEFILE => $cookieFile,
    ]);
    $raw = curl_exec($ch);
    if ($raw === false) {
        $err = curl_error($ch);
        curl_close($ch);
        throw new RuntimeException('curl: ' . $err);
    }
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);
    $headerBlob = substr($raw, 0, $headerSize);
    $location = '';
    foreach (explode("\r\n", $headerBlob) as $line) {
        if (stripos($line, 'Location:') === 0) {
            $location = trim(substr($line, 9));
        }
    }

    return ['status' => $status, 'location' => $location, 'body' => substr($raw, $headerSize)];
}

function verified_at(?int $userId): ?string
{
    if ($userId === null || $userId < 1) {
        return null;
    }
    $stmt = db()->prepare('SELECT email_verified_at FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!is_array($row)) {
        return null;
    }
    $v = $row['email_verified_at'] ?? null;

    return $v === null ? null : (string) $v;
}

echo "API_BASE={$apiBase}\n";
echo "DB={$dbHost}:{$dbPort}/{$dbName}\n";
echo "MAIL_LOG={$mailLog}\n";

// API 생존
$ping = @file_get_contents($apiBase . '/api/auth/me.php');
assert_true($ping !== false, 'API 도달 가능');
if ($ping === false) {
    echo "\nABORT: API not reachable. Start: docker compose -f docker/docker-compose.dev.yml -f docker/docker-compose.cur006-mail.yml up -d\n";
    exit(2);
}

try {
    db()->query('SELECT 1');
    assert_true(true, 'DB 연결');
} catch (Throwable $e) {
    assert_true(false, 'DB 연결: ' . $e->getMessage());
    echo "\npassed={$passed} failed={$failed}\n";
    exit(1);
}

@unlink($mailLog);
@mkdir(dirname($mailLog), 0775, true);

$uniq = bin2hex(random_bytes(4));
$email = "cur006.flow.{$uniq}@example.com";
$password = 'Flow9x!k2';
$cookieSignup = sys_get_temp_dir() . "/study114-cur006-signup-{$uniq}.cookie";
$cookieLogin = sys_get_temp_dir() . "/study114-cur006-login-{$uniq}.cookie";
$cookieAfter = sys_get_temp_dir() . "/study114-cur006-after-{$uniq}.cookie";
@unlink($cookieSignup);
@unlink($cookieLogin);
@unlink($cookieAfter);

$signupPayload = [
    'email' => $email,
    'password' => $password,
    'password_confirm' => $password,
    'name' => 'CUR006 Flow',
    'gender' => 'male',
    'phone' => '0109988' . substr((string) random_int(1000, 9999), 0, 4),
    'address' => '서울특별시 강남구 테헤란로 1',
    'address_zip' => '06236',
    'role' => 'student',
    'email_consent' => true,
    'sms_consent' => false,
];

$signup = http_json('POST', $apiBase . '/api/auth/signup.php', $signupPayload, $cookieSignup);
assert_true($signup['status'] === 201 && ($signup['json']['ok'] ?? false) === true, '신규 가입 201');
$userId = (int) ($signup['json']['user_id'] ?? 0);
assert_true($userId > 0, 'user_id 발급');
assert_true(($signup['json']['email_verified'] ?? null) === false, '가입 응답 email_verified=false');
assert_true(!empty($signup['json']['email_sent']), '가입 확인메일 fake 발송(email_sent)');

$at1 = verified_at($userId);
assert_true($at1 === null, '가입 직후 email_verified_at=NULL');

$login1 = http_json('POST', $apiBase . '/api/auth/login.php', [
    'email' => $email,
    'password' => $password,
], $cookieLogin);
assert_true($login1['status'] === 200 && ($login1['json']['ok'] ?? false) === true, '확인 전 로그인 ok(세션 허용)');
assert_true(($login1['json']['email_verified'] ?? true) === false, '확인 전 login.email_verified=false');
assert_true(($login1['json']['email_verify_required'] ?? false) === true, '확인 전 login.email_verify_required=true');

$me1 = http_json('GET', $apiBase . '/api/auth/me.php', null, $cookieLogin);
assert_true(($me1['json']['authenticated'] ?? false) === true, '확인 전 me authenticated');
assert_true(($me1['json']['email_verified'] ?? true) === false, '확인 전 me.email_verified=false');

$basic1 = http_json('POST', $apiBase . '/api/auth/basic-register.php', [
    'role' => 'student',
    'payload' => ['display_name' => 'x'],
], $cookieLogin);
assert_true($basic1['status'] === 403, '확인 전 basic-register HTTP 403');
assert_true(($basic1['json']['error'] ?? '') === 'email_verify_required', '확인 전 basic-register email_verify_required');

$msg1 = http_json('GET', $apiBase . '/api/messages/threads.php', null, $cookieLogin);
assert_true($msg1['status'] === 403, '확인 전 messages/threads HTTP 403');
assert_true(($msg1['json']['error'] ?? '') === 'email_verify_required', '확인 전 messages email_verify_required');

$board1 = http_json('POST', $apiBase . '/api/board/posts.php', [
    'board_key' => 'submission',
    'title' => 'x',
    'body' => 'y',
], $cookieLogin);
assert_true($board1['status'] === 403, '확인 전 board POST HTTP 403');
assert_true(($board1['json']['error'] ?? '') === 'email_verify_required', '확인 전 board email_verify_required');

$mailBody = is_file($mailLog) ? (string) file_get_contents($mailLog) : '';
assert_true($mailBody !== '', 'fake mail.log 기록 존재');
assert_true(!str_contains($mailBody, 'RESEND_API_KEY') && !preg_match('/\bre_[A-Za-z0-9]{10,}/', $mailBody), 'mail.log에 API Key 없음');
if (!preg_match('/verify\.php\?token=([A-Za-z0-9_\-\.]+)/', $mailBody, $m)) {
    assert_true(false, 'mail.log에서 verify token 추출');
    echo "\npassed={$passed} failed={$failed}\n";
    exit(1);
}
$token = $m[1];
assert_true(strlen($token) >= 16, 'verify token 길이');

$verify = http_get_follow($apiBase . '/api/auth/email/verify.php?token=' . rawurlencode($token), $cookieLogin);
assert_true(in_array($verify['status'], [302, 301, 303], true), '확인 링크 HTTP redirect');
assert_true(str_contains($verify['location'], 'verified=1'), 'redirect verified=1');

$at2 = verified_at($userId);
assert_true($at2 !== null && $at2 !== '', '확인 후 email_verified_at 기록');

$login2 = http_json('POST', $apiBase . '/api/auth/login.php', [
    'email' => $email,
    'password' => $password,
], $cookieAfter);
assert_true(($login2['json']['email_verified'] ?? false) === true, '확인 후 login.email_verified=true');
assert_true(($login2['json']['email_verify_required'] ?? true) === false, '확인 후 email_verify_required=false');

$basic2 = http_json('POST', $apiBase . '/api/auth/basic-register.php', [
    'role' => 'student',
    'payload' => ['display_name' => 'x'],
], $cookieAfter);
assert_true(($basic2['json']['error'] ?? '') !== 'email_verify_required', '확인 후 basic-register가 email_verify_required 아님');
assert_true($basic2['status'] !== 403 || ($basic2['json']['error'] ?? '') !== 'email_verify_required', '확인 후 basic-register 403/email_verify_required 아님');

$msg2 = http_json('GET', $apiBase . '/api/messages/threads.php', null, $cookieAfter);
assert_true(($msg2['json']['error'] ?? '') !== 'email_verify_required', '확인 후 messages가 email_verify_required 아님');
assert_true($msg2['status'] !== 403 || ($msg2['json']['error'] ?? '') !== 'email_verify_required', '확인 후 messages 게이트 통과');

// cleanup cookies
@unlink($cookieSignup);
@unlink($cookieLogin);
@unlink($cookieAfter);

echo "\npassed={$passed} failed={$failed}\n";
exit($failed > 0 ? 1 : 0);
