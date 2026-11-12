<?php

declare(strict_types=1);

require dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Media\PromoImageProcessor;

$label = $argv[1] ?? 'x';
$w = (int) ($argv[2] ?? 0);
$h = (int) ($argv[3] ?? 0);
$dir = sys_get_temp_dir() . '/peak-' . getmypid();
@mkdir($dir, 0775, true);
$src = $dir . '/src.jpg';
$im = imagecreatetruecolor($w, $h);
$bg = imagecolorallocate($im, 30, 100, 180);
imagefilledrectangle($im, 0, 0, $w - 1, $h - 1, $bg);
imagejpeg($im, $src, 90);
imagedestroy($im);

$processor = new PromoImageProcessor();
$processor->assertUploadTmp($src, (int) filesize($src));
$dests = [
    'prime_1280' => $dir . '/p.webp',
    'basic_720' => $dir . '/b.webp',
];
$processor->writeVariants($src, 0.5, 0.5, $dests);
$peak = memory_get_peak_usage(true);
echo sprintf("%s in=%dx%d peak=%d\n", $label, $w, $h, $peak);

foreach (glob($dir . '/*') ?: [] as $f) {
    @unlink($f);
}
@rmdir($dir);
