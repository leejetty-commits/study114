<?php

declare(strict_types=1);

/**
 * H3 — X-Study114-Soft-Error: 1 일 때만 4xx를 HTTP 200 + http_status 로 돌리는지.
 * 헤더가 없으면 원래 4xx. 5xx는 헤더가 있어도 5xx. 결제 확인 502만 예외.
 * 실행: php scripts/verify-soft-error.php
 */

$root = dirname(__DIR__);
$passed = 0;
$failed = 0;

function check(bool $ok, string $msg): void
{
    global $passed, $failed;
    if ($ok) {
        echo "PASS: {$msg}\n";
        $passed++;
        return;
    }
    echo "FAIL: {$msg}\n";
    fwrite(STDERR, "ASSERT_FAIL {$msg}\n");
    $failed++;
}

$checkoutSrc = (string) file_get_contents($root . '/public/api/paid/checkout.php');
check(
    str_contains(
        $checkoutSrc,
        "PaidApi::fail(502, 'payment_verify_failed', '결제 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.', [], true);"
    ),
    'checkout 502는 allow5xx로 soft 대상'
);
check(
    str_contains($checkoutSrc, "PaidApi::fail(422, 'payment_verify_failed', \$e->getMessage());"),
    'checkout 422 payment_verify_failed는 PaidApi::fail 경유'
);

$signupSrc = (string) file_get_contents($root . '/public/api/auth/signup.php');
check(substr_count($signupSrc, 'study114_json_error(422,') === 2, 'signup 422 두 곳만 soft');
check(str_contains($signupSrc, 'http_response_code(503);'), 'signup 503은 그대로');
check(str_contains($signupSrc, 'http_response_code(500);'), 'signup 500은 그대로');

$webhookSrc = (string) file_get_contents($root . '/public/api/paid/portone-webhook.php');
check(!str_contains($webhookSrc, 'study114_json_error'), 'portone-webhook은 soft 함수를 쓰지 않음');

$listen = stream_socket_server('tcp://127.0.0.1:0', $errno, $errstr);
if ($listen === false) {
    fwrite(STDERR, "FAIL: port bind {$errstr}\n");
    exit(1);
}
$addr = stream_socket_get_name($listen, false);
fclose($listen);
$port = (int) substr((string) strrchr((string) $addr, ':'), 1);

$router = tempnam(sys_get_temp_dir(), 'soft-router-');
if ($router === false) {
    fwrite(STDERR, "FAIL: temp router\n");
    exit(1);
}
$routerPhp = $router . '.php';
rename($router, $routerPhp);
$rootExport = var_export($root, true);
file_put_contents($routerPhp, <<<PHP
<?php
\$root = {$rootExport};
\$path = parse_url(\$_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (\$path === '/__soft_probe') {
    require \$root . '/src/bootstrap.php';
    header('Content-Type: application/json; charset=utf-8');
    \$status = (int) (\$_GET['s'] ?? 422);
    \$allow = ((\$_GET['a'] ?? '') === '1');
    study114_json_error(\$status, [
        'ok' => false,
        'error' => 'probe',
        'message' => 'probe-message',
    ], \$allow);
}
return false;
PHP);

$stdoutLog = tempnam(sys_get_temp_dir(), 'soft-out-');
$stderrLog = tempnam(sys_get_temp_dir(), 'soft-err-');
$devnull = DIRECTORY_SEPARATOR === '\\' ? 'NUL' : '/dev/null';
$proc = proc_open(
    [PHP_BINARY, '-S', '127.0.0.1:' . $port, '-t', $root . DIRECTORY_SEPARATOR . 'public', $routerPhp],
    [
        0 => ['file', $devnull, 'r'],
        1 => ['file', (string) $stdoutLog, 'w'],
        2 => ['file', (string) $stderrLog, 'w'],
    ],
    $pipes,
    $root
);

if (!is_resource($proc)) {
    fwrite(STDERR, "FAIL: php server start\n");
    @unlink($routerPhp);
    exit(1);
}

$ready = false;
for ($i = 0; $i < 50; $i++) {
    $fp = @fsockopen('127.0.0.1', $port, $e, $es, 0.2);
    if (is_resource($fp)) {
        fclose($fp);
        $ready = true;
        break;
    }
    usleep(100000);
}
check($ready, 'local php server ready');

/**
 * @param list<string> $headers
 * @return array{status:int, body:?array, raw:string, x_status:?string, ctype:string}
 */
function http_call(string $url, array $headers = [], string $method = 'GET', string $body = ''): array
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        $opts = [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER => true,
            CURLOPT_TIMEOUT => 8,
        ];
        if ($method !== 'GET') {
            $opts[CURLOPT_POSTFIELDS] = $body;
        }
        curl_setopt_array($ch, $opts);
        $rawAll = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        curl_close($ch);
        $rawAll = is_string($rawAll) ? $rawAll : '';
        $rawHeaders = substr($rawAll, 0, $headerSize);
        $raw = substr($rawAll, $headerSize);
    } else {
        $ctx = stream_context_create([
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $headers),
                'content' => $method === 'GET' ? '' : $body,
                'ignore_errors' => true,
                'timeout' => 8,
            ],
        ]);
        $rawBody = file_get_contents($url, false, $ctx);
        $raw = is_string($rawBody) ? $rawBody : '';
        $rawHeaders = implode("\n", $http_response_header ?? []);
        $status = 0;
        if (isset($http_response_header[0]) && preg_match('#\s(\d{3})\s#', (string) $http_response_header[0], $m)) {
            $status = (int) $m[1];
        }
    }

    $xStatus = null;
    $ctype = '';
    foreach (preg_split("/\r\n|\n|\r/", $rawHeaders) ?: [] as $line) {
        if (stripos($line, 'X-Study114-Status:') === 0) {
            $xStatus = trim(substr($line, strlen('X-Study114-Status:')));
        }
        if (stripos($line, 'Content-Type:') === 0) {
            $ctype = trim(substr($line, strlen('Content-Type:')));
        }
    }
    $decoded = json_decode($raw, true);

    return [
        'status' => $status,
        'body' => is_array($decoded) ? $decoded : null,
        'raw' => $raw,
        'x_status' => $xStatus,
        'ctype' => $ctype,
    ];
}

$base = 'http://127.0.0.1:' . $port;
$soft = ['X-Study114-Soft-Error: 1'];

if ($ready) {
    $with = http_call($base . '/__soft_probe?s=422', $soft);
    check($with['status'] === 200, 'header+422 → HTTP 200');
    check(($with['body']['ok'] ?? null) === false, 'header+422 → ok false');
    check(($with['body']['http_status'] ?? null) === 422, 'header+422 → http_status 422');
    check(($with['body']['error'] ?? null) === 'probe', 'header+422 → error 유지');
    check($with['x_status'] === '422', 'header+422 → X-Study114-Status 422');
    check(str_contains(strtolower($with['ctype']), 'application/json'), 'header+422 → JSON content-type');
    check(!str_contains($with['raw'], '<html'), 'header+422 → HTML 아님');

    $plain = http_call($base . '/__soft_probe?s=422');
    check($plain['status'] === 422, 'no header 422 → HTTP 422');
    check(($plain['body']['ok'] ?? null) === false, 'no header 422 → ok false');
    check(!array_key_exists('http_status', $plain['body'] ?? []), 'no header 422 → http_status 없음');
    check($plain['x_status'] === null, 'no header 422 → X-Study114-Status 없음');

    $other = http_call($base . '/__soft_probe?s=422', ['X-Study114-Soft-Error: 0']);
    check($other['status'] === 422, 'header 값이 1이 아니면 422 유지');

    $unauth = http_call($base . '/__soft_probe?s=401', $soft);
    check($unauth['status'] === 200 && ($unauth['body']['http_status'] ?? null) === 401, 'header+401 → 200 http_status 401');

    $conflict = http_call($base . '/__soft_probe?s=409', $soft);
    check($conflict['status'] === 200 && ($conflict['body']['http_status'] ?? null) === 409, 'header+409 → 200 http_status 409');

    $server = http_call($base . '/__soft_probe?s=500', $soft);
    check($server['status'] === 500, 'header+500 → HTTP 500');
    check(!array_key_exists('http_status', $server['body'] ?? []), 'header+500 → http_status 없음');

    $schema = http_call($base . '/__soft_probe?s=503', $soft);
    check($schema['status'] === 503, 'header+503 → HTTP 503');

    $pay = http_call($base . '/__soft_probe?s=502&a=1', $soft);
    check($pay['status'] === 200 && ($pay['body']['http_status'] ?? null) === 502, 'header+502 allow5xx → 200 http_status 502');
    check($pay['x_status'] === '502', 'header+502 allow5xx → X-Study114-Status 502');

    $payPlain = http_call($base . '/__soft_probe?s=502&a=1');
    check($payPlain['status'] === 502, 'no header 502 allow5xx → HTTP 502');
    check(!array_key_exists('http_status', $payPlain['body'] ?? []), 'no header 502 → http_status 없음');

    $coHeaders = ['Content-Type: application/json', 'X-Study114-Soft-Error: 1'];
    $coSoft = http_call($base . '/api/paid/checkout.php', $coHeaders, 'POST', '{}');
    check($coSoft['status'] === 200, 'checkout 비로그인+header → HTTP 200');
    check(($coSoft['body']['ok'] ?? null) === false, 'checkout 비로그인+header → ok false');
    check(($coSoft['body']['http_status'] ?? null) === 401, 'checkout 비로그인+header → http_status 401');
    check(($coSoft['body']['error'] ?? null) === 'unauthorized', 'checkout 비로그인+header → unauthorized');
    check(str_contains(strtolower($coSoft['ctype']), 'application/json'), 'checkout 비로그인+header → JSON');

    $coHard = http_call($base . '/api/paid/checkout.php', ['Content-Type: application/json'], 'POST', '{}');
    check($coHard['status'] === 401, 'checkout 비로그인 header 없음 → HTTP 401');
    check(($coHard['body']['error'] ?? null) === 'unauthorized', 'checkout 비로그인 header 없음 → unauthorized');
    check(!array_key_exists('http_status', $coHard['body'] ?? []), 'checkout header 없음 → http_status 없음');
    check(str_contains(strtolower($coHard['ctype']), 'application/json'), 'checkout header 없음 → JSON');
}

$st = proc_get_status($proc);
if (is_array($st) && !empty($st['pid'])) {
    proc_terminate($proc);
}
proc_close($proc);
@unlink($routerPhp);
@unlink((string) $stdoutLog);
@unlink((string) $stderrLog);

echo "{$passed} PASS, {$failed} FAIL\n";
exit($failed > 0 ? 1 : 0);
