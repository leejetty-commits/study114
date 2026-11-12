<?php

declare(strict_types=1);

/**
 * 실제 EXIF Orientation=6 JPEG → 바로 서는지.
 * docker exec study114-api-dev php scripts/verify-exif-orientation6.php
 */

require dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Media\PromoImageProcessor;
use Study114\Media\PromoImageSpec;

$fail = 0;
function check(string $name, bool $ok, string $detail = ''): void
{
    global $fail;
    if ($ok) {
        echo "PASS  {$name}\n";

        return;
    }
    $fail++;
    echo "FAIL  {$name}" . ($detail !== '' ? " — {$detail}" : '') . "\n";
}

if (!function_exists('exif_read_data')) {
    echo "SKIP  exif_read_data 없음\n";
    exit(0);
}

$dir = sys_get_temp_dir() . '/study114-exif6-' . getmypid();
@mkdir($dir, 0775, true);

// 저장 픽셀: 가로. Orientation 6 + rotate(-90)이면 왼쪽 띠가 위가 된다(기존 verify-photo-exif-nocrop와 동일).
$src = $dir . '/orient6.jpg';
$im = imagecreatetruecolor(800, 400);
$bg = imagecolorallocate($im, 0, 160, 40);
$red = imagecolorallocate($im, 230, 0, 0);
imagefilledrectangle($im, 0, 0, 799, 399, $bg);
imagefilledrectangle($im, 0, 0, 24, 399, $red);
imagejpeg($im, $src, 92);
imagedestroy($im);
file_put_contents($src, jpegWithOrientation((string) file_get_contents($src), 6));

$exif = @exif_read_data($src);
$ori = (int) ($exif['Orientation'] ?? 0);
check('EXIF Orientation=6 기록', $ori === 6, 'ori=' . $ori);

$processor = new PromoImageProcessor();
$fit = $dir . '/fit.webp';
$saved = $processor->shrinkLongEdgeWebp($src, $fit, PromoImageSpec::FIT_LONG_EDGE, 82, PromoImageSpec::FIT_TARGET_BYTES);
$w = (int) ($saved['width'] ?? 0);
$h = (int) ($saved['height'] ?? 0);
$top = sample($fit, intdiv(max(1, $w), 2), 2);
check('보정 후 세로(높이>너비)', $h > $w, "{$w}x{$h}");
check('보정 후 위가 빨강', $top[0] > 180 && $top[1] < 80, implode(',', $top));

$dests = [
    'prime_1280' => $dir . '/p.webp',
    'basic_720' => $dir . '/b.webp',
];
$processor->writeVariants($src, 0.5, 0.5, $dests);
$pTop = sample($dests['prime_1280'], 640, 4);
check('prime도 위쪽 빨강 띠', $pTop[0] > 120, implode(',', $pTop));

foreach (glob($dir . '/*') ?: [] as $f) {
    @unlink($f);
}
@rmdir($dir);
exit($fail > 0 ? 1 : 0);

function jpegWithOrientation(string $jpeg, int $orientation): string
{
    if (!str_starts_with($jpeg, "\xFF\xD8")) {
        throw new RuntimeException('JPEG 아님');
    }
    $tiff = 'II' . pack('v', 42) . pack('V', 8);
    $entry = pack('v', 0x0112) . pack('v', 3) . pack('V', 1) . pack('v', $orientation) . "\x00\x00";
    $ifd = pack('v', 1) . $entry . pack('V', 0);
    $payload = "Exif\x00\x00" . $tiff . $ifd;
    $app1 = "\xFF\xE1" . pack('n', strlen($payload) + 2) . $payload;

    return "\xFF\xD8" . $app1 . substr($jpeg, 2);
}

/** @return array{0:int,1:int,2:int} */
function sample(string $path, int $x, int $y): array
{
    $im = @imagecreatefromstring((string) file_get_contents($path));
    if ($im === false) {
        return [0, 0, 0];
    }
    $rgb = imagecolorat($im, $x, $y);
    imagedestroy($im);

    return [($rgb >> 16) & 0xff, ($rgb >> 8) & 0xff, $rgb & 0xff];
}
