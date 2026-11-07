<?php

declare(strict_types=1);

/**
 * OAuth return_to 살균 스모크 (로컬 CLI).
 * 사용: php scripts/check-oauth-return-to.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

$cases = [
    ['/mypage/wishlist', '/mypage/wishlist'],
    ['/#/parent', '/#/parent'],
    ['https://study114.net/#/tutor', 'https://study114.net/#/tutor'],
    ['https://www.study114.net/auth/#/login', 'https://www.study114.net/auth/#/login'],
    ['https://study114.dothome.co.kr/#/guest', 'https://study114.dothome.co.kr/#/guest'],
    ['http://127.0.0.1:5174/#/home', 'http://127.0.0.1:5174/#/home'],
    ['http://localhost:5174/#/home', 'http://localhost:5174/#/home'],
    // rejects
    ['https://study114.net.evil.com/#/x', ''],
    ['https://evil.com/?next=https://study114.net', ''],
    ['//evil.com/phish', ''],
    ['https://evil.com', ''],
    ['javascript:alert(1)', ''],
    ['https://user@study114.net/', ''],
    ['/\\evil.com', ''],
    ['', ''],
];

$failed = 0;
foreach ($cases as [$in, $want]) {
    $got = study114_sanitize_oauth_return_to($in);
    if ($got !== $want) {
        fwrite(STDERR, "FAIL in=" . var_export($in, true) . " want=" . var_export($want, true) . " got=" . var_export($got, true) . PHP_EOL);
        $failed++;
    }
}

if ($failed > 0) {
    fwrite(STDERR, "failed={$failed}\n");
    exit(1);
}

echo "ok cases=" . count($cases) . PHP_EOL;
