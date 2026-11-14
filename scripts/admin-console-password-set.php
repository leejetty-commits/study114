<?php

declare(strict_types=1);

/**
 * 콘솔 2차 비밀번호 최초 설정. 비밀번호는 숨긴 stdin 두 번만 받는다.
 * php scripts/admin-console-password-set.php --email user@example.com
 * php scripts/admin-console-password-set.php --user-id 1
 */

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "CLI에서만 실행합니다.\n");
    exit(1);
}

foreach (array_slice($argv, 1) as $arg) {
    if (preg_match('/password|passwd|secret/i', $arg) === 1) {
        fwrite(STDERR, "비밀번호는 인자로 받지 않습니다.\n");
        exit(1);
    }
}

$opts = getopt('', ['email:', 'user-id:']);
$email = isset($opts['email']) ? trim((string) $opts['email']) : '';
$userId = isset($opts['user-id']) ? (int) $opts['user-id'] : 0;
if ($email === '' && $userId < 1) {
    fwrite(STDERR, "--email 또는 --user-id 가 필요합니다.\n");
    exit(1);
}

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Admin\AdminConsolePasswordService;
use Study114\Database\Connection;

function b1_read_secret(string $prompt): string
{
    fwrite(STDOUT, $prompt);
    if (DIRECTORY_SEPARATOR === '\\') {
        $cmd = 'powershell -NoProfile -Command "'
            . '$s = Read-Host -AsSecureString; '
            . '$p = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s); '
            . '[Runtime.InteropServices.Marshal]::PtrToStringUni($p)"';
        $line = shell_exec($cmd);
    } else {
        shell_exec('stty -echo');
        $line = fgets(STDIN);
        shell_exec('stty echo');
        fwrite(STDOUT, PHP_EOL);
    }
    if (!is_string($line)) {
        fwrite(STDERR, "비밀번호를 읽지 못했습니다.\n");
        exit(1);
    }

    return rtrim($line, "\r\n");
}

function b1_mask_email(string $email): string
{
    $at = strpos($email, '@');
    if ($at === false || $at < 1) {
        return '***';
    }
    $name = substr($email, 0, $at);
    $host = substr($email, $at);

    return substr($name, 0, 1) . '***' . $host;
}

$pdo = Connection::get();
if ($userId > 0) {
    $stmt = $pdo->prepare('SELECT id, email, admin_level, status FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$userId]);
} else {
    $stmt = $pdo->prepare('SELECT id, email, admin_level, status FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
}
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!is_array($row) || (string) ($row['status'] ?? '') !== 'active' || ($row['admin_level'] ?? null) === null || $row['admin_level'] === '') {
    fwrite(STDERR, "운영 권한이 있는 활성 계정을 찾지 못했습니다.\n");
    exit(1);
}

$first = b1_read_secret('2차 비밀번호: ');
$second = b1_read_secret('2차 비밀번호 확인: ');
if (!hash_equals($first, $second)) {
    fwrite(STDERR, "확인이 일치하지 않습니다.\n");
    exit(1);
}

try {
    (new AdminConsolePasswordService($pdo))->setInitial((int) $row['id'], $first);
} catch (InvalidArgumentException $e) {
    fwrite(STDERR, $e->getMessage() . "\n");
    exit(1);
} finally {
    $first = '';
    $second = '';
}

fwrite(STDOUT, 'user_id=' . (int) $row['id'] . ' email=' . b1_mask_email((string) $row['email']) . " updated\n");
