<?php

declare(strict_types=1);

/**
 * 관리자 회원 목록 「테스트」상태 칩.
 * 빈 임시 데이터베이스만 만들고, 끝나면 그 데이터베이스만 지운다.
 * 실행: php scripts/verify-admin-member-test-status.php
 */

$mode = $argv[1] ?? 'all';
if (!in_array($mode, ['all', 'empty', 'filled', 'nope'], true)) {
    fwrite(STDERR, "unknown mode\n");
    exit(1);
}

if ($mode === 'all') {
    $php = PHP_BINARY;
    $self = __FILE__;
    $fail = 0;
    foreach (['empty', 'filled', 'nope'] as $child) {
        $env = getenv();
        if (!is_array($env)) {
            $env = [];
        }
        if ($child === 'filled') {
            $env['STUDY114_TEST_ACCOUNT_EMAILS'] = 'test-active@example.com,test-pending@example.com,test-withdrawn@example.com';
        } else {
            $env['STUDY114_TEST_ACCOUNT_EMAILS'] = '';
        }
        $proc = proc_open(
            [$php, '-d', 'display_errors=0', $self, $child],
            [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
            $pipes,
            dirname(__DIR__),
            $env
        );
        if (!is_resource($proc)) {
            echo "FAIL  {$child}-start\n";
            $fail++;
            continue;
        }
        fclose($pipes[0]);
        $stdout = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        stream_get_contents($pipes[2]);
        fclose($pipes[2]);
        $code = proc_close($proc);
        echo is_string($stdout) ? $stdout : '';
        if ($code !== 0) {
            $fail++;
        }
    }
    exit($fail > 0 ? 1 : 0);
}

$pass = 0;
$fail = 0;

function ok(string $name, bool $cond, string $detail = ''): void
{
    global $pass, $fail;
    if ($cond) {
        $pass++;
        echo "PASS  {$name}\n";
        return;
    }
    $fail++;
    echo "FAIL  {$name}" . ($detail !== '' ? " — {$detail}" : '') . "\n";
}

if ($mode === 'nope') {
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_GET = ['status' => 'nope'];
    $_SERVER['HTTP_X_STUDY114_SOFT_ERROR'] = '1';
    ob_start();
    register_shutdown_function(static function (): void {
        $body = ob_get_clean();
        if (!is_string($body)) {
            $body = '';
        }
        $start = strpos($body, '{');
        $json = $start === false ? null : json_decode(substr($body, $start), true);
        $http = is_array($json) ? (int) ($json['http_status'] ?? 0) : 0;
        $ok = is_array($json) && ($json['error'] ?? '') === 'validation' && $http === 422;
        echo $ok ? "PASS  status-nope-422\n" : "FAIL  status-nope-422 — http={$http}\n";
        echo 'summary pass=' . ($ok ? '1' : '0') . ' fail=' . ($ok ? '0' : '1') . "\n";
        if (!$ok) {
            exit(1);
        }
    });
    require dirname(__DIR__) . '/public/api/admin/members.php';
    echo "FAIL  status-nope-422 — no-exit\n";
    echo "summary pass=0 fail=1\n";
    exit(1);
}

if ($mode === 'filled') {
    $allow = 'test-active@example.com,test-pending@example.com,test-withdrawn@example.com';
    putenv('STUDY114_TEST_ACCOUNT_EMAILS=' . $allow);
    $_ENV['STUDY114_TEST_ACCOUNT_EMAILS'] = $allow;
    $_SERVER['STUDY114_TEST_ACCOUNT_EMAILS'] = $allow;
} else {
    putenv('STUDY114_TEST_ACCOUNT_EMAILS=');
    $_ENV['STUDY114_TEST_ACCOUNT_EMAILS'] = '';
    $_SERVER['STUDY114_TEST_ACCOUNT_EMAILS'] = '';
}

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Admin\AdminMemberRepository;

$host = getenv('STUDY114_DB_HOST');
$host = is_string($host) && $host !== '' ? $host : '127.0.0.1';
if (!in_array($host, ['127.0.0.1', 'localhost'], true)) {
    fwrite(STDERR, "실행 못 함: 로컬 데이터베이스만 허용\n");
    exit(1);
}
$portRaw = getenv('STUDY114_DB_PORT');
$port = is_string($portRaw) && $portRaw !== '' ? (int) $portRaw : 3307;
if (!in_array($port, [3306, 3307], true)) {
    fwrite(STDERR, "실행 못 함: 로컬 포트만 허용\n");
    exit(1);
}
$user = getenv('STUDY114_DB_USER');
$user = is_string($user) && $user !== '' ? $user : 'root';
$passw = getenv('STUDY114_DB_PASS');
$passw = is_string($passw) ? $passw : 'study114dev';

$dbName = 'study114_member_test_' . gmdate('YmdHis') . '_' . random_int(100000, 999999);
if (!preg_match('/^study114_member_test_[0-9]{14}_[0-9]{6}$/', $dbName)) {
    fwrite(STDERR, "실행 못 함: 임시 데이터베이스 이름이 아님\n");
    exit(1);
}

$created = false;
$pdo = null;
try {
    $pdo = new PDO(
        sprintf('mysql:host=%s;port=%d;charset=utf8mb4', $host, $port),
        $user,
        $passw,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
    $pdo->exec(
        'CREATE DATABASE `' . $dbName . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
    );
    $created = true;
    $pdo->exec('USE `' . $dbName . '`');
    $pdo->exec(
        'CREATE TABLE users (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            status VARCHAR(32) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
    $pdo->exec(
        'CREATE TABLE user_profiles (
            user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
    $pdo->exec(
        'CREATE TABLE user_roles (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT UNSIGNED NOT NULL,
            role_type VARCHAR(64) NOT NULL,
            status VARCHAR(32) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );

    $insertUser = $pdo->prepare('INSERT INTO users (email, status) VALUES (?, ?)');
    $insertRole = $pdo->prepare(
        'INSERT INTO user_roles (user_id, role_type, status) VALUES (?, ?, ?)'
    );
    $repo = new AdminMemberRepository($pdo);

    if ($mode === 'empty') {
        $insertUser->execute(['plain-active@example.com', 'active']);
        $insertUser->execute(['plain-withdrawn@example.com', 'withdrawn']);
        $rawActive = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE status = 'active'")->fetchColumn();
        $counts = $repo->countByStatus([]);
        ok('empty-test-zero', $counts['test'] === 0, 'test=' . $counts['test']);
        ok('empty-active-equals-raw-active', $counts['active'] === $rawActive, 'active=' . $counts['active'] . ' raw=' . $rawActive);
    } else {
        $insertUser->execute(['plain-active@example.com', 'active']);
        $insertUser->execute(['test-active@example.com', 'active']);
        $testActiveId = (int) $pdo->lastInsertId();
        $insertUser->execute(['test-pending@example.com', 'pending']);
        $insertUser->execute(['test-withdrawn@example.com', 'withdrawn']);
        $insertRole->execute([$testActiveId, 'study_room_owner', 'active']);

        $counts = $repo->countByStatus([]);
        ok('filled-all', $counts['all'] === 3, 'all=' . $counts['all']);
        ok('filled-active-excludes-test', $counts['active'] === 1, 'active=' . $counts['active']);
        ok('filled-test', $counts['test'] === 2, 'test=' . $counts['test']);
        ok('filled-pending-includes-test', $counts['pending'] === 1, 'pending=' . $counts['pending']);
        ok('filled-withdrawn', $counts['withdrawn'] === 1, 'withdrawn=' . $counts['withdrawn']);
        ok('filled-test-not-withdrawn', $counts['test'] === 2 && $counts['all'] === 3);

        $room = $repo->countMembers([
            'status' => 'test',
            'role_type' => 'study_room_owner',
        ]);
        ok('filled-test-and-study-room', $room === 1, 'room=' . $room);
        $roomCounts = $repo->countByStatus(['role_type' => 'study_room_owner']);
        ok('filled-chip-test-and-study-room', $roomCounts['test'] === 1, 'chip=' . $roomCounts['test']);
        ok('filled-chip-active-and-study-room', $roomCounts['active'] === 0, 'active=' . $roomCounts['active']);
    }
} catch (Throwable $e) {
    ok($mode . '-run', false, 'db');
    fwrite(STDERR, "실행 못 함: 임시 데이터베이스 시험 실패\n");
} finally {
    if ($created && $pdo instanceof PDO && preg_match('/^study114_member_test_[0-9]{14}_[0-9]{6}$/', $dbName)) {
        $pdo->exec('DROP DATABASE `' . $dbName . '`');
    }
}

echo "summary pass={$pass} fail={$fail}\n";
exit($fail > 0 ? 1 : 0);
