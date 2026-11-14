<?php

declare(strict_types=1);

/**
 * DB 없이 콘솔 2차 비밀번호 해시만 만든다.
 * 비밀번호는 숨긴 입력 두 번이고, 표준 출력은 해시 한 줄이다.
 * php scripts/admin-console-password-hash.php
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

require_once dirname(__DIR__) . '/src/Admin/AdminConsolePolicy.php';

use Study114\Admin\AdminConsolePolicy;

function hash_stdin_is_console(): bool
{
    if (DIRECTORY_SEPARATOR === '\\') {
        $stat = fstat(STDIN);
        $type = is_array($stat) ? ($stat['mode'] & 0170000) : 0;

        return $type === 0020000;
    }

    return function_exists('stream_isatty') && stream_isatty(STDIN);
}

function hash_read_secret(string $prompt): string
{
    fwrite(STDERR, $prompt);
    if (DIRECTORY_SEPARATOR === '\\' && hash_stdin_is_console()) {
        $cmd = 'powershell -NoProfile -Command "'
            . '$s = Read-Host -AsSecureString; '
            . '$p = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s); '
            . '[Runtime.InteropServices.Marshal]::PtrToStringUni($p)"';
        $line = shell_exec($cmd);
    } elseif (hash_stdin_is_console()) {
        shell_exec('stty -echo');
        $line = fgets(STDIN);
        shell_exec('stty echo');
        fwrite(STDERR, PHP_EOL);
    } else {
        $line = fgets(STDIN);
    }
    if (!is_string($line)) {
        fwrite(STDERR, "비밀번호를 읽지 못했습니다.\n");
        exit(1);
    }

    return rtrim($line, "\r\n");
}

$first = hash_read_secret('2차 비밀번호: ');
$second = hash_read_secret('2차 비밀번호 확인: ');
if (!hash_equals($first, $second)) {
    $first = '';
    $second = '';
    fwrite(STDERR, "확인이 일치하지 않습니다.\n");
    exit(1);
}
if (!AdminConsolePolicy::accepts($first)) {
    $first = '';
    $second = '';
    fwrite(STDERR, "2차 비밀번호는 6자(영문 대문자 1, 소문자 1, 숫자 2, 특수문자 2)여야 해요.\n");
    exit(1);
}

$hash = password_hash($first, PASSWORD_DEFAULT);
$first = '';
$second = '';
if (!is_string($hash) || $hash === '') {
    fwrite(STDERR, "해시를 만들지 못했습니다.\n");
    exit(1);
}

fwrite(STDOUT, $hash . PHP_EOL);
