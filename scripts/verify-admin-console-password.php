<?php

declare(strict_types=1);

/**
 * 콘솔 2차 비밀번호. 로컬 Docker MySQL만 사용하고, 끝나면 임시 DB를 지운다.
 * 실행: php scripts/verify-admin-console-password.php
 */

$root = dirname(__DIR__);
$passed = 0;
$failed = 0;
$server = null;
$dbName = 'study114_b1test';

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

function finish(int $code): void
{
    global $passed, $failed, $server, $admin;
    if (is_resource($server)) {
        proc_terminate($server);
        proc_close($server);
    }
    if ($admin instanceof PDO) {
        try {
            $admin->exec('DROP DATABASE IF EXISTS study114_b1test');
        } catch (Throwable $e) {
            fwrite(STDERR, "FAIL: drop temp db\n");
        }
    }
    echo "RESULT {$passed} PASS / {$failed} FAIL\n";
    exit($code);
}

require_once $root . '/src/Admin/AdminConsolePolicy.php';
check(!\Study114\Admin\AdminConsolePolicy::accepts('abc'), '짧은 비밀번호 거절');
check(!\Study114\Admin\AdminConsolePolicy::accepts('ABCDEF'), '대문자만 거절');
check(!\Study114\Admin\AdminConsolePolicy::accepts('Ab1!@'), '숫자 1개 거절');
check(!\Study114\Admin\AdminConsolePolicy::accepts('Ab12!'), '특수문자 1개 거절');
check(!\Study114\Admin\AdminConsolePolicy::accepts('Ab12!~'), '허용 밖 특수문자 거절');

$serviceSrc = (string) file_get_contents($root . '/src/Admin/AdminConsolePasswordService.php');
$apiSrc = (string) file_get_contents($root . '/src/Admin/AdminApi.php');
check(!str_contains($serviceSrc, 'users.password_hash'), '로그인 비밀번호 컬럼을 2차 비밀번호로 쓰지 않음');
check(str_contains($apiSrc, 'study114_json_error'), 'AdminApi::fail 이 soft-error를 씀');
check(str_contains($serviceSrc, 'session_regenerate_id') || str_contains((string) file_get_contents($root . '/public/api/admin/console-unlock.php'), 'AuthSession::regenerate()'), '잠금해제 성공 시 세션 재발급');
check(!is_file($root . '/public/api/admin/console-setup.php'), '웹 최초 설정 경로 없음');

function makePassword(): string
{
    $specials = \Study114\Admin\AdminConsolePolicy::SPECIAL_CHARS;
    $chars = [
        chr(random_int(65, 90)),
        chr(random_int(97, 122)),
        chr(random_int(48, 57)),
        chr(random_int(48, 57)),
        $specials[random_int(0, strlen($specials) - 1)],
        $specials[random_int(0, strlen($specials) - 1)],
    ];
    for ($i = count($chars) - 1; $i > 0; $i--) {
        $j = random_int(0, $i);
        [$chars[$i], $chars[$j]] = [$chars[$j], $chars[$i]];
    }
    $password = implode('', $chars);
    if (!\Study114\Admin\AdminConsolePolicy::accepts($password)) {
        return makePassword();
    }

    return $password;
}

if (!is_file($root . '/config/database.php')) {
    copy($root . '/config/database.php.example', $root . '/config/database.php');
}
/** @var array{host:string,port:int,username:string,password:string,charset:string} $cfg */
$cfg = require $root . '/config/database.php.example';
$admin = null;
try {
    $admin = new PDO(
        sprintf('mysql:host=%s;port=%d;charset=%s', $cfg['host'], (int) $cfg['port'], $cfg['charset']),
        $cfg['username'],
        $cfg['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Throwable $e) {
    check(false, '로컬 DB 연결');
    finish(1);
}

$admin->exec("DROP DATABASE IF EXISTS {$dbName}");
$admin->exec("CREATE DATABASE {$dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$admin->exec("USE {$dbName}");
$admin->exec(<<<'SQL'
CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  admin_level VARCHAR(32) NULL,
  email_verified_at DATETIME NULL,
  oauth_role_pending TINYINT NOT NULL DEFAULT 0,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  password_hash VARCHAR(255) NULL,
  must_change_password TINYINT NOT NULL DEFAULT 0,
  role_type VARCHAR(32) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB
SQL);
$admin->exec('CREATE TABLE user_profiles (user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY, real_name VARCHAR(100) NULL, phone VARCHAR(40) NULL) ENGINE=InnoDB');
$admin->exec('CREATE TABLE user_roles (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL, role_type VARCHAR(32) NOT NULL, is_primary TINYINT NOT NULL DEFAULT 1, status VARCHAR(32) NOT NULL DEFAULT \'active\') ENGINE=InnoDB');
$admin->exec('CREATE TABLE user_oauth_accounts (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL) ENGINE=InnoDB');
$admin->exec('CREATE TABLE provider_entitlements (user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY, subscription_tier VARCHAR(32) NULL) ENGINE=InnoDB');
$admin->exec('CREATE TABLE provider_position_subscriptions (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL, end_exclusive_on DATE NOT NULL) ENGINE=InnoDB');
$admin->exec('CREATE TABLE study_rooms (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL, study_room_name VARCHAR(100) NULL, deleted_at DATETIME NULL) ENGINE=InnoDB');
$admin->exec('CREATE TABLE tutors (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL, tutor_display_name VARCHAR(100) NULL) ENGINE=InnoDB');
$admin->exec('CREATE TABLE students (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, guardian_user_id BIGINT UNSIGNED NOT NULL) ENGINE=InnoDB');
$admin->exec('CREATE TABLE regions (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, sido_code VARCHAR(8) NULL, sido_name VARCHAR(40) NULL, sigungu_name VARCHAR(40) NULL, dong_name VARCHAR(40) NULL) ENGINE=InnoDB');
$admin->exec('CREATE TABLE tutor_regions (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, tutor_id BIGINT UNSIGNED NOT NULL, region_id BIGINT UNSIGNED NOT NULL, is_primary TINYINT NOT NULL DEFAULT 0, priority_order INT NOT NULL DEFAULT 0) ENGINE=InnoDB');
$admin->exec('CREATE TABLE study_room_regions (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, study_room_id BIGINT UNSIGNED NOT NULL, region_id BIGINT UNSIGNED NOT NULL, is_primary TINYINT NOT NULL DEFAULT 0) ENGINE=InnoDB');
$admin->exec(file_get_contents($root . '/sql/schema/092_admin_console_auth.sql') ?: '');
$admin->exec(<<<'SQL'
CREATE TABLE admin_operation_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  log_key VARCHAR(80) NOT NULL,
  acted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  operator_id VARCHAR(64) NOT NULL,
  target_type VARCHAR(64) NOT NULL,
  target_id VARCHAR(64) NOT NULL,
  action_kind VARCHAR(50) NOT NULL,
  reason_category VARCHAR(64) NULL,
  detail_memo TEXT NULL,
  reversible TINYINT NOT NULL DEFAULT 0,
  revert_history TEXT NULL,
  user_notified TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB
SQL);

$insert = $admin->prepare('INSERT INTO users (email, status, admin_level, email_verified_at, role_type) VALUES (?, \'active\', ?, UTC_TIMESTAMP(), ?)');
$insert->execute(['b1-admin@example.test', 'super_admin', 'admin']);
$adminId = (int) $admin->lastInsertId();
$insert->execute(['b1-unset@example.test', 'super_admin', 'admin']);
$unsetId = (int) $admin->lastInsertId();
$insert->execute(['b1-member@example.test', null, 'guardian_student']);
$memberId = (int) $admin->lastInsertId();

$password = makePassword();
$wrong = makePassword();
while ($wrong === $password) {
    $wrong = makePassword();
}
$next = makePassword();
while ($next === $password || $next === $wrong) {
    $next = makePassword();
}
$hash = password_hash($password, PASSWORD_DEFAULT);
$admin->prepare('INSERT INTO admin_console_auth (user_id, password_hash, fail_count, locked_until) VALUES (?, ?, 0, NULL)')
    ->execute([$adminId, $hash]);

putenv('STUDY114_DB_HOST=' . $cfg['host']);
putenv('STUDY114_DB_PORT=' . (string) $cfg['port']);
putenv('STUDY114_DB_NAME=' . $dbName);
putenv('STUDY114_DB_USER=' . $cfg['username']);
putenv('STUDY114_DB_PASS=' . $cfg['password']);
$_ENV['STUDY114_DB_HOST'] = $cfg['host'];
$_ENV['STUDY114_DB_PORT'] = (string) $cfg['port'];
$_ENV['STUDY114_DB_NAME'] = $dbName;
$_ENV['STUDY114_DB_USER'] = $cfg['username'];
$_ENV['STUDY114_DB_PASS'] = $cfg['password'];

$listen = stream_socket_server('tcp://127.0.0.1:0', $errno, $errstr);
if ($listen === false) {
    check(false, 'port');
    finish(1);
}
$addr = stream_socket_get_name($listen, false);
fclose($listen);
$port = (int) substr((string) strrchr((string) $addr, ':'), 1);
$router = tempnam(sys_get_temp_dir(), 'b1-router');
$routerPhp = $router . '.php';
rename($router, $routerPhp);
$rootExport = var_export($root, true);
file_put_contents($routerPhp, <<<PHP
<?php
\$root = {$rootExport};
\$path = parse_url(\$_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
require_once \$root . '/src/bootstrap.php';
if (\$path === '/__b1_login') {
    \$level = (\$_GET['level'] ?? '') === '' ? null : (string) \$_GET['level'];
    Study114\Auth\AuthSession::login((int) \$_GET['id'], 'b1@example.test', (string) \$_GET['role'], 'tester', ['admin_level' => \$level]);
    echo json_encode(['ok' => true]);
    return true;
}
if (\$path === '/__b1_logout') {
    Study114\Auth\AuthSession::logout();
    echo json_encode(['ok' => true]);
    return true;
}
if (\$path === '/__b1_expire') {
    Study114\Auth\AuthSession::start();
    if (isset(\$_SESSION['auth']) && is_array(\$_SESSION['auth'])) {
        \$_SESSION['auth']['console_unlocked_at'] = time() - 1801;
    }
    echo json_encode(['ok' => true]);
    return true;
}
\$file = \$root . '/public' . \$path;
if (is_file(\$file)) {
    require \$file;
    return true;
}
http_response_code(404);
echo 'missing';
return true;
PHP);

$php = PHP_BINARY;
$spec = [
    0 => ['pipe', 'r'],
    1 => ['file', sys_get_temp_dir() . '/b1-php-out.txt', 'w'],
    2 => ['file', sys_get_temp_dir() . '/b1-php-err.txt', 'w'],
];
$env = getenv();
if (!is_array($env)) {
    $env = [];
}
$env['STUDY114_DB_HOST'] = (string) $cfg['host'];
$env['STUDY114_DB_PORT'] = (string) $cfg['port'];
$env['STUDY114_DB_NAME'] = $dbName;
$env['STUDY114_DB_USER'] = (string) $cfg['username'];
$env['STUDY114_DB_PASS'] = (string) $cfg['password'];
$server = proc_open(
    [$php, '-S', '127.0.0.1:' . $port, $routerPhp],
    $spec,
    $pipes,
    $root,
    $env
);
if (!is_resource($server)) {
    check(false, 'php server');
    finish(1);
}
usleep(300000);
$base = 'http://127.0.0.1:' . $port;

function http(string $url, string $method = 'GET', ?string $body = null, array $headers = [], ?string &$cookie = null): array
{
    $req = $headers;
    if ($cookie) {
        $req[] = 'Cookie: ' . $cookie;
    }
    $context = stream_context_create([
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $req),
            'content' => $body ?? '',
            'ignore_errors' => true,
            'timeout' => 20,
        ],
    ]);
    $respBody = file_get_contents($url, false, $context);
    $respHeaders = $http_response_header ?? [];
    $status = 0;
    if (isset($respHeaders[0]) && preg_match('/\s(\d{3})\s/', (string) $respHeaders[0], $statusMatch)) {
        $status = (int) $statusMatch[1];
    }
    $header = implode("\n", $respHeaders);
    if (preg_match_all('/^Set-Cookie:\s*([^;=\s]+)=([^;\r\n]+)/mi', $header, $matches, PREG_SET_ORDER)) {
        $jar = [];
        if ($cookie) {
            foreach (explode('; ', $cookie) as $part) {
                $bits = explode('=', $part, 2);
                if (count($bits) === 2) {
                    $jar[$bits[0]] = $bits[1];
                }
            }
        }
        foreach ($matches as $match) {
            $jar[$match[1]] = $match[2];
        }
        $pairs = [];
        foreach ($jar as $name => $value) {
            $pairs[] = $name . '=' . $value;
        }
        $cookie = implode('; ', $pairs);
    }
    $json = json_decode(is_string($respBody) ? $respBody : '', true);

    return [$status, is_array($json) ? $json : [], is_string($respBody) ? $respBody : ''];
}

$cookie = null;
$before = null;
http($base . '/__b1_login?id=' . $adminId . '&role=admin&level=super_admin', 'GET', null, [], $cookie);
$before = $cookie;
[$status, $json] = http($base . '/api/admin/members.php', 'GET', null, ['X-Study114-Soft-Error: 1'], $cookie);
check($status === 200 && ($json['ok'] ?? true) === false && ($json['error'] ?? '') === 'console_unlock_required' && (int) ($json['http_status'] ?? 0) === 403, '헤더 있으면 200과 console_unlock_required');
[$status, $json] = http($base . '/api/admin/members.php', 'GET', null, [], $cookie);
check($status === 403 && ($json['error'] ?? '') === 'console_unlock_required' && !isset($json['http_status']), '헤더 없으면 403');
[$status, $json] = http($base . '/api/admin/console-unlock.php', 'GET', null, ['X-Study114-Soft-Error: 1'], $cookie);
check($status === 200 && ($json['ok'] ?? false) === true && ($json['unlocked'] ?? true) === false && ($json['configured'] ?? false) === true, '상태 조회는 해제 없이 200');

$posted = json_encode(['password' => $password], JSON_UNESCAPED_UNICODE);
[$status, $json] = http($base . '/api/admin/console-unlock.php', 'POST', $posted, ['Content-Type: application/json', 'X-Study114-Soft-Error: 1'], $cookie);
check($status === 200 && ($json['unlocked'] ?? false) === true, '맞는 비밀번호면 해제');
check(is_string($before) && is_string($cookie) && $before !== $cookie, '잠금해제 전후 세션 쿠키가 바뀜');
[$status, $json] = http($base . '/api/admin/members.php', 'GET', null, ['X-Study114-Soft-Error: 1'], $cookie);
check($status === 200 && ($json['ok'] ?? false) === true && isset($json['members']), '해제 후 members 200');

http($base . '/__b1_expire', 'GET', null, [], $cookie);
[$status, $json] = http($base . '/api/admin/members.php', 'GET', null, ['X-Study114-Soft-Error: 1'], $cookie);
check(($json['error'] ?? '') === 'console_unlock_required', '유휴 30분 넘으면 다시 잠금');

$plain = null;
http($base . '/__b1_login?id=' . $memberId . '&role=guardian_student&level=', 'GET', null, [], $plain);
[$status, $json] = http($base . '/api/admin/members.php', 'GET', null, [], $plain);
check($status === 403 && ($json['error'] ?? '') === 'forbidden', '일반 회원은 forbidden');
$none = null;
[$status, $json] = http($base . '/api/admin/members.php', 'GET', null, [], $none);
check($status === 401 && ($json['error'] ?? '') === 'unauthorized', '비로그인은 401');

$lockCookie = null;
http($base . '/__b1_login?id=' . $adminId . '&role=admin&level=super_admin', 'GET', null, [], $lockCookie);
for ($i = 1; $i <= 5; $i++) {
    [$status, $json] = http(
        $base . '/api/admin/console-unlock.php',
        'POST',
        json_encode(['password' => $wrong]),
        ['Content-Type: application/json'],
        $lockCookie
    );
}
check($status === 403 && ($json['error'] ?? '') === 'console_locked', '5회 실패면 잠금');
[$status, $json] = http(
    $base . '/api/admin/console-unlock.php',
    'POST',
    json_encode(['password' => $password]),
    ['Content-Type: application/json'],
    $lockCookie
);
check($status === 403 && ($json['error'] ?? '') === 'console_locked', '잠금 중에는 맞는 비밀번호도 거절');
$admin->prepare('UPDATE admin_console_auth SET locked_until = ? WHERE user_id = ?')
    ->execute(['2000-01-01 00:00:00', $adminId]);
[$status, $json] = http(
    $base . '/api/admin/console-unlock.php',
    'POST',
    json_encode(['password' => $password]),
    ['Content-Type: application/json', 'X-Study114-Soft-Error: 1'],
    $lockCookie
);
check($status === 200 && ($json['unlocked'] ?? false) === true, '잠금 시각이 지나면 다시 해제');

$fresh = null;
http($base . '/__b1_logout', 'GET', null, [], $lockCookie);
[$status, $json] = http($base . '/api/admin/members.php', 'GET', null, [], $lockCookie);
check($status === 401, '로그아웃 후 관리자 API는 해제 무효');

$unsetCookie = null;
http($base . '/__b1_login?id=' . $unsetId . '&role=admin&level=super_admin', 'GET', null, [], $unsetCookie);
[$status, $json] = http($base . '/api/admin/members.php', 'GET', null, [], $unsetCookie);
check($status === 403 && ($json['error'] ?? '') === 'console_password_unset', '미설정 계정은 콘솔 차단');

$changeCookie = null;
http($base . '/__b1_login?id=' . $adminId . '&role=admin&level=super_admin', 'GET', null, [], $changeCookie);
http(
    $base . '/api/admin/console-unlock.php',
    'POST',
    json_encode(['password' => $password]),
    ['Content-Type: application/json', 'X-Study114-Soft-Error: 1'],
    $changeCookie
);
[$status, $json] = http(
    $base . '/api/admin/console-unlock.php',
    'POST',
    json_encode(['action' => 'change', 'current_password' => $wrong, 'password' => $next, 'password_confirm' => $next]),
    ['Content-Type: application/json'],
    $changeCookie
);
check($status === 403 && ($json['error'] ?? '') === 'console_password_mismatch', '기존 비밀번호가 틀리면 변경 거절');
[$status, $json] = http(
    $base . '/api/admin/console-unlock.php',
    'POST',
    json_encode(['action' => 'change', 'current_password' => $password, 'password' => $next, 'password_confirm' => $next]),
    ['Content-Type: application/json', 'X-Study114-Soft-Error: 1'],
    $changeCookie
);
check($status === 200 && ($json['changed'] ?? false) === true, '해제된 뒤 본인 변경 성공');

$logs = $admin->query('SELECT action_kind, detail_memo FROM admin_operation_logs')->fetchAll(PDO::FETCH_ASSOC);
$kinds = array_column($logs, 'action_kind');
foreach (['console_unlock_ok', 'console_unlock_fail', 'console_locked', 'console_password_change'] as $kind) {
    check(in_array($kind, $kinds, true), '감사 로그 ' . $kind);
}
$blob = json_encode($logs, JSON_UNESCAPED_UNICODE);
check(!str_contains((string) $blob, $password) && !str_contains((string) $blob, $next) && !str_contains((string) $blob, $hash), '로그에 비밀번호·해시 없음');
require_once $root . '/src/bootstrap.php';
$setPassword = makePassword();
(new \Study114\Admin\AdminConsolePasswordService())->setInitial($unsetId, $setPassword);
$setCount = (int) $admin->query("SELECT COUNT(*) FROM admin_operation_logs WHERE action_kind = 'console_password_set'")->fetchColumn();
$setMemo = (string) $admin->query("SELECT IFNULL(GROUP_CONCAT(detail_memo), '') FROM admin_operation_logs WHERE action_kind = 'console_password_set'")->fetchColumn();
check($setCount === 1 && !str_contains($setMemo, $setPassword), '감사 로그 console_password_set');
$setPassword = '';

finish($failed > 0 ? 1 : 0);
