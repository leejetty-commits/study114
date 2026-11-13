<?php

declare(strict_types=1);

/**
 * 케이스마다 별도 PHP 프로세스로 peak 메모리 측정.
 * docker exec study114-api-dev php scripts/verify-promo-peak-isolated.php
 */

$root = dirname(__DIR__);
$cases = [
    '4000x3000' => [4000, 3000],
    '2560x2048' => [2560, 2048],
    '663x380' => [663, 380],
    '1200x800' => [1200, 800],
];

$fail = 0;
$report = [];
foreach ($cases as $label => [$w, $h]) {
    $cmd = [
        PHP_BINARY,
        $root . '/scripts/_promo-peak-worker.php',
        $label,
        (string) $w,
        (string) $h,
    ];
    $desc = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
    $proc = proc_open($cmd, $desc, $pipes, $root);
    if (!is_resource($proc)) {
        echo "FAIL  {$label} proc_open\n";
        $fail++;
        continue;
    }
    $out = stream_get_contents($pipes[1]);
    $err = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $code = proc_close($proc);
    $line = trim((string) $out);
    echo ($code === 0 ? 'PASS' : 'FAIL') . "  {$line}\n";
    if ($err) {
        echo "  stderr: " . trim($err) . "\n";
    }
    if ($code !== 0) {
        $fail++;
    }
    $report[] = $line;
}

$outFile = $root . '/docs/worklog/2026/11/shots-368/368-peak-isolated.txt';
@mkdir(dirname($outFile), 0775, true);
file_put_contents($outFile, implode("\n", $report) . "\n");
echo "REPORT {$outFile}\n";
exit($fail > 0 ? 1 : 0);
